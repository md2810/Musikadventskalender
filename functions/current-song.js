// current-song.js
async function handleRequest(request) {
    const cookies = request.headers.get('Cookie') || '';
    const accessToken = cookies.split(';').find(cookie => cookie.trim().startsWith('spotify_access_token')).split('=')[1];

    if (!accessToken) {
        return new Response('Nicht authentifiziert', { status: 401 });
    }

    const response = await fetch('https://api.spotify.com/v1/me/player/currently-playing', {
        headers: {
            'Authorization': `Bearer ${accessToken}`
        }
    });

    if (response.status === 204) {
        return new Response('Keine Musik abgespielt', { status: 200 });
    }

    const songData = await response.json();
    const song = {
        name: songData.item.name,
        artist: songData.item.artists.map(artist => artist.name).join(', '),
        image: songData.item.album.images[0].url
    };

    return new Response(JSON.stringify({ song }), {
        headers: { 'Content-Type': 'application/json' }
    });
}

addEventListener('fetch', event => {
    event.respondWith(handleRequest(event.request));
});
