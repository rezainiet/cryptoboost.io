// checkEthAddress.js

const { deriveETHAddress } = require("./hdWallet");

require("dotenv").config(); // .env থেকে MNEMONIC লোড করতে
const index = 9;

const result = deriveETHAddress(index);
console.log(`ETH Address at index ${index}: ${result.address}`);
console.log(`Derivation Path: ${result.path}`);
