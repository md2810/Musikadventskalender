const SPOTIFY_CLIENT_ID = process.env.SPOTIFY_CLIENT_ID;
const SPOTIFY_CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET;
const REDIRECT_URI = process.env.REDIRECT_URI;  // Die Umgebungsvariable für die Redirect-URL

// 1. Weiterleitung zur Spotify-Login-Seite
const authUrl = (state) => {
    return `https://accounts.spotify.com/authorize?client_id=${SPOTIFY_CLIENT_ID}&response_type=code&redirect_uri=${REDIRECT_URI}&scope=user-read-currently-playing&state=${state}`;
};

// 2. Callback-Route, die nach erfolgreicher Anmeldung von Spotify aufgerufen wird
async function handleRequest(request) {
    const url = new URL(request.url);
    
    // Wenn die Anfrage zur Authentifizierung kommt, leite zur Spotify-Anmeldeseite
    if (url.pathname === '/auth') {
        const state = generateRandomState(); // Zufallswert für die CSRF-Prävention
        const redirectUrl = authUrl(state);
        return Response.redirect(redirectUrl, 302);
    }

    // Wenn der Benutzer nach der Anmeldung zurückkommt
    else if (url.pathname === '/auth/callback') {
        const code = url.searchParams.get('code');
        const state = url.searchParams.get('state');
        
        // Sicherheitsüberprüfung (CSRF)
        if (!state || state !== getStateFromCookies(request)) {
            return new Response('CSRF-Fehler', { status: 400 });
        }

        // Code gegen Token tauschen
        if (code) {
            const tokenResponse = await fetch('https://accounts.spotify.com/api/token', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'Authorization': 'Basic ' + btoa(SPOTIFY_CLIENT_ID + ':' + SPOTIFY_CLIENT_SECRET),
                },
                body: new URLSearchParams({
                    grant_type: 'authorization_code',
                    code: code,
                    redirect_uri: REDIRECT_URI,
                }),
            });

            const tokenData = await tokenResponse.json();
            if (tokenData.error) {
                return new Response('Fehler bei der Token-Anforderung', { status: 400 });
            }

            const accessToken = tokenData.access_token;
            const refreshToken = tokenData.refresh_token;

            // Access-Token in einem Cookie speichern
            return Response.redirect('/', {
                headers: {
                    'Set-Cookie': `spotify_access_token=${accessToken}; Path=/; HttpOnly; Secure; SameSite=Strict`,
                    'Set-Cookie': `spotify_refresh_token=${refreshToken}; Path=/; HttpOnly; Secure; SameSite=Strict`
                }
            });
        }

        return new Response('Fehler: Kein Code erhalten', { status: 400 });
    }

    return new Response('Nicht gefunden', { status: 404 });
}

// Zufallswert für die CSRF-Prävention generieren
function generateRandomState() {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

// Den gespeicherten State aus den Cookies holen
function getStateFromCookies(request) {
    const cookies = request.headers.get('Cookie') || '';
    const stateCookie = cookies.split(';').find(cookie => cookie.trim().startsWith('spotify_state='));
    return stateCookie ? stateCookie.split('=')[1] : null;
}

addEventListener('fetch', event => {
    event.respondWith(handleRequest(event.request));
});
