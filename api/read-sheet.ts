import { google } from 'googleapis';
import type { Match } from '../types';
import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'GET') {
        res.setHeader('Allow', ['GET']);
        res.status(405).json({ message: 'Method Not Allowed' });
        return;
    }

    try {
        const auth = new google.auth.GoogleAuth({
            credentials: {
                client_email: process.env.GOOGLE_SHEETS_CLIENT_EMAIL,
                private_key: process.env.GOOGLE_SHEETS_PRIVATE_KEY?.replace(/\\n/g, '\n'),
            },
            scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
        });

        const sheets = google.sheets({ version: 'v4', auth });

        if (!process.env.GOOGLE_SHEET_ID) {
            throw new Error("GOOGLE_SHEET_ID environment variable is not set.");
        }

        const spreadsheetId = process.env.GOOGLE_SHEET_ID;

        // Parallel fetch for matches and players
        const [matchesResponse, playersResponse] = await Promise.all([
            sheets.spreadsheets.values.get({
                spreadsheetId,
                range: '試合結果!A:J', 
            }),
            sheets.spreadsheets.values.get({
                spreadsheetId,
                range: '選手一覧!A2:A',
            })
        ]);

        // Parse matches
        const matchRows = matchesResponse.data.values;
        let matches: Match[] = [];
        if (matchRows && matchRows.length > 1) { 
            matches = matchRows.slice(1).map((row): Match | null => {
                if (!row[0]) return null; 
                
                const scorersString = row[7] || '';
                return {
                    id: row[0],
                    date: row[1],
                    venue: row[2],
                    homeTeam: row[3],
                    awayTeam: row[4],
                    homeScore: parseInt(row[5], 10) || 0,
                    awayScore: parseInt(row[6], 10) || 0,
                    scorers: scorersString ? scorersString.split(',').map((s: string) => s.trim()) : [],
                    matchType: row[8] === '公式' || row[8] === 'TM' ? row[8] : undefined,
                    tournamentName: row[9] || undefined,
                };
            }).filter((m): m is Match => m !== null);
        }

        // Parse players
        const players = playersResponse.data.values ? playersResponse.data.values.flat().filter(p => p && p.trim() !== '') : [];

        res.status(200).json({ matches, players });

    } catch (error) {
        console.error('Error reading from Google Sheet:', error);
        const message = error instanceof Error ? error.message : 'An unknown error occurred';
        res.status(500).json({ message: `Failed to read from Google Sheet: ${message}` });
    }
}