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
        if (type === 'commodities') {
            return handleCommodities();
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

    const stooqMap = {
        'EUR/USD': 'eurusd',
        'USD/JPY': 'usdjpy',
        'GBP/USD': 'gbpusd'
    };
    const stooqQuotes = await Promise.all(Object.entries(stooqMap).map(async ([label, symbol]) => {
        const quote = await fetchStooqQuote(symbol);
        return [label, quote];
    }));
    const changeMap = Object.fromEntries(stooqQuotes);

    const items = [
        buildForexItem('EUR/USD', (1 / usdToEur).toFixed(4), changeMap['EUR/USD']),
        buildForexItem('USD/JPY', usdToJpy.toFixed(2), changeMap['USD/JPY']),
        buildForexItem('GBP/USD', (1 / usdToGbp).toFixed(4), changeMap['GBP/USD'])
    ];
    return jsonResponse({ items, source: 'FX rates: open.er-api.com / Stooq' });
}

function buildForexItem(label, value, stooqQuote) {
    if (stooqQuote && stooqQuote.changePercent !== null) {
        return {
            label,
            value,
            changeText: `${stooqQuote.changePercent.toFixed(2)}%`,
            changeClass: stooqQuote.changePercent >= 0 ? 'up' : 'down'
        };
    }
    return {
        label,
        value,
        changeText: '—',
        changeClass: 'neutral'
    };
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
    if (response.ok) {
        const data = await response.json();
        const results = data?.quoteResponse?.result || [];
        if (results.length) {
            const labelMap = { '^GSPC': 'S&P 500', '^DJI': 'Dow Jones', '^IXIC': 'Nasdaq' };
            const items = results.map(result => ({
                label: labelMap[result.symbol] || result.symbol,
                value: Number(result.regularMarketPrice).toFixed(2),
                changeText: `${Number(result.regularMarketChangePercent).toFixed(2)}%`,
                changeClass: result.regularMarketChangePercent >= 0 ? 'up' : 'down'
            }));
            return jsonResponse({ items, source: 'Indices: Yahoo Finance' });
        }
    }

    const stooqSymbols = [
        { symbol: '^spx', label: 'S&P 500' },
        { symbol: '^dji', label: 'Dow Jones' },
        { symbol: '^ndq', label: 'Nasdaq' }
    ];
    const items = await Promise.all(stooqSymbols.map(async ({ symbol, label }) => {
        const quote = await fetchStooqQuote(symbol);
        if (!quote) return null;
        return {
            label,
            value: Number(quote.price).toFixed(2),
            changeText: quote.changePercent !== null ? `${quote.changePercent.toFixed(2)}%` : '—',
            changeClass: quote.changePercent === null ? 'neutral' : quote.changePercent >= 0 ? 'up' : 'down'
        };
    }));
    const filtered = items.filter(Boolean);
    if (!filtered.length) {
        return jsonResponse({ error: 'Indices data unavailable' }, 502);
    }
    return jsonResponse({ items: filtered, source: 'Indices: Stooq' });
}

async function handleCommodities() {
    const symbols = ['GC=F', 'SI=F', 'CL=F', 'BZ=F'];
    const url = `https://query1.finance.yahoo.com/v7/finance/quote?symbols=${encodeURIComponent(symbols.join(','))}`;
    const response = await fetch(url);
    if (response.ok) {
        const data = await response.json();
        const results = data?.quoteResponse?.result || [];
        if (results.length) {
            const labelMap = { 'GC=F': 'Gold', 'SI=F': 'Silver', 'CL=F': 'WTI Crude', 'BZ=F': 'Brent Crude' };
            const items = results.map(result => ({
                label: labelMap[result.symbol] || result.symbol,
                value: Number(result.regularMarketPrice).toFixed(2),
                changeText: `${Number(result.regularMarketChangePercent).toFixed(2)}%`,
                changeClass: result.regularMarketChangePercent >= 0 ? 'up' : 'down'
            }));
            return jsonResponse({ items, source: 'Commodities: Yahoo Finance' });
        }
    }

    const stooqSymbols = [
        { symbol: 'xauusd', label: 'Gold' },
        { symbol: 'xagusd', label: 'Silver' },
        { symbol: 'cl.f', label: 'WTI Crude' },
        { symbol: 'brent', label: 'Brent Crude' }
    ];
    const items = await Promise.all(stooqSymbols.map(async ({ symbol, label }) => {
        const quote = await fetchStooqQuote(symbol);
        if (!quote) return null;
        return {
            label,
            value: Number(quote.price).toFixed(2),
            changeText: quote.changePercent !== null ? `${quote.changePercent.toFixed(2)}%` : '—',
            changeClass: quote.changePercent === null ? 'neutral' : quote.changePercent >= 0 ? 'up' : 'down'
        };
    }));
    const filtered = items.filter(Boolean);
    if (!filtered.length) {
        return jsonResponse({ error: 'Commodities data unavailable' }, 502);
    }
    return jsonResponse({ items: filtered, source: 'Commodities: Stooq' });
}

async function fetchStooqQuote(symbol) {
    const url = `https://stooq.com/q/l/?s=${encodeURIComponent(symbol)}&f=sd2t2ohlcv&h&e=csv`;
    const response = await fetch(url);
    if (!response.ok) return null;
    const text = await response.text();
    const lines = text.trim().split('\n');
    if (lines.length < 2) return null;
    const values = lines[1].split(',');
    if (values.length < 7) return null;
    const open = Number(values[3]);
    const close = Number(values[6]);
    if (!Number.isFinite(close)) return null;
    const changePercent = Number.isFinite(open) && open > 0 ? ((close - open) / open) * 100 : null;
    return { price: close, changePercent };
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
