import { test } from 'node:test'
import assert from 'node:assert/strict'
import { renderOffice, renderWidget, renderStandalone, assignSeats, normalizeOrg, STYLES, STAGES } from '../skill/virtual-office/scripts/lib/render.mjs'

const org = {
  company: '꽃집 AI 오피스', owner: '사장님', tagline: '꽃이 늦지 않게',
  agents: [
    { id: 'main', name: '루미', emoji: '🌟', role: '총괄', coordinator: true, status: 'working', level: 3, bubble: '오늘 픽업 2건' },
    { id: 'flora', name: '플로라', emoji: '💐', role: '예약 꽃다발' },
  ],
  planned: [{ title: '단골 기념일', reason: '업무 지도 · 위임 희망도 4', emoji: '🎁' }, '리뷰 답글'],
}

test('every style × stage renders, seats everyone, stays under the widget limit, no external URLs', () => {
  for (const style of Object.keys(STYLES)) for (const stage of Object.keys(STAGES)) {
    const { svg, stats } = renderOffice(org, { style, stage })
    assert.equal(stats.agents, 2, `${style}/${stage} agents`)
    assert.equal(stats.planned, 2, `${style}/${stage} planned`)
    assert.equal(stats.desks, STAGES[stage].pods.length * 4)
    assert.equal(stats.empty, stats.desks - 4)
    assert.ok(svg.includes('루미 · 총괄'))
    assert.ok(svg.includes('채용 예정 · 단골 기념일'))
    assert.ok(svg.includes('채용 예정 · 리뷰 답글'))
    assert.ok(svg.includes('오늘 픽업 2건'))
    assert.ok(!/https?:\/\//.test(svg), 'no external url')
    const { html } = renderWidget(org, { style, stage })
    assert.ok(html.length <= 60000, `${style}/${stage} widget ${html.length} chars`)
    assert.ok(html.includes('dashboard:ready') && html.includes('dashboard:height'))
    assert.ok(!/<(script|link|img|iframe)[^>]+(src|href)\s*=\s*["']?https?:/i.test(html))
  }
})

test('coordinator sits first; agents before planned before empty', () => {
  const seats = assignSeats(normalizeOrg({ agents: [{ id: 'b', name: 'B' }, { id: 'a', name: 'A', coordinator: true }], planned: ['X'] }), STAGES.studio)
  assert.deepEqual(seats.map(s => s.kind), ['agent', 'agent', 'planned', 'empty'])
  assert.equal(seats[0].agent.id, 'a')
})

test('first agent becomes coordinator when none is marked; text is escaped', () => {
  const n = normalizeOrg({ agents: [{ id: 'x', name: '<b>해킹</b>' }] })
  assert.equal(n.agents[0].coordinator, true)
  const { svg } = renderOffice(n, {})
  assert.ok(svg.includes('&lt;b&gt;해킹'))
  assert.ok(!svg.includes('<b>해킹'))
})

test('hq shows department labels; standalone has a title', () => {
  const { svg } = renderOffice({ ...org, departments: ['콘텐츠', '운영'] }, { stage: 'hq' })
  assert.ok(svg.includes('>콘텐츠<') && svg.includes('>운영<'))
  const { html } = renderStandalone(org, { style: 'glass', stage: 'studio' })
  assert.ok(html.includes('<title>꽃집 AI 오피스 — 가상 오피스</title>'))
})

test('unknown style/stage fall back to warm/floor', () => {
  const out = renderOffice(org, { style: 'nope', stage: 'nope' })
  assert.equal(out.style, 'warm'); assert.equal(out.stage, 'floor')
})
