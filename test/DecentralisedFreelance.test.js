const { expect } = require("chai");
const { ethers } = require("hardhat");
const { loadFixture, time } = require("@nomicfoundation/hardhat-toolbox/network-helpers");

const SERVICE_CID = "ipfs://bafybeigdyrztq5examplemetadatacid";
const PRICE = ethers.parseEther("1");
const DAY = 24 * 60 * 60;

describe("DecentralisedFreelance", function () {
  async function deployFixture() {
    const [owner, client, freelancer, other] = await ethers.getSigners();
    const Platform = await ethers.getContractFactory("DecentralisedFreelance");
    const platform = await Platform.deploy();
    await platform.waitForDeployment();
    return { platform, owner, client, freelancer, other };
  }

  async function listedServiceFixture() {
    const context = await deployFixture();
    await context.platform.connect(context.freelancer).offerService(PRICE, SERVICE_CID);
    return context;
  }

  async function hiredJobFixture() {
    const context = await listedServiceFixture();
    const deadline = (await time.latest()) + 7 * DAY;
    await context.platform
      .connect(context.client)
      .hireFreelancer(1, deadline, { value: PRICE });
    return { ...context, deadline };
  }

  async function completedJobFixture() {
    const context = await hiredJobFixture();
    const deliverableHash = ethers.keccak256(ethers.toUtf8Bytes("ipfs://deliverable"));
    await context.platform.connect(context.freelancer).submitWork(1, deliverableHash);
    await context.platform.connect(context.client).confirmCompletion(1);
    return { ...context, deliverableHash };
  }

  it("lists services with only CID-backed metadata on-chain", async function () {
    const { platform, freelancer } = await deployFixture();

    await expect(platform.connect(freelancer).offerService(PRICE, SERVICE_CID))
      .to.emit(platform, "ServiceOffered")
      .withArgs(1, freelancer.address, PRICE, SERVICE_CID);

    const service = await platform.getService(1);
    expect(service.freelancer).to.equal(freelancer.address);
    expect(service.priceWei).to.equal(PRICE);
    expect(service.metadataCid).to.equal(SERVICE_CID);
    expect(service.status).to.equal(1);

    const services = await platform.getActiveServices();
    expect(services).to.have.lengthOf(1);
    expect(await platform.serviceCount()).to.equal(1);
  });

  it("hires with exact escrow, submits work, confirms payment, and rates once", async function () {
    const { platform, client, freelancer } = await hiredJobFixture();
    const deliverableHash = ethers.keccak256(ethers.toUtf8Bytes("ipfs://deliverable"));

    await expect(platform.connect(freelancer).submitWork(1, deliverableHash))
      .to.emit(platform, "WorkSubmitted")
      .withArgs(1, freelancer.address, deliverableHash);

    const platformAddress = await platform.getAddress();
    const platformBalanceBefore = await ethers.provider.getBalance(platformAddress);
    const freelancerBalanceBefore = await ethers.provider.getBalance(freelancer.address);

    await expect(platform.connect(client).confirmCompletion(1))
      .to.emit(platform, "JobCompleted")
      .withArgs(1, client.address, freelancer.address, PRICE);

    expect(await ethers.provider.getBalance(platformAddress)).to.equal(platformBalanceBefore - PRICE);
    expect(await ethers.provider.getBalance(freelancer.address)).to.equal(freelancerBalanceBefore + PRICE);

    await expect(platform.connect(client).rateFreelancer(1, 5))
      .to.emit(platform, "FreelancerRated")
      .withArgs(1, freelancer.address, 5);

    const reputation = await platform.getReputation(freelancer.address);
    expect(reputation.averageScoreX100).to.equal(500);
    expect(reputation.totalJobs).to.equal(1);

    const service = await platform.getService(1);
    expect(service.averageRatingX100).to.equal(500);
    expect(service.ratingsCount).to.equal(1);

    await expect(platform.connect(client).rateFreelancer(1, 5)).to.be.revertedWith("Job already rated");
  });

  it("enforces access control and invalid input checks", async function () {
    const { platform, client, freelancer, other } = await listedServiceFixture();
    const pastDeadline = (await time.latest()) - 1;
    const futureDeadline = (await time.latest()) + 3 * DAY;

    await expect(platform.connect(freelancer).offerService(0, SERVICE_CID)).to.be.revertedWith(
      "Price must be positive"
    );
    await expect(platform.connect(freelancer).offerService(PRICE, "")).to.be.revertedWith("CID required");
    await expect(
      platform.connect(client).hireFreelancer(1, futureDeadline, { value: PRICE - 1n })
    ).to.be.revertedWith("Exact price required");
    await expect(
      platform.connect(client).hireFreelancer(1, pastDeadline, { value: PRICE })
    ).to.be.revertedWith("Deadline must be future");
    await expect(
      platform.connect(freelancer).hireFreelancer(1, futureDeadline, { value: PRICE })
    ).to.be.revertedWith("Cannot self-hire");

    await platform.connect(client).hireFreelancer(1, futureDeadline, { value: PRICE });

    await expect(platform.connect(freelancer).confirmCompletion(1)).to.be.revertedWith("Only client");
    await expect(platform.connect(other).cancelJob(1)).to.be.revertedWith("Only job party");
    await expect(
      platform.connect(other).submitWork(1, ethers.keccak256(ethers.toUtf8Bytes("work")))
    ).to.be.revertedWith("Only freelancer");
  });

  it("rejects hiring a removed service", async function () {
    const { platform, client, freelancer } = await listedServiceFixture();
    const deadline = (await time.latest()) + DAY;

    await expect(platform.connect(freelancer).removeService(1))
      .to.emit(platform, "ServiceRemoved")
      .withArgs(1, freelancer.address);

    await expect(platform.connect(client).hireFreelancer(1, deadline, { value: PRICE })).to.be.revertedWith(
      "Service not listed"
    );
  });

  it("cancels unsubmitted jobs before deadline and updates client audit data", async function () {
    const { platform, client, freelancer } = await hiredJobFixture();

    const platformAddress = await platform.getAddress();
    const platformBalanceBefore = await ethers.provider.getBalance(platformAddress);
    const clientBalanceBefore = await ethers.provider.getBalance(client.address);

    await expect(platform.connect(freelancer).cancelJob(1))
      .to.emit(platform, "JobCancelled")
      .withArgs(1, client.address, PRICE, false);

    expect(await ethers.provider.getBalance(platformAddress)).to.equal(platformBalanceBefore - PRICE);
    expect(await ethers.provider.getBalance(client.address)).to.equal(clientBalanceBefore + PRICE);

    const job = await platform.getJob(1);
    expect(job.status).to.equal(4);

    const audit = await platform.auditClient(client.address);
    expect(audit.openedJobs).to.equal(1);
    expect(audit.completedJobs).to.equal(0);
    expect(audit.cancelledJobs).to.equal(1);
    expect(audit.totalRefundedWei).to.equal(PRICE);
    expect(audit.riskScore).to.equal(100);
    expect(audit.flagged).to.equal(false);
  });

  it("auto-cancels no-action jobs seven days after the deadline", async function () {
    const { platform, client, deadline } = await hiredJobFixture();

    await time.increaseTo(deadline + 7 * DAY + 1);

    await expect(platform.connect(client).autoCancelExpired(1))
      .to.emit(platform, "JobCancelled")
      .withArgs(1, client.address, PRICE, true);

    const audit = await platform.auditClient(client.address);
    expect(audit.autoCancelledJobs).to.equal(1);
    expect(audit.riskScore).to.equal(100);
  });

  it("prevents invalid deliverables, cancellations after submission, and invalid ratings", async function () {
    const { platform, client, freelancer } = await hiredJobFixture();

    await expect(platform.connect(freelancer).submitWork(1, ethers.ZeroHash)).to.be.revertedWith(
      "Deliverable hash required"
    );

    const deliverableHash = ethers.keccak256(ethers.toUtf8Bytes("ipfs://deliverable"));
    await platform.connect(freelancer).submitWork(1, deliverableHash);

    await expect(platform.connect(client).cancelJob(1)).to.be.revertedWith("Only unsubmitted jobs");
    await platform.connect(client).confirmCompletion(1);

    await expect(platform.connect(client).rateFreelancer(1, 0)).to.be.revertedWith("Invalid rating");
    await expect(platform.connect(freelancer).rateFreelancer(1, 5)).to.be.revertedWith("Only client");
  });

  it("flags repeat clients with unresolved cancellation patterns", async function () {
    const { platform, client, freelancer } = await deployFixture();

    for (let i = 0; i < 3; i += 1) {
      await platform.connect(freelancer).offerService(PRICE, `${SERVICE_CID}-${i}`);
      const deadline = (await time.latest()) + DAY;
      await platform.connect(client).hireFreelancer(i + 1, deadline, { value: PRICE });
      await platform.connect(freelancer).cancelJob(i + 1);
    }

    const audit = await platform.auditClient(client.address);
    expect(audit.openedJobs).to.equal(3);
    expect(audit.cancelledJobs).to.equal(3);
    expect(audit.flagged).to.equal(true);
  });

  it("returns empty arrays when no blockchain data exists", async function () {
    const { platform, client, freelancer } = await deployFixture();

    expect(await platform.getActiveServices()).to.have.lengthOf(0);
    expect(await platform.getServicesByFreelancer(freelancer.address)).to.have.lengthOf(0);
    expect(await platform.getJobsForClient(client.address)).to.have.lengthOf(0);
    expect(await platform.getJobsForFreelancer(freelancer.address)).to.have.lengthOf(0);

    const audit = await platform.auditClient(client.address);
    expect(audit.openedJobs).to.equal(0);
    expect(audit.flagged).to.equal(false);
  });
});
