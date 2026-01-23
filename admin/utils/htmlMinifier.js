const { minify } = require('html-minifier-terser');

function minifyHtml(html) {
    return minify(html, {
        collapseWhitespace: true,
        removeComments: true,
        removeRedundantAttributes: true,
        removeScriptTypeAttributes: true,
        removeStyleLinkTypeAttributes: true,
        useShortDoctype: true,
        minifyCSS: true,
        minifyJS: true,
        keepClosingSlash: true
    });
}

module.exports = {
    minifyHtml
};
