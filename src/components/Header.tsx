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
        <header className="sticky top-0 z-[80] w-full bg-[#0D1B2A] bg-gradient-to-r from-[#0D1B2A] via-[#112235] to-[#0D1B2A] text-white border-b border-slate-800/40 shadow-lg">
            <div className="container mx-auto px-5 py-3 flex justify-between items-center">
                <Link href="/" className="flex items-center gap-3 group">
                    <div className="p-1 bg-white/10 rounded-xl group-hover:bg-white/20 transition-all border border-white/10 shadow-inner">
                        {data?.settings?.teamLogoUrl ? (
                            <img src={data.settings.teamLogoUrl} alt="Logo" className="w-9 h-9 object-contain" />
                        ) : (
                            <div className="w-9 h-9 bg-gradient-to-br from-[#1565FF] to-blue-800 rounded-lg flex items-center justify-center text-white font-black text-sm shadow-md">S</div>
                        )}
                    </div>
                    <div className="flex flex-col">
                        <span className="text-[13px] font-black text-white tracking-wider leading-tight">{teamName} U12</span>
                        <span className="text-[9px] font-black text-slate-400 tracking-[0.25em] uppercase leading-none mt-0.5">MATCH CENTER</span>
                    </div>
                </Link>

                <div className="flex items-center gap-2">
                    {session && (
                        <>
                            <Link
                                href="/settings"
                                className="p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-xl transition-all"
                                title="設定"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                </svg>
                            </Link>
                            <button
                                onClick={() => signOut()}
                                className="ml-1 text-[8px] font-black text-white/70 hover:text-white px-3 py-1.5 bg-white/5 hover:bg-white/10 rounded-lg transition-all uppercase tracking-widest border border-white/10"
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
