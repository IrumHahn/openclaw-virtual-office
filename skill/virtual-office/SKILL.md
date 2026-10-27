---
name: virtual-office
description: OpenClaw 에이전트 팀을 아이소메트릭 "가상 오피스" 그림으로 만들어 대시보드 홈 「나의 위젯」에 띄운다. 직원은 책상에 앉고, 업무 지도에서 뽑은 앞으로 필요한 포지션은 빈 책상에 "채용 예정"으로 표시돼 회사가 커질 모습을 미리 보여 준다. 스타일 4종(코지 베이지·화이트 아틀리에·레트로 픽셀·네온 관제실) × 성장 단계 3종(지금·6개월 뒤·2년 뒤)을 번호로 고른다. "가상 오피스 만들어줘", "우리 사무실 그려줘", "오피스 테마 바꿔줘", "virtual office" 요청에 사용. 대시보드 앱 설치나 팀 생성은 하지 않는다.
---

# Virtual Office — 팀이 앉아 있는 내 가상 사무실

이 스킬은 **그림 한 장(HTML)** 을 만든다. 직원 정보는 `openclaw agents list`·`team.json`에서, 앞으로 뽑을 포지션은 `my-work-map.md`(업무 지도)에서 가져온다. 결과는 두 가지:

| 파일 | 어디에 | 언제 |
|---|---|---|
| `widget.html` | 대시보드 홈 「나의 위젯」(dashboard-builder 스킬이 PC 로 보냄) | 기본. 수강생 발표용 |
| `office.html` | 브라우저에서 바로 여는 독립 한 장 | Mac 사용자, 발표 화면 캡처, 대시보드가 없을 때 |

```
agents list + team.json + my-work-map.md ─→ collect_org.mjs ─→ org.json ─(사용자 확인·옵션 선택)─→ build_office.mjs ─→ widget.html / office.html
                                                                                                        └─→ dashboard-builder: build_dashboard.mjs --widget widget.html → send_to_pc.mjs
```

사용자에게는 사용자의 언어로 쉽게 말한다. 만들지 않은 것을 만들었다고, 보내지 않은 것을 보냈다고 말하지 않는다. 비밀값은 어떤 파일에도 넣지 않는다(스크립트가 발견하면 거부한다).

## 0. 먼저 알아둘 것 (에이전트용)

- `<skill-dir>` = 이 SKILL.md 가 있는 폴더. 스크립트는 `<skill-dir>/scripts/`, 의존성 없음(Node 18+).
- 작업 폴더 기본값 `~/.openclaw/workspace/virtual-office/` (`org.json`, `widget.html`, `office.html`).
- 위젯은 **격리 칸**에서 열린다(외부 통신·이미지·폰트 차단). 렌더러가 인라인 SVG 만 쓰므로 그대로 안전하다. 60,000자 한도는 스크립트가 검사한다.
- Windows Hub 앱 노드로 보낼 때는 허용 창(Allow Once)이 **약 3~5번** 뜬다(`allowWindowsEstimate`). 보내기 전에 횟수를 미리 알린다. 헤드리스·Mac 노드는 창 없이 간다.
- 이 스킬은 에이전트를 만들거나 바꾸지 않는다. "채용 예정"은 그림일 뿐이다 — 실제로 뽑으려면 `agent-team-onboarding` 스킬.

## 1. 재료 모으기

```bash
node <skill-dir>/scripts/collect_org.mjs \
  --team <workspaces>/<team-id>/team.json \
  --work-map <main-workspace>/my-work-map.md \
  --owner "<사용자 호칭>" --company "<회사/오피스 이름>" --tagline "<홈 한 줄>" \
  --out ~/.openclaw/workspace/virtual-office/org.json
```

- `team.json` 이 없으면 생략한다(역할은 화면 이름의 괄호에서 추측). `my-work-map.md` 가 없으면 `notes` 에 적히고 채용 예정이 비므로 사용자에게 **앞으로 맡기고 싶은 일 2~3개**를 묻는다.
- 결과의 `planned` 는 **제안**이다. 사용자에게 이렇게 보여 주고 고친다:

> 지금 직원 N명이 앉고, 업무 지도를 보니 앞으로 이런 자리가 필요해 보여요: ① 수강생 응대 ② 영상 편집 ③ 월말 정산. 빈 책상에 "채용 예정"으로 붙여 둘까요? 빼거나 이름을 바꿀 게 있나요?

