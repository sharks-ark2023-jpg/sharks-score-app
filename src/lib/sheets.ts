import { GoogleSpreadsheet } from 'google-spreadsheet';
import { JWT } from 'google-auth-library';
import { Match, GlobalSettings, CommonMaster } from '@/types';

const SCOPES = [
    'https://www.googleapis.com/auth/spreadsheets',
    'https://www.googleapis.com/auth/drive.file',
];

export async function getGoogleSheet(spreadsheetId: string) {
    let serviceAccountEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
    let privateKey = (process.env.GOOGLE_PRIVATE_KEY || '')
        .split('\\n').join('\n')
        .replace(/^["']/, '').replace(/["']$/, '');

    if (process.env.GOOGLE_SERVICE_ACCOUNT_JSON) {
        try {
            let jsonStr = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
            if (!jsonStr.trim().startsWith('{')) {
                jsonStr = Buffer.from(jsonStr, 'base64').toString();
            }
            const credentials = JSON.parse(jsonStr);
            serviceAccountEmail = credentials.client_email;
            privateKey = credentials.private_key;
        } catch (err) {
            console.error('[Sheets] Failed to parse GOOGLE_SERVICE_ACCOUNT_JSON:', err);
        }
    }

    if (!serviceAccountEmail || !privateKey) {
        throw new Error('Google Service Account credentials are not configured');
    }

    const jwt = new JWT({
        email: serviceAccountEmail,
        key: privateKey,
        scopes: SCOPES,
    });

    const doc = new GoogleSpreadsheet(spreadsheetId, jwt);
    await doc.loadInfo();
    return doc;
}

export async function getGlobalSettings(): Promise<GlobalSettings | null> {
    const commonId = process.env.COMMON_SPREADSHEET_ID;
    if (!commonId) return null;
    try {
        const doc = await getGoogleSheet(commonId);
        const sheet = doc.sheetsByTitle['GlobalSettings'];
        if (!sheet) return null;

        const rows = await sheet.getRows();
        if (rows.length === 0) return null;

        const row = rows[0].toObject();
        return {
            teamName: row.teamName,
            teamLogoUrl: row.teamLogoUrl,
            teamColor: row.teamColor,
            gradesConfig: row.gradesConfig,
            commonSpreadsheetId: row.commonSpreadsheetId,
            lastUpdated: row.lastUpdated,
            lastUpdatedBy: row.lastUpdatedBy,
        } as GlobalSettings;
    } catch (err) {
        console.error('[Sheets] Error fetching GlobalSettings:', err);
        return null;
    }
}

export async function getCommonMasters(): Promise<CommonMaster[]> {
    const commonId = process.env.COMMON_SPREADSHEET_ID;
    if (!commonId) return [];
    try {
        const doc = await getGoogleSheet(commonId);
        const sheet = doc.sheetsByTitle['CommonMasters'];
        if (!sheet) return [];

        const rows = await sheet.getRows();
        return rows.map(row => {
            const data = row.toObject();
            return {
                masterType: data.masterType,
                name: data.name,
                grade: data.grade,
                createdAt: data.createdAt,
                lastUsed: data.lastUsed,
            } as CommonMaster;
        });
    } catch (err) {
        console.error('[Sheets] Error fetching CommonMasters:', err);
        return [];
    }
}

export async function getMatches(spreadsheetId: string, sheetName: string): Promise<Match[]> {
    const doc = await getGoogleSheet(spreadsheetId);
    const sheet = doc.sheetsByTitle[sheetName];
    if (!sheet) return [];

    const rows = await sheet.getRows();
    return rows.map(row => {
        const data = row.toObject();
        return {
            matchId: data.matchId,
            matchDate: data.matchDate,
            matchType: data.matchType as 'tournament' | 'friendly' || 'friendly',
            tournamentName: data.tournamentName,
            opponentName: data.opponentName,
            venueName: data.venueName,
            matchFormat: data.matchFormat as 'halves' | 'one_game' || 'halves',
            ourScore: parseInt(data.ourScore || '0'),
            opponentScore: parseInt(data.opponentScore || '0'),
            result: data.result,
            pkInfo: data.pkInfo ? JSON.parse(data.pkInfo) : undefined,
            isLive: data.isLive === 'TRUE' || data.isLive === 'true',
            scorers: data.scorers,
            mvp: data.mvp,
            memo: data.memo,
            lastUpdated: data.lastUpdated,
            lastUpdatedBy: data.lastUpdatedBy,
            createdAt: data.createdAt,
            createdBy: data.createdBy,
        } as Match;
    });
}

export async function upsertMatch(spreadsheetId: string, sheetName: string, match: Match, userEmail: string) {
    const doc = await getGoogleSheet(spreadsheetId);
    let sheet = doc.sheetsByTitle[sheetName];

    // シートが存在しない場合は作成を試みる（簡易的な自動作成）
    if (!sheet) {
        throw new Error(`Sheet ${sheetName} not found. Please create it first.`);
    }

    const rows = await sheet.getRows();
    const existingRow = rows.find(r => r.get('matchId') === match.matchId);

    // ヘッダーの確認と追加（不足している列があれば自動で追加）
    const requiredHeaders = [
        'matchId', 'matchDate', 'matchType', 'tournamentName', 'opponentName',
        'venueName', 'matchFormat', 'ourScore', 'opponentScore', 'result',
        'pkInfo', 'isLive', 'scorers', 'mvp', 'memo',
        'lastUpdated', 'lastUpdatedBy', 'createdAt', 'createdBy'
    ];

    await sheet.loadHeaderRow();
    const currentHeaders = sheet.headerValues;
    const missingHeaders = requiredHeaders.filter(h => !currentHeaders.includes(h));

    if (missingHeaders.length > 0) {
        const newHeaders = [...currentHeaders, ...missingHeaders];
        console.log(`[Sheets] Adding missing headers to ${sheetName}:`, missingHeaders);

        // 列数が足りない場合はリサイズ
        if (sheet.columnCount < newHeaders.length) {
            await sheet.resize({
                rowCount: sheet.rowCount,
                columnCount: newHeaders.length
            });
        }

        await sheet.setHeaderRow(newHeaders);
    }

    const dataToSave = {
        ...match,
        isLive: match.isLive ? 'TRUE' : 'FALSE',
        pkInfo: match.pkInfo ? JSON.stringify(match.pkInfo) : '',
        lastUpdated: new Date().toISOString(),
        lastUpdatedBy: userEmail,
        // undefined のフィールドを空文字にして確実に保存されるようにする
        tournamentName: match.tournamentName || '',
        scorers: match.scorers || '',
        mvp: match.mvp || '',
        memo: match.memo || '',
    };

    if (existingRow) {
        // 楽観的ロック: 保存前に lastUpdated を比較
        const serverLastUpdated = existingRow.get('lastUpdated');
        if (match.lastUpdated && serverLastUpdated && serverLastUpdated !== match.lastUpdated) {
            console.warn('[Sheets] Optimistic Locking Conflict:', { client: match.lastUpdated, server: serverLastUpdated });
            throw new Error('CONFLICT');
        }

        // Update existing row
        Object.keys(dataToSave).forEach(key => {
            if (key !== 'matchId' && key !== 'createdAt' && key !== 'createdBy') {
                // @ts-ignore
                existingRow.set(key, dataToSave[key]);
            }
        });
        await existingRow.save();
    } else {
        // Add new row
        await sheet.addRow({
            ...dataToSave,
            createdAt: new Date().toISOString(),
            createdBy: userEmail,
        });
    }
}


export async function deleteMatch(spreadsheetId: string, sheetName: string, matchId: string) {
    const doc = await getGoogleSheet(spreadsheetId);
    const sheet = doc.sheetsByTitle[sheetName];
    if (!sheet) return;

    const rows = await sheet.getRows();
    const rowToDelete = rows.find(r => r.get('matchId') === matchId);
    if (rowToDelete) {
        await rowToDelete.delete();
    }
}

export async function updateCommonMaster(name: string, type: 'venue' | 'opponent' | 'player', grade?: string) {
    const commonId = process.env.COMMON_SPREADSHEET_ID;
    if (!commonId) throw new Error('COMMON_SPREADSHEET_ID is not configured');

    try {
        const doc = await getGoogleSheet(commonId);
        const sheet = doc.sheetsByTitle['CommonMasters'];
        if (!sheet) {
            throw new Error('Sheet "CommonMasters" not found in the spreadsheet. Please create it with headers: masterType, name, grade, usageCount, createdAt, lastUsed');
        }

        const rows = await sheet.getRows();
        const existingRow = rows.find(r =>
            r.get('name') === name &&
            r.get('masterType') === type &&
            (type !== 'player' || r.get('grade') === grade)
        );

        if (existingRow) {
            existingRow.set('lastUsed', new Date().toISOString());
            const currentCount = parseInt(existingRow.get('usageCount') || '0');
            existingRow.set('usageCount', (currentCount + 1).toString());
            await existingRow.save();
        } else {
            await sheet.addRow({
                masterType: type,
                name: name,
                grade: grade || '',
                usageCount: '1',
                createdAt: new Date().toISOString(),
                lastUsed: new Date().toISOString(),
            });
        }
    } catch (err: any) {
        console.error('[Sheets] Error updating CommonMaster:', err);
        throw err;
    }
}

export async function updateGlobalSettings(settings: Partial<GlobalSettings>, userEmail: string) {
    const commonId = process.env.COMMON_SPREADSHEET_ID;
    if (!commonId) return;

    try {
        const doc = await getGoogleSheet(commonId);
        const sheet = doc.sheetsByTitle['GlobalSettings'];
        if (!sheet) return;

        const rows = await sheet.getRows();
        const row = rows[0];

        if (row) {
            if (settings.teamName !== undefined) row.set('teamName', settings.teamName);
            if (settings.teamLogoUrl !== undefined) row.set('teamLogoUrl', settings.teamLogoUrl);
            if (settings.teamColor !== undefined) row.set('teamColor', settings.teamColor);
            if (settings.gradesConfig !== undefined) row.set('gradesConfig', settings.gradesConfig);
            if (settings.commonSpreadsheetId !== undefined) row.set('commonSpreadsheetId', settings.commonSpreadsheetId);
            row.set('lastUpdated', new Date().toISOString());
            row.set('lastUpdatedBy', userEmail);
            await row.save();
        } else {
            await sheet.addRow({
                teamName: settings.teamName || 'SHARKS',
                teamLogoUrl: settings.teamLogoUrl || '',
                teamColor: settings.teamColor || '#1e3a8a',
                gradesConfig: settings.gradesConfig || '',
                commonSpreadsheetId: settings.commonSpreadsheetId || '',
                lastUpdated: new Date().toISOString(),
                lastUpdatedBy: userEmail,
            });
        }
    } catch (err) {
        console.error('[Sheets] Error updating GlobalSettings:', err);
        throw err;
    }
}
