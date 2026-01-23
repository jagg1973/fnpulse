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

    const hasJsonLd = $('script[type="application/ld+json"]').length > 0;
    if (!hasJsonLd && config?.siteUrl) {
        const description = $('meta[name="description"]').attr('content') || config.siteDescription || '';
        const canonical = $('link[rel="canonical"]').attr('href') || `${config.siteUrl}/${filename || ''}`;
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
