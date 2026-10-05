import React from 'react';
import { motion } from 'motion/react';
import {
  ArrowRight,
  CalendarCheck,
  ChevronDown,
  Copy,
  Eye,
  Globe,
  Heart,
  Images,
  Instagram,
  Mail,
  MessageCircle,
  Music4,
  Palette,
  Share2,
  ShieldCheck,
  Sparkles
} from 'lucide-react';
import { BatikDivider, BatikMandala, CornerOrnament } from './BatikOrnament';

const CREATOR_CONTACT = {
  brand: 'Undangan Pernikahan Digital Premium',
  website: 'https://futaikhi.vercel.app',
  whatsapp: '6289636633664',
  instagram: '@futaikhi',
  email: 'futaikhi.fut@gmail.com'
};

const waNumber = CREATOR_CONTACT.whatsapp.replace(/\D/g, '');
const waLink = `https://wa.me/${waNumber}?text=${encodeURIComponent(
  'Halo, saya ingin memesan undangan pernikahan digital. Boleh info paket dan harga untuk tanggal saya?'
)}`;
const igLink = `https://instagram.com/${CREATOR_CONTACT.instagram.replace('@', '')}`;

const FEATURES = [
  {
    icon: ShieldCheck,
    title: 'Tautan Privat per Tamu',
    text: 'Setiap tamu memperoleh kode unik. Undangan tidak bisa dibuka tanpa kode yang benar.'
  },
  {
    icon: CalendarCheck,
    title: 'RSVP & Buku Tamu Digital',
    text: 'Tamu mengonfirmasi kehadiran langsung di halaman Undangan, lengkap denganKolom ucapan.'
  },
  {
    icon: Music4,
    title: 'Musik Gamelan Otomatis',
    text: 'Suara gamelan otomatis menemani setiap bagian, plus hitung mundur menuju hari-H.'
  },
  {
    icon: Images,
    title: 'Galeri Foto & Cerita',
    text: 'Prewedding, galeri foto, dan timeline perjalanan cinta dalam satu halaman.'
  },
  {
    icon: Palette,
    title: 'Desain Premium Bertema Batik',
    text: 'Tampilan tulis Jawa, ornamen gunungan, dan nuansa emas yang khas Jawa.'
  },
  {
    icon: Share2,
    title: 'Mudah Dibagikan',
    text: 'Kirim tautan lewat WhatsApp, atau bagikan tautan UndanganJr. readily tanpa instal aplikasi.'
  }
];

const STEPS = [
  { step: '01', title: 'Kirim Data', text: 'Ceritakan nama pasangan, tanggal, lokasi, dan tamu yang diundang.' },
  { step: '02', title: 'Desain & Aktivasi', text: 'Undangan disusun, lalu tautan beserta kode unik tamu dikirim ke Anda.' },
  { step: '03', title: 'Bagikan & Pantau', text: 'Bagikan tautan ke tamu. Kehadiran dan ucapan tercatat rapi di dashboard.' }
];

