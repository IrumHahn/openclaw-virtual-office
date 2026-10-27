#!/usr/bin/env node
// org.json + 옵션 → 가상 오피스 HTML. 두 가지 결과:
//   widget.html  — 대시보드 「나의 위젯」용(앱이 주는 기록으로 작업 중/대기·말풍선·Lv 갱신). dashboard-builder 의 --widget 에 넣는다.
//   office.html  — 브라우저에서 바로 여는 독립 한 장(Mac·발표용).
// 사용: node build_office.mjs --org org.json [--style warm|glass|pixel|night] [--stage studio|floor|hq] [--out <폴더>] [--list]
// 결과(JSON): { ok, style, stage, files, stats, widgetChars, allowWindowsEstimate, warnings[] }
// 용량 60,000자(위젯 한도)를 넘으면 실패한다. 외부 URL(http/https/data:)이 있으면 실패한다.
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { renderStandalone, renderWidget, STAGES, STYLES } from './lib/render.mjs'

const MAX_WIDGET = 60000
function fail(message, code = 1) { process.stdout.write(JSON.stringify({ ok: false, error: message }) + '\n'); process.exit(code) }

function parseArgs(argv) {
  const o = { org: null, style: 'warm', stage: 'floor', out: path.join(os.homedir(), '.openclaw', 'workspace', 'virtual-office'), list: false }
  for (let i = 0; i < argv.length; i++) {
    const f = argv[i]
    if (f === '--list') { o.list = true; continue }
    const v = argv[++i]
    if (v === undefined) fail(`${f} needs a value`)
    if (f === '--org') o.org = v
    else if (f === '--style') o.style = v
    else if (f === '--stage') o.stage = v
    else if (f === '--out') o.out = v
    else fail(`unknown option ${f}`)
  }
  return o
}

export function listOptions() {
  return {
    styles: Object.entries(STYLES).map(([key, s]) => ({ key, label: s.label, desc: s.desc })),
    stages: Object.entries(STAGES).map(([key, s]) => ({ key, label: s.label, desc: s.desc, desks: s.pods.length * 4 })),
  }
}

export function build(org, { style, stage, out }) {
  if (!STYLES[style]) fail(`unknown style ${style} (${Object.keys(STYLES).join('|')})`)
  if (!STAGES[stage]) fail(`unknown stage ${stage} (${Object.keys(STAGES).join('|')})`)
  const widget = renderWidget(org, { style, stage })
  const standalone = renderStandalone(org, { style, stage })
  const warnings = []
  const external = widget.html.match(/<(script|link|img|iframe)[^>]+(src|href)\s*=\s*["']?https?:/i) || widget.html.match(/https?:\/\//i)
  if (external) fail('widget contains an external URL — not allowed in the dashboard widget sandbox')
  if (widget.html.length > MAX_WIDGET) fail(`widget.html is ${widget.html.length} chars (> ${MAX_WIDGET}). Use --stage studio or fewer planned positions`)
  const allowWindowsEstimate = Math.ceil((widget.html.length * 4 / 3) / 6000)
  if (allowWindowsEstimate > 4) warnings.push(`Windows Hub 앱 경로면 허용 창이 약 ${allowWindowsEstimate}번 뜹니다. --stage studio 또는 floor 를 권합니다`)
  fs.mkdirSync(out, { recursive: true })
  const files = { widget: path.join(out, 'widget.html'), office: path.join(out, 'office.html') }
  fs.writeFileSync(files.widget, widget.html)
  fs.writeFileSync(files.office, standalone.html)
  return { ok: true, style, stage, files, stats: widget.stats, widgetChars: widget.html.length, allowWindowsEstimate, warnings }
}

const isMain = process.argv[1] && path.resolve(process.argv[1]) === new URL(import.meta.url).pathname
if (isMain) {
  const opts = parseArgs(process.argv.slice(2))
  if (opts.list) { process.stdout.write(JSON.stringify(listOptions(), null, 2) + '\n'); process.exit(0) }
  if (!opts.org) fail('--org <org.json> is required (run collect_org.mjs first)')
  const org = JSON.parse(fs.readFileSync(opts.org, 'utf8'))
  process.stdout.write(JSON.stringify(build(org, opts), null, 2) + '\n')
}
