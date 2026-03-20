# Node.js 기반 PPTX 생성 가이드

## 전제 조건

Node.js가 설치되어 있어야 합니다.

```bash
node -v
npm -v
```

---

## 전체 파일 구조

작업을 시작하기 전에 최종 구조를 파악합니다.
**스크립트 파일은 반드시 `package.json`과 같은 디렉토리에 위치해야 합니다.**

```
my_ppt/                          ← 모든 작업의 기준 디렉토리
├─ node_modules/                 ← npm install 후 자동 생성
├─ package.json                  ← npm init -y 로 생성
├─ package-lock.json
└─ create_slide.js               ← 스크립트를 여기에 저장
```

출력 파일(.pptx)은 스크립트 내 `writeFile`의 절대경로로 지정합니다.

---

## 1단계 — 작업 디렉토리 설정

```bash
mkdir my_ppt
cd my_ppt
npm init -y
```

`npm init -y`는 `package.json`을 생성합니다.
이후 설치되는 모든 모듈은 이 디렉토리 안의 `node_modules/`에 저장됩니다.

> **주의**: `npm init` 없이 모듈을 설치하면 모듈 저장 위치가 예측 불가능해집니다.

---

## 2단계 — 모듈 설치

**`my_ppt/` 디렉토리 안에서 실행합니다.**

```bash
npm install pptxgenjs react react-dom react-icons sharp
```

각 모듈의 역할:

| 모듈 | 역할 |
|---|---|
| `pptxgenjs` | PPTX 파일 생성 |
| `react` + `react-dom` | 아이콘 컴포넌트를 SVG 문자열로 렌더링 |
| `react-icons` | 아이콘 SVG 소스 제공 |
| `sharp` | SVG → PNG 변환 |

> **주의**: `sharp`는 C++ 네이티브 바이너리를 포함합니다. 설치 시 자동 빌드가 발생하며,
> 환경에 따라 Python, node-gyp, Visual Studio Build Tools가 필요할 수 있습니다.

---

## 3단계 — 스크립트 작성

**스크립트 파일은 `my_ppt/create_slide.js` 경로에 저장합니다.**
(`package.json`과 같은 디렉토리여야 합니다.)

`pptxgenjs`는 SVG를 직접 삽입할 수 없으므로, 아이콘은 아래 흐름으로 변환합니다.

```
react-icons 아이콘
  → ReactDOMServer.renderToStaticMarkup()  →  SVG 문자열
  → sharp(Buffer.from(svg)).png()          →  PNG 버퍼
  → base64 인코딩                          →  slide.addImage({ data: ... })
```

기본 스크립트 구조:

```js
const pptxgen = require("pptxgenjs");
const React = require("react");
const ReactDOMServer = require("react-dom/server");
const sharp = require("sharp");
const { FaCode } = require("react-icons/fa");

// 아이콘 → base64 PNG 변환
async function iconToBase64Png(IconComponent, color = "#FFFFFF", size = 256) {
  const svg = ReactDOMServer.renderToStaticMarkup(
    React.createElement(IconComponent, { color, size: String(size) })
  );
  const pngBuffer = await sharp(Buffer.from(svg)).png().toBuffer();
  return "image/png;base64," + pngBuffer.toString("base64");
}

async function createPresentation() {
  let pres = new pptxgen();
  pres.layout = "LAYOUT_16x9";

  let slide = pres.addSlide();
  slide.background = { color: "1A2332" };

  // 아이콘 삽입
  const icon = await iconToBase64Png(FaCode, "#60A5FA", 256);
  slide.addImage({ data: icon, x: 0.5, y: 0.5, w: 0.5, h: 0.5 });

  // 텍스트 삽입
  slide.addText("제목", {
    x: 1.2, y: 0.5, w: 8, h: 0.6,
    fontSize: 36, bold: true, color: "FFFFFF", fontFace: "Arial Black",
  });

  // 도형 삽입 (구분선 등)
  slide.addShape(pres.shapes.RECTANGLE, {
    x: 0.5, y: 1.3, w: 9, h: 0.02,
    fill: { color: "60A5FA" }, line: { color: "60A5FA" },
  });

  // 저장 — 절대경로로 지정. 해당 경로의 디렉토리가 실제로 존재해야 합니다.
  await pres.writeFile({ fileName: "C:/Users/User/Desktop/MySlide.pptx" });
  console.log("생성 완료");
}

createPresentation().catch(console.error);
```

---

## 4단계 — 실행

**`package.json`이 있는 디렉토리(`my_ppt/`)에서 실행합니다.**

```bash
cd my_ppt
node create_slide.js
```

> **주의**: Node.js는 스크립트 위치에서 상위로 올라가며 `node_modules`를 탐색합니다.
> 스크립트와 `node_modules`가 서로 다른 디렉토리 트리에 있으면 모듈을 찾지 못합니다.
> 스크립트 파일, `package.json`, `node_modules`는 반드시 같은 디렉토리에 있어야 합니다.

성공 시 터미널에 `생성 완료` 출력 후 지정 경로에 `.pptx` 파일이 생성됩니다.

---

## 주요 API 참조

### 텍스트

```js
slide.addText("내용", {
  x: 0.5, y: 0.5, w: 9, h: 0.5,       // 위치 및 크기 (인치 단위)
  fontSize: 18, bold: true,
  color: "FFFFFF", fontFace: "Arial",
  align: "left",                         // left / center / right
  italic: true,
  lineSpacing: 16,
  margin: 0,
});
```

혼합 서식 (일부만 bold 등):

```js
slide.addText([
  { text: "라벨: ", options: { bold: true, color: "94A3B8", breakLine: false } },
  { text: "내용 텍스트", options: { color: "CBD5E1", breakLine: true } },
], { x: 0.5, y: 1.0, w: 9, h: 0.5, fontSize: 12, fontFace: "Arial" });
```

### 도형

```js
slide.addShape(pres.shapes.RECTANGLE, {
  x: 0.5, y: 1.3, w: 9, h: 0.02,
  fill: { color: "60A5FA" },
  line: { color: "60A5FA" },
});
```

### 이미지

```js
slide.addImage({
  data: "image/png;base64,...",   // base64 문자열
  x: 0.5, y: 0.5, w: 0.5, h: 0.5,
});
```

### 배경

```js
slide.background = { color: "1A2332" };   // HEX (# 없이)
```

---

## 좌표 체계

모든 위치·크기 단위는 **인치(inch)** 입니다.
16:9 슬라이드 기준 전체 크기는 `10 x 5.625` 인치입니다.

```
(0, 0) ─────────────────── (10, 0)
  │                              │
  │      슬라이드 영역           │
  │                              │
(0, 5.625) ─────────── (10, 5.625)
```

실용 기준값:
- 좌우 여백: `x: 0.5` 시작, `w: 9` 로 양쪽 0.5 여백 확보
- 상단 여백: `y: 0.25` ~ `0.5`
- 하단 안전선: `y: 6.5` 이하 권장
