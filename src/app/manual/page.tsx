'use client';

import Link from 'next/link';

export default function ManualPage() {
    return (
        <main className="container mx-auto px-4 py-8 max-w-2xl">
            <div className="mb-12 text-center">
                <span className="text-[10px] font-black text-blue-600 bg-blue-50 px-3 py-1 rounded-full uppercase tracking-[0.2em] mb-4 inline-block">
                    Usage Guide
                </span>
                <h1 className="text-4xl font-black text-gray-900 tracking-tight mb-4">
                    SHARKS SCORE<br />
                    APP MANUAL
                </h1>
                <p className="text-gray-500 text-sm leading-relaxed max-w-md mx-auto">
                    SHARKS SCORE APPをご利用いただきありがとうございます。
                    このアプリは、少年サッカー等の試合記録・スコア配信を簡単に行うためのツールです。
                </p>
            </div>

            <div className="space-y-12">
                {/* Section 1: Recording Matches */}
                <section>
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white font-bold shadow-lg shadow-blue-100">
                            01
                        </div>
                        <h2 className="text-xl font-bold text-gray-900">試合を記録する</h2>
                    </div>

                    <div className="space-y-6 ml-4 border-l-2 border-gray-50 pl-6">
                        <div>
                            <h3 className="font-bold text-gray-800 mb-2">● 簡易入力モード</h3>
                            <p className="text-sm text-gray-600 leading-relaxed">
                                スコア（合計点）のみを素早く入力したい場合に適しています。
                                詳細な前後半の内訳などは省略されます。
                            </p>
                        </div>
                        <div>
                            <h3 className="font-bold text-gray-800 mb-2">● 通常入力モード</h3>
                            <p className="text-sm text-gray-600 leading-relaxed">
                                前後半の内訳、得点者、PK戦、MVP、メモなど全ての情報を記録できます。
                                公式戦や、後で振り返りたい試合に適しています。
                            </p>
                        </div>
                        <div className="bg-orange-50 p-4 rounded-2xl border border-orange-100">
                            <h4 className="text-xs font-black text-orange-700 uppercase tracking-widest mb-1">💡 連続入力のヒント</h4>
                            <p className="text-xs text-orange-600 leading-relaxed">
                                保存後に「同じ対戦相手・会場で次の試合を記録しますか？」と表示されます。
                                「はい」を選ぶと、対戦相手と会場が維持された状態で新しい入力画面が開きます。
                            </p>
                        </div>
                    </div>
                </section>

                {/* Section 2: Live Recording */}
                <section>
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-10 h-10 bg-red-600 rounded-xl flex items-center justify-center text-white font-bold shadow-lg shadow-red-100">
                            02
                        </div>
                        <h2 className="text-xl font-bold text-gray-900">ライブ配信（LIVE）</h2>
                    </div>

                    <div className="space-y-6 ml-4 border-l-2 border-gray-50 pl-6">
                        <p className="text-sm text-gray-600 leading-relaxed">
                            「Live Recording」スイッチをオンにすると、リアルタイムでスコアが公開されます。
                        </p>
                        <div>
                            <h3 className="font-bold text-gray-800 mb-2">● フェーズ管理（Control）</h3>
                            <p className="text-sm text-gray-600 leading-relaxed">
                                「試合開始」→「ハーフタイム」→「試合終了」と進めることで、
                                視聴者には現在の進行状況（前半、HT、後半など）が表示されます。
                            </p>
                        </div>
                        <div className="bg-red-50 p-4 rounded-2xl border border-red-100">
                            <h4 className="text-xs font-black text-red-700 uppercase tracking-widest mb-1">⚠️ 途中保存について</h4>
                            <p className="text-xs text-red-600 leading-relaxed">
                                試合中に「途中保存」ボタンを押すと、画面を閉じずに最新のスコアをスプレッドシートへ反映し、外部へ公開できます。
                                得点が入るたびに「途中保存」することで、リアルタイムな速報が可能になります。
                            </p>
                        </div>
                    </div>
                </section>

                {/* Section 3: Collaborative Editing */}
                <section>
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-10 h-10 bg-gray-900 rounded-xl flex items-center justify-center text-white font-bold shadow-lg shadow-gray-200">
                            03
                        </div>
                        <h2 className="text-xl font-bold text-gray-900">複数人での運営</h2>
                    </div>

                    <div className="space-y-6 ml-4 border-l-2 border-gray-50 pl-6">
                        <div>
                            <h3 className="font-bold text-gray-800 mb-2">● 編集ロック機能</h3>
                            <p className="text-sm text-gray-600 leading-relaxed">
                                他のユーザーが編集中の試合はロックされ、同時に編集することができません。
                                これにより、データの競合や上書きミスを防いでいます。
                            </p>
                        </div>
                        <div>
                            <h3 className="font-bold text-gray-800 mb-2">● スプレッドシート連携</h3>
                            <p className="text-sm text-gray-600 leading-relaxed">
                                全てのデータはGoogleスプレッドシートに保存されています。
                                学年ごとに異なるスプレッドシート IDを指定することが可能です。
                            </p>
                        </div>
                    </div>
                </section>
            </div>

            <div className="mt-16 pt-8 border-t border-gray-100 text-center">
                <Link
                    href="/"
                    className="inline-flex items-center gap-2 px-6 py-3 bg-gray-900 text-white font-black rounded-2xl hover:bg-black transition-all uppercase text-[10px] tracking-widest shadow-xl shadow-gray-200"
                >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                    </svg>
                    ホームへ戻る
                </Link>
            </div>
        </main>
    );
}
