#!/usr/bin/env node
// 재료를 모아 org.json 을 만든다: openclaw agents list(직원) + team.json(역할·총괄) + my-work-map.md(채용 예정 후보).
// 사용: node collect_org.mjs [--team <team.json>] [--work-map <my-work-map.md>] [--agents-json <파일>] [--company "이름"] [--owner "호칭"] [--tagline "한 줄"] [--out org.json]
//   --agents-json 이 없으면 `openclaw agents list --json` 을 직접 실행한다(OPENCLAW_BIN 으로 경로 지정 가능).
// 결과: { company, owner, tagline, departments, agents[], planned[], notes[] } 를 stdout(JSON) 과 --out 파일에 쓴다.
// 비밀값(token/password/secret/api key 모양)이 들어오면 거부한다. 채용 예정(planned)은 "제안"이다 — 에이전트가 사용자와 확인한 뒤 고친다.
import fs from 'node:fs'
import path from 'node:path'
import { spawnSync } from 'node:child_process'

const SECRET = /(api[_-]?key|secret|password|token)\s*[:=]\s*\S{6,}/i
function fail(message, code = 1) { process.stderr.write(`${message}\n`); process.exit(code) }

function parseArgs(argv) {
  const o = { team: null, workMap: null, agentsJson: null, company: null, owner: null, tagline: null, out: null }
  for (let i = 0; i < argv.length; i++) {
    const f = argv[i]; const v = argv[++i]
    if (v === undefined) fail(`${f} needs a value`)
    if (f === '--team') o.team = v
    else if (f === '--work-map') o.workMap = v
    else if (f === '--agents-json') o.agentsJson = v
    else if (f === '--company') o.company = v
    else if (f === '--owner') o.owner = v
    else if (f === '--tagline') o.tagline = v
    else if (f === '--out') o.out = v
    else fail(`unknown option ${f}`)
  }
  return o
}

function readText(file) {
  const text = fs.readFileSync(file, 'utf8')
  if (SECRET.test(text)) fail(`refusing: ${file} looks like it contains a secret`, 3)
  return text
}

export function loadAgentsList(opts) {
  if (opts.agentsJson) return JSON.parse(readText(opts.agentsJson))
  const bin = process.env.OPENCLAW_BIN || 'openclaw'
  const res = spawnSync(bin, ['agents', 'list', '--json'], { encoding: 'utf8' })
  if (res.error || res.status !== 0) fail(`openclaw agents list --json failed: ${res.error?.message || res.stderr}`)
  const text = res.stdout
  const start = text.indexOf('[')
  if (start < 0) fail('agents list: no JSON array in output')
  return JSON.parse(text.slice(start))
}

// team.json(팀 온보딩 산출물) → { id: { role, mission, coordinator, emoji } }
export function readTeam(file) {
  if (!file || !fs.existsSync(file)) return {}
  const team = JSON.parse(readText(file))
  const list = Array.isArray(team.agents) ? team.agents : Array.isArray(team) ? team : []
  const map = {}
  for (const a of list) if (a && a.id) map[a.id] = { role: a.role || a.title || '', mission: a.mission || '', coordinator: a.coordinator === true || a.role === '총괄', emoji: a.emoji || '' }
  return map
}

// 역할 이름에서 이모지 추천 (없을 때만)
const ROLE_EMOJI = [['리서치', '📊'], ['조사', '📊'], ['글', '✍️'], ['콘텐츠', '✍️'], ['코딩', '💻'], ['개발', '💻'], ['디자인', '🎨'], ['QA', '🔍'], ['검수', '🔍'], ['마케팅', '📣'], ['소셜', '📣'], ['고객', '💬'], ['응대', '💬'], ['영상', '🎬'], ['재무', '🧾'], ['정산', '🧾'], ['회계', '🧾'], ['운영', '🧭'], ['총괄', '🌟'], ['비서', '🌟'], ['주문', '🛍️'], ['쇼핑', '🛍️'], ['교육', '📘'], ['코치', '📘'], ['메일', '📮'], ['일정', '📅']]
export function guessEmoji(text, fallback = '✨') {
  for (const [k, e] of ROLE_EMOJI) if (text && text.includes(k)) return e
  return fallback
}

