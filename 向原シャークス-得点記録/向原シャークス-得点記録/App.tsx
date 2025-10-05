// Fix: Implement the full App component, which was previously missing.
// This resolves the error in index.tsx about App.tsx not being a module.
import React, { useState, useMemo } from 'react';
import Header from './components/Header';
import Dashboard from './components/Dashboard';
import AddMatchForm from './components/AddMatchForm';
import MatchList from './components/MatchList';
import PlayerManagement from './components/PlayerManagement';
import Settings from './components/Settings';
import RealtimeTracker from './components/RealtimeTracker';
import useLocalStorage from './hooks/useLocalStorage';
import { useSpreadsheet } from './hooks/useSpreadsheet';
import type { Match, AutocompleteData } from './types';
import { v4 as uuidv4 } from 'uuid';

const App: React.FC = () => {
    const [myTeamName, setMyTeamName] = useLocalStorage<string>('myTeamName', 'My Team');
    const [matches, setMatches] = useLocalStorage<Match[]>('matches', []);
    const [players, setPlayers] = useLocalStorage<string[]>('players', []);
    const [activeMatch, setActiveMatch] = useLocalStorage<Match | null>('activeMatch', null);
    
    const [activeTab, setActiveTab] = useState('dashboard');

    const { writeToSheet, loading: isExporting, error: exportError, success: exportSuccess } = useSpreadsheet();

    const handleAddMatch = (matchData: Omit<Match, 'id'>) => {
        const newMatch: Match = { ...matchData, id: uuidv4() };
        setMatches(prevMatches => [...prevMatches, newMatch].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
        setActiveTab('match-list');
    };

    const handleDeleteMatch = (matchId: string) => {
        if (window.confirm('この試合を削除してもよろしいですか？')) {
            setMatches(prevMatches => prevMatches.filter(m => m.id !== matchId));
        }
    };

    const handleStartMatch = (opponentTeam: string, venue: string, matchType: '公式' | 'TM', tournamentName?: string) => {
        const newMatch: Match = {
            id: uuidv4(),
            date: new Date().toISOString().split('T')[0],
            venue,
            homeTeam: myTeamName,
            awayTeam: opponentTeam,
            homeScore: 0,
            awayScore: 0,
            scorers: [],
            matchType,
            tournamentName,
        };
        setActiveMatch(newMatch);
        setActiveTab('realtime');
    };

    const handleUpdateMatch = (updatedMatch: Match) => {
        setActiveMatch(updatedMatch);
    };

    const handleEndMatch = () => {
        if (activeMatch) {
            setMatches(prev => [activeMatch, ...prev].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
            setActiveMatch(null);
            setActiveTab('match-list');
        }
    };
    
    const handleExportToSheet = () => {
        if (matches.length === 0) {
            alert('エクスポートする試合がありません。');
            return;
        }
        writeToSheet(matches);
    };

    const autocompleteData = useMemo<AutocompleteData>(() => {
        const venues = [...new Set(matches.map(m => m.venue))];
        const opponents = [...new Set(matches.map(m => m.awayTeam === myTeamName ? m.homeTeam : m.awayTeam))];
        return { venues, opponents };
    }, [matches, myTeamName]);
    
    const renderTabContent = () => {
        switch (activeTab) {
            case 'dashboard':
                return <Dashboard matches={matches} myTeamName={myTeamName} />;
            case 'add-match':
                return <AddMatchForm onAddMatch={handleAddMatch} myTeam={myTeamName} players={players} autocompleteData={autocompleteData} />;
            case 'match-list':
                return <MatchList 
                            matches={matches} 
                            myTeamName={myTeamName} 
                            onDeleteMatch={handleDeleteMatch}
                            onExportToSheet={handleExportToSheet}
                            isExporting={isExporting}
                            exportError={exportError}
                            exportSuccess={exportSuccess}
                        />;
             case 'realtime':
                return <RealtimeTracker 
                            myTeam={myTeamName}
                            players={players}
                            activeMatch={activeMatch}
                            autocompleteData={autocompleteData}
                            onStartMatch={handleStartMatch}
                            onUpdateMatch={handleUpdateMatch}
                            onEndMatch={handleEndMatch}
                        />;
            case 'players':
                return <PlayerManagement players={players} setPlayers={setPlayers} />;
            case 'settings':
                // Fix: Pass the `players` array to the Settings component, as it's required for data export.
                return <Settings myTeamName={myTeamName} setMyTeamName={setMyTeamName} setMatches={setMatches} setPlayers={setPlayers} matches={matches} players={players} />;
            default:
                return null;
        }
    };

    const TabButton = ({ tabId, label }: { tabId: string, label: string }) => (
        <button
            onClick={() => setActiveTab(tabId)}
            className={`px-3 sm:px-4 py-2 text-sm sm:text-base font-medium rounded-md transition-colors duration-200 ${
                activeTab === tabId
                    ? 'bg-blue-600 text-white shadow'
                    : 'text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
            }`}
        >
            {label}
        </button>
    );

    return (
        <div className="min-h-screen bg-gray-100 dark:bg-gray-900 text-gray-800 dark:text-gray-200 font-sans">
            <Header myTeamName={myTeamName} />
            <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
                <div className="px-4 py-6 sm:px-0">
                    <div className="mb-6">
                         <div className="flex flex-wrap items-center gap-2 p-2 bg-white dark:bg-gray-800 rounded-lg shadow-sm">
                            <TabButton tabId="dashboard" label="ダッシュボード" />
                            <TabButton tabId="realtime" label="リアルタイム記録" />
                            <TabButton tabId="add-match" label="試合記録" />
                            <TabButton tabId="match-list" label="試合一覧" />
                            <TabButton tabId="players" label="選手管理" />
                            <TabButton tabId="settings" label="設定" />
                        </div>
                    </div>
                    
                    <div className="space-y-6">
                        {renderTabContent()}
                    </div>
                </div>
            </main>
        </div>
    );
};

export default App;