// 가상 오피스 라이브 엔진 — 배경 그림 + 앵커(stage-map) + 조직(org) → 직원들이 책상에서 일하고, 걷고, 커피 마시고, 회의하고, 총괄에게 전달한다.
// 의존성 없음. 대시보드 위젯/독립 페이지가 같이 쓴다. 외부 통신 없음(대시보드가 postMessage 로 주는 기록만 선택적으로 반영).
(function () {
  const ORG = window.OFFICE_ORG
  const MAP = window.OFFICE_MAP
  const stage = document.getElementById('stage')
  const actorsEl = document.getElementById('actors')
  const spotsEl = document.getElementById('spots')
  const logEl = document.getElementById('log')
  const rosterEl = document.getElementById('roster')
  const rnd = (a, b) => a + Math.random() * (b - a)
  const pick = arr => arr[Math.floor(Math.random() * arr.length)]
  const sleep = ms => new Promise(r => setTimeout(r, ms))
  let speed = 1
  let doneCount = 0
  const minute = () => { const d = new Date(); return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}` }

  // ── 크기: 무대 폭에 따라 글자·캐릭터 크기 ──
  function fit() {
    const w = stage.clientWidth
    document.documentElement.style.setProperty('--fs', `${Math.max(9, w * 0.0088)}px`)
    stage.style.setProperty('--sh', `${w * 0.082}px`)
  }
  addEventListener('resize', fit); fit()

  // ── 장소 라벨 ──
  for (const [key, spot] of Object.entries(MAP.spots)) {
    if (!spot.label) continue
    const el = document.createElement('div'); el.className = 'spot-label'; el.textContent = spot.label
    el.style.left = `${spot.x}%`; el.style.top = `${spot.y + 3}%`
    spotsEl.appendChild(el)
  }

  // ── 좌석 배정: 총괄 → 책상 앞자리 → 뒷자리, 채용 예정은 남는 자리 ──
  const front = MAP.seats.filter(s => s.kind === 'front')
  const back = MAP.seats.filter(s => s.kind === 'back')
  const order = [...front, ...back]
  const agents = [...ORG.agents].sort((a, b) => (b.coordinator === true) - (a.coordinator === true))
  // 총괄은 가운데 위 포드 앞자리(T1)로
  const leaderSeat = order.find(s => s.id === 'T2') || order[0]
  const rest = order.filter(s => s !== leaderSeat)
  const actors = []
  agents.forEach((a, i) => actors.push(makeActor(a, i === 0 ? leaderSeat : rest.shift(), false)))
  ;(ORG.planned || []).forEach(p => { const seat = rest.shift(); if (seat) actors.push(makeActor({ id: `planned-${p.title}`, name: `채용 예정 · ${p.title}`, role: p.reason || '', sprite: p.sprite || 'coffee', tasks: [] }, seat, true)) })

  function makeActor(a, seat, ghost) {
    const el = document.createElement('div'); el.className = 'actor' + (ghost ? ' ghost' : '')
    el.innerHTML = `<div class="body"><div class="nametag"><b></b><small></small></div><div class="bubble"></div><img class="sprite" alt=""></div>`
    el.querySelector('img').src = `chars/${a.sprite}.png`
    el.querySelector('b').textContent = ghost ? a.name : `${a.name} · ${a.role}`
    actorsEl.appendChild(el)
    const actor = { a, seat, ghost, el, x: seat.x, y: seat.y, busy: false, status: '대기', bubbleTimer: null, lv: 1 + Math.floor(rnd(0, 9)) }
    place(actor, seat.x, seat.y)
    if (!ghost) { el.classList.add('typing'); if (seat.kind === 'back') el.classList.add('sit') }
    else { if (seat.kind === 'back') el.classList.add('sit'); setStatus(actor, '업무 지도에서 뽑은 자리') }
    if (!ghost) setStatus(actor, '작업 중')
    return actor
  }
  function place(actor, x, y) {
    actor.x = x; actor.y = y
    actor.el.style.left = `${x}%`; actor.el.style.top = `${y}%`
    actor.el.style.zIndex = String(100 + Math.round(y * 10))
    actor.el.style.setProperty('--s', (0.62 + 0.5 * (y / 100)).toFixed(3))
  }
  function setStatus(actor, text) {
    actor.status = text
    const small = actor.el.querySelector('.nametag small')
    small.textContent = actor.ghost ? text : `${text} · Lv.${actor.lv}`
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

  // ── 이동 ──
  async function walkTo(actor, x, y) {
    const dx = x - actor.x, dy = y - actor.y
    const dist = Math.hypot(dx * 1.5, dy) // 가로가 더 넓은 무대 보정
    const dur = Math.max(0.6, dist / 22) / speed
    actor.el.classList.remove('typing', 'sit'); actor.el.classList.add('walk')
    actor.el.classList.toggle('flip', dx < 0)
    actor.el.style.setProperty('--dur', `${dur}s`)
    // 살짝 아래로 나왔다가 가는 느낌: 바로 목적지로
    place(actor, x, y)
    await sleep(dur * 1000 + 60)
    actor.el.classList.remove('walk')
  }
  async function goHome(actor) {
    setStatus(actor, '이동 중')
    await walkTo(actor, actor.seat.x, actor.seat.y)
    actor.el.classList.remove('flip')
    if (actor.seat.kind === 'back') actor.el.classList.add('sit')
    actor.el.classList.add('typing')
    setStatus(actor, '작업 중')
  }

  // ── 활동 ──
  const taken = new Set() // 점유 중인 장소
  const claim = key => { if (taken.has(key)) return false; taken.add(key); return true }
  const free = key => taken.delete(key)
  const leader = actors[0]
  const workers = actors.filter(a => !a.ghost && a !== leader)

  const activities = {
    async coffee(actor) {
      if (!claim('coffee')) return false
      setStatus(actor, '이동 중'); log(`${actor.a.name} · 커피 타러 감`)
      await walkTo(actor, MAP.spots.coffee.x, MAP.spots.coffee.y)
      setStatus(actor, '커피 ☕'); say(actor, pick(['☕ 한 잔', '당 충전', '라떼로']), { soft: true })
      await sleep(rnd(2600, 4200) / speed)
      free('coffee'); await goHome(actor); return true
    },
    async board(actor) {
      if (!claim('board')) return false
      setStatus(actor, '이동 중'); log(`${actor.a.name} · 화이트보드에 메모`)
      await walkTo(actor, MAP.spots.board.x, MAP.spots.board.y)
      setStatus(actor, '정리 중'); say(actor, pick(['📌 이번 주 할 일', '우선순위 정리', '아이디어 3개']), { soft: true })
      await sleep(rnd(2400, 3800) / speed)
      free('board'); await goHome(actor); return true
    },
    async lounge(actor) {
      const idx = [0, 1].find(i => !taken.has(`lounge${i}`)); if (idx === undefined) return false
      claim(`lounge${idx}`); const p = MAP.spots.lounge[idx]
      setStatus(actor, '이동 중'); log(`${actor.a.name} · 라운지에서 잠깐 휴식`)
      await walkTo(actor, p.x, p.y)
      setStatus(actor, '휴식'); say(actor, pick(['잠깐 쉬고…', '🌿', '5분만']), { soft: true })
      await sleep(rnd(3500, 6000) / speed)
      free(`lounge${idx}`); await goHome(actor); return true
    },
    async deliver(actor) {
      if (!claim('leader')) return false
      const task = pick(actor.a.tasks || ['작업'])
      setStatus(actor, '이동 중'); log(`${actor.a.name} → 지혜 · 「${task}」 전달`)
      say(actor, `📄 ${task}`)
      await walkTo(actor, leader.x + 4.2, leader.y + 1.2)
      setStatus(actor, '전달 중'); say(actor, '완료했어요!')
      await sleep(900 / speed)
      say(leader, pick(['👍 좋아요', '확인!', '검수 통과']), {}); leader.el.classList.add('cheer')
      doneCount += 1; actor.lv += Math.random() < 0.3 ? 1 : 0; sparks(actor); updateStats()
      await sleep(1400 / speed); leader.el.classList.remove('cheer')
      free('leader'); await goHome(actor); return true
    },
    async meeting(actor) {
      // 3명이 회의 테이블로
      const others = workers.filter(w => w !== actor && !w.busy).slice(0, 2)
      if (others.length < 2 || !claim('meeting')) return false
      const group = [actor, ...others]; group.forEach(g => { g.busy = true })
      log(`${group.map(g => g.a.name).join('·')} · 회의 테이블에서 짧은 회의`)
      await Promise.all(group.map((g, i) => { setStatus(g, '이동 중'); return walkTo(g, MAP.spots.meeting[i].x, MAP.spots.meeting[i].y) }))
      group.forEach(g => setStatus(g, '회의 중'))
      const lines = ['이번 주 목표는?', '제가 초안 쓸게요', '검수는 세라가', '목요일 발표 순서', '좋아요, 그걸로']
      for (let i = 0; i < 4; i++) { say(pick(group), pick(lines), { soft: true }); await sleep(rnd(1100, 1700) / speed) }
      say(group[0], '결정! ✅'); await sleep(900 / speed)
      free('meeting')
      await Promise.all(group.map(g => goHome(g)))
      others.forEach(g => { g.busy = false }); return true
    },
    async chat(actor) {
      const other = pick(workers.filter(w => w !== actor && !w.busy)); if (!other) return false
      other.busy = true
      const mx = (actor.seat.x + other.seat.x) / 2, my = Math.max(actor.seat.y, other.seat.y) + 4
      log(`${actor.a.name} · ${other.a.name}에게 잠깐 물어봄`)
      setStatus(actor, '이동 중'); await walkTo(actor, mx - 2.2, my)
      actor.el.classList.remove('flip'); other.el.classList.add('flip')
      setStatus(actor, '대화 중'); setStatus(other, '대화 중')
      say(actor, pick(['이거 어떻게 봐요?', '잠깐만요!', '링크 좀 줘요']), { soft: true }); await sleep(1300 / speed)
      say(other, pick(['오 좋은데요', '이렇게 해봐요', '👌']), { soft: true }); await sleep(1300 / speed)
      other.el.classList.remove('flip'); setStatus(other, '작업 중'); other.busy = false
      await goHome(actor); return true
    },
    async type(actor) {
      say(actor, pick(actor.a.tasks || ['작업 중']), { soft: true, ms: 3200 })
      await sleep(3400 / speed); return true
    },
  }
  const weights = [['type', 5], ['coffee', 2], ['deliver', 3], ['chat', 2], ['board', 1], ['lounge', 1.2], ['meeting', 1]]
  function pickActivity() { const total = weights.reduce((s, w) => s + w[1], 0); let r = Math.random() * total; for (const [k, w] of weights) { r -= w; if (r <= 0) return k } return 'type' }

  async function loop(actor, delay) {
    await sleep(delay)
    for (;;) {
      if (!actor.busy) {
        actor.busy = true
        try { await activities[pickActivity()](actor) } catch (e) { console.warn(e) }
        actor.busy = false
      }
      await sleep(rnd(1800, 5200) / speed)
    }
  }
  workers.forEach((w, i) => loop(w, 800 + i * 1400))
  ;(async () => { for (;;) { await sleep(rnd(6000, 11000) / speed); if (!leader.busy) say(leader, pick(leader.a.tasks), { soft: true }) } })()

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
      li.innerHTML = `<img src="chars/${a.a.sprite}.png" alt=""><span></span><span class="st"></span>`
      li.children[1].textContent = a.ghost ? a.a.name : `${a.a.name} · ${a.a.role}`
      const st = li.children[2]; st.textContent = a.ghost ? '빈 책상' : a.status; st.classList.toggle('on', !a.ghost && a.status !== '대기')
      rosterEl.appendChild(li)
    }
    updateStats()
  }
  renderRoster()
  document.getElementById('hudTitle').textContent = `${ORG.company}${ORG.owner ? ' · ' + ORG.owner : ''}`
  document.getElementById('hudSub').textContent = `직원 ${ORG.agents.length} · 채용 예정 ${(ORG.planned || []).length} · 책상 ${MAP.seats.length}`
  document.getElementById('hudTag').textContent = ORG.tagline || ''
  setInterval(() => { document.getElementById('clock').textContent = minute() }, 1000); document.getElementById('clock').textContent = minute()

  // ── 컨트롤 ──
  document.getElementById('ctl').addEventListener('click', e => {
    const b = e.target.closest('button'); if (!b) return
    if (b.dataset.style) {
      document.documentElement.dataset.style = b.dataset.style
      document.getElementById('bg').src = `bg/${b.dataset.style}.jpg`
      for (const x of b.parentElement.querySelectorAll('[data-style]')) x.setAttribute('aria-pressed', String(x === b))
      try { localStorage.setItem('vo-style', b.dataset.style) } catch {}
    }
    if (b.dataset.speed) { speed = Number(b.dataset.speed); for (const x of b.parentElement.querySelectorAll('[data-speed]')) x.setAttribute('aria-pressed', String(x === b)) }
  })
  try { const q = new URLSearchParams(location.search).get('style'); const s = q || localStorage.getItem('vo-style'); if (s) document.querySelector(`[data-style="${s}"]`)?.click() } catch {}
  log('오피스 문 열림 · 오늘도 시작')
})()
