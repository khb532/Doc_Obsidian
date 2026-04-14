const pptxgen = require("pptxgenjs");

const pres = new pptxgen();
pres.layout = "LAYOUT_16x9";
pres.author = "Dove9";
pres.title = "UE_ReNe Portfolio";

// ─── 팔레트 ───────────────────────────────────────────────
const C = {
  bg:       "0F1923",   // 다크 네이비
  bgLight:  "F4F6F8",   // 연 오프화이트 (콘텐츠 슬라이드)
  accent:   "00BFA6",   // 민트 그린
  accent2:  "0A7CFF",   // 블루
  card:     "1A2740",   // 카드 배경
  title:    "FFFFFF",
  body:     "E0E6EF",
  muted:    "7A8FA6",
  dark:     "0F1923",
  black:    "000000",
};

const makeShadow = () => ({ type: "outer", color: "000000", blur: 8, offset: 3, angle: 135, opacity: 0.18 });

// ─── 헬퍼 ─────────────────────────────────────────────────
function addDarkSlide(slide) {
  slide.background = { color: C.bg };
}
function addLightSlide(slide) {
  slide.background = { color: C.bgLight };
}

// 상단 민트 액센트 바
function accentBar(slide, w = 10) {
  slide.addShape(pres.shapes.RECTANGLE, {
    x: 0, y: 0, w: w, h: 0.06, fill: { color: C.accent }, line: { color: C.accent }
  });
}

// 섹션 번호 뱃지 (다크)
function badge(slide, label, x, y) {
  slide.addShape(pres.shapes.RECTANGLE, {
    x, y, w: 0.55, h: 0.3,
    fill: { color: C.accent }, line: { color: C.accent }
  });
  slide.addText(label, {
    x, y, w: 0.55, h: 0.3,
    fontSize: 9, bold: true, color: C.bg, align: "center", valign: "middle", margin: 0
  });
}

// 카드 블록
function card(slide, x, y, w, h) {
  slide.addShape(pres.shapes.RECTANGLE, {
    x, y, w, h,
    fill: { color: C.card },
    line: { color: "243550", width: 1 },
    shadow: makeShadow()
  });
}

// 라이트 배경용 카드
function lightCard(slide, x, y, w, h) {
  slide.addShape(pres.shapes.RECTANGLE, {
    x, y, w, h,
    fill: { color: "FFFFFF" },
    line: { color: "D8E0EA", width: 1 },
    shadow: makeShadow()
  });
}

// 왼쪽 액센트 세로 바가 있는 카드
function accentCard(slide, x, y, w, h, dark = true) {
  const bg = dark ? C.card : "FFFFFF";
  const border = dark ? "243550" : "D8E0EA";
  slide.addShape(pres.shapes.RECTANGLE, { x, y, w, h, fill: { color: bg }, line: { color: border, width: 1 }, shadow: makeShadow() });
  slide.addShape(pres.shapes.RECTANGLE, { x, y, w: 0.05, h, fill: { color: C.accent }, line: { color: C.accent } });
}

// ══════════════════════════════════════════════════════════════
// SLIDE 1 — 표지
// ══════════════════════════════════════════════════════════════
{
  const s = pres.addSlide();
  addDarkSlide(s);

  // 배경 대각 장식 사각형
  s.addShape(pres.shapes.RECTANGLE, {
    x: 6.5, y: -0.5, w: 5, h: 7.5, rotate: 12,
    fill: { color: C.accent, transparency: 88 }, line: { color: C.accent, transparency: 88 }
  });
  s.addShape(pres.shapes.RECTANGLE, {
    x: 7.5, y: 0, w: 3, h: 6, rotate: 12,
    fill: { color: C.accent2, transparency: 91 }, line: { color: C.accent2, transparency: 91 }
  });

  // 민트 상단 바
  s.addShape(pres.shapes.RECTANGLE, { x: 0, y: 0, w: 4.8, h: 0.07, fill: { color: C.accent }, line: { color: C.accent } });

  // 태그라인
  s.addText("PORTFOLIO  ·  Unreal Engine 5 Developer", {
    x: 0.55, y: 0.6, w: 6, h: 0.35,
    fontSize: 9, bold: false, color: C.accent, charSpacing: 3, margin: 0
  });

  // 메인 타이틀
  s.addText("UE_ReNe", {
    x: 0.5, y: 1.1, w: 8, h: 1.4,
    fontSize: 64, bold: true, color: C.title, fontFace: "Segoe UI", margin: 0
  });

  // 서브 타이틀
  s.addText("AI 기반 메타버스 채용 면접 플랫폼", {
    x: 0.5, y: 2.5, w: 8, h: 0.55,
    fontSize: 20, bold: false, color: C.body, fontFace: "Segoe UI", margin: 0
  });

  // 구분선
  s.addShape(pres.shapes.LINE, { x: 0.5, y: 3.2, w: 3.5, h: 0, line: { color: C.accent, width: 1.5 } });

  // 정보 열
  const infoItems = [
    ["역할", "UE팀 — 클라이언트 전담"],
    ["기간", "2025.11 ~ 2026.01"],
    ["엔진", "Unreal Engine 5  ·  C++"],
    ["협업", "GitHub  ·  팀 2개 파트"],
  ];
  infoItems.forEach(([label, val], i) => {
    const y = 3.45 + i * 0.42;
    s.addText(label, { x: 0.5, y, w: 1.2, h: 0.35, fontSize: 10, bold: true, color: C.accent, margin: 0 });
    s.addText(val,   { x: 1.75, y, w: 5,   h: 0.35, fontSize: 10, color: C.body, margin: 0 });
  });

  // 담당자
  s.addText("Dove9 (khb532)", {
    x: 0.5, y: 5.1, w: 5, h: 0.35,
    fontSize: 11, bold: true, color: C.muted, margin: 0
  });
}

