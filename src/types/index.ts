export interface GlobalSettings {
  teamName: string;
  teamLogoUrl?: string;
  teamColor: string;
  lastUpdated: string;
  lastUpdatedBy: string;
}

export interface CommonMaster {
  masterType: 'venue' | 'opponent' | 'player';
  name: string;
  grade?: string; // For player master
  createdAt: string;
  lastUsed: string;
}

export interface Match {
  matchId: string;
  matchDate: string;
  matchType: 'tournament' | 'friendly';
  tournamentName?: string;
  opponentName: string;
  venueName: string;
  matchFormat: 'halves' | 'one_game';
  ourScore: number;
  opponentScore: number; // lostPoints also
  result: 'win' | 'loss' | 'draw';
  pkInfo?: {
    isPk: boolean;
    type: 'tiebreaker' | 'standalone';
    ourPkScore?: number;
    opponentPkScore?: number;
  };
  isLive: boolean;
  scorers?: string; // Change to array of player names later?
  mvp?: string;
  memo?: string;
  lastUpdated: string;
  lastUpdatedBy: string;
  createdAt: string;
  createdBy: string;
}

export interface GradeConfig {
  name: string;
  spreadsheetId: string;
}
