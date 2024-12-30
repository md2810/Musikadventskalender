// auth.js
const SPOTIFY_CLIENT_ID = process.env.SPOTIFY_CLIENT_ID;
const SPOTIFY_CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET;
const REDIRECT_URI = 'https://musikadventskalender.pages.dev/auth/callback';

const authUrl = `https://accounts.spotify.com/authorize?client_id=${SPOTIFY_CLIENT_ID}&response_type=code&redirect_uri=${REDIRECT_URI}&scope=user-read-currently-playing`;

async function handleRequest(request) {
    const url = new URL(request.url);
    if (url.pathname === '/auth') {
        return Response.redirect(authUrl, 302);
    } else if (url.pathname === '/auth/callback') {
        const code = url.searchParams.get('code');
        if (!code) {
            return new Response('Fehler bei der Authentifizierung', { status: 400 });
        }

        const tokenResponse = await fetch('https://accounts.spotify.com/api/token', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Authorization': 'Basic ' + btoa(SPOTIFY_CLIENT_ID + ':' + SPOTIFY_CLIENT_SECRET)
            },
            body: new URLSearchParams({
                grant_type: 'authorization_code',
                code: code,
                redirect_uri: REDIRECT_URI
            })
        });

        const tokenData = await tokenResponse.json();
        const accessToken = tokenData.access_token;

        // Speichere das Access Token in einem Cookie oder im Session Storage
        return Response.redirect('/', {
            headers: {
                'Set-Cookie': `spotify_access_token=${accessToken}; Path=/; HttpOnly; Secure; SameSite=Strict`
            }
        });
    }
    return new Response('Not Found', { status: 404 });
}

addEventListener('fetch', event => {
    event.respondWith(handleRequest(event.request));
});
