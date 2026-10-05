import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
	Calendar,
	CheckCircle2,
	Heart,
	MapPin,
	Navigation,
	QrCode,
	Send
} from 'lucide-react';
import { BatikDivider } from './BatikOrnament';
import { CheckinQRCard } from './CheckinQRCard';
import { Content, Guest, Settings } from '../types';

interface RSVPProps {
	guest: Guest | null;
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

export const RSVP: React.FC<RSVPProps> = ({ guest, content, settings, onRsvpSubmit }) => {
	const hasResponded = !!guest && guest.status !== 'belum_respon';

	// RSVP Form state, seeded from the stored guest attendance
	const [rsvpStatus, setRsvpStatus] = useState<'hadir' | 'tidak_hadir'>(
		guest?.status === 'tidak_hadir' ? 'tidak_hadir' : 'hadir'
	);
	const [rsvpCount, setRsvpCount] = useState<number>(
		guest?.guest_count && guest.guest_count > 0 ? guest.guest_count : 1
	);
	const [rsvpName, setRsvpName] = useState<string>(guest?.name || '');
	const [rsvpComment, setRsvpComment] = useState<string>('');
	const [honeypot, setHoneypot] = useState<string>(''); // anti-spam
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [submitMsg, setSubmitMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
	const [ticketOpen, setTicketOpen] = useState(false);

	// Nama tamu mengikuti data undangan dan tidak boleh diubah oleh pengunjung
	const isNameLocked = !!guest?.name;
	const isNameTouchedRef = useRef(false);
	useEffect(() => {
		if (isNameTouchedRef.current) return;
		if (guest?.name) setRsvpName(guest.name);
	}, [guest]);

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
			// Ticket modal auto-opens only on the first "hadir" confirmation
			const wasHadirBefore = guest?.status === 'hadir';

			const resp = await onRsvpSubmit({
				status: rsvpStatus,
				guest_count: rsvpStatus === 'hadir' ? rsvpCount : 0,
				name: rsvpName.trim(),
				comment: rsvpComment.trim(),
				honeypot: honeypot
			});

			if (resp.success) {
				setSubmitMsg({
					type: 'success',
					text: rsvpStatus === 'hadir'
						? 'Terima kasih! Konfirmasi kehadiran Anda telah tersimpan. Tiket QR check-in Anda terbit.'
						: 'Terima kasih! Konfirmasi kehadiran Anda telah tersimpan.'
				});
				if (rsvpStatus === 'hadir' && !wasHadirBefore) {
					setTicketOpen(true);
				}
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

	const respondedStatus = guest?.status === 'hadir' ? 'HADIR' : 'TIDAK HADIR';

	return (
		<section className="relative py-24 px-4 bg-stone-900 text-wedding-cream overflow-hidden" id="section-rsvp">
			<div className="absolute inset-0 bg-batik-kawung opacity-5 pointer-events-none"></div>

			<div className="max-w-2xl mx-auto text-center relative z-10">
				<h2 className="font-display text-3xl sm:text-4xl font-semibold text-gold-gradient tracking-wide">
					Konfirmasi Kehadiran
				</h2>
				<BatikDivider />

				{/* Already responded notice */}
				{hasResponded && (
					<div className="bg-green-950/30 border border-green-800/50 text-green-300 rounded-2xl p-4 mb-6 max-w-lg mx-auto text-left flex items-start gap-3" id="rsvp-status-banner">
						<CheckCircle2 size={16} className="mt-0.5 flex-shrink-0" />
						<div>
							<p className="text-xs font-semibold">
								Konfirmasi Anda tersimpan: {respondedStatus}
								{guest?.status === 'hadir' && guest.guest_count > 0 ? ` (${guest.guest_count} orang)` : ''}
							</p>
							<p className="text-[11px] text-stone-400 mt-1 leading-relaxed">
								Ingin mengubah jawaban? Silakan perbarui formulir di bawah.
							</p>
						</div>
					</div>
				)}

				{/* Form */}
				<form onSubmit={triggerRSVP} className="relative z-20 bg-stone-900 border border-stone-800 rounded-3xl p-6 sm:p-10 shadow-2xl max-w-lg mx-auto text-left pointer-events-auto">

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
						<label className="block text-xs uppercase tracking-widest text-stone-400 font-bold mb-3">
							Konfirmasi Kehadiran
						</label>
						<div className="grid grid-cols-2 gap-3">
							<button
								type="button"
								onClick={() => setRsvpStatus('hadir')}
								className={`py-3.5 rounded-xl text-xs uppercase tracking-wider font-semibold border-2 transition-all cursor-pointer ${rsvpStatus === 'hadir'
									? 'bg-batik-brown border-gold-gentle text-white shadow-md'
									: 'bg-stone-850 border-stone-800 text-stone-400 hover:text-white hover:border-stone-700'
									}`}
								id="rsvp-hadir-btn"
							>
								Hadir
							</button>
							<button
								type="button"
								onClick={() => setRsvpStatus('tidak_hadir')}
								className={`py-3.5 rounded-xl text-xs uppercase tracking-wider font-semibold border-2 transition-all cursor-pointer ${rsvpStatus === 'tidak_hadir'
									? 'bg-batik-brown border-gold-gentle text-white shadow-md'
									: 'bg-stone-850 border-stone-800 text-stone-400 hover:text-white hover:border-stone-700'
									}`}
								id="rsvp-absen-btn"
							>
								Tidak Hadir
							</button>
						</div>
					</div>

					{/* Name Input field */}
					<div className="mb-6">
						<label className="block text-xs uppercase tracking-widest text-stone-400 font-bold mb-2">
							Nama Anda
						</label>
						<input
							type="text"
							required={!isNameLocked}
							readOnly={isNameLocked}
							aria-readonly={isNameLocked}
							value={rsvpName}
							onChange={(e) => {
								isNameTouchedRef.current = true;
								setRsvpName(e.target.value);
							}}
							placeholder="Masukkan nama lengkap"
							autoComplete="name"
							enterKeyHint="done"
							inputMode="text"
							spellCheck={false}
							className={`w-full border rounded-xl p-3.5 text-xs transition-colors ${isNameLocked
								? 'bg-stone-850/60 border-stone-800 text-stone-300 cursor-default'
								: 'bg-stone-850 border-stone-800 text-stone-100 focus:border-gold-gentle focus:outline-none focus:ring-1 focus:ring-gold-gentle cursor-text'
								}`}
							id="rsvp-input-name"
						/>
						{isNameLocked && (
							<p className="text-[10px] text-stone-500 mt-2 leading-relaxed">
								Nama terisi otomatis dari data undangan dan tidak dapat diubah.
							</p>
						)}
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
								<label className="block text-xs uppercase tracking-widest text-stone-400 font-bold mb-2">
									Jumlah Tamu Hadir
								</label>
								<div className="flex items-center gap-3">
									{[1, 2, 3, 4].map((num) => (
										<button
											key={num}
											type="button"
											onClick={() => setRsvpCount(num)}
											className={`w-12 h-12 rounded-xl text-xs font-semibold font-mono border transition-all cursor-pointer flex items-center justify-center ${rsvpCount === num
												? 'bg-gold-gentle border-gold-shine text-stone-400 shadow-lg font-bold'
												: 'bg-stone-850 border-stone-800 text-stone-400 hover:border-stone-700'
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
						<label className="block text-xs uppercase tracking-widest text-stone-400 font-bold mb-2">
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
							className={`p-4 rounded-xl text-xs mb-6 font-sans leading-normal ${submitMsg.type === 'success'
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
					className={`w-full py-3.5 rounded-xl bg-gradient-to-r from-batik-brown to-amber-800 text-white border border-gold-gentle text-xs uppercase font-semibold tracking-widest shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer ${isSubmitting ? 'opacity-50 cursor-not-allowed' : 'hover:from-amber-800 hover:to-batik-brown'
						}`}
					id="rsvp-submit-btn"
				>
					<Send size={12} />
					<span>{isSubmitting ? 'Mengirim...' : 'Konfirmasi'}</span>
				</button>

				{/* Check-in ticket entry: opens the ticket modal for confirmed guests */}
				{guest?.status === 'hadir' && settings && (
					<button
						type="button"
						onClick={() => setTicketOpen(true)}
						className="mt-4 w-full py-3.5 rounded-xl bg-gradient-to-r from-gold-gentle to-gold-shine text-stone-950 border border-gold-shine text-xs uppercase font-bold tracking-widest shadow-lg flex items-center justify-center gap-2 transition-all hover:from-gold-shine hover:to-gold-gentle cursor-pointer"
						id="checkin-qr-open-btn"
					>
						<QrCode size={14} />
						<span>Lihat / Simpan Tiket Check-in</span>
					</button>
				)}
			</form>

			{/* Check-in ticket modal */}
			{guest?.status === 'hadir' && settings && (
				<CheckinQRCard
					guest={guest}
					content={content}
					settings={settings}
					open={ticketOpen}
					onClose={() => setTicketOpen(false)}
				/>
			)}
		</div>
		</section>
	);
};
