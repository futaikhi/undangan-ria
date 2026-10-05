import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Home, Calendar, Mail } from 'lucide-react';

interface NavItem {
	key: string;
	label: string;
	targetId: string; // empty = scroll to top (hero)
}

const ITEMS: NavItem[] = [
	{ key: 'home', label: 'Beranda', targetId: '' },
	{ key: 'events', label: 'Acara', targetId: 'section-events' },
	{ key: 'rsvp', label: 'RSVP', targetId: 'section-rsvp' }
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
		const targets = ['section-events', 'section-rsvp']
			.map((id) => document.getElementById(id))
			.filter((el): el is HTMLElement => !!el);
		const observer = new IntersectionObserver(
			(entries) => {
				entries.forEach((entry) => {
					if (entry.isIntersecting) {
						setActive(entry.target.id === 'section-events' ? 'events' : 'rsvp');
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
					className="fixed inset-x-0 bottom-0 z-40"
					aria-label="Navigasi halaman"
				>
					<div className="flex items-stretch justify-around border-t border-gold-gentle/40 bg-stone-900/90 backdrop-blur-md">
						{ITEMS.map((item) => (
							<button
								key={item.key}
								type="button"
								onClick={() => scrollTo(item)}
								className={`flex-1 flex flex-col items-center gap-0.5 py-2 transition-all cursor-pointer ${active === item.key
									? 'bg-gold-gentle/15 text-gold-shine'
									: 'text-gold-gentle hover:bg-gold-gentle/10 hover:text-gold-shine'
									}`}
								id={`bottom-nav-${item.key}`}
								aria-label={item.label}
							>
								{item.key === 'home' ? (
									<Home size={12} />
								) : item.key === 'events' ? (
									<Calendar size={12} />
								) : (
									<Mail size={12} />
								)}
								<span className="text-[10px] uppercase tracking-widest font-bold">
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
