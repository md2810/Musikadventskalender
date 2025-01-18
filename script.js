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

            // Extrahiere die 5 häufigsten Farben
            const dominantColors = getDominantColors(imageData, 5);

            // CSS-Gradient mit den extrahierten Farben
            const gradient = generateGradient(dominantColors);

            document.body.style.backgroundSize = "300% 300%";
            document.body.style.background = gradient;
        };
    } catch (error) {
        console.error("Fehler beim Generieren des Hintergrunds:", error);
    }
}

// Hilfsfunktion: Extrahiere dominante Farben mit K-Means Clustering
function getDominantColors(data, colorCount) {
    const rgbArray = [];
    for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        rgbArray.push([r, g, b]);
    }

    // Nutze ein K-Means-Clustering-Algorithmus
    return kMeans(rgbArray, colorCount);
}

// Hilfsfunktion: K-Means Clustering Algorithmus
function kMeans(data, k) {
    const centroids = initializeCentroids(data, k);
    let clusters = new Array(k);
    let iterations = 0;

    while (iterations < 10) {
        clusters = data.map((color) => {
            let minDist = Infinity;
            let clusterIdx = 0;
            centroids.forEach((centroid, idx) => {
                const dist = colorDistance(color, centroid);
                if (dist < minDist) {
                    minDist = dist;
                    clusterIdx = idx;
                }
            });
            return clusterIdx;
        });

        centroids.forEach((_, idx) => {
            const clusterColors = data.filter((_, i) => clusters[i] === idx);
            if (clusterColors.length > 0) {
                centroids[idx] = averageColor(clusterColors);
            }
        });

        iterations++;
    }

    return centroids;
}

// Hilfsfunktion: Berechne die durchschnittliche Farbe
function averageColor(colors) {
    const total = colors.reduce(
        (sum, color) => [sum[0] + color[0], sum[1] + color[1], sum[2] + color[2]],
        [0, 0, 0]
    );
    return total.map((sum) => Math.round(sum / colors.length));
}

// Hilfsfunktion: Berechne den Abstand zwischen zwei Farben
function colorDistance(color1, color2) {
    return Math.sqrt(
        (color1[0] - color2[0]) ** 2 +
        (color1[1] - color2[1]) ** 2 +
        (color1[2] - color2[2]) ** 2
    );
}

// Hilfsfunktion: Initialisiere K zufällige Zentroiden
function initializeCentroids(data, k) {
    const centroids = [];
    for (let i = 0; i < k; i++) {
        centroids.push(data[Math.floor(Math.random() * data.length)]);
    }
    return centroids;
}

// Hilfsfunktion: Erzeuge einen CSS-Gradient
function generateGradient(colors) {
    return `
        radial-gradient(ellipse at top left, rgb(${colors[0].join(",")}), transparent),
        radial-gradient(ellipse at top right, rgb(${colors[1].join(",")}), transparent),
        radial-gradient(ellipse at right bottom, rgb(${colors[2].join(",")}), transparent),
        radial-gradient(ellipse at left bottom, rgb(${colors[3].join(",")}), transparent),
        radial-gradient(ellipse at center, rgb(${colors[4].join(",")}), transparent)
    `;
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