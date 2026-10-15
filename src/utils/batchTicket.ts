import JSZip from 'jszip';
import { Content } from '../types';

export interface BatchQrTicket {
	code: string;
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
	error?: string;
}

// 5 × 7 cm at 600 DPI for crisp print quality
const TICKET_W = 1182;
const TICKET_H = 1654;

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
	family: string,
	weight = '700'
) {
	let size = baseSize;
	ctx.font = `${weight} ${size}px ${family}`;
	while (ctx.measureText(text).width > maxWidth && size > 8) {
		size -= 2;
		ctx.font = `${weight} ${size}px ${family}`;
	}
	return size;
}

function sanitizeFileName(name: string): string {
	return name.replace(/[^a-zA-Z0-9\s-]/g, '').trim().replace(/\s+/g, '_').slice(0, 40);
}

/**
 * Render a single 5×7 cm print-ready ticket card as a PNG Blob.
 * Design adapted from CheckinQRCard.renderTicketCard but compact for print.
 */
export async function renderPrintTicket(
	ticket: BatchQrTicket,
	content: Content
): Promise<Blob> {
	const canvas = document.createElement('canvas');
	canvas.width = TICKET_W;
	canvas.height = TICKET_H;
	const ctx = canvas.getContext('2d');
	if (!ctx) throw new Error('Canvas context tidak tersedia');

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
	ctx.fillRect(0, 0, TICKET_W, TICKET_H);

	// Double gold border
	ctx.strokeStyle = gold;
	ctx.lineWidth = 10;
	ctx.strokeRect(36, 36, TICKET_W - 72, TICKET_H - 72);
	ctx.lineWidth = 3;
	ctx.strokeRect(62, 62, TICKET_W - 124, TICKET_H - 124);

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
	diamond(62, 62, 13);
	diamond(TICKET_W - 62, 62, 13);
	diamond(62, TICKET_H - 62, 13);
	diamond(TICKET_W - 62, TICKET_H - 62, 13);

	ctx.textAlign = 'center';
	ctx.textBaseline = 'middle';

	// Couple names
	const couple = `${content.groom.nickname} & ${content.bride.nickname}`;
	const coupleSize = fitFont(ctx, couple, TICKET_W - 260, 82, serif);
	ctx.font = `700 ${coupleSize}px ${serif}`;
	ctx.fillStyle = brown;
	ctx.fillText(couple, TICKET_W / 2, 156);

	// Divider
	ctx.strokeStyle = goldSoft;
	ctx.lineWidth = 2;
	ctx.beginPath();
	ctx.moveTo(TICKET_W / 2 - 170, 235);
	ctx.lineTo(TICKET_W / 2 + 170, 235);
	ctx.stroke();

	// Ticket label — prominent
	const ticketLabel = 'T I K E T   C H E C K - I N';
	const ticketSize = fitFont(ctx, ticketLabel, TICKET_W - 160, 68, sans);
	ctx.font = `700 ${ticketSize}px ${sans}`;
	ctx.fillStyle = batik;
	ctx.fillText(ticketLabel, TICKET_W / 2, 310);

	// Subtitle
	ctx.font = `400 26px ${sans}`;
	ctx.fillStyle = stone;
	ctx.fillText('Simpan tiket ini dan bawa saat acara', TICKET_W / 2, 365);

	// QR inside white rounded frame
	const qrSize = 640;
	const qrY = 430;
	ctx.fillStyle = '#ffffff';
	roundRectPath(ctx, TICKET_W / 2 - qrSize / 2 - 30, qrY - 30, qrSize + 60, qrSize + 60, 48);
	ctx.fill();
	ctx.strokeStyle = gold;
	ctx.lineWidth = 3;
	ctx.stroke();
	const qrImg = await loadImage(ticket.qrDataUrl);
	ctx.drawImage(qrImg, TICKET_W / 2 - qrSize / 2, qrY, qrSize, qrSize);

	// Guest caption
	let y = qrY + qrSize + 110;
	ctx.font = `600 26px ${sans}`;
	ctx.fillStyle = batik;
	ctx.fillText('A T A S   N A M A', TICKET_W / 2, y);

	y += 72;
	const nameSize = fitFont(ctx, ticket.payload.name, TICKET_W - 220, 52, serif);
	ctx.font = `700 ${nameSize}px ${serif}`;
	ctx.fillStyle = brown;
	ctx.fillText(ticket.payload.name, TICKET_W / 2, y);

	y += 62;
	ctx.font = `400 30px ${sans}`;
	ctx.fillStyle = stone;
	const countText = ticket.payload.guestCount > 0 ? `  •  ${ticket.payload.guestCount} orang` : '';
	ctx.fillText(`Kode: ${ticket.payload.code}${countText}`, TICKET_W / 2, y);

	// Event details
	if (ticket.payload.eventTitle) {
		y += 56;
		ctx.font = `600 28px ${sans}`;
		ctx.fillStyle = batik;
		ctx.fillText(ticket.payload.eventTitle.toUpperCase(), TICKET_W / 2, y);
	}

	if (ticket.payload.eventDate) {
		y += 52;
		ctx.font = `400 28px ${sans}`;
		ctx.fillStyle = stone;
		ctx.fillText(ticket.payload.eventDate, TICKET_W / 2, y);
	}

	// Footer — positioned dynamically so it never overlaps the content above
	const footerY = Math.max(y + 64, TICKET_H - 180);
	ctx.font = `400 24px ${sans}`;
	ctx.fillStyle = goldSoft;
	ctx.fillText('Pindai QR ini saat tiba di lokasi acara', TICKET_W / 2, footerY);
	ctx.font = `400 20px ${sans}`;
	ctx.fillStyle = stone;
	ctx.fillText('Undangan Pernikahan Digital', TICKET_W / 2, footerY + 42);

	return new Promise((resolve, reject) => {
		canvas.toBlob(
			(blob) => (blob ? resolve(blob) : reject(new Error('Gagal membuat blob PNG'))),
			'image/png'
		);
	});
}

