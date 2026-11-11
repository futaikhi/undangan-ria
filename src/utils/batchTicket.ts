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

// 6 × 9 cm at 600 DPI for a compact physical invitation insert.
const TICKET_W = 1417;
const TICKET_H = 2126;

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
 * Render a single 6×9 cm print-ready ticket card as a PNG Blob.
 * A dense, balanced layout maximizes the smaller physical insert without dead space.
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
	const centerX = TICKET_W / 2;

	ctx.fillStyle = cream;
	ctx.fillRect(0, 0, TICKET_W, TICKET_H);

	ctx.strokeStyle = gold;
	ctx.lineWidth = 10;
	ctx.strokeRect(38, 38, TICKET_W - 76, TICKET_H - 76);
	ctx.lineWidth = 3;
	ctx.strokeRect(64, 64, TICKET_W - 128, TICKET_H - 128);

	const diamond = (cx: number, cy: number, size: number) => {
		ctx.fillStyle = gold;
		ctx.beginPath();
		ctx.moveTo(cx, cy - size);
		ctx.lineTo(cx + size, cy);
		ctx.lineTo(cx, cy + size);
		ctx.lineTo(cx - size, cy);
		ctx.closePath();
		ctx.fill();
	};
	diamond(94, 94, 15);
	diamond(TICKET_W - 94, 94, 15);
	diamond(94, TICKET_H - 94, 15);
	diamond(TICKET_W - 94, TICKET_H - 94, 15);

	ctx.textAlign = 'center';
	ctx.textBaseline = 'middle';

	const couple = `${content.groom.nickname} & ${content.bride.nickname}`.toUpperCase();
	const coupleSize = fitFont(ctx, couple, TICKET_W - 220, 72, serif);
	ctx.font = `700 ${coupleSize}px ${serif}`;
	ctx.fillStyle = brown;
	ctx.fillText(couple, centerX, 140);

	ctx.strokeStyle = goldSoft;
	ctx.lineWidth = 2;
	ctx.beginPath();
	ctx.moveTo(centerX - 200, 200);
	ctx.lineTo(centerX + 200, 200);
	ctx.stroke();
	diamond(centerX, 200, 9);

	const ticketLabel = 'B A R C O D E   C H E C K - I N';
	const ticketSize = fitFont(ctx, ticketLabel, TICKET_W - 180, 44, sans);
	ctx.font = `700 ${ticketSize}px ${sans}`;
	ctx.fillStyle = batik;
	ctx.fillText(ticketLabel, centerX, 256);
	ctx.font = `400 24px ${sans}`;
	ctx.fillStyle = stone;
	ctx.fillText('Simpan tiket ini dan bawa saat acara', centerX, 300);

	ctx.strokeStyle = goldSoft;
	ctx.lineWidth = 2;
	ctx.beginPath();
	ctx.moveTo(190, 346);
	ctx.lineTo(centerX - 85, 346);
	ctx.moveTo(centerX + 85, 346);
	ctx.lineTo(TICKET_W - 190, 346);
	ctx.stroke();
	diamond(centerX, 346, 9);

	// QR diperbesar hingga mendekati batas lebar aman agar mudah dipindai.
	const qrSize = 1030;
	const qrY = 376;
	const qrPad = 28;
	ctx.fillStyle = '#ffffff';
	roundRectPath(ctx, centerX - qrSize / 2 - qrPad, qrY - qrPad, qrSize + qrPad * 2, qrSize + qrPad * 2, 44);
	ctx.fill();
	ctx.strokeStyle = gold;
	ctx.lineWidth = 3;
	ctx.stroke();
	const qrImg = await loadImage(ticket.qrDataUrl);
	ctx.drawImage(qrImg, centerX - qrSize / 2, qrY, qrSize, qrSize);

	const panelY = 1470;
	const panelH = 270;
	ctx.fillStyle = '#f8f1e3';
	roundRectPath(ctx, 142, panelY, TICKET_W - 284, panelH, 28);
	ctx.fill();
	ctx.strokeStyle = '#e4d2ad';
	ctx.lineWidth = 2;
	ctx.stroke();

	ctx.font = `600 24px ${sans}`;
	ctx.fillStyle = batik;
	ctx.fillText('A T A S   N A M A', centerX, panelY + 54);
	const nameSize = fitFont(ctx, ticket.payload.name, TICKET_W - 360, 54, serif);
	ctx.font = `700 ${nameSize}px ${serif}`;
	ctx.fillStyle = brown;
	ctx.fillText(ticket.payload.name, centerX, panelY + 128);
	ctx.strokeStyle = goldSoft;
	ctx.lineWidth = 2;
	ctx.beginPath();
	ctx.moveTo(centerX - 120, panelY + 176);
	ctx.lineTo(centerX + 120, panelY + 176);
	ctx.stroke();
	ctx.font = `400 28px ${sans}`;
	ctx.fillStyle = stone;
	ctx.fillText(`Kode: ${ticket.payload.code}`, centerX, panelY + 222);

	const footerSepY = 1785;
	ctx.strokeStyle = goldSoft;
	ctx.lineWidth = 2;
	ctx.beginPath();
	ctx.moveTo(190, footerSepY);
	ctx.lineTo(TICKET_W - 190, footerSepY);
	ctx.stroke();
	ctx.font = `700 52px ${sans}`;
	ctx.fillStyle = batik;
	ctx.fillText('Pindai QR ini saat tiba di lokasi acara', centerX, footerSepY + 76);
	ctx.font = `600 28px ${sans}`;
	ctx.fillStyle = stone;
	ctx.fillText('duwegawe.com', centerX, footerSepY + 160);

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
