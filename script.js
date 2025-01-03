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

            let r1 = 0, g1 = 0, b1 = 0;
            let r2 = 0, g2 = 0, b2 = 0;
            let r3 = 0, g3 = 0, b3 = 0;

            const totalPixels = imageData.length / 4;
            const sectionPixels = Math.floor(totalPixels / 3); // Aufteilung in Drittel

            // Erste Farbe (oberes Drittel)
            for (let i = 0; i < sectionPixels; i++) {
                const offset = i * 4;
                r1 += imageData[offset];
                g1 += imageData[offset + 1];
                b1 += imageData[offset + 2];
            }

            // Zweite Farbe (mittleres Drittel)
            for (let i = sectionPixels; i < sectionPixels * 2; i++) {
                const offset = i * 4;
                r2 += imageData[offset];
                g2 += imageData[offset + 1];
                b2 += imageData[offset + 2];
            }

            // Dritte Farbe (unteres Drittel)
            for (let i = sectionPixels * 2; i < totalPixels; i++) {
                const offset = i * 4;
                r3 += imageData[offset];
                g3 += imageData[offset + 1];
                b3 += imageData[offset + 2];
            }

            // Durchschnittswerte berechnen
            r1 = Math.floor(r1 / sectionPixels);
            g1 = Math.floor(g1 / sectionPixels);
            b1 = Math.floor(b1 / sectionPixels);

            r2 = Math.floor(r2 / sectionPixels);
            g2 = Math.floor(g2 / sectionPixels);
            b2 = Math.floor(b2 / sectionPixels);

            r3 = Math.floor(r3 / (totalPixels - sectionPixels * 2));
            g3 = Math.floor(g3 / (totalPixels - sectionPixels * 2));
            b3 = Math.floor(b3 / (totalPixels - sectionPixels * 2));

            // CSS-Gradient erstellen
            const gradient = `radial-gradient(circle, rgb(${r1},${g1},${b1}), rgb(${r2},${g2},${b2}), rgb(${r3},${g3},${b3}))`;

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
    const adButton = document.getElementById("ad-button");
    let clickCount = 0;
    const resetDelay = 1000; // Zeit in Millisekunden, nach der der Klickzähler zurückgesetzt wird

    if (adButton) {
        console.log("adButton gefunden!");
        
        adButton.addEventListener("click", () => {
            clickCount++;
            console.log(`Button wurde ${clickCount} Mal geklickt`);

            if (clickCount === 3) {
                console.log("Dreimal geklickt, Weiterleitung wird ausgeführt...");
                
                clickCount = 0; // Zähler zurücksetzen

                // Aktuellen Wert von ?showAd abrufen
                const urlParams = new URLSearchParams(window.location.search);
                const currentShowAd = urlParams.get("showAd");
                console.log(`Aktueller Wert von showAd: ${currentShowAd}`);

                // Ziel-URL berechnen
                const newShowAd = currentShowAd === "true" ? "false" : "true"; // Gegenteil des aktuellen Werts
                console.log(`Ziel-URL wird geändert zu: ?showAd=${newShowAd}`);
                
                const newUrl = `${window.location.pathname}?showAd=${newShowAd}`;

                // Weiterleitung
                window.location.href = newUrl;
            }

            // Klick-Zähler nach einer gewissen Zeit zurücksetzen
            setTimeout(() => {
                clickCount = 0;
                console.log("Klick-Zähler nach Timeout zurückgesetzt");
            }, resetDelay);
        });
    } else {
        console.error("Button mit ID 'ad-button' wurde nicht gefunden!");
    }
});

window.addEventListener("load", () => {
    adjustFontSizeAndPadding();
    setInterval(updateNowPlaying, 1000);
});

window.addEventListener("resize", adjustFontSizeAndPadding);