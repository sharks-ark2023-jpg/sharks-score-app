import { getMatches } from '@/lib/sheets';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import Link from 'next/link';
import { notFound } from 'next/navigation';

function getSpreadsheetId(gradeName: string) {
    const config = process.env.GRADES_CONFIG || '';
    const grades = config.split(',').reduce((acc, item) => {
        const [name, id] = item.split(':');
        acc[name] = id;
        return acc;
    }, {} as Record<string, string>);
    return grades[gradeName];
}

export default async function ViewMatchPage({ params }: { params: Promise<{ gradeId: string, matchId: string }> }) {
    const { gradeId, matchId } = await params;
    const spreadsheetId = getSpreadsheetId(gradeId);

    if (!spreadsheetId) notFound();

    const matches = await getMatches(spreadsheetId, `${gradeId}_Matches`);
    const match = matches.find(m => m.matchId === matchId);

    if (!match) notFound();

    const session = await getServerSession(authOptions);
    const isLoggedIn = !!session;

    const resultLabel = match.result === 'win' ? 'WIN' : match.result === 'loss' ? 'LOSE' : 'DRAW';
    const resultStyle = match.result === 'win'
        ? 'bg-green-500 text-white shadow-green-100'
        : match.result === 'loss'
            ? 'bg-red-500 text-white shadow-red-100'
            : 'bg-slate-400 text-white shadow-slate-100';

    const formatLabel = match.matchFormat === 'halves' ? '前後半' : `${match.matchDuration ?? 15}min`;

    return (
        <main className="flex-grow container mx-auto px-4 py-8 max-w-lg">
            <header className="mb-6 flex items-center justify-between">
                <Link href={`/grade/${gradeId}`} className="p-2 bg-slate-50 rounded-xl text-slate-400 hover:text-slate-600 transition-colors">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                </Link>
                {isLoggedIn && (
                    <Link
                        href={`/grade/${gradeId}/match/${matchId}`}
                        className="text-[10px] font-black text-blue-600 bg-blue-50 px-4 py-2 rounded-xl hover:bg-blue-100 transition-colors uppercase tracking-widest border border-blue-100"
                    >
                        編集する
                    </Link>
                )}
            </header>

            <div className="bg-white rounded-[2.5rem] shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden">
                {/* ヘッダー帯 */}
                <div className="px-6 pt-6 pb-4 border-b border-slate-50">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{match.matchDate}</span>
                        <div className="flex items-center gap-2">
                            {match.matchType === 'tournament' && (
                                <span className="text-[9px] font-black text-blue-600 bg-blue-50 px-2.5 py-1 rounded-full border border-blue-100 uppercase tracking-widest">
                                    {match.tournamentName || '公式戦'}
                                </span>
                            )}
                            <span className="text-[9px] font-black text-slate-500 bg-slate-50 px-2.5 py-1 rounded-full border border-slate-100 uppercase tracking-widest">
                                {formatLabel}
                            </span>
                        </div>
                    </div>
                    {!match.isLive && (
                        <span className={`inline-block text-[11px] font-black px-4 py-1.5 rounded-full uppercase tracking-widest shadow-sm ${resultStyle}`}>
                            {resultLabel}
                        </span>
                    )}
                </div>

                {/* スコア */}
                <div className="px-6 py-8">
                    <div className="grid grid-cols-3 items-center">
                        <div className="text-center">
                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-2">SHARKS</span>
                            <div className="font-heading font-black text-sm text-slate-700 leading-tight">{gradeId}</div>
                        </div>
                        <div className="flex flex-col items-center">
                            <div className="flex items-center gap-3">
                                <span className="text-6xl font-black text-slate-900 tabular-nums leading-none tracking-tighter">{match.ourScore}</span>
                                <span className="text-slate-900 text-4xl font-thin">-</span>
                                <span className="text-6xl font-black text-slate-900 tabular-nums leading-none tracking-tighter">{match.opponentScore}</span>
                            </div>
                            {match.pkInfo?.isPk && (
                                <div className="text-[10px] font-black text-blue-600 mt-3 px-3 py-1 bg-blue-50 rounded-full border border-blue-100 uppercase tracking-[0.2em]">
                                    PK {match.pkInfo.ourPkScore} - {match.pkInfo.opponentPkScore}
                                </div>
                            )}
                            {match.matchFormat === 'halves' && (match.ourScore1H !== undefined || match.ourScore2H !== undefined) && (
                                <div className="mt-3 flex gap-3">
                                    <div className="text-[9px] font-black text-slate-500 bg-slate-50 px-2.5 py-1 rounded-full border border-slate-100 uppercase tracking-widest">
                                        1H {match.ourScore1H ?? 0}-{match.opponentScore1H ?? 0}
                                    </div>
                                    <div className="text-[9px] font-black text-slate-500 bg-slate-50 px-2.5 py-1 rounded-full border border-slate-100 uppercase tracking-widest">
                                        2H {match.ourScore2H ?? 0}-{match.opponentScore2H ?? 0}
                                    </div>
                                </div>
                            )}
                        </div>
                        <div className="text-center border-l border-slate-100">
                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-2">対戦相手</span>
                            <div className="font-heading font-black text-sm text-slate-700 leading-tight uppercase">{match.opponentName}</div>
                        </div>
                    </div>
                </div>

                {/* 詳細情報 */}
                <div className="px-6 pb-6 space-y-3 border-t border-slate-50 pt-4">
                    {match.scorers && (
                        <div className="flex items-start gap-2">
                            <span className="text-base shrink-0 mt-0.5">⚽️</span>
                            <p className="text-xs font-bold text-slate-700 leading-relaxed">{match.scorers}</p>
                        </div>
                    )}
                    {match.mvp && (
                        <div className="flex items-center gap-2">
                            <span className="text-base shrink-0">⭐</span>
                            <p className="text-xs font-bold text-amber-700">MVP: {match.mvp}</p>
                        </div>
                    )}
                    {match.venueName && (
                        <div className="flex items-center gap-2">
                            <svg className="w-4 h-4 text-slate-300 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                            <p className="text-xs font-bold text-slate-500">{match.venueName}</p>
                        </div>
                    )}
                    {match.memo && (
                        <div className="mt-2 p-3 bg-slate-50 rounded-2xl border border-slate-100">
                            <p className="text-xs text-slate-500 italic leading-relaxed">"{match.memo}"</p>
                        </div>
                    )}
                </div>
            </div>
        </main>
    );
}
