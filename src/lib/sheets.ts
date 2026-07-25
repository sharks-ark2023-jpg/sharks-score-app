import { GoogleSpreadsheet } from 'google-spreadsheet';
import { JWT } from 'google-auth-library';
import { Match, GlobalSettings, CommonMaster } from '@/types';
import { getCommonSpreadsheetId } from '@/lib/spreadsheet-config';

const SHEET_DOCUMENT_TTL = 5 * 60_000;
const documentCache = new Map<string, { doc: GoogleSpreadsheet; expiresAt: number }>();
const documentLoads = new Map<string, Promise<GoogleSpreadsheet>>();
const verifiedHeaders = new Set<string>();

const SCOPES = [
    'https://www.googleapis.com/auth/spreadsheets',
    'https://www.googleapis.com/auth/drive.file',
];

function createSheetsAuth(): JWT {
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

    return new JWT({
        email: serviceAccountEmail,
        key: privateKey,
        scopes: SCOPES,
    });
}

export async function getGoogleSheet(spreadsheetId: string) {
    const cached = documentCache.get(spreadsheetId);
    if (cached && cached.expiresAt > Date.now()) {
        return cached.doc;
    }

    const pending = documentLoads.get(spreadsheetId);
    if (pending) return pending;

    const loadDocument = async () => {
        const jwt = createSheetsAuth();
        const doc = new GoogleSpreadsheet(spreadsheetId, jwt);
        await doc.loadInfo();
        documentCache.set(spreadsheetId, {
            doc,
            expiresAt: Date.now() + SHEET_DOCUMENT_TTL,
        });
        return doc;
    };

    const promise = loadDocument();
    documentLoads.set(spreadsheetId, promise);
    try {
        return await promise;
    } finally {
        documentLoads.delete(spreadsheetId);
    }
}

export async function getSettingsBundle(): Promise<{
    settings: GlobalSettings | null;
    masters: CommonMaster[];
}> {
    const commonId = getCommonSpreadsheetId();
    if (!commonId) return { settings: null, masters: [] };

    const doc = await getGoogleSheet(commonId);
    const settingsSheet = doc.sheetsByTitle['GlobalSettings'];
    const mastersSheet = doc.sheetsByTitle['CommonMasters'];
    const [settingsRows, masterRows] = await Promise.all([
        settingsSheet ? settingsSheet.getRows() : Promise.resolve([]),
        mastersSheet ? mastersSheet.getRows() : Promise.resolve([]),
    ]);

    const settingsData = settingsRows[0]?.toObject();
    const settings = settingsData ? {
        teamName: settingsData.teamName,
        teamLogoUrl: settingsData.teamLogoUrl,
        teamColor: settingsData.teamColor,
        gradesConfig: settingsData.gradesConfig,
        commonSpreadsheetId: settingsData.commonSpreadsheetId,
        lastUpdated: settingsData.lastUpdated,
        lastUpdatedBy: settingsData.lastUpdatedBy,
    } as GlobalSettings : null;

    const masters = masterRows.map(row => {
        const data = row.toObject();
        return {
            masterType: data.masterType,
            name: data.name,
            number: data.number,
            grade: data.grade,
            createdAt: data.createdAt,
            lastUsed: data.lastUsed,
            usageCount: parseInt(data.usageCount || '0'),
        } as CommonMaster;
    });

    return { settings, masters };
}

export async function getGlobalSettings(): Promise<GlobalSettings | null> {
    const commonId = getCommonSpreadsheetId();
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
    const commonId = getCommonSpreadsheetId();
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
                number: data.number,
                grade: data.grade,
                createdAt: data.createdAt,
                lastUsed: data.lastUsed,
                usageCount: parseInt(data.usageCount || '0'),
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
            matchDuration: data.matchDuration ? parseInt(data.matchDuration) : undefined,
            ourScore: parseInt(data.ourScore || '0'),
            ourScore1H: data.ourScore1H ? parseInt(data.ourScore1H) : undefined,
            ourScore2H: data.ourScore2H ? parseInt(data.ourScore2H) : undefined,
            opponentScore: parseInt(data.opponentScore || '0'),
            opponentScore1H: data.opponentScore1H ? parseInt(data.opponentScore1H) : undefined,
            opponentScore2H: data.opponentScore2H ? parseInt(data.opponentScore2H) : undefined,
            result: data.result,
            pkInfo: data.pkInfo ? JSON.parse(data.pkInfo) : undefined,
            isLive: data.isLive === 'TRUE' || data.isLive === 'true',
            matchPhase: data.matchPhase as Match['matchPhase'],
            scorers: data.scorers,
            mvp: data.mvp,
            memo: data.memo,
            lastUpdated: data.lastUpdated,
            lastUpdatedBy: data.lastUpdatedBy,
            createdBy: data.createdBy,
            editingBy: data.editingBy,
            editingExpires: data.editingExpires,
            analysis: data.analysis || undefined,
        } as Match;
    });
}

