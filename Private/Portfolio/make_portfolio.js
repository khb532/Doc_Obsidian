const pptxgen = require("C:/Users/Dove/AppData/Roaming/npm/node_modules/pptxgenjs");

let pres = new pptxgen();
pres.layout = 'LAYOUT_16x9';
pres.author = 'KHB';
pres.title = 'MHGA Portfolio - KHB';

// Color Palette: Dark premium game dev theme
// BG Dark: 0D1117 (near black)
// BG Card: 161B22 (dark card)
// Accent: F96167 (coral red - energetic)
// Accent2: F9E795 (gold)
// Text Light: F0F6FC
// Text Muted: 8B949E
// Teal: 00B4D8

const C = {
  bgDark: "0D1117",
  bgCard: "161B22",
  bgMid: "1C2128",
  accent: "F96167",
  accent2: "F9E795",
  teal: "00B4D8",
  white: "F0F6FC",
  muted: "8B949E",
  border: "30363D",
  green: "3FB950",
};

const makeShadow = () => ({ type: "outer", blur: 8, offset: 2, angle: 135, color: "000000", opacity: 0.3 });

// ─────────────────────────────────────────────
// SLIDE 1: Title Slide
// ─────────────────────────────────────────────
{
  let s = pres.addSlide();
  s.background = { color: C.bgDark };

  // Left accent bar
  s.addShape(pres.shapes.RECTANGLE, {
    x: 0, y: 0, w: 0.06, h: 5.625,
    fill: { color: C.accent }, line: { color: C.accent }
  });

  // Top subtle line
  s.addShape(pres.shapes.RECTANGLE, {
    x: 0.06, y: 0, w: 9.94, h: 0.04,
    fill: { color: C.border }, line: { color: C.border }
  });

  // Game title tag
  s.addShape(pres.shapes.RECTANGLE, {
    x: 0.5, y: 0.7, w: 1.6, h: 0.32,
    fill: { color: C.accent }, line: { color: C.accent }
  });
  s.addText("MHGA PROJECT", {
    x: 0.5, y: 0.7, w: 1.6, h: 0.32,
    fontSize: 8, bold: true, color: C.white,
    align: "center", valign: "middle", margin: 0
  });

  // Main title
  s.addText("개인 기여 포트폴리오", {
    x: 0.5, y: 1.15, w: 7, h: 0.8,
    fontSize: 38, bold: true, color: C.white,
    fontFace: "Arial Black", align: "left", margin: 0
  });

  // Sub
  s.addText("Unreal Engine 5 · C++ · Multiplayer", {
    x: 0.5, y: 2.0, w: 7, h: 0.4,
    fontSize: 16, color: C.teal, fontFace: "Calibri",
    align: "left", margin: 0
  });

  // Divider
  s.addShape(pres.shapes.RECTANGLE, {
    x: 0.5, y: 2.5, w: 4.5, h: 0.03,
    fill: { color: C.border }, line: { color: C.border }
  });

  // Info rows
  const infoItems = [
    ["작성자", "khb532 (GitHub: Dove9)"],
    ["프로젝트 기간", "2025.09 ~ 2025.11"],
    ["장르", "협동 요리 액션 (멀티플레이)"],
    ["팀 규모", "3인 팀"],
  ];
  infoItems.forEach(([label, val], i) => {
    s.addText(label, {
      x: 0.5, y: 2.65 + i * 0.38, w: 1.6, h: 0.3,
      fontSize: 10, color: C.muted, fontFace: "Calibri", align: "left", margin: 0
    });
    s.addText(val, {
      x: 2.2, y: 2.65 + i * 0.38, w: 4.5, h: 0.3,
      fontSize: 11, bold: true, color: C.white, fontFace: "Calibri", align: "left", margin: 0
    });
  });

  // Right side: contribution stats card
  s.addShape(pres.shapes.RECTANGLE, {
    x: 7.0, y: 0.5, w: 2.7, h: 4.6,
    fill: { color: C.bgCard }, line: { color: C.border, width: 1 },
    shadow: makeShadow()
  });
  s.addShape(pres.shapes.RECTANGLE, {
    x: 7.0, y: 0.5, w: 2.7, h: 0.06,
    fill: { color: C.teal }, line: { color: C.teal }
  });

  s.addText("기여 통계", {
    x: 7.0, y: 0.65, w: 2.7, h: 0.35,
    fontSize: 12, bold: true, color: C.teal,
    align: "center", fontFace: "Calibri", margin: 0
  });

  // Big stat: commits
  s.addText("61", {
    x: 7.0, y: 1.1, w: 2.7, h: 0.8,
    fontSize: 52, bold: true, color: C.accent2,
    align: "center", fontFace: "Arial Black", margin: 0
  });
  s.addText("총 커밋 수", {
    x: 7.0, y: 1.9, w: 2.7, h: 0.25,
    fontSize: 9, color: C.muted, align: "center", fontFace: "Calibri", margin: 0
  });

  s.addShape(pres.shapes.RECTANGLE, {
    x: 7.3, y: 2.25, w: 2.1, h: 0.02,
    fill: { color: C.border }, line: { color: C.border }
  });

  // Top files
  s.addText("주요 수정 파일", {
    x: 7.0, y: 2.35, w: 2.7, h: 0.25,
    fontSize: 9, color: C.muted, align: "center", fontFace: "Calibri", margin: 0
  });

  const topFiles = [
    ["WrappingPaper.cpp", "15"],
    ["WrappingPaper.h", "12"],
    ["BurgerData.h", "7"],
    ["CookingArea.cpp", "7"],
    ["InteractComponent.cpp", "6"],
  ];
  topFiles.forEach(([file, cnt], i) => {
    // Bar bg
    s.addShape(pres.shapes.RECTANGLE, {
      x: 7.1, y: 2.7 + i * 0.37, w: 2.5, h: 0.25,
      fill: { color: C.bgMid }, line: { color: C.border, width: 1 }
    });
    // Progress bar
    const ratio = parseInt(cnt) / 15;
    s.addShape(pres.shapes.RECTANGLE, {
      x: 7.1, y: 2.7 + i * 0.37, w: 2.5 * ratio, h: 0.25,
      fill: { color: C.accent, transparency: 70 }, line: { color: C.accent, transparency: 70 }
    });
    s.addText(file, {
      x: 7.15, y: 2.7 + i * 0.37, w: 1.8, h: 0.25,
      fontSize: 7.5, color: C.white, fontFace: "Consolas", valign: "middle", margin: 0
    });
    s.addText(cnt, {
      x: 9.1, y: 2.7 + i * 0.37, w: 0.45, h: 0.25,
      fontSize: 8, bold: true, color: C.accent2, align: "right", valign: "middle", margin: 0
    });
  });

  // Bottom tag
  s.addText("UE5 · C++ · Multiplayer Replication · DataTable", {
    x: 0.5, y: 5.15, w: 9, h: 0.25,
    fontSize: 8, color: C.muted, align: "center", fontFace: "Calibri", margin: 0
  });
}