// ══════════════════════════════════════════════════════════════
// SLIDE 2 — 프로젝트 개요 & 팀 구성
// ══════════════════════════════════════════════════════════════
{
  const s = pres.addSlide();
  addDarkSlide(s);
  accentBar(s);

  s.addText("프로젝트 개요", {
    x: 0.5, y: 0.2, w: 9, h: 0.55,
    fontSize: 26, bold: true, color: C.title, margin: 0
  });

  // 프로젝트 설명 카드
  accentCard(s, 0.4, 0.95, 9.2, 1.0);
  s.addText("UE_ReNe는 구직자와 채용 기업이 언리얼 엔진 5 기반 메타버스 공간에서 만나\nAI 면접 또는 1:1 실시간 음성 면접을 진행할 수 있는 팀 협업 프로젝트입니다.", {
    x: 0.6, y: 1.0, w: 8.8, h: 0.85,
    fontSize: 13, color: C.body, margin: 0
  });

  // 팀 구성 두 카드
  // AI 팀
  card(s, 0.4, 2.12, 4.35, 1.85);
  s.addText("AI 팀", { x: 0.55, y: 2.2, w: 4, h: 0.35, fontSize: 13, bold: true, color: C.accent, margin: 0 });
  const aiItems = ["AI 면접 서버 구축", "STT / TTS 파이프라인", "면접 결과 분석 백엔드"];
  aiItems.forEach((t, i) => {
    s.addText([{ text: t, options: { bullet: true } }], {
      x: 0.65, y: 2.58 + i * 0.38, w: 3.9, h: 0.35, fontSize: 11, color: C.body, margin: 0
    });
  });

  // UE 팀 (나)
  card(s, 5.25, 2.12, 4.35, 1.85);
  // 강조 표시
  s.addShape(pres.shapes.RECTANGLE, { x: 5.25, y: 2.12, w: 4.35, h: 0.06, fill: { color: C.accent }, line: { color: C.accent } });
  s.addText("UE 팀  (내 담당)", { x: 5.4, y: 2.2, w: 4, h: 0.35, fontSize: 13, bold: true, color: C.accent, margin: 0 });
  const ueItems = ["PlayerController 시스템 전체", "UMG 위젯 UI 구현", "HTTP 통신 컴포넌트", "음성 녹음 & 전송 시스템", "AI 면접 플로우 연동"];
  ueItems.forEach((t, i) => {
    s.addText([{ text: t, options: { bullet: true } }], {
      x: 5.4, y: 2.58 + i * 0.3, w: 4.0, h: 0.28, fontSize: 10.5, color: C.body, margin: 0
    });
  });

  // 기술 스택 행
  const techs = ["Unreal Engine 5", "C++", "UMG / Slate", "Enhanced Input", "HTTP Module", "Voice Module", "Git"];
  const startX = 0.4;
  const itemW = 1.3;
  techs.forEach((t, i) => {
    const x = startX + i * (itemW + 0.04);
    s.addShape(pres.shapes.RECTANGLE, { x, y: 4.2, w: itemW, h: 0.38, fill: { color: "1F3454" }, line: { color: C.accent2, width: 1 } });
    s.addText(t, { x, y: 4.2, w: itemW, h: 0.38, fontSize: 9, bold: true, color: C.accent2, align: "center", valign: "middle", margin: 0 });
  });

  s.addText("기술 스택", { x: 0.4, y: 4.0, w: 3, h: 0.22, fontSize: 9, color: C.muted, margin: 0 });
}

