import { getMatches } from '@/lib/sheets';
import MatchForm from '@/components/MatchForm';
import Link from 'next/link';
import { notFound } from 'next/navigation';

function getSpreadsheetId(gradeName: string) {
    const config = process.env.GRADES_CONFIG || '';
    const grades = config.split(',').reduce((acc, item) => {
        const [name, id] = item.split(':');
        acc[name] = id;
        return acc;
    }, {} as Record<string, string>);
    return grades[gradeName];
}

export default async function EditMatchPage({ params }: { params: Promise<{ gradeId: string, matchId: string }> }) {
    const { gradeId, matchId } = await params;
    const spreadsheetId = getSpreadsheetId(gradeId);

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
            <header className="bg-[#061426] text-white px-4 py-4 max-w-lg mx-auto">
                <Link href={`/grade/${gradeId}`} className="text-sm font-bold">← 戻る</Link>
            </header>

            <MatchForm gradeId={gradeId} initialMatch={match} />
        </main>
    );
}