// ─────────────────────────────────────────────
// SLIDE 2: 프로젝트 개요 & 팀 역할
// ─────────────────────────────────────────────
{
  let s = pres.addSlide();
  s.background = { color: C.bgDark };

  // Header bar
  s.addShape(pres.shapes.RECTANGLE, {
    x: 0, y: 0, w: 10, h: 0.65,
    fill: { color: C.bgCard }, line: { color: C.bgCard }
  });
  s.addShape(pres.shapes.RECTANGLE, {
    x: 0, y: 0.65, w: 10, h: 0.04,
    fill: { color: C.accent }, line: { color: C.accent }
  });
  s.addText("01  프로젝트 개요", {
    x: 0.4, y: 0, w: 9, h: 0.65,
    fontSize: 18, bold: true, color: C.white, fontFace: "Arial Black",
    valign: "middle", margin: 0
  });
  s.addText("PROJECT OVERVIEW", {
    x: 0.4, y: 0, w: 9, h: 0.65,
    fontSize: 9, color: C.accent, fontFace: "Calibri",
    align: "right", valign: "middle", margin: 0
  });

  // Left: overview text
  s.addShape(pres.shapes.RECTANGLE, {
    x: 0.3, y: 0.85, w: 4.5, h: 2.0,
    fill: { color: C.bgCard }, line: { color: C.border, width: 1 },
    shadow: makeShadow()
  });
  s.addShape(pres.shapes.RECTANGLE, {
    x: 0.3, y: 0.85, w: 0.07, h: 2.0,
    fill: { color: C.teal }, line: { color: C.teal }
  });
  s.addText("MHGA", {
    x: 0.5, y: 0.95, w: 4.1, h: 0.35,
    fontSize: 18, bold: true, color: C.teal, fontFace: "Arial Black", margin: 0
  });
  s.addText("햄버거 가게를 배경으로 한 실시간 멀티플레이 협동 게임.\n\n플레이어들은 주방에서 역할을 분담해 손님 주문에 맞는 햄버거를 완성하고 서빙한다.\n\n재료 조리 → 포장지 레시피 판정 → 햄버거 완성의 게임 루프가 핵심.", {
    x: 0.5, y: 1.35, w: 4.1, h: 1.4,
    fontSize: 10, color: C.white, fontFace: "Calibri",
    valign: "top", align: "left", margin: 0
  });

  // Right: tech tags
  const tags = ["Unreal Engine 5", "C++", "Multiplayer", "DataTable", "Server RPC", "NetMulticast"];
  tags.forEach((tag, i) => {
    const col = i % 2;
    const row = Math.floor(i / 2);
    s.addShape(pres.shapes.RECTANGLE, {
      x: 5.0 + col * 2.4, y: 0.85 + row * 0.48, w: 2.2, h: 0.35,
      fill: { color: C.bgMid }, line: { color: C.teal, width: 1 }
    });
    s.addText(tag, {
      x: 5.0 + col * 2.4, y: 0.85 + row * 0.48, w: 2.2, h: 0.35,
      fontSize: 10, bold: true, color: C.teal,
      align: "center", valign: "middle", fontFace: "Calibri", margin: 0
    });
  });

  // Team role table
  s.addText("팀 역할 분담", {
    x: 0.3, y: 3.0, w: 4, h: 0.3,
    fontSize: 12, bold: true, color: C.accent2, fontFace: "Arial Black", margin: 0
  });

  const roles = [
    ["khb532 (본인)", "WrappingPaper 시스템, 레시피 DataTable, 조리 시스템(Patty/Portions/CookingArea), SauceBottle, 멀티플레이 리플리케이션"],
    ["hgh3k", "GasFryer 비주얼/애니메이션, 손님 AI, UI 효과음, 씬 시퀀스"],
    ["허지웅", "플레이어 이동/사운드, 로비 시스템, 패키징"],
  ];
  const roleColors = [C.accent, C.teal, C.muted];
  roles.forEach(([name, desc], i) => {
    s.addShape(pres.shapes.RECTANGLE, {
      x: 0.3, y: 3.4 + i * 0.65, w: 9.4, h: 0.58,
      fill: { color: i === 0 ? C.bgMid : C.bgCard }, line: { color: i === 0 ? C.accent : C.border, width: i === 0 ? 1 : 1 }
    });
    s.addShape(pres.shapes.RECTANGLE, {
      x: 0.3, y: 3.4 + i * 0.65, w: 0.06, h: 0.58,
      fill: { color: roleColors[i] }, line: { color: roleColors[i] }
    });
    s.addText(name, {
      x: 0.48, y: 3.4 + i * 0.65, w: 2.0, h: 0.58,
      fontSize: 10, bold: true, color: roleColors[i],
      fontFace: "Calibri", valign: "middle", margin: 0
    });
    s.addText(desc, {
      x: 2.55, y: 3.4 + i * 0.65, w: 7.0, h: 0.58,
      fontSize: 9, color: C.white, fontFace: "Calibri",
      valign: "middle", align: "left", margin: 0
    });
  });
}

