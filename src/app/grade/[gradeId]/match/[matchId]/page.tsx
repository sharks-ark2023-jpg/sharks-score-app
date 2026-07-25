import { getMatches } from '@/lib/sheets';
import { getGradeSpreadsheetId } from '@/lib/spreadsheet-config';
import MatchForm from '@/components/MatchForm';
import Link from 'next/link';
import { notFound } from 'next/navigation';

export default async function EditMatchPage({ params }: { params: Promise<{ gradeId: string, matchId: string }> }) {
    const { gradeId, matchId } = await params;
    const spreadsheetId = getGradeSpreadsheetId(gradeId);

    if (!spreadsheetId) {
        notFound();
    }

    const matches = await getMatches(spreadsheetId, `${gradeId}_Matches`);
    const match = matches.find(m => m.matchId === matchId);

    if (!match) {
        notFound();
    }

    return (
        <main className="flex-grow max-w-lg w-full mx-auto bg-[#F5F7FA]">
            <header className="bg-sharks-ink text-white px-4 py-4 max-w-lg mx-auto">
                <Link href={`/grade/${gradeId}`} className="text-sm font-bold">← 戻る</Link>
            </header>

            <MatchForm gradeId={gradeId} initialMatch={match} />
        </main>
    );
}
