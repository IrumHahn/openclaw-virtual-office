---
name: virtual-office
description: OpenClaw 에이전트 팀을 "가상 오피스" 라이브 화면으로 만들어 대시보드 홈 「나의 위젯」에 띄운다. 직원은 통로를 따라 걸어 책상에서 일하고, 커피 마시고, 회의하고, 총괄에게 결과물을 전달하며, 업무 지도에서 뽑은 앞으로 필요한 자리는 빈 책상에 "채용 예정"으로 보인다. 템플릿 5종(디오라마 스튜디오 · AI 오피스 SaaS · 레트로 RPG · 미션 컨트롤 · 사옥 단면도)을 번호로 고른다. "가상 오피스 만들어줘", "우리 사무실 그려줘", "오피스 템플릿 바꿔줘", "virtual office" 요청에 사용. 대시보드 앱 설치나 에이전트 생성은 하지 않는다.
---

# Virtual Office — 팀이 일하는 내 가상 사무실

이 스킬은 **HTML 한 장**을 만든다. 직원은 `openclaw agents list`·`team.json`에서, 앞으로 뽑을 자리는 `my-work-map.md`(업무 지도)에서 가져온다. 배경·캐릭터·엔진·음악은 이 키트의 CDN(jsDelivr)에서 읽으므로 파일은 작다. 결과 두 가지:

| 파일 | 어디에 | 언제 |
|---|---|---|
| `widget.html` | 대시보드 홈 「나의 위젯」(dashboard-builder 스킬이 PC 로 보냄) | 기본. 발표용 |
| `office.html` | 브라우저에서 바로 여는 독립 한 장 | Mac, 대시보드가 없을 때, 전체 화면 발표 |

```
agents list + team.json + my-work-map.md ─→ collect_org.mjs ─→ org.json ─(확인·템플릿 번호)─→ build_office.mjs ─→ widget.html / office.html
                                                                                                   └─→ dashboard-builder: build_dashboard.mjs --widget widget.html → send_to_pc.mjs
```

사용자에게는 사용자의 언어로 쉽게 말한다. 만들지 않은 것을 만들었다고, 보내지 않은 것을 보냈다고 말하지 않는다. 비밀값은 어떤 파일에도 넣지 않는다(스크립트가 거부한다).

## 0. 먼저 알아둘 것 (에이전트용)

- `<skill-dir>` = 이 SKILL.md 가 있는 폴더. 스크립트는 `scripts/`, 템플릿은 `templates/`. 의존성 없음(Node 18+).
- 작업 폴더 기본값 `~/.openclaw/workspace/virtual-office/` (`org.json`, `widget.html`, `office.html`).
- **PC 앱 버전**: 위젯에서 배경·캐릭터가 보이려면 PC 의 `openclaw-personal-dashboard` 가 **v0.4 이상**(위젯 CSP 에 이 키트 CDN 허용)이어야 한다. 예전 앱이면 위젯 칸이 비거나 그림 없이 나온다 → "앱 폴더에서 `git pull` 후 `npm run dev` 다시" 안내. `office.html` 은 버전과 무관하게 열린다.
- Windows Hub 앱 노드로 보낼 때 허용 창(Allow Once)이 **약 2~4번** 뜬다(`allowWindowsEstimate`). 보내기 전에 횟수를 말한다.
- 이 스킬은 에이전트를 만들거나 바꾸지 않는다. "채용 예정"은 그림이다 — 실제 채용은 `agent-team-onboarding`.

## 1. 재료 모으기

```bash
node <skill-dir>/scripts/collect_org.mjs \
  --team <workspaces>/<team-id>/team.json \
  --work-map <main-workspace>/my-work-map.md \
  --owner "<사용자 호칭>" --company "<회사/오피스 이름>" --tagline "<홈 한 줄>" \
  --out ~/.openclaw/workspace/virtual-office/org.json
```

