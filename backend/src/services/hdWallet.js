// services/hdWallet.js
const bip39 = require("bip39");
const ecc = require("tiny-secp256k1");
const BIP32Factory = require("bip32").default;
const bitcoin = require("bitcoinjs-lib");
const { ethers } = require("ethers");
const { TronWeb } = require("tronweb");
const { Keypair } = require('@solana/web3.js');
const nacl = require('tweetnacl');

const MNEMONIC = (process.env.MNEMONIC || "").trim();
if (!bip39.validateMnemonic(MNEMONIC)) {
    throw new Error("Invalid MNEMONIC in .env");
}

const bip32 = BIP32Factory(ecc);
let rootNode = null;

function getRootNode() {
    if (!rootNode) {
        const seed = bip39.mnemonicToSeedSync(MNEMONIC);
        rootNode = bip32.fromSeed(seed);
    }
    return rootNode;
}

// Fixed BTC Address Derivation
function deriveBTCAddress(index = 0) {
    const network = bitcoin.networks.bitcoin;
    const path = `m/84'/0'/0'/0/${index}`;
    const node = getRootNode().derivePath(path);

    const pubkey = Buffer.isBuffer(node.publicKey) ? node.publicKey : Buffer.from(node.publicKey);
    const { address } = bitcoin.payments.p2wpkh({ pubkey, network });
    return { address, path };
}

// Fixed SOL Address Derivation
function deriveSOLAddress(index = 0) {
    const seed = bip39.mnemonicToSeedSync(MNEMONIC);
    const derivedSeed = nacl.sign.keyPair.fromSeed(
        seed.slice(0, nacl.sign.seedLength)
    ).secretKey;

    const keypair = Keypair.fromSecretKey(derivedSeed);

    return {
        address: keypair.publicKey.toString(),
        path: `m/44'/501'/${index}'`, // Solana standard path
        privateKey: Buffer.from(keypair.secretKey).toString('hex')
    };
}

// Ethereum Address Derivation
function deriveETHAddress(index = 0) {
    const path = `m/44'/60'/0'/0/${index}`;
    const wallet = ethers.HDNodeWallet.fromPhrase(MNEMONIC, undefined, path);
    return {
        address: wallet.address,
        path,
        privateKey: wallet.privateKey
    };
}

// Tron Address Derivation
function deriveTRXAddress(index = 0) {
    const path = `m/44'/195'/0'/0/${index}`;
    const node = getRootNode().derivePath(path);
    const privKeyHex = node.privateKey.toString("hex");
    const tronWeb = new TronWeb({ fullHost: "https://api.trongrid.io" });
    const address = tronWeb.address.fromPrivateKey(privKeyHex);
    return { address, path, privateKey: privKeyHex };
}

function deriveAddressByNetwork(network, index = 0) {
    const networkUpper = network.toUpperCase();
    switch (networkUpper) {
        case "BTC":
            return deriveBTCAddress(index);
        case "ETH":
        case "USDT":
        case "USDC":
            return deriveETHAddress(index);
        case "TRX":
        case "TRC":
            return deriveTRXAddress(index);
        case "SOL":
            return deriveSOLAddress(index);
        default:
            throw new Error(`Unsupported network: ${network}`);
    }
}

module.exports = {
    deriveBTCAddress,
    deriveETHAddress,
    deriveTRXAddress,
    deriveSOLAddress,
    deriveAddressByNetwork
};