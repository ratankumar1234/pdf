const fs = require("fs");
const path = require("path");

const artifactPath = path.join(
  __dirname,
  "..",
  "artifacts",
  "contracts",
  "DecentralisedFreelance.sol",
  "DecentralisedFreelance.json"
);
const outputDir = path.join(__dirname, "..", "lib", "contract");
const outputPath = path.join(outputDir, "DecentralisedFreelance.json");

if (!fs.existsSync(artifactPath)) {
  throw new Error("Compile the contract before exporting its ABI.");
}

const artifact = JSON.parse(fs.readFileSync(artifactPath, "utf8"));
fs.mkdirSync(outputDir, { recursive: true });
fs.writeFileSync(
  outputPath,
  JSON.stringify({ contractName: artifact.contractName, abi: artifact.abi }, null, 2)
);

console.log(`ABI exported to ${outputPath}`);
