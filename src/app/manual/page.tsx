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
                {/* Section 1: 画面構成 */}
                <section>
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white font-bold shadow-lg shadow-blue-100">
                            01
                        </div>
                        <h2 className="text-xl font-bold text-gray-900">画面の構成</h2>
                    </div>

                    <div className="space-y-4 ml-4 border-l-2 border-gray-50 pl-6">
                        <p className="text-sm text-gray-600 leading-relaxed">
                            学年ダッシュボードは3つのタブで構成されています。
                        </p>
                        <div className="grid grid-cols-1 gap-3">
                            <div className="bg-gray-50 p-4 rounded-2xl">
                                <h3 className="font-bold text-gray-800 mb-1 text-sm">📝 試合入力</h3>
                                <p className="text-xs text-gray-500 leading-relaxed">新しい試合のスコアや詳細を登録します。</p>
                            </div>
                            <div className="bg-gray-50 p-4 rounded-2xl">
                                <h3 className="font-bold text-gray-800 mb-1 text-sm">📋 試合履歴</h3>
                                <p className="text-xs text-gray-500 leading-relaxed">直近の試合一覧を表示します。それ以前の記録は「過去の試合を見る」からアーカイブページで確認できます。</p>
                            </div>
                            <div className="bg-gray-50 p-4 rounded-2xl">
                                <h3 className="font-bold text-gray-800 mb-1 text-sm">👤 選手管理</h3>
                                <p className="text-xs text-gray-500 leading-relaxed">選手の登録・背番号の編集などを行います。</p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Section 2: 試合を記録する */}
                <section>
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white font-bold shadow-lg shadow-blue-100">
                            02
                        </div>
                        <h2 className="text-xl font-bold text-gray-900">試合を記録する</h2>
                    </div>

                    <div className="space-y-6 ml-4 border-l-2 border-gray-50 pl-6">
                        <div>
                            <h3 className="font-bold text-gray-800 mb-2">● 基本的な記録</h3>
                            <p className="text-sm text-gray-600 leading-relaxed">
                                試合形式（前後半 / 15分マッチなど）、スコア、得点者、PK戦、MVP、会場、メモを入力して保存します。
                                公式戦の場合は試合種別で「公式戦・大会」を選択してください。
                            </p>
                        </div>
                        <div className="bg-orange-50 p-4 rounded-2xl border border-orange-100">
                            <h4 className="text-xs font-black text-orange-700 uppercase tracking-widest mb-1">💡 連続入力のヒント</h4>
                            <p className="text-xs text-orange-600 leading-relaxed">
                                保存後に「同じ対戦相手・会場で次の試合を記録しますか？」と表示されます。
                                「はい」を選ぶと、対戦相手と会場が引き継がれた状態で新しい入力画面が開きます。
                            </p>
                        </div>
                    </div>
                </section>

                {/* Section 3: ライブ配信 */}
                <section>
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-10 h-10 bg-red-600 rounded-xl flex items-center justify-center text-white font-bold shadow-lg shadow-red-100">
                            03
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
                                視聴者には現在の進行状況（前半・HT・後半）が表示されます。
                            </p>
                        </div>
                        <div>
                            <h3 className="font-bold text-gray-800 mb-2">● 得点記録</h3>
                            <p className="text-sm text-gray-600 leading-relaxed">
                                ライブ中に「⚽ 得点を記録」ボタンを押すと、選手一覧が表示されます。
                                得点した選手を選んで「⚽ 得点を記録・保存」ボタンを押すと、スコアが+1されてスプレッドシートに即時保存されます。
                            </p>
                        </div>
                        <div className="bg-red-50 p-4 rounded-2xl border border-red-100">
                            <h4 className="text-xs font-black text-red-700 uppercase tracking-widest mb-1">⚠️ 途中保存について</h4>
                            <p className="text-xs text-red-600 leading-relaxed">
                                得点記録ボタン以外でスコアを変更した場合は、「途中保存」ボタンを押すことで最新のスコアが外部へ公開されます。
                                得点記録ボタン経由の場合は自動で保存されるため、途中保存は不要です。
                            </p>
                        </div>
                    </div>
                </section>

                {/* Section 4: アーカイブ */}
                <section>
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-10 h-10 bg-slate-500 rounded-xl flex items-center justify-center text-white font-bold shadow-lg shadow-slate-100">
                            04
                        </div>
                        <h2 className="text-xl font-bold text-gray-900">過去の試合を見る（アーカイブ）</h2>
                    </div>

                    <div className="space-y-4 ml-4 border-l-2 border-gray-50 pl-6">
                        <p className="text-sm text-gray-600 leading-relaxed">
                            試合履歴画面には直近の試合のみ表示されます。それ以前の試合は、画面下部の「過去の試合を見る」リンクからアーカイブページで確認できます。
                        </p>
                        <p className="text-sm text-gray-600 leading-relaxed">
                            アーカイブページでは試合が月別にグループ化され、各月の勝敗数も一覧で確認できます。
                        </p>
                    </div>
                </section>

                {/* Section 5: 複数人での運営 */}
                <section>
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-10 h-10 bg-gray-900 rounded-xl flex items-center justify-center text-white font-bold shadow-lg shadow-gray-200">
                            05
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
                                学年ごとに異なるスプレッドシートIDを指定することが可能です。
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
