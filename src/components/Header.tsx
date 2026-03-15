'use client';

import { useSession, signOut } from 'next-auth/react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import useSWR from 'swr';
import { GlobalSettings } from '@/types';

const fetcher = (url: string) => fetch(url).then(res => res.json());

export default function Header() {
    const { data: session } = useSession();
    const params = useParams();
    const gradeId = params?.gradeId as string | undefined;

    const { data } = useSWR<{ settings: GlobalSettings }>(
        '/api/settings',
        fetcher,
        { revalidateOnFocus: false, dedupingInterval: 30_000 }
    );

    const teamName = data?.settings?.teamName || 'SHARKS';
    const teamColor = data?.settings?.teamColor || '#1e3a8a';

    // Simple luminance check to decide text color (white or dark)
    const isLightColor = (hex: string) => {
        const r = parseInt(hex.slice(1, 3), 16);
        const g = parseInt(hex.slice(3, 5), 16);
        const b = parseInt(hex.slice(5, 7), 16);
        return (r * 0.299 + g * 0.587 + b * 0.114) > 186;
    };

    const headerTextColor = isLightColor(teamColor) ? 'text-gray-900' : 'text-white';

    return (
        <header className="sticky top-0 z-[80] w-full bg-white/80 backdrop-blur-md border-b border-slate-100 shadow-sm transition-all">
            <div className="container mx-auto px-6 py-4 flex justify-between items-center">
                <Link href="/" className="flex items-center gap-3 group">
                    <div className="p-1.5 bg-slate-50 rounded-xl group-hover:bg-blue-50 transition-colors">
                        {data?.settings?.teamLogoUrl ? (
                            <img src={data.settings.teamLogoUrl} alt="Logo" className="w-8 h-8 object-contain" />
                        ) : (
                            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-black text-xs">S</div>
                        )}
                    </div>
                    <div className="flex flex-col -gap-1">
                        <span className="text-sm font-black text-slate-900 tracking-tighter uppercase leading-none">{teamName}</span>
                        <span className="text-[10px] font-black text-blue-600 tracking-[0.2em] uppercase leading-none mt-1">Score App</span>
                    </div>
                </Link>

                <div className="flex items-center gap-2">
                    {session && (
                        <>
                            <Link
                                href="/settings"
                                className="p-2.5 text-slate-400 hover:text-slate-900 hover:bg-slate-50 rounded-2xl transition-all"
                                title="設定"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                </svg>
                            </Link>
                            <button
                                onClick={() => signOut()}
                                className="ml-2 text-[9px] font-black text-slate-400 px-4 py-2 bg-slate-50 hover:bg-slate-100 hover:text-slate-900 rounded-xl transition-all uppercase tracking-widest border border-slate-100"
                            >
                                Logout
                            </button>
                        </>
                    )}
                </div>
            </div>
        </header>
    );
}
