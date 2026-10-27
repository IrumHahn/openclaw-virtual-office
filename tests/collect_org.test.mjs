import { test } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { spawnSync } from 'node:child_process'
import { plannedFromWorkMap, buildOrg, readTeam } from '../skill/virtual-office/scripts/collect_org.mjs'

const here = path.dirname(new URL(import.meta.url).pathname)
const fx = name => path.join(here, 'fixtures', name)
const script = path.join(here, '..', 'skill', 'virtual-office', 'scripts', 'collect_org.mjs')

test('work map → planned positions (top tasks, delegation ≥ 4, wish list), capped and deduped', () => {
  const planned = plannedFromWorkMap(fs.readFileSync(fx('my-work-map.md'), 'utf8'))
  const titles = planned.map(p => p.title)
  assert.deepEqual(titles, ['예약 꽃다발 관리', '단골 기념일 알림', '인스타 업로드', '월말 정산', '리뷰 답글', '재고 체크'])
  assert.ok(!titles.includes('꽃 디자인'), 'delegation 1 is not a position')
  assert.equal(planned.find(p => p.title === '월말 정산').emoji, '🧾')
  assert.deepEqual(plannedFromWorkMap(''), [])
})

test('buildOrg merges agents list + team.json and drops positions an agent already covers', () => {
  const agentsList = JSON.parse(fs.readFileSync(fx('agents-list.json'), 'utf8'))
  const team = readTeam(fx('team.json'))
  const org = buildOrg({ agentsList, team, workMapText: fs.readFileSync(fx('my-work-map.md'), 'utf8'), owner: '사장님' })
  assert.equal(org.company, '사장님의 AI 오피스')
  const main = org.agents.find(a => a.id === 'main')
  assert.equal(main.name, '루미'); assert.equal(main.coordinator, true); assert.equal(main.role, '총괄')
  const nova = org.agents.find(a => a.id === 'nova')
  assert.equal(nova.name, '노바'); assert.equal(nova.role, '리서치'); assert.equal(nova.coordinator, false)
  const flora = org.agents.find(a => a.id === 'flora')
  assert.equal(flora.emoji, '💐'); assert.equal(flora.role, '예약 꽃다발')
  assert.ok(!org.planned.some(p => p.title.includes('예약 꽃다발')), 'flora already owns bouquet work')
  assert.ok(org.planned.some(p => p.title === '월말 정산'))
  assert.ok(org.notes.some(n => n.includes('제외')))
})

test('CLI writes org.json from --agents-json and refuses secrets', () => {
  const tmp = fs.mkdtempSync(path.join(process.env.TMPDIR || '/tmp', 'vo-'))
  const out = path.join(tmp, 'org.json')
  const res = spawnSync(process.execPath, [script, '--agents-json', fx('agents-list.json'), '--team', fx('team.json'), '--work-map', fx('my-work-map.md'), '--company', '꽃집', '--out', out], { encoding: 'utf8' })
  assert.equal(res.status, 0, res.stderr)
  const org = JSON.parse(fs.readFileSync(out, 'utf8'))
  assert.equal(org.company, '꽃집'); assert.equal(org.agents.length, 3)
  const bad = path.join(tmp, 'bad.md')
  fs.writeFileSync(bad, '# 지도\n- api_key: sk-abcdef123456\n')
  const res2 = spawnSync(process.execPath, [script, '--agents-json', fx('agents-list.json'), '--work-map', bad], { encoding: 'utf8' })
  assert.equal(res2.status, 3)
})

test('CLI falls back to `openclaw agents list --json` (fake CLI)', () => {
  const tmp = fs.mkdtempSync(path.join(process.env.TMPDIR || '/tmp', 'vo-'))
  const res = spawnSync(process.execPath, [script, '--out', path.join(tmp, 'org.json')], { encoding: 'utf8', env: { ...process.env, OPENCLAW_BIN: path.join(here, 'fake-openclaw', 'openclaw'), OPENCLAW_STATE_DIR: tmp, FAKE_MAIN: 'persona' } })
  assert.equal(res.status, 0, res.stderr)
  const org = JSON.parse(res.stdout)
  assert.equal(org.agents[0].id, 'main'); assert.equal(org.agents[0].name, '드림'); assert.equal(org.agents[0].coordinator, true)
})
