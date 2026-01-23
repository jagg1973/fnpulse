export async function onRequest() {
    try {
        const rssUrl = 'https://www.marketwatch.com/rss/topstories';
        const response = await fetch(rssUrl);
        if (!response.ok) {
            return jsonResponse({ error: `Request failed: ${response.status}` }, 502);
        }
        const xml = await response.text();
        const items = xml.match(/<item[\s\S]*?<\/item>/g) || [];
        const headlines = [];
        for (const item of items) {
            const titleMatch = item.match(/<title>([\s\S]*?)<\/title>/i);
            if (!titleMatch) continue;
            let title = titleMatch[1].trim();
            title = title.replace(/^<!\[CDATA\[/, '').replace(/\]\]>$/, '').trim();
            if (title) headlines.push(title);
            if (headlines.length >= 6) break;
        }
        return jsonResponse({ headlines });
    } catch (error) {
        return jsonResponse({ error: error.message }, 500);
    }
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
