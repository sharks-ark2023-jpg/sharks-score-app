'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import useSWR from 'swr';
import { CommonMaster } from '@/types';
import Link from 'next/link';

const fetcher = (url: string) => fetch(url).then(res => res.json());

export default function PlayerManagementPage() {
    const { gradeId } = useParams() as { gradeId: string };
    const router = useRouter();
    const { data: players, error: fetchError, mutate, isLoading } = useSWR<CommonMaster[]>(`/api/masters?grade=${gradeId}`, fetcher);

    const [newName, setNewName] = useState('');
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'alert' | 'error', text: string, spreadsheetId?: string } | null>(null);

    const commonSpreadsheetId = (players as any)?.spreadsheetId || fetchError?.spreadsheetId;

    const handleAddPlayer = async (e: React.FormEvent) => {
        e.preventDefault();
        const nameToAdd = newName.trim();
        if (!nameToAdd) return;

        setSaving(true);
        setMessage(null);

        try {
            console.log('[Players] Adding player:', nameToAdd, 'to grade:', gradeId);
            const res = await fetch('/api/masters', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: nameToAdd, type: 'player', grade: gradeId }),
            });

            const contentType = res.headers.get('content-type');
            if (!res.ok) {
                let errorMsg = `HTTP Error ${res.status}`;
                if (contentType && contentType.includes('application/json')) {
                    const data = await res.json();
                    errorMsg = data.error || errorMsg;
                    if (data.spreadsheetId) {
                        setMessage({ type: 'error', text: `エラー: ${errorMsg}`, spreadsheetId: data.spreadsheetId });
                        return; // Exit early since we handled message
                    }
                } else {
                    const text = await res.text();
                    errorMsg = text.slice(0, 100) || errorMsg;
                }
                throw new Error(errorMsg);
            }

            setMessage({ type: 'success', text: `${nameToAdd} さんを追加しました` });
            setNewName('');
            await mutate(); // Re-fetch list
        } catch (err: any) {
            console.error('[Players] Add error:', err);
            setMessage({ type: 'error', text: `エラー: ${err.message}` });
        } finally {
            setSaving(false);
        }
    };

    const handleDeletePlayer = async (name: string) => {
        if (!confirm(`${name} さんを削除してもよろしいですか？`)) return;
        setMessage(null);

        try {
            const res = await fetch(`/api/masters?name=${encodeURIComponent(name)}&type=player&grade=${gradeId}`, {
                method: 'DELETE',
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || '削除に失敗しました');
            }

            setMessage({ type: 'success', text: '削除しました' });
            await mutate();
        } catch (err: any) {
            setMessage({ type: 'error', text: err.message });
        }
    };

    return (
        <main className="container mx-auto px-4 py-8 max-w-lg bg-white min-h-screen">
            <header className="mb-8">
                <div className="flex justify-between items-center">
                    <h1 className="text-2xl font-black text-gray-900">{gradeId} 選手管理</h1>
                    <Link href={`/grade/${gradeId}`} className="text-sm font-bold text-blue-600 hover:underline">← 戻る</Link>
                </div>
            </header>

            {fetchError && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl">
                    <p className="font-black">⚠️ データ読み込みエラー</p>
                    <p>{fetchError.message}</p>
                    {fetchError.spreadsheetId && (
                        <div className="mt-3">
                            <a
                                href={`https://docs.google.com/spreadsheets/d/${fetchError.spreadsheetId}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 bg-white px-3 py-2 rounded-lg border border-red-200 font-black hover:bg-red-100 transition-colors shadow-sm"
                            >
                                Google Sheets を開いて確認する
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                </svg>
                            </a>
                        </div>
                    )}
                </div>
            )}

            <section className="bg-white p-6 rounded-3xl shadow-lg border border-gray-100 mb-8">
                <h2 className="text-xs font-black uppercase tracking-wider text-gray-400 mb-4">新規選手登録</h2>
                <form onSubmit={handleAddPlayer} className="space-y-4">
                    <input
                        type="text"
                        value={newName}
                        onChange={(e) => setNewName(e.target.value)}
                        placeholder="選手名（例: 佐藤 太郎）"
                        className="w-full rounded-2xl border-2 border-gray-100 bg-gray-50 p-4 font-bold focus:border-blue-500 focus:ring-0 transition-all text-gray-900"
                        required
                    />
                    <button
                        type="submit"
                        disabled={saving}
                        className="w-full py-4 bg-blue-600 text-white font-black rounded-2xl shadow-xl hover:bg-blue-700 disabled:bg-blue-200 transition-all active:scale-95 flex justify-center items-center"
                    >
                        {saving ? (
                            <span className="flex items-center gap-2">
                                <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                保存中...
                            </span>
                        ) : '登録する'}
                    </button>
                </form>
                {message && (
                    <div className={`mt-6 p-4 rounded-2xl text-sm font-black text-center ${message.type === 'success' ? 'bg-green-100 text-green-800 animate-bounce' : 'bg-red-100 text-red-800'}`}>
                        <p>{message.text}</p>
                        {message.spreadsheetId && (
                            <div className="mt-4">
                                <a
                                    href={`https://docs.google.com/spreadsheets/d/${message.spreadsheetId}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-2 bg-white px-4 py-2 rounded-full border-2 border-red-200 text-xs hover:bg-red-50 transition-all font-black"
                                >
                                    Google シートを開く
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                    </svg>
                                </a>
                            </div>
                        )}
                    </div>
                )}
            </section>

            <section className="bg-white rounded-3xl shadow-lg border border-gray-100 overflow-hidden">
                <div className="p-6 border-b bg-gray-50 flex justify-between items-center">
                    <h2 className="text-xs font-black uppercase tracking-wider text-gray-400">登録済み選手</h2>
                    <span className="bg-blue-600 text-white text-[10px] px-2 py-0.5 rounded-full font-black">
                        {players?.filter(p => p.masterType === 'player').length || 0} 名
                    </span>
                </div>
                <ul className="divide-y divide-gray-50">
                    {isLoading ? (
                        <li className="p-12 text-center text-gray-300 font-bold animate-pulse italic">読み込み中...</li>
                    ) : players?.filter(p => p.masterType === 'player').length === 0 ? (
                        <li className="p-12 text-center text-gray-400 font-bold italic">選手が登録されていません</li>
                    ) : players?.filter(p => p.masterType === 'player').map((player) => (
                        <li key={player.name} className="flex justify-between items-center p-5 hover:bg-blue-50 group transition-colors">
                            <span className="font-bold text-gray-900">{player.name}</span>
                            <button
                                onClick={() => handleDeletePlayer(player.name)}
                                className="text-gray-200 hover:text-red-500 p-2 transition-colors"
                                title="削除"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </li>
                    ))}
                </ul>
            </section>

            <div className="mt-12 p-4 bg-gray-100 rounded-2xl text-[10px] font-bold text-gray-400 text-center">
                DEBUG: {gradeId} | {players ? 'Data Ready' : 'No Data'}
            </div>
        </main>
    );
}