// ─────────────────────────────────────────────
// SLIDE 3: WrappingPaper 시스템 핵심
// ─────────────────────────────────────────────
{
  let s = pres.addSlide();
  s.background = { color: C.bgDark };

  s.addShape(pres.shapes.RECTANGLE, {
    x: 0, y: 0, w: 10, h: 0.65,
    fill: { color: C.bgCard }, line: { color: C.bgCard }
  });
  s.addShape(pres.shapes.RECTANGLE, {
    x: 0, y: 0.65, w: 10, h: 0.04,
    fill: { color: C.accent }, line: { color: C.accent }
  });
  s.addText("02  WrappingPaper 시스템", {
    x: 0.4, y: 0, w: 9, h: 0.65,
    fontSize: 18, bold: true, color: C.white, fontFace: "Arial Black",
    valign: "middle", margin: 0
  });
  s.addText("CORE GAMEPLAY SYSTEM", {
    x: 0.4, y: 0, w: 9.3, h: 0.65,
    fontSize: 9, color: C.accent, fontFace: "Calibri",
    align: "right", valign: "middle", margin: 0
  });

  // Flow diagram (처리 흐름)
  s.addText("처리 흐름", {
    x: 0.3, y: 0.8, w: 4, h: 0.28,
    fontSize: 11, bold: true, color: C.accent2, fontFace: "Arial Black", margin: 0
  });

  const flow = [
    ["재료 올림 (Overlap)", C.teal],
    ["AddIngredient [Server RPC]", C.accent],
    ["DOREPLIFETIME 클라이언트 동기화", C.teal],
    ["TryWrap [Server RPC] E키", C.accent],
    ["FindMatchingRecipe() DataTable 매칭", C.accent2],
    ["AHamburger Spawn + MultiRPC_SetMat", C.green],
  ];

  flow.forEach(([label, color], i) => {
    s.addShape(pres.shapes.RECTANGLE, {
      x: 0.3, y: 1.15 + i * 0.58, w: 4.2, h: 0.42,
      fill: { color: C.bgCard }, line: { color: color, width: 1 }
    });
    s.addShape(pres.shapes.RECTANGLE, {
      x: 0.3, y: 1.15 + i * 0.58, w: 0.06, h: 0.42,
      fill: { color: color }, line: { color: color }
    });
    s.addText(label, {
      x: 0.45, y: 1.15 + i * 0.58, w: 4.0, h: 0.42,
      fontSize: 9.5, color: C.white, fontFace: "Consolas",
      valign: "middle", margin: 0
    });
    if (i < flow.length - 1) {
      s.addShape(pres.shapes.RECTANGLE, {
        x: 0.68, y: 1.57 + i * 0.58, w: 0.04, h: 0.16,
        fill: { color: C.muted }, line: { color: C.muted }
      });
    }
  });

  // Right: design points
  s.addText("핵심 설계 포인트", {
    x: 5.0, y: 0.8, w: 4.7, h: 0.28,
    fontSize: 11, bold: true, color: C.accent2, fontFace: "Arial Black", margin: 0
  });

  const points = [
    ["TMap 순서 무관 판정", "TArray → TMap<EIngredient,int32> 변환으로\n재료를 올리는 순서와 무관하게 레시피 일치 판정"],
    ["DataTable 연동 설계", "FBurgerRecipe : FTableRowBase 상속\nC++ 재빌드 없이 에디터에서 레시피 추가 가능"],
    ["서버 권한 보장", "AddIngredient / TryWrap → Server, Reliable RPC\n판정 로직은 서버에서만 실행, 클라이언트 조작 불가"],
    ["실시간 동기화", "OnAreaIngredients → DOREPLIFETIME\n모든 클라이언트에 재료 목록 자동 전파"],
  ];

  points.forEach(([title, desc], i) => {
    const cardH = 1.12;
    const gap = 0.04;
    const startY = 1.13;
    s.addShape(pres.shapes.RECTANGLE, {
      x: 5.0, y: startY + i * (cardH + gap), w: 4.7, h: cardH,
      fill: { color: C.bgCard }, line: { color: C.border, width: 1 },
      shadow: makeShadow()
    });
    s.addShape(pres.shapes.RECTANGLE, {
      x: 5.0, y: startY + i * (cardH + gap), w: 4.7, h: 0.06,
      fill: { color: i % 2 === 0 ? C.accent : C.teal },
      line: { color: i % 2 === 0 ? C.accent : C.teal }
    });
    s.addText(title, {
      x: 5.1, y: startY + i * (cardH + gap) + 0.1, w: 4.5, h: 0.3,
      fontSize: 11, bold: true, color: i % 2 === 0 ? C.accent : C.teal,
      fontFace: "Calibri", margin: 0
    });
    s.addText(desc, {
      x: 5.1, y: startY + i * (cardH + gap) + 0.43, w: 4.5, h: 0.65,
      fontSize: 10, color: C.white, fontFace: "Calibri",
      valign: "top", margin: 0
    });
  });
}

