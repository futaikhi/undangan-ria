import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
	Heart,
	Send
} from 'lucide-react';
import { InvitationMain } from './InvitationMain';
import { BatikDivider } from './BatikOrnament';
import { Content, Settings, Comment, Guest } from '../types';

interface RSVPProps {
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

export const RSVP: React.FC<RSVPProps> = ({
	guest,
	comments,
	content,
	settings,
	onRsvpSubmit
}) => {

	const [isOpenDetail, setIsOpenDetail] = useState(false);
	// RSVP Form state
	const [rsvpStatus, setRsvpStatus] = useState<'hadir' | 'tidak_hadir'>('hadir');
	const [rsvpCount, setRsvpCount] = useState<number>(1);
	const [rsvpName, setRsvpName] = useState<string>(guest?.name || '');
	const [rsvpComment, setRsvpComment] = useState<string>('');
	const [honeypot, setHoneypot] = useState<string>(''); // anti-spam
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [submitMsg, setSubmitMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

	useEffect(() => {
		if (guest && guest.status != "belum_respon") {
			setIsOpenDetail(true);
		}
	});

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
				setIsOpenDetail(true);
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
		<>
			<AnimatePresence mode="wait">
				{!isOpenDetail ? (
					<div className="relative min-h-screen bg-paper-texture bg-batik-kawung text-stone-80 overflow-hidden">
						{/* RSVP FORM */}
						<section className=" min-h-screen py-24 px-4 bg-stone-900 text-wedding-cream relative" id="section-rsvp">
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
												className={`py-3.5 rounded-xl text-xs uppercase tracking-wider font-semibold border-2 transition-all cursor-pointer ${rsvpStatus === 'hadir'
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
												className={`py-3.5 rounded-xl text-xs uppercase tracking-wider font-semibold border-2 transition-all cursor-pointer ${rsvpStatus === 'tidak_hadir'
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
															className={`w-12 h-12 rounded-xl text-xs font-semibold font-mono border transition-all cursor-pointer flex items-center justify-center ${rsvpCount === num
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
										<span>{isSubmitting ? 'Mengirim...' : 'Kirim Konfirmasi'}</span>
									</button>
								</form>
							</div>
						</section>
					</div>
				) : (
					// Immersive Scroll View Section
					<motion.div
						key="main-invitation"
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						transition={{ duration: 0.8 }}
					>

						{/* Main scroll elements */}
						<InvitationMain
							guest={guest}
							comments={comments}
							content={content}
							settings={settings}
						/>
					</motion.div>
				)}
			</AnimatePresence>
		</>
	);
};