// ══════════════════════════════════════════════════════════════
// SLIDE 3 — PlayerController 아키텍처
// ══════════════════════════════════════════════════════════════
{
  const s = pres.addSlide();
  addDarkSlide(s);
  accentBar(s);
  badge(s, "01", 0.4, 0.18);

  s.addText("PlayerController 아키텍처", {
    x: 1.05, y: 0.12, w: 8.5, h: 0.5,
    fontSize: 22, bold: true, color: C.title, margin: 0
  });
  s.addText("ARene_PlayerController — UI & 네트워크 & 입력의 중앙 허브", {
    x: 1.05, y: 0.6, w: 8.5, h: 0.3,
    fontSize: 11, color: C.muted, margin: 0
  });

  // 6개 기능 카드 (3x2)
  const features = [
    { title: "UI 생명주기 관리",    desc: "HUD / 인포데스크 / 역할별 UI를\nPlayerController가 중앙 관리.\n생성 인스턴스 재사용으로 최적화." },
    { title: "멀티플레이어 RPC",    desc: "Server → Client RPC 체인으로\n올바른 클라이언트에만 UI 전달.\nHasAuthority 3중 체크 적용." },
    { title: "카메라 전환 시스템",  desc: "태그 기반 카메라 액터 런타임 탐색.\nSetViewTargetWithBlend()로\n부드러운 씬 전환." },
    { title: "Host 근접 감지",     desc: "Tick 기반 거리 체크(임계 200u).\n이동 중·착석 중 상태 복합 판단.\n자동 팝업 UI 생성/제거." },
    { title: "Enhanced Input",    desc: "IMC_Common + IA_Menu 연동.\nPush-to-Talk 입력 처리.\nStarted / Completed 이벤트 분리." },
    { title: "유저 데이터 동기화", desc: "BeginPlay에서 GameInstance 캐시\n→ PlayerState 동기화.\nHost직접/Client RPC 경로 분기." },
  ];

  features.forEach((f, i) => {
    const col = i % 3;
    const row = Math.floor(i / 3);
    const x = 0.35 + col * 3.12;
    const y = 1.05 + row * 2.1;
    accentCard(s, x, y, 2.9, 1.9);
    s.addText(f.title, { x: x + 0.15, y: y + 0.12, w: 2.6, h: 0.38, fontSize: 11.5, bold: true, color: C.accent, margin: 0 });
    s.addText(f.desc,  { x: x + 0.15, y: y + 0.52, w: 2.65, h: 1.28, fontSize: 9.5, color: C.body, margin: 0 });
  });
}

// ══════════════════════════════════════════════════════════════
// SLIDE 4 — UI 시스템 전체 구조
// ══════════════════════════════════════════════════════════════
{
  const s = pres.addSlide();
  addDarkSlide(s);
  accentBar(s);
  badge(s, "02", 0.4, 0.18);

  s.addText("UI 시스템 전체 구조", {
    x: 1.05, y: 0.12, w: 8.5, h: 0.5,
    fontSize: 22, bold: true, color: C.title, margin: 0
  });

  // 왼쪽 — 위젯 목록
  const widgets = [
    ["Rene_HUD",                   "메인 HUD — WidgetSwitcher로 상태 전환"],
    ["Rene_SelectMeetingWidget",    "면접 방식 선택 (AI / 1:1 사람)"],
    ["Rene_InterviewWidget",        "AI 면접 진행 화면 · 자막 · PTT 표시"],
    ["Rene_HostSitWidget",          "Host 착석 확인 팝업 · 카메라 전환"],
    ["Rene_ProfileWidget",          "유저 프로필 · 서류 업로드 진입"],
    ["Rene_UploadingPopupWidget",   "업로드 상태 팝업 — 3상태 머신"],
    ["Rene_WebViewWidget",          "AI 결과 리포트 인게임 웹뷰"],
  ];

  card(s, 0.35, 0.85, 5.5, 4.5);
  s.addText("구현 위젯 목록", { x: 0.5, y: 0.9, w: 5, h: 0.35, fontSize: 12, bold: true, color: C.accent, margin: 0 });

  widgets.forEach(([name, desc], i) => {
    const y = 1.32 + i * 0.56;
    s.addShape(pres.shapes.RECTANGLE, { x: 0.5, y, w: 0.04, h: 0.32, fill: { color: C.accent }, line: { color: C.accent } });
    s.addText(name, { x: 0.65, y, w: 3.2, h: 0.3, fontSize: 10, bold: true, color: "A8DFDA", margin: 0 });
    s.addText(desc, { x: 0.65, y: y + 0.24, w: 5.0, h: 0.26, fontSize: 8.5, color: C.muted, margin: 0 });
  });

  // 오른쪽 — 설계 포인트 카드들
  const points = [
    { label: "인스턴스 재사용", body: "HUD는 생성 후 캐싱, 중복 생성 방지.\n표시/숨김만으로 성능 유지." },
    { label: "역할 분기 UI",   body: "Host → Company_Widget\nClient → Seeker_Widget 자동 분리." },
    { label: "상태 머신 팝업", body: "UploadingPopup: 업로드/완료/에러\n3상태를 WidgetSwitcher로 전환." },
    { label: "중복 바인딩 방지", body: "NativeConstruct에서 RemoveDynamic\n→ AddDynamic 패턴 일관 적용." },
  ];
  points.forEach((p, i) => {
    const y = 0.85 + i * 1.12;
    accentCard(s, 6.05, y, 3.6, 1.0);
    s.addText(p.label, { x: 6.2, y: y + 0.08, w: 3.3, h: 0.3, fontSize: 11, bold: true, color: C.accent, margin: 0 });
    s.addText(p.body,  { x: 6.2, y: y + 0.4,  w: 3.35, h: 0.55, fontSize: 9.5, color: C.body, margin: 0 });
  });
}

