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
    const isRanking = pathname.includes('/players');
    const isMenu =
        pathname.includes('/settings') ||
        pathname.includes('/manual') ||
        pathname.includes('/privacy');

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
            href: gradeId ? `/grade/${gradeId}/players` : '/',
            active: isRanking,
            requiresGrade: true,
        },
        { label: 'メニュー', href: '/settings', active: isMenu },
    ];

    const icons: Record<string, (active: boolean) => React.ReactNode> = {
        ホーム: (active) => (
            <svg
                className={`w-6 h-6 ${active ? 'text-[#1565FF]' : 'text-slate-400'}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
            >
                <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
                />
            </svg>
        ),
        入力: (active) => (
            <svg
                className={`w-6 h-6 ${active ? 'text-[#1565FF]' : 'text-slate-400'}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
            >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
        ),
        試合: (active) => (
            <svg
                className={`w-6 h-6 ${active ? 'text-[#1565FF]' : 'text-slate-400'}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
            >
                <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
            </svg>
        ),
        ランキング: (active) => (
            <svg
                className={`w-6 h-6 ${active ? 'text-[#1565FF]' : 'text-slate-400'}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
            >
                <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                />
            </svg>
        ),
        メニュー: (active) => (
            <svg
                className={`w-6 h-6 ${active ? 'text-[#1565FF]' : 'text-slate-400'}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
            >
                <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6h16M4 12h16M4 18h16"
                />
            </svg>
        ),
    };

    return (
        <nav
            className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-slate-200"
            style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
        >
            <div className="flex items-center h-16 max-w-lg mx-auto">
                {navItems.map((item) => {
                    const disabled = item.requiresGrade && !gradeId;
                    return (
                        <Link
                            key={item.label}
                            href={disabled ? '/' : item.href}
                            className={`flex flex-col items-center justify-center gap-0.5 flex-1 h-full transition-colors ${
                                disabled ? 'opacity-30' : ''
                            }`}
                        >
                            {icons[item.label]?.(item.active)}
                            <span
                                className={`text-[9px] font-black tracking-wider ${
                                    item.active ? 'text-[#1565FF]' : 'text-slate-400'
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
