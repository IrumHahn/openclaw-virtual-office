# openclaw-virtual-office — 팀이 앉아 있는 내 가상 사무실

OpenClaw 에이전트 팀을 **아이소메트릭 가상 오피스 그림**으로 만들어 개인 대시보드 홈 「나의 위젯」에 띄우는 스킬. 직원은 책상에 앉고, 업무 지도에서 뽑은 **앞으로 필요한 포지션**은 빈 책상에 "채용 예정"으로 표시된다 — 회사가 커질 모습을 미리 셋업한 사무실.

- 스타일 4종: 코지 베이지 · 화이트 아틀리에 · 레트로 픽셀 · 네온 관제실
- 성장 단계 3종: 지금(책상 4) · 6개월 뒤(12) · 2년 뒤(20, 부서 구역)
- 의존성 0(Node 18+). 외부 폰트·이미지·스크립트 없음 — 대시보드 위젯 격리 칸에서 그대로 열린다.
- **시안 5종(v3)**: `web/index.html` 허브 → `diorama.html`(3D 미니어처+라디오) · `saas.html`(구역 칩 SaaS) · `rpg.html`(게임 UI) · `control.html`(관제 HUD) · `building.html`(5층 단면). 공용 엔진 `web/engine.js`+`engine.css`, 앵커 `web/maps-v3.js`. 운영: https://run-academy.pages.dev/agent-tools-office/
- (구) 스타일 전환 비교 v2: [`web/`](web/) — 컨셉 템플릿 5종(뜨개 코지 · 모던 스튜디오 3D 치비 · 레트로 RPG 16비트 · 네온 관제실 로봇 · 보헤미안). 컨셉마다 AI 생성 배경(`web/bg/`)과 정면·측면·뒷면 캐릭터 세트 12종(`web/chars/<set>/`)이 따로 있고, 직원들은 통로 그래프(`web/maps.js`)만 따라 걷는다. 운영 시안: https://run-academy.pages.dev/agent-tools-office/
- (구) SVG 절차 렌더러 시안: `samples/index.html` — 라이브 엔진으로 교체 예정. 스킬(`skill/virtual-office`)도 라이브 엔진 기준으로 재작성 예정.

```
agents list + team.json + my-work-map.md → collect_org.mjs → org.json → (옵션 번호 선택) → build_office.mjs → widget.html · office.html
                                                                                                 └ dashboard-builder --widget 로 PC 홈에 도착
```

## 설치 (OpenClaw 2026.10 기준)

```bash
cd ~ && git clone https://github.com/IrumHahn/openclaw-virtual-office.git
openclaw skills install ./openclaw-virtual-office/skill/virtual-office --as virtual-office --force --agent main
openclaw skills list | grep virtual-office     # ready 가 보이면 성공 → 새 세션
```

그다음 에이전트 채팅에서:

```
가상 오피스 만들어줘. 내 업무 지도(my-work-map.md)와 팀(team.json)을 보고 지금 직원과 앞으로 필요한 자리를 먼저 표로 보여주고,
스타일·성장 단계 옵션을 번호로 보여줘. 내가 고르면 만들어서 대시보드 홈 위젯으로 보내줘. 허용 창이 몇 번 뜰지 미리 알려줘.
```

홈에 띄우려면 [openclaw-personal-dashboard](https://github.com/IrumHahn/openclaw-personal-dashboard)(dashboard-builder 스킬 + PC 앱)가 먼저 있어야 한다. 없으면 `office.html` 을 브라우저로 열면 된다.

## 직접 돌려 보기

```bash
node skill/virtual-office/scripts/build_office.mjs --list
node skill/virtual-office/scripts/build_office.mjs --org samples/macmini-org.json --style night --stage floor --out ./out
open out/office.html
node scripts/build_samples.mjs            # samples/index.html 다시 만들기
node --test tests/*.test.mjs              # 테스트 12개
```

## 구성

- `skill/virtual-office/` — 설치 단위. `SKILL.md` 절차 · `scripts/collect_org.mjs`(재료 → org.json) · `scripts/build_office.mjs`(org + 옵션 → HTML) · `scripts/lib/render.mjs`(순수 렌더러, 브라우저 공용) · `references/options.md`(옵션·좌석 규칙·org.json) · `references/positions.md`(채용 예정 추출 규칙)
- `samples/` — 샘플 조직(`macmini-org.json`, 실제 운영 중인 팀의 이름·역할) + 시안 페이지
- `tests/` — 렌더·수집·빌드 테스트, 가짜 OpenClaw CLI
- `docs/quickstart-ko.md` — 수강생용 5분 안내

## 경계

에이전트를 만들거나 바꾸지 않는다(`agents list` 읽기만). PC 의 inbox 밖에 쓰지 않는다(전송은 dashboard-builder). 비밀값이 든 파일은 거부한다. "채용 예정"은 그림이며 실제 채용은 `agent-team-onboarding` 스킬로 한다.

## 라이선스

MIT. 샘플의 회사·직원 이름은 제작자 본인 팀이며 개인정보·토큰은 없다.