// ══════════════════════════════════════════════════════════════
// SLIDE 5 — 네트워크 & 음성 통신 시스템
// ══════════════════════════════════════════════════════════════
{
  const s = pres.addSlide();
  addDarkSlide(s);
  accentBar(s);
  badge(s, "03", 0.4, 0.18);

  s.addText("네트워크 & 음성 통신 시스템", {
    x: 1.05, y: 0.12, w: 8.5, h: 0.5,
    fontSize: 22, bold: true, color: C.title, margin: 0
  });

  // 3개 컴포넌트 카드
  const comps = [
    {
      name: "Rene_FileUploader",
      sub: "서류 파일 업로드 컴포넌트",
      points: [
        "Multipart/form-data 바디 수동 조립",
        "플레이어명 + 타임스탬프 파일명 자동 생성",
        "역할별 엔드포인트 분기 (기업 / 구직자)",
        "OnSuccess / OnFailure 델리게이트 이벤트",
        "DataTable 기반 URL 런타임 관리"
      ]
    },
    {
      name: "Rene_LocalVoiceRecorder",
      sub: "음성 녹음 & AI 전송 컴포넌트",
      points: [
        "IVoiceCapture 인터페이스로 OS 마이크 캡처",
        "20ms 타이머 폴링 — PCM 실시간 누적",
        "FScopeLock 쓰레드 안전 버퍼 관리",
        "발화 역할(company/seeker) 자동 태깅",
        "AI 응답 JSON 파싱 → 자막 / 음성 / 결과 분리"
      ]
    },
    {
      name: "Rene_AIInterviewNetworkManager",
      sub: "AI 면접 HTTP 매니저",
      points: [
        "캐싱 + 지연 전송 패턴으로 타이밍 동기화",
        "이동 완료 시점에 HTTP POST 전송",
        "JSON: jobseeker_id / company_id / job_group_id",
        "세션 ID 획득 → PlayerController 저장",
        "초기 AI 음성(Base64) → 즉시 재생 연동"
      ]
    }
  ];

  comps.forEach((c, i) => {
    const x = 0.3 + i * 3.23;
    card(s, x, 0.85, 3.1, 4.5);
    s.addShape(pres.shapes.RECTANGLE, { x, y: 0.85, w: 3.1, h: 0.06, fill: { color: C.accent }, line: { color: C.accent } });
    s.addText(c.name, { x: x + 0.12, y: 0.95, w: 2.9, h: 0.38, fontSize: 10.5, bold: true, color: C.accent, margin: 0 });
    s.addText(c.sub,  { x: x + 0.12, y: 1.33, w: 2.9, h: 0.26, fontSize: 8.5, italic: true, color: C.muted, margin: 0 });
    c.points.forEach((p, j) => {
      s.addText([{ text: p, options: { bullet: true } }], {
        x: x + 0.12, y: 1.65 + j * 0.68, w: 2.82, h: 0.58,
        fontSize: 9.5, color: C.body, margin: 0
      });
    });
  });
}

