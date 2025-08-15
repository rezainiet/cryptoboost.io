// services/paymentMonitor.js
// Polls pending orders and marks them paid once on-chain funds are received.

const { getOrdersCollection } = require("../config/db");


// ---- helpers: HTTP fetch (Node >= 18 has global fetch) ----
async function httpGetJson(url, options = {}) {
    const res = await fetch(url, options);
    if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
    return await res.json();
}

// ---- prices via CoinGecko (free) ----
async function getPricesEUR() {
    // ids: bitcoin, ethereum, tron
    const url =
        "https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum,tron&vs_currencies=eur";
    const data = await httpGetJson(url);
    // normalize
    return {
        BTC: data.bitcoin?.eur ?? null,
        ETH: data.ethereum?.eur ?? null,
        TRX: data.tron?.eur ?? null,
    };
}

function fiatToCryptoEUR(amountFiat, network, prices) {
    const symbol = network.toUpperCase() === "TRC" ? "TRX" : network.toUpperCase();
    const eur = prices[symbol];
    if (!eur || eur <= 0) return null;
    return amountFiat / eur;
}

// ---- chain balance checkers (free endpoints) ----

// BTC: Blockstream — sum UTXOs (values are in sats)
async function getBTCReceived(address) {
    const utxos = await httpGetJson(`https://blockstream.info/api/address/${address}/utxo`);
    const sats = (Array.isArray(utxos) ? utxos : []).reduce((sum, u) => sum + (u.value || 0), 0);
    return sats / 1e8; // BTC
}

// ETH: Cloudflare free public RPC — read current balance (wei)
async function getETHReceived(address) {
    const body = {
        jsonrpc: "2.0",
        method: "eth_getBalance",
        params: [address, "latest"],
        id: 1,
    };
    const res = await fetch("https://cloudflare-eth.com", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
    });
    if (!res.ok) throw new Error(`ETH RPC error ${res.status}`);
    const json = await res.json();
    const weiHex = json?.result || "0x0";
    const wei = BigInt(weiHex);
    const eth = Number(wei) / 1e18;
    return eth;
}

// TRX: TronGrid — account balance in "sun"
async function getTRXReceived(address) {
    // v1/accounts returns array; we read balance (sun)
    const data = await httpGetJson(`https://api.trongrid.io/v1/accounts/${address}`);
    const acc = Array.isArray(data?.data) && data.data.length ? data.data[0] : null;
    const sun = acc?.balance || 0;
    return sun / 1e6; // TRX
}

async function getReceivedByNetwork(network, address) {
    const n = network.toUpperCase();
    if (n === "BTC") return await getBTCReceived(address);
    if (n === "ETH") return await getETHReceived(address);
    if (n === "TRX" || n === "TRC") return await getTRXReceived(address);
    throw new Error(`Unsupported network for balance check: ${network}`);
}

// ---- main poller ----
async function pollPendingOnce({ minConfirmRatio = 0.98 } = {}) {
    const orders = getOrdersCollection();

    // fetch current prices once per tick
    let prices;
    try {
        prices = await getPricesEUR();
    } catch (e) {
        console.error("Price fetch failed:", e.message);
        return;
    }

    // Pending, not expired (optional: ignore expired)
    const now = Date.now();
    const cursor = orders.find({
        status: "pending",
        expiresAt: { $gt: now - 1000 * 60 * 60 * 24 }, // ignore too-old orders (1 day grace)
    });

    const list = await cursor.toArray();
    if (!list.length) return;

    for (const order of list) {
        try {
            const network = order.network;
            const address = order.address;
            const amountFiat = Number(order.amountFiat || 0);

            if (!network || !address || !amountFiat) continue;

            // EUR -> crypto amount (target)
            const expectedCrypto = fiatToCryptoEUR(amountFiat, network, prices);
            if (!expectedCrypto) {
                console.warn(`No price for ${network}, skipping order ${order.orderId}`);
                continue;
            }

            // current received balance on-chain
            const received = await getReceivedByNetwork(network, address);

            // consider paid if received >= 98% of expected (network fees / FX movement)
            const needed = expectedCrypto * minConfirmRatio;
            if (received >= needed) {
                await orders.updateOne(
                    { _id: order._id },
                    {
                        $set: {
                            status: "paid",
                            paidAt: new Date(),
                            amountCryptoExpected: expectedCrypto,
                            amountCryptoReceived: received,
                            priceEurAtCheck: {
                                BTC: prices.BTC,
                                ETH: prices.ETH,
                                TRX: prices.TRX,
                            },
                        },
                    }
                );
                console.log(`✅ Paid: ${order.orderId} (${network}) addr=${address} recv=${received.toFixed(8)}`);
            } else {
                // still pending; optionally store latest probe
                await orders.updateOne(
                    { _id: order._id },
                    {
                        $set: {
                            lastProbeAt: new Date(),
                            amountCryptoExpected: expectedCrypto,
                            amountCryptoReceived: received,
                        },
                    }
                );
            }
        } catch (e) {
            console.error(`Check failed for order ${order.orderId}:`, e.message);
        }
    }
}

// start interval loop
function startPaymentMonitor({ intervalMs = 60_000, minConfirmRatio = 0.98 } = {}) {
    console.log(`🛰️  Payment monitor started (every ${intervalMs / 1000}s)`);
    // run soon after start
    pollPendingOnce({ minConfirmRatio }).catch(() => { });
    // then repeat
    setInterval(() => {
        pollPendingOnce({ minConfirmRatio }).catch((e) =>
            console.error("pollPendingOnce error:", e.message)
        );
    }, intervalMs);
}

module.exports = { startPaymentMonitor, pollPendingOnce };
