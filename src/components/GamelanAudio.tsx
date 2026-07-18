import React, { useEffect, useRef, useState } from 'react';
import { Volume2, VolumeX } from 'lucide-react';

interface GamelanAudioProps {
  url: string;
  autoplay: boolean;
}

export const GamelanAudio: React.FC<GamelanAudioProps> = ({ url, autoplay }) => {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [hasInteracted, setHasInteracted] = useState(false);

  useEffect(() => {
    // Initialize standard Audio ref
    const audio = new Audio(url);
    audio.loop = true;
    audio.volume = 0.45; // Soft ambient volume
    audioRef.current = audio;

    // Handle initial autoplay attempt
    if (autoplay) {
      const playAttempt = () => {
        audio.play()
          .then(() => {
            setIsPlaying(true);
            setHasInteracted(true);
          })
          .catch(() => {
            // Browser blocked autoplay (standard security). Wait for user interaction.
            setIsPlaying(false);
          });
      };

      playAttempt();
    }

    return () => {
      audio.pause();
      audioRef.current = null;
    };
  }, [url, autoplay]);

  // Monitor universal clicks to start music if autoplay was initially blocked
  useEffect(() => {
    const handleFirstClick = () => {
      if (autoplay && !isPlaying && !hasInteracted && audioRef.current) {
        audioRef.current.play()
          .then(() => {
            setIsPlaying(true);
            setHasInteracted(true);
          })
          .catch(() => {});
      }
      // Remove after first trigger
      window.removeEventListener('click', handleFirstClick);
    };

    window.addEventListener('click', handleFirstClick);
    return () => {
      window.removeEventListener('click', handleFirstClick);
    };
  }, [autoplay, isPlaying, hasInteracted]);

  const togglePlayback = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!audioRef.current) return;

    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play()
        .then(() => {
          setIsPlaying(true);
          setHasInteracted(true);
        })
        .catch(() => {});
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-[9999]">
      <button
        onClick={togglePlayback}
        className={`relative flex items-center justify-center w-12 h-12 rounded-full cursor-pointer shadow-lg transition-all duration-300 ${
          isPlaying
            ? 'bg-batik-brown text-gold-shine border-gold-gentle animate-pulse border'
            : 'bg-stone-900 border-stone-800 text-stone-400 border hover:text-white'
        }`}
        id="btn-volume-player"
        title={isPlaying ? "Mute Gamelan" : "Play Gamelan"}
      >
        {/* Animated wave pulses representing active acoustics */}
        {isPlaying && (
          <>
            <span className="absolute inline-flex h-full w-full rounded-full bg-batik-brown opacity-75 animate-ping -z-10"></span>
            <div className="absolute inset-0 flex items-center justify-around px-3 py-4 opacity-30">
              <span className="w-[2px] h-3 bg-gold-shine rounded h-animate-1"></span>
              <span className="w-[2px] h-2 bg-gold-shine rounded h-animate-2"></span>
              <span className="w-[2px] h-4 bg-gold-shine rounded h-animate-3"></span>
            </div>
          </>
        )}

        {isPlaying ? <Volume2 size={20} className="relative z-10" /> : <VolumeX size={18} className="relative z-10" />}
      </button>

      {/* Acoustic wave animation custom headers */}
      <style>{`
        @keyframes soundWave {
          0%, 100% { transform: scaleY(0.6); }
          50% { transform: scaleY(1.3); }
        }
        .h-animate-1 { animation: soundWave 0.8s ease-in-out infinite; }
        .h-animate-2 { animation: soundWave 1.2s ease-in-out infinite 0.2s; }
        .h-animate-3 { animation: soundWave 1s ease-in-out infinite 0.4s; }
      `}</style>
    </div>
  );
};
