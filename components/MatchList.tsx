// Fix: Implement the full MatchList component, which was previously missing.
import React from 'react';
import type { Match } from '../types';

interface MatchListProps {
    matches: Match[];
    myTeamName: string;
    onDeleteMatch: (matchId: string) => void;
    onExportToSheet: () => void;
    isExporting: boolean;
    exportError: string | null;
    exportSuccess: string | null;
}

const MatchList: React.FC<MatchListProps> = ({ matches, myTeamName, onDeleteMatch, onExportToSheet, isExporting, exportError, exportSuccess }) => {

    const getMatchResult = (match: Match) => {
        const isHome = match.homeTeam === myTeamName;
        const myScore = isHome ? match.homeScore : match.awayScore;
        const opponentScore = isHome ? match.awayScore : match.homeScore;

        if (myScore > opponentScore) return 'W';
        if (myScore < opponentScore) return 'L';
        return 'D';
    };
    
    const getResultColor = (result: 'W' | 'L' | 'D') => {
        switch(result) {
            case 'W': return 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200';
            case 'L': return 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200';
            case 'D': return 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200';
        }
    }

    const ExportFeedback = () => {
        if (exportError) {
            return <div className="mt-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded" role="alert">{exportError}</div>;
        }
        if (exportSuccess) {
            return <div className="mt-4 bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded" role="alert">{exportSuccess}</div>;
        }
        return null;
    }

    if (matches.length === 0) {
        return (
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md text-center">
                <h3 className="text-xl font-semibold mb-2 text-gray-800 dark:text-gray-100">試合一覧</h3>
                <p className="text-gray-500 dark:text-gray-400">まだ試合が記録されていません。「試合記録」タブから最初の試合を追加してください。</p>
            </div>
        );
    }
    
    return (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-4">
                <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-100">試合一覧</h3>
                <button
                    onClick={onExportToSheet}
                    disabled={isExporting}
                    className="w-full sm:w-auto bg-green-600 text-white font-bold py-2 px-4 rounded-md hover:bg-green-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center"
                >
                    {isExporting ? 'エクスポート中...' : '共有シートにエクスポート'}
                </button>
            </div>
            
            <ExportFeedback />

            <div className="space-y-4 mt-4">
                {matches.map(match => {
                    const result = getMatchResult(match);
                    return (
                        <div key={match.id} className="p-4 border dark:border-gray-700 rounded-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 transition-shadow hover:shadow-lg">
                            <div className="flex-grow">
                                <div className="flex items-center gap-3 mb-2">
                                    <span className={`w-8 h-8 flex items-center justify-center font-bold text-lg rounded-full ${getResultColor(result)}`}>
                                        {result}
                                    </span>
                                    <div>
                                        <p className="font-bold text-lg text-gray-900 dark:text-white">
                                            {match.homeTeam} {match.homeScore} - {match.awayScore} {match.awayTeam}
                                        </p>
                                        <p className="text-sm text-gray-500 dark:text-gray-400">
                                            {new Date(match.date).toLocaleDateString('ja-JP')} @ {match.venue}
                                        </p>
                                    </div>
                                </div>
                                {(match.tournamentName || (match.scorers && match.scorers.length > 0)) && (
                                     <div className="mt-2 pl-11 text-sm text-gray-600 dark:text-gray-300 space-y-1">
                                        {match.tournamentName && <p><span className="font-semibold">大会:</span> {match.tournamentName} ({match.matchType})</p>}
                                        {match.homeTeam === myTeamName && match.scorers && match.scorers.length > 0 && <p><span className="font-semibold">得点者:</span> {match.scorers.join(', ')}</p>}
                                     </div>
                                )}
                            </div>
                            <button 
                                onClick={() => onDeleteMatch(match.id)} 
                                className="ml-auto sm:ml-0 flex-shrink-0 bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-3 text-xs rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 dark:focus:ring-offset-gray-800"
                                aria-label={`${match.date}の試合を削除`}
                            >
                                削除
                            </button>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default MatchList;