export type MatchSaveCursor = {
    spreadsheetId: string;
    sheetName: string;
    matchId: string;
    rowNumber: number;
    headers: string[];
    lastUpdated: string;
    issuedAt: number;
};

export async function upsertMatch(spreadsheetId: string, sheetName: string, match: Match, userEmail: string) {
    const doc = await getGoogleSheet(spreadsheetId);
    const sheet = doc.sheetsByTitle[sheetName];

    // シートが存在しない場合は作成を試みる（簡易的な自動作成）
    if (!sheet) {
        throw new Error(`Sheet ${sheetName} not found. Please create it first.`);
    }

    const rows = await sheet.getRows();
    const existingRow = rows.find(r => r.get('matchId') === match.matchId);

    // ヘッダーの確認と追加（不足している列があれば自動で追加）
    const requiredHeaders = [
        'matchId', 'matchDate', 'matchType', 'tournamentName', 'opponentName',
        'venueName', 'matchFormat', 'matchDuration',
        'ourScore', 'ourScore1H', 'ourScore2H',
        'opponentScore', 'opponentScore1H', 'opponentScore2H',
        'result', 'pkInfo', 'isLive', 'matchPhase', 'scorers', 'mvp', 'memo',
        'lastUpdated', 'lastUpdatedBy', 'createdAt', 'createdBy',
        'editingBy', 'editingExpires', 'analysis'
    ];

    const headerCacheKey = `${spreadsheetId}:${sheetName}`;
    if (!verifiedHeaders.has(headerCacheKey)) {
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

        verifiedHeaders.add(headerCacheKey);
    }

    const dataToSave = {
        ...match,
        isLive: match.isLive ? 'TRUE' : 'FALSE',
        matchPhase: match.matchPhase || '',
        pkInfo: match.pkInfo ? JSON.stringify(match.pkInfo) : '',
        lastUpdated: new Date().toISOString(),
        lastUpdatedBy: userEmail,
        // undefined のフィールドを空文字にして確実に保存されるようにする
        tournamentName: match.tournamentName || '',
        matchDuration: match.matchDuration || '',
        ourScore1H: match.ourScore1H ?? '',
        ourScore2H: match.ourScore2H ?? '',
        opponentScore1H: match.opponentScore1H ?? '',
        opponentScore2H: match.opponentScore2H ?? '',
        scorers: match.scorers || '',
        mvp: match.mvp || '',
        memo: match.memo || '',
        analysis: match.analysis || '',
    };

    let savedRow = existingRow;
    if (savedRow) {
        // 楽観的ロック: 保存前に lastUpdated を比較
        const serverLastUpdated = savedRow.get('lastUpdated');
        if (match.lastUpdated && serverLastUpdated && serverLastUpdated !== match.lastUpdated) {
            console.warn('[Sheets] Optimistic Locking Conflict:', { client: match.lastUpdated, server: serverLastUpdated });
            throw new Error('CONFLICT');
        }

        // Update existing row
        Object.keys(dataToSave).forEach(key => {
            if (key !== 'matchId' && key !== 'createdAt' && key !== 'createdBy') {
                savedRow?.set(key, dataToSave[key as keyof typeof dataToSave]);
            }
        });
        await savedRow.save();
    } else {
        // Add new row
        savedRow = await sheet.addRow({
            ...dataToSave,
            createdAt: new Date().toISOString(),
            createdBy: userEmail,
        });
    }

    return {
        lastUpdated: dataToSave.lastUpdated,
        cursor: {
            spreadsheetId,
            sheetName,
            matchId: match.matchId,
            rowNumber: savedRow.rowNumber,
            headers: [...sheet.headerValues],
            lastUpdated: dataToSave.lastUpdated,
            issuedAt: Date.now(),
        } satisfies MatchSaveCursor,
    };
}

const LIVE_UPDATE_FIELDS = [
    'ourScore',
    'ourScore1H',
    'ourScore2H',
    'opponentScore',
    'opponentScore1H',
    'opponentScore2H',
    'result',
    'isLive',
    'matchPhase',
    'scorers',
    'lastUpdated',
    'lastUpdatedBy',
] as const;

function columnNumberToLetter(columnNumber: number): string {
    let value = columnNumber;
    let result = '';
    while (value > 0) {
        const remainder = (value - 1) % 26;
        result = String.fromCharCode(65 + remainder) + result;
        value = Math.floor((value - 1) / 26);
    }
    return result;
}

