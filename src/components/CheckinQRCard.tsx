import React, { useCallback, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
	AlertCircle,
	Download,
	RefreshCw,
	X
} from 'lucide-react';
import { Guest, Content, Settings } from '../types';

interface QrTicketData {
	qrDataUrl: string;
	payload: {
		code: string;
		name: string;
		guestCount: number;
		event: string;
		eventKey: string;
		eventTitle: string;
		eventTime: string;
		eventDate: string;
		arrivalTime: string | null;
	};
}

interface CheckinQRCardProps {
	guest: Guest;
	content: Content;
	settings: Settings;
	open: boolean;
	onClose: () => void;
}

const loadImage = (src: string): Promise<HTMLImageElement> =>
	new Promise((resolve, reject) => {
		const img = new Image();
		img.onload = () => resolve(img);
		img.onerror = reject;
		img.src = src;
	});

function roundRectPath(
	ctx: CanvasRenderingContext2D,
	x: number,
	y: number,
	w: number,
	h: number,
	r: number
) {
	ctx.beginPath();
	ctx.moveTo(x + r, y);
	ctx.arcTo(x + w, y, x + w, y + h, r);
	ctx.arcTo(x + w, y + h, x, y + h, r);
	ctx.arcTo(x, y + h, x, y, r);
	ctx.arcTo(x, y, x + w, y, r);
	ctx.closePath();
}

function fitFont(
	ctx: CanvasRenderingContext2D,
	text: string,
	maxWidth: number,
	baseSize: number,
	family: string
) {
	let size = baseSize;
	ctx.font = `700 ${size}px ${family}`;
	while (ctx.measureText(text).width > maxWidth && size > 12) {
		size -= 2;
		ctx.font = `700 ${size}px ${family}`;
	}
	return size;
}

// Compose a themed ticket card (cream, gold borders, QR, caption) as a PNG data URL
const renderTicketCard = async (qr: QrTicketData, content: Content): Promise<string> => {
	const W = 900;
	const H = 1280;
	const canvas = document.createElement('canvas');
	canvas.width = W;
	canvas.height = H;
	const ctx = canvas.getContext('2d');
	if (!ctx) return qr.qrDataUrl;

	const cream = '#fffdf7';
	const brown = '#241a08';
	const batik = '#8c6239';
	const gold = '#d4af37';
	const goldSoft = '#b08d57';
	const stone = '#6b5f45';
	const serif = 'Georgia, "Times New Roman", serif';
	const sans = 'Lato, Arial, sans-serif';

	// Background
	ctx.fillStyle = cream;
	ctx.fillRect(0, 0, W, H);

	// Double gold border
	ctx.strokeStyle = gold;
	ctx.lineWidth = 8;
	ctx.strokeRect(28, 28, W - 56, H - 56);
	ctx.lineWidth = 2.5;
	ctx.strokeRect(48, 48, W - 96, H - 96);

	// Corner diamond ornaments
	const diamond = (cx: number, cy: number, s: number) => {
		ctx.fillStyle = gold;
		ctx.beginPath();
		ctx.moveTo(cx, cy - s);
		ctx.lineTo(cx + s, cy);
		ctx.lineTo(cx, cy + s);
		ctx.lineTo(cx - s, cy);
		ctx.closePath();
		ctx.fill();
	};
	diamond(48, 48, 10);
	diamond(W - 48, 48, 10);
	diamond(48, H - 48, 10);
	diamond(W - 48, H - 48, 10);

	ctx.textAlign = 'center';
	ctx.textBaseline = 'middle';

	const couple = `${content.groom.nickname} & ${content.bride.nickname}`;
	const coupleSize = fitFont(ctx, couple, W - 200, 56, serif);
	ctx.font = `700 ${coupleSize}px ${serif}`;
	ctx.fillStyle = brown;
	ctx.fillText(couple, W / 2, 120);

	// Divider
	ctx.strokeStyle = goldSoft;
	ctx.lineWidth = 1.5;
	ctx.beginPath();
	ctx.moveTo(W / 2 - 130, 182);
	ctx.lineTo(W / 2 + 130, 182);
	ctx.stroke();

	// Ticket label — enlarged and bold so guests recognise this as a ticket to keep
	const ticketLabel = 'T I K E T   C H E C K - I N';
	const ticketSize = fitFont(ctx, ticketLabel, W - 120, 52, sans);
	ctx.font = `700 ${ticketSize}px ${sans}`;
	ctx.fillStyle = batik;
	ctx.fillText(ticketLabel, W / 2, 240);

	// Short subtitle reinforcing purpose
	ctx.font = `400 20px ${sans}`;
	ctx.fillStyle = stone;
	ctx.fillText('Simpan tiket ini dan bawa saat acara', W / 2, 282);

	// QR inside a white rounded frame — vertically centered between header and footer
	const qrSize = 540;
	const headerBottom = 310;
	const footerTop = H - 134;
	const captionSpan = 88 + 54 + 48 + 18;
	const qrY = Math.round((headerBottom + footerTop - (qrSize + captionSpan)) / 2);
	ctx.fillStyle = '#ffffff';
	roundRectPath(ctx, W / 2 - qrSize / 2 - 24, qrY - 24, qrSize + 48, qrSize + 48, 36);
	ctx.fill();
	ctx.strokeStyle = gold;
	ctx.lineWidth = 2;
	ctx.stroke();
	const qrImg = await loadImage(qr.qrDataUrl);
	ctx.drawImage(qrImg, W / 2 - qrSize / 2, qrY, qrSize, qrSize);

	// Guest caption
	let y = qrY + qrSize + 88;
	ctx.font = `600 20px ${sans}`;
	ctx.fillStyle = batik;
	ctx.fillText('A T A S   N A M A', W / 2, y);

	y += 54;
	const nameSize = fitFont(ctx, qr.payload.name, W - 160, 40, serif);
	ctx.font = `700 ${nameSize}px ${serif}`;
	ctx.fillStyle = brown;
	ctx.fillText(qr.payload.name, W / 2, y);

	y += 48;
	ctx.font = `400 24px ${sans}`;
	ctx.fillStyle = stone;
	const countText = qr.payload.guestCount > 0 ? ` • ${qr.payload.guestCount} orang` : '';
	ctx.fillText(`Kode: ${qr.payload.code}${countText}`, W / 2, y);

	// Footer
	ctx.font = `400 20px ${sans}`;
	ctx.fillStyle = goldSoft;
	ctx.fillText('Pindai QR ini saat tiba di lokasi acara', W / 2, H - 112);
	ctx.font = `400 16px ${sans}`;
	ctx.fillStyle = stone;
	ctx.fillText('Undangan Pernikahan Digital', W / 2, H - 78);

	return canvas.toDataURL('image/png');
};

