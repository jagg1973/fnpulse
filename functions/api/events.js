export async function onRequest() {
    try {
        const eventsUrl = 'https://api.tradingeconomics.com/calendar/country/united%20states?c=guest:guest&f=json';
        const response = await fetch(eventsUrl);
        if (!response.ok) {
            return jsonResponse({ error: `Request failed: ${response.status}` }, 502);
        }
        const data = await response.json();
        const now = new Date();
        const events = data
            .map(item => ({
                date: new Date(item.Date || item.date || item.datetime),
                event: item.Event || item.EventDescription || item.Title || 'Market Event',
                detail: item.Forecast || item.Actual || item.Previous || item.Consensus || 'Details pending'
            }))
            .filter(item => !Number.isNaN(item.date.getTime()) && item.date >= now)
            .sort((a, b) => a.date - b.date)
            .slice(0, 4)
            .map(item => ({
                date: item.date.toISOString(),
                event: item.event,
                detail: item.detail
            }));
        return jsonResponse({ events });
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