// ─────────────────────────────────────────────
// SLIDE 4: 레시피 판정 알고리즘 (코드 슬라이드)
// ─────────────────────────────────────────────
{
  let s = pres.addSlide();
  s.background = { color: C.bgDark };

  s.addShape(pres.shapes.RECTANGLE, {
    x: 0, y: 0, w: 10, h: 0.65,
    fill: { color: C.bgCard }, line: { color: C.bgCard }
  });
  s.addShape(pres.shapes.RECTANGLE, {
    x: 0, y: 0.65, w: 10, h: 0.04,
    fill: { color: C.teal }, line: { color: C.teal }
  });
  s.addText("03  레시피 판정 알고리즘", {
    x: 0.4, y: 0, w: 9, h: 0.65,
    fontSize: 18, bold: true, color: C.white, fontFace: "Arial Black",
    valign: "middle", margin: 0
  });
  s.addText("FindMatchingRecipe()", {
    x: 0.4, y: 0, w: 9.3, h: 0.65,
    fontSize: 9, color: C.teal, fontFace: "Consolas",
    align: "right", valign: "middle", margin: 0
  });

  // Code block left
  s.addShape(pres.shapes.RECTANGLE, {
    x: 0.3, y: 0.8, w: 5.6, h: 4.5,
    fill: { color: "0D1117" }, line: { color: C.border, width: 1 }
  });
  // Code title bar
  s.addShape(pres.shapes.RECTANGLE, {
    x: 0.3, y: 0.8, w: 5.6, h: 0.3,
    fill: { color: C.bgMid }, line: { color: C.border, width: 1 }
  });
  s.addText("WrappingPaper.cpp  —  FindMatchingRecipe()", {
    x: 0.5, y: 0.8, w: 5.4, h: 0.3,
    fontSize: 8, color: C.muted, fontFace: "Consolas", valign: "middle", margin: 0
  });

  const codeLines = [
    { t: "EBurgerMenu ", c: C.teal },
    { t: "FindMatchingRecipe(UDataTable* DT,", c: C.white },
    { t: "    const TArray<FIngredientStack>& WrapperIngr)", c: C.white },
    { t: "{", c: C.muted },
    { t: "    // 배열 → TMap 변환 (재료ID : 수량)", c: C.green },
    { t: "    TMap<EIngredient, int32> WrapMap =", c: C.white },
    { t: "        MakeMapFromArray(WrapperIngr);", c: C.white },
    { t: "", c: C.white },
    { t: "    TArray<FBurgerRecipe*> AllRows;", c: C.white },
    { t: "    DT->GetAllRows(..., AllRows);", c: C.white },
    { t: "", c: C.white },
    { t: "    for (FBurgerRecipe* Row : AllRows)", c: C.accent2 },
    { t: "    {", c: C.muted },
    { t: "        TMap RecipeMap = MakeMapFromArray(...);", c: C.white },
    { t: "        // 키 수 다르면 skip", c: C.green },
    { t: "        if (RecipeMap.Num() != WrapMap.Num())", c: C.white },
    { t: "            continue;", c: C.accent },
    { t: "        // 키-값 완전 일치 검사", c: C.green },
    { t: "        if (isMatched) return Row->BurgerName;", c: C.teal },
    { t: "    }", c: C.muted },
    { t: "    return EBurgerMenu::WrongBurger;", c: C.accent },
    { t: "}", c: C.muted },
  ];

  codeLines.forEach((line, i) => {
    if (i > 20) return;
    s.addText(line.t, {
      x: 0.4, y: 1.18 + i * 0.175, w: 5.4, h: 0.18,
      fontSize: 7.5, color: line.c, fontFace: "Consolas",
      valign: "middle", margin: 0
    });
  });

  // Right: explanation cards
  const cards = [
    {
      title: "왜 TMap인가?",
      color: C.accent,
      desc: "배열 직접 비교 시 순서가 달라\n판정 실패. TMap 변환으로\n순서 무관 레시피 매칭 구현."
    },
    {
      title: "DataTable 연동",
      color: C.teal,
      desc: "FBurgerRecipe : FTableRowBase\n에디터에서 레시피 추가/수정\n가능 (C++ 재빌드 불필요)."
    },
    {
      title: "WrongBurger 처리",
      color: C.accent2,
      desc: "일치 레시피 없으면\nWrongBurger 반환.\n게임 로직상 패널티 적용."
    },
  ];

  cards.forEach((card, i) => {
    s.addShape(pres.shapes.RECTANGLE, {
      x: 6.2, y: 0.8 + i * 1.5, w: 3.5, h: 1.35,
      fill: { color: C.bgCard }, line: { color: card.color, width: 1 },
      shadow: makeShadow()
    });
    s.addShape(pres.shapes.RECTANGLE, {
      x: 6.2, y: 0.8 + i * 1.5, w: 3.5, h: 0.07,
      fill: { color: card.color }, line: { color: card.color }
    });
    s.addText(card.title, {
      x: 6.3, y: 0.95 + i * 1.5, w: 3.3, h: 0.3,
      fontSize: 12, bold: true, color: card.color,
      fontFace: "Calibri", margin: 0
    });
    s.addText(card.desc, {
      x: 6.3, y: 1.28 + i * 1.5, w: 3.3, h: 0.75,
      fontSize: 9.5, color: C.white, fontFace: "Calibri",
      valign: "top", margin: 0
    });
  });
}

