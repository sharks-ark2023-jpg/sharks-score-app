import React from 'react';
import { Shiai, Tokutensha } from '../types';

interface DashboardProps {
    shiaiList: Shiai[];
    teamName: string;
}

const Dashboard: React.FC<DashboardProps> = ({ shiaiList, teamName }) => {
    const stats = {
        played: shiaiList.length,
        wins: 0,
        draws: 0,
        losses: 0,
        goalsFor: 0,
        goalsAgainst: 0,
    };

    shiaiList.forEach(shiai => {
        const isHome = shiai.homeTeam === teamName;
        const homeScore = shiai.homeScore;
        const awayScore = shiai.awayScore;
        
        if (isHome) {
            stats.goalsFor += homeScore;
            stats.goalsAgainst += awayScore;
            if (homeScore > awayScore) stats.wins++;
            else if (homeScore < awayScore) stats.losses++;
            else stats.draws++;
        } else { // ホームでなければアウェイチームが自チームと仮定
            stats.goalsFor += awayScore;
            stats.goalsAgainst += homeScore;
            if (awayScore > homeScore) stats.wins++;
            else if (awayScore < homeScore) stats.losses++;
            else stats.draws++;
        }
    });

    const points = stats.wins * 3 + stats.draws * 1;
    const goalDifference = stats.goalsFor - stats.goalsAgainst;
    const winRate = stats.played > 0 ? ((stats.wins / stats.played) * 100).toFixed(1) : '0.0';

    const allScorers = shiaiList.flatMap(shiai => shiai.tokutenshaList);
    const scorerRanking: Tokutensha[] = Object.values(
        allScorers.reduce((acc, { senshu, tokutenSuu }) => {
            acc[senshu] = acc[senshu] || { senshu, tokutenSuu: 0 };
            acc[senshu].tokutenSuu += tokutenSuu;
            return acc;
        }, {} as Record<string, Tokutensha>)
    ).sort((a, b) => b.tokutenSuu - a.tokutenSuu).slice(0, 10);

    const StatCard: React.FC<{ title: string; value: string | number; className?: string }> = ({ title, value, className }) => (
        <div className={`bg-secondary p-4 rounded-lg shadow-md text-center ${className}`}>
            <h3 className="text-sm font-medium text-text-secondary uppercase tracking-wider">{title}</h3>
            <p className="mt-1 text-3xl font-semibold text-text-primary">{value}</p>
        </div>
    );
    
    return (
        <div className="space-y-8">
            <h1 className="text-3xl font-bold text-highlight">ダッシュボード</h1>

            <section>
                <h2 className="text-xl font-semibold mb-4">チーム成績 ({teamName})</h2>
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-4 gap-4">
                    <StatCard title="試合数" value={stats.played} />
                    <StatCard title="勝点" value={points} />
                    <StatCard title="得失点差" value={goalDifference > 0 ? `+${goalDifference}` : goalDifference} />
                    <StatCard title="勝率" value={`${winRate}%`} />
                    <div className="col-span-2 grid grid-cols-3 gap-2 bg-secondary p-4 rounded-lg shadow-md text-center">
                        <div><h3 className="text-sm font-medium text-text-secondary">勝利</h3><p className="text-2xl font-semibold text-green-400">{stats.wins}</p></div>
                        <div><h3 className="text-sm font-medium text-text-secondary">引分</h3><p className="text-2xl font-semibold text-yellow-400">{stats.draws}</p></div>
                        <div><h3 className="text-sm font-medium text-text-secondary">敗戦</h3><p className="text-2xl font-semibold text-red-400">{stats.losses}</p></div>
                    </div>
                     <div className="col-span-2 grid grid-cols-2 gap-2 bg-secondary p-4 rounded-lg shadow-md text-center">
                        <div><h3 className="text-sm font-medium text-text-secondary">総得点</h3><p className="text-2xl font-semibold text-blue-400">{stats.goalsFor}</p></div>
                        <div><h3 className="text-sm font-medium text-text-secondary">総失点</h3><p className="text-2xl font-semibold text-orange-400">{stats.goalsAgainst}</p></div>
                    </div>
                </div>
            </section>
            
            <section>
                <h2 className="text-xl font-semibold mb-4">得点ランキング</h2>
                 <div className="bg-secondary rounded-lg shadow-md overflow-hidden">
                    {scorerRanking.length > 0 ? (
                        <ul className="divide-y divide-accent">
                            {scorerRanking.map(({ senshu, tokutenSuu }, index) => (
                                <li key={senshu} className="p-4 flex justify-between items-center">
                                    <div className="flex items-center">
                                        <span className={`text-lg font-bold w-8 text-center ${index < 3 ? 'text-highlight' : 'text-text-secondary'}`}>{index + 1}</span>
                                        <span className="ml-4 text-text-primary font-medium">{senshu}</span>
                                    </div>
                                    <span className="text-xl font-bold text-highlight">{tokutenSuu} ゴール</span>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <p className="p-4 text-center text-text-secondary">まだ得点記録がありません。</p>
                    )}
                </div>
            </section>
        </div>
    );
};

export default Dashboard;