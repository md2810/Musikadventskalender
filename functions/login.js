export async function onRequest(context) {
    const CLIENT_ID = context.env.SPOTIFY_CLIENT_ID; // Zugriff auf die Client ID aus den Umgebungsvariablen
    const REDIRECT_URI = context.env.SPOTIFY_REDIRECT_URI; // Zugriff auf die Redirect URI aus den Umgebungsvariablen

    const url = `https://accounts.spotify.com/authorize?client_id=${CLIENT_ID}&response_type=code&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&scope=user-read-currently-playing`;

    return Response.redirect(url, 302); // Weiterleitung zur Spotify-Login-Seite
}