export async function updateLiveMatchByCursor(
    cursor: MatchSaveCursor,
    match: Match,
    userEmail: string
): Promise<{ lastUpdated: string; cursor: MatchSaveCursor }> {
    const isExpired = Date.now() - cursor.issuedAt > 12 * 60 * 60_000;
    if (isExpired || cursor.matchId !== match.matchId || cursor.lastUpdated !== match.lastUpdated) {
        throw new Error('CONFLICT');
    }

    const lastUpdated = new Date().toISOString();
    const values: Record<(typeof LIVE_UPDATE_FIELDS)[number], string | number> = {
        ourScore: match.ourScore ?? 0,
        ourScore1H: match.ourScore1H ?? '',
        ourScore2H: match.ourScore2H ?? '',
        opponentScore: match.opponentScore ?? 0,
        opponentScore1H: match.opponentScore1H ?? '',
        opponentScore2H: match.opponentScore2H ?? '',
        result: match.result || 'draw',
        isLive: match.isLive ? 'TRUE' : 'FALSE',
        matchPhase: match.matchPhase || '',
        scorers: match.scorers || '',
        lastUpdated,
        lastUpdatedBy: userEmail,
    };
    const escapedSheetName = cursor.sheetName.replace(/'/g, "''");
    const data = LIVE_UPDATE_FIELDS.map(field => {
        const headerIndex = cursor.headers.indexOf(field);
        if (headerIndex === -1) {
            throw new Error(`Missing required header: ${field}`);
        }
        const column = columnNumberToLetter(headerIndex + 1);
        return {
            range: `'${escapedSheetName}'!${column}${cursor.rowNumber}`,
            values: [[values[field]]],
        };
    });

    const auth = createSheetsAuth();
    await auth.request({
        url: `https://sheets.googleapis.com/v4/spreadsheets/${cursor.spreadsheetId}/values:batchUpdate`,
        method: 'POST',
        data: {
            valueInputOption: 'RAW',
            data,
        },
    });

    return {
        lastUpdated,
        cursor: { ...cursor, lastUpdated },
    };
}

export async function updateMatchLock(spreadsheetId: string, sheetName: string, matchId: string, email: string | null, expiresAt: string | null) {
    const doc = await getGoogleSheet(spreadsheetId);
    const sheet = doc.sheetsByTitle[sheetName];
    if (!sheet) return;

    const rows = await sheet.getRows();
    const row = rows.find(r => r.get('matchId') === matchId);
    if (row) {
        row.set('editingBy', email || '');
        row.set('editingExpires', expiresAt || '');
        await row.save();
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

export async function updateCommonMaster(name: string, type: 'venue' | 'opponent' | 'player', grade?: string, number?: string) {
    const commonId = getCommonSpreadsheetId();
    if (!commonId) throw new Error('Spreadsheet ID is not configured');

    try {
        const doc = await getGoogleSheet(commonId);
        const sheet = doc.sheetsByTitle['CommonMasters'];
        if (!sheet) {
            throw new Error('Sheet "CommonMasters" not found in the spreadsheet. Please create it with headers: masterType, name, number, grade, usageCount, createdAt, lastUsed');
        }

        // ヘッダーの確認と追加
        const requiredHeaders = ['masterType', 'name', 'number', 'grade', 'usageCount', 'createdAt', 'lastUsed'];
        await sheet.loadHeaderRow();
        const currentHeaders = sheet.headerValues;
        const missingHeaders = requiredHeaders.filter(h => !currentHeaders.includes(h));

        if (missingHeaders.length > 0) {
            const newHeaders = [...currentHeaders, ...missingHeaders];
            if (sheet.columnCount < newHeaders.length) {
                await sheet.resize({ rowCount: sheet.rowCount, columnCount: newHeaders.length });
            }
            await sheet.setHeaderRow(newHeaders);
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
            if (number !== undefined) existingRow.set('number', number);
            await existingRow.save();
        } else {
            await sheet.addRow({
                masterType: type,
                name: name,
                number: number || '',
                grade: grade || '',
                usageCount: '1',
                createdAt: new Date().toISOString(),
                lastUsed: new Date().toISOString(),
            });
        }
    } catch (error: unknown) {
        console.error('[Sheets] Error updating CommonMaster:', error);
        throw error;
    }
}

export async function updateGlobalSettings(settings: Partial<GlobalSettings>, userEmail: string) {
    const commonId = getCommonSpreadsheetId();
    if (!commonId) return;

    try {
        const doc = await getGoogleSheet(commonId);
        let sheet = doc.sheetsByTitle['GlobalSettings'];

        // シートが存在しない場合は作成
        if (!sheet) {
            sheet = await doc.addSheet({ title: 'GlobalSettings', headerValues: ['teamName', 'teamLogoUrl', 'teamColor', 'gradesConfig', 'commonSpreadsheetId', 'lastUpdated', 'lastUpdatedBy'] });
        }

        // ヘッダーの同期
        const requiredHeaders = ['teamName', 'teamLogoUrl', 'teamColor', 'gradesConfig', 'commonSpreadsheetId', 'lastUpdated', 'lastUpdatedBy'];
        await sheet.loadHeaderRow();
        const currentHeaders = sheet.headerValues;
        const missingHeaders = requiredHeaders.filter(h => !currentHeaders.includes(h));

        if (missingHeaders.length > 0) {
            const newHeaders = [...currentHeaders, ...missingHeaders];
            if (sheet.columnCount < newHeaders.length) {
                await sheet.resize({ rowCount: sheet.rowCount, columnCount: newHeaders.length });
            }
            await sheet.setHeaderRow(newHeaders);
        }

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
