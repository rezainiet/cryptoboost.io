const { ethers } = require("ethers");
const { TronWeb } = require("tronweb");
const bip39 = require("bip39");
const ecc = require("tiny-secp256k1");
const BIP32Factory = require("bip32").default || require("bip32");
const bip32 = BIP32Factory(ecc);

// ENV
const MNEMONIC = (process.env.MNEMONIC || "").trim();
if (!bip39.validateMnemonic(MNEMONIC)) {
    throw new Error("Invalid mnemonic");
}

const ETH_DERIVATION = "m/44'/60'/0'/0/";
const TRX_DERIVATION = "m/44'/195'/0'/0/";

const tronWeb = new TronWeb({ fullHost: "https://api.trongrid.io" });

function deriveETHWallet(index) {
    const path = `${ETH_DERIVATION}${index}`;
    return ethers.HDNodeWallet.fromPhrase(MNEMONIC, undefined, path);
}

function deriveTRXWallet(index) {
    const seed = bip39.mnemonicToSeedSync(MNEMONIC);
    const node = bip32.fromSeed(seed).derivePath(`${TRX_DERIVATION}${index}`);
    const privKey = node.privateKey.toString("hex");
    const address = tronWeb.address.fromPrivateKey(privKey);
    return { address, privateKey: privKey };
}

// ✅ ETH sweeping function
async function sweepETHFunds(fromIndex, providerUrl) {
    // ✅ Use Infura mainnet endpoint if not provided
    const provider = new ethers.JsonRpcProvider(
        providerUrl || `https://mainnet.infura.io/v3/${process.env.INFURA_KEY}`
    );

    const fromWallet = deriveETHWallet(fromIndex).connect(provider);
    const toWallet = deriveETHWallet(0); // index 0 is main wallet

    const balance = await provider.getBalance(fromWallet.address);
    if (balance <= 0n) {
        console.log(`No ETH balance at index ${fromIndex}`);
        return;
    }

    const feeData = await provider.getFeeData();
    const gasPrice = feeData.gasPrice;

    if (!gasPrice) {
        console.log("⚠️ Could not fetch gas price");
        return;
    }
    const txFee = gasPrice * 21_000n;
    const amountToSend = balance - txFee;

    if (amountToSend <= 0n) {
        console.log("Not enough balance to cover gas");
        return;
    }

    const tx = await fromWallet.sendTransaction({
        to: toWallet.address,
        value: amountToSend,
        gasPrice,
        gasLimit: 21_000,
    });

    console.log(`✅ ETH swept! TX: ${tx.hash}`);
}

// ✅ TRX sweeping function
async function sweepTRXFunds(fromIndex) {
    const from = deriveTRXWallet(fromIndex);
    const to = deriveTRXWallet(0); // main wallet

    const balanceSun = await tronWeb.trx.getBalance(from.address);
    if (balanceSun <= 0) {
        console.log(`No TRX balance at index ${fromIndex}`);
        return;
    }

    const amountToSend = balanceSun - 1000000; // leave 1 TRX for fees
    if (amountToSend <= 0) {
        console.log("Not enough TRX to send after fees");
        return;
    }

    tronWeb.setPrivateKey(from.privateKey);
    const tx = await tronWeb.trx.sendTransaction(to.address, amountToSend);
    console.log(`✅ TRX swept! TX ID: ${tx.txid}`);
}

// Export functions
module.exports = {
    sweepETHFunds,
    sweepTRXFunds,
};
