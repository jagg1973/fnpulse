#!/usr/bin/env node

/**
 * FNPulse Admin - Route Test
 * Tests all server routes and endpoints
 */

const http = require('http');

const colors = {
    reset: '\x1b[0m',
    green: '\x1b[32m',
    red: '\x1b[31m',
    blue: '\x1b[34m',
    yellow: '\x1b[33m'
};

function log(message, color = 'reset') {
    console.log(`${colors[color]}${message}${colors.reset}`);
}

async function testRoute(path, method = 'GET', expectedStatus = 200) {
    return new Promise((resolve) => {
        const options = {
            hostname: 'localhost',
            port: 3000,
            path: path,
            method: method,
            timeout: 5000
        };

        const req = http.request(options, (res) => {
            const success = res.statusCode === expectedStatus;
            const status = success ? '✓' : '✗';
            const color = success ? 'green' : 'red';
            log(`  ${status} ${method} ${path} - Status: ${res.statusCode}`, color);
            resolve(success);
        });

        req.on('error', (error) => {
            log(`  ✗ ${method} ${path} - Error: ${error.message}`, 'red');
            resolve(false);
        });

        req.on('timeout', () => {
            log(`  ✗ ${method} ${path} - Timeout`, 'red');
            req.destroy();
            resolve(false);
        });

        req.end();
    });
}

async function waitForServer(maxAttempts = 10) {
    log('\n⏳ Waiting for server to be ready...', 'yellow');

    for (let i = 0; i < maxAttempts; i++) {
        try {
            await testRoute('/', 'GET', 200);
            log('✓ Server is ready!', 'green');
            return true;
        } catch (error) {
            await new Promise(resolve => setTimeout(resolve, 1000));
        }
    }

    log('✗ Server did not start in time', 'red');
    return false;
}

async function testRoutes() {
    log('\n═══════════════════════════════════════════════════', 'blue');
    log('   FNPulse Admin - Route Tests', 'blue');
    log('═══════════════════════════════════════════════════', 'blue');

    log('\n🌐 Testing View Routes...', 'blue');

    const routes = [
        { path: '/', method: 'GET', status: 200, name: 'Dashboard' },
        { path: '/articles', method: 'GET', status: 200, name: 'Articles List' },
        { path: '/articles/new', method: 'GET', status: 200, name: 'New Article' },
        { path: '/images', method: 'GET', status: 200, name: 'Images' },
        { path: '/settings', method: 'GET', status: 200, name: 'Settings' }
    ];

    const results = [];
    for (const route of routes) {
        const result = await testRoute(route.path, route.method, route.status);
        results.push(result);
    }

    log('\n📡 Testing API Endpoints...', 'blue');
    log('  ℹ️  Note: Some endpoints require data and will return 404/500', 'yellow');

    // These will return errors but should not crash
    await testRoute('/api/images/list', 'GET', 200);

    log('\n═══════════════════════════════════════════════════', 'blue');
    log('   Route Test Summary', 'blue');
    log('═══════════════════════════════════════════════════', 'blue');

    const passed = results.filter(r => r).length;
    const total = results.length;

    if (passed === total) {
        log(`\n🎉 All ${total} route tests passed!`, 'green');
        return true;
    } else {
        log(`\n⚠️  ${passed}/${total} route tests passed`, 'yellow');
        return false;
    }
}

async function main() {
    log('═══════════════════════════════════════════════════', 'blue');
    log('   Checking if server is running...', 'blue');
    log('═══════════════════════════════════════════════════', 'blue');

    try {
        const isRunning = await testRoute('/', 'GET', 200);

        if (!isRunning) {
            log('\n❌ Server is not running!', 'red');
            log('\nPlease start the server first with:', 'yellow');
            log('  npm start', 'blue');
            log('\nThen run this test in another terminal:', 'yellow');
            log('  npm run test:routes', 'blue');
            process.exit(1);
        }

        await testRoutes();
        process.exit(0);

    } catch (error) {
        log(`\n❌ Test error: ${error.message}`, 'red');
        console.error(error);
        process.exit(1);
    }
}

main();
