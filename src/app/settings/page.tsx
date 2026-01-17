'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import useSWR from 'swr';
import { GlobalSettings, CommonMaster } from '@/types';

const fetcher = (url: string) => fetch(url).then(async (res) => {
    const data = await res.json();
    if (!res.ok) {
        const err = new Error(data.error || 'Fetch failed');
        if (data.spreadsheetId) (err as any).spreadsheetId = data.spreadsheetId;
        throw err;
    }
    return data;
});

export default function SettingsPage() {
    const router = useRouter();
    const { data, mutate } = useSWR<{ settings: GlobalSettings, masters: CommonMaster[] }>('/api/settings?grade=U12', fetcher);

    const [formData, setFormData] = useState<Partial<GlobalSettings>>({});
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    useEffect(() => {
        if (data?.settings) {
            setFormData(data.settings);
        }
    }, [data]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        setMessage(null);

        try {
            const res = await fetch('/api/settings', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            });

            if (!res.ok) throw new Error('保存に失敗しました');

            setMessage({ type: 'success', text: '設定を保存しました' });
            mutate(); // Refresh local cache
            router.refresh();
        } catch (err: any) {
            setMessage({ type: 'error', text: err.message });
        } finally {
            setSaving(false);
        }
    };
    const handleDeleteMaster = async (name: string, type: string) => {
        if (!confirm(`${name} を削除しますか？\n(削除しても過去の試合データは消えませんが、入力候補に出なくなります)`)) return;

        try {
            const res = await fetch(`/api/masters?name=${encodeURIComponent(name)}&type=${type}`, {
                method: 'DELETE',
            });

            if (!res.ok) throw new Error('削除に失敗しました');

            setMessage({ type: 'success', text: 'マスタを削除しました' });
            mutate();
        } catch (err: any) {
            setMessage({ type: 'error', text: err.message });
        }
    };

    const activeCommonId = formData.commonSpreadsheetId || (data as any)?.envCommonId;

    return (
        <main className="container mx-auto px-4 py-8 max-w-lg bg-white min-h-screen">
            <header className="mb-8">
                <h1 className="text-3xl font-black text-gray-900 text-center tracking-tighter">TEAM SETTINGS</h1>
                <p className="text-sm font-bold text-gray-400 text-center mt-1 uppercase tracking-widest">Global Configuration</p>
            </header>

            <form onSubmit={handleSubmit} className="bg-white p-8 rounded-[2rem] shadow-2xl shadow-blue-50 border border-gray-100 space-y-8">
                {message && (
                    <div className={`p-4 rounded-2xl text-sm font-black text-center animate-pulse ${message.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        {message.text}
                    </div>
                )}

                <div className="space-y-6">
                    <label className="block">
                        <span className="text-xs font-black uppercase tracking-widest text-gray-400 ml-1">チーム名</span>
                        <input
                            type="text"
                            value={formData.teamName || ''}
                            onChange={e => setFormData(p => ({ ...p, teamName: e.target.value }))}
                            className="mt-2 block w-full rounded-2xl border-2 border-gray-50 bg-gray-50 p-4 font-bold text-gray-900 focus:bg-white focus:border-blue-500 transition-all outline-none"
                            placeholder="例: SHARKS FC"
                            required
                        />
                    </label>

                    <label className="block">
                        <span className="text-xs font-black uppercase tracking-widest text-gray-400 ml-1">チームカラー</span>
                        <div className="flex gap-4 mt-2 items-center bg-gray-50 p-3 rounded-2xl border-2 border-gray-50">
                            <input
                                type="color"
                                value={formData.teamColor || '#1e3a8a'}
                                onChange={e => setFormData(p => ({ ...p, teamColor: e.target.value }))}
                                className="h-10 w-20 rounded-xl cursor-pointer border-none p-0 overflow-hidden bg-transparent"
                            />
                            <span className="text-sm font-black font-mono text-gray-400 uppercase tracking-tighter">{formData.teamColor || '#1E3A8A'}</span>
                        </div>
                    </label>

                    <label className="block">
                        <span className="text-xs font-black uppercase tracking-widest text-gray-400 ml-1">ロゴ画像URL</span>
                        <input
                            type="url"
                            value={formData.teamLogoUrl || ''}
                            onChange={e => setFormData(p => ({ ...p, teamLogoUrl: e.target.value }))}
                            placeholder="https://example.com/logo.png"
                            className="mt-2 block w-full rounded-2xl border-2 border-gray-50 bg-gray-50 p-4 font-bold text-gray-900 focus:bg-white focus:border-blue-500 transition-all outline-none"
                        />
                        {formData.teamLogoUrl && (
                            <div className="mt-4 flex justify-center p-6 bg-gray-50 rounded-[2rem] border-2 border-dashed border-gray-100">
                                <img src={formData.teamLogoUrl} alt="Preview" className="h-20 w-20 object-contain drop-shadow-md" />
                            </div>
                        )}
                    </label>
                </div>

                <div className="pt-8 border-t-2 border-gray-50">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-xs font-black uppercase tracking-[0.2em] text-gray-400">DATABASE INTEGRATION</h3>
                        <span className="bg-blue-600 text-white text-[8px] font-black px-2 py-0.5 rounded-full animate-pulse">CONNECTED</span>
                    </div>

                    <div className="space-y-6">
                        <label className="block">
                            <span className="text-sm font-black text-gray-700 flex items-center gap-1">
                                共通マスタ ID
                                {activeCommonId && (
                                    <a
                                        href={`https://docs.google.com/spreadsheets/d/${activeCommonId}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center gap-1 text-[10px] bg-green-100 text-green-700 px-2 py-1 rounded-full hover:bg-green-200 transition-colors"
                                    >
                                        GOOGLE SHEET を開く
                                        <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                        </svg>
                                    </a>
                                )}
                            </span>
                            <input
                                type="text"
                                value={formData.commonSpreadsheetId || ''}
                                onChange={e => setFormData(p => ({ ...p, commonSpreadsheetId: e.target.value }))}
                                placeholder={(data as any)?.envCommonId || "未設定 (Vercel環境変数を使用)"}
                                className="mt-2 block w-full rounded-2xl border-2 border-gray-50 bg-gray-50 p-4 font-mono text-[10px] font-bold text-gray-500 focus:bg-white focus:border-blue-500 transition-all outline-none"
                            />
                            {!formData.commonSpreadsheetId && (data as any)?.envCommonId && (
                                <p className="mt-2 text-[10px] font-bold text-blue-400 ml-1">
                                    現在は Vercel 環境変数の ID を使用しています
                                </p>
                            )}
                        </label>

                        <label className="block">
                            <span className="text-sm font-black text-gray-700">学年別設定 (GRADES_CONFIG)</span>
                            <textarea
                                value={formData.gradesConfig || ''}
                                onChange={e => setFormData(p => ({ ...p, gradesConfig: e.target.value }))}
                                placeholder={(data as any)?.envGradesConfig || "U12:ID1,U11:ID2"}
                                rows={2}
                                className="mt-2 block w-full rounded-2xl border-2 border-gray-50 bg-gray-50 p-4 font-mono text-[10px] font-bold text-gray-500 focus:bg-white focus:border-blue-500 transition-all outline-none"
                            />
                        </label>

                        <div className="bg-gray-50 p-5 rounded-2xl space-y-3">
                            <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-200 pb-2">SETUP GUIDE</h4>
                            <p className="text-[11px] font-bold text-gray-500 leading-relaxed">
                                連携が失敗する場合は、対象シートに <span className="text-blue-600 underline">CommonMasters</span> という名前のタブを作成し、1行目に以下のヘッダーを記述してください：
                            </p>
                            <code className="block bg-white p-3 rounded-xl border border-gray-200 text-[9px] font-black text-blue-600 break-all leading-relaxed">
                                masterType, name, grade, usageCount, createdAt, lastUsed
                            </code>
                        </div>
                    </div>
                </div>

                <div className="pt-4 flex gap-4">
                    <button
                        type="button"
                        onClick={() => router.back()}
                        className="flex-1 px-4 py-5 border-2 border-gray-100 text-gray-400 font-black rounded-3xl hover:bg-gray-50 transition-all uppercase text-xs tracking-widest"
                    >
                        CANCEL
                    </button>
                    <button
                        type="submit"
                        disabled={saving}
                        className="flex-[2] px-4 py-5 bg-blue-600 text-white font-black rounded-3xl shadow-2xl shadow-blue-200 hover:bg-blue-700 hover:-translate-y-1 active:translate-y-0 disabled:bg-blue-100 transition-all uppercase text-xs tracking-[0.2em]"
                    >
                        {saving ? 'SAVING...' : 'APPLY SETTINGS'}
                    </button>
                </div>
            </form>
            <section className="mt-12 space-y-6">
                <header>
                    <h2 className="text-xl font-bold text-gray-900">マスタデータ管理</h2>
                    <p className="text-xs text-gray-500 mt-1">会場名や対戦相手名の表記ゆれを修正・削除できます</p>
                </header>

                <div className="grid grid-cols-1 gap-6">
                    <MasterSection
                        title="対戦相手一覧"
                        type="opponent"
                        masters={data?.masters || []}
                        onDelete={handleDeleteMaster}
                    />
                    <MasterSection
                        title="会場一覧"
                        type="venue"
                        masters={data?.masters || []}
                        onDelete={handleDeleteMaster}
                    />
                </div>
            </section>
            <div className="mt-8 text-center">
                <p className="text-[10px] text-gray-300 font-mono tracking-widest uppercase">System Update v1.27 - Sync Active</p>
            </div>
        </main>
    );
}

function MasterSection({ title, type, masters, onDelete }: { title: string, type: string, masters: any[], onDelete: (name: string, type: string) => void }) {
    const filtered = masters.filter(m => m.masterType === type);

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <h3 className="text-sm font-bold text-gray-700 p-4 border-b bg-gray-50">{title} ({filtered.length})</h3>
            <ul className="divide-y divide-gray-100 max-h-60 overflow-y-auto">
                {filtered.map(m => (
                    <li key={m.name} className="flex justify-between items-center p-3 hover:bg-gray-50">
                        <div className="flex flex-col">
                            <span className="text-sm font-medium text-gray-900">{m.name}</span>
                            <span className="text-[10px] text-gray-400">利用回数: {m.usageCount || 0} / 最終: {new Date(m.lastUsed).toLocaleDateString()}</span>
                        </div>
                        <button
                            onClick={() => onDelete(m.name, type)}
                            className="text-red-400 hover:text-red-600 p-2"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                        </button>
                    </li>
                ))}
                {filtered.length === 0 && (
                    <li className="p-8 text-center text-xs text-gray-400">データがありません</li>
                )}
            </ul>
        </div>
    );
}
