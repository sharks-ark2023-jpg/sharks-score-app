# 前後半別得点者 Implementation Plan

**Goal:** 前半・後半別の得点者を保存・表示し、過去の合計記録も保持する。

**Architecture:** 任意の scorers1H / scorers2H を追加する。scorers は従来の合計として保ち、合計と前後半の差分は内訳未記録として表示する。保存は通常保存・ライブ直接更新の両経路を対応させる。

**Tech Stack:** Next.js / TypeScript / React / Google Sheets

- [x] 得点計算の再現テストを作成し、現行で失敗することを確認。
- [x] src/lib/goal-records.ts に得点者解析・内訳・追加削除を集約し、src/types/index.ts に任意フィールドを追加。
- [x] src/components/MatchForm.tsx のライブ、終了後訂正、Live OFF入力、次試合初期化を対応。誤ったハーフから別ハーフの既知得点を削除しない。
- [x] src/components/ScorerBreakdown.tsx を作成し、入力・詳細画面で前半／後半／内訳未記録を表示。
- [x] src/lib/sheets.ts の読み込み、列追加、通常保存、ライブ直接更新を対応。旧ヘッダーのトークンは通常保存へフォールバック。
- [x] 操作説明と CHANGELOG を更新。
- [x] 得点ロジック、実コンポーネントのHTML、Sheetsモックの保存・再読込テストを実行。eslint / tsc / build / diff check を実行。
- [x] 対象ファイルを明示して commit / 作業ブランチへ push。main は更新しない。

検証対象: 前後半で同一選手が得点、ハーフ指定の追加削除、Undo、旧記録への追加・削除、1本制、通常保存と直接更新の再読込。実シート・実機・本番デプロイ確認はローカル検証とは区別する。

検証結果: node --test tests/half-scorers.test.mjs 12/12、npx eslint 警告0・エラー0、npx tsc --noEmit -p . 成功、npm run build 成功。Sheets はモックであり、実シート・スマホ実機・本番は未検証。
