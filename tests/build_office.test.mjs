import { test } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { spawnSync } from 'node:child_process'

const here = path.dirname(new URL(import.meta.url).pathname)
const script = path.join(here, '..', 'skill', 'virtual-office', 'scripts', 'build_office.mjs')
const sample = path.join(here, '..', 'samples', 'macmini-org.json')
const KEYS = ['diorama', 'saas', 'rpg', 'control', 'building']

test('--list prints the five templates in order', () => {
  const res = spawnSync(process.execPath, [script, '--list'], { encoding: 'utf8' })
  assert.equal(res.status, 0)
  const list = JSON.parse(res.stdout)
  assert.deepEqual(list.map(t => t.key), KEYS)
  assert.deepEqual(list.map(t => t.no), [1, 2, 3, 4, 5])
})

test('templates folder is in sync with web/', () => {
  for (const f of [...KEYS.map(k => `${k}.html`), 'engine.js', 'engine.css', 'maps.js', 'maps-v3.js']) {
    assert.equal(fs.readFileSync(path.join(here, '..', 'web', f), 'utf8'), fs.readFileSync(path.join(here, '..', 'skill', 'virtual-office', 'templates', f), 'utf8'), `${f} differs — run scripts/sync_templates.mjs`)
  }
})

test('every template builds a small CDN-backed widget and a standalone page with the org inlined', () => {
  const out = fs.mkdtempSync(path.join(process.env.TMPDIR || '/tmp', 'vo-build-'))
  for (const key of KEYS) {
    const res = spawnSync(process.execPath, [script, '--org', sample, '--template', key, '--out', path.join(out, key)], { encoding: 'utf8' })
    assert.equal(res.status, 0, res.stdout + res.stderr)
    const r = JSON.parse(res.stdout)
    assert.equal(r.ok, true); assert.equal(r.template, key)
    const widget = fs.readFileSync(r.files.widget, 'utf8'); const office = fs.readFileSync(r.files.office, 'utf8')
    assert.ok(widget.length < 20000, `${key} widget ${widget.length}`)
    assert.ok(r.allowWindowsEstimate <= 4)
    assert.ok(widget.includes('window.OFFICE_ORG=') && widget.includes('"지혜"'))
    assert.ok(widget.includes('cdn.jsdelivr.net/gh/IrumHahn/openclaw-virtual-office@main/web/engine.js'))
    assert.ok(widget.includes("classList.add('embed')") && widget.includes('dashboard:ready'))
    assert.ok(!widget.includes('src="bg/') && !widget.includes("'chars/"), 'no relative assets left')
    assert.ok(office.includes('window.OfficeEngine') && !office.includes('web/engine.js'), 'standalone inlines the engine')
    assert.ok(!/src="(org|engine|maps[^"]*)\.js"/.test(widget) && !/src="(org|engine|maps[^"]*)\.js"/.test(office))
  }
})

test('custom --cdn and unknown template', () => {
  const out = fs.mkdtempSync(path.join(process.env.TMPDIR || '/tmp', 'vo-build-'))
  const res = spawnSync(process.execPath, [script, '--org', sample, '--template', 'rpg', '--out', out, '--cdn', 'http://127.0.0.1:9999/web'], { encoding: 'utf8' })
  assert.equal(res.status, 0)
  assert.ok(fs.readFileSync(path.join(out, 'widget.html'), 'utf8').includes('http://127.0.0.1:9999/web/bg/pixel.png'))
  const bad = spawnSync(process.execPath, [script, '--org', sample, '--template', 'rainbow'], { encoding: 'utf8' })
  assert.notEqual(bad.status, 0); assert.equal(JSON.parse(bad.stdout).ok, false)
})

test('refuses an org with a secret', () => {
  const tmp = fs.mkdtempSync(path.join(process.env.TMPDIR || '/tmp', 'vo-'))
  const bad = path.join(tmp, 'org.json'); fs.writeFileSync(bad, JSON.stringify({ company: 'x', agents: [{ id: 'a', name: 'A', tasks: ['api_key: sk-abcdef123456'] }] }))
  const res = spawnSync(process.execPath, [script, '--org', bad, '--template', 'saas', '--out', tmp], { encoding: 'utf8' })
  assert.equal(res.status, 3)
})
