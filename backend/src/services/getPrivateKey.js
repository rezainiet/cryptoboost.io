const dotenv = require("dotenv");

const { ethers } = require("ethers");
dotenv.config();
const MNEMONIC = (process.env.MNEMONIC || "").trim().replace(/"/g, "");

if (!MNEMONIC) {
    throw new Error("MNEMONIC not set in .env file");
}

const index = 11; // তুমি যেটা পেয়েছো

// ETH standard BIP44 path
const path = `m/44'/60'/0'/0/${index}`;

// derive wallet
const wallet = ethers.HDNodeWallet.fromPhrase(MNEMONIC, undefined, path);

console.log("🔑 Address:", wallet.address);
console.log("🧾 Derivation Path:", path);
console.log("🔐 Private Key:", wallet.privateKey);
