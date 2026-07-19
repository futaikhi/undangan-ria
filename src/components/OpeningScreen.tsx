import React, { useEffect } from 'react';
import { motion } from 'motion/react';
import { Mail, Calendar } from 'lucide-react';
import { JavaneseGunungan, CornerOrnament } from './BatikOrnament';

interface OpeningScreenProps {
  guestName: string | null;
  guestCategory: string | null;
  onOpen: () => void;
}

export const OpeningScreen: React.FC<OpeningScreenProps> = ({ guestName, guestCategory, onOpen }) => {
  useEffect(() => {
    const setAppHeight = () => {
      const doc = document.documentElement;
      doc.style.setProperty('--app-height', `${window.innerHeight}px`);
    };

    setAppHeight();
    window.addEventListener('resize', setAppHeight);

    return () => {
      window.removeEventListener('resize', setAppHeight);
    };
  }, []);
  return (
    <div className="relative h-[var(--app-height)] flex flex-col justify-between overflow-hidden bg-dark-wood text-wedding-cream bg-batik-kawung p-6 z-[9990]">
      {/* Absolute Corners Decoration */}
      <CornerOrnament className="absolute top-4 left-4 text-gold-gentle opacity-60" />
      <CornerOrnament className="absolute top-4 right-4 text-gold-gentle opacity-60" flippedX />
      <CornerOrnament className="absolute bottom-4 left-4 text-gold-gentle opacity-60" flippedY />
      <CornerOrnament className="absolute bottom-4 right-4 text-gold-gentle opacity-60" flippedX flippedY />

      {/* Background Floating Ornaments representing glowing traditional elements */}
      <div className="absolute inset-0 pointer-events-none opacity-40">
        <div className="absolute top-[15%] left-[10%] w-3 h-3 bg-gold-gentle rounded-full filter blur-[1px] animate-float-slow"></div>
        <div className="absolute top-[45%] right-[15%] w-4 h-4 bg-batik-brown rounded-full filter blur-[2px] animate-float-medium"></div>
        <div className="absolute bottom-[20%] left-[20%] w-2 h-2 bg-gold-gentle rounded-full filter blur-[1px] animate-float-fast"></div>
      </div>

      {/* Header Arabic / Traditional Calligraphy Phrase */}
      <div className="text-center pt-8 z-10">
        <motion.p
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 0.8 }}
          transition={{ duration: 1.5 }}
          className="font-serif italic text-xs tracking-widest text-gold-gentle"
        >
          Mugi Pinaringan Karahayon lan Kanugrahan Gusti
        </motion.p>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.5 }}
          transition={{ duration: 2 }}
          className="text-[10px] tracking-widest text-[#000000] mt-1"
        >
          - WALIMATUL 'URSY -
        </motion.p>
      </div>

      {/* Main Couple Name & Gunungan Centerpiece */}
      <div className="flex flex-col items-center justify-center flex-grow py-4 z-10 text-center">
        {/* Animated Gunungan */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1.8, ease: 'easeOut' }}
          className="text-gold-gentle opacity-80 mb-2"
        >
          <JavaneseGunungan size={150} />
        </motion.div>

        {/* Short invitation preface */}
        <motion.span
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.6 }}
          transition={{ delay: 0.4, duration: 1 }}
          className="text-[10px] tracking-widest uppercase text-black"
        >
          The Wedding Invitation Of
        </motion.span>

        {/* Bride & Groom names */}
        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 1.5, type: 'spring' }}
          className="font-display text-4xl sm:text-5xl md:text-6xl font-semibold mt-4 text-gold-gradient tracking-wide"
        >
          Ria & Iqram
        </motion.h1>

        {/* Date visual mockup */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.7 }}
          transition={{ delay: 1, duration: 1 }}
          className="flex items-center gap-2 mt-4 text-[11px] font-mono tracking-widest text-black"
        >
          <Calendar size={12} className="text-gold-gentle" />
          <span>SABTU, 12 SEPTEMBER 2026</span>
        </motion.div>
      </div>

      {/* Guest Greeting Board & Entrance Action */}
      <div className="flex flex-col items-center justify-end pb-8 z-10 w-full max-w-md mx-auto">
        {guestName ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.2, duration: 1 }}
            className="text-center w-full bg-gold-900/60 border border-gold-gentle/20 backdrop-blur-md rounded-xl p-5 mb-6 shadow-2xl relative overflow-hidden"
          >
            {/* Soft inner corner borders for luxury look */}
            <div className="absolute top-2 left-2 w-3 h-3 border-t border-l border-gold-gentle/40"></div>
            <div className="absolute top-2 right-2 w-3 h-3 border-t border-r border-gold-gentle/40"></div>
            <div className="absolute bottom-2 left-2 w-3 h-3 border-b border-l border-gold-gentle/40"></div>
            <div className="absolute bottom-2 right-2 w-3 h-3 border-b border-r border-gold-gentle/40"></div>

            <p className="text-xs uppercase tracking-widest text-[#000000] opacity-80 mb-2">Kepada Yth. Bapak/Ibu/Saudara/i</p>
            <h2 className="font-serif text-lg md:text-xl font-semibold text-black tracking-wide truncate ">
              {guestName}
            </h2>
            {guestCategory && (
              <span className="inline-block mt-2 px-3 py-0.5 rounded-full bg-batik-brown/30 border border-gold-gentle/30 text-[9px] font-mono uppercase text-black tracking-wider">
                {guestCategory}
              </span>
            )}
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.8 }}
            transition={{ delay: 1.2, duration: 1 }}
            className="text-center mb-6"
          >
            <span className="inline-block px-3 py-1 rounded bg-stone-900/40 border border-stone-800 text-[10px] uppercase text-black font-mono tracking-widest">
              Premium Digital Wedding Invitation
            </span>
          </motion.div>
        )}

        {/* Pulse Button Buka Undangan */}
        <motion.button
          onClick={onOpen}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          transition={{ delay: 1.4, duration: 0.8 }}
          className="relative flex items-center justify-center gap-2 w-full sm:w-64 py-3.5 bg-gradient-to-r from-batik-brown to-amber-800 border-2 border-gold-gentle rounded-full text-white font-sans text-xs uppercase font-semibold tracking-widest shadow-lg shadow-black/60 hover:from-amber-800 hover:to-batik-brown cursor-pointer transition-all duration-300"
          id="btn-buka-undangan"
        >
          <Mail size={14} className="animate-bounce" />
          <span>Buka Undangan</span>
        </motion.button>
      </div>

      {/* Styled backdrop shine */}
      <div className="absolute pointer-events-none -bottom-[20%] left-1/2 -translate-x-1/2 w-[350px] h-[350px] bg-gold-gentle/10 rounded-full filter blur-[120px]"></div>
    </div>
  );
};
