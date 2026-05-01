const { HDNodeWallet } = require("ethers");

const mnemonic = "test test test test test test test test test test test junk";
const balance = "10000 ETH";

console.log("Hardhat local demo accounts");
console.log("===========================");
console.log("");
console.log(`Mnemonic: ${mnemonic}`);
console.log("");

for (let index = 0; index < 20; index += 1) {
  const wallet = HDNodeWallet.fromPhrase(mnemonic, undefined, `m/44'/60'/0'/0/${index}`);
  console.log(`Account #${index}: ${wallet.address} (${balance})`);
  console.log(`Private Key: ${wallet.privateKey}`);
  console.log("");
}
