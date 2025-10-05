import React, { useState, useMemo, useEffect } from 'react';
import Header from './components/Header';
import Dashboard from './components/Dashboard';
import AddMatchForm from './components/AddMatchForm';
import MatchList from './components/MatchList';
import PlayerManagement from './components/PlayerManagement';
import Settings from './components/Settings';
import RealtimeTracker from './components/RealtimeTracker';
import useLocalStorage from './hooks/useLocalStorage';
import { useSpreadsheet } from './hooks/useSpreadsheet';
import { useSheetData } from './hooks/useSheetData';
import type { Match, AutocompleteData } from './types';
import { v4 as uuidv4 } from 'uuid';

const App: React.FC = () => {
    const { data, loading: isLoadingData, error: dataError, refetch: refetchSheetData } = useSheetData();
    const [myTeamName, setMyTeamName] = useLocalStorage<string>('myTeamName', 'My Team');
    const [matches, setMatches] = useState<Match[]>([]);
    const [players, setPlayers] = useState<string[]>([]);
    const [activeMatch, setActiveMatch] = useLocalStorage<Match | null>('activeMatch', null);
    
    const [activeTab, setActiveTab] = useState('dashboard');

    const { writeToSheet, loading: isExporting, error: exportError, success: exportSuccess } = useSpreadsheet();

    useEffect(() => {
        if (data) {
            setMatches(data.matches);
            setPlayers(data.players);
        }
    }, [data]);
    
    const handleAddMatch = (matchData: Omit<Match, 'id'>) => {
        const newMatch: Match = { ...matchData, id: uuidv4() };
        const updatedMatches = [...matches, newMatch].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        // Immediately update UI for better UX
        setMatches(updatedMatches);
        // Then, write to sheet and refetch to confirm
        writeToSheet([newMatch]).then(() => {
            refetchSheetData();
        });
        setActiveTab('match-list');
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
            const endedMatch = activeMatch;
            const updatedMatches = [endedMatch, ...matches].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
             // Immediately update UI
            setMatches(updatedMatches);
            setActiveMatch(null);
            // Write to sheet and refetch all data
            writeToSheet([endedMatch]).then(() => {
                refetchSheetData();
            });
            setActiveTab('match-list');
        }
    };
    
    const handleExportToSheet = () => {
        if (matches.length === 0) {
            alert('エクスポートする試合がありません。');
            return;
        }
        writeToSheet(matches).then(() => {
            // After a mass export, refetch to get the canonical state from the sheet
            refetchSheetData();
        });
    };

    const autocompleteData = useMemo<AutocompleteData>(() => {
        const venues = [...new Set(matches.map(m => m.venue))];
        const opponents = [...new Set(matches.map(m => m.awayTeam === myTeamName ? m.homeTeam : m.awayTeam))];
        return { venues, opponents };
    }, [matches, myTeamName]);
    
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

    const renderTabContent = () => {
        if (isLoadingData) {
            return <div className="text-center p-10 bg-white dark:bg-gray-800 rounded-lg shadow">データを読み込んでいます...</div>;
        }
        if (dataError) {
            return <div className="text-center p-10 bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-200 rounded-lg shadow">{dataError}</div>;
        }

        switch (activeTab) {
            case 'dashboard':
                return <Dashboard matches={matches} myTeamName={myTeamName} />;
            case 'add-match':
                return <AddMatchForm onAddMatch={handleAddMatch} myTeam={myTeamName} players={players} autocompleteData={autocompleteData} />;
            case 'match-list':
                return <MatchList 
                            matches={matches} 
                            myTeamName={myTeamName} 
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
                return <PlayerManagement players={players} />;
            case 'settings':
                return <Settings myTeamName={myTeamName} setMyTeamName={setMyTeamName} matches={matches} players={players} />;
            default:
                return null;
        }
    };

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