export const CheckinQRCard: React.FC<CheckinQRCardProps> = ({ guest, content, settings, open, onClose }) => {
	const [qr, setQr] = useState<QrTicketData | null>(null);
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [isSaving, setIsSaving] = useState(false);

	const fetchTicket = useCallback(async () => {
		setIsLoading(true);
		setError(null);
		try {
			const resp = await fetch(`/api/public/invitation/${encodeURIComponent(guest.code)}/qr`);
			const data = await resp.json();
			if (data.success) {
				setQr(data);
			} else {
				setQr(null);
				setError(data.error || 'Gagal memuat QR check-in');
			}
		} catch (err: any) {
			setQr(null);
			setError('Koneksi bermasalah: ' + err.message);
		} finally {
			setIsLoading(false);
		}
	}, [guest.code]);

	// Ticket is only issued when the modal is opened
	useEffect(() => {
		if (open) fetchTicket();
	}, [open, fetchTicket]);

	// Lock body scroll while the modal is open
	useEffect(() => {
		if (!open) return;
		const prev = document.body.style.overflow;
		document.body.style.overflow = 'hidden';
		return () => {
			document.body.style.overflow = prev;
		};
	}, [open]);

	const downloadTicket = async () => {
		if (!qr) return;
		setIsSaving(true);
		try {
			const cardUrl = await renderTicketCard(qr, content);
			const a = document.createElement('a');
			a.href = cardUrl;
			a.download = `tiket-checkin-${qr.payload.code}.png`;
			document.body.appendChild(a);
			a.click();
			a.remove();
		} catch {
			// fallback: save the raw QR image
			const a = document.createElement('a');
			a.href = qr.qrDataUrl;
			a.download = `qr-checkin-${qr.payload.code}.png`;
			document.body.appendChild(a);
			a.click();
			a.remove();
		} finally {
			setIsSaving(false);
		}
	};

	return (
		<AnimatePresence>
			{open && (
				<motion.div
					initial={{ opacity: 0 }}
					animate={{ opacity: 1 }}
					exit={{ opacity: 0 }}
					className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-6"
					role="dialog"
					aria-modal="true"
					aria-label="Tiket Check-in QR"
				>
					{/* Backdrop */}
					<div
						className="absolute inset-0 bg-black/70 backdrop-blur-sm cursor-pointer"
						onClick={onClose}
					></div>

					{/* Bottom-sheet panel */}
					<motion.div
						initial={{ y: 90, opacity: 0 }}
						animate={{ y: 0, opacity: 1 }}
						exit={{ y: 90, opacity: 0 }}
						transition={{ type: 'spring', damping: 30, stiffness: 320 }}
						className="relative w-full max-w-md bg-stone-900 text-wedding-cream rounded-t-3xl sm:rounded-3xl p-6 sm:p-8 shadow-2xl max-h-[92vh] overflow-y-auto text-left"
					>
						<div className="absolute top-2 left-2 w-3 h-3 border-t border-l border-gold-gentle/30"></div>
						<div className="absolute top-2 right-2 w-3 h-3 border-t border-r border-gold-gentle/30"></div>
						<div className="absolute bottom-2 left-2 w-3 h-3 border-b border-l border-gold-gentle/30"></div>
						<div className="absolute bottom-2 right-2 w-3 h-3 border-b border-r border-gold-gentle/30"></div>

						{/* Header */}
						<div className="flex items-start justify-between mb-1">
							<h2 className="font-display text-xl sm:text-2xl font-semibold text-gold-gradient tracking-wide">
								Tiket Check-in QR
							</h2>
							<button
								type="button"
								onClick={onClose}
								className="p-2 -mt-1 -mr-2 text-stone-400 hover:text-white transition-colors cursor-pointer"
								id="checkin-qr-close-btn"
								aria-label="Tutup tiket check-in"
							>
								<X size={20} />
							</button>
						</div>
						<p className="text-xs text-stone-400 mt-1 mb-6 font-sans">
							Simpan atau tunjukkan QR ini saat tiba di lokasi acara.
						</p>

						{isLoading && (
							<div className="flex flex-col items-center justify-center py-14 gap-3">
								<RefreshCw size={22} className="text-gold-gentle animate-spin" />
								<p className="text-xs text-stone-400 font-mono tracking-wider uppercase">Membuat QR Anda...</p>
							</div>
						)}

						{error && !isLoading && (
							<div className="bg-red-950/40 border border-red-800/60 text-red-300 rounded-xl p-4 text-xs flex items-start gap-2">
								<AlertCircle size={14} className="mt-0.5 flex-shrink-0" />
								<span>{error}</span>
							</div>
						)}

						{qr && !isLoading && (
							<motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
								{/* QR Image */}
								<div className="flex justify-center">
									<div className="bg-[#fffdf7] rounded-[2rem] p-5 sm:p-6 shadow-xl ring-1 ring-gold-gentle/40 border border-gold-gentle/20">
										<img
											src={qr.qrDataUrl}
											alt="QR Check-in"
											className="w-60 h-60 sm:w-72 sm:h-72 object-contain"
											id="checkin-qr-image"
										/>
									</div>
								</div>
								<p className="text-center text-[10px] uppercase tracking-widest text-stone-500 font-mono mt-3">
									Pindai di loket check-in acara
								</p>
								
								{/* Save button */}
								<div className="mt-5">
									<button
										type="button"
										onClick={downloadTicket}
										disabled={isSaving}
										className="w-full py-3.5 rounded-xl bg-gradient-to-r from-batik-brown to-amber-800 text-white border border-gold-gentle text-[11px] uppercase font-semibold tracking-widest shadow-lg flex items-center justify-center gap-2 hover:from-amber-800 hover:to-batik-brown transition-all cursor-pointer disabled:opacity-50"
										id="checkin-qr-download-btn"
									>
										{isSaving ? <RefreshCw size={13} className="animate-spin" /> : <Download size={13} />}
										<span>{isSaving ? 'Menyiapkan...' : 'Simpan Tiket QR'}</span>
									</button>
									<p className="text-[10px] text-stone-500 mt-2 text-center leading-relaxed">
										Tersimpan sebagai kartu tiket berisi QR, nama, dan kode undangan Anda.
									</p>
								</div>
						</motion.div>
					)}
				</motion.div>
				</motion.div>
			)}
		</AnimatePresence>
	);
};