// 업무 지도에서 채용 예정 후보를 뽑는다: 상위 3개 업무, "맡기고 싶은 일", 위임 희망도 4 이상 표 행.
export function plannedFromWorkMap(text) {
  if (!text) return []
  const out = []
  const seen = new Set()
  const add = (title, reason) => {
    const t = title.replace(/\*\*/g, '').replace(/^예:\s*/, '').trim().slice(0, 14)
    if (!t || /^업무명$/.test(t) || seen.has(t)) return
    seen.add(t); out.push({ title: t, reason: reason.slice(0, 24), emoji: guessEmoji(t) })
  }
  const top = text.split(/\n## /).find(sec => sec.startsWith('상위 3개 업무')) || ''
  for (const m of top.matchAll(/^\s*\d+\.\s+\*\*([^*]+)\*\*/gm)) add(m[1], '업무 지도 · 상위 업무')
  for (const m of text.matchAll(/^\|\s*([^|]+?)\s*\|\s*[^|]*\|\s*[^|]*\|\s*([1-5])\s*\|/gm)) {
    if (/^업무명|^---/.test(m[1].trim())) continue
    if (Number(m[2]) >= 4) add(m[1], `업무 지도 · 위임 희망도 ${m[2]}`)
  }
  const want = text.match(/맡기고 싶은 일\s*:\s*(.+)/)
  if (want) for (const part of want[1].split(/[,，·/]/)) add(part, '업무 지도 · 맡기고 싶은 일')
  return out.slice(0, 8)
}

export function buildOrg({ agentsList, team, workMapText, company, owner, tagline }) {
  const notes = []
  const agents = agentsList.map(a => {
    const t = team[a.id] || {}
    const name = a.identityName || a.name || a.id
    const role = t.role || (name.match(/\(([^)]+)\)/)?.[1] || '')
    return {
      id: a.id,
      name: name.replace(/\s*\([^)]*\)\s*$/, ''),
      emoji: a.identityEmoji || t.emoji || guessEmoji(role, '🤖'),
      role: role === '총괄' ? '총괄' : role,
      coordinator: t.coordinator === true || a.isDefault === true,
      status: 'idle',
      level: 1,
    }
  })
  if (agents.filter(a => a.coordinator).length > 1) {
    const def = agents.find(a => agentsList.find(x => x.id === a.id)?.isDefault)
    for (const a of agents) a.coordinator = a === def
    notes.push('총괄이 여러 명이라 기본 에이전트(main)만 총괄로 표시')
  }
  const planned = plannedFromWorkMap(workMapText)
  const roleText = agents.map(a => a.role + a.name).join(' ')
  const filtered = planned.filter(p => !p.title.split(/\s+/).some(w => w.length >= 2 && roleText.includes(w)))
  if (filtered.length !== planned.length) notes.push(`이미 맡은 직원이 있어 보이는 후보 ${planned.length - filtered.length}개 제외`)
  if (!workMapText) notes.push('업무 지도가 없어 채용 예정 후보를 못 뽑음 — 사용자에게 2~3개를 묻는다')
  return {
    company: company || `${owner ? owner + '의 ' : ''}AI 오피스`,
    owner: owner || '',
    tagline: tagline || '',
    departments: [],
    agents,
    planned: filtered,
    notes,
  }
}

const isMain = process.argv[1] && path.resolve(process.argv[1]) === new URL(import.meta.url).pathname
if (isMain) {
  const opts = parseArgs(process.argv.slice(2))
  const agentsList = loadAgentsList(opts)
  const team = readTeam(opts.team)
  const workMapText = opts.workMap && fs.existsSync(opts.workMap) ? readText(opts.workMap) : ''
  const org = buildOrg({ agentsList, team, workMapText, company: opts.company, owner: opts.owner, tagline: opts.tagline })
  const json = JSON.stringify(org, null, 2)
  if (opts.out) { fs.mkdirSync(path.dirname(opts.out), { recursive: true }); fs.writeFileSync(opts.out, json) }
  process.stdout.write(json + '\n')
}