- 부서 이름(`departments`, 2년 뒤 본사에서 구역 라벨로 보임)은 사용자가 원하면 2~5개를 `org.json` 에 직접 넣는다. 직원별 `status`(`working|idle|break`)·`level`·`bubble`(말풍선)도 org.json 에서 고칠 수 있다. 위젯은 대시보드 기록으로 작업 중/대기·Lv 를 스스로 갱신한다.

## 2. 옵션 보여 주고 번호 받기

`node <skill-dir>/scripts/build_office.mjs --list` 결과를 **번호 메뉴**로 보여 준다. 설명은 `references/options.md` 의 문장을 그대로 써도 된다.

> 어떤 사무실로 할까요? 번호 두 개를 골라 주세요.
> **스타일** ① 코지 베이지 — 따뜻한 나무 바닥 ② 화이트 아틀리에 — 통유리·식물 ③ 레트로 픽셀 — 게임 속 사무실 ④ 네온 관제실 — 밤새 돌아가는 관제실
> **성장 단계** ① 지금(책상 4) ② 6개월 뒤(책상 12 · 채용 예정 자리) ③ 2년 뒤(책상 20 · 부서 구역)
> 시안 미리 보기: 가이드의 「가상 오피스 시안」 페이지. 추천: 직원 ≤4명이면 ①, 5~10명이면 ②.

답이 모호하면 추천값(② 6개월 뒤 + 업무에 맞는 스타일)을 제안하고 확인 한 번 받는다.

## 3. 만들기

```bash
node <skill-dir>/scripts/build_office.mjs --org ~/.openclaw/workspace/virtual-office/org.json --style <warm|glass|pixel|night> --stage <studio|floor|hq>
```

결과 JSON 의 `stats`(책상·직원·채용 예정·빈 자리), `widgetChars`, `allowWindowsEstimate`, `warnings` 를 쉬운 말로 전한다. `ok:false` 면 이유를 전하고 멈춘다(60,000자 초과면 `--stage studio` 또는 채용 예정 줄이기).

## 4. 대시보드에 띄우기 (dashboard-builder 스킬 필요)

```bash
node <dashboard-builder-dir>/scripts/build_dashboard.mjs --widget ~/.openclaw/workspace/virtual-office/widget.html --widget-title "우리 가상 오피스"
node <dashboard-builder-dir>/scripts/send_to_pc.mjs --pc ~/.openclaw/workspace/dashboard/pc.json
```

- dashboard-builder 가 없거나 PC 노드가 안 보이면: "대시보드 빌더를 먼저 설치하고 PC 가 연결돼야 홈에 띄울 수 있어요. 지금은 `office.html` 을 만들어 뒀으니 PC 로 받아 브라우저에서 열어도 돼요." 라고 안내한다.
- Hub 전송이면 "PC 에서 허용 창이 N번 뜨니 Allow Once 를 눌러 주세요" 를 먼저 말한다. 전송은 dashboard-builder 규칙(sha256 대조 / exec 실행) 그대로다.
- 기존 「나의 위젯」(예: 꽃다발 레이더)이 있으면 **덮어쓴다**고 미리 알리고 확인받는다. 돌아가려면 그 위젯 HTML 로 다시 `--widget`.

## 5. 끝내기

- 무엇이 어디에 생겼는지(파일 2개 경로, 위젯 제목), PC 에 도착했는지(sha256 일치 또는 exec 결과), 30초 안에 홈 맨 위에 보인다는 것을 말한다.
- 발표 팁 한 줄: "빈 책상의 채용 예정 자리를 가리키며 '다음 주엔 여기에 ○○를 앉힐 거예요'라고 말하면 성장 스토리가 돼요."
- 다른 스타일로 바꾸고 싶으면 3~4단계만 다시 한다("오피스 테마 네온으로 바꿔줘").

## 지켜야 할 경계

- 에이전트 생성·삭제·설정 변경 없음. `openclaw agents list --json` 읽기만.
- inbox 밖 PC 경로에 쓰지 않는다(전송은 dashboard-builder 가 담당).
- 채용 예정 포지션은 사용자가 확인한 것만 그린다. 추측으로 직책을 지어내지 않는다.
