import React from 'react';
import { Shiai, ShiaiShubetsu } from '../types';
import { UploadIcon } from './icons';
import LoadingSpinner from './LoadingSpinner';

interface MatchListProps {
    shiaiList: Shiai[];
    shiaiKakikomi: () => Promise<void>;
    doukiChuu: boolean;
    teamName: string;
}

const MatchList: React.FC<MatchListProps> = ({ shiaiList, shiaiKakikomi, doukiChuu, teamName }) => {

    const getShiaiKekka = (shiai: Shiai) => {
        const isHome = shiai.homeTeam === teamName;
        const homeScore = shiai.homeScore;
        const awayScore = shiai.awayScore;

        if ((isHome && homeScore > awayScore) || (!isHome && awayScore > homeScore)) return 'W';
        if ((isHome && homeScore < awayScore) || (!isHome && awayScore < homeScore)) return 'L';
        return 'D';
    }

    const getKekkaColor = (result: 'W' | 'D' | 'L') => {
        if (result === 'W') return 'bg-green-500/20 text-green-400 border-green-500';
        if (result === 'L') return 'bg-red-500/20 text-red-400 border-red-500';
        return 'bg-yellow-500/20 text-yellow-400 border-yellow-500';
    }

    const sortedShiaiList = [...shiaiList].sort((a, b) => new Date(b.hizuke).getTime() - new Date(a.hizuke).getTime());

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold text-highlight">試合履歴</h1>
                <button
                    onClick={shiaiKakikomi}
                    disabled={doukiChuu}
                    className="flex items-center justify-center px-4 py-2 bg-highlight text-white font-semibold rounded-lg shadow-md hover:bg-teal-500 disabled:bg-gray-500 disabled:cursor-not-allowed transition-colors"
                >
                    {doukiChuu ? <LoadingSpinner size="h-5 w-5" /> : <UploadIcon />}
                    <span className="ml-2">{doukiChuu ? '同期中...' : 'シートへ同期'}</span>
                </button>
            </div>
            
            <div className="bg-secondary rounded-lg shadow-md overflow-x-auto">
                {sortedShiaiList.length > 0 ? (
                    <ul className="divide-y divide-accent">
                        {sortedShiaiList.map(shiai => {
                            const result = getShiaiKekka(shiai);
                            const isHome = shiai.homeTeam === teamName;
                            const scoreDisplay = `${shiai.homeScore} - ${shiai.awayScore}`;
                            const halfScoreDisplay = shiai.shiaiShubetsu === ShiaiShubetsu.KOSHIKI && shiai.homeZenhanScore !== null
                                ? ` (前半: ${shiai.homeZenhanScore} - ${shiai.awayZenhanScore})`
                                : '';
                            
                            return (
                                <li key={shiai.id} className="p-4 hover:bg-accent transition-colors">
                                    <div className="grid grid-cols-12 gap-4 items-center">
                                        <div className="col-span-2 md:col-span-1 flex flex-col items-center justify-center">
                                            <span className={`text-xl font-bold px-2 py-1 rounded-md border ${getKekkaColor(result)}`}>{result}</span>
                                            <span className="text-xs mt-1 text-text-secondary">{shiai.shiaiShubetsu}</span>
                                        </div>
                                        <div className="col-span-10 md:col-span-11">
                                            <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
                                                <div className="flex-1">
                                                    <p className={`font-bold text-lg ${isHome ? 'text-text-primary' : 'text-text-secondary'}`}>{shiai.homeTeam}</p>
                                                    <p className={`font-bold text-lg ${!isHome ? 'text-text-primary' : 'text-text-secondary'}`}>{shiai.awayTeam}</p>
                                                </div>
                                                <div className="text-right mt-2 md:mt-0 md:text-center md:mx-4">
                                                    <p className="text-2xl font-mono tracking-tight font-bold text-highlight">{scoreDisplay}</p>
                                                    {halfScoreDisplay && <p className="text-xs text-text-secondary">{halfScoreDisplay}</p>}
                                                </div>
                                                <div className="flex-1 text-left md:text-right mt-2 md:mt-0">
                                                    <p className="text-sm text-text-primary">{new Date(shiai.hizuke).toLocaleDateString()}</p>
                                                    <p className="text-xs text-text-secondary truncate">{shiai.taikaiMei || shiai.kaijo}</p>
                                                </div>
                                            </div>
                                             {shiai.tokutenshaList.length > 0 && (
                                                <div className="mt-2 pt-2 border-t border-accent/50 text-xs text-text-secondary">
                                                    得点者: {shiai.tokutenshaList.map(s => `${s.senshu} (${s.tokutenSuu})`).join(', ')}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </li>
                            );
                        })}
                    </ul>
                ) : (
                    <p className="p-8 text-center text-text-secondary">まだ試合記録がありません。</p>
                )}
            </div>
        </div>
    );
};

export default MatchList;