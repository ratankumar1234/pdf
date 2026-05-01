const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const targets = [".next", "cache"];

for (const target of targets) {
  const fullPath = path.join(root, target);
  if (fs.existsSync(fullPath)) {
    fs.rmSync(fullPath, { recursive: true, force: true });
    console.log(`Removed ${target}`);
  }
}

console.log("Clean complete.");
