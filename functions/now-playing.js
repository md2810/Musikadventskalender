export async function onRequest(context) {
    const cookies = context.request.headers.get("Cookie") || "";
    const match = cookies.match(/spotify_access_token=([^;]+)/);
    const token = match ? match[1] : null;

    if (!token) {
        return new Response("Unauthorized", { status: 401 });
    }

    const response = await fetch("https://api.spotify.com/v1/me/player/currently-playing", {
        headers: { Authorization: `Bearer ${token}` },
    });

    if (response.status === 204 || response.status === 401) {
        return new Response(JSON.stringify({ error: "No song playing or token expired" }), {
            headers: { "Content-Type": "application/json" },
        });
    }

    const data = await response.json();
    return new Response(JSON.stringify(data), { headers: { "Content-Type": "application/json" } });
}
