export async function onRequest(context) {
    try {
        const { type } = context.params;
        if (type === 'forex') {
            return handleForex();
        }
        if (type === 'crypto') {
            return handleCrypto();
        }
        if (type === 'indices') {
            return handleIndices();
        }
        return jsonResponse({ error: 'Unsupported market type' }, 400);
    } catch (error) {
        return jsonResponse({ error: error.message }, 500);
    }
}

async function handleForex() {
    const response = await fetch('https://open.er-api.com/v6/latest/USD');
    if (!response.ok) {
        return jsonResponse({ error: `Request failed: ${response.status}` }, 502);
    }
    const data = await response.json();
    if (!data || data.result !== 'success') {
        return jsonResponse({ error: 'Forex data unavailable' }, 502);
    }
    const usdToEur = data.rates.EUR;
    const usdToJpy = data.rates.JPY;
    const usdToGbp = data.rates.GBP;
    const items = [
        { label: 'EUR/USD', value: (1 / usdToEur).toFixed(4), changeText: '—', changeClass: 'neutral' },
        { label: 'USD/JPY', value: usdToJpy.toFixed(2), changeText: '—', changeClass: 'neutral' },
        { label: 'GBP/USD', value: (1 / usdToGbp).toFixed(4), changeText: '—', changeClass: 'neutral' }
    ];
    return jsonResponse({ items, source: 'FX rates: open.er-api.com' });
}

async function handleCrypto() {
    const url = 'https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum,solana&vs_currencies=usd&include_24hr_change=true';
    const response = await fetch(url);
    if (!response.ok) {
        return jsonResponse({ error: `Request failed: ${response.status}` }, 502);
    }
    const data = await response.json();
    const items = [
        { label: 'Bitcoin', value: `$${Number(data.bitcoin.usd).toFixed(2)}`, changeText: `${Number(data.bitcoin.usd_24h_change).toFixed(2)}%`, changeClass: data.bitcoin.usd_24h_change >= 0 ? 'up' : 'down' },
        { label: 'Ethereum', value: `$${Number(data.ethereum.usd).toFixed(2)}`, changeText: `${Number(data.ethereum.usd_24h_change).toFixed(2)}%`, changeClass: data.ethereum.usd_24h_change >= 0 ? 'up' : 'down' },
        { label: 'Solana', value: `$${Number(data.solana.usd).toFixed(2)}`, changeText: `${Number(data.solana.usd_24h_change).toFixed(2)}%`, changeClass: data.solana.usd_24h_change >= 0 ? 'up' : 'down' }
    ];
    return jsonResponse({ items, source: 'Crypto prices: coingecko.com' });
}

async function handleIndices() {
    const symbols = ['^GSPC', '^DJI', '^IXIC'];
    const url = `https://query1.finance.yahoo.com/v7/finance/quote?symbols=${encodeURIComponent(symbols.join(','))}`;
    const response = await fetch(url);
    if (!response.ok) {
        return jsonResponse({ error: `Request failed: ${response.status}` }, 502);
    }
    const data = await response.json();
    const results = data?.quoteResponse?.result || [];
    const labelMap = { '^GSPC': 'S&P 500', '^DJI': 'Dow Jones', '^IXIC': 'Nasdaq' };
    const items = results.map(result => ({
        label: labelMap[result.symbol] || result.symbol,
        value: Number(result.regularMarketPrice).toFixed(2),
        changeText: `${Number(result.regularMarketChangePercent).toFixed(2)}%`,
        changeClass: result.regularMarketChangePercent >= 0 ? 'up' : 'down'
    }));
    return jsonResponse({ items, source: 'Indices: Yahoo Finance' });
}

function jsonResponse(data, status = 200) {
    return new Response(JSON.stringify(data), {
        status,
        headers: {
            'content-type': 'application/json',
            'access-control-allow-origin': '*'
        }
    });
}
