'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import useSWR from 'swr';
import { CommonMaster } from '@/types';
import Link from 'next/link';

const fetcher = (url: string) => fetch(url).then(async (res) => {
    const data = await res.json();
    if (!res.ok) {
        const err = new Error(data.error || 'Fetch failed');
        if (data.spreadsheetId) (err as any).spreadsheetId = data.spreadsheetId;
        throw err;
    }
    return data;
});

export default function PlayerManagementPage() {
    const { gradeId } = useParams() as { gradeId: string };
    const { data: players, error: fetchError, mutate, isLoading } = useSWR<CommonMaster[]>(`/api/masters?grade=${gradeId}&type=player`, fetcher);

    const [newName, setNewName] = useState('');
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'alert' | 'error', text: string, spreadsheetId?: string } | null>(null);

    const handleAddPlayer = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newName.trim()) return;

        setSaving(true);
        setMessage(null);

        try {
            const res = await fetch('/api/masters', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: newName.trim(),
                    type: 'player',
                    grade: gradeId
                }),
            });

            const contentType = res.headers.get('content-type');
            if (!res.ok) {
                let errorMsg = `HTTP Error ${res.status}`;
                if (contentType && contentType.includes('application/json')) {
                    const data = await res.json();
                    errorMsg = data.error || errorMsg;
                    if (data.spreadsheetId) {
                        setMessage({ type: 'error', text: `エラー: ${errorMsg}`, spreadsheetId: data.spreadsheetId });
                        setSaving(false);
                        return;
                    }
                } else {
                    const text = await res.text();
                    errorMsg = text.slice(0, 100) || errorMsg;
                }
                throw new Error(errorMsg);
            }

            setMessage({ type: 'success', text: `${newName} を登録しました！` });
            setNewName('');
            mutate();
        } catch (err: any) {
            console.error('[Players] Add error:', err);
            setMessage({ type: 'error', text: `エラー: ${err.message}`, spreadsheetId: err.spreadsheetId });
        } finally {
            setSaving(false);
        }
    };

    const handleDeletePlayer = async (name: string) => {
        if (!confirm(`${name} を削除しますか？`)) return;

        try {
            const res = await fetch(`/api/masters?name=${encodeURIComponent(name)}&type=player&grade=${gradeId}`, {
                method: 'DELETE',
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || '削除失敗');
            }

            setMessage({ type: 'success', text: '削除しました' });
            mutate();
        } catch (err: any) {
            setMessage({ type: 'error', text: `エラー: ${err.message}` });
        }
    };

    return (
        <main className="container mx-auto px-4 py-8 max-w-lg bg-white min-h-screen">
            <header className="mb-8 flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-black text-gray-900 tracking-tighter uppercase">{gradeId} PLAYERS</h1>
                    <p className="text-sm font-bold text-gray-400 uppercase tracking-widest">選手管理</p>
                </div>
                <Link href="/" className="p-3 bg-gray-50 rounded-2xl text-gray-400 hover:text-gray-600 transition-colors">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                    </svg>
                </Link>
            </header>

            {fetchError && (
                <div className="mb-6 p-6 bg-red-50 border-2 border-red-100 text-red-700 rounded-[2rem]">
                    <p className="font-black flex items-center gap-2">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                        データ連携エラー
                    </p>
                    <p className="mt-2 text-sm font-bold leading-relaxed">{fetchError.message}</p>
                    {fetchError.spreadsheetId && (
                        <div className="mt-6">
                            <a
                                href={`https://docs.google.com/spreadsheets/d/${fetchError.spreadsheetId}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-2 bg-white px-5 py-3 rounded-2xl border-2 border-red-100 font-black text-xs hover:bg-red-100 transition-all shadow-sm"
                            >
                                GOOGLE SHEET を開いて設定を確認
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                </svg>
                            </a>
                        </div>
                    )}
                </div>
            )}

            <section className="bg-white p-8 rounded-[2.5rem] shadow-2xl shadow-blue-50 border border-gray-50 mb-8">
                <form onSubmit={handleAddPlayer} className="space-y-4">
                    <label className="block">
                        <span className="text-xs font-black uppercase tracking-[0.2em] text-gray-400 ml-1">選手を追加</span>
                        <div className="flex gap-3 mt-2">
                            <input
                                type="text"
                                value={newName}
                                onChange={e => setNewName(e.target.value)}
                                placeholder="例: 日本 太郎"
                                className="flex-grow rounded-2xl border-2 border-gray-50 bg-gray-50 p-4 font-bold text-gray-900 focus:bg-white focus:border-blue-500 transition-all outline-none"
                            />
                            <button
                                type="submit"
                                disabled={saving || !newName.trim()}
                                className="bg-blue-600 text-white p-4 rounded-2xl shadow-lg shadow-blue-100 hover:bg-blue-700 disabled:bg-gray-100 transition-all"
                            >
                                {saving ? (
                                    <svg className="animate-spin h-6 w-6 text-white" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                ) : (
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                    </svg>
                                )}
                            </button>
                        </div>
                    </label>
                </form>

                {message && (
                    <div className={`mt-8 p-6 rounded-[2rem] text-sm font-black text-center ${message.type === 'success' ? 'bg-green-100 text-green-800 animate-bounce' : 'bg-red-100 text-red-800'}`}>
                        <p>{message.text}</p>
                        {message.spreadsheetId && (
                            <div className="mt-4">
                                <a
                                    href={`https://docs.google.com/spreadsheets/d/${message.spreadsheetId}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-2 bg-white px-5 py-3 rounded-full border-2 border-red-200 text-[10px] hover:bg-red-50 transition-all font-black uppercase tracking-widest"
                                >
                                    OPEN GOOGLE SHEETS
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                    </svg>
                                </a>
                            </div>
                        )}
                    </div>
                )}
            </section>

            <section className="space-y-4">
                <div className="flex justify-between items-center px-1">
                    <h2 className="text-xs font-black uppercase tracking-[0.2em] text-gray-400">登録済み選手 ({players?.length || 0})</h2>
                </div>

                {isLoading && (
                    <div className="space-y-3">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="h-20 bg-gray-50 animate-pulse rounded-2xl w-full" />
                        ))}
                    </div>
                )}

                <div className="grid grid-cols-1 gap-3">
                    {players?.map((p: any) => (
                        <div key={p.name} className="flex justify-between items-center bg-white p-5 rounded-3xl border-2 border-gray-50 shadow-sm hover:shadow-md transition-all group">
                            <span className="font-bold text-gray-900">{p.name}</span>
                            <button
                                onClick={() => handleDeletePlayer(p.name)}
                                className="opacity-0 group-hover:opacity-100 p-3 bg-red-50 text-red-500 rounded-2xl hover:bg-red-500 hover:text-white transition-all"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                            </button>
                        </div>
                    ))}
                    {!isLoading && players?.length === 0 && (
                        <div className="p-20 text-center bg-gray-50 rounded-[3rem] border-2 border-dashed border-gray-200">
                            <p className="text-gray-400 font-bold">まだ選手が登録されていません</p>
                        </div>
                    )}
                </div>
            </section>

            <div className="mt-12 text-center">
                <p className="text-[10px] text-gray-200 font-black tracking-widest uppercase">System Update v1.27 - Player Sync</p>
            </div>
        </main>
    );
}
