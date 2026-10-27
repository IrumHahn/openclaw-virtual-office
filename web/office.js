// 가상 오피스 라이브 엔진 v2 — 컨셉(배경+캐릭터 세트+맵) 위에서 직원들이 통로만 따라 걷고(책상 위 금지),
// 방향(정면·측면·뒷면)에 맞는 스프라이트로 움직이며, 책상에서 일하고, 커피 마시고, 회의하고, 총괄에게 전달한다.
// 의존성 없음. 외부 통신 없음.
(function () {
  const ORG = window.OFFICE_ORG
  const CONCEPTS = window.OFFICE_CONCEPTS
  const MAPS = window.OFFICE_MAPS
  const stage = document.getElementById('stage')
  const actorsEl = document.getElementById('actors')
  const spotsEl = document.getElementById('spots')
  const logEl = document.getElementById('log')
  const rosterEl = document.getElementById('roster')
  const rnd = (a, b) => a + Math.random() * (b - a)
  const pick = arr => arr[Math.floor(Math.random() * arr.length)]
  const sleep = ms => new Promise(r => setTimeout(r, ms))
  const minute = () => { const d = new Date(); return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}` }
  let speed = 1, doneCount = 0, epoch = 0
  let concept = null, MAP = null
  let actors = [], workers = [], leader = null
  const taken = new Set()

  function fit() {
    const w = stage.clientWidth
    document.documentElement.style.setProperty('--fs', `${Math.max(9, w * 0.0088)}px`)
    stage.style.setProperty('--sh', `${w * (concept?.spriteScale || 0.082)}px`)
  }
  addEventListener('resize', fit)

  // ── 통로 그래프 ──
  function buildGraph(map) {
    const adj = {}
    for (const id of Object.keys(map.nodes)) adj[id] = []
    for (const [a, b] of map.edges) { adj[a].push(b); adj[b].push(a) }
    return adj
  }
  function pathBetween(adj, from, to) {
    if (from === to) return [to]
    const prev = { [from]: null }; const q = [from]
    while (q.length) {
      const cur = q.shift()
      for (const nx of adj[cur]) if (!(nx in prev)) { prev[nx] = cur; if (nx === to) { const p = [to]; let c = to; while (prev[c]) { c = prev[c]; p.unshift(c) } return p } q.push(nx) }
    }
    return [to]
  }

  // ── 배우 ──
  function makeActor(a, seat, ghost) {
    const el = document.createElement('div'); el.className = 'actor' + (ghost ? ' ghost' : '')
    el.innerHTML = `<div class="body"><div class="nametag"><b></b><small></small></div><div class="bubble"></div><img class="sprite" alt="" draggable="false"></div>`
    el.querySelector('b').textContent = ghost ? a.name : `${a.name} · ${a.role}`
    actorsEl.appendChild(el)
    const actor = { a, seat, ghost, el, img: el.querySelector('img'), x: seat.x, y: seat.y, node: seat.node, busy: false, status: '대기', bubbleTimer: null, lv: 1 + Math.floor(rnd(0, 9)), view: 'front' }
    setView(actor, seat.view || 'front', false)
    place(actor, seat.x, seat.y)
    setStatus(actor, ghost ? '업무 지도에서 뽑은 자리' : '작업 중')
    if (!ghost) el.classList.add('typing')
    return actor
  }
  function setView(actor, view, flip) {
    const src = `${concept.chars}/${actor.a.sprite}-${view}.png`
    if (actor.img.getAttribute('src') !== src) actor.img.src = src
    actor.view = view
    actor.el.classList.toggle('flip', !!flip)
  }
  function place(actor, x, y) {
    actor.x = x; actor.y = y
    actor.el.style.left = `${x}%`; actor.el.style.top = `${y}%`
    actor.el.style.zIndex = String(100 + Math.round(y * 10))
    actor.el.style.setProperty('--s', MAP.flat ? '1' : (0.64 + 0.5 * (y / 100)).toFixed(3))
  }
  function setStatus(actor, text) {
    actor.status = text
    actor.el.querySelector('.nametag small').textContent = actor.ghost ? text : `${text} · Lv.${actor.lv}`
    renderRoster()
  }
  function say(actor, text, { soft = false, ms = 2600 } = {}) {
    const b = actor.el.querySelector('.bubble')
    b.textContent = text; b.classList.toggle('soft', soft); b.classList.add('on')
    clearTimeout(actor.bubbleTimer)
    actor.bubbleTimer = setTimeout(() => b.classList.remove('on'), ms / speed)
  }
  function log(text) {
    const li = document.createElement('li'); li.innerHTML = `<time>${minute()}</time><span></span>`; li.lastChild.textContent = text
    logEl.prepend(li); while (logEl.children.length > 30) logEl.lastChild.remove()
  }
  function sparks(actor) {
    const rect = actor.el.getBoundingClientRect(); const srect = stage.getBoundingClientRect()
    const colors = ['#ffd86b', '#f9a8c9', '#9ad0f5', '#b5e3a1', '#ffb088']
    for (let i = 0; i < 14; i++) {
      const s = document.createElement('div'); s.className = 'spark'; s.style.background = pick(colors)
      s.style.left = `${rect.left - srect.left}px`; s.style.top = `${rect.top - srect.top - stage.clientWidth * 0.06}px`
      s.style.setProperty('--dx', `${rnd(-60, 60)}px`); s.style.setProperty('--dy', `${rnd(-90, 10)}px`)
      s.style.zIndex = '999'; stage.appendChild(s); setTimeout(() => s.remove(), 1000)
    }
  }

  // ── 이동: 한 구간 ──
  async function step(actor, x, y, myEpoch) {
    const dx = x - actor.x, dy = y - actor.y
    const dist = Math.hypot(dx * 1.5, dy)
    if (dist < 0.3) return
    const dur = Math.max(0.35, dist / 20) / speed
    // 방향: 가로 이동이 크면 측면(오른쪽 기준, 왼쪽은 반전), 위로 가면 뒷모습, 아래로 가면 정면
    if (Math.abs(dx) > Math.abs(dy) * 1.15) setView(actor, 'side', dx < 0)
    else setView(actor, dy < 0 ? 'back' : 'front', false)
    actor.el.classList.remove('typing'); actor.el.classList.add('walk')
    actor.el.style.setProperty('--dur', `${dur}s`)
    place(actor, x, y)
    await sleep(dur * 1000 + 40)
    if (myEpoch !== epoch) throw new Error('reset')
  }
  // 통로 그래프를 따라 목적지(x,y,node)까지
  async function walkTo(actor, target, myEpoch) {
    const adj = MAP.adj
    const path = pathBetween(adj, actor.node, target.node)
    // 자리에서 통로로 나가기
    for (const id of path) { const [nx, ny] = MAP.nodes[id]; await step(actor, nx, ny, myEpoch); actor.node = id }
    await step(actor, target.x, target.y, myEpoch)
    actor.el.classList.remove('walk')
  }
  async function goHome(actor, myEpoch) {
    setStatus(actor, '이동 중')
    await walkTo(actor, actor.seat, myEpoch)
    setView(actor, actor.seat.view || 'front', false)
    actor.el.classList.add('typing')
    setStatus(actor, '작업 중')
  }
  const claim = key => { if (taken.has(key)) return false; taken.add(key); return true }
  const free = key => taken.delete(key)

  // ── 활동 ──
  const activities = {
    async coffee(actor, e) {
      if (!claim('coffee')) return false
      try {
        setStatus(actor, '이동 중'); log(`${actor.a.name} · 커피 타러 감`)
        await walkTo(actor, MAP.spots.coffee, e)
        setView(actor, MAP.spots.coffee.view || 'back', false); setStatus(actor, '커피 ☕'); say(actor, pick(['☕ 한 잔', '당 충전', '라떼로']), { soft: true })
        await sleep(rnd(2600, 4200) / speed)
      } finally { free('coffee') }
      await goHome(actor, e); return true
    },
    async board(actor, e) {
      if (!claim('board')) return false
      try {
        setStatus(actor, '이동 중'); log(`${actor.a.name} · 화이트보드에 메모`)
        await walkTo(actor, MAP.spots.board, e)
        setView(actor, MAP.spots.board.view || 'back', false); setStatus(actor, '정리 중'); say(actor, pick(['📌 이번 주 할 일', '우선순위 정리', '아이디어 3개']), { soft: true })
        await sleep(rnd(2400, 3800) / speed)
      } finally { free('board') }
      await goHome(actor, e); return true
    },
    async lounge(actor, e) {
      const idx = MAP.spots.lounge.findIndex((_, i) => !taken.has(`lounge${i}`)); if (idx < 0) return false
      claim(`lounge${idx}`)
      try {
        setStatus(actor, '이동 중'); log(`${actor.a.name} · 라운지에서 잠깐 휴식`)
        await walkTo(actor, MAP.spots.lounge[idx], e)
        setView(actor, MAP.spots.lounge[idx].view || 'front', false); setStatus(actor, '휴식'); say(actor, pick(['잠깐 쉬고…', '🌿', '5분만']), { soft: true })
        await sleep(rnd(3500, 6000) / speed)
      } finally { free(`lounge${idx}`) }
      await goHome(actor, e); return true
    },
    async deliver(actor, e) {
      if (!claim('leader')) return false
      try {
        const task = pick(actor.a.tasks || ['작업'])
        setStatus(actor, '이동 중'); log(`${actor.a.name} → ${leader.a.name} · 「${task}」 전달`)
        say(actor, `📄 ${task}`)
        await walkTo(actor, MAP.spots.leaderFront, e)
        setView(actor, MAP.spots.leaderFront.view || 'back', false); setStatus(actor, '전달 중'); say(actor, '완료했어요!')
        await sleep(900 / speed)
        say(leader, pick(['👍 좋아요', '확인!', '검수 통과'])); leader.el.classList.add('cheer')
        doneCount += 1; if (Math.random() < 0.3) actor.lv += 1; sparks(actor); updateStats()
        await sleep(1400 / speed); leader.el.classList.remove('cheer')
      } finally { free('leader') }
      await goHome(actor, e); return true
    },
    async meeting(actor, e) {
      const others = workers.filter(w => w !== actor && !w.busy).slice(0, 2)
      if (others.length < 2 || !claim('meeting')) return false
      const group = [actor, ...others]; others.forEach(g => { g.busy = true })
      try {
        log(`${group.map(g => g.a.name).join('·')} · 회의 테이블에서 짧은 회의`)
        await Promise.all(group.map((g, i) => { setStatus(g, '이동 중'); return walkTo(g, MAP.spots.meeting[i], e) }))
        group.forEach((g, i) => { setView(g, MAP.spots.meeting[i].view || (i === 1 ? 'back' : 'front'), false); setStatus(g, '회의 중') })
        const lines = ['이번 주 목표는?', '제가 초안 쓸게요', '검수는 세라가', '목요일 발표 순서', '좋아요, 그걸로']
        for (let i = 0; i < 4; i++) { say(pick(group), pick(lines), { soft: true }); await sleep(rnd(1100, 1700) / speed) }
        say(group[0], '결정! ✅'); await sleep(900 / speed)
      } finally { free('meeting') }
      await Promise.all(group.map(g => goHome(g, e)))
      others.forEach(g => { g.busy = false }); return true
    },
    async chat(actor, e) {
      const other = pick(workers.filter(w => w !== actor && !w.busy)); if (!other) return false
      const spot = pick(MAP.spots.chat)
      other.busy = true
      try {
        log(`${actor.a.name} · ${other.a.name}에게 잠깐 물어봄`)
        setStatus(actor, '이동 중'); setStatus(other, '이동 중')
        await Promise.all([walkTo(actor, { x: spot.x - 2.5, y: spot.y, node: spot.node }, e), walkTo(other, { x: spot.x + 2.5, y: spot.y, node: spot.node }, e)])
        setView(actor, 'side', false); setView(other, 'side', true)
        setStatus(actor, '대화 중'); setStatus(other, '대화 중')
        say(actor, pick(['이거 어떻게 봐요?', '잠깐만요!', '링크 좀 줘요']), { soft: true }); await sleep(1300 / speed)
        say(other, pick(['오 좋은데요', '이렇게 해봐요', '👌']), { soft: true }); await sleep(1300 / speed)
      } finally { other.busy = false }
      await Promise.all([goHome(actor, e), goHome(other, e)]); return true
    },
    async type(actor, e) {
      say(actor, pick(actor.a.tasks || ['작업 중']), { soft: true, ms: 3200 })
      await sleep(3400 / speed); return true
    },
  }
  const weights = [['type', 5], ['coffee', 2], ['deliver', 3], ['chat', 2], ['board', 1], ['lounge', 1.2], ['meeting', 1]]
  function pickActivity() { const total = weights.reduce((s, w) => s + w[1], 0); let r = Math.random() * total; for (const [k, w] of weights) { r -= w; if (r <= 0) return k } return 'type' }
  async function loop(actor, delay, myEpoch) {
    await sleep(delay)
    while (myEpoch === epoch) {
      if (!actor.busy) {
        actor.busy = true
        try { await activities[pickActivity()](actor, myEpoch) } catch (err) { if (err.message !== 'reset') console.warn(err) }
        actor.busy = false
      }
      await sleep(rnd(1800, 5200) / speed)
    }
  }

  // ── 패널 ──
  function updateStats() {
    const st = actors.filter(a => !a.ghost).map(a => a.status)
    document.getElementById('sWork').textContent = st.filter(s => s === '작업 중' || s === '정리 중' || s === '전달 중').length
    document.getElementById('sMeet').textContent = st.filter(s => s === '회의 중' || s === '대화 중').length
    document.getElementById('sBreak').textContent = st.filter(s => s === '휴식' || s === '커피 ☕').length
    document.getElementById('sDone').textContent = doneCount
  }
  function renderRoster() {
    rosterEl.innerHTML = ''
    for (const a of actors) {
      const li = document.createElement('li')
      li.innerHTML = `<img alt=""><span></span><span class="st"></span>`
      li.children[0].src = `${concept.chars}/${a.a.sprite}-front.png`
      li.children[1].textContent = a.ghost ? a.a.name : `${a.a.name} · ${a.a.role}`
      const st = li.children[2]; st.textContent = a.ghost ? '빈 책상' : a.status; st.classList.toggle('on', !a.ghost && a.status !== '대기')
      rosterEl.appendChild(li)
    }
    updateStats()
  }

  // ── 컨셉 적용 ──
  function applyConcept(key) {
    concept = CONCEPTS[key] || CONCEPTS.knit
    MAP = MAPS[concept.map]; MAP.adj = buildGraph(MAP)
    epoch += 1; const myEpoch = epoch
    taken.clear()
    document.documentElement.dataset.theme = concept.theme
    document.documentElement.dataset.concept = key
    stage.classList.toggle('pixel', !!concept.pixel)
    document.getElementById('bg').src = concept.bg
    for (const b of document.querySelectorAll('[data-concept]')) b.setAttribute('aria-pressed', String(b.dataset.concept === key))
    actorsEl.innerHTML = ''; spotsEl.innerHTML = ''
    for (const lab of MAP.labels || []) { const el = document.createElement('div'); el.className = 'spot-label'; el.textContent = lab.text; el.style.left = `${lab.x}%`; el.style.top = `${lab.y}%`; spotsEl.appendChild(el) }
    for (const [k, sp] of Object.entries(MAP.spots)) { if (!sp.label) continue; const el = document.createElement('div'); el.className = 'spot-label'; el.textContent = sp.label; el.style.left = `${sp.x}%`; el.style.top = `${sp.y + 3}%`; spotsEl.appendChild(el) }
    fit()
    const seats = [...MAP.seats]
    const leaderSeat = seats.find(s => s.leader) || seats[0]
    const rest = seats.filter(s => s !== leaderSeat)
    const agents = [...ORG.agents].sort((a, b) => (b.coordinator === true) - (a.coordinator === true))
    actors = []
    agents.forEach((a, i) => { const seat = i === 0 ? leaderSeat : rest.shift(); if (seat) actors.push(makeActor(a, seat, false)) })
    ;(ORG.planned || []).forEach(p => { const seat = rest.shift(); if (seat) actors.push(makeActor({ id: `planned-${p.title}`, name: `채용 예정 · ${p.title}`, role: p.reason || '', sprite: p.sprite || 'coffee', tasks: [] }, seat, true)) })
    leader = actors[0]; workers = actors.filter(a => !a.ghost && a !== leader)
    renderRoster()
    workers.forEach((w, i) => loop(w, 800 + i * 1400, myEpoch))
    ;(async () => { while (myEpoch === epoch) { await sleep(rnd(6000, 11000) / speed); if (myEpoch === epoch && !leader.busy) say(leader, pick(leader.a.tasks), { soft: true }) } })()
    log(`${concept.label} 오피스로 이동 · 오늘도 시작`)
    try { localStorage.setItem('vo-concept', key) } catch {}
  }

  document.getElementById('hudTitle').textContent = `${ORG.company}${ORG.owner ? ' · ' + ORG.owner : ''}`
  document.getElementById('hudSub').textContent = `직원 ${ORG.agents.length} · 채용 예정 ${(ORG.planned || []).length}`
  document.getElementById('hudTag').textContent = ORG.tagline || ''
  setInterval(() => { document.getElementById('clock').textContent = minute() }, 1000); document.getElementById('clock').textContent = minute()
  const ctl = document.getElementById('ctl')
  for (const [key, c] of Object.entries(CONCEPTS)) { const b = document.createElement('button'); b.type = 'button'; b.dataset.concept = key; b.innerHTML = `<span></span><small></small>`; b.firstChild.textContent = c.label; b.lastChild.textContent = c.desc; ctl.querySelector('.concepts').appendChild(b) }
  ctl.addEventListener('click', e => {
    const b = e.target.closest('button'); if (!b) return
    if (b.dataset.concept) applyConcept(b.dataset.concept)
    if (b.dataset.speed) { speed = Number(b.dataset.speed); for (const x of ctl.querySelectorAll('[data-speed]')) x.setAttribute('aria-pressed', String(x === b)) }
  })
  document.getElementById('fsBtn').addEventListener('click', () => { if (document.fullscreenElement) document.exitFullscreen(); else stage.requestFullscreen?.() })
  stage.addEventListener('fullscreenchange', fit)
  let start = 'knit'
  try { start = new URLSearchParams(location.search).get('concept') || localStorage.getItem('vo-concept') || 'knit' } catch {}
  applyConcept(CONCEPTS[start] ? start : 'knit')
})()
