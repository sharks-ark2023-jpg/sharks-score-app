import type { VercelRequest, VercelResponse } from '@vercel/node';
import { GoogleSpreadsheet } from 'google-spreadsheet';
import { JWT } from 'google-auth-library';

const serviceAccountAuth = new JWT({
  email: process.env.GOOGLE_SHEETS_CLIENT_EMAIL,
  key: process.env.GOOGLE_SHEETS_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  scopes: ['https://www.googleapis.com/auth/spreadsheets'],
});

const doc = new GoogleSpreadsheet(process.env.GOOGLE_SHEET_ID || '', serviceAccountAuth);

const SHEET_HEADER = [
  'ID', '日付', '会場', 'ホームチーム', 'アウェイチーム', 
  'ホーム最終スコア', 'アウェイ最終スコア', 'ホーム前半スコア', 'アウェイ前半スコア', 
  '得点者', '試合種別', '大会名'
];

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'POSTメソッドのみ許可されています' });
  }

  try {
    const { matches } = req.body;
    if (!Array.isArray(matches)) {
      return res.status(400).json({ error: '`matches` 配列が必要です' });
    }

    await doc.loadInfo();
    const sheet = doc.sheetsByTitle['試合結果'];
    
    if (!sheet) {
        return res.status(404).json({ error: '`試合結果`シートが見つかりません。' });
    }

    await sheet.clear();
    await sheet.setHeaderRow(SHEET_HEADER);
    
    const rowsToAdd = matches.map(matchData => {
        const row: Record<string, any> = {};
        SHEET_HEADER.forEach((header, index) => {
            row[header] = matchData[index] ?? ''; // undefinedの代わりに空文字をセット
        });
        return row;
    });

    await sheet.addRows(rowsToAdd);

    res.status(200).json({ message: 'データが正常に書き込まれました。' });
  } catch (error: any) {
    console.error(error);
    res.status(500).json({ error: 'スプレッドシートへの書き込みに失敗しました。', details: error.message });
  }
}
