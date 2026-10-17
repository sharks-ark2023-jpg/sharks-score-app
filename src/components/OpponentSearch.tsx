'use client';

import { useState } from 'react';

interface Props {
    value: string;
    onChange: (value: string) => void;
    resultCount: number;
    hint?: string;
}

export default function OpponentSearch({ value, onChange, resultCount, hint }: Props) {
    const [isOpen, setIsOpen] = useState(false);
    const close = () => {
        onChange('');
        setIsOpen(false);
    };
    return (
        <div className="mb-5">
            <div className="flex justify-end">
                <button type="button" onClick={() => isOpen ? close() : setIsOpen(true)}
                    aria-label={isOpen ? '検索を閉じる' : '対戦相手を検索'} aria-expanded={isOpen} aria-controls="opponent-search-panel"
                    className="flex h-11 w-11 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-50">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
                        {isOpen ? <path d="m6 6 12 12M6 18 18 6" /> : <><circle cx="10.5" cy="10.5" r="6.5" /><path d="m16 16 4 4" /></>}
                    </svg>
                </button>
            </div>
            {isOpen && <div id="opponent-search-panel" className="mt-2 rounded-2xl border border-slate-100 bg-white p-4">
                <label htmlFor="opponent-search" className="mb-2 block text-sm font-bold text-slate-700">対戦相手で検索</label>
                <div className="flex items-center gap-2">
                    <input
                        id="opponent-search"
                        type="search"
                        autoFocus
                        value={value}
                        onChange={event => onChange(event.target.value)}
                        onKeyDown={event => { if (event.key === 'Escape') close(); }}
                        placeholder="対戦相手名の一部を入力"
                        className="min-w-0 flex-1 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-base text-slate-900 focus:border-blue-500 focus:outline-none"
                    />
                    {value.length > 0 && (
                        <button type="button" onClick={() => onChange('')} className="shrink-0 rounded-xl border border-slate-200 px-3 py-2 text-xs font-bold text-slate-600" aria-label="検索をクリア">クリア</button>
                    )}
                </div>
                {hint && <p className="mt-2 text-xs text-slate-500">{hint}</p>}
                <p className="mt-2 text-xs font-bold text-slate-500" role="status">{resultCount}件の試合</p>
            </div>}
        </div>
    );
}
