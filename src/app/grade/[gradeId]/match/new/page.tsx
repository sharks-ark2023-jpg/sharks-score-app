import MatchForm from '@/components/MatchForm';
import Link from 'next/link';

export default async function NewMatchPage({ params }: { params: Promise<{ gradeId: string }> }) {
    const { gradeId } = await params;

    return (
        <main className="flex-grow max-w-lg w-full mx-auto bg-[#F5F7FA]">
            <header className="bg-[#061426] text-white px-4 py-4 max-w-lg mx-auto">
                <Link href={`/grade/${gradeId}`} className="text-sm font-bold">← 戻る</Link>
            </header>

            <MatchForm gradeId={gradeId} />
        </main>
    );
}
