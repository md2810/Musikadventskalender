# Musikadventskalender

A site made to be hosted on Cloudflare Pages to display the Song currently playing on Spotify.

## Hosting

Fork the repository and adjust the title in "title-card; h1" to any title you want. Host the repository on Cloudflare Pages and create an app on [https://developer.spotify.com/] then add your redirect URI here (usually [https://your-cloudflare-hostname.pages.dev/callback]) and copy your Spotify Client ID and Client Secret. After that, you just need to add them as "SPOTIFY_CLIENT_ID", "SPOTIFY_CLIENT_SECRET" and "SPOTIFY_REDIRECT_URI" in the enviornment variables. Now the app should work.

#
