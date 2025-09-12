const bitcoin = require("bitcoinjs-lib")
const ECPairFactory = require("ecpair").default
const ecc = require("tiny-secp256k1")
const axios = require("axios")
const { deriveAddressByNetwork } = require("../hdWallet")
const { GAS_CONFIG } = require("./config")

const BTC_NETWORK = bitcoin.networks.bitcoin
const ECPair = ECPairFactory(ecc)

async function getBTCUtxosWithData(address, includeUnconfirmed = false) {
    try {
        const url =
            `https://blockstream.info/api/address/${address}/utxo` + (includeUnconfirmed ? "?include_unconfirmed=true" : "")
        const { data } = await axios.get(url, { timeout: 10000 })
        return Array.isArray(data) ? data : []
    } catch (err) {
        console.error("BTC UTXO fetch error:", err.message)
        throw new Error("Failed to fetch UTXOs", { details: { address, err } })
    }
}

async function getBTCTransaction(txid) {
    try {
        const { data } = await axios.get(`https://blockstream.info/api/tx/${txid}/hex`)
        return data
    } catch (err) {
        console.error("BTC transaction fetch error:", err.message)
        throw err
    }
}

async function getRecommendedFeeRate() {
    try {
        const { data } = await axios.get("https://blockstream.info/api/fee-estimates")
        return Math.ceil(data["2"]) // Target 2-block confirmation fee rate
    } catch (err) {
        console.warn("Using fallback fee rate:", err.message)
        return GAS_CONFIG.BTC.FEE_RATE
    }
}

async function broadcastBTCTransactionWithVerification(txHex, sourceAddress) {
    try {
        const { data: txid } = await axios.post("https://blockstream.info/api/tx", txHex, {
            headers: { "Content-Type": "text/plain" },
            timeout: 15000,
        })

        // Verify transaction is in mempool
        const verified = await verifyTransactionInMempool(txid, sourceAddress)
        if (!verified) throw new Error("Transaction not found in mempool after broadcast")

        return txid
    } catch (err) {
        console.error("Broadcast failed:", err.message)
        throw new Error("Transaction broadcast failed", { details: { err } })
    }
}

async function verifyTransactionInMempool(txid, address) {
    try {
        const [txResp, addrResp] = await Promise.all([
            axios.get(`https://blockstream.info/api/tx/${txid}/status`),
            axios.get(`https://blockstream.info/api/address/${address}/txs/mempool`),
        ])

        return txResp.data.confirmed === false || addrResp.data.some((tx) => tx.txid === txid)
    } catch (err) {
        console.warn("Mempool verification failed:", err.message)
        return false
    }
}

function getBitcoinJSRootNode() {
    const { BIP32Factory } = require("bip32")
    const bip32 = BIP32Factory(ecc)
    const bip39 = require("bip39")

    const seed = bip39.mnemonicToSeedSync(process.env.MNEMONIC)
    return bip32.fromSeed(seed, BTC_NETWORK)
}

function estimateTransactionSize(inputCount, outputCount = 1) {
    const baseSize = 10
    const inputSize = inputCount * 68
    const outputSize = outputCount * 31
    const witnessOverhead = 2 + inputCount * 73
    return Math.ceil((baseSize + inputSize + outputSize + witnessOverhead) * 1.1)
}

