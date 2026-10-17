import assert from 'node:assert/strict';
import { test } from 'node:test';
import { harness, collect, text } from './helpers/recording-harness.mjs';
const baseline = { matchId: 'audit', matchDate: '2026-10-17', matchFormat: 'halves', matchPhase: '1H', ourScore: 0, ourScore1H: 0, ourScore2H: 0, opponentScore: 0, opponentScore1H: 0, opponentScore2H: 0, result: 'draw', isLive: true, opponentName: 'TEST opponent', venueName: 'TEST venue' };
async function check(name, fn) { await test(name, fn); }
for (const ref of [null]) {
    const version = ref ? 'before' : 'current';
    await check(version + ': live scorer → auto-save → Undo', async () => { const h = harness(ref, { ...baseline }); await h.click('A'); assert.equal(h.data.ourScore, 1); assert.equal(h.data.scorers, 'A'); await h.flush(); assert.equal(h.calls[0].body.match.scorers, 'A'); await h.click('直前の得点を取り消す'); assert.equal(h.data.ourScore, 0); assert.equal(h.data.scorers, undefined); if (!ref)
        assert.equal(h.data.scorers1H, undefined); });
    await check(version + ': end match → PK/MVP/memo → confirm save', async () => { const h = harness(ref, { ...baseline, matchPhase: '2H', scorers: 'A', ourScore: 1, ourScore1H: 1 }); await h.click('試合終了'); assert.equal(h.data.matchPhase, 'full-time'); assert.equal(h.calls[0].body.match.isLive, false); const pk = collect(h.tree, n => n.type === 'input' && n.props.type === 'checkbox')[0]; assert.ok(pk); pk.props.onChange({ target: { checked: true } }); h.render(); const scores = collect(h.tree, n => n.type === 'input' && n.props.type === 'number'); assert.equal(scores.length, 2); scores[0].props.onChange({ target: { value: '4' } }); h.render(); collect(h.tree, n => n.type === 'input' && n.props.type === 'number')[1].props.onChange({ target: { value: '3' } }); h.render(); h.auto('MVP').props.onChange('B'); h.render(); h.changeInput('memo', 'test memo', 'textarea'); await h.submit(); const saved = h.calls.at(-1).body; assert.equal(saved.match.pkInfo.ourPkScore, 4); assert.equal(saved.match.pkInfo.opponentPkScore, 3); assert.equal(saved.match.mvp, 'B'); assert.equal(saved.match.memo, 'test memo'); assert.equal(saved.syncMasters, true); });
    await check(version + ': full-time scorer add → half selection → deferred save', async () => { const h = harness(ref, { ...baseline, isLive: false, matchPhase: 'full-time' }); await h.click('A'); assert.ok(h.openModal()); await h.click('後半に反映', h.openModal()); assert.equal(h.data.ourScore2H, 1); assert.equal(h.calls.length, 0); await h.submit(); assert.equal(h.calls.at(-1).body.match.scorers, 'A'); });
    await check(version + ': one-game add and delete', async () => { const h = harness(ref, { ...baseline, matchFormat: 'one_game' }); await h.click('A'); const chips = h.buttons('A').filter(b => text(b) === 'A'); await chips[0].props.onClick(); h.render(); assert.ok(h.openModal()); await h.click('削除する', h.openModal()); assert.equal(h.data.ourScore, 0); assert.equal(h.data.scorers, ''); });
    await check(version + ': Live OFF new entry and next match reset', async () => { const h = harness(ref, undefined); h.changeInput('isLive', '', 'checkbox'); h.auto('対戦相手').props.onChange('KEEP'); h.render(); await h.click('A'); if (h.openModal())
        await h.click('前半に反映', h.openModal()); assert.equal(h.data.ourScore, 1); await h.submit(); assert.equal(h.data.ourScore, 0); assert.equal(h.data.scorers, ''); assert.equal(h.data.opponentName, 'KEEP'); assert.equal(h.data.matchPhase, 'pre-game'); if (!ref) {
        assert.equal(h.data.scorers1H, '');
        assert.equal(h.data.scorers2H, '');
    } });
    await check(version + ': legacy aggregate scorer can be edited directly', async () => { const h = harness(ref, { ...baseline, isLive: false, matchPhase: 'pre-game', scorers: 'A(2), B', ourScore: 3, ourScore1H: 2, ourScore2H: 1 }); const field = h.auto('内訳未記録の得点者'); field.props.onChange('A, B(2)'); h.render(); assert.equal(h.data.scorers, 'A, B(2)'); });
}
for (const ref of [null]) {
    const version = ref ? 'before' : 'current';
    await check(version + ': halftime prevents score and scorer addition', async () => { const h = harness(ref, { ...baseline, matchPhase: 'halftime' }); const addButtons = h.buttons('A'); assert.equal(addButtons.length, 0); const disabled = collect(h.tree, n => n.type === 'button' && n.props.disabled); assert.ok(disabled.length >= 4); });
    await check(version + ': scorer removal uses selected half', async () => { const h = harness(ref, { ...baseline, scorers: 'A(2)', ourScore: 2, ourScore1H: 1, ourScore2H: 1, ...(!ref ? { scorers1H: 'A', scorers2H: 'A' } : {}) }); await h.click('A ×2'); await h.click('後半の得点を削除', h.openModal()); assert.equal(h.data.ourScore, 1); assert.equal(h.data.ourScore1H, 1); assert.equal(h.data.ourScore2H, 0); assert.equal(h.data.scorers, 'A'); if (!ref)
        assert.equal(h.data.scorers2H, ''); });
    await check(version + ': match deletion remains available (mock only)', async () => { const h = harness(ref, { ...baseline, matchPhase: 'full-time', isLive: false }); const b = h.buttons('この試合記録を削除'); assert.equal(b.length, 1); await b[0].props.onClick(); assert.equal(h.calls.at(-1).method, 'DELETE'); });
}
await check('current: match format round trip preserves half scorers', async () => { const h = harness(null, { ...baseline, isLive: false, matchPhase: 'pre-game', ourScore: 1, ourScore1H: 1, scorers: 'A', scorers1H: 'A' }); await h.click('1本'); await h.click('前後半'); assert.equal(h.data.scorers1H, 'A'); });
test('内訳未記録の名前・複数人入力を訂正しても既知のハーフとスコアを保持する', () => {
    const h = harness(null, { ...baseline, isLive: false, matchPhase: 'pre-game', scorers: 'A, C', scorers1H: 'A', ourScore: 2, ourScore1H: 1, ourScore2H: 1 });
    h.auto('内訳未記録の得点者').props.onChange('B,');
    h.render();
    assert.equal(h.auto('内訳未記録の得点者').props.value, 'B,');
    h.auto('内訳未記録の得点者').props.onChange('B, C(2)');
    h.render();
    assert.equal(h.data.scorers, 'B, C(2), A');
    assert.equal(h.data.scorers1H, 'A');
    assert.equal(h.data.ourScore, 2);
    h.auto('内訳未記録の得点者').props.onChange('');
    h.render();
    assert.equal(h.data.scorers, 'A');
    assert.equal(h.data.scorers1H, 'A');
});
test('1本制への切替後の得点者訂正で、矛盾する割当だけを未記録に戻す', async () => {
    const h = harness(null, { ...baseline, isLive: false, matchPhase: 'pre-game', scorers: 'A(2), B', scorers1H: 'A, B', scorers2H: 'A', ourScore: 3, ourScore1H: 2, ourScore2H: 1 });
    await h.click('1本');
    assert.equal(h.data.scorers1H, 'A, B');
    h.auto('得点者 (自チーム)').props.onChange('A, B');
    h.render();
    await h.click('前後半');
    assert.equal(h.data.scorers1H, 'B');
    assert.equal(h.data.scorers2H, '');
    assert.equal(h.data.scorers, 'A, B');
});
