import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getCommonMasters, updateCommonMaster, getGoogleSheet, getGlobalSettings } from '@/lib/sheets';
import { getCached, setCached, invalidateCache } from '@/lib/cache';

const MASTERS_CACHE_KEY = 'masters:common';
const MASTERS_TTL = 30_000;

export const dynamic = 'force-dynamic';

async function getSpreadsheetId() {
    // Try to get from GlobalSettings first, fallback to env
    try {
        const settings = await getGlobalSettings();
        return settings?.commonSpreadsheetId || process.env.COMMON_SPREADSHEET_ID;
    } catch {
        return process.env.COMMON_SPREADSHEET_ID;
    }
}

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const grade = searchParams.get('grade');
    const type = searchParams.get('type');
    const commonId = await getSpreadsheetId();

    try {
        let masters = getCached<Awaited<ReturnType<typeof getCommonMasters>>>(MASTERS_CACHE_KEY);
        if (!masters) {
            masters = await getCommonMasters();
            setCached(MASTERS_CACHE_KEY, masters, MASTERS_TTL);
        }
        let filtered = masters;
        if (type) {
            filtered = filtered.filter(m => m.masterType === type);
        }
        if (grade) {
            filtered = filtered.filter(m => !m.grade || m.grade === grade);
        }
        return NextResponse.json(filtered);
    } catch (err: any) {
        return NextResponse.json({
            error: err.message,
            spreadsheetId: commonId
        }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.email) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const commonId = await getSpreadsheetId();

    try {
        const { name, type, grade, number } = await req.json();
        if (!name || !type) {
            return NextResponse.json({ error: 'Name and type are required' }, { status: 400 });
        }

        await updateCommonMaster(name, type, grade, number);
        invalidateCache(MASTERS_CACHE_KEY);
        return NextResponse.json({ success: true });
    } catch (err: any) {
        return NextResponse.json({
            error: err.message,
            spreadsheetId: commonId
        }, { status: 500 });
    }
}

export async function DELETE(req: NextRequest) {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.email) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const commonId = await getSpreadsheetId();

    const { searchParams } = new URL(req.url);
    const name = searchParams.get('name');
    const type = searchParams.get('type');
    const grade = searchParams.get('grade') || '';

    if (!name || !type) {
        return NextResponse.json({ error: 'Name and type are required' }, { status: 400 });
    }

    try {
        if (!commonId) throw new Error('Common spreadsheet ID not configured');

        const doc = await getGoogleSheet(commonId);
        const sheet = doc.sheetsByTitle['CommonMasters'];
        if (!sheet) throw new Error('CommonMasters sheet not found');

        const rows = await sheet.getRows();
        const existingRow = rows.find(r =>
            r.get('name') === name &&
            r.get('masterType') === type &&
            (type !== 'player' || r.get('grade') === grade)
        );

        if (existingRow) {
            await existingRow.delete();
            return NextResponse.json({ success: true });
        } else {
            return NextResponse.json({ error: 'Master not found' }, { status: 404 });
        }
    } catch (err: any) {
        return NextResponse.json({
            error: err.message,
            spreadsheetId: commonId
        }, { status: 500 });
    }
}
