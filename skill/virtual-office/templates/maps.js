// 배경 그림 위의 자리(앵커)와 통로 그래프. 값은 배경 그림의 백분율(x%, y%) — 발끝 위치.
// seats: 책상 자리(의자). node = 그 자리에서 통로로 나가는 가장 가까운 통로 점.
// nodes/edges: 통로 점과 연결. 캐릭터는 통로 점만 따라 걷는다 → 책상·테이블 위를 지나가지 않는다.
// spots: 커피·화이트보드·회의·라운지 같은 목적지(각각 node 포함).
// MAP_A: 코지/보헤미안/스튜디오/관제실 배경(같은 구도). MAP_PIXEL: 레트로 RPG 배경.
window.OFFICE_MAPS = {
  A: {
    nodes: {
      n1: [33, 47], n5: [44, 51], n19: [50, 46], n2: [53, 53], n11: [55, 63], n3: [57, 74],
      n4: [25, 70], n10: [27, 85], n6: [70, 78], n13: [83, 87], n14: [93, 72],
      n18: [59, 36], n17: [74, 30], n20: [79.5, 43], n15: [78.5, 58],
    },
    edges: [['n1', 'n5'], ['n5', 'n19'], ['n19', 'n2'], ['n2', 'n11'], ['n11', 'n3'], ['n1', 'n4'], ['n4', 'n10'], ['n3', 'n6'], ['n6', 'n13'], ['n13', 'n14'], ['n19', 'n18'], ['n18', 'n17'], ['n17', 'n20'], ['n20', 'n15']],
    seats: [
      // 가운데 위 포드 — 총괄 자리 T2(아래 의자)
      { id: 'T2', x: 44.0, y: 41.0, node: 'n5', leader: true }, { id: 'T1', x: 37.0, y: 34.0, node: 'n1' }, { id: 'T4', x: 56.5, y: 30.0, node: 'n18' },
      // 왼쪽 포드
      { id: 'L1', x: 11.0, y: 55.0, node: 'n4' }, { id: 'L2', x: 18.0, y: 63.0, node: 'n4' }, { id: 'L4', x: 30.0, y: 50.5, node: 'n1' },
      // 오른쪽 포드
      { id: 'R1', x: 58.0, y: 57.0, node: 'n11' }, { id: 'R2', x: 65.0, y: 66.0, node: 'n3' }, { id: 'R4', x: 75.5, y: 54.0, node: 'n15' },
      // 아래 포드
      { id: 'B1', x: 32.5, y: 75.0, node: 'n4' }, { id: 'B2', x: 40.0, y: 84.0, node: 'n10' }, { id: 'B4', x: 51.0, y: 73.0, node: 'n3' },
    ],
    spots: {
      coffee: { x: 91.0, y: 64.0, node: 'n14', label: '☕ 커피' },
      board: { x: 80.0, y: 60.0, node: 'n15', label: '📌 화이트보드' },
      meeting: [{ x: 74.5, y: 77.0, node: 'n6' }, { x: 80.5, y: 79.5, node: 'n13' }, { x: 87.0, y: 73.5, node: 'n14' }],
      lounge: [{ x: 60.5, y: 86.0, node: 'n3' }, { x: 67.0, y: 84.0, node: 'n6' }],
      leaderFront: { x: 49.0, y: 46.0, node: 'n19' },
      chat: [{ x: 40, y: 51, node: 'n5' }, { x: 60, y: 74, node: 'n3' }, { x: 28, y: 76, node: 'n4' }],
    },
    labels: [{ x: 15, y: 37, text: '🧥 옷걸이' }, { x: 7, y: 49, text: '📚 자료' }],
  },
  PIXEL: {
    // 탑다운 16비트 사무실: 포드 3개(x 6-24 / 31-50 / 56-74, y 34-62), 위 통로 y≈30, 아래 통로 y≈66, 포드 사이 세로 통로 x≈27·53
    flat: true,
    nodes: {
      t1: [15, 30], c1: [27, 30], t2: [40, 30], c3: [53, 30], t3: [65, 30], t4: [84, 24],
      a: [15, 66], c2: [27, 66], b: [40, 66], c4: [53, 66], c: [65, 66], d: [82, 63], e: [85, 56],
      f: [70, 82], h: [88, 92],
    },
    edges: [['t1', 'c1'], ['c1', 't2'], ['t2', 'c3'], ['c3', 't3'], ['t3', 't4'], ['c1', 'c2'], ['c3', 'c4'], ['a', 'c2'], ['c2', 'b'], ['b', 'c4'], ['c4', 'c'], ['c', 'd'], ['d', 'e'], ['c', 'f'], ['f', 'h']],
    seats: [
      // 앞줄(아래 의자, 등을 보이며 타이핑) — 총괄은 가운데 포드 왼쪽
      { id: 'P2L', x: 35, y: 60, node: 'b', view: 'back', leader: true }, { id: 'P2R', x: 45, y: 60, node: 'b', view: 'back' },
      { id: 'P1L', x: 10, y: 60, node: 'a', view: 'back' }, { id: 'P1R', x: 20, y: 60, node: 'a', view: 'back' },
      { id: 'P3L', x: 60, y: 60, node: 'c', view: 'back' }, { id: 'P3R', x: 70, y: 60, node: 'c', view: 'back' },
      // 뒷줄(위 의자, 정면)
      { id: 'P2LB', x: 35, y: 38, node: 't2', view: 'front' }, { id: 'P2RB', x: 45, y: 38, node: 't2', view: 'front' },
      { id: 'P3LB', x: 60, y: 38, node: 't3', view: 'front' }, { id: 'P3RB', x: 70, y: 38, node: 't3', view: 'front' },
      { id: 'P1LB', x: 10, y: 38, node: 't1', view: 'front' }, { id: 'P1RB', x: 20, y: 38, node: 't1', view: 'front' },
    ],
    spots: {
      coffee: { x: 90.5, y: 65, node: 'd', label: '☕ 커피', view: 'back' },
      board: { x: 77, y: 26, node: 't4', label: '📌 화이트보드', view: 'back' },
      meeting: [{ x: 79, y: 31, node: 't4', view: 'front' }, { x: 90, y: 31, node: 't4', view: 'front' }, { x: 85, y: 52, node: 'e', view: 'back' }],
      lounge: [{ x: 80, y: 71, node: 'f', view: 'front' }, { x: 93, y: 83, node: 'h', view: 'front' }],
      leaderFront: { x: 37, y: 68, node: 'b', view: 'back' },
      chat: [{ x: 27, y: 56, node: 'c2' }, { x: 53, y: 56, node: 'c4' }, { x: 60, y: 78, node: 'f' }],
    },
    labels: [{ x: 8, y: 31, text: '📚 자료실' }],
  },
}
