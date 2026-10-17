import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { test } from 'node:test';
import ts from 'typescript';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

const require = createRequire(import.meta.url);
const root = process.cwd();
function loader(stubs = {}, fakeProcess = process) {
    const cache = new Map();
    function load(filename) {
        filename = path.resolve(root, filename);
        if (cache.has(filename)) return cache.get(filename).exports;
        const compiledModule = { exports: {} };
        cache.set(filename, compiledModule);
        const source = ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
            compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true },
        }).outputText;
        const localRequire = id => {
            if (Object.hasOwn(stubs, id)) return stubs[id];
            if (id.startsWith('@/') || id.startsWith('.')) {
                const target = id.startsWith('@/') ? path.join(root, 'src', id.slice(2)) : path.resolve(path.dirname(filename), id);
                return load([target, `${target}.ts`, `${target}.tsx`].find(file => fs.existsSync(file)));
            }
            return require(id);
        };
        new Function('require', 'module', 'exports', 'process', source)(localRequire, compiledModule, compiledModule.exports, fakeProcess);
        return compiledModule.exports;
    }
    return load;
}
const load = loader();
const { computeGoalData: goal, computeRemoveGoalData: remove, computeScoreData: score, getUnassignedScorers: unassigned, setHalfScorers, canRemoveScorer } = load('src/lib/goal-records.ts');
const base = { matchId: 'test', matchFormat: 'halves', matchPhase: '1H', ourScore: 0, ourScore1H: 0, ourScore2H: 0, opponentScore: 0, scorers: '' };
const twoHalves = goal('B', goal('A', goal('A', base), '2H'), '2H');

test('前半・後半と同一選手の合計を保持し、入力を変更しない', () => {
    assert.equal(twoHalves.scorers, 'A(2), B');
    assert.equal(twoHalves.scorers1H, 'A');
    assert.equal(twoHalves.scorers2H, 'A, B');
    assert.equal(twoHalves.ourScore1H, 1);
    assert.equal(twoHalves.ourScore2H, 2);
    assert.equal(base.scorers, '');
    assert.deepEqual(unassigned(twoHalves), []);
});

test('終了後のハーフ指定追加・削除と別ハーフ誤削除防止', () => {
    const current = { ...twoHalves, matchPhase: 'full-time' };
    assert.equal(canRemoveScorer('B', '1H', current), false);
    assert.equal(remove('B', '1H', current), current);
    const updated = remove('B', '2H', current);
    assert.equal(updated.scorers, 'A(2)');
    assert.equal(updated.scorers2H, 'A');
    assert.equal(updated.ourScore2H, 1);
    assert.equal(updated.ourScore, 2);
    assert.equal(goal('C', current, '1H').scorers1H, 'A, C');
    assert.equal(remove('存在しない', '1H', current), current);
});

test('旧記録は推測せず、追加した分だけハーフに記録する', () => {
    const legacy = { ...base, ourScore: 3, ourScore1H: 2, ourScore2H: 1, scorers: 'A(2), B' };
    const updated = goal('A', legacy, '2H');
    assert.equal(updated.scorers1H, undefined);
    assert.equal(updated.scorers2H, 'A');
    assert.deepEqual(unassigned(updated), [{ name: 'A', goals: 2 }, { name: 'B', goals: 1 }]);
    const removed = remove('B', '1H', updated);
    assert.equal(removed.scorers, 'A(3)');
    assert.equal(removed.scorers2H, 'A');
    assert.equal(removed.ourScore1H, 1);
});

test('Live OFFの前後半入力を合計へ反映し、旧記録も保持', () => {
    let m = setHalfScorers(base, '1H', 'A(2)');
    m = setHalfScorers(m, '2H', 'A, B');
    assert.equal(m.scorers, 'A(3), B');
    m = setHalfScorers(m, '1H', '');
    assert.equal(m.scorers, 'A, B');
    const legacy = { ...base, scorers: 'C' };
    assert.equal(setHalfScorers(legacy, '1H', 'A').scorers, 'C, A');
});

