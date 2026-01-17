import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getCommonMasters, updateCommonMaster, getGoogleSheet } from '@/lib/sheets';

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const grade = searchParams.get('grade');

    try {
        const masters = await getCommonMasters();
        if (grade) {
            return NextResponse.json(masters.filter(m => !m.grade || m.grade === grade));
        }
        return NextResponse.json(masters);
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.email) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const { name, type, grade } = await req.json();
        if (!name || !type) {
            return NextResponse.json({ error: 'Name and type are required' }, { status: 400 });
        }

        await updateCommonMaster(name, type, grade);
        return NextResponse.json({ success: true });
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}

export async function DELETE(req: NextRequest) {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.email) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const name = searchParams.get('name');
    const type = searchParams.get('type');
    const grade = searchParams.get('grade') || '';

    if (!name || !type) {
        return NextResponse.json({ error: 'Name and type are required' }, { status: 400 });
    }

    try {
        const commonId = process.env.COMMON_SPREADSHEET_ID;
        if (!commonId) throw new Error('Common spreadsheet ID not configured');

        const doc = await getGoogleSheet(commonId);
        const sheet = doc.sheetsByTitle['CommonMasters'];
        if (!sheet) throw new Error('CommonMasters sheet not found');

        const rows = await sheet.getRows();
        const existingRow = rows.find(r =>
            r.get('name') === name &&
            r.get('masterType') === type &&
            r.get('grade') === grade
        );

        if (existingRow) {
            await existingRow.delete();
            return NextResponse.json({ success: true });
        } else {
            return NextResponse.json({ error: 'Master not found' }, { status: 404 });
        }
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
