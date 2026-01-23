(() => {
    // Normalize any literal "&amp;" sequences in visible text nodes.
    const textWalker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, {
        acceptNode: (node) => {
            const parent = node.parentNode;
            if (!parent) return NodeFilter.FILTER_REJECT;
            const tag = parent.nodeName.toLowerCase();
            if (tag === 'script' || tag === 'style') {
                return NodeFilter.FILTER_REJECT;
            }
            return node.nodeValue && node.nodeValue.includes('&amp;')
                ? NodeFilter.FILTER_ACCEPT
                : NodeFilter.FILTER_REJECT;
        }
    });

    const textNodes = [];
    while (textWalker.nextNode()) {
        textNodes.push(textWalker.currentNode);
    }
    textNodes.forEach(node => {
        node.nodeValue = node.nodeValue.replace(/&amp;/g, '&');
    });

    const navToggle = document.querySelector(".mobile-toggle");
    const nav = document.querySelector(".nav-links");

    if (navToggle && nav) {
        navToggle.addEventListener("click", (e) => {
            e.stopPropagation();
            const isOpen = nav.classList.toggle("is-open");
            navToggle.setAttribute("aria-expanded", String(isOpen));
        });

        // Close menu when clicking outside
        document.addEventListener("click", (e) => {
            if (nav.classList.contains("is-open") && !nav.contains(e.target) && !navToggle.contains(e.target)) {
                nav.classList.remove("is-open");
                navToggle.setAttribute("aria-expanded", "false");
            }
        });

        // Close menu when clicking a link
        nav.querySelectorAll("a").forEach(link => {
            link.addEventListener("click", () => {
                nav.classList.remove("is-open");
                navToggle.setAttribute("aria-expanded", "false");
            });
        });
    }

    // --- Video Modal Logic ---
    // Inject the modal HTML into the DOM dynamically
    const modalHTML = `
        <div id="video-modal" class="video-modal">
            <div class="modal-backdrop"></div>
            <div class="modal-content">
                <button class="modal-close" aria-label="Close video">×</button>
                <div class="video-wrapper">
                    <!-- Placeholder iframe -->
                    <iframe id="video-frame" src="" title="Video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>
                </div>
            </div>
        </div>
    `;

    document.body.insertAdjacentHTML('beforeend', modalHTML);

    const modal = document.getElementById('video-modal');
    const iframe = modal.querySelector('#video-frame');
    const closeBtn = modal.querySelector('.modal-close');
    const backdrop = modal.querySelector('.modal-backdrop');

    // Placeholder video ID (Bloomberg global financial news or similar generic tech/finance clip)
    const DEFAULT_VIDEO = "https://www.youtube.com/embed/SltxJ3n8UQA?autoplay=1&mute=0&rel=0";

    function openModal() {
        iframe.src = DEFAULT_VIDEO;
        modal.classList.add('active');
        document.body.style.overflow = 'hidden'; // Lock scroll
    }

    function closeModal() {
        modal.classList.remove('active');
        setTimeout(() => { iframe.src = ""; }, 300); // Clear source after fade out to stop sound
        document.body.style.overflow = '';
    }

    // Bind to Large Play Button
    const largePlayBtn = document.querySelector('.play-btn-large');
    if (largePlayBtn) {
        largePlayBtn.addEventListener('click', (e) => {
            e.preventDefault();
            openModal();
        });
    }

    // Bind to Side Video List Items
    const sideVideos = document.querySelectorAll('.video-item-small');
    sideVideos.forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault(); // Prevent empty link navigation
            openModal();
        });
    });

    // Close logic
    closeBtn.addEventListener('click', closeModal);
    backdrop.addEventListener('click', closeModal);
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && modal.classList.contains('active')) {
            closeModal();
        }
    });

    const tickerEl = document.querySelector('[data-live-ticker]');
    const marketListEl = document.querySelector('[data-market-list]');
    const marketTabs = document.querySelectorAll('[data-market-tab]');
    const marketSourceEl = document.querySelector('[data-market-source]');
    const eventsListEl = document.querySelector('[data-events-list]');

    const API_PROXY = 'https://api.allorigins.win/raw?url=';
    const localApiBase = window.location.origin && window.location.origin !== 'null'
        ? window.location.origin
        : 'http://localhost:3000';
    const apiUrl = (path) => `${localApiBase}${path}`;
    const MARKET_SOURCES = {
        forex: 'FX rates: open.er-api.com',
        crypto: 'Crypto prices: coingecko.com',
        indices: 'Indices: Yahoo Finance / Stooq',
        commodities: 'Commodities: Yahoo Finance / Stooq'
    };
    const marketCache = new Map();

    const formatNumber = (value, digits = 2) => new Intl.NumberFormat('en-US', {
        minimumFractionDigits: digits,
        maximumFractionDigits: digits
    }).format(value);

    const formatPrice = (value) => new Intl.NumberFormat('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    }).format(value);

    const formatPercent = (value) => {
        if (value === null || value === undefined || Number.isNaN(value)) return '—';
        const sign = value > 0 ? '+' : '';
        return `${sign}${formatNumber(value, 2)}%`;
    };

    const fetchWithTimeout = async (url, timeout = 10000) => {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), timeout);
        try {
            const response = await fetch(url, { signal: controller.signal });
            if (!response.ok) {
                throw new Error(`Request failed: ${response.status}`);
            }
            return response;
        } finally {
            clearTimeout(timer);
        }
    };

    const proxied = (url) => `${API_PROXY}${encodeURIComponent(url)}`;

    const renderMarketList = (items) => {
        if (!marketListEl) return;
        marketListEl.innerHTML = items.map(item => {
            const changeClass = item.changeClass || 'neutral';
            const changeText = item.changeText || '—';
            return `
                <li>
                    <span>${item.label}</span>
                    <strong>${item.value}</strong>
                    <span class="${changeClass}">${changeText}</span>
                </li>
            `;
        }).join('');
    };

    const setActiveTab = (tabName) => {
        marketTabs.forEach(tab => {
            const isActive = tab.dataset.marketTab === tabName;
            tab.classList.toggle('is-active', isActive);
            tab.setAttribute('aria-selected', String(isActive));
        });
    };

    const fetchLocalFirst = async (localUrl, fallbackUrl, options = {}) => {
        try {
            const localResponse = await fetchWithTimeout(localUrl, options.timeout || 8000);
            if (localResponse.ok) return { response: localResponse, source: 'local' };
        } catch (error) {
            // ignore and fall back
        }
        const fallbackResponse = await fetchWithTimeout(fallbackUrl, options.timeout || 10000);
        return { response: fallbackResponse, source: 'remote' };
    };

    const loadForex = async () => {
        if (marketCache.has('forex')) return marketCache.get('forex');
        const { response, source } = await fetchLocalFirst(apiUrl('/api/markets/forex'), 'https://open.er-api.com/v6/latest/USD');
        const data = await response.json();
        if (source === 'local' && data.items) {
            marketCache.set('forex', data.items);
            return data.items;
        }
        if (!data || data.result !== 'success') throw new Error('Forex data unavailable');
        const usdToEur = data.rates.EUR;
        const usdToJpy = data.rates.JPY;
        const usdToGbp = data.rates.GBP;
        const items = [
            { label: 'EUR/USD', value: formatNumber(1 / usdToEur, 4), changeText: '—', changeClass: 'neutral' },
            { label: 'USD/JPY', value: formatNumber(usdToJpy, 2), changeText: '—', changeClass: 'neutral' },
            { label: 'GBP/USD', value: formatNumber(1 / usdToGbp, 4), changeText: '—', changeClass: 'neutral' }
        ];
        marketCache.set('forex', items);
        return items;
    };

    const loadCrypto = async () => {
        if (marketCache.has('crypto')) return marketCache.get('crypto');
        const url = 'https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum,solana&vs_currencies=usd&include_24hr_change=true';
        const { response, source } = await fetchLocalFirst(apiUrl('/api/markets/crypto'), url);
        const data = await response.json();
        if (source === 'local' && data.items) {
            marketCache.set('crypto', data.items);
            return data.items;
        }
        const items = [
            {
                label: 'Bitcoin',
                value: `$${formatPrice(data.bitcoin.usd)}`,
                changeText: formatPercent(data.bitcoin.usd_24h_change),
                changeClass: data.bitcoin.usd_24h_change >= 0 ? 'up' : 'down'
            },
            {
                label: 'Ethereum',
                value: `$${formatPrice(data.ethereum.usd)}`,
                changeText: formatPercent(data.ethereum.usd_24h_change),
                changeClass: data.ethereum.usd_24h_change >= 0 ? 'up' : 'down'
            },
            {
                label: 'Solana',
                value: `$${formatPrice(data.solana.usd)}`,
                changeText: formatPercent(data.solana.usd_24h_change),
                changeClass: data.solana.usd_24h_change >= 0 ? 'up' : 'down'
            }
        ];
        marketCache.set('crypto', items);
        return items;
    };

    const loadIndices = async () => {
        if (marketCache.has('indices')) return marketCache.get('indices');
        const symbols = ['^GSPC', '^DJI', '^IXIC'];
        const url = `https://query1.finance.yahoo.com/v7/finance/quote?symbols=${encodeURIComponent(symbols.join(','))}`;
        const { response, source } = await fetchLocalFirst(apiUrl('/api/markets/indices'), proxied(url));
        const data = await response.json();
        if (source === 'local' && data.items) {
            marketCache.set('indices', data.items);
            return data.items;
        }
        const results = data?.quoteResponse?.result || [];
        const labelMap = {
            '^GSPC': 'S&P 500',
            '^DJI': 'Dow Jones',
            '^IXIC': 'Nasdaq'
        };
        const items = results.map(result => ({
            label: labelMap[result.symbol] || result.symbol,
            value: formatPrice(result.regularMarketPrice),
            changeText: formatPercent(result.regularMarketChangePercent),
            changeClass: result.regularMarketChangePercent >= 0 ? 'up' : 'down'
        }));
        marketCache.set('indices', items);
        return items;
    };

    const loadCommodities = async () => {
        if (marketCache.has('commodities')) return marketCache.get('commodities');
        const yahooSymbols = ['GC=F', 'SI=F', 'CL=F', 'BZ=F'];
        const url = `https://query1.finance.yahoo.com/v7/finance/quote?symbols=${encodeURIComponent(yahooSymbols.join(','))}`;
        const { response, source } = await fetchLocalFirst(apiUrl('/api/markets/commodities'), proxied(url));
        const data = await response.json();
        if (source === 'local' && data.items) {
            marketCache.set('commodities', data.items);
            return data.items;
        }
        const results = data?.quoteResponse?.result || [];
        const labelMap = {
            'GC=F': 'Gold',
            'SI=F': 'Silver',
            'CL=F': 'WTI Crude',
            'BZ=F': 'Brent Crude'
        };
        const items = results.map(result => ({
            label: labelMap[result.symbol] || result.symbol,
            value: formatPrice(result.regularMarketPrice),
            changeText: formatPercent(result.regularMarketChangePercent),
            changeClass: result.regularMarketChangePercent >= 0 ? 'up' : 'down'
        }));
        marketCache.set('commodities', items);
        return items;
    };

    const loadMarketData = async (tabName) => {
        if (!marketListEl) return;
        marketListEl.innerHTML = '<li class="market-loading">Loading market data…</li>';
        try {
            let items = [];
            if (tabName === 'forex') items = await loadForex();
            if (tabName === 'crypto') items = await loadCrypto();
            if (tabName === 'indices') items = await loadIndices();
            if (tabName === 'commodities') items = await loadCommodities();
            renderMarketList(items);
            if (marketSourceEl) {
                marketSourceEl.textContent = `Live data sources: ${MARKET_SOURCES[tabName]}.`;
            }
        } catch (error) {
            marketListEl.innerHTML = '<li class="market-loading">Unable to load market data right now.</li>';
            if (marketSourceEl) {
                marketSourceEl.textContent = 'Live data temporarily unavailable.';
            }
        }
    };

    const loadLiveTicker = async () => {
        if (!tickerEl) return;
        try {
            const rssUrl = 'https://www.marketwatch.com/rss/topstories';
            const { response, source } = await fetchLocalFirst(apiUrl('/api/live-ticker'), proxied(rssUrl));
            if (source === 'local') {
                const data = await response.json();
                if (Array.isArray(data.headlines) && data.headlines.length) {
                    tickerEl.textContent = data.headlines.join(' • ');
                    return;
                }
            }
            const text = await response.text();
            const xmlDoc = new DOMParser().parseFromString(text, 'text/xml');
            const titles = Array.from(xmlDoc.querySelectorAll('item > title'))
                .map(node => node.textContent.trim())
                .filter(Boolean)
                .slice(0, 6);
            if (titles.length) {
                tickerEl.textContent = titles.join(' • ');
            }
        } catch (error) {
            if (tickerEl.textContent.trim().length === 0) {
                tickerEl.textContent = 'Live headlines unavailable at the moment.';
            }
        }
    };

    const loadEvents = async () => {
        if (!eventsListEl) return;
        try {
            const eventsUrl = 'https://api.tradingeconomics.com/calendar/country/united%20states?c=guest:guest&f=json';
            const { response, source } = await fetchLocalFirst(apiUrl('/api/events'), proxied(eventsUrl));
            const data = await response.json();
            if (source === 'local' && Array.isArray(data.events)) {
                if (!data.events.length) {
                    eventsListEl.innerHTML = '<li class="events-loading">No upcoming events in the feed.</li>';
                    return;
                }
                eventsListEl.innerHTML = data.events.map(item => {
                    const dateObj = new Date(item.date);
                    const dateLabel = dateObj.toLocaleDateString('en-US', { month: 'short', day: '2-digit' });
                    return `
                        <li>
                            <span>${dateLabel}</span>
                            <div>
                                <strong>${item.event}</strong>
                                <small>${item.detail}</small>
                            </div>
                        </li>
                    `;
                }).join('');
                return;
            }
            const now = new Date();
            const upcoming = data
                .map(item => ({
                    date: new Date(item.Date || item.date || item.datetime),
                    event: item.Event || item.EventDescription || item.Title || 'Market Event',
                    detail: item.Forecast || item.Actual || item.Previous || item.Consensus || 'Details pending'
                }))
                .filter(item => !Number.isNaN(item.date.getTime()) && item.date >= now)
                .sort((a, b) => a.date - b.date)
                .slice(0, 4);

            if (!upcoming.length) {
                eventsListEl.innerHTML = '<li class="events-loading">No upcoming events in the feed.</li>';
                return;
            }

            eventsListEl.innerHTML = upcoming.map(item => {
                const dateLabel = item.date.toLocaleDateString('en-US', { month: 'short', day: '2-digit' });
                return `
                    <li>
                        <span>${dateLabel}</span>
                        <div>
                            <strong>${item.event}</strong>
                            <small>${item.detail}</small>
                        </div>
                    </li>
                `;
            }).join('');
        } catch (error) {
            eventsListEl.innerHTML = '<li class="events-loading">Unable to load events right now.</li>';
        }
    };

    if (marketTabs.length) {
        marketTabs.forEach(tab => {
            tab.addEventListener('click', () => {
                const tabName = tab.dataset.marketTab;
                if (!tabName) return;
                setActiveTab(tabName);
                loadMarketData(tabName);
            });
        });
        loadMarketData('forex');
    }

    loadLiveTicker();
    loadEvents();
    setInterval(loadLiveTicker, 300000);
    setInterval(loadEvents, 900000);

})();

