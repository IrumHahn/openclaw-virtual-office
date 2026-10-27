// 샘플 조직: 이룸의 맥미니 OpenClaw 팀(실제 에이전트 이름·역할). 채용 예정은 업무 지도에서 뽑는다는 가정의 예시.
window.OFFICE_ORG = {
  company: '한이룸 AI 오피스', owner: '이룸', tagline: '강의는 사람이, 반복은 비서가',
  agents: [
    { id: 'main', name: '지혜', role: '총괄', sprite: 'star', coordinator: true, tasks: ['1주차 발표 자료 점검', '오늘 승인할 것 3건', '팀 일정 조율'] },
    { id: 'yj-research-bot', name: '윤진', role: '리서치', sprite: 'chart', tasks: ['AI 뉴스 5건 선별', '경쟁사 가격 조사', '주간 지표 정리'] },
    { id: 'planning-bot', name: '수지', role: '소셜미디어', sprite: 'gamepad', tasks: ['스레드 3편 예약', '릴스 훅 문장 5개', '댓글 답글 정리'] },
    { id: 'writing-bot', name: '옥자', role: '글쓰기', sprite: 'pen', tasks: ['뉴스레터 초안', '블로그 글 1편 퇴고', '공지문 다듬기'] },
    { id: 'coding-bot', name: '영미', role: '코딩', sprite: 'laptop', tasks: ['대시보드 위젯 수정', '체크리스트 API 점검', '배포 스크립트 정리'] },
    { id: 'design-bot', name: '하나', role: '디자인', sprite: 'palette', tasks: ['썸네일 2안', '덱 표지 다듬기', '배지 아이콘'] },
    { id: 'qa-bot', name: '세라', role: 'QA', sprite: 'lens', tasks: ['가이드 링크 점검', '설치 절차 재현', '오류 FAQ 보강'] },
    { id: 'ian-bot', name: '이안', role: '회고', sprite: 'mirror', tasks: ['이번 주 회고 질문', '막힌 곳 정리', '배운 점 카드'] },
    { id: 'chunja-bot', name: '춘자', role: '인턴', sprite: 'sprout', tasks: ['자료 폴더 정리', '회의록 옮겨 적기', '커피 심부름 ☕'] },
    { id: 'jian-bot', name: '지안', role: '학습코치', sprite: 'book', tasks: ['수강생 질문 답변', '과제 제출 현황', '격려 메시지'] },
  ],
  planned: [
    { title: '수강생 응대', reason: '업무 지도 · 카톡 문의 답변', sprite: 'coffee' },
    { title: '영상 편집', reason: '업무 지도 · 강의 영상 컷 편집', sprite: 'camera' },
  ],
}
