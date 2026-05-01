// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/// @title Decentralised Freelance Platform
/// @author CS218 Project Team
/// @notice Escrow-backed marketplace for hirers and freelancers with reputation and fraud-audit signals.
/// @dev Human-readable service content and deliverables must stay off-chain. Store IPFS CIDs/hashes only.
contract DecentralisedFreelance is ReentrancyGuard {
    uint64 private constant MAX_DEADLINE_SPAN = 30 days;
    uint64 private constant AUTO_CANCEL_WINDOW = 7 days;
    uint8 private constant MIN_RATING = 1;
    uint8 private constant MAX_RATING = 5;
    uint8 private constant FLAG_THRESHOLD = 60;

    enum ServiceStatus {
        None,
        Listed,
        Removed
    }

    enum JobStatus {
        None,
        Hired,
        Submitted,
        Completed,
        Cancelled
    }

    struct Service {
        uint256 id;
        address freelancer;
        uint96 priceWei;
        uint64 createdAt;
        uint32 averageRatingX100;
        uint32 ratingsCount;
        ServiceStatus status;
        string metadataCid;
    }

    struct Job {
        uint256 id;
        uint256 serviceId;
        address client;
        address freelancer;
        uint96 priceWei;
        uint64 hiredAt;
        uint64 deadline;
        uint64 submittedAt;
        uint64 completedAt;
        JobStatus status;
        bool rated;
        bytes32 deliverableHash;
    }

    struct ClientAudit {
        uint32 openedJobs;
        uint32 activeJobs;
        uint32 completedJobs;
        uint32 cancelledJobs;
        uint32 autoCancelledJobs;
        uint128 totalEscrowedWei;
        uint128 totalPaidWei;
        uint128 totalRefundedWei;
        uint8 riskScore;
        bool flagged;
    }

    struct ClientStats {
        uint32 openedJobs;
        uint32 activeJobs;
        uint32 completedJobs;
        uint32 cancelledJobs;
        uint32 autoCancelledJobs;
        uint128 totalEscrowedWei;
        uint128 totalPaidWei;
        uint128 totalRefundedWei;
    }

    struct FreelancerReputation {
        uint32 completedJobs;
        uint32 ratedJobs;
        uint256 ratingTotal;
    }

    uint256 private _serviceCount;
    uint256 private _jobCount;

    mapping(uint256 => Service) private _services;
    mapping(uint256 => Job) private _jobs;
    mapping(address => uint256[]) private _freelancerServiceIds;
    mapping(address => uint256[]) private _clientJobIds;
    mapping(address => uint256[]) private _freelancerJobIds;
    mapping(address => ClientStats) private _clientStats;
    mapping(address => FreelancerReputation) private _freelancerReputations;
    mapping(uint256 => uint256) private _serviceRatingTotals;

    event ServiceOffered(
        uint256 indexed serviceId,
        address indexed freelancer,
        uint96 priceWei,
        string metadataCid
    );
    event ServiceRemoved(uint256 indexed serviceId, address indexed freelancer);
    event JobCreated(
        uint256 indexed jobId,
        uint256 indexed serviceId,
        address indexed client,
        address freelancer,
        uint96 priceWei,
        uint64 deadline
    );
    event WorkSubmitted(uint256 indexed jobId, address indexed freelancer, bytes32 deliverableHash);
    event JobCompleted(uint256 indexed jobId, address indexed client, address indexed freelancer, uint96 paidWei);
    event FreelancerRated(uint256 indexed jobId, address indexed freelancer, uint8 score);
    event JobCancelled(uint256 indexed jobId, address indexed client, uint96 refundedWei, bool autoCancelled);

    modifier validService(uint256 serviceId) {
        require(serviceId != 0 && serviceId <= _serviceCount, "Service not found");
        _;
    }

    modifier validJob(uint256 jobId) {
        require(jobId != 0 && jobId <= _jobCount, "Job not found");
        _;
    }

    /// @notice Returns how many services have ever been created.
    /// @return count Total number of service records.
    function serviceCount() external view returns (uint256 count) {
        return _serviceCount;
    }

    /// @notice Returns how many jobs have ever been opened.
    /// @return count Total number of job records.
    function jobCount() external view returns (uint256 count) {
        return _jobCount;
    }

    /// @notice Lists a freelancer service using only an IPFS metadata CID on-chain.
    /// @param priceWei Exact price that a hirer must escrow when hiring.
    /// @param metadataCid IPFS CID for off-chain service metadata.
    /// @return serviceId Newly created service id.
    function offerService(uint96 priceWei, string calldata metadataCid) external returns (uint256 serviceId) {
        require(msg.sender != address(0), "Invalid freelancer");
        require(priceWei > 0, "Price must be positive");
        _validateCid(metadataCid);

        serviceId = ++_serviceCount;
        _services[serviceId] = Service({
            id: serviceId,
            freelancer: msg.sender,
            priceWei: priceWei,
            createdAt: uint64(block.timestamp),
            averageRatingX100: 0,
            ratingsCount: 0,
            status: ServiceStatus.Listed,
            metadataCid: metadataCid
        });
        _freelancerServiceIds[msg.sender].push(serviceId);

        emit ServiceOffered(serviceId, msg.sender, priceWei, metadataCid);
    }

    /// @notice Removes a listed service so it can no longer be hired.
    /// @param serviceId Service id to remove.
    function removeService(uint256 serviceId) external validService(serviceId) {
        Service storage service = _services[serviceId];
        require(msg.sender == service.freelancer, "Only freelancer");
        require(service.status == ServiceStatus.Listed, "Service not listed");

        service.status = ServiceStatus.Removed;
        emit ServiceRemoved(serviceId, msg.sender);
    }

    /// @notice Hires a listed freelancer service and locks the exact service price in escrow.
    /// @param serviceId Listed service id.
    /// @param deadlineTimestamp Unix timestamp by which the freelancer should submit work.
    /// @return jobId Newly created escrowed job id.
    function hireFreelancer(
        uint256 serviceId,
        uint64 deadlineTimestamp
    ) external payable nonReentrant validService(serviceId) returns (uint256 jobId) {
        Service storage service = _services[serviceId];
        require(service.status == ServiceStatus.Listed, "Service not listed");
        require(msg.sender != service.freelancer, "Cannot self-hire");
        require(deadlineTimestamp > block.timestamp, "Deadline must be future");
        require(deadlineTimestamp <= block.timestamp + MAX_DEADLINE_SPAN, "Deadline too far");
        require(msg.value == service.priceWei, "Exact price required");

        jobId = ++_jobCount;
        _jobs[jobId] = Job({
            id: jobId,
            serviceId: serviceId,
            client: msg.sender,
            freelancer: service.freelancer,
            priceWei: service.priceWei,
            hiredAt: uint64(block.timestamp),
            deadline: deadlineTimestamp,
            submittedAt: 0,
            completedAt: 0,
            status: JobStatus.Hired,
            rated: false,
            deliverableHash: bytes32(0)
        });

        _clientJobIds[msg.sender].push(jobId);
        _freelancerJobIds[service.freelancer].push(jobId);

        ClientStats storage stats = _clientStats[msg.sender];
        stats.openedJobs += 1;
        stats.activeJobs += 1;
        stats.totalEscrowedWei += uint128(service.priceWei);

        emit JobCreated(jobId, serviceId, msg.sender, service.freelancer, service.priceWei, deadlineTimestamp);
    }

    /// @notice Records that the freelancer submitted off-chain work by committing its hash on-chain.
    /// @param jobId Job id assigned during hiring.
    /// @param deliverableHash Hash of the off-chain deliverable CID or encrypted bundle.
    function submitWork(uint256 jobId, bytes32 deliverableHash) external validJob(jobId) {
        Job storage job = _jobs[jobId];
        require(msg.sender == job.freelancer, "Only freelancer");
        require(job.status == JobStatus.Hired, "Job not awaiting work");
        require(block.timestamp <= job.deadline, "Deadline expired");
        require(deliverableHash != bytes32(0), "Deliverable hash required");

        job.status = JobStatus.Submitted;
        job.submittedAt = uint64(block.timestamp);
        job.deliverableHash = deliverableHash;

        emit WorkSubmitted(jobId, msg.sender, deliverableHash);
    }

    /// @notice Confirms completion and releases escrowed ETH to the freelancer.
    /// @param jobId Job id to complete.
    function confirmCompletion(uint256 jobId) external nonReentrant validJob(jobId) {
        Job storage job = _jobs[jobId];
        require(msg.sender == job.client, "Only client");
        require(job.status == JobStatus.Hired || job.status == JobStatus.Submitted, "Job not completable");

        job.status = JobStatus.Completed;
        job.completedAt = uint64(block.timestamp);

        ClientStats storage stats = _clientStats[job.client];
        _closeActiveJob(stats);
        stats.completedJobs += 1;
        stats.totalPaidWei += uint128(job.priceWei);

        _freelancerReputations[job.freelancer].completedJobs += 1;

        uint96 amount = job.priceWei;
        emit JobCompleted(jobId, job.client, job.freelancer, amount);

        (bool sent, ) = job.freelancer.call{value: amount}("");
        require(sent, "Payment failed");
    }

    /// @notice Rates a freelancer after completion. Each completed job can be rated once.
    /// @param jobId Completed job id.
    /// @param score Rating from 1 to 5.
    function rateFreelancer(uint256 jobId, uint8 score) external validJob(jobId) {
        require(score >= MIN_RATING && score <= MAX_RATING, "Invalid rating");

        Job storage job = _jobs[jobId];
        require(msg.sender == job.client, "Only client");
        require(job.status == JobStatus.Completed, "Job not completed");
        require(!job.rated, "Job already rated");

        job.rated = true;

        FreelancerReputation storage reputation = _freelancerReputations[job.freelancer];
        reputation.ratedJobs += 1;
        reputation.ratingTotal += score;

        Service storage service = _services[job.serviceId];
        _serviceRatingTotals[job.serviceId] += score;
        service.ratingsCount += 1;
        service.averageRatingX100 = uint32((_serviceRatingTotals[job.serviceId] * 100) / service.ratingsCount);

        emit FreelancerRated(jobId, job.freelancer, score);
    }

    /// @notice Cancels an unsubmitted job before its deadline and refunds the client.
    /// @param jobId Job id to cancel.
    function cancelJob(uint256 jobId) external nonReentrant validJob(jobId) {
        Job storage job = _jobs[jobId];
        require(msg.sender == job.client || msg.sender == job.freelancer, "Only job party");
        require(job.status == JobStatus.Hired, "Only unsubmitted jobs");
        require(block.timestamp <= job.deadline, "Deadline passed");

        _refundClient(job, false);
    }

    /// @notice Auto-cancels a no-action job seven days after its deadline and refunds the client.
    /// @param jobId Job id to auto-cancel.
    function autoCancelExpired(uint256 jobId) external nonReentrant validJob(jobId) {
        Job storage job = _jobs[jobId];
        require(job.status == JobStatus.Hired, "Only no-action jobs");
        require(block.timestamp > uint256(job.deadline) + AUTO_CANCEL_WINDOW, "Auto-cancel unavailable");

        _refundClient(job, true);
    }

    /// @notice Reads one service by id.
    /// @param serviceId Service id.
    /// @return service Stored service record.
    function getService(uint256 serviceId) external view validService(serviceId) returns (Service memory service) {
        return _services[serviceId];
    }

    /// @notice Reads one job by id.
    /// @param jobId Job id.
    /// @return job Stored job record.
    function getJob(uint256 jobId) external view validJob(jobId) returns (Job memory job) {
        return _jobs[jobId];
    }

    /// @notice Returns all services that are currently listed.
    /// @return activeServices Listed service records.
    function getActiveServices() external view returns (Service[] memory activeServices) {
        uint256 activeCount;
        for (uint256 serviceId = 1; serviceId <= _serviceCount; ) {
            if (_services[serviceId].status == ServiceStatus.Listed) {
                activeCount += 1;
            }
            unchecked {
                serviceId += 1;
            }
        }

        activeServices = new Service[](activeCount);
        uint256 cursor;
        for (uint256 serviceId = 1; serviceId <= _serviceCount; ) {
            if (_services[serviceId].status == ServiceStatus.Listed) {
                activeServices[cursor] = _services[serviceId];
                cursor += 1;
            }
            unchecked {
                serviceId += 1;
            }
        }
    }

    /// @notice Returns all services ever listed by a freelancer.
    /// @param freelancer Wallet address to inspect.
    /// @return services Service records for the freelancer.
    function getServicesByFreelancer(address freelancer) external view returns (Service[] memory services) {
        require(freelancer != address(0), "Invalid freelancer");
        uint256[] storage ids = _freelancerServiceIds[freelancer];
        services = new Service[](ids.length);
        for (uint256 index; index < ids.length; ) {
            services[index] = _services[ids[index]];
            unchecked {
                index += 1;
            }
        }
    }

    /// @notice Returns jobs opened by a client.
    /// @param client Wallet address to inspect.
    /// @return jobs Job records for the client.
    function getJobsForClient(address client) external view returns (Job[] memory jobs) {
        require(client != address(0), "Invalid client");
        uint256[] storage ids = _clientJobIds[client];
        jobs = new Job[](ids.length);
        for (uint256 index; index < ids.length; ) {
            jobs[index] = _jobs[ids[index]];
            unchecked {
                index += 1;
            }
        }
    }

    /// @notice Returns jobs assigned to a freelancer.
    /// @param freelancer Wallet address to inspect.
    /// @return jobs Job records for the freelancer.
    function getJobsForFreelancer(address freelancer) external view returns (Job[] memory jobs) {
        require(freelancer != address(0), "Invalid freelancer");
        uint256[] storage ids = _freelancerJobIds[freelancer];
        jobs = new Job[](ids.length);
        for (uint256 index; index < ids.length; ) {
            jobs[index] = _jobs[ids[index]];
            unchecked {
                index += 1;
            }
        }
    }

    /// @notice Returns a freelancer's average rating and completed job count.
    /// @param freelancer Wallet address to inspect.
    /// @return averageScoreX100 Average score multiplied by 100, or zero when unrated.
    /// @return totalJobs Total completed jobs for this freelancer.
    function getReputation(
        address freelancer
    ) public view returns (uint256 averageScoreX100, uint256 totalJobs) {
        require(freelancer != address(0), "Invalid freelancer");
        FreelancerReputation storage reputation = _freelancerReputations[freelancer];
        totalJobs = reputation.completedJobs;
        if (reputation.ratedJobs == 0) {
            return (0, totalJobs);
        }
        averageScoreX100 = (reputation.ratingTotal * 100) / reputation.ratedJobs;
    }

    /// @notice Builds an on-chain audit signal for a client wallet.
    /// @param client Wallet address to audit.
    /// @return audit Client history, escrow totals, risk score, and flag.
    function auditClient(address client) external view returns (ClientAudit memory audit) {
        require(client != address(0), "Invalid client");
        ClientStats memory stats = _clientStats[client];
        uint8 riskScore = _riskScore(stats);
        return
            ClientAudit({
                openedJobs: stats.openedJobs,
                activeJobs: stats.activeJobs,
                completedJobs: stats.completedJobs,
                cancelledJobs: stats.cancelledJobs,
                autoCancelledJobs: stats.autoCancelledJobs,
                totalEscrowedWei: stats.totalEscrowedWei,
                totalPaidWei: stats.totalPaidWei,
                totalRefundedWei: stats.totalRefundedWei,
                riskScore: riskScore,
                flagged: stats.openedJobs >= 3 && riskScore >= FLAG_THRESHOLD
            });
    }

    function _validateCid(string calldata cid) private pure {
        uint256 length = bytes(cid).length;
        require(length > 0, "CID required");
        require(length <= 90, "CID too long");
    }

    function _refundClient(Job storage job, bool autoCancelled) private {
        job.status = JobStatus.Cancelled;

        ClientStats storage stats = _clientStats[job.client];
        _closeActiveJob(stats);
        if (autoCancelled) {
            stats.autoCancelledJobs += 1;
        } else {
            stats.cancelledJobs += 1;
        }
        stats.totalRefundedWei += uint128(job.priceWei);

        uint96 amount = job.priceWei;
        emit JobCancelled(job.id, job.client, amount, autoCancelled);

        (bool sent, ) = job.client.call{value: amount}("");
        require(sent, "Refund failed");
    }

    function _closeActiveJob(ClientStats storage stats) private {
        require(stats.activeJobs > 0, "No active job");
        unchecked {
            stats.activeJobs -= 1;
        }
    }

    function _riskScore(ClientStats memory stats) private pure returns (uint8) {
        if (stats.openedJobs == 0) {
            return 0;
        }

        uint256 failedJobs = uint256(stats.cancelledJobs) + stats.autoCancelledJobs;
        uint256 score = (failedJobs * 100) / stats.openedJobs;
        if (stats.autoCancelledJobs > 0) {
            score += 10;
        }
        if (stats.openedJobs >= 3 && stats.completedJobs == 0) {
            score = 100;
        }
        if (score > 100) {
            score = 100;
        }
        return uint8(score);
    }
}
