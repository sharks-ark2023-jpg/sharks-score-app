export interface GlobalSettings {
  teamName: string;
  teamLogoUrl?: string;
  teamColor: string;
  gradesConfig?: string; // e.g. "U12:ID1,U11:ID2"
  commonSpreadsheetId?: string;
  lastUpdated: string;
  lastUpdatedBy: string;
}

export interface CommonMaster {
  masterType: 'venue' | 'opponent' | 'player';
  name: string;
  number?: string;
  grade?: string; // For player master
  usageCount?: number;
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
  matchDuration?: number;
  ourScore: number;
  ourScore1H?: number;
  ourScore2H?: number;
  opponentScore: number;
  opponentScore1H?: number;
  opponentScore2H?: number;
  result: 'win' | 'loss' | 'draw';
  pkInfo?: {
    isPk: boolean;
    type: 'tiebreaker' | 'standalone';
    ourPkScore?: number;
    opponentPkScore?: number;
  };
  isLive: boolean;
  matchPhase?: 'pre-game' | '1H' | 'halftime' | '2H' | 'full-time';
  scorers?: string;
  mvp?: string;
  memo?: string;
  lastUpdated: string;
  lastUpdatedBy: string;
  createdAt: string;
  createdBy: string;
  editingBy?: string;
  editingExpires?: string; // ISO string
}

export interface GradeConfig {
  name: string;
  spreadsheetId: string;
}
