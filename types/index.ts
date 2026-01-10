export type Senshu = string;

export enum ShiaiShubetsu {
  KOSHIKI = '公式',
  TM = 'TM',
}

export interface Tokutensha {
  senshu: Senshu;
  tokutenSuu: number;
}

export interface Shiai {
  id: string;
  hizuke: string;
  kaijo: string;
  homeTeam: string;
  awayTeam: string;
  homeScore: number;
  awayScore: number;
  homeZenhanScore: number | null;
  awayZenhanScore: number | null;
  tokutenshaList: Tokutensha[];
  shiaiShubetsu: ShiaiShubetsu;
  taikaiMei: string | null;
}