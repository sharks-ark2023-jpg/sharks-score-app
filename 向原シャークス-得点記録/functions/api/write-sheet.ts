import { google } from 'googleapis';
import type { Match } from '../../types';

// Define the structure of the expected request body
interface WriteSheetRequest {
  matches: Match[];
}

// Define the structure of the serverless function's response
interface WriteSheetResponse {
  success: boolean;
  message: string;
  addedCount?: number;
}

// This is a placeholder for your serverless function's event/request object.
// Vercel, Netlify, etc., have different structures.
// We'll assume a simple object with a `json` method for the body.
interface ServerlessRequest {
  json: () => Promise<WriteSheetRequest>;
  method: string;
}

// Main handler function for the serverless endpoint
export default async function handler(req: ServerlessRequest): Promise<Response> {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ success: false, message: 'Method Not Allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const {
    GOOGLE_SHEET_ID,
    GOOGLE_SHEETS_CLIENT_EMAIL,
    GOOGLE_SHEETS_PRIVATE_KEY,
  } = process.env;

  if (!GOOGLE_SHEET_ID || !GOOGLE_SHEETS_CLIENT_EMAIL || !GOOGLE_SHEETS_PRIVATE_KEY) {
    console.error('Missing required environment variables');
    return new Response(JSON.stringify({ success: false, message: 'Server configuration error.' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const body = await req.json();
    const { matches } = body;

    if (!Array.isArray(matches)) {
      return new Response(JSON.stringify({ success: false, message: 'Invalid payload: "matches" must be an array.' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: GOOGLE_SHEETS_CLIENT_EMAIL,
        // Replace escaped newlines with actual newlines
        private_key: GOOGLE_SHEETS_PRIVATE_KEY.replace(/\\n/g, '\n'),
      },
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });

    const sheets = google.sheets({ version: 'v4', auth });
    const sheetName = '試合結果';

    // 1. Get existing match IDs from the sheet to prevent duplicates
    const getRowsResponse = await sheets.spreadsheets.values.get({
      spreadsheetId: GOOGLE_SHEET_ID,
      range: `${sheetName}!A2:A`, // Assuming ID is in column A
    });
    const existingIds = new Set(getRowsResponse.data.values?.flat() ?? []);

    // 2. Prepare header row if the sheet is empty
    const header = ['ID', '日付', '会場', 'ホームチーム', 'アウェイチーム', 'ホームスコア', 'アウェイスコア', '得点者', '試合種別', '大会名'];
    
    // Check if header exists
     const getHeaderResponse = await sheets.spreadsheets.values.get({
        spreadsheetId: GOOGLE_SHEET_ID,
        range: `${sheetName}!A1:J1`,
    });
    if (!getHeaderResponse.data.values || getHeaderResponse.data.values.length === 0) {
        await sheets.spreadsheets.values.update({
            spreadsheetId: GOOGLE_SHEET_ID,
            range: `${sheetName}!A1`,
            valueInputOption: 'USER_ENTERED',
            requestBody: { values: [header] },
        });
    }


    // 3. Filter out matches that already exist
    const newMatches = matches.filter(match => !existingIds.has(match.id));
    
    if (newMatches.length === 0) {
      return new Response(JSON.stringify({ success: true, message: 'すべての試合は既に記録されています。', addedCount: 0 }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // 4. Format new rows
    const rows = newMatches.map(match => [
      match.id,
      match.date,
      match.venue,
      match.homeTeam,
      match.awayTeam,
      match.homeScore,
      match.awayScore,
      match.scorers.join(', '),
      match.matchType ?? '',
      match.tournamentName ?? '',
    ]);

    // 5. Append new rows to the sheet
    await sheets.spreadsheets.values.append({
      spreadsheetId: GOOGLE_SHEET_ID,
      range: `${sheetName}!A1`,
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values: rows,
      },
    });

    const response: WriteSheetResponse = {
      success: true,
      message: `${newMatches.length}件の新しい試合を記録しました。`,
      addedCount: newMatches.length,
    };
    
    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error writing to Google Sheet:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
    return new Response(JSON.stringify({ success: false, message: `シートへの書き込み中にエラーが発生しました: ${errorMessage}` }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
