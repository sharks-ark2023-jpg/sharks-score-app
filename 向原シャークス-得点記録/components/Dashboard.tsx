// Fix: Implement the full Dashboard component, which was previously missing.
import React, { useMemo } from 'react';
import type { Match, TeamStats } from '../types';
import ScorersList from './ScorersList';

interface DashboardProps {
    matches: Match[];
    myTeamName: string;
}

const calculateTeamStats = (matches: Match[], myTeamName: string): TeamStats => {
    return matches.reduce<TeamStats>((stats, match) => {
        const isMyTeamMatch = match.homeTeam === myTeamName || match.awayTeam === myTeamName;
        if (!isMyTeamMatch) return stats;

        const isHome = match.homeTeam === myTeamName;
        const myScore = isHome ? match.homeScore : match.awayScore;
        const opponentScore = isHome ? match.awayScore : match.homeScore;

        stats.played += 1;
        stats.goalsFor += myScore;
        stats.goalsAgainst += opponentScore;

        if (myScore > opponentScore) {
            stats.wins += 1;
            stats.points += 3;
        } else if (myScore < opponentScore) {
            stats.losses += 1;
        } else {
            stats.draws += 1;
            stats.points += 1;
        }
        
        stats.goalDifference = stats.goalsFor - stats.goalsAgainst;

        return stats;

    }, { played: 0, wins: 0, draws: 0, losses: 0, goalsFor: 0, goalsAgainst: 0, goalDifference: 0, points: 0 });
};

const StatCard: React.FC<{ label: string; value: string | number; className?: string }> = ({ label, value, className }) => (
    <div className={`bg-white dark:bg-gray-800 p-4 rounded-lg shadow text-center ${className}`}>
        <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{label}</p>
        <p className="mt-1 text-3xl font-bold text-gray-900 dark:text-white">{value}</p>
    </div>
);


const Dashboard: React.FC<DashboardProps> = ({ matches, myTeamName }) => {
    const stats = useMemo(() => calculateTeamStats(matches, myTeamName), [matches, myTeamName]);
    const winRate = stats.played > 0 ? ((stats.wins / stats.played) * 100).toFixed(1) : '0.0';

    if (!myTeamName || myTeamName === 'My Team') {
        return (
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md text-center">
                <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-2">ようこそ！</h2>
                <p className="text-gray-600 dark:text-gray-400">
                    まずは「設定」タブからあなたのチーム名を設定してください。
                </p>
            </div>
        );
    }
    
    if (matches.length === 0) {
        return (
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md text-center">
                <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-2">{myTeamName}</h2>
                 <p className="text-gray-600 dark:text-gray-400">
                    まだ試合データがありません。「試合記録」または「リアルタイム記録」から試合を追加してください。
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
                 <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-4">{myTeamName} の戦績</h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <StatCard label="試合数" value={stats.played} />
                    <StatCard label="勝点" value={stats.points} />
                    <StatCard label="勝率" value={`${winRate}%`} />
                    <StatCard label="得失点差" value={stats.goalDifference > 0 ? `+${stats.goalDifference}` : stats.goalDifference} />
                </div>
                <div className="mt-6 text-center text-lg text-gray-700 dark:text-gray-300">
                    <span className="font-bold text-green-600 dark:text-green-400">{stats.wins}</span>勝 - 
                    <span className="font-bold text-gray-600 dark:text-gray-400">{stats.draws}</span>分 - 
                    <span className="font-bold text-red-600 dark:text-red-400">{stats.losses}</span>敗
                </div>
                 <div className="mt-4 text-center text-lg text-gray-700 dark:text-gray-300">
                    <span className="font-bold text-blue-600 dark:text-blue-400">{stats.goalsFor}</span>得点 - 
                    <span className="font-bold">{stats.goalsAgainst}</span>失点
                </div>
            </div>

            <ScorersList matches={matches} myTeam={myTeamName} />
        </div>
    );
};

export default Dashboard;
