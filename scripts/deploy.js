const fs = require("fs");
const path = require("path");
const hre = require("hardhat");

async function main() {
  const Platform = await hre.ethers.getContractFactory("DecentralisedFreelance");
  const platform = await Platform.deploy();
  await platform.waitForDeployment();

  const address = await platform.getAddress();
  const network = await hre.ethers.provider.getNetwork();
  const chainId = network.chainId.toString();

  const deploymentPath = path.join(__dirname, "..", "lib", "deployment.json");
  let deployments = {};
  if (fs.existsSync(deploymentPath)) {
    deployments = JSON.parse(fs.readFileSync(deploymentPath, "utf8"));
  }

  deployments[chainId] = {
    address,
    deployedAt: new Date().toISOString()
  };

  fs.mkdirSync(path.dirname(deploymentPath), { recursive: true });
  fs.writeFileSync(deploymentPath, JSON.stringify(deployments, null, 2));

  await hre.run("compile");
  require("./export-abi");

  console.log(`DecentralisedFreelance deployed to ${address} on chain ${chainId}`);
  console.log(`Deployment saved to ${deploymentPath}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
