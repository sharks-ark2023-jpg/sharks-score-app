import assert from 'node:assert/strict';
import { test } from 'node:test';
import { harness, collect, text } from './helpers/recording-harness.mjs';

const today = new Date().toISOString().slice(0, 10);
const matches = [
    { matchId: 'recent', matchDate: today, opponentName: 'Blue Eagles', ourScore: 2, opponentScore: 1, result: 'win', matchType: 'friendly', isLive: false },
    { matchId: 'old', matchDate: '2020-01-02', opponentName: 'ＢＬＵＥ　ＥＡＧＬＥＳ', ourScore: 0, opponentScore: 1, result: 'loss', matchType: 'tournament', isLive: false },
    { matchId: 'other', matchDate: '2020-02-02', opponentName: '石神井SC', ourScore: 1, opponentScore: 1, result: 'draw', matchType: 'friendly', isLive: false },
    { matchId: 'live', matchDate: today, opponentName: 'Blue Eagles', result: 'draw', isLive: true },
];
const swr = url => ({ data: url.includes('/api/matches') ? { matches } : { settings: {} }, isLoading: false });
const search = h => collect(h.tree, node => node.props?.resultCount !== undefined && typeof node.props.onChange === 'function')[0];
const changeQuery = (h, value) => { search(h).props.onChange(value); h.render(); };
const archivedIds = h => collect(h.tree, node => node.props?.href?.endsWith('/view')).map(node => node.props.href.split('/').at(-2));
const lists = h => collect(h.tree, node => Array.isArray(node.props?.matches)).map(node => node.props.matches);
const resultIds = h => lists(h).find(list => !list.some(match => match.isLive)).map(match => match.matchId);

test('試合履歴は空欄で従来の当月、検索時は過去も対象・表記差を吸収する', () => {
    const h = harness(null, undefined, { file: 'src/app/grade/[gradeId]/page.tsx', swr });
    assert.deepEqual(resultIds(h), ['recent']);
    changeQuery(h, ' ｂｌｕｅ eAg ');
    assert.deepEqual(resultIds(h), ['recent', 'old']);
    assert.equal(search(h).props.resultCount, 2);
    assert.equal(lists(h).some(list => list.some(match => match.matchId === 'live')), true);
    const select = collect(h.tree, node => node.type === 'select')[0];
    select.props.onChange({ target: { value: 'tournament' } });
    h.render();
    assert.deepEqual(resultIds(h), ['old']);
    changeQuery(h, '該当なし');
    assert.match(text(h.tree), /一致する試合がありません/);
    changeQuery(h, '');
    assert.equal(search(h).props.resultCount, 0); // 公式戦フィルターは保持。
});

test('過去の戦績は検索→0件→クリアで元の一覧と月別集計に戻る', () => {
    const h = harness(null, undefined, { file: 'src/app/grade/[gradeId]/archive/page.tsx', swr });
    assert.deepEqual(archivedIds(h), ['other', 'old']);
    changeQuery(h, 'blue');
    assert.deepEqual(archivedIds(h), ['old']);
    assert.equal(search(h).props.resultCount, 1);
    assert.match(text(h.tree), /2020年1月/);
    assert.doesNotMatch(text(h.tree), /2020年2月/);
    changeQuery(h, '石神井ｓｃ');
    assert.deepEqual(archivedIds(h), ['other']);
    changeQuery(h, '存在しない');
    assert.equal(search(h).props.resultCount, 0);
    assert.match(text(h.tree), /一致する試合がありません/);
    changeQuery(h, '　 ');
    assert.deepEqual(archivedIds(h), ['other', 'old']);
});

test('検索は空白・全角半角を吸収し、BAND出力の対象を変更しない', async () => {
    const h = harness(null, undefined, { file: 'src/app/grade/[gradeId]/page.tsx', swr });
    changeQuery(h, '石神井');
    assert.deepEqual(resultIds(h), ['other']);
    await h.click('BAND書き出し');
    const textarea = collect(h.tree, node => node.type === 'textarea')[0];
    assert.match(textarea.props.value, /2-1/); // 今日の試合結果は検索に左右されない。
});


test('検索欄は初期状態で隠れ、アイコンで開き、閉じると絞込を解除する', async () => {
    const changes = [];
    const h = harness(null, undefined, { file: 'src/components/OpponentSearch.tsx', props: { value: 'blue', resultCount: 2, onChange: value => changes.push(value) } });
    assert.equal(collect(h.tree, node => node.type === 'input').length, 0);
    const button = collect(h.tree, node => node.type === 'button' && node.props['aria-label'] === '対戦相手を検索')[0];
    assert.ok(button);
    assert.equal(button.props['aria-expanded'], false);
    button.props.onClick();
    h.render();
    assert.equal(collect(h.tree, node => node.type === 'input').length, 1);
    const close = collect(h.tree, node => node.type === 'button' && node.props['aria-label'] === '検索を閉じる')[0];
    assert.equal(close.props['aria-expanded'], true);
    close.props.onClick();
    h.render();
    assert.equal(collect(h.tree, node => node.type === 'input').length, 0);
    assert.deepEqual(changes, ['']);
});
