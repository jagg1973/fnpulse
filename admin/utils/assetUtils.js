function updateAssetLinks($) {
    $('link[rel="stylesheet"]').each((_, el) => {
        const href = $(el).attr('href');
        if (!href) return;
        const normalized = href.startsWith('/') ? href.slice(1) : href;
        if (normalized.startsWith('news/css/')) {
            $(el).attr('href', `/${normalized.replace(/^news\//, '')}`);
            return;
        }
        if (normalized === 'css/fnpulse.css') {
            $(el).attr('href', '/css/fnpulse.min.css');
        } else if (normalized === 'css/fnpulse.min.css') {
            $(el).attr('href', '/css/fnpulse.min.css');
        } else if (normalized.startsWith('css/')) {
            $(el).attr('href', `/${normalized}`);
        }
    });

    $('script[src]').each((_, el) => {
        const src = $(el).attr('src');
        if (!src) return;
        const normalized = src.startsWith('/') ? src.slice(1) : src;
        if (normalized.startsWith('news/js/')) {
            $(el).attr('src', `/${normalized.replace(/^news\//, '')}`);
            return;
        }
        if (normalized === 'js/main.js') {
            $(el).attr('src', '/js/main.min.js');
        } else if (normalized === 'js/main.min.js') {
            $(el).attr('src', '/js/main.min.js');
        } else if (normalized.startsWith('js/')) {
            $(el).attr('src', `/${normalized}`);
        }
    });

    $('img[src]').each((_, el) => {
        const src = $(el).attr('src');
        if (!src) return;
        if (src.startsWith('data:') || src.startsWith('http')) return;
        const normalized = src.startsWith('/') ? src.slice(1) : src;
        if (normalized.startsWith('news/img/')) {
            $(el).attr('src', `/${normalized.replace(/^news\//, '')}`);
        } else if (normalized.startsWith('img/')) {
            $(el).attr('src', `/${normalized}`);
        }
    });
}

module.exports = {
    updateAssetLinks
};
