const cheerio = require('cheerio');

function ensureHeadStructure($, options = {}) {
    const { filename, config } = options;
    let head = $('head');
    if (!head.length) {
        $('html').prepend('<head></head>');
        head = $('head');
    }

    const body = $('body');
    if (body.length) {
        body.find('title, meta, link[rel="canonical"], link[rel="preconnect"], link[rel="stylesheet"], script[type="application/ld+json"]')
            .each((_, el) => {
                head.append($(el));
            });
    }

    const titleText = $('title').first().text().trim()
        || (config?.siteName ? config.siteName : 'FNPulse');
    if (!$('title').length) {
        head.prepend(`<title>${titleText}</title>`);
    }

    if (!$('meta[name="description"]').length && config?.siteDescription) {
        head.append(`<meta name="description" content="${config.siteDescription}">`);
    }

    if (config?.siteUrl && filename && !$('link[rel="canonical"]').length) {
        const canonical = `${config.siteUrl}/${filename.replace(/^\//, '')}`;
        head.append(`<link rel="canonical" href="${canonical}">`);
    }

    const canonicalUrl = $('link[rel="canonical"]').attr('href') || (config?.siteUrl && filename ? `${config.siteUrl}/${filename.replace(/^\//, '')}` : config?.siteUrl || '');
    const description = $('meta[name="description"]').attr('content') || config?.siteDescription || '';
    const defaultImage = config?.seo?.defaultImage || (config?.siteUrl ? `${config.siteUrl}/img/news-1200x800-1.jpg` : '');

    if (!$('meta[property="og:type"]').length) {
        head.append(`<meta property="og:type" content="website">`);
    }
    if (!$('meta[property="og:title"]').length) {
        head.append(`<meta property="og:title" content="${titleText}">`);
    }
    if (!$('meta[property="og:description"]').length && description) {
        head.append(`<meta property="og:description" content="${description}">`);
    }
    if (!$('meta[property="og:url"]').length && canonicalUrl) {
        head.append(`<meta property="og:url" content="${canonicalUrl}">`);
    }
    if (!$('meta[property="og:image"]').length && defaultImage) {
        head.append(`<meta property="og:image" content="${defaultImage}">`);
    }

    if (!$('meta[property="twitter:card"]').length) {
        head.append('<meta property="twitter:card" content="summary_large_image">');
    }
    if (!$('meta[property="twitter:title"]').length) {
        head.append(`<meta property="twitter:title" content="${titleText}">`);
    }
    if (!$('meta[property="twitter:description"]').length && description) {
        head.append(`<meta property="twitter:description" content="${description}">`);
    }
    if (!$('meta[property="twitter:url"]').length && canonicalUrl) {
        head.append(`<meta property="twitter:url" content="${canonicalUrl}">`);
    }
    if (!$('meta[property="twitter:image"]').length && defaultImage) {
        head.append(`<meta property="twitter:image" content="${defaultImage}">`);
    }
    if (config?.seo?.twitterHandle && !$('meta[property="twitter:site"]').length) {
        head.append(`<meta property="twitter:site" content="${config.seo.twitterHandle}">`);
    }

    const hasJsonLd = $('script[type="application/ld+json"]').length > 0;
    if (!hasJsonLd && config?.siteUrl) {
        const canonical = canonicalUrl || `${config.siteUrl}/${filename || ''}`;
        const logoUrl = config.logoPath ? `${config.siteUrl}/${config.logoPath}` : `${config.siteUrl}/img/logo.png`;

        const schemaData = filename === 'index.html'
            ? {
                "@context": "https://schema.org",
                "@type": "WebSite",
                "name": config.siteName || titleText,
                "url": config.siteUrl,
                "description": description,
                "publisher": {
                    "@type": "Organization",
                    "name": config.siteName || 'FNPulse',
                    "url": config.siteUrl,
                    "logo": {
                        "@type": "ImageObject",
                        "url": logoUrl
                    }
                }
            }
            : {
                "@context": "https://schema.org",
                "@type": "WebPage",
                "name": titleText,
                "url": canonical,
                "description": description,
                "isPartOf": {
                    "@type": "WebSite",
                    "name": config.siteName || 'FNPulse',
                    "url": config.siteUrl
                },
                "publisher": {
                    "@type": "Organization",
                    "name": config.siteName || 'FNPulse',
                    "url": config.siteUrl,
                    "logo": {
                        "@type": "ImageObject",
                        "url": logoUrl
                    }
                }
            };

        head.append(`<script type="application/ld+json">${JSON.stringify(schemaData, null, 2)}</script>`);
    }
}

function normalizeHtmlDocument(html, options = {}) {
    const $ = cheerio.load(html, { xmlMode: false, decodeEntities: false });
    ensureHeadStructure($, options);
    return $.html();
}

module.exports = {
    ensureHeadStructure,
    normalizeHtmlDocument
};