// ─────────────────────────────────────────────
// SLIDE 5: 조리 시스템 (Patty + Portions)
// ─────────────────────────────────────────────
{
  let s = pres.addSlide();
  s.background = { color: C.bgDark };

  s.addShape(pres.shapes.RECTANGLE, {
    x: 0, y: 0, w: 10, h: 0.65,
    fill: { color: C.bgCard }, line: { color: C.bgCard }
  });
  s.addShape(pres.shapes.RECTANGLE, {
    x: 0, y: 0.65, w: 10, h: 0.04,
    fill: { color: C.accent2 }, line: { color: C.accent2 }
  });
  s.addText("04  조리 시스템", {
    x: 0.4, y: 0, w: 9, h: 0.65,
    fontSize: 18, bold: true, color: C.white, fontFace: "Arial Black",
    valign: "middle", margin: 0
  });
  s.addText("Patty · Portions · CookingArea", {
    x: 0.4, y: 0, w: 9.3, h: 0.65,
    fontSize: 9, color: C.accent2, fontFace: "Calibri",
    align: "right", valign: "middle", margin: 0
  });

  // Patty section
  s.addShape(pres.shapes.RECTANGLE, {
    x: 0.3, y: 0.8, w: 4.5, h: 4.5,
    fill: { color: C.bgCard }, line: { color: C.border, width: 1 },
    shadow: makeShadow()
  });
  s.addShape(pres.shapes.RECTANGLE, {
    x: 0.3, y: 0.8, w: 4.5, h: 0.07,
    fill: { color: C.accent }, line: { color: C.accent }
  });
  s.addText("Patty — 앞뒷면 독립 조리 상태", {
    x: 0.4, y: 0.95, w: 4.3, h: 0.3,
    fontSize: 12, bold: true, color: C.accent, fontFace: "Calibri", margin: 0
  });

  // State table
  const stateRows = [
    ["조건", "결과", true],
    ["아무것도 안 익음", "RawPatty", false],
    ["한쪽만 익음", "RawPatty", false],
    ["양쪽 모두 익음", "WellDonePatty ✓", false],
    ["한쪽이라도 탐", "OvercookedPatty ✗", false],
  ];
  stateRows.forEach(([cond, result, isHeader], i) => {
    s.addShape(pres.shapes.RECTANGLE, {
      x: 0.4, y: 1.35 + i * 0.4, w: 4.2, h: 0.38,
      fill: { color: isHeader ? C.bgMid : (i % 2 === 0 ? C.bgDark : C.bgCard) },
      line: { color: C.border, width: 1 }
    });
    s.addText(cond, {
      x: 0.5, y: 1.35 + i * 0.4, w: 2.5, h: 0.38,
      fontSize: 9, color: isHeader ? C.muted : C.white,
      bold: isHeader, fontFace: "Calibri", valign: "middle", margin: 0
    });
    s.addText(result, {
      x: 3.0, y: 1.35 + i * 0.4, w: 1.5, h: 0.38,
      fontSize: 9, color: isHeader ? C.muted : (result.includes("Well") ? C.green : result.includes("Over") ? C.accent : C.white),
      bold: !isHeader, fontFace: "Consolas", valign: "middle", align: "center", margin: 0
    });
  });

  s.addText("물리 기반 뒤집기 보정 (Server_CheckFlip)", {
    x: 0.4, y: 3.4, w: 4.3, h: 0.3,
    fontSize: 10, bold: true, color: C.teal, fontFace: "Calibri", margin: 0
  });
  s.addText("0.5초 주기 타이머로 액터 UpVector와 월드 UpVector의\n내적 검사 → 논리 상태 불일치 시 자동 보정\nOnRep_CookStateChanged() → UpdateMaterial()로\nUMaterialInstanceDynamic 파라미터 직접 제어", {
    x: 0.4, y: 3.75, w: 4.2, h: 1.5,
    fontSize: 10, color: C.white, fontFace: "Calibri",
    valign: "top", margin: 0
  });

  // Right: Portions + CookingArea
  s.addShape(pres.shapes.RECTANGLE, {
    x: 5.1, y: 0.8, w: 4.6, h: 2.1,
    fill: { color: C.bgCard }, line: { color: C.border, width: 1 },
    shadow: makeShadow()
  });
  s.addShape(pres.shapes.RECTANGLE, {
    x: 5.1, y: 0.8, w: 4.6, h: 0.07,
    fill: { color: C.teal }, line: { color: C.teal }
  });
  s.addText("Portions — 튀김 조리", {
    x: 5.2, y: 0.95, w: 4.4, h: 0.28,
    fontSize: 12, bold: true, color: C.teal, fontFace: "Calibri", margin: 0
  });
  s.addText("b_IsShanghai / b_IsShrimp 플래그로 재료 타입 구분\n타이머 15초 완료 시 EIngredient 타입 전환:\nRawPortion → ShanghaiPortion / ShrimpPortion\nCookState DOREPLIFETIME + OnRep_CookState() 머티리얼 갱신", {
    x: 5.2, y: 1.28, w: 4.4, h: 1.5,
    fontSize: 9.5, color: C.white, fontFace: "Calibri",
    valign: "top", margin: 0
  });

  s.addShape(pres.shapes.RECTANGLE, {
    x: 5.1, y: 3.05, w: 4.6, h: 2.25,
    fill: { color: C.bgCard }, line: { color: C.border, width: 1 },
    shadow: makeShadow()
  });
  s.addShape(pres.shapes.RECTANGLE, {
    x: 5.1, y: 3.05, w: 4.6, h: 0.07,
    fill: { color: C.accent2 }, line: { color: C.accent2 }
  });
  s.addText("CookingArea — 조리대 트리거", {
    x: 5.2, y: 3.2, w: 4.4, h: 0.28,
    fontSize: 12, bold: true, color: C.accent2, fontFace: "Calibri", margin: 0
  });
  s.addText("Box Collision 기반 OnOverlapBegin 처리\nHasAuthority() 체크로 서버 전용 실행 보장\nb_IsFryMachine 플래그로 튀김기 연동:\n  → AGasFryer::StartCooking()\n  → 타이머로 알람 사운드 재생\n재료 이탈 시 ShutdownCook() 호출", {
    x: 5.2, y: 3.55, w: 4.4, h: 1.65,
    fontSize: 9.5, color: C.white, fontFace: "Calibri",
    valign: "top", margin: 0
  });
}

