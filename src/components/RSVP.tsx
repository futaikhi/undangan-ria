import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
	Calendar,
	CheckCircle2,
	Clock,
	Heart,
	MapPin,
	Navigation,
	QrCode,
	Send
} from 'lucide-react';
import { BatikDivider } from './BatikOrnament';
import { CheckinQRCard } from './CheckinQRCard';
import { Content, EVENT_KEYS, EventKey, Guest, Settings } from '../types';

interface RSVPProps {
	guest: Guest | null;
	content: Content;
	settings: Settings;
	onRsvpSubmit: (rsvpData: {
		status: string;
		guest_count: number;
		name: string;
		comment: string;
		event_key?: string | null;
		arrival_time?: string | null;
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
	const [rsvpEventKey, setRsvpEventKey] = useState<EventKey | ''>(guest?.event_key || '');
	const [rsvpArrival, setRsvpArrival] = useState<string>(guest?.arrival_time || '');
	const [rsvpComment, setRsvpComment] = useState<string>('');
	const [honeypot, setHoneypot] = useState<string>(''); // anti-spam
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [submitMsg, setSubmitMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
	const [ticketOpen, setTicketOpen] = useState(false);

	// Daftar acara dari rundown, lengkap dengan jam acara
	const eventOptions = EVENT_KEYS.map((key) => ({
		key,
		title: content.events?.[key]?.title || key,
		time: content.events?.[key]?.time || ''
	}));

	// Nama tamu mengikuti data undangan dan tidak boleh diubah oleh pengunjung
	const isNameLocked = !!guest?.name;
	const isNameTouchedRef = useRef(false);
	useEffect(() => {
		if (isNameTouchedRef.current) return;
		if (guest?.name) setRsvpName(guest.name);
	}, [guest]);

	// Rencana kedatangan (acara + jam datang) diisi ulang dari data tamu,
	// kecuali pengunjung sudah mengubahnya sendiri.
	const isPlanTouchedRef = useRef(false);
	useEffect(() => {
		if (isPlanTouchedRef.current) return;
		if (!guest || rsvpStatus !== 'hadir') return;
		setRsvpEventKey(guest.event_key || '');
		setRsvpArrival(guest.arrival_time || '');
	}, [guest, rsvpStatus]);

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

		// Tamu yang hadir wajib menyatakan acara yang diikuti dan jam datangnya
		if (rsvpStatus === 'hadir') {
			if (!rsvpEventKey) {
				setSubmitMsg({ type: 'error', text: 'Silakan pilih acara yang akan Anda ikuti.' });
				setIsSubmitting(false);
				return;
			}
			if (!rsvpArrival) {
				setSubmitMsg({ type: 'error', text: 'Silakan isi jam datang Anda di lokasi acara.' });
				setIsSubmitting(false);
				return;
			}
		}

		try {
			// Ticket modal auto-opens only on the first "hadir" confirmation
			const wasHadirBefore = guest?.status === 'hadir';

			const resp = await onRsvpSubmit({
				status: rsvpStatus,
				guest_count: rsvpStatus === 'hadir' ? rsvpCount : 0,
				name: rsvpName.trim(),
				comment: rsvpComment.trim(),
				event_key: rsvpStatus === 'hadir' ? rsvpEventKey : null,
				arrival_time: rsvpStatus === 'hadir' ? rsvpArrival : null,
				honeypot: honeypot
			});

			if (resp.success) {
				isPlanTouchedRef.current = true;
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
	const savedEvent = guest?.event_key ? content.events?.[guest.event_key] : null;

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
							{guest?.status === 'hadir' && (savedEvent || guest?.arrival_time) && (
								<p className="text-[11px] text-green-200/80 mt-1 font-mono">
									{savedEvent?.title || 'Acara'}{savedEvent?.time ? ` • ${savedEvent.time}` : ''}
									{guest?.arrival_time ? ` • datang jam ${guest.arrival_time}` : ''}
								</p>
							)}
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

					{/* Acara yang diikuti + Jam datang (Visible only if HADIR) */}
					<AnimatePresence>
						{rsvpStatus === 'hadir' && (
							<motion.div
								initial={{ opacity: 0, height: 0 }}
								animate={{ opacity: 1, height: 'auto' }}
								exit={{ opacity: 0, height: 0 }}
								className="mb-6 overflow-hidden"
							>
								<div role="group" aria-labelledby="rsvp-event-label">
								<p
									id="rsvp-event-label"
									className="block text-xs uppercase tracking-widest text-stone-400 font-bold mb-2"
								>
									Hadir di Acara Apa?
								</p>
								<div className="space-y-2">
									{eventOptions.map(({ key, title, time }) => {
										const isSelected = rsvpEventKey === key;
										return (
											<button
												key={key}
												type="button"
												onClick={() => {
													isPlanTouchedRef.current = true;
													setRsvpEventKey(key);
												}}
												aria-pressed={isSelected}
												className={`w-full text-left px-4 py-3 rounded-xl border transition-all cursor-pointer flex items-center gap-3 ${isSelected
													? 'bg-batik-brown border-gold-gentle shadow-md'
													: 'bg-stone-850 border-stone-800 hover:border-stone-700'
													}`}
												id={`rsvp-event-${key}`}
											>
												<span className={`flex-shrink-0 w-4 h-4 rounded-full border-2 flex items-center justify-center ${isSelected ? 'border-gold-shine' : 'border-stone-600'
													}`}>
													{isSelected && <span className="w-2 h-2 rounded-full bg-gold-shine"></span>}
												</span>
												<span className="min-w-0">
													<span className={`block text-xs font-semibold ${isSelected ? 'text-white' : 'text-stone-300'}`}>
														{title}
													</span>
													{time && (
														<span className="flex items-center gap-1 text-[10px] font-mono text-stone-400 mt-0.5">
															<Clock size={9} className="flex-shrink-0" />
															{time}
														</span>
													)}
												</span>
											</button>
										);
									})}
								</div>

								<label
									htmlFor="rsvp-input-arrival"
									className="block text-xs uppercase tracking-widest text-stone-400 font-bold mt-6 mb-2"
								>
									Jam Datang Anda
								</label>
								<input
									id="rsvp-input-arrival"
									type="time"
									required={rsvpStatus === 'hadir'}
									value={rsvpArrival}
									onChange={(e) => {
										isPlanTouchedRef.current = true;
										setRsvpArrival(e.target.value);
									}}
									className="w-full bg-stone-850 border border-stone-800 focus:border-gold-gentle focus:outline-none focus:ring-1 focus:ring-gold-gentle rounded-xl p-3.5 text-xs text-stone-100 transition-colors [color-scheme:dark]"
								/>
								<p className="text-[10px] text-stone-500 mt-2 leading-relaxed">
									Isi jam berapa Anda diperkirakan tiba di lokasi, agar kami bisa menyiapkan tempat terbaik untuk Anda.
								</p>
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
