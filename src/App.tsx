import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Lock, KeyRound, ArrowLeft, ShieldAlert } from 'lucide-react';
import { OpeningScreen } from './components/OpeningScreen';
import { AdminPanel } from './components/AdminPanel';
import { GamelanAudio } from './components/GamelanAudio';
import { RSVP } from './components/RSVP';
import { Guest, Comment, Content, Settings } from './types';
import { JavaneseGunungan } from './components/BatikOrnament';

export default function App() {
  // Routing-like states
  const [isAdmin, setIsAdmin] = useState(false);
  const [adminAuthenticated, setAdminAuthenticated] = useState(false);
  const [inviteCode, setInviteCode] = useState<string | null>(null);

  // Core application states
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [errorText, setErrorText] = useState<string | null>(null);

  // Content states loaded from server API
  const [guest, setGuest] = useState<Guest | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [content, setContent] = useState<Content | null>(null);
  const [settings, setSettings] = useState<Settings | null>(null);

  // Admin lockscreen input
  const [adminPassword, setAdminPassword] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);

  // Detect custom invitation codes or admin pathways from URLs
  useEffect(() => {
    const parseUrl = () => {
      const searchParams = new URLSearchParams(window.location.search);
      const codeParam = searchParams.get('code');
      const pathname = window.location.pathname;

      // 1. Check if URL specifies Administrative pathways
      if (pathname === '/admin' || searchParams.get('admin') === 'true') {
        setIsAdmin(true);
        checkAdminSession();
        return;
      }

      // 2. Clear Admin if normal path
      setIsAdmin(false);

      // 3. Extract Guest Code
      let code: string | null = codeParam;
      
      // Handle /i/CODE clean URL formatting
      if (pathname.startsWith('/i/')) {
        const parts = pathname.split('/');
        if (parts[2] && parts[2].trim() !== '') {
          code = parts[2].trim();
        }
      }

      setInviteCode(code);
      fetchInvitationData(code);
    };

    parseUrl();
    
    // Listen for state pops/back actions
    window.addEventListener('popstate', parseUrl);
    return () => window.removeEventListener('popstate', parseUrl);
  }, []);

  // Check if admin is already verified
  const checkAdminSession = async () => {
    setIsLoading(true);
    try {
      const resp = await fetch('/api/admin/verify');
      const data = await resp.json();
      if (data.authenticated) {
        setAdminAuthenticated(true);
      }
    } catch {
      // Ignore
    } finally {
      setIsLoading(false);
    }
  };

  // Main fetch function for public invitation
  const fetchInvitationData = async (code: string | null) => {
    setIsLoading(true);
    setErrorText(null);
    try {
      if (code) {
        // Fetch customized guest details + updates read telemetry
        const response = await fetch(`/api/public/invitation/${code}`);
        if (response.ok) {
          const data = await response.json();
          setGuest(data.guest);
          setComments(data.comments || []);
          setContent(data.content);
          setSettings(data.settings);
        } else {
          // Fallback to general public info if code doesn't exist
          const fallbackResp = await fetch('/api/public/content');
          const fallbackData = await fallbackResp.json();
          setContent(fallbackData.content);
          setSettings(fallbackData.settings);
          // Standard placeholder comments
          const commentsResp = await fetch('/api/public/comments');
          const commentsData = await commentsResp.json();
          setComments(commentsData.comments || []);
          setErrorText('Kode undangan keliru atau khusus dibatasi oleh admin. Kami menampilkan pratinjau umum.');
        }
      } else {
        // No code specified. Load generic design data (e.g. general wedding preview page)
        const response = await fetch('/api/public/content');
        if (response.ok) {
          const data = await response.json();
          setContent(data.content);
          setSettings(data.settings);

          // Comments
          const commentsResp = await fetch('/api/public/comments');
          const commentsData = await commentsResp.json();
          setComments(commentsData.comments || []);
        } else {
          throw new Error('Gagal memuat konfigurasi utama server');
        }
      }
    } catch (err: any) {
      setErrorText('Terjadi gangguan: ' + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Authenticate Admin action
  const handleAdminSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminPassword) return;
    setIsLoggingIn(true);
    setLoginError(null);

    try {
      const resp = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: adminPassword })
      });
      const data = await resp.json();
      if (data.success) {
        setAdminAuthenticated(true);
        setAdminPassword('');
      } else {
        setLoginError(data.error || 'Kata sandi tidak tepat');
      }
    } catch {
      setLoginError('Kegagalan jaringan ke server');
    } finally {
      setIsLoggingIn(false);
    }
  };

  // Terminate admin session
  const handleAdminLogout = async () => {
    try {
      await fetch('/api/admin/logout', { method: 'POST' });
      setAdminAuthenticated(false);
    } catch {
      // Force locally anyway
      setAdminAuthenticated(false);
    }
  };

  // Submit RSVP Callback from main layout
  const handleRsvpSubmit = async (rsvpData: {
    status: string;
    guest_count: number;
    name: string;
    comment: string;
    honeypot?: string;
  }) => {
    // Determine active code (defaults to RIAIQRAM if they are browsing generic preview)
    const activeCode = inviteCode || 'RIAIQRAM';
    try {
      const resp = await fetch(`/api/public/invitation/${activeCode}/rsvp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(rsvpData)
      });
      const data = await resp.json();
      if (data.success) {
        // Update local comment feeds
        setComments(data.comments || []);
        // Update locally stored RSVP attendance metrics
        if (guest) {
          setGuest({
            ...guest,
            status: rsvpData.status as any,
            guest_count: rsvpData.guest_count
          });
        }
        return { success: true };
      }
      return { success: false, error: data.error };
    } catch (err: any) {
      return { success: false, error: 'Koneksi bermasalah: ' + err.message };
    }
  };

  // LOADING SHIM STATE SCREEN
  if (isLoading) {
    return (
      <div className="min-h-screen min-h-dvh bg-stone-950 text-wedding-cream bg-batik-kawung flex flex-col justify-center items-center p-6 text-center">
        <JavaneseGunungan size={100} className="text-gold-gentle opacity-50 mb-6 animate-pulse" />
        <h3 className="font-serif text-lg text-white font-bold tracking-wide">Amemuji Sugeng Rawuh</h3>
        <p className="text-stone-400 text-xs font-mono tracking-widest uppercase mt-2">Memuat Undangan Ria & Iqram...</p>
        <div className="w-16 h-0.5 bg-gold-gentle/30 rounded mt-4 overflow-hidden relative">
          <div className="absolute h-full w-8 bg-gold-shine left-0 animate-[shimmer_1.5s_infinite]"></div>
        </div>
        <style>{`
          @keyframes shimmer {
            0% { transform: translateX(-100%); }
            100% { transform: translateX(200%); }
          }
        `}</style>
      </div>
    );
  }

  // ==========================================
  // CASE A: ADMIN CONTROL PANEL PORTAL
  // ==========================================
  if (isAdmin) {
    if (!adminAuthenticated) {
      // Show elegant admin lock screen
      return (
        <div className="min-h-screen min-h-dvh bg-stone-950 text-wedding-cream bg-batik-kawung flex flex-col justify-center items-center p-6">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-md bg-stone-900 border border-gold-gentle/20 hover:border-gold-gentle/45 rounded-3xl p-8 shadow-2xl relative text-center"
          >
            {/* Soft ornamental Corner borders for lockscreen */}
            <div className="absolute top-2 left-2 w-3 h-3 border-t border-l border-gold-gentle/30"></div>
            <div className="absolute top-2 right-2 w-3 h-3 border-t border-r border-gold-gentle/30"></div>
            <div className="absolute bottom-2 left-2 w-3 h-3 border-b border-l border-gold-gentle/30"></div>
            <div className="absolute bottom-2 right-2 w-3 h-3 border-b border-r border-gold-gentle/30"></div>

            <Lock size={36} className="text-gold-gentle/80 mx-auto mb-4 animate-bounce" />
            <h2 className="font-serif text-xl font-bold text-white tracking-wide">Undangan Admin Gate</h2>
            <p className="text-xs text-stone-400 font-mono tracking-wider uppercase mt-1 mb-6">Security Check Validation</p>

            <form onSubmit={handleAdminSubmit} className="space-y-4">
              <div className="relative text-left">
                <label className="block text-[10px] uppercase font-mono tracking-widest text-[#000000] mb-1">
                  Masukkan Kata Sandi Admin
                </label>
                <div className="relative">
                  <KeyRound size={14} className="absolute left-3.5 top-3.5 text-stone-500" />
                  <input
                    type="password"
                    required
                    placeholder="••••••••"
                    value={adminPassword}
                    onChange={(e) => setAdminPassword(e.target.value)}
                    className="w-full bg-stone-950 border border-stone-800 rounded-xl py-3 pl-10 pr-4 text-xs focus:border-gold-gentle focus:outline-none focus:ring-1 focus:ring-gold-gentle"
                    id="admin-passwd-input"
                  />
                </div>
              </div>

              {loginError && (
                <div className="bg-red-950/40 border border-red-900 text-red-400 p-3 rounded-xl text-center text-xs">
                  {loginError}
                </div>
              )}

              <button
                type="submit"
                disabled={isLoggingIn}
                className="w-full py-3 bg-batik-brown text-white border border-gold-gentle hover:bg-amber-800 rounded-xl text-xs uppercase tracking-widest font-bold cursor-pointer transition-colors"
                id="btn-admin-login-submit"
              >
                {isLoggingIn ? 'Memvalidasi...' : 'Masuk Dashboard'}
              </button>
            </form>

            <div className="mt-6 pt-4 border-t border-stone-850">
              <a
                href="/"
                className="inline-flex items-center gap-1.5 text-stone-400 hover:text-white text-xs font-serif italic"
              >
                <ArrowLeft size={12} />
                <span>Kembali ke Undangan</span>
              </a>
            </div>
          </motion.div>
        </div>
      );
    }

    // Render fully authorized admin suite
    return <AdminPanel onLogout={handleAdminLogout} />;
  }

  // ==========================================
  // CASE B: STANDARD DETAILED DIGITAL INVITATION
  // ==========================================
  return (
    <>
      <AnimatePresence mode="wait">
        {!isOpen ? (
          // Opening Cinematic Cover Section
          <motion.div
            key="opening-screen"
            exit={{ opacity: 0, y: '-100%' }}
            transition={{ duration: 1.2, ease: [0.77, 0, 0.175, 1] }}
            className="fixed inset-0 z-[999]"
          >
            <OpeningScreen
              guestName={guest ? guest.name : null}
              guestCategory={guest ? guest.category : null}
              onOpen={() => setIsOpen(true)}
            />
          </motion.div>
        ) : (
          // Immersive Scroll View Section
          <motion.div
            key="main-invitation"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8 }}
          >
            {/* Optional Alert of Invalid Code fallback warning banner */}
            {errorText && (
              <div className="sticky top-0 bg-amber-900 border-b border-gold-gentle/30 p-3 px-6 text-wedding-cream text-center text-xs z-50 flex items-center justify-between shadow-md">
                <div className="flex items-center gap-2 mx-auto">
                  <ShieldAlert size={14} className="text-gold-shine flex-shrink-0" />
                  <p>{errorText}</p>
                </div>
                <button onClick={() => setErrorText(null)} className="text-white hover:text-gold-shine font-bold">×</button>
              </div>
            )}

            {/* Main scroll elements */}
            {content && settings && (
              <RSVP
                guest={guest}
                comments={comments}
                content={content}
                settings={settings}
                onRsvpSubmit={handleRsvpSubmit}
              />
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Volcanic-Mute Control Music overlay in background */}
      {settings && (
        <GamelanAudio
          url={settings.musicUrl}
          autoplay={false}
        />
      )}
    </>
  );
}