async function sweepBTC(index) {
    try {
        if (index === 0) return null // Skip main wallet

        const fromWallet = await deriveAddressByNetwork("BTC", index)
        const toWallet = await deriveAddressByNetwork("BTC", 0)

        if (!fromWallet || !fromWallet.address) {
            throw new Error(`Invalid wallet data for index ${index}`)
        }

        const rootNode = getBitcoinJSRootNode()
        const derivationPath = `m/84'/0'/0'/0/${index}`
        const childNode = rootNode.derivePath(derivationPath)

        console.log(`[${index}] Processing BTC sweep for address: ${fromWallet.address}`)
        console.log(`[${index}] Derivation path: ${derivationPath}`)

        const utxos = await getBTCUtxosWithData(fromWallet.address, true)
        if (!utxos.length) {
            console.log(`[${index}] No BTC balance at index`)
            return null
        }

        console.log(`[${index}] Found ${utxos.length} UTXOs`)

        const validUtxos = utxos
            .filter((u) => u.value > 0)
            .sort((a, b) => (b.status.block_time || 0) - (a.status.block_time || 0))

        if (!validUtxos.length) {
            console.log(`[${index}] No spendable BTC at index`)
            return null
        }

        const confirmedUtxos = validUtxos.filter((u) => u.status.confirmed)
        if (!confirmedUtxos.length) {
            console.log(`[${index}] No confirmed UTXOs at index`)
            return null
        }

        console.log(`[${index}] Using ${confirmedUtxos.length} confirmed UTXOs`)

        const totalSats = confirmedUtxos.reduce((sum, u) => sum + u.value, 0)
        console.log(`[${index}] Total balance: ${totalSats / 1e8} BTC`)

        const psbt = new bitcoin.Psbt({
            network: BTC_NETWORK,
            maximumFeeRate: GAS_CONFIG.BTC.MAX_FEE_RATE,
        })

        for (const utxo of confirmedUtxos) {
            try {
                console.log(`[${index}] Adding input: ${utxo.txid}:${utxo.vout}`)
                const raw = await getBTCTransaction(utxo.txid)
                const tx = bitcoin.Transaction.fromHex(raw)

                psbt.addInput({
                    hash: utxo.txid,
                    index: utxo.vout,
                    witnessUtxo: {
                        script: tx.outs[utxo.vout].script,
                        value: utxo.value,
                    },
                })
            } catch (err) {
                console.warn(`[${index}] Skipping UTXO ${utxo.txid}:${utxo.vout} due to error:`, err.message)
            }
        }

        if (psbt.inputCount === 0) {
            throw new Error("No valid UTXOs could be processed")
        }

        console.log(`[${index}] Added ${psbt.inputCount} inputs to PSBT`)

        const feeRate = await getRecommendedFeeRate()
        const estimatedSize = estimateTransactionSize(psbt.inputCount, 1)
        const estimatedFee = Math.ceil(estimatedSize * feeRate)

        console.log(`[${index}] Fee rate: ${feeRate} sat/vB, Estimated fee: ${estimatedFee / 1e8} BTC`)

        if (totalSats <= estimatedFee + GAS_CONFIG.BTC.DUST_LIMIT) {
            throw new Error(`Insufficient BTC (${totalSats / 1e8}) for fee (${estimatedFee / 1e8}) + dust limit`)
        }

        const outputAmount = totalSats - estimatedFee
        psbt.addOutput({
            address: toWallet.address,
            value: outputAmount,
        })

        console.log(`[${index}] Output amount: ${outputAmount / 1e8} BTC to ${toWallet.address}`)

        const keyPair = ECPair.fromPrivateKey(childNode.privateKey)
        console.log(`[${index}] Created keypair for signing`)

        for (let i = 0; i < psbt.inputCount; i++) {
            console.log(`[${index}] Signing input ${i}`)
            psbt.signInput(i, {
                publicKey: Buffer.from(keyPair.publicKey),
                sign: (hash) => {
                    const signature = keyPair.sign(hash)
                    return Buffer.from(signature)
                },
            })
        }

        console.log(`[${index}] All inputs signed, validating signatures...`)

        const validator = (pubkey, msghash, signature) => {
            return ecc.verify(msghash, pubkey, signature)
        }

        psbt.validateSignaturesOfAllInputs(validator)

        console.log(`[${index}] Signatures validated, finalizing inputs...`)
        psbt.finalizeAllInputs()

        if (psbt.inputCount === 0 || psbt.outputCount === 0) {
            throw new Error("Invalid transaction structure")
        }

        const txHex = psbt.extractTransaction().toHex()
        console.log(`[${index}] Transaction hex length: ${txHex.length}`)

        const txid = await broadcastBTCTransactionWithVerification(txHex, fromWallet.address)
        console.log(`✅ BTC swept ${(totalSats - estimatedFee) / 1e8} BTC. TX: ${txid}`)

        return txid
    } catch (err) {
        console.error(`❌ BTC sweep failed for index ${index}:`, err.message)
        if (err.details) console.error("Error details:", err.details)
        return null
    }
}

module.exports = { sweepBTC }