// ══════════════════════════════════════════════════════════════
// SLIDE 6 — AI 면접 전체 플로우
// ══════════════════════════════════════════════════════════════
{
  const s = pres.addSlide();
  addDarkSlide(s);
  accentBar(s);
  badge(s, "04", 0.4, 0.18);

  s.addText("AI 면접 전체 플로우", {
    x: 1.05, y: 0.12, w: 8.5, h: 0.5,
    fontSize: 22, bold: true, color: C.title, margin: 0
  });

  // 플로우 스텝
  const steps = [
    { n: "1", title: "면접 선택",          desc: "SelectMeetingWidget에서 AI 면접 클릭\n→ GameState 순회로 Host 기업 정보 자동 탐색\n→ PlayerController에 요청 위임" },
    { n: "2", title: "이동 & 캐싱",        desc: "NavMesh 자동이동 시작\n→ AIInterviewManager에 요청 데이터 캐싱\n(이동 완료 전 HTTP 전송 방지)" },
    { n: "3", title: "HTTP 요청 전송",     desc: "이동·착석 완료 → ShowInterviewWidget()\n→ SendCachedRequest() 호출\nPOST: jobseeker_id / company_id / job_group_id" },
    { n: "4", title: "AI 응답 수신",       desc: "session_id + ai_message + ai_audio_base64\n→ 세션 ID 저장 / 자막 표시 / 음성 재생\n→ 인터뷰 카메라 전환" },
    { n: "5", title: "음성 대화 루프",     desc: "PTT 버튼 → PCM 녹음 시작\n→ 버튼 해제: 업로드 → AI 응답 수신\n→ 자막 갱신 / 음성 재생 반복" },
    { n: "6", title: "종료 & 결과",        desc: "ForceEnd 요청 → result_id 수신\n→ Server RPC로 PlayerState 저장\n→ WebView로 AI 리포트 페이지 표시" },
  ];

  steps.forEach((st, i) => {
    const col = i % 3;
    const row = Math.floor(i / 3);
    const x = 0.35 + col * 3.2;
    const y = 0.85 + row * 2.2;
    const w = 3.0, h = 2.05;

    // 카드
    s.addShape(pres.shapes.RECTANGLE, { x, y, w, h, fill: { color: C.card }, line: { color: "243550", width: 1 }, shadow: makeShadow() });

    // 번호 원
    s.addShape(pres.shapes.OVAL, { x: x + 0.12, y: y + 0.1, w: 0.4, h: 0.4, fill: { color: C.accent }, line: { color: C.accent } });
    s.addText(st.n, { x: x + 0.12, y: y + 0.1, w: 0.4, h: 0.4, fontSize: 11, bold: true, color: C.bg, align: "center", valign: "middle", margin: 0 });

    s.addText(st.title, { x: x + 0.62, y: y + 0.12, w: 2.3, h: 0.38, fontSize: 11.5, bold: true, color: C.accent, margin: 0 });
    s.addText(st.desc,  { x: x + 0.15, y: y + 0.58, w: 2.75, h: 1.38, fontSize: 9.5, color: C.body, margin: 0 });

    // 화살표 (오른쪽으로)
    if (col < 2) {
      s.addShape(pres.shapes.LINE, {
        x: x + w, y: y + h / 2,
        w: 0.2, h: 0,
        line: { color: C.accent, width: 1.5 }
      });
    }
  });
}

