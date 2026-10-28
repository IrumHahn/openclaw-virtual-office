# 5분 퀵스타트 — 가상 오피스

**준비물**: VPS 비서(OpenClaw) · 업무 지도(`my-work-map.md`, 1주차 과제1) · (홈에 띄우려면) 대시보드 빌더 + PC 앱이 켜져 있고 PC 노드가 "연결됨".

## 1. 스킬 설치 — 비서에게 시키기

에이전트 채팅에 보내는 문장:

```
스킬을 설치해 줘. 아래 명령은 네가 직접 실행해.
1. 홈 폴더(cd ~)에서 https://github.com/IrumHahn/openclaw-virtual-office.git 을 git clone 해. 폴더가 이미 있으면 그 폴더에서 git pull 만 해.
2. openclaw skills install ./openclaw-virtual-office/skill/virtual-office --as virtual-office --force --agent main 을 실행해.
3. openclaw skills list | grep virtual-office 결과를 그대로 보여 주고, ready 인지 알려 줘.
다른 설정은 바꾸지 마.
```

끝나면 **새 세션**.

## 2. 만들기

```
가상 오피스 만들어줘. 내 업무 지도(my-work-map.md)와 팀(team.json)을 보고 지금 직원과 앞으로 필요한 자리를 먼저 표로 보여주고,
템플릿 5종을 번호로 보여줘. 내가 고르면 만들어서 대시보드 홈 「나의 위젯」으로 보내줘. 허용 창이 몇 번 뜰지 미리 알려줘.
```

비서가 ① 직원 표 + 채용 예정 후보 → ② 템플릿 번호(①디오라마 ②SaaS ③레트로 RPG ④미션 컨트롤 ⑤사옥) → ③ 만들고 PC 로 전송. **PC 앱은 v0.4 이상**(앱 폴더에서 `git pull`). Windows Hub 앱이면 "Allow Command?" 창이 3~5번 — 명령이 `…echo … >> "…\openclaw-dashboard\inbox\…"` 모양이면 **Allow Once**.

30초 안에 대시보드 홈 맨 위 「나의 위젯」에 사무실이 뜬다.

## 3. 바꾸기

- "오피스 템플릿 미션 컨트롤로 바꿔줘"
- "채용 예정에 '영상 편집' 추가해줘" / "부서 이름을 콘텐츠·운영·제품으로"
- 원래 위젯(예: 꽃다발 레이더)으로 돌아가려면 "위젯을 꽃다발 레이더로 다시 보내줘"

## 막혔을 때

| 증상 | 이유·해결 |
|---|---|
| 채용 예정이 안 나와요 | 업무 지도가 없거나 "맡기고 싶은 일"이 비어 있어요. 비서에게 2~3개를 말해 주면 돼요 |
| 위젯 칸에 그림이 안 나와요 | PC 앱이 예전 버전이에요 → 앱 폴더 `git pull` 후 `npm run dev` 다시. 인터넷이 없어도 안 나와요(그림은 CDN) |
| 위젯 칸이 비어 있어요 | PC 앱이 꺼져 있거나 전송이 안 됐어요. 홈 [동기화] → 그래도 안 되면 "가상 오피스 다시 보내줘" |
| 대시보드가 없어요 | `office.html` 을 PC 로 받아 브라우저에서 열면 같은 그림이에요 |
