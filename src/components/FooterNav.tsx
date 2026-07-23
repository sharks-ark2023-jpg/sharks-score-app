'use client';

import Link from 'next/link';
import { useParams, usePathname } from 'next/navigation';

export default function FooterNav() {
    const params = useParams();
    const pathname = usePathname();
    const gradeId = params?.gradeId as string | undefined;

    const isHome = pathname === '/';
    const isInput =
        pathname.includes('/match/new') ||
        (pathname.includes('/match/') && !pathname.includes('/view') && !pathname.includes('/archive'));
    const isHistory = !!gradeId && pathname === `/grade/${gradeId}`;
    const isStats = pathname.includes('/stats');
    const isMenu =
        pathname.includes('/settings') ||
        pathname.includes('/manual') ||
        pathname.includes('/privacy') ||
        pathname.includes('/players');

    type NavItem = {
        label: string;
        href: string;
        active: boolean;
        requiresGrade?: boolean;
    };

    const navItems: NavItem[] = [
        { label: 'ホーム', href: '/', active: isHome },
        {
            label: '入力',
            href: gradeId ? `/grade/${gradeId}/match/new` : '/',
            active: isInput,
            requiresGrade: true,
        },
        {
            label: '試合',
            href: gradeId ? `/grade/${gradeId}` : '/',
            active: isHistory,
            requiresGrade: true,
        },
        {
            label: 'ランキング',
            href: gradeId ? `/grade/${gradeId}/stats` : '/',
            active: isStats,
            requiresGrade: true,
        },
        { label: 'メニュー', href: '/settings', active: isMenu },
    ];

    const icons: Record<string, (active: boolean) => React.ReactNode> = {
        ホーム: (active) => (
            <svg
                className="w-[22px] h-[22px]"
                fill="none"
                stroke={active ? '#49D17D' : '#D5DCE6'}
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
                viewBox="0 0 24 24"
            >
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                <polyline points="9 22 9 12 15 12 15 22" />
            </svg>
        ),
        入力: (active) => (
            <svg
                className="w-[22px] h-[22px]"
                fill="none"
                stroke={active ? '#49D17D' : '#D5DCE6'}
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
                viewBox="0 0 24 24"
            >
                <path d="M12 20h9" />
                <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
            </svg>
        ),
        試合: (active) => (
            <svg
                className="w-[22px] h-[22px]"
                fill="none"
                stroke={active ? '#49D17D' : '#D5DCE6'}
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
                viewBox="0 0 24 24"
            >
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                <line x1="16" y1="2" x2="16" y2="6" />
                <line x1="8" y1="2" x2="8" y2="6" />
                <line x1="3" y1="10" x2="21" y2="10" />
            </svg>
        ),
        ランキング: (active) => (
            <svg
                className="w-[22px] h-[22px]"
                fill="none"
                stroke={active ? '#49D17D' : '#D5DCE6'}
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
                viewBox="0 0 24 24"
            >
                <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
                <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
                <path d="M4 22h16" />
                <path d="M10 14.66V17c0 .55-.45 1-1 1H4v2h16v-2h-5c-.55 0-1-.45-1-1v-2.34" />
                <path d="M12 2a6 6 0 0 0-6 6v1c0 2.2 1.8 4 4 4h4c2.2 0 4-1.8 4-4V8a6 6 0 0 0-6-6z" />
            </svg>
        ),
        メニュー: (active) => (
            <svg
                className="w-[22px] h-[22px]"
                fill="none"
                stroke={active ? '#49D17D' : '#D5DCE6'}
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
                viewBox="0 0 24 24"
            >
                <line x1="3" y1="12" x2="21" y2="12" />
                <line x1="3" y1="6" x2="21" y2="6" />
                <line x1="3" y1="18" x2="21" y2="18" />
            </svg>
        ),
    };

    return (
        <nav
            className="fixed bottom-0 left-0 right-0 z-50 bg-sharks-ink/95 backdrop-blur-md border-t border-white/10 shadow-[0_-8px_24px_rgba(3,13,26,0.2)] text-white"
            style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
        >
            <div className="flex items-center h-16 max-w-lg mx-auto px-2">
                {navItems.map((item) => {
                    const disabled = item.requiresGrade && !gradeId;
                    return (
                        <Link
                            key={item.label}
                            href={disabled ? '/' : item.href}
                            className={`flex flex-col items-center justify-center gap-1 flex-1 h-full transition-all relative ${
                                disabled ? 'opacity-30' : 'hover:scale-[1.03]'
                            }`}
                        >
                            {item.active && (
                                <div className="absolute top-0 w-8 h-[3px] bg-sharks-accent rounded-b-md animate-fade-in" />
                            )}
                            {icons[item.label]?.(item.active)}
                            <span
                                className={`text-[9px] font-black tracking-widest leading-none ${
                                    item.active ? 'text-sharks-accent' : 'text-slate-300'
                                }`}
                            >
                                {item.label}
                            </span>
                        </Link>
                    );
                })}
            </div>
        </nav>
    );
}
