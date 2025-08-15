// services/hdWallet.js
// HD wallet address derivation for BTC, ETH, TRX from a single mnemonic.
// SECURITY: In production, keep MNEMONIC in a secure secrets manager.

const bip39 = require("bip39");
const ecc = require("tiny-secp256k1");
const BIP32Factory = require("bip32").default || require("bip32");
const bip32 = BIP32Factory(ecc);

const bitcoin = require("bitcoinjs-lib");
const { ethers } = require("ethers");
const { TronWeb } = require("tronweb"); // require normally

// Load and clean mnemonic from .env
const MNEMONIC = (process.env.MNEMONIC || "").trim().replace(/"/g, "");

if (!MNEMONIC) throw new Error("MNEMONIC not set in .env");

if (!bip39.validateMnemonic(MNEMONIC)) {
    const words = MNEMONIC.split(/\s+/);
    const wordlist = bip39.wordlists.english;
    const invalidWords = words.filter(w => !wordlist.includes(w));
    if (invalidWords.length > 0) {
        throw new Error(`Invalid MNEMONIC — check spelling: ${invalidWords.join(", ")}`);
    } else {
        throw new Error("Invalid MNEMONIC — check word order/formatting");
    }
}

let rootNode = null;
function getRootNode() {
    if (!rootNode) {
        const seed = bip39.mnemonicToSeedSync(MNEMONIC);
        rootNode = bip32.fromSeed(seed);
    }
    return rootNode;
}

// BTC: BIP84 (native segwit) m/84'/0'/0'/0/index
function deriveBTCAddress(index = 0) {
    const network = bitcoin.networks.bitcoin;
    const path = `m/84'/0'/0'/0/${index}`;
    const node = getRootNode().derivePath(path);

    const pubkey = Buffer.isBuffer(node.publicKey) ? node.publicKey : Buffer.from(node.publicKey);
    const { address } = bitcoin.payments.p2wpkh({ pubkey, network });
    return { address, path };
}

// ETH: BIP44 m/44'/60'/0'/0/index
function deriveETHAddress(index = 0) {
    const path = `m/44'/60'/0'/0/${index}`;
    const wallet = ethers.HDNodeWallet.fromPhrase(MNEMONIC, undefined, path);
    return { address: wallet.address, path };
}

// TRX: BIP44 m/44'/195'/0'/0/index (secp256k1)
function deriveTRXAddress(index = 0) {
    const path = `m/44'/195'/0'/0/${index}`;
    console.log(index)
    const node = getRootNode().derivePath(path);
    const privKeyBuffer = node.privateKey;

    if (!privKeyBuffer) {
        throw new Error("TRX private key derivation failed");
    }
    const privKeyHex = Buffer.from(privKeyBuffer).toString("hex");
    const tronWeb = new TronWeb({ fullHost: "https://api.trongrid.io" });
    const address = tronWeb.address.fromPrivateKey(privKeyHex);
    return { address, path };
};

function deriveAddressByNetwork(network, index) {
    // console.log("hdwallet network", index, network)
    switch (network.toUpperCase()) {
        case "BTC":
            return deriveBTCAddress(index);
        case "ETH":
            return deriveETHAddress(index);
        case "TRX":
        case "TRC":
            return deriveTRXAddress(index);
        default:
            throw new Error(`Unsupported network: ${network}`);
    }
}

module.exports = {
    deriveBTCAddress,
    deriveETHAddress,
    deriveTRXAddress,
    deriveAddressByNetwork,
};