export interface BatchProgress {
	done: number;
	total: number;
	currentName: string;
}

/**
 * Fetch batch QR data from the admin endpoint, render each as a 5×7 cm PNG,
 * and package everything into a single ZIP file.
 */
export async function generateBatchTicketsZip(
	codes: string[],
	content: Content,
	onProgress?: (p: BatchProgress) => void
): Promise<{ blob: Blob; count: number; errors: { code: string; error: string }[] }> {
	// 1. Fetch QR data from server (needs HMAC signing)
	const resp = await fetch('/api/admin-undangan-ria-iqram/guests/batch-qr', {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ codes })
	});
	const data = await resp.json();
	if (!data.success) throw new Error(data.error || 'Gagal memuat QR batch');

	const tickets: BatchQrTicket[] = data.tickets;
	const errors: { code: string; error: string }[] = [];
	const zip = new JSZip();
	let count = 0;

	// 2. Render each ticket and add to ZIP
	for (let i = 0; i < tickets.length; i++) {
		const ticket = tickets[i];

		if (ticket.error) {
			errors.push({ code: ticket.code, error: ticket.error });
			onProgress?.({ done: i + 1, total: tickets.length, currentName: ticket.code });
			continue;
		}

		try {
			const blob = await renderPrintTicket(ticket, content);
			const fileName = `tiket-${sanitizeFileName(ticket.payload.name)}-${ticket.payload.code}.png`;
			zip.file(fileName, blob);
			count++;
		} catch {
			errors.push({ code: ticket.code, error: 'Gagal render tiket' });
		}

		onProgress?.({ done: i + 1, total: tickets.length, currentName: ticket.payload.name });
	}

	// 3. Generate ZIP blob
	const zipBlob = await zip.generateAsync({ type: 'blob' });
	return { blob: zipBlob, count, errors };
}

/**
 * Trigger a browser download for a blob.
 */
export function downloadBlob(blob: Blob, fileName: string) {
	const url = URL.createObjectURL(blob);
	const a = document.createElement('a');
	a.href = url;
	a.download = fileName;
	document.body.appendChild(a);
	a.click();
	a.remove();
	URL.revokeObjectURL(url);
}
