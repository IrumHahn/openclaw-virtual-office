// 컨셉별 앵커 맵(백분율). seats: 자리(+진입 노드, 앉는 방향) · nodes/edges: 통로 그래프 · spots: 목적지 · zones: 구역(SaaS 칩 하이라이트용)
window.OFFICE_MAPS_V3 = {
  // 1) 디오라마 스튜디오 — 칸막이 사무실 미니어처
  DIORAMA: {
    nodes: { l1: [25, 48], l2: [28, 68], l3: [40, 83], b: [58, 86], m: [66, 70], r: [74, 78], r2: [82, 64], c: [46, 47] },
    edges: [['l1', 'l2'], ['l2', 'l3'], ['l3', 'b'], ['b', 'm'], ['m', 'r'], ['r', 'r2'], ['l1', 'c']],
    seats: [
      { id: 'M1', x: 54, y: 57, node: 'm', view: 'back', leader: true }, { id: 'M2', x: 63.5, y: 52, node: 'm', view: 'back' },
      { id: 'K1', x: 33, y: 41, node: 'l1', view: 'back' }, { id: 'K2', x: 46.5, y: 36.5, node: 'c', view: 'back' },
      { id: 'F1', x: 36, y: 61, node: 'l2', view: 'front' }, { id: 'F2', x: 45, y: 68, node: 'l3', view: 'front' }, { id: 'F3', x: 54, y: 75, node: 'b', view: 'front' },
      { id: 'S1', x: 79, y: 63, node: 'r2', view: 'front' }, { id: 'S2', x: 84.5, y: 60, node: 'r2', view: 'front' }, { id: 'S3', x: 89.5, y: 57, node: 'r2', view: 'front' },
      { id: 'X1', x: 13, y: 52, node: 'l1', view: 'front' }, { id: 'X2', x: 21, y: 46, node: 'l1', view: 'back' },
    ],
    spots: {
      coffee: { x: 22, y: 47, node: 'l1', view: 'back', label: '💧 정수기' },
      meeting: [{ x: 66, y: 73, node: 'r', view: 'front' }, { x: 75, y: 78, node: 'r', view: 'back' }, { x: 71, y: 67, node: 'r', view: 'front' }],
      lounge: [{ x: 62, y: 80, node: 'b', view: 'front' }],
      leaderFront: { x: 60, y: 64, node: 'm', view: 'back' },
      chat: [{ x: 30, y: 72, node: 'l2' }, { x: 70, y: 76, node: 'r' }],
    },
  },
  // 2) AI 오피스 SaaS — 방이 나뉜 고급 사무실
  SAAS: {
    nodes: { rec: [22, 50], n1: [29, 47], n2: [40, 35], n3: [43, 55], n4: [55, 55], n5: [63, 64], n6: [71, 67], n7: [66, 78], n8: [89, 70] },
    edges: [['rec', 'n1'], ['n1', 'n3'], ['n3', 'n4'], ['n4', 'n5'], ['n5', 'n6'], ['n1', 'n2'], ['n5', 'n7'], ['n6', 'n8']],
    seats: [
      { id: 'CEO', x: 37.5, y: 29, node: 'n2', view: 'front', leader: true, zone: 'ceo' },
      { id: 'REC', x: 21, y: 41, node: 'rec', view: 'front', zone: 'sec' },
      { id: 'T1', x: 31.5, y: 55, node: 'n3', view: 'back', zone: 'work' }, { id: 'T2', x: 37.5, y: 60, node: 'n3', view: 'back', zone: 'work' },
      { id: 'O1', x: 44.5, y: 43, node: 'n3', view: 'back', zone: 'work' }, { id: 'O2', x: 51.5, y: 47, node: 'n4', view: 'back', zone: 'work' },
      { id: 'G1', x: 58.5, y: 51.5, node: 'n4', view: 'back', zone: 'work' }, { id: 'G2', x: 64.5, y: 55.5, node: 'n5', view: 'back', zone: 'work' },
      { id: 'B1', x: 47.5, y: 63.5, node: 'n5', view: 'back', zone: 'work' }, { id: 'B2', x: 53.5, y: 68, node: 'n5', view: 'back', zone: 'work' },
      { id: 'MT1', x: 78, y: 52.5, node: 'n6', view: 'front', zone: 'meet' }, { id: 'MT2', x: 85, y: 49.5, node: 'n8', view: 'front', zone: 'meet' },
    ],
    spots: {
      coffee: { x: 72, y: 79, node: 'n7', view: 'back', label: '☕ 탕비실' },
      board: { x: 89.5, y: 70, node: 'n8', view: 'back', label: '📌 화이트보드' },
      meeting: [{ x: 74, y: 63, node: 'n6', view: 'back' }, { x: 80, y: 66.5, node: 'n6', view: 'back' }, { x: 86, y: 62.5, node: 'n8', view: 'back' }],
      lounge: [{ x: 58, y: 75, node: 'n7', view: 'front' }, { x: 64, y: 79.5, node: 'n7', view: 'front' }],
      leaderFront: { x: 41, y: 35, node: 'n2', view: 'back' },
      chat: [{ x: 43, y: 55, node: 'n3' }, { x: 63, y: 64, node: 'n5' }],
    },
    zones: {
      ceo: { label: '대표실', poly: [[21, 22], [47, 16], [50, 40], [25, 44]], color: '#c9a44c' },
      sec: { label: '비서실', poly: [[5, 36], [24, 30], [30, 50], [12, 56]], color: '#7fb3d5' },
      work: { label: '업무 공간', poly: [[29, 48], [60, 36], [75, 58], [48, 76]], color: '#58c1a2' },
      meet: { label: '회의실', poly: [[68, 50], [92, 42], [97, 66], [73, 72]], color: '#a98bd8' },
      pantry: { label: '탕비실', poly: [[51, 70], [73, 62], [85, 86], [64, 92]], color: '#e89a6b' },
    },
  },
  // 3) 미션 컨트롤 — 뒤에서 본 3단 콘솔
  CONTROL: {
    flat: false,
    nodes: { a1: [15, 56], a2: [49, 56], a3: [85, 56], b1: [15, 76], b2: [49, 76], b3: [85, 76], c1: [15, 96], c2: [49, 96], c3: [85, 96] },
    edges: [['a1', 'a2'], ['a2', 'a3'], ['b1', 'b2'], ['b2', 'b3'], ['c1', 'c2'], ['c2', 'c3'], ['a1', 'b1'], ['b1', 'c1'], ['a3', 'b3'], ['b3', 'c3']],
    seats: [
      { id: 'M2', x: 49.5, y: 67, node: 'b2', view: 'back', leader: true }, { id: 'M1', x: 30, y: 67, node: 'b1', view: 'back' }, { id: 'M3', x: 69, y: 67, node: 'b3', view: 'back' },
      { id: 'T1', x: 34.5, y: 51, node: 'a2', view: 'back' }, { id: 'T2', x: 49.5, y: 51, node: 'a2', view: 'back' }, { id: 'T3', x: 64.5, y: 51, node: 'a3', view: 'back' },
      { id: 'F1', x: 22, y: 90, node: 'c1', view: 'back' }, { id: 'F2', x: 49.5, y: 90, node: 'c2', view: 'back' }, { id: 'F3', x: 76, y: 90, node: 'c3', view: 'back' },
      { id: 'BR', x: 9, y: 60, node: 'a1', view: 'back' },
      { id: 'X1', x: 90, y: 58, node: 'a3', view: 'front' }, { id: 'X2', x: 88, y: 80, node: 'b3', view: 'front' },
    ],
    spots: {
      coffee: { x: 92, y: 50, node: 'a3', view: 'back', label: '☕' },
      board: { x: 6, y: 58, node: 'a1', view: 'back', label: '🗂 브리핑' },
      meeting: [{ x: 6, y: 62, node: 'a1', view: 'back' }, { x: 13, y: 64, node: 'a1', view: 'back' }, { x: 10, y: 54, node: 'a1', view: 'back' }],
      leaderFront: { x: 49.5, y: 78, node: 'b2', view: 'back' },
      chat: [{ x: 30, y: 76, node: 'b2' }, { x: 70, y: 56, node: 'a3' }],
    },
  },
  // 4) 사옥 단면도 — 5층 빌딩, 엘리베이터로 층 이동
  BUILDING: {
    flat: true,
    nodes: {
      e5: [17, 27], e4: [17, 45], e3: [17, 63], e2: [17, 81], e1: [17, 97],
      f5a: [30, 27], f5b: [50, 27], f5c: [70, 27], f5d: [88, 27],
      f4a: [30, 45], f4b: [50, 45], f4c: [70, 45], f4d: [88, 45],
      f3a: [30, 63], f3b: [50, 63], f3c: [70, 63], f3d: [88, 63],
      f2a: [30, 81], f2b: [50, 81], f2c: [70, 81], f2d: [88, 81],
      f1a: [30, 97], f1b: [50, 97], f1c: [70, 97], f1d: [88, 97],
    },
    edges: [
      ['e5', 'e4'], ['e4', 'e3'], ['e3', 'e2'], ['e2', 'e1'],
      ['e5', 'f5a'], ['f5a', 'f5b'], ['f5b', 'f5c'], ['f5c', 'f5d'],
      ['e4', 'f4a'], ['f4a', 'f4b'], ['f4b', 'f4c'], ['f4c', 'f4d'],
      ['e3', 'f3a'], ['f3a', 'f3b'], ['f3b', 'f3c'], ['f3c', 'f3d'],
      ['e2', 'f2a'], ['f2a', 'f2b'], ['f2b', 'f2c'], ['f2c', 'f2d'],
      ['e1', 'f1a'], ['f1a', 'f1b'], ['f1b', 'f1c'], ['f1c', 'f1d'],
    ],
    floors: [
      { id: 5, label: '5F 대표실', y: [12, 28] }, { id: 4, label: '4F 회의층', y: [30, 46] }, { id: 3, label: '3F 업무층', y: [48, 64] }, { id: 2, label: '2F 스튜디오', y: [66, 82] }, { id: 1, label: '1F 로비·카페', y: [84, 99] },
    ],
    seats: [
      { id: 'CEO', x: 51, y: 26, node: 'f5b', view: 'front', leader: true },
      { id: 'D1', x: 34, y: 63, node: 'f3a', view: 'front' }, { id: 'D2', x: 49, y: 63, node: 'f3b', view: 'front' }, { id: 'D3', x: 64, y: 63, node: 'f3c', view: 'front' }, { id: 'D4', x: 79, y: 63, node: 'f3d', view: 'front' },
      { id: 'S1', x: 28, y: 81, node: 'f2a', view: 'front' }, { id: 'S2', x: 46, y: 81, node: 'f2b', view: 'front' }, { id: 'S3', x: 70, y: 81, node: 'f2c', view: 'front' },
      { id: 'L1', x: 39, y: 97, node: 'f1a', view: 'front' }, { id: 'L2', x: 76, y: 97, node: 'f1c', view: 'front' },
      { id: 'M1', x: 36, y: 45, node: 'f4a', view: 'front' }, { id: 'M2', x: 60, y: 45, node: 'f4c', view: 'front' },
    ],
    spots: {
      coffee: { x: 72, y: 97, node: 'f1c', view: 'back', label: '☕ 1F 카페' },
      board: { x: 48, y: 44, node: 'f4b', view: 'back', label: '📌 4F 화이트보드' },
      meeting: [{ x: 40, y: 45, node: 'f4a', view: 'front' }, { x: 52, y: 45, node: 'f4b', view: 'front' }, { x: 64, y: 45, node: 'f4c', view: 'front' }],
      lounge: [{ x: 74, y: 27, node: 'f5c', view: 'front' }, { x: 82, y: 27, node: 'f5d', view: 'front' }],
      leaderFront: { x: 45, y: 27, node: 'f5b', view: 'side' },
      chat: [{ x: 60, y: 63, node: 'f3c' }, { x: 56, y: 97, node: 'f1b' }],
    },
  },
}