- `team.json` 이 없으면 생략(역할은 화면 이름의 괄호에서 추측). `my-work-map.md` 가 없으면 채용 예정이 비므로 **앞으로 맡기고 싶은 일 2~3개**를 묻는다.
- `planned` 는 **제안**이다. 표로 보여 주고 고친다(`references/positions.md`).
- 직원별 `tasks`(말풍선에 뜨는 할 일 2~3개)는 HIA `STATE.md` 의 다음 행동·대시보드 기록에서 뽑아 org.json 에 넣는다. 없으면 역할에 맞는 일반 문장 2개.
- `sprite` 는 역할로 고른다: 총괄 `star` · 리서치 `chart` · 소셜/게임 `gamepad` · 글 `pen` · 코딩 `laptop` · 디자인 `palette` · QA/검수 `lens` · 회고 `mirror` · 인턴/성장 `sprout` · 교육/코치 `book` · 영상 `camera` · 응대/기타 `coffee`. 12명을 넘으면 겹쳐 써도 된다.

## 2. 템플릿 보여 주고 번호 받기

`node <skill-dir>/scripts/build_office.mjs --list` 를 번호 메뉴로 보여 준다(`references/templates.md` 문장 그대로 써도 된다):

> 어떤 사무실로 할까요? 번호 하나만 골라 주세요. 시안은 가이드의 「가상 오피스 시안 5종」에서 미리 볼 수 있어요.
> ① **디오라마 스튜디오** — 3D 미니어처, 펠트 인형, 라디오. 조용한 감성
> ② **AI 오피스 SaaS** — 사이드바 앱, 구역 칩, 업무 지시. 관리 화면
> ③ **레트로 RPG** — 파티·퀘스트·대화창. 재미
> ④ **미션 컨트롤** — 관제탑, 로봇 요원, HUD. 개발·자동화
> ⑤ **사옥 단면도** — 5층 빌딩, 엘리베이터, 층별 부서. 성장 스토리

답이 모호하면 업무에 맞는 하나를 추천하고 확인 한 번 받는다.

## 3. 만들기

```bash
node <skill-dir>/scripts/build_office.mjs --org ~/.openclaw/workspace/virtual-office/org.json --template <diorama|saas|rpg|control|building>
```

결과 JSON 의 `label`, `widgetChars`, `allowWindowsEstimate`, `warnings`, `note` 를 쉬운 말로 전한다. `ok:false` 면 이유를 전하고 멈춘다.

## 4. 대시보드에 띄우기 (dashboard-builder 스킬 필요)

```bash
node <dashboard-builder-dir>/scripts/build_dashboard.mjs --widget ~/.openclaw/workspace/virtual-office/widget.html --widget-title "우리 가상 오피스 · <템플릿 이름>"
node <dashboard-builder-dir>/scripts/send_to_pc.mjs --pc ~/.openclaw/workspace/dashboard/pc.json
```

- dashboard-builder 가 없거나 PC 노드가 안 보이면: "대시보드 빌더와 PC 연결이 먼저예요. 지금은 `office.html` 을 만들어 뒀으니 PC 로 받아 브라우저에서 열어도 돼요."
- Hub 전송이면 "PC 에서 허용 창이 N번 뜨니 Allow Once" 를 먼저 말한다. 전송은 dashboard-builder 규칙 그대로.
- 기존 「나의 위젯」이 있으면 **덮어쓴다**고 알리고 확인받는다. 돌아가려면 그 위젯 HTML 로 다시 `--widget`.
- 위젯 칸에 그림이 안 보이면 PC 앱이 예전 버전이다(0단계).

## 5. 끝내기

- 무엇이 어디에 생겼는지(파일 2개, 위젯 제목), PC 에 도착했는지, 30초 안에 홈 맨 위에 보인다는 것.
- 발표 팁: "빈 책상의 채용 예정 자리를 가리키며 '다음 주엔 여기에 ○○를 앉힐 거예요'". 디오라마는 라디오 버튼, SaaS 는 구역 칩, RPG 는 캐릭터 클릭, 미션 컨트롤은 전달 순간의 레이더 링, 사옥은 층 목록을 눌러 보여 주면 좋다.
- 템플릿을 바꾸고 싶으면 3~4단계만 다시("오피스 템플릿 미션 컨트롤로 바꿔줘").

## 지켜야 할 경계

- 에이전트 생성·삭제·설정 변경 없음. `openclaw agents list --json` 읽기만.
- inbox 밖 PC 경로에 쓰지 않는다(전송은 dashboard-builder).
- 채용 예정 포지션은 사용자가 확인한 것만 그린다.
- 템플릿 HTML 을 손으로 고치지 않는다. 디자인 요청은 "이 키트 저장소에 이슈로" 안내한다.
