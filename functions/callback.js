export async function onRequest(context) {
    const CLIENT_ID = context.env.SPOTIFY_CLIENT_ID; // Zugriff auf Umgebungsvariablen
    const CLIENT_SECRET = context.env.SPOTIFY_CLIENT_SECRET;
    const REDIRECT_URI = context.env.SPOTIFY_REDIRECT_URI;

    const TOKEN_URL = "https://accounts.spotify.com/api/token";
    const code = context.request.url.split("code=")[1];

    const response = await fetch(TOKEN_URL, {
        method: "POST",
        headers: {
            "Content-Type": "application/x-www-form-urlencoded",
            Authorization: `Basic ${btoa(`${CLIENT_ID}:${CLIENT_SECRET}`)}`,
        },
        body: new URLSearchParams({
            grant_type: "authorization_code",
            code: code,
            redirect_uri: REDIRECT_URI, // Nutzt die gespeicherte Variable
        }),
    });

    const data = await response.json();

    if (data.access_token) {
        return new Response(null, {
            status: 302,
            headers: {
                Location: "/",
                "Set-Cookie": `spotify_access_token=${data.access_token}; Path=/; HttpOnly; Secure`,
            },
        });
    } else {
        return new Response("Login fehlgeschlagen", { status: 400 });
    }
}
