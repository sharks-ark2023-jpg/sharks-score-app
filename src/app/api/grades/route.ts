import { NextResponse } from 'next/server';
import { getGrades } from '@/lib/spreadsheet-config';

export const dynamic = 'force-dynamic';

export async function GET() {
    return NextResponse.json(getGrades());
}