test('Undo用スナップショットは内訳ごと復元でき、再読込も保持', () => {
    const snapshot = twoHalves;
    const added = goal('C', snapshot, '2H');
    assert.equal(added.scorers2H, 'A, B, C');
    assert.equal(snapshot.scorers2H, 'A, B');
    assert.deepEqual(JSON.parse(JSON.stringify(snapshot)), twoHalves);
});

test('1本制の得点追加削除と相手スコア訂正は従来通り', () => {
    const m = goal('A', { ...base, matchFormat: 'one_game' });
    assert.equal(m.scorers1H, undefined);
    assert.equal(remove('A', '1H', m).ourScore, 0);
    assert.equal(score('opponent', 1, twoHalves, '2H').opponentScore2H, 1);
    assert.equal(remove('A', '1H', { ...twoHalves, ourScore1H: 0 }).ourScore, 3);
});

test('実表示コンポーネントが前半・後半・内訳未記録を区別する', () => {
    const Breakdown = load('src/components/ScorerBreakdown.tsx').default;
    const html = renderToStaticMarkup(React.createElement(Breakdown, { match: twoHalves }));
    assert.match(html, /前半の得点者.*A 1点.*後半の得点者.*A 1点、B 1点/);
    assert.doesNotMatch(html, /内訳未記録/);
    const legacyHtml = renderToStaticMarkup(React.createElement(Breakdown, { match: { ...base, scorers: 'A(2)' } }));
    assert.match(legacyHtml, /前後半の内訳未記録.*A 2点/);
    const oneGame = renderToStaticMarkup(React.createElement(Breakdown, { match: { ...base, matchFormat: 'one_game', scorers: 'A' } }));
    assert.doesNotMatch(oneGame, /前半|後半/);
});

test('Sheets通常保存→再読込、直接更新→再読込で内訳が残る（モック）', async () => {
    let rowData = {};
    const row = { rowNumber: 2, get: key => rowData[key], set: (key, value) => { rowData[key] = value; }, save: async () => {}, toObject: () => rowData };
    const sheet = { headerValues: ['matchId'], columnCount: 1, rowCount: 100,
        getRows: async () => rowData.matchId ? [row] : [], loadHeaderRow: async () => {},
        resize: async () => {}, setHeaderRow: async headers => { sheet.headerValues = headers; },
        addRow: async data => { rowData = data; return row; } };
    class Doc { sheetsByTitle = { U12_Matches: sheet }; async loadInfo() {} }
    class JWT {
        async request({ data }) {
            for (const cell of data.data) {
                const letters = cell.range.match(/!([A-Z]+)2$/)[1];
                const column = [...letters].reduce((n, letter) => n * 26 + letter.charCodeAt(0) - 64, 0) - 1;
                rowData[sheet.headerValues[column]] = cell.values[0][0];
            }
        }
    }
    const sheets = loader({ 'google-spreadsheet': { GoogleSpreadsheet: Doc }, 'google-auth-library': { JWT }, '@/lib/spreadsheet-config': {} }, { env: { GOOGLE_SERVICE_ACCOUNT_EMAIL: 'test@example.invalid', GOOGLE_PRIVATE_KEY: 'test-placeholder' } })('src/lib/sheets.ts');
    const result = await sheets.upsertMatch('test-sheet', 'U12_Matches', twoHalves, 'test@example.invalid');
    let [saved] = await sheets.getMatches('test-sheet', 'U12_Matches');
    assert.equal(saved.scorers1H, 'A');
    assert.equal(saved.scorers2H, 'A, B');
    assert.equal(saved.scorers, 'A(2), B');
    const updated = goal('C', { ...saved, matchPhase: '2H' });
    await sheets.updateLiveMatchByCursor(result.cursor, updated, 'test@example.invalid');
    [saved] = await sheets.getMatches('test-sheet', 'U12_Matches');
    assert.equal(saved.scorers2H, 'A, B, C');
    assert.equal(saved.scorers, 'A(2), B, C');
    const removed = remove('C', '2H', saved);
    await sheets.upsertMatch('test-sheet', 'U12_Matches', removed, 'test@example.invalid');
    [saved] = await sheets.getMatches('test-sheet', 'U12_Matches');
    assert.equal(saved.scorers2H, 'A, B');
});

