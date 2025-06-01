import React, { useState, useEffect, useCallback, useRef } from 'react';

const MusicAdventCalendar = () => {
  const [nowPlaying, setNowPlaying] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [showAd, setShowAd] = useState(false);
  const [currentCover, setCurrentCover] = useState('');
  const [backgroundGradients, setBackgroundGradients] = useState('');
  const canvasRef = useRef(null);

  // Check URL parameters on mount
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const showAdParam = urlParams.get('showAd') === 'true';
    setShowAd(showAdParam);
  }, []);

  // Keyboard event handlers
  useEffect(() => {
    const handleKeyPress = (event) => {
      if (event.key === 'L' || event.key === 'l') {
        console.log('Taste "L" gedrückt, Weiterleitung nach /logout...');
        window.location.href = '/logout';
      }

      if (event.key === 'A' || event.key === 'a') {
        console.log('Taste "A" gedrückt, Toggle Ad...');
        const urlParams = new URLSearchParams(window.location.search);
        const currentShowAd = urlParams.get('showAd');
        const newShowAd = currentShowAd === 'true' ? 'false' : 'true';
        const newUrl = `${window.location.pathname}?showAd=${newShowAd}`;
        window.location.href = newUrl;
      }
    };

    document.addEventListener('keydown', handleKeyPress);
    return () => document.removeEventListener('keydown', handleKeyPress);
  }, []);

  // Get dominant color from image data
  const getDominantColor = useCallback((imageData) => {
    const colorMap = new Map();
    const tolerance = 30;
    
    function findSimilarColor(r, g, b) {
      for (let [key, value] of colorMap.entries()) {
        let [kr, kg, kb] = key.split(',').map(Number);
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
    return dominantColor.split(',').map(Number);
  }, []);

  // Set dynamic background based on album cover
  const setDynamicBackground = useCallback(async (imageUrl) => {
    try {
      const img = new Image();
      img.crossOrigin = 'Anonymous';
      img.src = imageUrl;
      
      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
      });

      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);

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

      const gradients = colors.map((color, index) => {
        let xPos = (index % gridSize) / (gridSize - 1) * 100;
        let yPos = Math.floor(index / gridSize) / (gridSize - 1) * 100;
        return `radial-gradient(ellipse at ${xPos}% ${yPos}%, rgb(${color.join(',')}), transparent)`;
      }).join(',\n');

      setBackgroundGradients(gradients);
    } catch (error) {
      console.error('Fehler beim Laden des Bildes:', error);
    }
  }, [getDominantColor]);

  // Update now playing data
  const updateNowPlaying = useCallback(async () => {
    try {
      const response = await fetch('/now-playing');
      
      if (response.status === 401) {
        setIsAuthenticated(false);
        setNowPlaying(null);
        return;
      }

      if (response.ok) {
        const data = await response.json();
        
        if (data && data.is_playing) {
          setIsAuthenticated(true);
          setNowPlaying(data);
          
          const songCover = data.item.album.images[0].url;
          if (songCover !== currentCover) {
            setCurrentCover(songCover);
            await setDynamicBackground(songCover);
          }
        } else {
          setNowPlaying(null);
        }
      } else {
        setIsAuthenticated(false);
        setNowPlaying(null);
      }
    } catch (error) {
      console.error('Error updating now playing:', error);
      setIsAuthenticated(false);
      setNowPlaying(null);
    }
  }, [currentCover, setDynamicBackground]);

  // Check initial authentication and start polling
  useEffect(() => {
    const checkAuth = async () => {
      const response = await fetch('/now-playing');
      if (response.status === 401) {
        window.location.href = '/login';
      }
    };

    checkAuth();
    updateNowPlaying();
    
    const interval = setInterval(updateNowPlaying, 1000);
    return () => clearInterval(interval);
  }, [updateNowPlaying]);

  // Dynamic background styles
  const backgroundStyle = {
    backgroundImage: backgroundGradients || `
      radial-gradient(ellipse at top left, #D32F2F, transparent),
      radial-gradient(ellipse at top right, #FFA000, transparent),
      radial-gradient(ellipse at right bottom, #0288D1, transparent),
      radial-gradient(ellipse at left bottom, #388E3C, transparent),
      radial-gradient(ellipse at center, #FBC02D, transparent)
    `,
    backgroundSize: '300% 300%',
    animation: 'moveBackground 20s infinite linear'
  };

  return (
    <div 
      className="min-h-screen flex flex-col items-center justify-center overflow-hidden relative select-none"
      style={backgroundStyle}
    >
      <style jsx>{`
        @import url('https://fonts.googleapis.com/css2?family=Product+Sans:wght@100;300;400;500;700;900&display=swap');
        
        body {
          font-family: 'Product Sans', sans-serif;
          -webkit-font-smoothing: antialiased;
          -moz-osx-font-smoothing: grayscale;
        }

        @keyframes moveBackground {
          0% { background-position: 0% 0%; }
          25% { background-position: 100% 0%; }
          50% { background-position: 100% 100%; }
          75% { background-position: 0% 100%; }
          100% { background-position: 0% 0%; }
        }

        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }

        @keyframes slideIn {
          from { transform: scale(0.9) translateY(30px); opacity: 0; }
          to { transform: scale(1) translateY(0); opacity: 1; }
        }

        .animate-fade-in {
          animation: fadeIn 0.8s ease-out forwards;
        }

        .animate-slide-in {
          animation: slideIn 0.6s ease-out forwards;
        }

        .glass-morphism {
          background: rgba(255, 255, 255, 0.6);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255, 255, 255, 0.2);
        }

        .cover-shadow {
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
        }
      `}</style>

      {/* Main Cards Container */}
      <div 
        className={`w-full flex flex-col items-center justify-center gap-5 transition-all duration-700 ease-in-out ${
          showAd ? 'mr-96' : ''
        }`}
      >
        {/* Title Card */}
        <div className="flex flex-col justify-center items-center p-8 rounded-3xl w-96 glass-morphism animate-fade-in mb-5">
          <h1 className="text-5xl font-bold text-gray-800 text-center m-0 leading-tight">
            Musikadventskalender
          </h1>
        </div>

        {/* Spotify Container */}
        <div className="flex flex-col items-center w-full text-center">
          {/* Now Playing Card */}
          <div 
            className={`flex flex-col justify-center items-center p-8 glass-morphism rounded-3xl w-96 gap-4 transition-all duration-1000 ease-in-out ${
              nowPlaying && isAuthenticated ? 'opacity-100 animate-slide-in' : 'opacity-0'
            }`}
          >
            {nowPlaying && (
              <>
                <div 
                  className="w-96 h-96 bg-black bg-cover bg-center rounded-2xl mb-4 cover-shadow transition-all duration-500 ease-in-out"
                  style={{
                    backgroundImage: `url(${nowPlaying.item.album.images[0].url})`,
                  }}
                />
                <div className="text-center">
                  <p className="font-bold text-gray-800 text-3xl m-0 break-words leading-tight">
                    {nowPlaying.item.name}
                  </p>
                  <p className="text-gray-600 text-2xl m-0 break-words mt-2">
                    {nowPlaying.item.artists.map(artist => artist.name).join(', ')}
                  </p>
                </div>
              </>
            )}
          </div>

          {/* Login Button */}
          {!isAuthenticated && (
            <button
              onClick={() => window.location.href = '/login'}
              className="bg-green-500 hover:bg-green-600 text-white border-none rounded-3xl px-5 py-3 text-xl cursor-pointer transition-all duration-300 ease-in-out transform hover:scale-105 animate-fade-in"
            >
              Spotify Login
            </button>
          )}
        </div>

        {/* Not Playing Card */}
        <div 
          className={`flex flex-col justify-center items-center p-8 rounded-3xl glass-morphism fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 mt-5 transition-all duration-700 ease-in-out ${
            !nowPlaying && isAuthenticated ? 'opacity-100 animate-slide-in' : 'opacity-0 pointer-events-none'
          } ${showAd ? 'right-96 left-1/4' : ''}`}
        >
          <h1 className="text-5xl font-bold text-gray-800 text-center m-0">
            Gleich geht's los...
          </h1>
        </div>
      </div>

      {/* Ad Card */}
      {showAd && (
        <div className="flex flex-col justify-center items-center p-8 bg-white bg-opacity-80 rounded-3xl w-1/2 fixed top-1/2 right-5 transform -translate-y-1/2 text-center shadow-lg backdrop-blur-sm z-50 h-auto animate-slide-in">
          <div className="overflow-hidden rounded-2xl mb-4">
            <video
              className="w-full h-full block m-0 p-0 border-none outline-none bg-transparent"
              autoPlay
              muted
              loop
            >
              <source src="/ad.mp4" type="video/mp4" />
            </video>
          </div>
          <p className="text-5xl font-bold text-gray-800 mt-8 mb-0">
            Winterball Tickets jetzt erhältlich!
          </p>
        </div>
      )}
    </div>
  );
};

export default MusicAdventCalendar;