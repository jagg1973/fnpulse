const http = require('http');

const colors = {
    reset: '\x1b[0m',
    green: '\x1b[32m',
    red: '\x1b[31m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m'
};

function log(message, color = 'reset') {
    console.log(`${colors[color]}${message}${colors.reset}`);
}

function testEndpoint(name, path) {
    return new Promise((resolve) => {
        const req = http.request({
            hostname: 'localhost',
            port: 3000,
            path: path,
            method: 'GET'
        }, (res) => {
            if (res.statusCode === 200) {
                log(`✓ ${name}`, 'green');
                resolve(true);
            } else {
                log(`✗ ${name} (${res.statusCode})`, 'red');
                resolve(false);
            }
            res.resume();
        });
        req.on('error', () => {
            log(`✗ ${name} - Error`, 'red');
            resolve(false);
        });
        req.setTimeout(5000, () => {
            req.destroy();
            resolve(false);
        });
        req.end();
    });
}

async function runTests() {
    log('\n=== FNPulse Admin - New Features Tests ===\n', 'blue');

    let passed = 0;
    let failed = 0;

    log('--- Authors Management ---', 'yellow');
    if (await testEndpoint('Authors List Page', '/authors')) passed++; else failed++;
    if (await testEndpoint('New Author Form', '/authors/new')) passed++; else failed++;

    log('\n--- Ad Banners Management ---', 'yellow');
    if (await testEndpoint('Ad Banners List Page', '/ads')) passed++; else failed++;
    if (await testEndpoint('New Ad Banner Form', '/ads/new')) passed++; else failed++;

    log('\n--- Existing Routes ---', 'yellow');
    if (await testEndpoint('Dashboard', '/')) passed++; else failed++;
    if (await testEndpoint('Articles List', '/articles')) passed++; else failed++;
    if (await testEndpoint('New Article Form', '/articles/new')) passed++; else failed++;
    if (await testEndpoint('Images Page', '/images')) passed++; else failed++;
    if (await testEndpoint('Settings Page', '/settings')) passed++; else failed++;

    log('\n=== Test Summary ===', 'blue');
    log(`Passed: ${passed}`, 'green');
    log(`Failed: ${failed}`, failed > 0 ? 'red' : 'green');
    log(`Total:  ${passed + failed}\n`);

    if (failed === 0) {
        log('🎉 All tests passed!', 'green');
    } else {
        log('⚠️  Some tests failed.', 'yellow');
    }

    process.exit(failed > 0 ? 1 : 0);
}

runTests().catch(error => {
    log(`\n✗ Test suite failed: ${error.message}`, 'red');
    process.exit(1);
});