test('スコアの−だけでは既知の得点者を取り残さず、未記録得点だけ減らせる', () => {
    assert.equal(score('our', -1, twoHalves, '1H'), twoHalves);
    const m = score('our', 1, twoHalves, '1H');
    assert.equal(score('our', -1, m, '1H').ourScore1H, 1);
    const mixed = { ...twoHalves, scorers: 'A(2), B, C' };
    assert.equal(canRemoveScorer('C', '1H', mixed), false);
});

test('APIが旧ヘッダーのトークンを通常保存へ切替え、新ヘッダーでは直接更新する', async () => {
    let used;
    let cursor = { spreadsheetId: 'test-sheet', sheetName: 'U12_Matches', matchId: 'test', headers: ['scorers'] };
    const fakeSave = kind => async () => { used = kind; return { lastUpdated: 'test-time', cursor }; };
    const route = loader({
        'next-auth': { getServerSession: async () => ({ user: { email: 'test@example.invalid' } }) },
        '@/lib/auth': { authOptions: {} },
        '@/lib/sheets': { upsertMatch: fakeSave('normal'), updateLiveMatchByCursor: fakeSave('direct') },
        '@/lib/spreadsheet-config': { getGradeSpreadsheetId: () => 'test-sheet' },
        '@/lib/match-save-token': { verifyMatchSaveToken: () => cursor, createMatchSaveToken: () => 'test-token' },
        '@/lib/cache': { invalidateCache: () => {} },
    })('src/app/api/matches/route.ts');
    const req = { json: async () => ({ grade: 'U12', match: twoHalves, syncMasters: false, saveToken: 'old-token' }) };
    assert.equal((await route.POST(req)).status, 200);
    assert.equal(used, 'normal');
    cursor = { ...cursor, headers: ['scorers', 'scorers1H', 'scorers2H'] };
    assert.equal((await route.POST(req)).status, 200);
    assert.equal(used, 'direct');
});

test('試合詳細とライブ記録画面の実コンポーネントに内訳が表示される', () => {
    const renderLoad = loader({
        '@/components/MatchAnalysis': { __esModule: true, default: () => null },
        'next/link': { __esModule: true, default: ({ children }) => React.createElement('a', null, children) },
        'next/navigation': { useRouter: () => ({}) },
        swr: { __esModule: true, default: () => ({ data: { settings: {}, masters: [] } }) },
    });
    const Detail = renderLoad('src/components/MatchDetailClient.tsx').default;
    const Form = renderLoad('src/components/MatchForm.tsx').default;
    const match = { ...twoHalves, matchDate: '2026-10-17', matchPhase: '2H', result: 'win', isLive: true };
    for (const [Component, props] of [[Detail, { match, gradeId: 'U12', isLoggedIn: false }], [Form, { initialMatch: match, gradeId: 'U12' }]]) {
        const html = renderToStaticMarkup(React.createElement(Component, props));
        assert.match(html, /前半の得点者.*A 1点.*後半の得点者.*A 1点、B 1点/);
    }
    const offline = renderToStaticMarkup(React.createElement(Form, { gradeId: 'U12', initialMatch: { ...match, matchPhase: 'pre-game', isLive: false } }));
    assert.match(offline, /前半の得点者/);
    assert.match(offline, /後半の得点者/);
});

test('既存の得点ランキングは合計得点者から同じ結果を算出する', () => {
    const { calcTopScorers } = load('src/lib/scoring.ts');
    assert.deepEqual(calcTopScorers([twoHalves]), [{ name: 'A', goals: 2 }, { name: 'B', goals: 1 }]);
});

test('得点者なしの0点で−を押しても得点者削除エラーの対象にならない', () => {
    const m = score('our', -1, base, '1H');
    assert.notEqual(m, base);
    assert.equal(m.ourScore, 0);
    assert.equal(m.ourScore1H, 0);
});
