
import React, { useMemo } from 'react';
import type { Match, ScorerStat } from '../types';

interface ScorersListProps {
    matches: Match[];
    myTeam: string;
}

const TrophyIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-yellow-500" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M11.12 3.092a1 1 0 00-2.24 0l-1.05 2.583-2.84.413a1 1 0 00-.554 1.705l2.054 1.996-.485 2.828a1 1 0 001.451 1.054L10 12.34l2.53 1.33a1 1 0 001.45-1.054l-.485-2.828 2.054-1.996a1 1 0 00-.554-1.705l-2.84-.413-1.05-2.583zM10 15.5a1 1 0 01-1-1v-2.5a1 1 0 012 0V14.5a1 1 0 01-1 1z" clipRule="evenodd" />
         <path d="M4 5a2 2 0 100 4h12a2 2 0 100-4H4z" />
         <path fillRule="evenodd" d="M5 10h10v6a2 2 0 01-2 2H7a2 2 0 01-2-2v-6zm2 0v6h6v-6H7z" clipRule="evenodd" />
    </svg>
);

const calculateScorerStats = (matches: Match[], myTeam: string): ScorerStat[] => {
    const goalCounts: { [key: string]: number } = {};
    if (!myTeam) return [];

    matches.forEach(match => {
        const isMyTeamMatch = match.homeTeam === myTeam || match.awayTeam === myTeam;
        if (isMyTeamMatch && match.scorers) {
            match.scorers.forEach(scorer => {
                if (scorer && scorer.trim() !== '') {
                    const trimmedScorer = scorer.trim();
                    goalCounts[trimmedScorer] = (goalCounts[trimmedScorer] || 0) + 1;
                }
            });
        }
    });

    return Object.entries(goalCounts)
        .map(([name, goals]) => ({ name, goals }))
        .sort((a, b) => {
            if (b.goals !== a.goals) return b.goals - a.goals;
            return a.name.localeCompare(b.name);
        });
};

const ScorersList: React.FC<ScorersListProps> = ({ matches, myTeam }) => {
    const scorerStats = useMemo(() => calculateScorerStats(matches, myTeam), [matches, myTeam]);

    if (!myTeam) {
        return (
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md text-center">
                <p className="text-gray-500 dark:text-gray-400">得点ランキングを表示するには、まず「試合記録」タブからチーム名を設定してください。</p>
            </div>
        );
    }
    
    if (scorerStats.length === 0) {
        return (
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md text-center">
                <p className="text-gray-500 dark:text-gray-400">まだ得点記録がありません。「試合記録」から試合と得点者を追加してください。</p>
            </div>
        );
    }

    return (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
            <h3 className="text-xl font-semibold mb-4 text-gray-800 dark:text-gray-100 flex items-center gap-2">
                <TrophyIcon />
                <span>得点ランキング ({myTeam})</span>
            </h3>
            <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-gray-500 dark:text-gray-400">
                    <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
                        <tr>
                            <th scope="col" className="px-4 py-3 text-center w-16">順位</th>
                            <th scope="col" className="px-6 py-3">選手名</th>
                            <th scope="col" className="px-6 py-3 text-center">ゴール数</th>
                        </tr>
                    </thead>
                    <tbody>
                        {scorerStats.map((scorer, index) => (
                            <tr key={scorer.name} className="bg-white dark:bg-gray-800 border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors">
                                <td className="px-4 py-4 text-center font-bold text-lg text-gray-900 dark:text-white">
                                    {index < 3 ? ['🥇', '🥈', '🥉'][index] : index + 1}
                                </td>
                                <td className="px-6 py-4 font-medium text-gray-900 dark:text-white whitespace-nowrap">{scorer.name}</td>
                                <td className="px-6 py-4 text-center text-xl font-bold text-blue-600 dark:text-blue-400">{scorer.goals}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default ScorersList;
