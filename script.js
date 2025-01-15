const spotifyContainer = document.getElementById("spotify-container");
const spotifyCard = document.getElementById("now-playing");
const loginButton = document.getElementById("login-button");
const notPlaying = document.getElementById("not-playing");
const cards = document.getElementById("cards");
const adCard = document.getElementById("ad-card");
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

function increaseSaturation(r, g, b, factor = 1.2) {
    const max = Math.max(r, g, b);
    return {
        r: Math.min(255, r + (max - r) * factor),
        g: Math.min(255, g + (max - g) * factor),
        b: Math.min(255, b + (max - b) * factor),
    };
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

            const totalPixels = imageData.length / 4;
            const sectionPixels = Math.floor(totalPixels / 5); // 5 Abschnitte

            const colors = Array(5).fill(0).map(() => ({ r: 0, g: 0, b: 0 })); // Farben initialisieren

            // Farben berechnen
            for (let section = 0; section < 5; section++) {
                const startPixel = section * sectionPixels;
                const endPixel = section === 4 ? totalPixels : (section + 1) * sectionPixels;

                for (let i = startPixel; i < endPixel; i++) {
                    const offset = i * 4;
                    colors[section].r += imageData[offset];
                    colors[section].g += imageData[offset + 1];
                    colors[section].b += imageData[offset + 2];
                }

                const pixelCount = section === 4 
                    ? totalPixels - startPixel 
                    : sectionPixels;

                colors[section].r = Math.floor(colors[section].r / pixelCount);
                colors[section].g = Math.floor(colors[section].g / pixelCount);
                colors[section].b = Math.floor(colors[section].b / pixelCount);

                // Farbsättigung erhöhen
                colors[section] = increaseSaturation(colors[section].r, colors[section].g, colors[section].b);
            }

            // CSS-Gradient erstellen
            const gradient = `
                radial-gradient(ellipse at top left, rgb(${colors[0].r},${colors[0].g},${colors[0].b}), transparent),
                radial-gradient(ellipse at top right, rgb(${colors[1].r},${colors[1].g},${colors[1].b}), transparent),
                radial-gradient(ellipse at right bottom, rgb(${colors[2].r},${colors[2].g},${colors[2].b}), transparent),
                radial-gradient(ellipse at left bottom, rgb(${colors[3].r},${colors[3].g},${colors[3].b}), transparent),
                radial-gradient(ellipse at center, rgb(${colors[4].r},${colors[4].g},${colors[4].b}), transparent)
            `;

            document.body.style.background = gradient;
            document.body.style.backgroundSize = "300% 300%";
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

async function refreshLogin() {
    const response = await fetch("/now-playing");
    if (response.status === 401) {
        window.location.href = "/login";
    }
}

function getQueryParam(param) {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get(param);
}

function showAdIfRequested() {
    if (getQueryParam('showAd') === 'true') {
        cards.classList.add("moved");
        notPlaying.classList.add("moved");
        adCard.classList.add("show");
    } else {
        cards.classList.remove("moved");
        notPlaying.classList.remove("moved");
        adCard.classList.remove("show");
    }
}

document.addEventListener("DOMContentLoaded", () => {
    // Eventlistener für Tastatureingaben
    document.addEventListener("keydown", (event) => {
        if (event.key === "L" || event.key === "l") {
            console.log("Taste 'L' gedrückt, Weiterleitung nach /logout...");
            window.location.href = "/logout";
        }

        if (event.key === "A" || event.key === "a") {
            console.log("Taste 'A' gedrückt, Ausführung der Aktion...");

            // Aktuellen Wert von ?showAd abrufen
            const urlParams = new URLSearchParams(window.location.search);
            const currentShowAd = urlParams.get("showAd");
            const newShowAd = currentShowAd === "true" ? "false" : "true";

            const newUrl = `${window.location.pathname}?showAd=${newShowAd}`;
            console.log(`Weiterleitung zur URL: ${newUrl}`);
            window.location.href = newUrl;
        }
    });
});

window.addEventListener("load", () => {
    adjustFontSizeAndPadding();
    setInterval(updateNowPlaying, 1000);
});

window.addEventListener("resize", adjustFontSizeAndPadding);