// ══════════════════════════════════════════════════════════════
// SLIDE 7 — 기술적 도전과 해결  (재설계: 세로 4행 레이아웃)
// ══════════════════════════════════════════════════════════════
{
  const s = pres.addSlide();
  addDarkSlide(s);
  accentBar(s);
  badge(s, "05", 0.4, 0.18);

  s.addText("기술적 도전과 해결", {
    x: 1.05, y: 0.12, w: 8.5, h: 0.5,
    fontSize: 22, bold: true, color: C.title, margin: 0
  });

  const challenges = [
    {
      problem: "이동-HTTP 타이밍 불일치",
      solution: "캐싱 + 지연 전송 패턴",
      detail: "AI 면접 시작 시 HTTP 요청을 즉시 보내면, 이동 완료 전 응답이 도착해 UI가 잘못된 시점에 표시.\n→ AIInterviewNetworkManager에 데이터 캐싱 후, 캐릭터가 착석 완료 시점에 SendCachedRequest() 호출하여 동기화."
    },
    {
      problem: "위젯 미생성 시 초기 AI 메시지 소실",
      solution: "CachedInitialAIMessage 변수 캐싱",
      detail: "서버 응답이 빠를 경우 InterviewWidget 생성 전에 DisplayInitialAIMessage()가 호출되어 자막이 표시되지 않음.\n→ 멤버 변수에 메시지 임시 저장 → 위젯 생성 직후 캐시 확인 후 자막 갱신 및 초기화."
    },
    {
      problem: "멀티플레이어 UI 권한 오표시",
      solution: "3중 Authority 체크 + RPC 체인",
      detail: "Host/Client가 동일 PlayerController를 공유하므로, 잘못된 쪽에 UI가 생성될 위험.\n→ HasAuthority() + IsLocalPlayerController() + IsLocalController() 3중 체크. Server→Client RPC 체인으로 올바른 대상에만 UI 전달."
    },
    {
      problem: "Multipart 바이너리 수동 조립",
      solution: "TArray<uint8> 바이트 직접 구성",
      detail: "UE HTTP Module은 multipart/form-data 바디를 자동 생성하지 않아 파일 업로드 불가.\n→ 바운더리 문자열, Content-Disposition 헤더, 파일 바이트를 uint8 배열에 직접 조립하여 완전한 요청 구성."
    },
  ];

  challenges.forEach((ch, i) => {
    const y = 0.82 + i * 1.17;
    const cardH = 1.1;

    // 카드 배경
    s.addShape(pres.shapes.RECTANGLE, {
      x: 0.35, y, w: 9.3, h: cardH,
      fill: { color: C.card }, line: { color: "243550", width: 1 }, shadow: makeShadow()
    });
    // 좌측 강조 바
    s.addShape(pres.shapes.RECTANGLE, { x: 0.35, y, w: 0.06, h: cardH, fill: { color: C.accent2 }, line: { color: C.accent2 } });

    // PROBLEM 뱃지
    s.addShape(pres.shapes.RECTANGLE, { x: 0.52, y: y + 0.1, w: 1.1, h: 0.26, fill: { color: "1A3A5C" }, line: { color: C.accent2, width: 1 } });
    s.addText("PROBLEM", { x: 0.52, y: y + 0.1, w: 1.1, h: 0.26, fontSize: 8, bold: true, color: C.accent2, align: "center", valign: "middle", margin: 0 });

    // 문제 제목
    s.addText(ch.problem, { x: 1.72, y: y + 0.1, w: 3.5, h: 0.3, fontSize: 13, bold: true, color: C.title, margin: 0 });

    // SOLUTION 뱃지
    s.addShape(pres.shapes.RECTANGLE, { x: 0.52, y: y + 0.45, w: 1.1, h: 0.26, fill: { color: "0A2E20" }, line: { color: C.accent, width: 1 } });
    s.addText("SOLUTION", { x: 0.52, y: y + 0.45, w: 1.1, h: 0.26, fontSize: 8, bold: true, color: C.accent, align: "center", valign: "middle", margin: 0 });

    // 해결 제목
    s.addText(ch.solution, { x: 1.72, y: y + 0.45, w: 3.5, h: 0.28, fontSize: 12, bold: true, color: C.accent, margin: 0 });

    // 세로 구분선
    s.addShape(pres.shapes.LINE, { x: 5.4, y: y + 0.12, w: 0, h: cardH - 0.24, line: { color: "2E4060", width: 1 } });

    // 설명 텍스트 (오른쪽)
    s.addText(ch.detail, { x: 5.55, y: y + 0.1, w: 4.0, h: cardH - 0.2, fontSize: 10, color: C.body, margin: 0 });
  });
}

