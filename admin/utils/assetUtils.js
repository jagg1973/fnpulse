function updateAssetLinks($) {
    $('link[rel="stylesheet"]').each((_, el) => {
        const href = $(el).attr('href');
        if (href === 'css/fnpulse.css') {
            $(el).attr('href', 'css/fnpulse.min.css');
        }
    });

    $('script[src]').each((_, el) => {
        const src = $(el).attr('src');
        if (src === 'js/main.js') {
            $(el).attr('src', 'js/main.min.js');
        }
    });
}

module.exports = {
    updateAssetLinks
};
