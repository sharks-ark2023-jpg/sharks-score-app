import { google } from 'googleapis';
import type { Match } from '../types';
import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'POST') {
        res.setHeader('Allow', ['POST']);
        res.status(405).json({ message: 'Method Not Allowed' });
        return;
    }

    try {
        const { matches } = req.body;

        if (!matches || !Array.isArray(matches) || matches.length === 0) {
            return res.status(400).json({ message: 'No matches data provided.' });
        }

        const auth = new google.auth.GoogleAuth({
            credentials: {
                client_email: process.env.GOOGLE_SHEETS_CLIENT_EMAIL,
                private_key: process.env.GOOGLE_SHEETS_PRIVATE_KEY?.replace(/\\n/g, '\n'),
            },
            scopes: ['https://www.googleapis.com/auth/spreadsheets'],
        });

        const sheets = google.sheets({ version: 'v4', auth });
        
        if (!process.env.GOOGLE_SHEET_ID) {
            throw new Error("GOOGLE_SHEET_ID environment variable is not set.");
        }
        
        const spreadsheetId = process.env.GOOGLE_SHEET_ID;
        const range = '試合結果!A:J';

        const values = matches.map((match: Match) => [
            match.id,
            match.date,
            match.venue,
            match.homeTeam,
            match.awayTeam,
            match.homeScore,
            match.awayScore,
            match.scorers.join(', '),
            match.matchType || '',
            match.tournamentName || '',
        ]);

        await sheets.spreadsheets.values.append({
            spreadsheetId,
            range,
            valueInputOption: 'USER_ENTERED',
            requestBody: {
                values,
            },
        });

        res.status(200).json({ message: 'シートへの書き込みに成功しました。' });

    } catch (error) {
        console.error('Error writing to Google Sheet:', error);
        const message = error instanceof Error ? error.message : 'An unknown error occurred';
        res.status(500).json({ message: `Failed to write to Google Sheet: ${message}` });
    }
}