// ─────────────────────────────────────────────
// SLIDE 6: 네트워크 아키텍처
// ─────────────────────────────────────────────
{
  let s = pres.addSlide();
  s.background = { color: C.bgDark };

  s.addShape(pres.shapes.RECTANGLE, {
    x: 0, y: 0, w: 10, h: 0.65,
    fill: { color: C.bgCard }, line: { color: C.bgCard }
  });
  s.addShape(pres.shapes.RECTANGLE, {
    x: 0, y: 0.65, w: 10, h: 0.04,
    fill: { color: C.green }, line: { color: C.green }
  });
  s.addText("05  네트워크 아키텍처", {
    x: 0.4, y: 0, w: 9, h: 0.65,
    fontSize: 18, bold: true, color: C.white, fontFace: "Arial Black",
    valign: "middle", margin: 0
  });
  s.addText("UE5 REPLICATION MODEL", {
    x: 0.4, y: 0, w: 9.3, h: 0.65,
    fontSize: 9, color: C.green, fontFace: "Calibri",
    align: "right", valign: "middle", margin: 0
  });

  // 4 cards: 권한 분리
  const netCards = [
    {
      title: "서버 (HasAuthority)",
      color: C.accent,
      items: ["재료 추가/제거", "레시피 판정", "햄버거 스폰", "조리 타이머", "패티 상태 변경"]
    },
    {
      title: "Server RPC",
      color: C.teal,
      items: ["클라이언트 E키 입력 전달", "포장 시도 (TryWrap)", "패티 뒤집기 감지", "소스 발사 요청"]
    },
    {
      title: "NetMulticast RPC",
      color: C.accent2,
      items: ["사운드 재생 동기화", "머티리얼 변경 전파", "햄버거 텍스처 적용", "알람 사운드 재생"]
    },
    {
      title: "DOREPLIFETIME",
      color: C.green,
      items: ["OnAreaIngredients 복제", "CookState 복제", "BurgerName 복제", "OnRep 콜백 머티리얼 갱신"]
    },
  ];

  netCards.forEach((card, i) => {
    const col = i % 2;
    const row = Math.floor(i / 2);
    const x = 0.3 + col * 4.85;
    const cardH = 2.25;
    const y = 0.82 + row * (cardH + 0.1);

    s.addShape(pres.shapes.RECTANGLE, {
      x, y, w: 4.5, h: cardH,
      fill: { color: C.bgCard }, line: { color: card.color, width: 1 },
      shadow: makeShadow()
    });
    s.addShape(pres.shapes.RECTANGLE, {
      x, y, w: 4.5, h: 0.07,
      fill: { color: card.color }, line: { color: card.color }
    });
    s.addText(card.title, {
      x: x + 0.12, y: y + 0.1, w: 4.3, h: 0.35,
      fontSize: 13, bold: true, color: card.color,
      fontFace: "Calibri", margin: 0
    });
    card.items.forEach((item, j) => {
      s.addShape(pres.shapes.OVAL, {
        x: x + 0.15, y: y + 0.55 + j * 0.36, w: 0.1, h: 0.1,
        fill: { color: card.color }, line: { color: card.color }
      });
      s.addText(item, {
        x: x + 0.33, y: y + 0.49 + j * 0.36, w: 4.0, h: 0.3,
        fontSize: 9.5, color: C.white, fontFace: "Calibri",
        valign: "middle", margin: 0
      });
    });
  });

  // Flow at bottom
  s.addShape(pres.shapes.RECTANGLE, {
    x: 0.3, y: 5.1, w: 9.4, h: 0.4,
    fill: { color: C.bgMid }, line: { color: C.border, width: 1 }
  });
  s.addText("[클라이언트] E키  →  Server RPC  →  [서버] 레시피 판정  →  SpawnActor  →  DOREPLIFETIME  →  MultiRPC_SetMat", {
    x: 0.4, y: 5.1, w: 9.2, h: 0.4,
    fontSize: 9, color: C.teal, fontFace: "Consolas",
    align: "center", valign: "middle", margin: 0
  });
}

