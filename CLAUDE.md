# CLAUDE.md - sharks-score-app

## Why（このプロジェクトの目的）

向原シャークス（少年サッカーチーム）のスコア・試合記録管理アプリ。
保護者・コーチが試合中にスマホで得点を記録し、結果をBANDに書き出せる。

---

## Map（どこに何があるか）

```
sharks-score-app/
├── src/
│   ├── app/             → Next.js App Router（ページ構成）
│   │   ├── page.tsx     → トップ（学年一覧）
│   │   └── grade/[gradeId]/page.tsx → 試合記録・得点入力
│   ├── components/      → UIコンポーネント
│   └── lib/             → ユーティリティ・型定義
├── public/              → 静的ファイル
├── CHANGELOG.md         → 変更履歴（バージョン管理）
└── README.md
```

**技術スタック**：Next.js / TypeScript / Tailwind CSS
**デプロイ**：Vercel（自動デプロイ）
**認証**：Google認証（Firebase）

---

## Rules（ルール）

- コードを変更する前に必ず提案・承認を得る
- 変更後は必ず CHANGELOG.md に追記してからコミット
- コミット後は push まで行う（セットで実施）
- 破壊的変更（データ削除・認証変更）は必ず確認を取る
- `private_key.txt` は絶対に読まない・出力しない

---

## Workflows（どう動くか）

### 機能追加・修正
1. 要件確認 → 変更箇所の提案
2. 承認後に実装
3. CHANGELOG.md に追記（バージョンアップ）
4. git commit → git push

### デバッグ
1. エラーログ・症状を確認
2. 原因を特定して報告
3. 承認後に修正 → CHANGELOG → commit → push
