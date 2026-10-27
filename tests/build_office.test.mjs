import { test } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { spawnSync } from 'node:child_process'

const here = path.dirname(new URL(import.meta.url).pathname)
const script = path.join(here, '..', 'skill', 'virtual-office', 'scripts', 'build_office.mjs')
const sample = path.join(here, '..', 'samples', 'macmini-org.json')

test('--list prints 4 styles and 3 stages', () => {
  const res = spawnSync(process.execPath, [script, '--list'], { encoding: 'utf8' })
  assert.equal(res.status, 0)
  const opts = JSON.parse(res.stdout)
  assert.deepEqual(opts.styles.map(s => s.key), ['warm', 'glass', 'pixel', 'night'])
  assert.deepEqual(opts.stages.map(s => [s.key, s.desks]), [['studio', 4], ['floor', 12], ['hq', 20]])
})

test('builds widget.html + office.html for the mac mini sample and reports allow-window estimate', () => {
  const out = fs.mkdtempSync(path.join(process.env.TMPDIR || '/tmp', 'vo-build-'))
  const res = spawnSync(process.execPath, [script, '--org', sample, '--style', 'night', '--stage', 'floor', '--out', out], { encoding: 'utf8' })
  assert.equal(res.status, 0, res.stdout + res.stderr)
  const r = JSON.parse(res.stdout)
  assert.equal(r.ok, true); assert.equal(r.stats.agents, 10); assert.equal(r.stats.planned, 2)
  assert.ok(fs.existsSync(r.files.widget) && fs.existsSync(r.files.office))
  assert.ok(r.widgetChars < 60000 && r.allowWindowsEstimate >= 1)
  const html = fs.readFileSync(r.files.widget, 'utf8')
  assert.ok(html.includes('지혜 · 총괄') && html.includes('채용 예정 · 수강생 응대'))
})

test('unknown style fails with JSON error', () => {
  const res = spawnSync(process.execPath, [script, '--org', sample, '--style', 'rainbow'], { encoding: 'utf8' })
  assert.notEqual(res.status, 0)
  assert.equal(JSON.parse(res.stdout).ok, false)
})
