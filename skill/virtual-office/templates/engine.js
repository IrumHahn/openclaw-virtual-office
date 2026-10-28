// 가상 오피스 공용 엔진 — 배우(직원) 생성, 통로 그래프 보행, 방향별 스프라이트, 활동(타이핑·커피·회의·전달…).
// 컨셉 페이지마다 화면(크롬·패널·카메라)은 다르고, 이 엔진만 같이 쓴다. 의존성 없음. 외부 통신 없음.
window.OfficeEngine = (function () {
  const rnd = (a, b) => a + Math.random() * (b - a)
  const pick = arr => arr[Math.floor(Math.random() * arr.length)]
  const sleep = ms => new Promise(r => setTimeout(r, ms))

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
      for (const nx of adj[cur] || []) if (!(nx in prev)) { prev[nx] = cur; if (nx === to) { const p = [to]; let c = to; while (prev[c]) { c = prev[c]; p.unshift(c) } return p } q.push(nx) }
    }
    return [to]
  }

  // opts: { stage, actorsEl, org, map, chars, spriteScale, flat, depth:[min,max], on(event, payload), lines }
  function create(opts) {
    const { stage, actorsEl, org, map, chars } = opts
    const on = opts.on || (() => {})
    const LINES = Object.assign({
      coffee: ['☕ 한 잔', '당 충전', '라떼로'], board: ['📌 이번 주 할 일', '우선순위 정리', '아이디어 3개'], lounge: ['잠깐 쉬고…', '🌿', '5분만'],
      meeting: ['이번 주 목표는?', '제가 초안 쓸게요', '검수는 세라가', '목요일 발표 순서', '좋아요, 그걸로'], decided: '결정! ✅',
      delivered: '완료했어요!', approve: ['👍 좋아요', '확인!', '검수 통과'], ask: ['이거 어떻게 봐요?', '잠깐만요!', '링크 좀 줘요'], answer: ['오 좋은데요', '이렇게 해봐요', '👌'],
    }, opts.lines || {})
    let speed = 1, epoch = 0, doneCount = 0
    const taken = new Set()
    const claim = key => { if (taken.has(key)) return false; taken.add(key); return true }
    const free = key => taken.delete(key)
    map.adj = buildGraph(map)
    const depth = opts.depth || [0.64, 1.14]

    const E = { actors: [], workers: [], leader: null, map, org, speed: () => speed }

    function fit() { stage.style.setProperty('--sh', `${stage.clientWidth * (opts.spriteScale || 0.082)}px`) }
    addEventListener('resize', fit); fit()

    function makeActor(a, seat, ghost) {
      const el = document.createElement('div'); el.className = 'actor' + (ghost ? ' ghost' : '')
      el.innerHTML = `<div class="body"><div class="nametag"><b></b><small></small></div><div class="bubble"></div><img class="sprite" alt="" draggable="false"></div>`
      el.querySelector('b').textContent = ghost ? a.name : `${a.name}${a.role ? ' · ' + a.role : ''}`
      actorsEl.appendChild(el)
      const actor = { a, seat, ghost, el, img: el.querySelector('img'), x: seat.x, y: seat.y, node: seat.node, busy: false, status: '대기', bubbleTimer: null, lv: 1 + Math.floor(rnd(0, 9)), view: 'front' }
      setView(actor, seat.view || 'front', false)
      place(actor, seat.x, seat.y)
      setStatus(actor, ghost ? (opts.ghostStatus || '업무 지도에서 뽑은 자리') : '작업 중')
      if (!ghost) el.classList.add('typing')
      el.addEventListener('click', () => on('select', actor))
      return actor
    }
    function setView(actor, view, flip) {
      const src = `${chars}/${actor.a.sprite}-${view}.png`
      if (actor.img.getAttribute('src') !== src) actor.img.src = src
      actor.view = view; actor.el.classList.toggle('flip', !!flip)
    }
    function place(actor, x, y) {
      actor.x = x; actor.y = y
      actor.el.style.left = `${x}%`; actor.el.style.top = `${y}%`
      actor.el.style.zIndex = String(100 + Math.round(y * 10))
      actor.el.style.setProperty('--s', opts.flat ? '1' : (depth[0] + (depth[1] - depth[0]) * (y / 100)).toFixed(3))
    }
    function setStatus(actor, text) {
      actor.status = text
      actor.el.querySelector('.nametag small').textContent = actor.ghost ? text : `${text} · Lv.${actor.lv}`
      on('status', actor)
    }
    function say(actor, text, { soft = false, ms = 2600 } = {}) {
      const b = actor.el.querySelector('.bubble')
      b.textContent = text; b.classList.toggle('soft', soft); b.classList.add('on')
      clearTimeout(actor.bubbleTimer)
      actor.bubbleTimer = setTimeout(() => b.classList.remove('on'), ms / speed)
      on('say', { actor, text })
    }
    function log(text, kind = 'info') { on('log', { text, kind }) }
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

    async function step(actor, x, y, e) {
      const dx = x - actor.x, dy = y - actor.y
      const dist = Math.hypot(dx * (opts.flat ? 1 : 1.5), dy)
      if (dist < 0.3) return
      const dur = Math.max(0.35, dist / (opts.walkSpeed || 20)) / speed
      if (Math.abs(dx) > Math.abs(dy) * 1.15) setView(actor, 'side', dx < 0)
      else setView(actor, dy < 0 ? 'back' : 'front', false)
      actor.el.classList.remove('typing'); actor.el.classList.add('walk')
      actor.el.style.setProperty('--dur', `${dur}s`)
      place(actor, x, y)
      await sleep(dur * 1000 + 40)
      if (e !== epoch) throw new Error('reset')
    }
    async function walkTo(actor, target, e) {
      const path = pathBetween(map.adj, actor.node, target.node)
      for (const id of path) { const [nx, ny] = map.nodes[id]; await step(actor, nx, ny, e); actor.node = id }
      await step(actor, target.x, target.y, e)
      actor.el.classList.remove('walk')
    }
    async function goHome(actor, e) {
      setStatus(actor, '이동 중')
      await walkTo(actor, actor.seat, e)
      setView(actor, actor.seat.view || 'front', false)
      actor.el.classList.add('typing')
      setStatus(actor, '작업 중')
    }

    const activities = {
      async coffee(actor, e) {
        if (!map.spots.coffee || !claim('coffee')) return false
        try {
          setStatus(actor, '이동 중'); log(`${actor.a.name} · 커피 타러 감`, 'move')
          await walkTo(actor, map.spots.coffee, e)
          setView(actor, map.spots.coffee.view || 'back', false); setStatus(actor, '커피 ☕'); say(actor, pick(LINES.coffee), { soft: true })
          await sleep(rnd(2600, 4200) / speed)
        } finally { free('coffee') }
        await goHome(actor, e); return true
      },
      async board(actor, e) {
        if (!map.spots.board || !claim('board')) return false
        try {
          setStatus(actor, '이동 중'); log(`${actor.a.name} · 화이트보드에 메모`, 'move')
          await walkTo(actor, map.spots.board, e)
          setView(actor, map.spots.board.view || 'back', false); setStatus(actor, '정리 중'); say(actor, pick(LINES.board), { soft: true })
          await sleep(rnd(2400, 3800) / speed)
        } finally { free('board') }
        await goHome(actor, e); return true
      },
      async lounge(actor, e) {
        const L = map.spots.lounge || []
        const idx = L.findIndex((_, i) => !taken.has(`lounge${i}`)); if (idx < 0) return false
        claim(`lounge${idx}`)
        try {
          setStatus(actor, '이동 중'); log(`${actor.a.name} · 라운지에서 잠깐 휴식`, 'move')
          await walkTo(actor, L[idx], e)
          setView(actor, L[idx].view || 'front', false); setStatus(actor, '휴식'); say(actor, pick(LINES.lounge), { soft: true })
          await sleep(rnd(3500, 6000) / speed)
        } finally { free(`lounge${idx}`) }
        await goHome(actor, e); return true
      },
      async deliver(actor, e) {
        if (!map.spots.leaderFront || !claim('leader')) return false
        try {
          const task = pick(actor.a.tasks || ['작업'])
          setStatus(actor, '이동 중'); log(`${actor.a.name} → ${E.leader.a.name} · 「${task}」 전달`, 'deliver')
          say(actor, `📄 ${task}`)
          await walkTo(actor, map.spots.leaderFront, e)
          setView(actor, map.spots.leaderFront.view || 'back', false); setStatus(actor, '전달 중'); say(actor, LINES.delivered)
          await sleep(900 / speed)
          say(E.leader, pick(LINES.approve)); E.leader.el.classList.add('cheer')
          doneCount += 1; if (Math.random() < 0.3) actor.lv += 1; sparks(actor); on('done', { actor, task, count: doneCount })
          await sleep(1400 / speed); E.leader.el.classList.remove('cheer')
        } finally { free('leader') }
        await goHome(actor, e); return true
      },
      async meeting(actor, e) {
        const M = map.spots.meeting || []
        const others = E.workers.filter(w => w !== actor && !w.busy).slice(0, Math.min(2, M.length - 1))
        if (others.length < 2 || !claim('meeting')) return false
        const group = [actor, ...others]; others.forEach(g => { g.busy = true })
        try {
          log(`${group.map(g => g.a.name).join('·')} · 회의 테이블에서 짧은 회의`, 'meet')
          await Promise.all(group.map((g, i) => { setStatus(g, '이동 중'); return walkTo(g, M[i], e) }))
          group.forEach((g, i) => { setView(g, M[i].view || (i === 1 ? 'back' : 'front'), M[i].flip); setStatus(g, '회의 중') })
          on('meeting', group)
          for (let i = 0; i < 4; i++) { say(pick(group), pick(LINES.meeting), { soft: true }); await sleep(rnd(1100, 1700) / speed) }
          say(group[0], LINES.decided); await sleep(900 / speed)
        } finally { free('meeting') }
        await Promise.all(group.map(g => goHome(g, e)))
        others.forEach(g => { g.busy = false }); return true
      },
      async chat(actor, e) {
        const other = pick(E.workers.filter(w => w !== actor && !w.busy)); if (!other || !map.spots.chat) return false
        const spot = pick(map.spots.chat)
        other.busy = true
        try {
          log(`${actor.a.name} · ${other.a.name}에게 잠깐 물어봄`, 'move')
          setStatus(actor, '이동 중'); setStatus(other, '이동 중')
          await Promise.all([walkTo(actor, { x: spot.x - 2.5, y: spot.y, node: spot.node }, e), walkTo(other, { x: spot.x + 2.5, y: spot.y, node: spot.node }, e)])
          setView(actor, 'side', false); setView(other, 'side', true)
          setStatus(actor, '대화 중'); setStatus(other, '대화 중')
          say(actor, pick(LINES.ask), { soft: true }); await sleep(1300 / speed)
          say(other, pick(LINES.answer), { soft: true }); await sleep(1300 / speed)
        } finally { other.busy = false }
        await Promise.all([goHome(actor, e), goHome(other, e)]); return true
      },
      async type(actor, e) {
        say(actor, pick(actor.a.tasks || ['작업 중']), { soft: true, ms: 3200 })
        await sleep(3400 / speed); return true
      },
    }
    const weights = opts.weights || [['type', 5], ['coffee', 2], ['deliver', 3], ['chat', 2], ['board', 1], ['lounge', 1.2], ['meeting', 1]]
    function pickActivity() { const total = weights.reduce((s, w) => s + w[1], 0); let r = Math.random() * total; for (const [k, w] of weights) { r -= w; if (r <= 0) return k } return 'type' }
    async function loop(actor, delay, e) {
      await sleep(delay)
      while (e === epoch) {
        if (!actor.busy) {
          actor.busy = true
          try { await activities[pickActivity()](actor, e) } catch (err) { if (err.message !== 'reset') console.warn(err) }
          actor.busy = false
        }
        await sleep(rnd(opts.idleMin || 1800, opts.idleMax || 5200) / speed)
      }
    }

    E.start = function () {
      epoch += 1; const e = epoch; taken.clear(); actorsEl.innerHTML = ''
      const seats = [...map.seats]
      const leaderSeat = seats.find(s => s.leader) || seats[0]
      const rest = seats.filter(s => s !== leaderSeat)
      const agents = [...org.agents].sort((a, b) => (b.coordinator === true) - (a.coordinator === true))
      E.actors = []
      agents.forEach((a, i) => { const seat = i === 0 ? leaderSeat : rest.shift(); if (seat) E.actors.push(makeActor(a, seat, false)) })
      ;(org.planned || []).forEach(p => { const seat = rest.shift(); if (seat) E.actors.push(makeActor({ id: `planned-${p.title}`, name: (opts.ghostLabel || (t => `채용 예정 · ${t}`))(p.title), role: p.reason || '', sprite: p.sprite || 'coffee', tasks: [] }, seat, true)) })
      E.leader = E.actors[0]; E.workers = E.actors.filter(a => !a.ghost && a !== E.leader)
      E.workers.forEach((w, i) => loop(w, 800 + i * 1400, e))
      ;(async () => { while (e === epoch) { await sleep(rnd(6000, 11000) / speed); if (e === epoch && E.leader && !E.leader.busy) say(E.leader, pick(E.leader.a.tasks || ['검토 중']), { soft: true }) } })()
      on('start', E)
    }
    E.stop = () => { epoch += 1 }
    E.setSpeed = v => { speed = v }
    E.say = say
    E.done = () => doneCount
    E.fit = fit
    return E
  }
  return { create, rnd, pick, sleep }
})()
