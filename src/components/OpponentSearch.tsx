'use client';

interface Props {
    value: string;
    onChange: (value: string) => void;
    resultCount: number;
    hint?: string;
}

export default function OpponentSearch({ value, onChange, resultCount, hint }: Props) {
    return (
        <div className="mb-5 rounded-2xl border border-slate-100 bg-white p-4">
            <label htmlFor="opponent-search" className="mb-2 block text-sm font-bold text-slate-700">対戦相手で検索</label>
            <div className="flex items-center gap-2">
                <input
                    id="opponent-search"
                    type="search"
                    value={value}
                    onChange={event => onChange(event.target.value)}
                    placeholder="対戦相手名の一部を入力"
                    className="min-w-0 flex-1 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-base text-slate-900 focus:border-blue-500 focus:outline-none"
                />
                {value.length > 0 && (
                    <button type="button" onClick={() => onChange('')} className="shrink-0 rounded-xl border border-slate-200 px-3 py-2 text-xs font-bold text-slate-600" aria-label="検索をクリア">クリア</button>
                )}
            </div>
            {hint && <p className="mt-2 text-xs text-slate-500">{hint}</p>}
            <p className="mt-2 text-xs font-bold text-slate-500" role="status">{resultCount}件の試合</p>
        </div>
    );
}
