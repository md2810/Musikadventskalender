export async function onRequest(context) {
    return new Response(null, {
        status: 302,
        headers: {
            Location: "/",
            "Set-Cookie": "spotify_access_token=; Path=/; HttpOnly; Secure; Max-Age=0",
        },
    });
}
