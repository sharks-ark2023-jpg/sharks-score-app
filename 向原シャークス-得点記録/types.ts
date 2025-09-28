export interface Match {
  id: string;
  date: string;
  venue: string;
  homeTeam: string;
  awayTeam: string;
  homeScore: number;
  awayScore: number;
  scorers: string[];
  matchType?: '公式' | 'TM';
  tournamentName?: string;
}

export interface TeamStats {
  played: number;
  wins: number;
  draws: number;
  losses: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
  points: number;
}

export interface ScorerStat {
    name: string;
    goals: number;
}

export interface AutocompleteData {
    venues: string[];
    opponents: string[];
}
