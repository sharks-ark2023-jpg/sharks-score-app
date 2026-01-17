'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import useSWR from 'swr';
import { GlobalSettings, CommonMaster } from '@/types';

const fetcher = (url: string) => fetch(url).then(res => res.json());

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

    if (!data) return <div className="p-8 text-center">読み込み中...</div>;

    return (
        <main className="container mx-auto px-4 py-8 max-w-lg">
            <header className="mb-8">
                <h1 className="text-2xl font-bold text-gray-900 text-center">チーム設定</h1>
                <p className="text-sm text-gray-500 text-center mt-1">アプリ全体の表示や色を設定します</p>
            </header>

            <form onSubmit={handleSubmit} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 space-y-6">
                {message && (
                    <div className={`p-4 rounded-xl text-sm font-bold ${message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                        {message.text}
                    </div>
                )}

                <label className="block">
                    <span className="text-sm font-bold text-gray-700">チーム名</span>
                    <input
                        type="text"
                        value={formData.teamName || ''}
                        onChange={e => setFormData(p => ({ ...p, teamName: e.target.value }))}
                        className="mt-1 block w-full rounded-lg border-gray-300 bg-gray-50 p-3 focus:ring-blue-500 focus:border-blue-500"
                        required
                    />
                </label>

                <label className="block">
                    <span className="text-sm font-bold text-gray-700">チームカラー</span>
                    <div className="flex gap-4 mt-1 items-center">
                        <input
                            type="color"
                            value={formData.teamColor || '#1e3a8a'}
                            onChange={e => setFormData(p => ({ ...p, teamColor: e.target.value }))}
                            className="h-10 w-20 rounded cursor-pointer border-none p-0"
                        />
                        <span className="text-xs font-mono text-gray-500 uppercase">{formData.teamColor}</span>
                    </div>
                </label>

                <label className="block">
                    <span className="text-sm font-bold text-gray-700">ロゴ画像URL</span>
                    <input
                        type="url"
                        value={formData.teamLogoUrl || ''}
                        onChange={e => setFormData(p => ({ ...p, teamLogoUrl: e.target.value }))}
                        placeholder="https://example.com/logo.png"
                        className="mt-1 block w-full rounded-lg border-gray-300 bg-gray-50 p-3 focus:ring-blue-500 focus:border-blue-500 font-medium"
                    />
                    {formData.teamLogoUrl && (
                        <div className="mt-3 flex justify-center p-4 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                            <img src={formData.teamLogoUrl} alt="Preview" className="h-16 object-contain" />
                        </div>
                    )}
                </label>

                <div className="pt-4 border-t border-gray-100">
                    <h3 className="text-xs font-black uppercase tracking-wider text-gray-400 mb-4">スプレッドシート管理</h3>

                    <div className="space-y-4">
                        <label className="block">
                            <span className="text-sm font-bold text-gray-700">共通マスタ用 ID</span>
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    value={formData.commonSpreadsheetId || ''}
                                    onChange={e => setFormData(p => ({ ...p, commonSpreadsheetId: e.target.value }))}
                                    placeholder="Spreadsheet ID"
                                    className="flex-grow rounded-lg border-gray-300 bg-gray-50 p-3 focus:ring-blue-500 focus:border-blue-500 font-mono text-xs"
                                />
                                {formData.commonSpreadsheetId && (
                                    <a
                                        href={`https://docs.google.com/spreadsheets/d/${formData.commonSpreadsheetId}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="p-3 bg-green-50 text-green-600 rounded-lg hover:bg-green-100 transition-colors"
                                        title="スプレッドシートを開く"
                                    >
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                        </svg>
                                    </a>
                                )}
                            </div>
                        </label>

                        <label className="block">
                            <span className="text-sm font-bold text-gray-700">学年別 ID 設定</span>
                            <p className="text-[10px] text-gray-400 mb-1">形式: 学年名:ID,学年名:ID (例: U12:ID1,U11:ID2)</p>
                            <textarea
                                value={formData.gradesConfig || ''}
                                onChange={e => setFormData(p => ({ ...p, gradesConfig: e.target.value }))}
                                placeholder="U12:spreadsheet_id_xxx"
                                rows={2}
                                className="mt-1 block w-full rounded-lg border-gray-300 bg-gray-50 p-3 focus:ring-blue-500 focus:border-blue-500 font-mono text-xs"
                            />
                        </label>

                        {formData.gradesConfig && formData.gradesConfig.split(',').map((item, i) => {
                            const [name, id] = item.split(':');
                            if (!id) return null;
                            return (
                                <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-100">
                                    <span className="text-xs font-bold text-gray-600">{name} 閲覧リンク</span>
                                    <a
                                        href={`https://docs.google.com/spreadsheets/d/${id}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center gap-1 text-[10px] font-black text-blue-600 hover:underline"
                                    >
                                        Google Sheets を開く
                                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                        </svg>
                                    </a>
                                </div>
                            );
                        })}
                    </div>
                </div>

                <div className="pt-4 flex gap-3">
                    <button
                        type="button"
                        onClick={() => router.back()}
                        className="flex-1 px-4 py-3 border border-gray-200 text-gray-600 font-bold rounded-xl hover:bg-gray-50 transition-colors"
                    >
                        戻る
                    </button>
                    <button
                        type="submit"
                        disabled={saving}
                        className="flex-[2] px-4 py-3 bg-blue-600 text-white font-bold rounded-xl shadow-lg shadow-blue-200 hover:bg-blue-700 disabled:opacity-50 transition-all uppercase tracking-tight"
                    >
                        {saving ? '保存中...' : '設定を適用'}
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
                        masters={data.masters || []}
                        onDelete={handleDeleteMaster}
                    />
                    <MasterSection
                        title="会場一覧"
                        type="venue"
                        masters={data.masters || []}
                        onDelete={handleDeleteMaster}
                    />
                </div>
            </section>
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
