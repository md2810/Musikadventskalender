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

async function setDynamicBackground(imageUrl) {
    try {
        // Erstelle ein neues Image-Objekt
        const img = new Image();
        img.crossOrigin = "Anonymous";
        img.src = imageUrl;
        
        await new Promise((resolve, reject) => {
            img.onload = resolve;
            img.onerror = reject;
        });

        // Erstelle ein Canvas-Element
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);

        // Bestimme die Tile-Größe
        const gridSize = 10;
        const tileWidth = img.width / gridSize;
        const tileHeight = img.height / gridSize;
        const colors = [];

        for (let y = 0; y < gridSize; y++) {
            for (let x = 0; x < gridSize; x++) {
                const imageData = ctx.getImageData(
                    x * tileWidth,
                    y * tileHeight,
                    tileWidth,
                    tileHeight
                );
                colors.push(getDominantColor(imageData));
            }
        }

        // Setze den Hintergrund mit radialen Gradienten
        let gradients = colors.map((color, index) => {
            let xPos = (index % gridSize) / (gridSize - 1) * 100;
            let yPos = Math.floor(index / gridSize) / (gridSize - 1) * 100;
            return `radial-gradient(ellipse at ${xPos}% ${yPos}%, rgb(${color.join(",")}), transparent)`;
        }).join(",\n");

        document.body.style.backgroundImage = gradients;
    } catch (error) {
        console.error("Fehler beim Laden des Bildes:", error);
    }
}

function getDominantColor(imageData) {
    const colorMap = new Map();
    const tolerance = 30; // Toleranz für ähnliche Farben
    
    function findSimilarColor(r, g, b) {
        for (let [key, value] of colorMap.entries()) {
            let [kr, kg, kb] = key.split(",").map(Number);
            if (
                Math.abs(kr - r) < tolerance &&
                Math.abs(kg - g) < tolerance &&
                Math.abs(kb - b) < tolerance
            ) {
                return key;
            }
        }
        return null;
    }
    
    for (let i = 0; i < imageData.data.length; i += 4) {
        const r = imageData.data[i];
        const g = imageData.data[i + 1];
        const b = imageData.data[i + 2];
        
        const similarKey = findSimilarColor(r, g, b);
        if (similarKey) {
            colorMap.set(similarKey, colorMap.get(similarKey) + 1);
        } else {
            colorMap.set(`${r},${g},${b}`, 1);
        }
    }
    
    let dominantColor = [...colorMap.entries()].reduce((a, b) => (b[1] > a[1] ? b : a))[0];
    return dominantColor.split(",").map(Number);
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