// ─────────────────────────────────────────────
// SLIDE 7: 기술 스택 & 마무리
// ─────────────────────────────────────────────
{
  let s = pres.addSlide();
  s.background = { color: C.bgDark };

  // Full dark header
  s.addShape(pres.shapes.RECTANGLE, {
    x: 0, y: 0, w: 10, h: 0.65,
    fill: { color: C.bgCard }, line: { color: C.bgCard }
  });
  s.addShape(pres.shapes.RECTANGLE, {
    x: 0, y: 0.65, w: 10, h: 0.04,
    fill: { color: C.accent }, line: { color: C.accent }
  });
  s.addText("06  기술 스택 요약", {
    x: 0.4, y: 0, w: 9, h: 0.65,
    fontSize: 18, bold: true, color: C.white, fontFace: "Arial Black",
    valign: "middle", margin: 0
  });

  // Tech stack grid
  const techItems = [
    { label: "엔진", val: "Unreal Engine 5", color: C.accent },
    { label: "언어", val: "C++", color: C.teal },
    { label: "네트워크", val: "Server/NetMulticast RPC\nDOREPLIFETIME / ReplicatedUsing", color: C.accent },
    { label: "데이터 관리", val: "DataTable + FTableRowBase 상속", color: C.teal },
    { label: "재료 인식", val: "TMap 기반 순서 무관 레시피 매칭", color: C.accent2 },
    { label: "머티리얼", val: "UMaterialInstanceDynamic 파라미터 제어", color: C.accent2 },
    { label: "렌더링", val: "SceneCaptureComponent2D + RenderTarget", color: C.green },
    { label: "사운드", val: "SoundAttenuation 공간 음향 + Multicast RPC", color: C.green },
  ];

  techItems.forEach((item, i) => {
    const col = i % 2;
    const row = Math.floor(i / 2);
    const x = 0.3 + col * 4.85;
    const y = 0.82 + row * 1.1;

    s.addShape(pres.shapes.RECTANGLE, {
      x, y, w: 4.5, h: 1.0,
      fill: { color: C.bgCard }, line: { color: C.border, width: 1 },
      shadow: makeShadow()
    });
    s.addShape(pres.shapes.RECTANGLE, {
      x, y, w: 0.06, h: 1.0,
      fill: { color: item.color }, line: { color: item.color }
    });
    s.addText(item.label, {
      x: x + 0.15, y: y + 0.08, w: 4.2, h: 0.28,
      fontSize: 8.5, color: C.muted, fontFace: "Calibri", margin: 0
    });
    s.addText(item.val, {
      x: x + 0.15, y: y + 0.38, w: 4.25, h: 0.55,
      fontSize: 10, bold: true, color: C.white, fontFace: "Calibri",
      valign: "top", margin: 0
    });
  });

  // Bottom: closing message
  s.addShape(pres.shapes.RECTANGLE, {
    x: 0, y: 5.1, w: 10, h: 0.525,
    fill: { color: C.bgCard }, line: { color: C.bgCard }
  });
  s.addShape(pres.shapes.RECTANGLE, {
    x: 0, y: 5.1, w: 10, h: 0.04,
    fill: { color: C.accent }, line: { color: C.accent }
  });
  s.addText("MHGA Project  ·  khb532 (Dove9)  ·  2025.09 ~ 2025.11  ·  Unreal Engine 5 C++", {
    x: 0, y: 5.14, w: 10, h: 0.485,
    fontSize: 9, color: "A0AEC0", fontFace: "Calibri",
    align: "center", valign: "middle", margin: 0
  });
}

// Save
pres.writeFile({ fileName: "D:/DoveObs/Private/Portfolio/PORTFOLIO_KHB.pptx" })
  .then(() => console.log("DONE: PORTFOLIO_KHB.pptx"))
  .catch(e => console.error("ERROR:", e));
