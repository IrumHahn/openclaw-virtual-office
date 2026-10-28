#!/usr/bin/env node
// org.json + 템플릿(1~5) → 가상 오피스 HTML 두 가지.
//   widget.html — 대시보드 「나의 위젯」용. 작게(≈15~25KB) 만들고 배경·캐릭터·음악은 이 키트의 CDN(jsDelivr)에서 읽는다.
//                 (PC 앱 v0.4+ 의 위젯 CSP 가 이 CDN 만 허용한다. 그 외 외부 주소는 여전히 막힌다.)
//   office.html — 브라우저에서 바로 여는 독립 한 장(같은 내용, 발표·Mac·대시보드 없을 때).
// 사용: node build_office.mjs --org org.json --template <diorama|saas|rpg|control|building> [--out <폴더>] [--cdn <주소>] [--list]
// 결과(JSON): { ok, template, files, widgetChars, allowWindowsEstimate, warnings[] }
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'

const HERE = path.dirname(new URL(import.meta.url).pathname)
const TPL = path.join(HERE, '..', 'templates')
const MAX_WIDGET = 60000
const DEFAULT_CDN = 'https://cdn.jsdelivr.net/gh/IrumHahn/openclaw-virtual-office@main/web/'
export const TEMPLATES = {
  diorama: { no: 1, label: '디오라마 스튜디오', desc: '3D 렌더 미니어처 칸막이 사무실. 펠트 인형이 조용히 일하고, 인형에 올리면 지금 하는 일. 라디오(로파이) 버튼', fit: '조용한 감성 · 1인 사업자 · 공방·카페' },
  saas: { no: 2, label: 'AI 오피스 SaaS', desc: '사이드바 앱 속 오피스. 대표실·비서실·업무 공간·회의실·탕비실 칩으로 구역 비추기, 직원 상세, 업무 지시 버튼', fit: '관리 화면이 필요한 팀 · 컨설팅·교육' },
  rpg: { no: 3, label: '레트로 RPG', desc: '16비트 JRPG. 파티 창(HP·MP), 퀘스트 로그, 대화창, CRT. 결과물을 전달하면 골드', fit: '재미 · 유튜브·커뮤니티·게임' },
  control: { no: 4, label: '미션 컨트롤', desc: '관제탑 3단 콘솔에 앉은 로봇 요원. 타임라인·KPI·상태 LED·텔레메트리', fit: '개발·자동화·데이터 팀' },
  building: { no: 5, label: '사옥 단면도', desc: '5층 사옥 컷어웨이. 층마다 부서, 엘리베이터로 이동, 층별 인원', fit: '성장 스토리 · 부서가 나뉠 팀' },
}
const SECRET = /(api[_-]?key|secret|password|token)\s*[:=]\s*\S{6,}/i
function fail(message, code = 1) { process.stdout.write(JSON.stringify({ ok: false, error: message }) + '\n'); process.exit(code) }

function parseArgs(argv) {
  const o = { org: null, template: null, out: path.join(os.homedir(), '.openclaw', 'workspace', 'virtual-office'), cdn: DEFAULT_CDN, list: false }
  for (let i = 0; i < argv.length; i++) {
    const f = argv[i]
    if (f === '--list') { o.list = true; continue }
    const v = argv[++i]
    if (v === undefined) fail(`${f} needs a value`)
    if (f === '--org') o.org = v
    else if (f === '--template') o.template = v
    else if (f === '--out') o.out = v
    else if (f === '--cdn') o.cdn = v
    else fail(`unknown option ${f}`)
  }
  if (!o.cdn.endsWith('/')) o.cdn += '/'
  return o
}
export function listOptions() { return Object.entries(TEMPLATES).map(([key, t]) => ({ key, ...t })) }

