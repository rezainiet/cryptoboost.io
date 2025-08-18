// btcSweeper.js
require("dotenv").config();
const bitcoin = require("bitcoinjs-lib");
const axios = require("axios");

// Config
const NETWORK = bitcoin.networks.bitcoin; // Mainnet (use testnet if needed)
const MAIN_WALLET = process.env.BTC_MAIN_WALLET; // sweeping destination
const MNEMONIC = process.env.MNEMONIC; // same mnemonic as HD derivation
const BTC_API = "https://blockstream.info/api"; // Blockstream API

// Derive address from index (BIP44 path m/44'/0'/0'/0/index)
const bip39 = require("bip39");
const ecc = require("tiny-secp256k1");
const BIP32Factory = require("bip32").default;
const bip32 = BIP32Factory(ecc);

function getKeyPair(index) {
    const seed = bip39.mnemonicToSeedSync(MNEMONIC);
    const root = bip32.fromSeed(seed, NETWORK);
    const path = `m/44'/0'/0'/0/${index}`;
    return root.derivePath(path);
}

async function sweepBTC(index) {
    try {
        const keyPair = getKeyPair(index);
        const { address } = bitcoin.payments.p2wpkh({
            pubkey: keyPair.publicKey,
            network: NETWORK,
        });

        console.log(`🔍 Checking BTC balance for ${address}`);

        // 1. Fetch UTXOs
        const utxos = (await axios.get(`${BTC_API}/address/${address}/utxo`)).data;
        if (!utxos.length) {
            console.log("No UTXOs found");
            return { status: "empty", address };
        }

        // 2. Build transaction
        const psbt = new bitcoin.Psbt({ network: NETWORK });
        let total = 0;

        for (let utxo of utxos) {
            const rawTx = (await axios.get(`${BTC_API}/tx/${utxo.txid}/hex`)).data;
            psbt.addInput({
                hash: utxo.txid,
                index: utxo.vout,
                nonWitnessUtxo: Buffer.from(rawTx, "hex"),
            });
            total += utxo.value;
        }

        // Estimate fee (simple: 10 sat/vB * ~200 vB)
        const fee = 2000;
        const sendAmount = total - fee;
        if (sendAmount <= 0) {
            console.log("Balance too low for sweep");
            return { status: "low_balance", address, balance: total };
        }

        psbt.addOutput({
            address: MAIN_WALLET,
            value: sendAmount,
        });

        // 3. Sign inputs
        utxos.forEach((_, i) => {
            psbt.signInput(i, keyPair);
        });
        psbt.finalizeAllInputs();

        const txHex = psbt.extractTransaction().toHex();

        // 4. Broadcast
        const res = await axios.post(`${BTC_API}/tx`, txHex);
        console.log(`✅ BTC sweep successful. TXID: ${res.data}`);

        return { status: "success", txid: res.data, from: address, to: MAIN_WALLET, amount: sendAmount };
    } catch (err) {
        console.error("BTC sweep error:", err.message);
        return { status: "error", error: err.message };
    }
}

module.exports = { sweepBTC };
