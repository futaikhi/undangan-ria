import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CalendarDays, Home, Images, Mail, MessageSquare, type LucideIcon } from 'lucide-react';

interface NavItem {
	key: string;
	label: string;
	targetId: string; // empty = scroll to top (hero)
	icon: LucideIcon;
}

const ITEMS: NavItem[] = [
	{ key: 'home', label: 'Beranda', targetId: '', icon: Home },
	{ key: 'events', label: 'Acara', targetId: 'section-events', icon: CalendarDays },
	{ key: 'rsvp', label: 'RSVP', targetId: 'section-rsvp', icon: Mail },
	{ key: 'gallery', label: 'Galeri', targetId: 'section-gallery', icon: Images },
	{ key: 'messages', label: 'Ucapan', targetId: 'section-messages-list', icon: MessageSquare }
];

export const BottomNav: React.FC = () => {
	const [visible, setVisible] = useState(false);
	const [active, setActive] = useState('home');

	// Reveal the nav once the hero is scrolled past
	useEffect(() => {
		const onScroll = () => {
			const y = window.scrollY;
			setVisible(y > window.innerHeight * 0.8);
			if (y < window.innerHeight * 0.5) setActive('home');
		};
		onScroll();
		window.addEventListener('scroll', onScroll, { passive: true });
		return () => window.removeEventListener('scroll', onScroll);
	}, []);

	// Let other fixed elements (e.g. music button) react to nav visibility
	useEffect(() => {
		document.body.classList.toggle('bottom-nav-visible', visible);
		return () => {
			document.body.classList.remove('bottom-nav-visible');
		};
	}, [visible]);

	// Highlight the section currently in view
	useEffect(() => {
		const targets = ITEMS
			.filter((item) => item.targetId)
			.map((item) => item.targetId)
			.map((id) => document.getElementById(id))
			.filter((el): el is HTMLElement => !!el);
		const observer = new IntersectionObserver(
			(entries) => {
				entries.forEach((entry) => {
					if (entry.isIntersecting) {
						const activeItem = ITEMS.find((item) => item.targetId === entry.target.id);
						if (activeItem) setActive(activeItem.key);
					}
				});
			},
			{ rootMargin: '-45% 0px -45% 0px' }
		);
		targets.forEach((el) => observer.observe(el));
		return () => observer.disconnect();
	}, []);

	const scrollTo = (item: NavItem) => {
		if (item.targetId) {
			document.getElementById(item.targetId)?.scrollIntoView({ behavior: 'smooth' });
		} else {
			window.scrollTo({ top: 0, behavior: 'smooth' });
		}
		setActive(item.key);
	};

	return (
		<AnimatePresence>
			{visible && (
				<motion.nav
					initial={{ opacity: 0, y: 40 }}
					animate={{ opacity: 1, y: 0 }}
					exit={{ opacity: 0, y: 40 }}
					transition={{ type: 'spring', damping: 26, stiffness: 300 }}
					className="pointer-events-none fixed inset-x-0 bottom-0 z-40 flex justify-center px-3 pb-[calc(env(safe-area-inset-bottom)+0.75rem)]"
					aria-label="Navigasi halaman"
				>
					<div className="pointer-events-auto flex w-fit max-w-full items-stretch justify-center gap-1 overflow-x-auto rounded-full border border-gold-gentle/35 bg-stone-950/85 p-1 shadow-[0_8px_32px_rgba(0,0,0,0.35)] backdrop-blur-xl">
						{ITEMS.map((item) => (
							<button
								key={item.key}
								type="button"
								onClick={() => scrollTo(item)}
								className={`flex min-w-[60px] flex-none flex-col items-center gap-1 rounded-full px-2 py-2 transition-all cursor-pointer ${active === item.key
									? 'bg-gold-gentle/20 text-gold-shine'
									: 'text-stone-300 hover:bg-gold-gentle/10 hover:text-gold-shine'
									}`}
								id={`bottom-nav-${item.key}`}
								aria-label={item.label}
								aria-current={active === item.key ? 'location' : undefined}
							>
								<item.icon size={15} />
								<span className="text-[9px] uppercase tracking-wider font-bold">
									{item.label}
								</span>
							</button>
						))}
					</div>
				</motion.nav>
			)}
		</AnimatePresence>
	);
};