// 템플릿 페이지를 변환: org 인라인, 상대 에셋 → CDN, 엔진/맵은 인라인(요청 수 절감), 임베드 모드(위젯)면 nav 숨김 + 높이 보고.
export function render(templateKey, org, { cdn = DEFAULT_CDN, embed = false } = {}) {
  if (!TEMPLATES[templateKey]) throw new Error(`unknown template ${templateKey}`)
  let html = fs.readFileSync(path.join(TPL, `${templateKey}.html`), 'utf8')
  const inline = name => `<script>${fs.readFileSync(path.join(TPL, name), 'utf8').replace(/<\/script/gi, '<\\/script')}</script>`
  const orgJson = JSON.stringify(org).replace(/<\/script/gi, '<\\/script')
  html = html.replace('<script src="org.js"></script>', `<script>window.OFFICE_ORG=${orgJson}</script>`)
  // 위젯은 작아야 하므로(Hub 허용 창 수) 엔진·맵·CSS 도 CDN 에서; 독립 파일은 인라인(엔진이 바뀌어도 그 파일은 그대로 동작)
  if (embed) {
    html = html.replace('<script src="engine.js"></script>', `<script src="${cdn}engine.js"></script>`)
    html = html.replace('<script src="maps-v3.js"></script>', `<script src="${cdn}maps-v3.js"></script>`).replace('<script src="maps.js"></script>', `<script src="${cdn}maps.js"></script>`)
    html = html.replace('<link rel="stylesheet" href="engine.css">', `<link rel="stylesheet" href="${cdn}engine.css">`)
  } else {
    html = html.replace('<script src="engine.js"></script>', inline('engine.js'))
    html = html.replace('<script src="maps-v3.js"></script>', inline('maps-v3.js')).replace('<script src="maps.js"></script>', inline('maps.js'))
    html = html.replace('<link rel="stylesheet" href="engine.css">', `<style>${fs.readFileSync(path.join(TPL, 'engine.css'), 'utf8')}</style>`)
  }
  // 상대 에셋(bg/ chars/ audio/) → CDN
  html = html.replace(/(src|href)="(bg|chars|audio)\//g, `$1="${cdn}$2/`).replace(/`chars\//g, '`' + cdn + 'chars/').replace(/'chars\//g, "'" + cdn + 'chars/').replace(/"chars\//g, '"' + cdn + 'chars/')
  html = html.replace(/\$\{chars\}\//g, '${chars}/') // 엔진 내부 템플릿 문자열은 그대로(chars 값 자체가 CDN 주소)
  html = html.replace(/chars: 'chars\//g, `chars: '${cdn}chars/`)
  if (embed) {
    const tail = `<script>document.documentElement.classList.add('embed');(function(){function fit(){parent.postMessage({type:'dashboard:height',height:document.documentElement.scrollHeight+8},'*')}addEventListener('message',function(e){if(e.data&&e.data.type==='dashboard:data'){window.OFFICE_DATA=e.data.data;dispatchEvent(new CustomEvent('office:data',{detail:e.data.data}))}fit()});parent.postMessage({type:'dashboard:ready'},'*');fit();setInterval(fit,2000);addEventListener('resize',fit)})()</script>`
    html = html.replace('</body>', tail + '</body>')
  }
  return html
}

export function build(org, { template, out, cdn }) {
  if (!TEMPLATES[template]) fail(`unknown template ${template} (${Object.keys(TEMPLATES).join('|')})`)
  if (SECRET.test(JSON.stringify(org))) fail('org.json looks like it contains a secret', 3)
  const widget = render(template, org, { cdn, embed: true })
  const office = render(template, org, { cdn, embed: false })
  const warnings = []
  if (widget.length > MAX_WIDGET) fail(`widget.html is ${widget.length} chars (> ${MAX_WIDGET})`)
  const allowWindowsEstimate = Math.ceil((widget.length * 4 / 3) / 6000)
  if (allowWindowsEstimate > 5) warnings.push(`Windows Hub 앱 경로면 허용 창이 약 ${allowWindowsEstimate}번 뜹니다`)
  fs.mkdirSync(out, { recursive: true })
  const files = { widget: path.join(out, 'widget.html'), office: path.join(out, 'office.html') }
  fs.writeFileSync(files.widget, widget); fs.writeFileSync(files.office, office)
  return { ok: true, template, label: TEMPLATES[template].label, files, widgetChars: widget.length, allowWindowsEstimate, cdn, warnings, note: 'PC 앱(openclaw-personal-dashboard)은 v0.4 이상이어야 위젯에서 CDN 배경이 보입니다(git pull). office.html 은 어느 브라우저에서나 열립니다.' }
}

const isMain = process.argv[1] && path.resolve(process.argv[1]) === new URL(import.meta.url).pathname
if (isMain) {
  const opts = parseArgs(process.argv.slice(2))
  if (opts.list) { process.stdout.write(JSON.stringify(listOptions(), null, 2) + '\n'); process.exit(0) }
  if (!opts.org) fail('--org <org.json> is required (run collect_org.mjs first)')
  if (!opts.template) fail('--template <diorama|saas|rpg|control|building> is required')
  const org = JSON.parse(fs.readFileSync(opts.org, 'utf8'))
  process.stdout.write(JSON.stringify(build(org, opts), null, 2) + '\n')
}