// ══════════════════════════════════════════════════════════════
// SLIDE 8 — 핵심 역량 어필
// ══════════════════════════════════════════════════════════════
{
  const s = pres.addSlide();
  addDarkSlide(s);
  accentBar(s);
  badge(s, "06", 0.4, 0.18);

  s.addText("핵심 개발 역량", {
    x: 1.05, y: 0.12, w: 8.5, h: 0.5,
    fontSize: 22, bold: true, color: C.title, margin: 0
  });

  const skills = [
    {
      icon: "🏗",
      title: "시스템 설계 능력",
      items: [
        "PlayerController를 UI/네트워크/입력의 중앙 허브로 설계",
        "컴포넌트 분리 (FileUploader, VoiceRecorder, AIManager)",
        "역할 기반 분기 구조 — 기업 / 구직자 UI 자동 분리",
      ]
    },
    {
      icon: "🌐",
      title: "네트워크 & HTTP 통신",
      items: [
        "Multipart/form-data 바이너리 수동 구성 (파일 업로드)",
        "JSON REST 직렬화/역직렬화 (AI 면접 세션 관리)",
        "비동기 HTTP 패턴 + 델리게이트 이벤트 체인",
      ]
    },
    {
      icon: "🎮",
      title: "멀티플레이어 구현",
      items: [
        "Server/Client RPC 체인 설계로 올바른 대상에 UI 전달",
        "HasAuthority 기반 3중 체크로 권한 오류 방지",
        "PlayerState 복제를 활용한 결과 ID 동기화",
      ]
    },
    {
      icon: "🔊",
      title: "음성 입출력 처리",
      items: [
        "IVoiceCapture로 OS 마이크 PCM 데이터 실시간 캡처",
        "20ms 타이머 폴링 + FScopeLock 쓰레드 안전 구현",
        "AI 응답 Base64 오디오 디코딩 → 인게임 재생 연동",
      ]
    },
    {
      icon: "⚡",
      title: "타이밍 & 비동기 문제 해결",
      items: [
        "캐싱+지연 전송 패턴으로 이동-HTTP 타이밍 동기화",
        "초기 AI 메시지 캐싱으로 위젯 미생성 상황 대응",
        "FTimerHandle 기반 지연 처리 및 중복 방지",
      ]
    },
    {
      icon: "🖥",
      title: "UMG UI 시스템",
      items: [
        "WidgetSwitcher 기반 상태 머신 (업로드 3단계 등)",
        "중복 바인딩 방지 패턴 일관 적용",
        "인게임 웹 브라우저(WebBrowser)로 AI 결과 표시",
      ]
    },
  ];

  skills.forEach((sk, i) => {
    const col = i % 3;
    const row = Math.floor(i / 3);
    const x = 0.32 + col * 3.22;
    const y = 0.85 + row * 2.25;
    const w = 3.05, h = 2.1;

    s.addShape(pres.shapes.RECTANGLE, { x, y, w, h, fill: { color: C.card }, line: { color: "243550", width: 1 }, shadow: makeShadow() });
    s.addShape(pres.shapes.RECTANGLE, { x, y, w: 0.05, h, fill: { color: C.accent }, line: { color: C.accent } });

    s.addText(sk.icon + "  " + sk.title, { x: x + 0.15, y: y + 0.1, w: 2.8, h: 0.38, fontSize: 11.5, bold: true, color: C.accent, margin: 0 });
    sk.items.forEach((item, j) => {
      s.addText([{ text: item, options: { bullet: true } }], {
        x: x + 0.15, y: y + 0.54 + j * 0.5, w: 2.8, h: 0.46,
        fontSize: 9.5, color: C.body, margin: 0
      });
    });
  });
}

// ══════════════════════════════════════════════════════════════
// SLIDE 9 — 커밋 이력 & 성과
// ══════════════════════════════════════════════════════════════
{
  const s = pres.addSlide();
  addDarkSlide(s);
  accentBar(s);
  badge(s, "07", 0.4, 0.18);

  s.addText("개발 이력 & 성과", {
    x: 1.05, y: 0.12, w: 8.5, h: 0.5,
    fontSize: 22, bold: true, color: C.title, margin: 0
  });

  // 왼쪽 — 타임라인
  const timeline = [
    { date: "2025.11", label: "프로젝트 초기 설정 · Git 구성" },
    { date: "2025.12 초", label: "인게임 UI 호출 시스템 구현\nWeb Browser 위젯 추가" },
    { date: "2025.12 중", label: "프로필/서류 UI · Meeting UI 플로우\nRPC 구조 설계 & 수정" },
    { date: "2026.01.02", label: "HUD 위젯 C++ 구현 시작" },
    { date: "2026.01.03", label: "NavMesh 자동이동 + 착석 UI 연동" },
    { date: "2026.01.04", label: "Beta 시연용 최소 UI 완성\n(HUD, 인포데스크, SelectMeeting)" },
    { date: "2026.01.06~07", label: "폰트 에셋 교체 · 한글화\n아이콘/스플래시 적용 · 버튼 정상화" },
    { date: "2026.01.08", label: "업로드 팝업 UI 완성 + RPC 수정\n최종 머지" },
  ];

  card(s, 0.35, 0.85, 4.8, 4.55);
  s.addText("커밋 타임라인", { x: 0.5, y: 0.9, w: 4, h: 0.32, fontSize: 11, bold: true, color: C.accent, margin: 0 });

  timeline.forEach((t, i) => {
    const y = 1.32 + i * 0.5;
    // 날짜 원
    s.addShape(pres.shapes.OVAL, { x: 0.5, y: y + 0.04, w: 0.2, h: 0.2, fill: { color: C.accent }, line: { color: C.accent } });
    // 세로선
    if (i < timeline.length - 1) {
      s.addShape(pres.shapes.LINE, { x: 0.595, y: y + 0.24, w: 0, h: 0.3, line: { color: "3A5070", width: 1 } });
    }
    s.addText(t.date, { x: 0.78, y, w: 1.35, h: 0.28, fontSize: 8.5, bold: true, color: C.accent, margin: 0 });
    s.addText(t.label, { x: 2.18, y, w: 2.8, h: 0.42, fontSize: 8.5, color: C.body, margin: 0 });
  });

  // 오른쪽 — 숫자 카드 + 구현 목록
  const stats = [
    { num: "11+", label: "구현 위젯 클래스" },
    { num: "3",   label: "네트워크 컴포넌트" },
    { num: "15+", label: "Server/Client RPC" },
  ];
  stats.forEach((st, i) => {
    const x = 5.35 + i * 1.6;
    card(s, x, 0.85, 1.45, 1.2);
    s.addText(st.num,   { x, y: 0.95, w: 1.45, h: 0.7, fontSize: 32, bold: true, color: C.accent, align: "center", margin: 0 });
    s.addText(st.label, { x, y: 1.65, w: 1.45, h: 0.32, fontSize: 8, color: C.muted, align: "center", margin: 0 });
  });

  // 구현 목록
  const achiev = [
    "PlayerController 중앙 UI 관리 시스템 설계 & 구현",
    "Multipart 바이너리 수동 조립 파일 업로드 구현",
    "PCM 음성 실시간 캡처 & AI 서버 전송 파이프라인",
    "이동-HTTP 타이밍 동기화 캐싱 패턴 설계",
    "AI 면접 전 플로우 (선택 → 이동 → 세션 → 결과) 구현",
    "인게임 WebView AI 결과 리포트 표시",
    "멀티플레이어 RPC 체인 기반 역할 분리 UI",
  ];

  card(s, 5.25, 2.22, 4.4, 3.18);
  s.addText("구현 성과", { x: 5.4, y: 2.28, w: 4, h: 0.32, fontSize: 11, bold: true, color: C.accent, margin: 0 });

  achiev.forEach((a, i) => {
    s.addText([{ text: a, options: { bullet: true } }], {
      x: 5.4, y: 2.66 + i * 0.38, w: 4.1, h: 0.34,
      fontSize: 9.5, color: C.body, margin: 0
    });
  });
}

