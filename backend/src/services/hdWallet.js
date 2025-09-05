// services/hdWallet.js
const bip39 = require("bip39");
const ecc = require("tiny-secp256k1");
const BIP32Factory = require("bip32").default;
const bitcoin = require("bitcoinjs-lib");
const { ethers } = require("ethers");
const { TronWeb } = require("tronweb");
const { Keypair } = require('@solana/web3.js');
const nacl = require('tweetnacl');
const { derivePath } = require("ed25519-hd-key");
const { getCountersCollection } = require("../config/db");

const MNEMONIC = (process.env.MNEMONIC || "").trim();
if (!bip39.validateMnemonic(MNEMONIC)) {
    throw new Error("Invalid MNEMONIC in .env");
}


const counters = getCountersCollection()

// Get monotonic index per network to avoid address reuse
async function nextIndexFor(network) {
    if (!network) throw new Error("Network is required for address generation")

    const key = `addr_index_${network}`

    const doc = await counters.findOneAndUpdate(
        { _id: key },
        { $inc: { seq: 1 } },
        { upsert: true, returnDocument: "after" }, // returns the updated document
    )

    // doc itself is the updated document
    return doc.seq
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
// function deriveSOLAddress(index = 0) {
//     const path = `m/44'/501'/${index}'`
//     const seed = bip39.mnemonicToSeedSync(MNEMONIC)

//     // Use BIP32 derivation to get the proper key for this path
//     const node = getRootNode().derivePath(path)

//     // Use the derived private key (first 32 bytes) as seed for Solana keypair
//     const solanaPrivateKey = node.privateKey.slice(0, 32)
//     const keypair = Keypair.fromSeed(solanaPrivateKey)

//     return {
//         address: keypair.publicKey.toString(),
//         path,
//         privateKey: Buffer.from(keypair.secretKey).toString("hex"),
//     }
// }

// Fixed SOL Address Derivation
function deriveSOLAddresss(index = 0) {
    const path = `m/44'/501'/${index}'`
    const seed = bip39.mnemonicToSeedSync(MNEMONIC)

    // Use BIP32 derivation to get the proper key for this path
    const node = getRootNode().derivePath(path)

    // Use the derived private key (first 32 bytes) as seed for Solana keypair
    const solanaPrivateKey = node.privateKey.slice(0, 32)
    const keypair = Keypair.fromSeed(solanaPrivateKey)

    return {
        address: keypair.publicKey.toString(),
        path,
        privateKey: Buffer.from(keypair.secretKey).toString("hex"),
    }
}

function deriveSOLAddress(index) {
    const seed = bip39.mnemonicToSeedSync(MNEMONIC)
    const path = `m/44'/501'/${index}'`
    const derivedSeed = derivePath(path, seed.toString("hex")).key
    const keypair = Keypair.fromSeed(derivedSeed)
    return {
        address: keypair.publicKey.toString(),
        path,
        privateKey: Buffer.from(keypair.secretKey).toString("hex"),
    }
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



// deriveAddressByNetwork with auto-increment index
async function deriveAddressByNetwork(network) {
    if (!network) throw new Error("Network is required")

    // get next unique index for this network
    const index = await nextIndexFor(network)

    const networkUpper = network.toUpperCase()
    switch (networkUpper) {
        case "BTC":
            return deriveBTCAddress(index)
        case "ETH":
        case "USDT":
        case "USDC":
            return deriveETHAddress(index)
        case "TRX":
        case "TRC":
            return deriveTRXAddress(index)
        case "SOL":
            return deriveSOLAddress(index)
        default:
            throw new Error(`Unsupported network: ${network}`)
    }
}


function getPrivateKeyForSOLAddress(targetAddress, maxIndex = 100000) {
    for (let index = 0; index <= maxIndex; index++) {
        const { address, privateKey } = deriveSOLAddress(index)
        if (address === targetAddress) {
            return {
                privateKey,
                index,
                address,
            }
        }
    }
    throw new Error(`Private key not found for address ${targetAddress} within index range 0-${maxIndex}`)
}

module.exports = {
    deriveBTCAddress,
    deriveETHAddress,
    deriveTRXAddress,
    deriveSOLAddress,
    deriveAddressByNetwork,
    getPrivateKeyForSOLAddress
};