export const LandingPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-wedding-cream text-stone-800 bg-paper-texture-no-image">
      <CornerOrnament className="absolute top-3 left-3 text-gold-gentle opacity-40" />
      <CornerOrnament className="absolute top-3 right-3 text-gold-gentle opacity-40" flippedX />

      <header className="sticky top-0 z-50 bg-wedding-cream/85 backdrop-blur-md border-b border-gold-gentle/15">
        <div className="max-w-6xl mx-auto px-5 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <Heart size={16} className="text-batik-brown" />
            <span className="font-display text-xs sm:text-sm font-semibold tracking-wide text-stone-800">
              {CREATOR_CONTACT.brand}
            </span>
          </div>
          <a
            href={waLink}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-batik-brown text-white text-[10px] font-semibold uppercase tracking-widest hover:bg-amber-800 transition-colors"
          >
            <MessageCircle size={13} />
            <span>Pesan Sekarang</span>
          </a>
        </div>
      </header>

      <section className="relative max-w-6xl mx-auto px-5 pt-14 pb-16 text-center">
        <div className="absolute inset-x-0 top-0 -z-10 flex justify-center opacity-10 pointer-events-none">
          <BatikMandala size={420} />
        </div>

        <motion.span
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="inline-block px-4 py-1.5 rounded-full bg-stone-800/5 border border-batik-brown/25 text-batik-brown text-[10px] font-mono uppercase tracking-[0.2em]"
        >
          Premium Digital Wedding Invitation
        </motion.span>

        <motion.h1
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.9 }}
          className="font-display text-3xl sm:text-4xl md:text-5xl font-semibold mt-6 text-stone-900 leading-tight"
        >
          Undangan Pernikahan Digital
          <span className="block text-gold-gradient">yang Elegan &amp; Interaktif</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.9 }}
          className="font-serif italic text-base sm:text-lg text-stone-600 mt-5 max-w-2xl mx-auto leading-relaxed"
        >
          Satu tautan untuk seluruh tamu. Tanpa aplikasi, tanpa cetak, lengkap dengan RSVP, buku tamu
          digital, dan nuansa batik yang hangat.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45, duration: 0.9 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-3 mt-9"
        >
          <a
            href={waLink}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center justify-center gap-2 w-full sm:w-auto px-8 py-3.5 rounded-full bg-gradient-to-r from-batik-brown to-amber-800 text-white text-xs font-semibold uppercase tracking-widest shadow-lg shadow-batik-brown/25 hover:from-amber-800 hover:to-batik-brown transition-all"
          >
            <MessageCircle size={14} />
            <span>Pesan Undangan</span>
          </a>
        </motion.div>

        <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 mt-8 text-[11px] font-mono uppercase tracking-widest text-stone-500">
          <span className="inline-flex items-center gap-1.5">
            <Copy size={12} /> Tautan Unik per Tamu
          </span>
          <span className="inline-flex items-center gap-1.5">
            <CalendarCheck size={12} /> RSVP Otomatis
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Sparkles size={12} /> Desain Custom
          </span>
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-5 py-16">
        <div className="text-center mb-12">
          <h2 className="font-display text-2xl sm:text-3xl font-semibold text-stone-900">Fitur Unggulan</h2>
          <p className="text-xs font-mono uppercase tracking-[0.2em] text-batik-brown/70 mt-2">
            Everything Your Wedding Needs
          </p>
          <div className="mt-6 flex justify-center text-gold-gentle/50">
            <BatikDivider className="w-40" />
          </div>
        </div>

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((feature, idx) => {
            const Icon = feature.icon;
            return (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-60px' }}
                transition={{ delay: (idx % 3) * 0.1, duration: 0.7 }}
                className="group bg-white/70 border border-gold-gentle/15 rounded-2xl p-6 hover:border-batik-brown/40 hover:shadow-xl hover:shadow-batik-brown/10 transition-all relative overflow-hidden"
              >
                <div className="w-11 h-11 rounded-xl bg-batik-brown/10 border border-batik-brown/20 flex items-center justify-center text-batik-brown group-hover:bg-batik-brown group-hover:text-white transition-colors">
                  <Icon size={20} />
                </div>
                <h3 className="font-serif text-lg font-semibold text-stone-900 mt-4">{feature.title}</h3>
                <p className="text-sm text-stone-600 leading-relaxed mt-2">{feature.text}</p>
              </motion.div>
            );
          })}
        </div>
      </section>

      <section className="bg-stone-900 text-wedding-cream py-16 relative overflow-hidden">
        <div className="absolute inset-0 opacity-[0.06] bg-batik-kawung"></div>
        <div className="max-w-6xl mx-auto px-5 relative">
          <div className="text-center mb-12">
            <h2 className="font-display text-2xl sm:text-3xl font-semibold text-gold-gradient">Cara Pemesanan</h2>
            <p className="text-xs font-mono uppercase tracking-[0.2em] text-gold-gentle mt-2">Three Simple Steps</p>
            <div className="mt-6 flex justify-center text-gold-gentle/50">
              <BatikDivider className="w-40" />
            </div>
          </div>

          <div className="grid gap-6 sm:grid-cols-3">
            {STEPS.map((item, idx) => (
              <motion.div
                key={item.step}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-60px' }}
                transition={{ delay: idx * 0.12, duration: 0.7 }}
                className="text-center bg-stone-800/40 border border-gold-gentle/20 rounded-2xl p-7"
              >
                <span className="font-display text-3xl text-gold-shine/70">{item.step}</span>
                <h3 className="font-serif text-lg font-semibold mt-2">{item.title}</h3>
                <p className="text-sm text-stone-300/80 leading-relaxed mt-2">{item.text}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-stone-900 text-wedding-cream py-16 relative overflow-hidden">
        <div className="absolute inset-0 opacity-[0.06] bg-batik-kawung"></div>
        <div className="max-w-3xl mx-auto px-5 relative">
          <div className="text-center mb-10">
            <h2 className="font-display text-2xl sm:text-3xl font-semibold text-gold-gradient">
              Kontak &amp; Pemesanan
            </h2>
            <p className="text-xs font-mono uppercase tracking-[0.2em] text-gold-gentle mt-2">We Are Ready To Help</p>
            <div className="mt-6 flex justify-center text-gold-gentle/50">
              <BatikDivider className="w-40" />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <a
              href={waLink}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-4 bg-stone-800/40 border border-gold-gentle/20 rounded-2xl p-5 hover:border-gold-gentle/50 transition-colors group"
            >
              <div className="w-11 h-11 rounded-xl bg-green-600/20 border border-green-500/30 flex items-center justify-center text-green-400 group-hover:bg-green-600 group-hover:text-white transition-colors flex-shrink-0">
                <MessageCircle size={20} />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] font-mono uppercase tracking-[0.2em] text-stone-400">WhatsApp</p>
              </div>
            </a>

            <a
              href={igLink}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-4 bg-stone-800/40 border border-gold-gentle/20 rounded-2xl p-5 hover:border-gold-gentle/50 transition-colors group"
            >
              <div className="w-11 h-11 rounded-xl bg-pink-600/20 border border-pink-500/30 flex items-center justify-center text-pink-400 group-hover:bg-pink-600 group-hover:text-white transition-colors flex-shrink-0">
                <Instagram size={20} />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] font-mono uppercase tracking-[0.2em] text-stone-400">Instagram</p>
              </div>
            </a>

            <a
              href={`mailto:${CREATOR_CONTACT.email}`}
              className="flex items-center gap-4 bg-stone-800/40 border border-gold-gentle/20 rounded-2xl p-5 hover:border-gold-gentle/50 transition-colors group"
            >
              <div className="w-11 h-11 rounded-xl bg-sky-600/20 border border-sky-500/30 flex items-center justify-center text-sky-400 group-hover:bg-sky-600 group-hover:text-white transition-colors flex-shrink-0">
                <Mail size={20} />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] font-mono uppercase tracking-[0.2em] text-stone-400">Email</p>
              </div>
            </a>

            <a
              href={CREATOR_CONTACT.website}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-4 bg-stone-800/40 border border-gold-gentle/20 rounded-2xl p-5 hover:border-gold-gentle/50 transition-colors group"
            >
              <div className="w-11 h-11 rounded-xl bg-batik-brown/25 border border-batik-brown/40 flex items-center justify-center text-gold-shine group-hover:bg-batik-brown group-hover:text-white transition-colors flex-shrink-0">
                <Globe size={20} />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] font-mono uppercase tracking-[0.2em] text-stone-400">Website</p>
              </div>
            </a>
          </div>

          <div className="text-center mt-10">
            <a
              href={waLink}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center justify-center gap-2 w-full sm:w-72 px-8 py-3.5 rounded-full bg-gradient-to-r from-batik-brown to-amber-800 border-2 border-gold-gentle text-white text-xs font-semibold uppercase tracking-widest hover:from-amber-800 hover:to-batik-brown transition-all"
            >
              <MessageCircle size={14} />
              <span>Chat &amp; Pesan Sekarang</span>
            </a>
            <p className="text-[11px] text-stone-400 mt-4 font-mono tracking-wide">
              Konsultasi gratis · Respons cepat · Tanpa biaya tersembunyi
            </p>
          </div>
        </div>
      </section>

      <footer className="border-t border-gold-gentle/20 py-8 text-center">
        <p className="font-display text-xs tracking-wide text-stone-700">{CREATOR_CONTACT.brand}</p>
        <p className="text-[10px] font-mono uppercase tracking-[0.2em] text-stone-500 mt-2">
          Crafted with Love · Indonesian Digital Wedding Invitation
        </p>
      </footer>
    </div>
  );
};
