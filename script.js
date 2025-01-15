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

// Eine Funktion, die den K-Means-Algorithmus vereinfacht implementiert
function kMeansCluster(imageData, k = 5) {
    const totalPixels = imageData.length / 4;
    const points = [];

    // Extrahiere alle Pixel als RGB-Punkte
    for (let i = 0; i < totalPixels; i++) {
        const offset = i * 4;
        const r = imageData[offset];
        const g = imageData[offset + 1];
        const b = imageData[offset + 2];
        points.push([r, g, b]);
    }

    // Initialisiere zufällige "Zentroiden" (K) aus den Punkten
    let centroids = [];
    for (let i = 0; i < k; i++) {
        const randomPoint = points[Math.floor(Math.random() * points.length)];
        centroids.push(randomPoint);
    }

    // K-Means-Algorithmus
    let prevCentroids = Array.from(centroids);
    let clusters = Array(k).fill().map(() => []);

    let converged = false;
    while (!converged) {
        clusters = Array(k).fill().map(() => []); // Leere die Cluster

        // Gruppiere die Punkte basierend auf dem nächsten Centroid
        for (let point of points) {
            let closest = -1;
            let minDistance = Infinity;
            for (let i = 0; i < k; i++) {
                const distance = Math.sqrt(
                    Math.pow(point[0] - centroids[i][0], 2) +
                    Math.pow(point[1] - centroids[i][1], 2) +
                    Math.pow(point[2] - centroids[i][2], 2)
                );
                if (distance < minDistance) {
                    closest = i;
                    minDistance = distance;
                }
            }
            clusters[closest].push(point);
        }

        // Berechne neue Zentroiden
        centroids = centroids.map((_, i) => {
            const cluster = clusters[i];
            const avgColor = cluster.reduce(
                (acc, point) => {
                    acc[0] += point[0];
                    acc[1] += point[1];
                    acc[2] += point[2];
                    return acc;
                },
                [0, 0, 0]
            ).map(sum => sum / cluster.length);
            return avgColor;
        });

        // Überprüfe, ob die Zentroiden sich verändert haben
        converged = centroids.every((centroid, i) => 
            Math.abs(centroid[0] - prevCentroids[i][0]) < 1 &&
            Math.abs(centroid[1] - prevCentroids[i][1]) < 1 &&
            Math.abs(centroid[2] - prevCentroids[i][2]) < 1
        );

        prevCentroids = Array.from(centroids);
    }

    return centroids;
}

function modifyColor(r, g, b, brightnessFactor, saturationFactor) {
    // Helligkeit und Sättigung anpassen
    return {
        r: Math.min(255, Math.max(0, r * brightnessFactor)),
        g: Math.min(255, Math.max(0, g * brightnessFactor)),
        b: Math.min(255, Math.max(0, b * brightnessFactor)),
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

            // Cluster mit K-Means (5 Cluster)
            const dominantColors = kMeansCluster(imageData, 5);

            const colorVariations = [];

            // Für jede Primärfarbe Variationen erzeugen
            dominantColors.forEach(([r, g, b]) => {
                // Dunkel, normal, hell und gesättigt
                colorVariations.push(
                    modifyColor(r, g, b, 0.5, 1), // Dunkel
                    modifyColor(r, g, b, 1, 1), // Original
                    modifyColor(r, g, b, 1.5, 1), // Heller
                    modifyColor(r, g, b, 1, 1.5), // Mehr Sättigung
                    modifyColor(r, g, b, 1.2, 0.8) // Weniger gesättigt
                );
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