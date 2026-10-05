import React from 'react';
import { motion } from 'motion/react';
import { ArrowLeft, MailQuestion, ShieldAlert } from 'lucide-react';
import { JavaneseGunungan, CornerOrnament } from './BatikOrnament';

export const InvalidInvitation: React.FC = () => {
  return (
    <div className="min-h-screen min-h-dvh relative overflow-hidden bg-dark-wood text-wedding-cream bg-batik-kawung flex flex-col items-center justify-center p-6 text-center">
      <CornerOrnament className="absolute top-4 left-4 text-gold-gentle opacity-60" />
      <CornerOrnament className="absolute top-4 right-4 text-gold-gentle opacity-60" flippedX />
      <CornerOrnament className="absolute bottom-4 left-4 text-gold-gentle opacity-60" flippedY />
      <CornerOrnament className="absolute bottom-4 right-4 text-gold-gentle opacity-60" flippedX flippedY />

      <div className="absolute inset-0 pointer-events-none opacity-40">
        <div className="absolute top-[18%] left-[12%] w-3 h-3 bg-gold-gentle rounded-full filter blur-[1px] animate-float-slow"></div>
        <div className="absolute top-[52%] right-[16%] w-4 h-4 bg-batik-brown rounded-full filter blur-[2px] animate-float-medium"></div>
        <div className="absolute bottom-[24%] left-[22%] w-2 h-2 bg-gold-gentle rounded-full filter blur-[1px] animate-float-fast"></div>
      </div>

      <div className="absolute pointer-events-none -bottom-[20%] left-1/2 -translate-x-1/2 w-[350px] h-[350px] bg-gold-gentle/10 rounded-full filter blur-[120px]"></div>

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1, ease: 'easeOut' }}
        className="relative z-10 w-full max-w-md"
      >
        <div className="text-gold-gentle opacity-70 mb-4">
          <JavaneseGunungan size={120} className="mx-auto" />
        </div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.7 }}
          transition={{ delay: 0.3, duration: 0.8 }}
          className="font-serif italic text-xs tracking-widest text-gold-gentle"
        >
          Undangan Pernikahan Ria &amp; Iqram
        </motion.p>

        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 1, type: 'spring' }}
          className="font-display text-2xl sm:text-3xl font-semibold mt-3 text-gold-gradient tracking-wide"
        >
          Undangan Tidak Valid
        </motion.h1>

        <div className="w-16 h-0.5 bg-gold-gentle/40 rounded mx-auto mt-4"></div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 1 }}
          className="text-center w-full bg-stone-900/40 border border-gold-gentle/20 backdrop-blur-md rounded-2xl p-5 mt-6 shadow-xl relative overflow-hidden"
        >
          <div className="absolute top-2 left-2 w-3 h-3 border-t border-l border-gold-gentle/40"></div>
          <div className="absolute top-2 right-2 w-3 h-3 border-t border-r border-gold-gentle/40"></div>
          <div className="absolute bottom-2 left-2 w-3 h-3 border-b border-l border-gold-gentle/40"></div>
          <div className="absolute bottom-2 right-2 w-3 h-3 border-b border-r border-gold-gentle/40"></div>

          <ShieldAlert size={28} className="text-gold-gentle mx-auto mb-3" />
          <p className="text-sm text-wedding-cream/90 leading-relaxed">
            Kode undangan yang Anda buka tidak dikenali oleh sistem kami. Undangan ini mungkin sudah tidak berlaku
            atau tautannya salah.
          </p>

          <p className="text-[11px] text-wedding-cream/60 leading-relaxed mt-5">
            Mohon hubungi pengantin atau tamu yang telah mengundang Anda, untuk memperoleh tautan undangan
            yang baru dan benar.
          </p>
        </motion.div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.5 }}
          transition={{ delay: 1.1, duration: 1 }}
          className="mt-6 text-[10px] font-mono tracking-widest uppercase text-gold-gentle flex items-center justify-center gap-1.5"
        >
          <MailQuestion size={12} />
          <span>Butuh Bantuan? Sampaikan kepada pengantin</span>
        </motion.p>
      </motion.div>
    </div>
  );
};
