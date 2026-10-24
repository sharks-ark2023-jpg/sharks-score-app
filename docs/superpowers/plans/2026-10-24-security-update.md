# Security dependency update Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 公開済み脆弱性を修正する依存更新を行い、既存操作を検証してcommit・pushする。

**Architecture:** Next.js 16系を維持し、修正版16.4.1以上と対応するeslint設定・Reactを導入する。認証・関係者判定・保存ロジック・本番データは変更しない。監査の残件は依存経路と利用条件から評価し、破壊的な自動修正は行わない。

**Tech Stack:** Next.js / React / TypeScript / npm / node:test

## Task 1: 依存更新

**Files:** package.json（直接依存）、package-lock.json（依存固定）

- [x] npmレジストリで修正版・peerDependenciesを確認する。
- [x] Next.js・eslint-config-nextを16.4.3、React/React DOMを19.3.1に揃えた。
- [x] npm audit fixで間接依存を互換範囲で更新し、監査0件を確認した。

## Task 2: 検証

**Files:** 既存tests/*.test.mjs（変更しない）

- [x] npm audit --jsonで開発用を含め0件。更新前の本番用監査はCritical 1・High 5パッケージ。
- [x] node --test tests/*.test.mjs は36件成功（Sheets書込はモック）。
- [x] npm run build成功。npm run lintは2件の指摘で失敗。更新前のpackage.jsonとlockfileを一時フォルダに復元し、npm ci --ignore-scriptsでインストールしたESLint設定では同一ソースに対するlintが成功。react-hooks 7.0.1→7.1.1で既存コードへの診断が増えた。アプリコード・ルールを今回の範囲外で変更しない。
- [x] ローカルHTTP確認11件成功（signin/manual/privacy、ログイン誘導2件、未認証書込拒否6件）。本番Sheetsへの書込なし。実ブラウザでのGoogleログイン・認証後の保存操作は未確認。

## Task 3: 記録と配信

**Files:** CHANGELOG.md（v1.8.4）、この計画（実施結果）

- [x] 更新内容と検証結果をCHANGELOG v1.8.4に記録した。
- [ ] git diff --check と差分・対象ファイルを確認する。既存の未追跡ファイルはコミットしない。
- [ ] commit・pushし、リモートHEADを確認する。本番デプロイ結果を未確認のまま成功と報告しない。
