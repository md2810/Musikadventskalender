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

function isColorInRange(color, referenceColor, tolerance) {
    const [r, g, b] = color;
    const [refR, refG, refB] = referenceColor;
    return (
        Math.abs(r - refR) <= tolerance &&
        Math.abs(g - refG) <= tolerance &&
        Math.abs(b - refB) <= tolerance
    );
}

function generateColorVariations(baseColor) {
    const [r, g, b] = baseColor;
    return [
        modifyColor(r, g, b, 0.5, 1), // Dunkel
        modifyColor(r, g, b, 1, 1),   // Original
        modifyColor(r, g, b, 1.5, 1), // Heller
        modifyColor(r, g, b, 1, 1.5), // Mehr Sättigung
        modifyColor(r, g, b, 1.2, 0.8), // Weniger gesättigt
    ];
}

function getDominantColors(imageData, colorCount = 5) {
    const colorMap = {};
    const totalPixels = imageData.length / 4;

    // Zähle jede Farbe und speichere sie im colorMap-Objekt
    for (let i = 0; i < totalPixels; i++) {
        const offset = i * 4;
        const r = imageData[offset];
        const g = imageData[offset + 1];
        const b = imageData[offset + 2];

        const colorKey = `${r},${g},${b}`; // Farbe als String speichern, um sie eindeutig zu identifizieren

        if (colorMap[colorKey]) {
            colorMap[colorKey]++;
        } else {
            colorMap[colorKey] = 1;
        }
    }

    // Konvertiere das colorMap in ein Array und sortiere nach Häufigkeit
    const sortedColors = Object.entries(colorMap)
        .map(([colorKey, count]) => {
            const [r, g, b] = colorKey.split(',').map(Number);
            return { color: [r, g, b], count };
        })
        .sort((a, b) => b.count - a.count); // Sortiere absteigend nach Häufigkeit

    // Extrahiere die top `colorCount` Farben
    return sortedColors.slice(0, colorCount).map(item => item.color);
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

            // Extrahiere die 5 häufigsten Farben
            const dominantColors = getDominantColors(imageData);

            const chosenColors = [];
            const tolerance = 30; // Toleranzbereich (z.B. ±30 für jede Farbe)

            for (let color of dominantColors) {
                // Wenn die Farbe nicht in den Bereich der bereits gewählten Farben fällt, wähle sie
                let isValid = true;
                for (let chosenColor of chosenColors) {
                    if (isColorInRange(color, chosenColor, tolerance)) {
                        isValid = false;
                        break;
                    }
                }

                // Wenn gültig, füge sie der Liste der gewählten Farben hinzu
                if (isValid) {
                    chosenColors.push(color);
                }

                // Wenn wir 5 gültige Farben haben, stoppen wir
                if (chosenColors.length >= 5) break;
            }

            // Erzeuge Variationen für jede Primärfarbe
            const colorVariations = [];
            chosenColors.forEach(([r, g, b]) => {
                const variations = generateColorVariations([r, g, b]);
                colorVariations.push(...variations);
            });

            // CSS-Gradient mit den erzeugten Farben
            const gradient = `
                radial-gradient(ellipse at top left, rgb(${colorVariations[0].r},${colorVariations[0].g},${colorVariations[0].b}), transparent),
                radial-gradient(ellipse at top right, rgb(${colorVariations[1].r},${colorVariations[1].g},${colorVariations[1].b}), transparent),
                radial-gradient(ellipse at right bottom, rgb(${colorVariations[2].r},${colorVariations[2].g},${colorVariations[2].b}), transparent),
                radial-gradient(ellipse at left bottom, rgb(${colorVariations[3].r},${colorVariations[3].g},${colorVariations[3].b}), transparent),
                radial-gradient(ellipse at center, rgb(${colorVariations[4].r},${colorVariations[4].g},${colorVariations[4].b}), transparent)
            `;

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