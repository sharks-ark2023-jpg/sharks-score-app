import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import ts from 'typescript';
const root = process.cwd();
const realRequire = createRequire(import.meta.url);
export function collect(node, predicate, out = []) { if (Array.isArray(node)) {
    node.forEach(n => collect(n, predicate, out));
    return out;
} if (!node || typeof node !== 'object')
    return out; if (predicate(node))
    out.push(node); collect(node.props?.children, predicate, out); return out; }
export const text = n => Array.isArray(n) ? n.map(text).join('') : typeof n === 'string' || typeof n === 'number' ? String(n) : n && typeof n === 'object' ? text(n.props?.children) : '';
// Reactの状態と実イベントハンドラーを動かす。通信・タイマー・確認はモック。
// formDataのref同期だけ実行し、認証ロックなどの外部副作用は実行しない。
export function harness(_ref, initialMatch, options = {}) {
    let state = [], cursor = 0, refValues = [], refCursor = 0, effects = [], timers = new Map(), nextTimer = 1, calls = [], confirms = 0;
    const fakeReact = { useState(init) { const i = cursor++; if (!(i in state))
            state[i] = typeof init === 'function' ? init() : init; return [state[i], v => state[i] = typeof v === 'function' ? v(state[i]) : v]; }, useRef(init) { const i = refCursor++; if (!refValues[i])
            refValues[i] = { current: init }; return refValues[i]; }, useEffect(fn, deps) { if (deps?.length === 1 && typeof deps[0] === 'object')
            effects.push(fn); } };
    const empty = () => null;
    const stubs = { 'react': fakeReact, 'next/navigation': { useRouter: () => ({ push() { }, refresh() { }, back() { } }), useParams: () => ({ gradeId: 'U12' }) }, 'swr': { __esModule: true, default: (url) => options.swr ? options.swr(url) : ({ data: { settings: { teamName: 'TEST' }, masters: [{ masterType: 'player', name: 'A', grade: 'U12' }, { masterType: 'player', name: 'B', grade: 'U12' }] } }) }, 'uuid': { v4: () => `new-${Math.random()}` } };
    const cache = new Map();
    function load(file) {
        if (cache.has(file))
            return cache.get(file).exports;
        const m = { exports: {} };
        cache.set(file, m);
        const source = fs.readFileSync(path.join(root, file), 'utf8');
        const js = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true } }).outputText;
        const req = id => { if (stubs[id])
            return stubs[id]; if (id.endsWith('Autocomplete') || id.endsWith('Modal') || id.endsWith('ScorerBreakdown'))
            return { __esModule: true, default: empty }; if (id.startsWith('@/') || id.startsWith('.')) {
            let f = id.startsWith('@/') ? 'src/' + id.slice(2) : path.join(path.dirname(file), id);
            f = [f, f + '.ts', f + '.tsx'].find(f => fs.existsSync(path.join(root, f)));
            return load(f);
        } return realRequire(id); };
        const fetch = async (url, options) => { calls.push({ url, ...options, body: options.body ? JSON.parse(options.body) : undefined }); return { ok: true, status: 200, json: async () => ({ lastUpdated: 'save-' + calls.length, saveToken: 'mock-token' }) }; };
        const setTimeout = (fn, delay) => { const id = nextTimer++; timers.set(id, { fn, delay }); return id; };
        new Function('require', 'module', 'exports', 'fetch', 'setTimeout', 'clearTimeout', 'confirm', 'window', js)(req, m, m.exports, fetch, setTimeout, id => timers.delete(id), () => { confirms++; return true; }, { scrollTo() { } });
        return m.exports;
    }
    const Component = load(options.file || 'src/components/MatchForm.tsx').default;
    let tree;
    function render() { cursor = 0; refCursor = 0; effects = []; tree = Component({ gradeId: 'U12', initialMatch, ...options.props }); effects.forEach(fn => fn()); return tree; }
    function buttons(part, scope = tree) { return collect(scope, n => n.type === 'button' && text(n).includes(part)); }
    function button(part, scope = tree) { let bs = buttons(part, scope); const exact = bs.filter(b => text(b).trim() === part); if (exact.length)
        bs = exact; assert.equal(bs.length, 1, 'button ' + part); return bs[0]; }
    function auto(label) { const es = collect(tree, n => n.props?.label === label); assert.equal(es.length, 1, 'field ' + label); return es[0]; }
    async function click(part, scope) { await button(part, scope).props.onClick(); render(); }
    function openModal() { return collect(tree, n => n.props?.isOpen === true)[0]; }
    async function flush() { const t = [...timers].filter(([, v]) => v.delay >= 1500).sort((a, b) => a[1].delay - b[1].delay)[0]; if (t) {
        timers.delete(t[0]);
        await t[1].fn();
        for (let i = 0; i < 8; i++)
            await Promise.resolve();
        render();
    } }
    render();
    return { get tree() { return tree; }, get data() { return state[0]; }, get calls() { return calls; }, get confirms() { return confirms; }, render, button, buttons, auto, click, openModal, flush, async submit() { const form = collect(tree, n => n.type === 'form')[0]; await form.props.onSubmit({ preventDefault() { } }); render(); }, changeInput(name, value, type = 'number') { const el = collect(tree, n => n.props?.name === name)[0]; assert.ok(el, 'input ' + name); el.props.onChange({ target: { name, value, type } }); render(); }, collect };
}
