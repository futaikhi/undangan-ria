import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Calendar,
  MapPin,
  Clock,
  Heart,
  Copy,
  Check,
  ExternalLink,
  BookOpen,
  Send,
  Instagram,
  QrCode,
  Sparkles,
  Info
} from 'lucide-react';
import { BatikDivider, BatikMandala, CornerOrnament } from './BatikOrnament';
import { Content, Settings, Comment, Guest } from '../types';

interface InvitationMainProps {
  guest: Guest | null;
  comments: Comment[];
  content: Content;
  settings: Settings;
  onRsvpSubmit: (rsvpData: {
    status: string;
    guest_count: number;
    name: string;
    comment: string;
    honeypot?: string;
  }) => Promise<{ success: boolean; error?: string }>;
}

export const InvitationMain: React.FC<InvitationMainProps> = ({
  guest,
  comments,
  content,
  settings,
  onRsvpSubmit
}) => {
  // Real-time Countdown Timer State
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);

  // RSVP Form state
  const [rsvpStatus, setRsvpStatus] = useState<'hadir' | 'tidak_hadir'>('hadir');
  const [rsvpCount, setRsvpCount] = useState<number>(1);
  const [rsvpName, setRsvpName] = useState<string>(guest?.name || '');
  const [rsvpComment, setRsvpComment] = useState<string>('');
  const [honeypot, setHoneypot] = useState<string>(''); // anti-spam
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitMsg, setSubmitMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Get countdown target date from Content (defaults to Akad nikah ISO string)
  const targetDateStr = content.events.akad.isoDate || '2026-09-12T08:00:00+07:00';

  useEffect(() => {
    const calculateTimeLeft = () => {
      const difference = +new Date(targetDateStr) - +new Date();
      let timeLeftVar = { days: 0, hours: 0, minutes: 0, seconds: 0 };

      if (difference > 0) {
        timeLeftVar = {
          days: Math.floor(difference / (1000 * 60 * 60 * 24)),
          hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
          minutes: Math.floor((difference / 1000 / 60) % 60),
          seconds: Math.floor((difference / 1000) % 60)
        };
      }
      setTimeLeft(timeLeftVar);
    };

    calculateTimeLeft();
    const interval = setInterval(calculateTimeLeft, 1000);
    return () => clearInterval(interval);
  }, [targetDateStr]);

  // Handle account number copy helper
  const handleCopy = (accNum: string, idx: number) => {
    navigator.clipboard.writeText(accNum);
    setCopiedIndex(idx);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  // Submit RSVP Form
  const triggerRSVP = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitMsg(null);

    // Spam prevention check
    if (honeypot.trim() !== '') {
      setSubmitMsg({ type: 'error', text: 'Spam terdeteksi.' });
      setIsSubmitting(false);
      return;
    }

    try {
      const resp = await onRsvpSubmit({
        status: rsvpStatus,
        guest_count: rsvpStatus === 'hadir' ? rsvpCount : 0,
        name: rsvpName.trim(),
        comment: rsvpComment.trim(),
        honeypot: honeypot
      });

      if (resp.success) {
        setSubmitMsg({ type: 'success', text: 'Terima kasih! Konfirmasi kehadiran Anda telah tersimpan.' });
        setRsvpComment(''); // Clear input message
      } else {
        setSubmitMsg({ type: 'error', text: resp.error || 'Gagal menyimpan RSVP' });
      }
    } catch (err: any) {
      setSubmitMsg({ type: 'error', text: 'Terjadi kegagalan jaringan: ' + err.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="relative min-h-screen bg-paper-texture bg-batik-kawung text-stone-800 pb-20 overflow-hidden">
      
      {/* 1. HERO SECTION */}
      <section className="relative min-h-screen flex flex-col justify-center items-center px-4 py-16 text-center text-wedding-cream bg-dark-wood relative">
        <div className="absolute inset-0 bg-black/60 z-0"></div>
        
        {/* Large background couple photo (Parallax effect) */}
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-45 mix-blend-overlay z-0" 
          style={{ backgroundImage: `url(${content.bride.photo})` }}
        ></div>

        <CornerOrnament className="absolute top-4 left-4 text-gold-gentle opacity-50 z-10" />
        <CornerOrnament className="absolute top-4 right-4 text-gold-gentle opacity-50 z-10" flippedX />

        <div className="relative z-10 max-w-3xl mx-auto flex flex-col items-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 1 }}
          >
            <BatikMandala size={110} className="text-gold-gentle opacity-80 mb-6" />
          </motion.div>

          <span className="text-[10px] tracking-widest uppercase text-stone-300 font-mono mb-2">WALIMATUL 'URSY</span>
          <h1 className="font-display text-5xl sm:text-6xl md:text-7xl font-semibold text-gold-gradient tracking-wider mt-2 mb-4">
            Ria & Iqram
          </h1>
          
          <BatikDivider />

          {/* Sincere welcoming text */}
          <p className="font-serif italic text-sm md:text-base text-stone-200 px-6 max-w-xl leading-relaxed mt-2 mb-8">
            {content.quote.text}
          </p>
          <span className="text-[10px] uppercase tracking-widest text-gold-gentle font-mono">
            {content.quote.source}
          </span>

          {/* COUNTDOWN TILES */}
          <div className="grid grid-cols-4 gap-3 sm:gap-4 mt-12 w-full max-w-md px-4">
            {[
              { label: 'Hari', val: timeLeft.days },
              { label: 'Jam', val: timeLeft.hours },
              { label: 'Menit', val: timeLeft.minutes },
              { label: 'Detik', val: timeLeft.seconds }
            ].map((col, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1, duration: 0.5 }}
                className="bg-stone-900/80 border border-gold-gentle/20 backdrop-blur-md rounded-xl p-3 flex flex-col items-center justify-center shadow-lg hover:border-gold-gentle/50 transition-colors"
                id={`countdown-${col.label.toLowerCase()}`}
              >
                <span className="font-mono text-xl sm:text-2xl md:text-3xl font-bold text-gold-shine">
                  {col.val.toString().padStart(2, '0')}
                </span>
                <span className="text-[10px] text-stone-400 uppercase tracking-widest mt-1 font-serif">
                  {col.label}
                </span>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Floating Glowing particles (CSS defined in index.css) */}
        <div className="absolute inset-x-0 bottom-0 pointer-events-none h-24 bg-gradient-to-t from-paper-texture to-transparent z-10"></div>
      </section>

      {/* 2. BRIDE & GROOM PROFILE */}
      <section className="relative py-24 px-4 max-w-5xl mx-auto text-center" id="section-profile">
        <span className="text-xs uppercase font-mono tracking-widest text-batik-brown block mb-2">Pasangan Pengantin</span>
        <h2 className="font-display text-3xl sm:text-4xl font-semibold text-stone-900 tracking-wide">
          Sariing Tresno Suci
        </h2>
        <BatikDivider />

        <p className="max-w-2xl mx-auto text-stone-600 font-sans text-sm leading-relaxed mb-16">
          Assalamu’alaikum Warahmatullahi Wabarakatuh.
          Dengan memohon rahmat dan rida Allah SWT, kami bermaksud menyelenggarakan acara pernikahan putra-putri kami:
        </p>

        {/* Grid profile cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 sm:gap-16 px-4">
          
          {/* BRIDE SIDE */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: '-100px' }}
            transition={{ duration: 0.8 }}
            className="flex flex-col items-center group"
          >
            {/* Elegant portrait frame design */}
            <div className="relative w-56 h-72 sm:w-64 sm:h-80 mb-6 rounded-3xl overflow-hidden shadow-2xl border-4 border-double border-gold-gentle group-hover:border-batik-brown transition-colors duration-500">
              <img 
                src={content.bride.photo} 
                alt={content.bride.fullname} 
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-60"></div>
            </div>

            <h3 className="font-serif text-2xl font-bold text-batik-brown mt-2">
              {content.bride.fullname}
            </h3>
            
            <p className="text-xs font-mono tracking-widest text-gold-gentle uppercase mt-1">
              - {content.bride.nickname} -
            </p>

            <p className="text-xs text-stone-500 capitalize mt-3 max-w-xs font-sans leading-relaxed">
              Putri tercinta dari:<br />
              <span className="font-semibold text-stone-700">{content.bride.father}</span><br />
              & <span className="font-semibold text-stone-700">{content.bride.mother}</span>
            </p>

            <a
              href={`https://instagram.com/${content.bride.instagram.replace('@', '')}`}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1 mt-4 px-4 py-1.5 rounded-full border border-stone-200 text-xs text-stone-500 hover:bg-batik-brown hover:text-white hover:border-batik-brown transition-all"
            >
              <Instagram size={12} className="text-pink-600 group-hover:text-white" />
              <span>{content.bride.instagram}</span>
            </a>
          </motion.div>

          {/* GROOM SIDE */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: '-100px' }}
            transition={{ duration: 0.8 }}
            className="flex flex-col items-center group"
          >
            {/* Elegant portrait frame design */}
            <div className="relative w-56 h-72 sm:w-64 sm:h-80 mb-6 rounded-3xl overflow-hidden shadow-2xl border-4 border-double border-gold-gentle group-hover:border-batik-brown transition-colors duration-500">
              <img 
                src={content.groom.photo} 
                alt={content.groom.fullname} 
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-60"></div>
            </div>

            <h3 className="font-serif text-2xl font-bold text-batik-brown mt-2">
              {content.groom.fullname}
            </h3>
            
            <p className="text-xs font-mono tracking-widest text-gold-gentle uppercase mt-1">
              - {content.groom.nickname} -
            </p>

            <p className="text-xs text-stone-500 capitalize mt-3 max-w-xs font-sans leading-relaxed">
              Putra tercinta dari:<br />
              <span className="font-semibold text-stone-700">{content.groom.father}</span><br />
              & <span className="font-semibold text-stone-700">{content.groom.mother}</span>
            </p>

            <a
              href={`https://instagram.com/${content.groom.instagram.replace('@', '')}`}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1 mt-4 px-4 py-1.5 rounded-full border border-stone-200 text-xs text-stone-500 hover:bg-batik-brown hover:text-white hover:border-batik-brown transition-all"
            >
              <Instagram size={12} className="text-pink-600 group-hover:text-white" />
              <span>{content.groom.instagram}</span>
            </a>
          </motion.div>

        </div>
      </section>

      {/* 3. LOVE TIMELINE */}
      <section className="bg-stone-900 text-wedding-cream py-24 px-4 relative overflow-hidden">
        {/* Soft watermark behind timeline */}
        <div className="absolute -right-20 top-1/4 opacity-5 pointer-events-none">
          <BatikMandala size={300} />
        </div>

        <div className="max-w-4xl mx-auto text-center relative z-10">
          <span className="text-xs uppercase font-mono tracking-widest text-gold-gentle block mb-2">Our Story</span>
          <h2 className="font-display text-3xl sm:text-4xl font-semibold text-gold-gradient tracking-wide">
            Rentetan Carita Katresnan
          </h2>
          <BatikDivider />

          {/* Timeline Tree */}
          <div className="relative border-l border-gold-gentle/30 max-w-2xl mx-auto text-left pl-8 mt-16 space-y-12">
            
            {content.story.map((item, i) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-50px' }}
                transition={{ duration: 0.6, delay: i * 0.1 }}
                className="relative"
              >
                {/* Timeline node icon */}
                <div className="absolute -left-[41px] top-1.5 w-6 h-6 rounded-full bg-batik-brown border-2 border-gold-gentle flex items-center justify-center shadow">
                  <Heart size={10} className="text-gold-shine fill-current animate-pulse" />
                </div>

                <div className="bg-stone-850 border border-stone-800 rounded-2xl p-6 shadow-xl hover:border-gold-gentle/40 transition-colors">
                  <span className="font-mono text-xs text-gold-gentle font-bold tracking-widest">{item.year}</span>
                  <h4 className="font-serif text-lg font-bold text-white mt-1 mb-2 tracking-wide">{item.title}</h4>
                  <p className="text-stone-300 text-xs sm:text-sm leading-relaxed font-sans">{item.content}</p>
                </div>
              </motion.div>
            ))}
            
          </div>
        </div>
      </section>

      {/* 4. DETAIL ACARA & MAPS */}
      <section className="py-24 px-4 bg-paper-texture relative" id="section-events">
        <div className="max-w-5xl mx-auto text-center">
          <span className="text-xs uppercase font-mono tracking-widest text-batik-brown block mb-2">Rundown Acara</span>
          <h2 className="font-display text-3xl sm:text-4xl font-semibold text-stone-900 tracking-wide">
            Dinten Kasucian & Resepsi
          </h2>
          <BatikDivider />

          {/* Cards for Akad & Resepsi */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 sm:gap-12 mt-16 px-4">
            
            {/* AKAD */}
            <motion.div
              initial={{ opacity: 0, y: 45 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
              className="bg-white border-2 border-double border-gold-gentle/40 rounded-3xl p-8 sm:p-10 shadow-xl flex flex-col justify-between hover:border-gold-gentle transition-colors duration-300 relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-20 h-20 bg-batik-kawung opacity-5 pointer-events-none"></div>

              <div>
                <div className="w-12 h-12 rounded-full bg-amber-50 border border-gold-gentle flex items-center justify-center mx-auto mb-6 shadow">
                  <Sparkles size={20} className="text-gold-gentle" />
                </div>
                <h3 className="font-serif text-2xl font-bold text-batik-brown tracking-wide mb-2">
                  {content.events.akad.title}
                </h3>
                <div className="h-0.5 w-12 bg-gold-gentle mx-auto mb-6"></div>

                <div className="space-y-4 text-left max-w-xs mx-auto text-stone-600 text-sm">
                  <div className="flex items-start gap-3">
                    <Calendar size={16} className="text-gold-gentle mt-1 flex-shrink-0" />
                    <div>
                      <p className="font-semibold text-stone-800">Hari & Tanggal</p>
                      <p>{content.events.akad.date}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <Clock size={16} className="text-gold-gentle mt-1 flex-shrink-0" />
                    <div>
                      <p className="font-semibold text-stone-800">Waktu</p>
                      <p>{content.events.akad.time}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <MapPin size={16} className="text-gold-gentle mt-1 flex-shrink-0" />
                    <div>
                      <p className="font-semibold text-stone-800">Tempat</p>
                      <p className="font-bold text-stone-900">{content.events.akad.location}</p>
                      <p className="text-xs leading-relaxed text-stone-500 mt-1">{content.events.akad.address}</p>
                    </div>
                  </div>
                </div>
              </div>

              <a
                href={content.events.akad.mapsUrl}
                target="_blank"
                rel="noreferrer"
                className="mt-8 flex items-center justify-center gap-2 py-3 bg-stone-900 hover:bg-batik-brown text-white rounded-full text-xs uppercase tracking-wider font-semibold shadow-lg transition-colors cursor-pointer"
              >
                <MapPin size={14} />
                <span>Petunjuk Lokasi Google Maps</span>
              </a>
            </motion.div>

            {/* RESEPSI */}
            <motion.div
              initial={{ opacity: 0, y: 45 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: 0.1 }}
              className="bg-white border-2 border-double border-gold-gentle/40 rounded-3xl p-8 sm:p-10 shadow-xl flex flex-col justify-between hover:border-gold-gentle transition-colors duration-300 relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-20 h-20 bg-batik-kawung opacity-5 pointer-events-none"></div>

              <div>
                <div className="w-12 h-12 rounded-full bg-amber-50 border border-gold-gentle flex items-center justify-center mx-auto mb-6 shadow">
                  <Heart size={18} className="text-gold-gentle fill-current text-gold-gentle animate-pulse" />
                </div>
                <h3 className="font-serif text-2xl font-bold text-batik-brown tracking-wide mb-2">
                  {content.events.resepsi.title}
                </h3>
                <div className="h-0.5 w-12 bg-gold-gentle mx-auto mb-6"></div>

                <div className="space-y-4 text-left max-w-xs mx-auto text-stone-600 text-sm">
                  <div className="flex items-start gap-3">
                    <Calendar size={16} className="text-gold-gentle mt-1 flex-shrink-0" />
                    <div>
                      <p className="font-semibold text-stone-800">Hari & Tanggal</p>
                      <p>{content.events.resepsi.date}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <Clock size={16} className="text-gold-gentle mt-1 flex-shrink-0" />
                    <div>
                      <p className="font-semibold text-stone-800">Waktu</p>
                      <p>{content.events.resepsi.time}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <MapPin size={16} className="text-gold-gentle mt-1 flex-shrink-0" />
                    <div>
                      <p className="font-semibold text-stone-800">Tempat</p>
                      <p className="font-bold text-stone-900">{content.events.resepsi.location}</p>
                      <p className="text-xs leading-relaxed text-stone-500 mt-1">{content.events.resepsi.address}</p>
                    </div>
                  </div>
                </div>
              </div>

              <a
                href={content.events.resepsi.mapsUrl}
                target="_blank"
                rel="noreferrer"
                className="mt-8 flex items-center justify-center gap-2 py-3 bg-stone-900 hover:bg-batik-brown text-white rounded-full text-xs uppercase tracking-wider font-semibold shadow-lg transition-colors cursor-pointer"
              >
                <MapPin size={14} />
                <span>Petunjuk Lokasi Google Maps</span>
              </a>
            </motion.div>

          </div>

          {/* GOOGLE MAPS EMBED SECTION */}
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 1 }}
            className="mt-16 bg-white border border-stone-200 p-4 rounded-3xl shadow-xl max-w-4xl mx-auto"
          >
            <div className="rounded-2xl overflow-hidden h-72 sm:h-96 border border-stone-150">
              <iframe
                title="Google Maps Location"
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3953.0361009941995!2d110.39861617551307!3d-7.785934492233777!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x2e7a59c0490bf03b%3A0x6b42b8eec4a0af26!2sPendopo%20Agung%20Royal%20Ambarrukmo!5e0!3m2!1sid!2sid!4v1700000000000!5m2!1sid!2sid"
                width="15"
                className="w-full h-full border-0"
                allowFullScreen={true}
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              ></iframe>
            </div>
          </motion.div>

          {/* PROTOKOL KESEHATAN INFO */}
          <div className="mt-12 text-stone-500 text-xs flex items-center justify-center gap-2 max-w-md mx-auto bg-stone-50 border border-stone-100 p-3.5 rounded-2xl">
            <Info size={14} className="text-amber-600 flex-shrink-0" />
            <p className="text-left leading-normal font-sans">
              Demi kelancaran dan kekusyukan bersama, kami menghimbau para tamu undangan untuk hadir tepat waktu sesuai dengan penunjuk rundown di atas.
            </p>
          </div>
        </div>
      </section>

      {/* 5. PHOTO GALLERY MASONRY */}
      <section className="py-24 px-4 bg-stone-900 text-wedding-cream relative" id="section-gallery">
        <div className="max-w-5xl mx-auto text-center">
          <span className="text-xs uppercase font-mono tracking-widest text-gold-gentle block mb-2">Gallery Prewedding</span>
          <h2 className="font-display text-3xl sm:text-4xl font-semibold text-gold-gradient tracking-wide">
            Garising Tresno Sinawang
          </h2>
          <BatikDivider />

          {/* Masonry Layout Grid */}
          <div className="columns-1 sm:columns-2 lg:columns-3 gap-6 space-y-6 mt-16 px-4">
            {content.gallery.map((img) => (
              <motion.div
                key={img.id}
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6 }}
                className="break-inside-avoid relative overflow-hidden rounded-2xl group cursor-pointer border border-stone-800 shadow-xl"
                onClick={() => setSelectedPhoto(img.url)}
              >
                <img
                  src={img.url}
                  alt={img.caption}
                  className="w-full object-cover rounded-2xl group-hover:scale-105 transition-transform duration-550"
                  loading="lazy"
                  referrerPolicy="no-referrer"
                />
                
                {/* Hover overlay caption */}
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-4 text-left">
                  <p className="font-serif italic text-xs text-gold-gentle">{img.caption}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* 6. WEDDING GIFT */}
      <section className="py-24 px-4 bg-paper-texture" id="section-gift">
        <div className="max-w-4xl mx-auto text-center">
          <span className="text-xs uppercase font-mono tracking-widest text-batik-brown block mb-2">Palinggihan Kasucian</span>
          <h2 className="font-display text-3xl sm:text-4xl font-semibold text-stone-900 tracking-wide">
            Kado Nikah Digital
          </h2>
          <BatikDivider />

          <p className="max-w-xl mx-auto text-stone-600 text-sm leading-relaxed mb-12 font-sans">
            Doa restu Anda merupakan karunia terindah bagi kami. Namun jika Anda bermaksud mengirimkan tanda kasih dan kado secara cashless, dapat disalurkan melalui rekening berikut:
          </p>

          {/* Credit cards cards list */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-3xl mx-auto px-4">
            {content.gifts
              .filter(g => g.accountNumber !== 'qris_placeholder_base64_or_text')
              .map((bank, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                className="bg-stone-900 text-wedding-cream rounded-3xl p-6 sm:p-8 shadow-2xl border border-gold-gentle/20 relative overflow-hidden text-left"
              >
                {/* Visual texture patterns inside cashless bank templates */}
                <div className="absolute top-0 right-0 w-24 h-24 bg-batik-kawung opacity-5 pointer-events-none"></div>
                
                <h4 className="font-mono text-lg font-bold text-gold-shine tracking-wider mb-6">
                  {bank.provider.toUpperCase()}
                </h4>

                <p className="text-[10px] text-stone-400 uppercase tracking-widest">Nomor Rekening</p>
                <div className="flex items-center justify-between mt-1 mb-6">
                  <span className="font-mono text-xl text-white font-semibold">
                    {bank.accountNumber}
                  </span>
                  
                  <button
                    onClick={() => handleCopy(bank.accountNumber, i)}
                    className="p-2 py-1.5 rounded-lg bg-stone-800 text-gold-gentle border border-stone-700 hover:border-gold-gentle hover:text-white transition-all text-[10px] flex items-center gap-1 cursor-pointer"
                    title="Salin Nomor Rekening"
                  >
                    {copiedIndex === i ? <Check size={12} className="text-green-400" /> : <Copy size={12} />}
                    <span>{copiedIndex === i ? 'Tersalin' : 'Salin'}</span>
                  </button>
                </div>

                <p className="text-[10px] text-stone-400 uppercase tracking-widest">Atas Nama</p>
                <p className="font-serif font-bold text-md text-stone-200 uppercase mt-0.5">{bank.holder}</p>
              </motion.div>
            ))}
          </div>

          {/* QRIS OPTIONAL WRAPPER */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mt-12 bg-white max-w-sm mx-auto border border-stone-200 rounded-3xl p-6 sm:p-8 shadow-xl text-center"
          >
            <div className="flex justify-center mb-4 text-batik-brown">
              <QrCode size={36} className="text-gold-gentle opacity-80" />
            </div>
            <h4 className="font-serif font-semibold text-stone-900">QRIS Dana Kado Pernikahan</h4>
            <p className="text-stone-500 text-xs font-sans mt-1">Scan QRIS menggunakan aplikasi M-Banking / Dompet Digital Anda (OVO, GoPay, ShopeePay, Dana, LinkAja)</p>

            <div className="bg-stone-50 border border-stone-150 p-4 rounded-2xl my-6 flex justify-center">
              {/* Fake aesthetic QR code vector generating clean visual lines */}
              <svg width="140" height="140" viewBox="0 0 100 100" className="text-stone-900 fill-current">
                <rect x="0" y="0" width="100" height="100" fill="#ffffff" />
                {/* Anchor corners */}
                <rect x="5" y="5" width="25" height="25" fill="currentColor" />
                <rect x="10" y="10" width="15" height="15" fill="#ffffff" />
                <rect x="13" y="13" width="9" height="9" fill="currentColor" strokeWidth="0" />

                <rect x="70" y="5" width="25" height="25" fill="currentColor" />
                <rect x="75" y="10" width="15" height="15" fill="#ffffff" />
                <rect x="78" y="13" width="9" height="9" fill="currentColor" strokeWidth="0" />

                <rect x="5" y="70" width="25" height="25" fill="currentColor" />
                <rect x="10" y="75" width="15" height="15" fill="#ffffff" />
                <rect x="13" y="78" width="9" height="9" fill="currentColor" strokeWidth="0" />

                {/* Random barcode/QR pattern mocks */}
                <rect x="35" y="10" width="10" height="10" fill="currentColor" />
                <rect x="50" y="8" width="15" height="5" fill="currentColor" />
                <rect x="55" y="20" width="8" height="12" fill="currentColor" />
                <rect x="15" y="35" width="40" height="5" fill="currentColor" />
                <rect x="10" y="45" width="10" height="20" fill="currentColor" />
                <rect x="35" y="50" width="20" height="20" fill="currentColor" />
                <rect x="35" y="80" width="30" height="15" fill="currentColor" />
                <rect x="75" y="50" width="20" height="12" fill="currentColor" />
                <rect x="75" y="70" width="10" height="25" fill="currentColor" />
                <rect x="90" y="85" width="5" height="5" fill="currentColor" />
              </svg>
            </div>

            <span className="text-[10px] uppercase font-serif text-gold-gentle font-bold">Ria & Iqram Wedding Cashless Desk</span>
          </motion.div>
        </div>
      </section>

      {/* 7. RSVP FORM */}
      <section className="py-24 px-4 bg-stone-900 text-wedding-cream relative" id="section-rsvp">
        <div className="absolute inset-0 bg-batik-kawung opacity-5 pointer-events-none"></div>

        <div className="max-w-2xl mx-auto text-center relative z-10">
          <span className="text-xs uppercase font-mono tracking-widest text-gold-gentle block mb-2">Konfirmasi Datang</span>
          <h2 className="font-display text-3xl sm:text-4xl font-semibold text-gold-gradient tracking-wide">
            Konfirmasi Kehadiran
          </h2>
          <BatikDivider />

          {/* Guest personalization greeting card inside RSVP layout */}
          {guest && (
            <div className="bg-stone-850 border border-gold-gentle/20 rounded-2xl p-5 mb-8 max-w-lg mx-auto text-stone-200 flex items-center gap-4 text-left shadow-lg">
              <div className="w-10 h-10 rounded-full bg-batik-brown/30 flex items-center justify-center border border-gold-gentle">
                <Heart size={16} className="text-gold-gentle" />
              </div>
              <div className="flex-grow">
                <p className="text-[10px] text-stone-400 uppercase tracking-widest">Tamu Undangan Terhormat</p>
                <p className="text-sm font-semibold font-serif text-white">{guest.name}</p>
                {guest.category && <p className="text-[9px] text-[#cfaf88] uppercase font-mono mt-0.5">Kategori: {guest.category}</p>}
              </div>
            </div>
          )}

          {/* Form */}
          <form onSubmit={triggerRSVP} className="bg-stone-900 border border-stone-800 rounded-3xl p-6 sm:p-10 shadow-2xl max-w-lg mx-auto text-left relative">
            
            {/* Soft ornamental Corner brackets inside dark RSVP layout */}
            <div className="absolute top-2 left-2 w-3 h-3 border-t border-l border-gold-gentle/30"></div>
            <div className="absolute top-2 right-2 w-3 h-3 border-t border-r border-gold-gentle/30"></div>
            <div className="absolute bottom-2 left-2 w-3 h-3 border-b border-l border-gold-gentle/30"></div>
            <div className="absolute bottom-2 right-2 w-3 h-3 border-b border-r border-gold-gentle/30"></div>

            {/* Honeypot Spam detection (Invisible in standard styling) */}
            <div className="hidden">
              <label htmlFor="honey_pot_field">Leave this empty</label>
              <input
                id="honey_pot_field"
                type="text"
                value={honeypot}
                onChange={(e) => setHoneypot(e.target.value)}
                autoComplete="off"
              />
            </div>

            {/* Attendance Toggle */}
            <div className="mb-6">
              <label className="block text-xs uppercase tracking-widest text-stone-300 font-bold mb-3">
                Konfirmasi Kehadiran
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setRsvpStatus('hadir')}
                  className={`py-3.5 rounded-xl text-xs uppercase tracking-wider font-semibold border-2 transition-all cursor-pointer ${
                    rsvpStatus === 'hadir'
                      ? 'bg-batik-brown border-gold-gentle text-white shadow-md'
                      : 'bg-stone-850 border-stone-800 text-stone-400 hover:text-white hover:border-stone-700'
                  }`}
                  id="rsvp-hadir-btn"
                >
                  Saged Rawuh (Hadir)
                </button>
                <button
                  type="button"
                  onClick={() => setRsvpStatus('tidak_hadir')}
                  className={`py-3.5 rounded-xl text-xs uppercase tracking-wider font-semibold border-2 transition-all cursor-pointer ${
                    rsvpStatus === 'tidak_hadir'
                      ? 'bg-batik-brown border-gold-gentle text-white shadow-md'
                      : 'bg-stone-850 border-stone-800 text-stone-400 hover:text-white hover:border-stone-700'
                  }`}
                  id="rsvp-absen-btn"
                >
                  Mboten Saged (Absen)
                </button>
              </div>
            </div>

            {/* Name Input field */}
            <div className="mb-6">
              <label className="block text-xs uppercase tracking-widest text-stone-300 font-bold mb-2">
                Nama Anda
              </label>
              <input
                type="text"
                required
                value={rsvpName}
                onChange={(e) => setRsvpName(e.target.value)}
                placeholder="Masukkan nama lengkap"
                className="w-full bg-stone-850 border border-stone-800 focus:border-gold-gentle focus:outline-none rounded-xl p-3.5 text-xs text-stone-100 transition-colors"
                id="rsvp-input-name"
              />
            </div>

            {/* Guest count (Visible only if HADIR) */}
            <AnimatePresence>
              {rsvpStatus === 'hadir' && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mb-6 overflow-hidden"
                >
                  <label className="block text-xs uppercase tracking-widest text-stone-300 font-bold mb-2">
                    Jumlah Tamu Hadir
                  </label>
                  <div className="flex items-center gap-3">
                    {[1, 2, 3, 4].map((num) => (
                      <button
                        key={num}
                        type="button"
                        onClick={() => setRsvpCount(num)}
                        className={`w-12 h-12 rounded-xl text-xs font-semibold font-mono border transition-all cursor-pointer flex items-center justify-center ${
                          rsvpCount === num
                            ? 'bg-gold-gentle border-gold-shine text-black shadow-lg font-bold'
                            : 'bg-stone-850 border-stone-800 text-stone-300 hover:border-stone-700'
                        }`}
                        id={`rsvp-count-${num}`}
                      >
                        {num}
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Comment Message (Ucapanku) */}
            <div className="mb-6">
              <label className="block text-xs uppercase tracking-widest text-stone-300 font-bold mb-2">
                Pesan / Ucapan (Buku Tamu)
              </label>
              <textarea
                value={rsvpComment}
                onChange={(e) => setRsvpComment(e.target.value)}
                placeholder="Kirimkan limpahan doa restu dan ucapan hangat Anda di sini..."
                rows={4}
                className="w-full bg-stone-850 border border-stone-800 focus:border-gold-gentle focus:outline-none rounded-xl p-3.5 text-xs text-stone-100 placeholder-stone-450 transition-colors"
                id="rsvp-input-comment"
              />
            </div>

            {/* Response Alerts */}
            {submitMsg && (
              <div
                className={`p-4 rounded-xl text-xs mb-6 font-sans leading-normal ${
                  submitMsg.type === 'success'
                    ? 'bg-green-950/40 border border-green-800/60 text-green-300'
                    : 'bg-red-950/40 border border-red-800/60 text-red-300'
                }`}
              >
                {submitMsg.text}
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className={`w-full py-3.5 rounded-xl bg-gradient-to-r from-batik-brown to-amber-800 text-white border border-gold-gentle text-xs uppercase font-semibold tracking-widest shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer ${
                isSubmitting ? 'opacity-50 cursor-not-allowed' : 'hover:from-amber-800 hover:to-batik-brown'
              }`}
              id="rsvp-submit-btn"
            >
              <Send size={12} />
              <span>{isSubmitting ? 'Mengirim...' : 'Kirim Konfirmasi'}</span>
            </button>
          </form>
        </div>
      </section>

      {/* 8. LIVE BOOK COMMENTS VIEW */}
      <section className="py-24 px-4 bg-paper-texture" id="section-messages-list">
        <div className="max-w-4xl mx-auto text-center">
          <span className="text-xs uppercase font-mono tracking-widest text-batik-brown block mb-2">Catatan Ucapan Luhur</span>
          <h2 className="font-display text-3xl sm:text-4xl font-semibold text-stone-900 tracking-wide">
            Doa & Restu Para Tamu
          </h2>
          <BatikDivider />

          {/* Comments Scroller Container */}
          <div className="mt-16 max-w-2xl mx-auto space-y-6 max-h-[500px] overflow-y-auto px-2 py-4 border border-stone-200/50 rounded-2xl bg-stone-50/50 shadow-inner">
            {comments.length === 0 ? (
              <div className="py-12 text-stone-400 font-sans text-xs">
                Belum ada ucapan doa. Jadilah yang pertama memberikan restu indah!
              </div>
            ) : (
              comments.map((comment) => (
                <motion.div
                  key={comment.id}
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="bg-white border border-stone-150 rounded-2xl p-5 text-left shadow-sm relative overflow-hidden"
                >
                  {/* Small decorative ornament in the corner of comment boxes */}
                  <div className="absolute top-0 right-0 w-8 h-8 bg-batik-kawung opacity-[0.03] pointer-events-none"></div>

                  <div className="flex items-center justify-between mb-3">
                    <h5 className="font-serif font-bold text-batik-brown text-sm flex items-center gap-1.5">
                      <Heart size={10} className="text-amber-500 fill-current" />
                      <span>{comment.name}</span>
                    </h5>
                    
                    <span className="text-[9px] font-mono text-stone-400">
                      {new Date(comment.created_at).toLocaleDateString('id-ID', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </span>
                  </div>

                  <p className="text-xs text-stone-600 leading-relaxed font-sans italic">
                    “{comment.comment}”
                  </p>
                </motion.div>
              ))
            )}
          </div>
        </div>
      </section>

      {/* 9. PREMIUM FOOTER */}
      <footer className="bg-stone-900 text-wedding-cream py-20 px-4 text-center border-t border-stone-850 relative">
        <div className="absolute top-0 inset-x-0 h-4 bg-batik-kawung opacity-5 pointer-events-none"></div>

        <div className="max-w-xl mx-auto flex flex-col items-center">
          <BatikMandala size={80} className="text-gold-gentle/60 mb-6" />

          <h3 className="font-display text-2xl font-semibold text-gold-gradient tracking-widest uppercase">
            Ria & Iqram
          </h3>
          <p className="text-[10px] uppercase font-mono tracking-widest text-stone-400 mt-1 mb-8">Walimatul 'Ursy - Yogyakarta</p>

          <p className="text-xs text-stone-400 font-sans leading-relaxed px-6 italic mb-6">
            “Merupakan suatu kehormatan dan kebahagiaan bagi kami apabila Bapak/Ibu/Saudara/i berkenan hadir dan memberikan doa restu kepada kedua mempelai.”
          </p>

          <p className="text-xs text-stone-300 font-serif font-bold">Wassalamu’alaikum Warahmatullahi Wabarakatuh</p>

          <div className="h-[2px] w-20 bg-gold-gentle/40 my-8"></div>
          
          <p className="text-[10px] text-stone-500 font-mono tracking-wider">
            Premium Javanese Wedding Digital Invitation © 2026<br />
            Designed for Ria Lestari & Muhammad Iqram
          </p>
        </div>
      </footer>

      {/* ZOOM LIGHTBOX POPUP MODULE */}
      <AnimatePresence>
        {selectedPhoto && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[10000] bg-black/95 flex flex-col justify-center items-center p-4"
            onClick={() => setSelectedPhoto(null)}
          >
            <button
              onClick={() => setSelectedPhoto(null)}
              className="absolute top-6 right-6 text-stone-400 hover:text-white text-3xl font-sans font-semibold cursor-pointer"
            >
              ×
            </button>
            <motion.img
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              src={selectedPhoto}
              alt="Prewedding enlarged view"
              className="max-w-full max-h-[80vh] object-contain rounded-xl select-none"
              referrerPolicy="no-referrer"
            />
            <p className="text-xs text-stone-400 italic text-center mt-4">Ketuk di mana saja untuk menutup kembali</p>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
};
