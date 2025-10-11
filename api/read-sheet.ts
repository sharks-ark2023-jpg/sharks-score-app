import type { VercelRequest, VercelResponse } from '@vercel/node';
import { GoogleSpreadsheet } from 'google-spreadsheet';
import { JWT } from 'google-auth-library';

const serviceAccountAuth = new JWT({
  email: process.env.GOOGLE_SHEETS_CLIENT_EMAIL,
  key: process.env.GOOGLE_SHEETS_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  scopes: ['https://www.googleapis.com/auth/spreadsheets'],
});

const doc = new GoogleSpreadsheet(process.env.GOOGLE_SHEET_ID || '', serviceAccountAuth);

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    await doc.loadInfo();
    
    const matchesSheet = doc.sheetsByTitle['試合結果'];
    const playersSheet = doc.sheetsByTitle['選手一覧'];
    
    if (!matchesSheet || !playersSheet) {
      return res.status(404).json({ error: '必要なシート（試合結果 or 選手一覧）が見つかりません。' });
    }

    const matchRows = await matchesSheet.getRows();
    const matches = matchRows.map(row => row.toObject());

    const playerRows = await playersSheet.getRows();
    const players = playerRows.map(row => row.get('選手名')).filter(Boolean);


    // フロントエンドの期待する形式に変換
    const formattedMatches = matches.map(m => [
        m['ID'], m['日付'], m['会場'], m['ホームチーム'], m['アウェイチーム'],
        m['ホーム最終スコア'], m['アウェイ最終スコア'], m['ホーム前半スコア'], m['アウェイ前半スコア'],
        m['得点者'], m['試合種別'], m['大会名']
    ]);

    const formattedPlayers = players.map(p => [p]);


    res.status(200).json({ matches: formattedMatches, players: formattedPlayers });
  } catch (error: any) {
    console.error(error);
    res.status(500).json({ error: 'スプレッドシートからのデータ取得に失敗しました。', details: error.message });
  }
}
