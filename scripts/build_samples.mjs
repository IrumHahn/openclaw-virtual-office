#!/usr/bin/env node
// 시안 페이지 생성: samples/index.html — 렌더러와 샘플 조직(맥미니 에이전트 10명)을 내장해 스타일·단계를 즉시 바꿔 본다.
// 사용: node scripts/build_samples.mjs [--org samples/macmini-org.json] [--out samples/index.html]
import fs from 'node:fs'
import path from 'node:path'

const root = path.join(path.dirname(new URL(import.meta.url).pathname), '..')
const args = process.argv.slice(2)
const arg = (k, d) => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : d }
const orgFile = arg('--org', path.join(root, 'samples', 'macmini-org.json'))
const outFile = arg('--out', path.join(root, 'samples', 'index.html'))

const renderSrc = fs.readFileSync(path.join(root, 'skill', 'virtual-office', 'scripts', 'lib', 'render.mjs'), 'utf8')
  .replace(/^export (const|function) /gm, '$1 ')
  .replace(/<\/script/g, '<\\/script') // 인라인 <script> 안에서 닫힘 태그로 읽히지 않게
if (/https?:\/\//.test(renderSrc)) throw new Error('renderer must not contain external URLs')
const org = JSON.parse(fs.readFileSync(orgFile, 'utf8'))
const orgJson = JSON.stringify(org).replace(/<\/script/gi, '<\\/script')

const html = `<!doctype html>
<html lang="ko">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>가상 오피스 시안</title>
<meta name="description" content="OpenClaw 에이전트 팀을 가상 오피스로 그리는 virtual-office 스킬의 옵션별 시안. 스타일 4종 × 성장 단계 3종.">
<style>
:root{--bg:#f5f3ee;--ink:#2a2622;--muted:#7a736a;--card:#fff;--line:#e4ded3;--accent:#d1803e}
@media (prefers-color-scheme:dark){:root:not([data-theme="light"]){--bg:#15181f;--ink:#eae7e1;--muted:#9a978f;--card:#1e222b;--line:#2d323d}}
:root[data-theme="dark"]{--bg:#15181f;--ink:#eae7e1;--muted:#9a978f;--card:#1e222b;--line:#2d323d}
*{box-sizing:border-box}body{margin:0;background:var(--bg);color:var(--ink);font-family:system-ui,-apple-system,"Apple SD Gothic Neo","Malgun Gothic",sans-serif}
main{max-width:1240px;margin:0 auto;padding:28px 16px 48px}
h1{font-size:24px;margin:0 0 6px}p.lead{margin:0 0 18px;color:var(--muted);font-size:14px;line-height:1.6}
.controls{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:16px}
@media (max-width:720px){.controls{grid-template-columns:1fr}}
fieldset{border:1px solid var(--line);border-radius:12px;padding:10px 12px;background:var(--card);margin:0}
legend{font-size:12px;color:var(--muted);padding:0 6px}
.opts{display:flex;flex-wrap:wrap;gap:8px}
.opt{border:1px solid var(--line);border-radius:999px;padding:7px 12px;font-size:13px;cursor:pointer;background:transparent;color:var(--ink)}
.opt[aria-pressed="true"]{background:var(--accent);border-color:var(--accent);color:#fff}
.opt small{display:block;font-size:11px;opacity:.75}
.stage{background:var(--card);border:1px solid var(--line);border-radius:16px;padding:10px}
.meta{display:flex;flex-wrap:wrap;gap:8px 18px;font-size:13px;color:var(--muted);margin:12px 2px 0}
.meta b{color:var(--ink)}
.note{margin-top:18px;font-size:13px;color:var(--muted);line-height:1.6;border-top:1px solid var(--line);padding-top:12px}
.note code{background:var(--card);border:1px solid var(--line);border-radius:6px;padding:1px 6px;font-size:12px}
</style>
</head>
<body>
<main>
<h1>가상 오피스 시안</h1>
<p class="lead">샘플 조직: 이룸의 맥미니 OpenClaw 팀(직원 10명, 실제 에이전트 이름·역할). 채용 예정 포지션은 업무 지도에서 뽑는다는 가정의 <b>예시</b>예요. 스타일과 성장 단계를 눌러 보세요. 내 팀으로 만들려면 아래 안내대로 스킬을 설치하면 돼요.</p>
<div class="controls">
<fieldset><legend>스타일</legend><div class="opts" id="styles"></div></fieldset>
<fieldset><legend>성장 단계 (책상 수)</legend><div class="opts" id="stages"></div></fieldset>
</div>
<div class="stage" id="stage"></div>
<div class="meta" id="meta"></div>
<p class="note">이 화면은 스킬이 만드는 결과와 같은 렌더러로 그렸어요. 스킬 실행: 에이전트 채팅에 <code>가상 오피스 만들어줘</code> → 옵션 번호 고르기 → 대시보드 홈 「나의 위젯」에 도착. 빈 책상의 <b>채용 예정</b>은 내 업무 지도의 "맡기고 싶은 일"에서 나와요.</p>
</main>
<script type="module">
${renderSrc}
const org = ${orgJson};
const state = { style: 'warm', stage: 'floor' };
try { const saved = JSON.parse(localStorage.getItem('vo-sample') || '{}'); if (STYLES[saved.style]) state.style = saved.style; if (STAGES[saved.stage]) state.stage = saved.stage } catch {}
function buttons(el, dict, key) {
  el.innerHTML = '';
  for (const [k, v] of Object.entries(dict)) {
    const b = document.createElement('button'); b.type = 'button'; b.className = 'opt'; b.setAttribute('aria-pressed', String(state[key] === k));
    b.innerHTML = '<span>' + v.label + '</span><small>' + v.desc + '</small>';
    b.addEventListener('click', () => { state[key] = k; try { localStorage.setItem('vo-sample', JSON.stringify(state)) } catch {} draw() });
    el.appendChild(b);
  }
}
function draw() {
  buttons(document.getElementById('styles'), STYLES, 'style');
  buttons(document.getElementById('stages'), STAGES, 'stage');
  const { svg, stats } = renderOffice(org, state);
  document.getElementById('stage').innerHTML = svg;
  document.getElementById('meta').innerHTML = '<span>책상 <b>' + stats.desks + '</b></span><span>직원 <b>' + stats.agents + '</b></span><span>채용 예정 <b>' + stats.planned + '</b></span><span>빈 자리 <b>' + stats.empty + '</b></span><span>스타일 <b>' + STYLES[state.style].label + '</b></span><span>단계 <b>' + STAGES[state.stage].label + '</b></span>';
}
draw();
</script>
</body>
</html>
`
fs.mkdirSync(path.dirname(outFile), { recursive: true })
fs.writeFileSync(outFile, html)
console.log(`wrote ${outFile} (${html.length} chars)`)