// ══════════════════════════════════════════════════════════════
// SLIDE 10 — 마무리
// ══════════════════════════════════════════════════════════════
{
  const s = pres.addSlide();
  addDarkSlide(s);

  // 대각 장식
  s.addShape(pres.shapes.RECTANGLE, {
    x: -1, y: 3.5, w: 8, h: 5, rotate: 15,
    fill: { color: C.accent, transparency: 90 }, line: { color: C.accent, transparency: 90 }
  });

  // 상단 바
  s.addShape(pres.shapes.RECTANGLE, { x: 0, y: 0, w: 10, h: 0.07, fill: { color: C.accent }, line: { color: C.accent } });
  // 하단 바
  s.addShape(pres.shapes.RECTANGLE, { x: 0, y: 5.55, w: 10, h: 0.07, fill: { color: C.accent }, line: { color: C.accent } });

  s.addText("감사합니다", {
    x: 0.5, y: 1.3, w: 9, h: 1.1,
    fontSize: 52, bold: true, color: C.title, align: "center", margin: 0
  });

  s.addText("UE_ReNe — AI 기반 메타버스 채용 면접 플랫폼", {
    x: 0.5, y: 2.45, w: 9, h: 0.45,
    fontSize: 15, color: C.muted, align: "center", margin: 0
  });

  // 구분선
  s.addShape(pres.shapes.LINE, { x: 3.5, y: 3.05, w: 3, h: 0, line: { color: C.accent, width: 1.5 } });

  const contacts = [
    ["GitHub", "Dove9 / khb532"],
    ["역할",   "Unreal Engine 5 C++ 개발"],
    ["기간",   "2025.11 ~ 2026.01"],
  ];
  contacts.forEach(([k, v], i) => {
    const y = 3.25 + i * 0.42;
    s.addText(k + "  ", { x: 3.2, y, w: 1.2, h: 0.35, fontSize: 11, bold: true, color: C.accent, align: "right", margin: 0 });
    s.addText(v,        { x: 4.5, y, w: 3,   h: 0.35, fontSize: 11, color: C.body, margin: 0 });
  });
}

// ─── 저장 ─────────────────────────────────────────────────
pres.writeFile({ fileName: "D:\\DoveObs\\Private\\Portfolio\\ReNe_Portfolio.pptx" })
  .then(() => console.log("✅  ReNe_Portfolio.pptx 생성 완료!"))
  .catch(err => console.error("❌  Error:", err));
