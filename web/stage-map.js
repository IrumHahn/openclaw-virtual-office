// 배경 그림 위의 자리(앵커). 값은 배경 그림의 백분율(x%, y%) — 발끝 위치. 네 배경은 같은 구도라 공유한다.
// kind: front = 책상 옆/앞(온몸 보임) · back = 책상 뒤(몸통 아래가 책상에 가려짐 → 아래 40% 잘라 그림)
window.OFFICE_MAP = {
  seats: [
    // 가운데 위 포드 (총괄 자리 T2)
    { id: 'T2', x: 44.0, y: 41.0, kind: 'front' }, { id: 'T1', x: 37.0, y: 34.0, kind: 'front' }, { id: 'T4', x: 56.5, y: 30.0, kind: 'front' }, { id: 'T3', x: 51.5, y: 18.5, kind: 'back' },
    // 왼쪽 포드
    { id: 'L1', x: 11.0, y: 55.0, kind: 'front' }, { id: 'L2', x: 18.0, y: 63.0, kind: 'front' }, { id: 'L4', x: 30.0, y: 50.5, kind: 'front' }, { id: 'L3', x: 22.5, y: 40.0, kind: 'back' },
    // 오른쪽 포드
    { id: 'R1', x: 58.0, y: 57.0, kind: 'front' }, { id: 'R2', x: 65.0, y: 66.0, kind: 'front' }, { id: 'R4', x: 75.5, y: 54.0, kind: 'front' }, { id: 'R3', x: 70.5, y: 42.5, kind: 'back' },
    // 아래 포드
    { id: 'B1', x: 32.5, y: 75.0, kind: 'front' }, { id: 'B2', x: 40.0, y: 84.0, kind: 'front' }, { id: 'B4', x: 51.0, y: 73.0, kind: 'front' }, { id: 'B3', x: 46.0, y: 63.5, kind: 'back' },
  ],
  spots: {
    coffee: { x: 90.0, y: 61.0, label: '☕ 커피' },
    board: { x: 81.5, y: 61.5, label: '📌 화이트보드' },
    meeting: [{ x: 74.5, y: 76.0 }, { x: 80.5, y: 78.0 }, { x: 86.5, y: 72.0 }, { x: 81.0, y: 63.5 }, { x: 74.0, y: 66.5 }],
    lounge: [{ x: 61.0, y: 88.0 }, { x: 67.5, y: 86.5 }],
    rack: { x: 15.0, y: 36.0, label: '🧥 옷걸이' },
    shelf: { x: 7.0, y: 48.0, label: '📚 자료' },
  },
}
