const spotifyContainer = document.getElementById("spotify-container");
        const spotifyCard = document.getElementById("now-playing");
        const loginButton = document.getElementById("login-button");
        const notPlaying = document.getElementById("not-playing");
        let currentSongCover = "";
    
        async function updateNowPlaying() {
            const response = await fetch("/now-playing");
            if (response.status === 401) {
                spotifyCard.classList.remove("show");
                if (loginButton) {
                    loginButton.style.display = "block";
                }
                return;
            }
    
            if (response.ok) {
                const data = await response.json();
                if (data && data.is_playing) {
                    spotifyCard.classList.add("show");
                    notPlaying.classList.remove("show")
                    if (loginButton) {
                        loginButton.style.display = "none";
                    }
                    document.getElementById("song-title").innerText = data.item.name;
                    document.getElementById("artist-name").innerText = data.item.artists
                        .map((artist) => artist.name)
                        .join(", ");
                    const songCover = data.item.album.images[0].url;
                    document.getElementById("song-cover").style.backgroundImage = `url(${songCover})`;
    
                    if (songCover !== currentSongCover) {
                        currentSongCover = songCover;
                        setDynamicBackground(songCover);
                    }
                } else {
                    spotifyCard.classList.remove("show");
                    notPlaying.classList.add("show");
                    if (loginButton) {
                        loginButton.style.display = "none";
                    }
                }
            } else {
                spotifyCard.classList.remove("show");
                notPlaying.classList.add("show");
                if (loginButton) {
                    loginButton.style.display = "block";
                }
            }
        }
    
        async function setDynamicBackground(imageUrl) {
            try {
                const img = new Image();
                img.crossOrigin = "Anonymous";
                img.src = imageUrl;
    
                img.onload = () => {
                    const canvas = document.createElement("canvas");
                    const context = canvas.getContext("2d");
                    canvas.width = img.width;
                    canvas.height = img.height;
    
                    context.drawImage(img, 0, 0, canvas.width, canvas.height);
    
                    const imageData = context.getImageData(0, 0, canvas.width, canvas.height).data;
    
                    let r1 = 0, g1 = 0, b1 = 0, r2 = 0, g2 = 0, b2 = 0;
                    const totalPixels = imageData.length / 4;
    
                    for (let i = 0; i < totalPixels / 2; i++) {
                        r1 += imageData[i * 4];
                        g1 += imageData[i * 4 + 1];
                        b1 += imageData[i * 4 + 2];
                    }
    
                    for (let i = totalPixels / 2; i < totalPixels; i++) {
                        r2 += imageData[i * 4];
                        g2 += imageData[i * 4 + 1];
                        b2 += imageData[i * 4 + 2];
                    }
    
                    r1 = Math.floor(r1 / (totalPixels / 2));
                    g1 = Math.floor(g1 / (totalPixels / 2));
                    b1 = Math.floor(b1 / (totalPixels / 2));
                    r2 = Math.floor(r2 / (totalPixels / 2));
                    g2 = Math.floor(g2 / (totalPixels / 2));
                    b2 = Math.floor(b2 / (totalPixels / 2));
    
                    const gradient = `linear-gradient(to bottom, rgb(${r1},${g1},${b1}), rgb(${r2},${g2},${b2}))`;
    
                    document.body.style.transition = "background 1s ease";
                    document.body.style.background = gradient;
                };
            } catch (error) {
                console.error("Fehler beim Generieren des Hintergrunds:", error);
            }
        }
    
        function adjustFontSizeAndPadding() {
            const titleCard = document.querySelector(".title-card");
            const titleText = titleCard.querySelector("h1");
    
            // Padding berücksichtigen (Breite reduzieren um 64px)
            const availableWidth = titleCard.clientWidth - 64;
            titleText.style.maxWidth = `${availableWidth}px`;
            titleText.style.margin = "0 auto"; // Zentriert den Text
            titleText.style.wordWrap = "break-word"; // Lange Wörter umbrechen
    
            // Dynamische Schriftgrößenanpassung
            let fontSize = 3; // Initiale Schriftgröße in `em`
            titleText.style.fontSize = `${fontSize}em`;
    
            // Schriftgröße reduzieren, bis der Text passt
            while ((titleText.scrollWidth > titleCard.clientWidth - 64 || titleText.scrollHeight > titleCard.clientHeight) && fontSize > 0.5) {
                fontSize -= 0.1;
                titleText.style.fontSize = `${fontSize}em`;
            }
        }
    
        window.addEventListener("load", () => {
            adjustFontSizeAndPadding();
            setInterval(updateNowPlaying, 1000);
        });
    
        window.addEventListener("resize", adjustFontSizeAndPadding);