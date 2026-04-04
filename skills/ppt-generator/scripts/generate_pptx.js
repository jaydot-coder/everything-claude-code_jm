#!/usr/bin/env node
/**
 * PPT Generator - PptxGenJS 기반 .pptx 파일 생성 스크립트
 *
 * Usage:
 *   node generate_pptx.js --input slides.json --output output.pptx [--theme professional]
 *
 * Themes: professional, modern, warm, minimal, bold
 */

const PptxGenJS = require("pptxgenjs");
const fs = require("fs");
const path = require("path");

// ── Theme Definitions ──────────────────────────────────────────────

const THEMES = {
  professional: {
    bgColor: "FFFFFF",
    titleBg: "1B2A4A",
    accent: "2E86C1",
    titleColor: "1B2A4A",
    textColor: "333333",
    subtitleColor: "666666",
    bulletColor: "2E86C1",
    coverTitleColor: "FFFFFF",
    coverSubtitleColor: "BBDEFB",
    visualNoteColor: "999999",
  },
  modern: {
    bgColor: "F5F5F5",
    titleBg: "262626",
    accent: "00BCD4",
    titleColor: "212121",
    textColor: "424242",
    subtitleColor: "757575",
    bulletColor: "00BCD4",
    coverTitleColor: "FFFFFF",
    coverSubtitleColor: "B2EBF2",
    visualNoteColor: "AAAAAA",
  },
  warm: {
    bgColor: "FFFBF5",
    titleBg: "E65C00",
    accent: "FF8F00",
    titleColor: "BF360C",
    textColor: "4E342E",
    subtitleColor: "8D6E63",
    bulletColor: "FF8F00",
    coverTitleColor: "FFFFFF",
    coverSubtitleColor: "FFE0B2",
    visualNoteColor: "BCAAA4",
  },
  minimal: {
    bgColor: "FFFFFF",
    titleBg: "212121",
    accent: "000000",
    titleColor: "000000",
    textColor: "333333",
    subtitleColor: "777777",
    bulletColor: "000000",
    coverTitleColor: "FFFFFF",
    coverSubtitleColor: "CCCCCC",
    visualNoteColor: "BBBBBB",
  },
  bold: {
    bgColor: "0D0D0D",
    titleBg: "E53935",
    accent: "FFEB3B",
    titleColor: "FFFFFF",
    textColor: "EEEEEE",
    subtitleColor: "BDBDBD",
    bulletColor: "FFEB3B",
    coverTitleColor: "FFFFFF",
    coverSubtitleColor: "FFEB3B",
    visualNoteColor: "757575",
  },
};

// ── Slide Builders ─────────────────────────────────────────────────

function buildTitleSlide(pptx, data, theme) {
  const slide = pptx.addSlide();
  slide.background = { color: theme.titleBg };

  // 제목
  slide.addText(data.title || "", {
    x: 1.0,
    y: 2.0,
    w: "80%",
    h: 1.5,
    fontSize: 40,
    color: theme.coverTitleColor,
    bold: true,
    align: "center",
    fontFace: "맑은 고딕",
  });

  // 악센트 라인
  slide.addShape(pptx.ShapeType.rect, {
    x: 4.0,
    y: 3.5,
    w: 2.0,
    h: 0.04,
    fill: { color: theme.accent },
    line: { color: theme.accent, width: 0 },
  });

  // 부제목
  if (data.subtitle) {
    slide.addText(data.subtitle, {
      x: 1.0,
      y: 3.8,
      w: "80%",
      h: 0.8,
      fontSize: 20,
      color: theme.coverSubtitleColor,
      align: "center",
      fontFace: "맑은 고딕",
    });
  }
}

function buildAgendaSlide(pptx, data, theme) {
  const slide = pptx.addSlide();
  slide.background = { color: theme.bgColor };

  // 상단 악센트 바
  slide.addShape(pptx.ShapeType.rect, {
    x: 0,
    y: 0,
    w: "100%",
    h: 0.06,
    fill: { color: theme.accent },
  });

  // 제목
  slide.addText(data.title || "목차", {
    x: 0.6,
    y: 0.4,
    w: 8,
    h: 0.8,
    fontSize: 32,
    color: theme.titleColor,
    bold: true,
    fontFace: "맑은 고딕",
  });

  // 목차 항목들
  const items = data.items || [];
  items.forEach((item, i) => {
    const y = 1.5 + i * 0.65;

    // 번호
    slide.addText(String(i + 1), {
      x: 1.0,
      y,
      w: 0.5,
      h: 0.5,
      fontSize: 18,
      color: theme.accent,
      bold: true,
      align: "center",
      fontFace: "맑은 고딕",
    });

    // 텍스트
    slide.addText(item, {
      x: 1.7,
      y,
      w: 7,
      h: 0.5,
      fontSize: 20,
      color: theme.textColor,
      fontFace: "맑은 고딕",
    });
  });
}

function buildContentSlide(pptx, data, theme) {
  const slide = pptx.addSlide();
  slide.background = { color: theme.bgColor };

  // 상단 악센트 바
  slide.addShape(pptx.ShapeType.rect, {
    x: 0,
    y: 0,
    w: "100%",
    h: 0.06,
    fill: { color: theme.accent },
  });

  // 제목
  slide.addText(data.title || "", {
    x: 0.6,
    y: 0.4,
    w: 8.5,
    h: 0.8,
    fontSize: 28,
    color: theme.titleColor,
    bold: true,
    fontFace: "맑은 고딕",
  });

  // 불릿
  const bullets = data.bullets || [];
  if (bullets.length > 0) {
    const bulletItems = bullets.map((b) => ({
      text: b,
      options: {
        fontSize: 18,
        color: theme.textColor,
        bullet: { code: "2022", color: theme.bulletColor },
        paraSpaceAfter: 8,
      },
    }));

    slide.addText(bulletItems, {
      x: 0.8,
      y: 1.4,
      w: 8.4,
      h: 4.0,
      fontFace: "맑은 고딕",
      valign: "top",
    });
  }

  // 시각 자료 지시사항
  if (data.visual_note) {
    slide.addText(`[시각 자료] ${data.visual_note}`, {
      x: 0.8,
      y: 5.8,
      w: 8.4,
      h: 0.6,
      fontSize: 10,
      color: theme.visualNoteColor,
      fontFace: "맑은 고딕",
      italic: true,
    });
  }
}

function buildTwoColumnSlide(pptx, data, theme) {
  const slide = pptx.addSlide();
  slide.background = { color: theme.bgColor };

  // 상단 악센트 바
  slide.addShape(pptx.ShapeType.rect, {
    x: 0,
    y: 0,
    w: "100%",
    h: 0.06,
    fill: { color: theme.accent },
  });

  // 제목
  slide.addText(data.title || "", {
    x: 0.6,
    y: 0.4,
    w: 8.5,
    h: 0.8,
    fontSize: 28,
    color: theme.titleColor,
    bold: true,
    fontFace: "맑은 고딕",
  });

  // 왼쪽 제목
  if (data.left_title) {
    slide.addText(data.left_title, {
      x: 0.6,
      y: 1.4,
      w: 4.0,
      h: 0.5,
      fontSize: 20,
      color: theme.accent,
      bold: true,
      fontFace: "맑은 고딕",
    });
  }

  // 왼쪽 불릿
  const leftBullets = data.left_bullets || [];
  if (leftBullets.length > 0) {
    const items = leftBullets.map((b) => ({
      text: b,
      options: {
        fontSize: 16,
        color: theme.textColor,
        bullet: { code: "2022", color: theme.bulletColor },
        paraSpaceAfter: 6,
      },
    }));
    slide.addText(items, {
      x: 0.8,
      y: 2.0,
      w: 3.8,
      h: 3.5,
      fontFace: "맑은 고딕",
      valign: "top",
    });
  }

  // 구분선
  slide.addShape(pptx.ShapeType.rect, {
    x: 4.85,
    y: 1.4,
    w: 0.02,
    h: 4.0,
    fill: { color: theme.accent },
  });

  // 오른쪽 제목
  if (data.right_title) {
    slide.addText(data.right_title, {
      x: 5.2,
      y: 1.4,
      w: 4.0,
      h: 0.5,
      fontSize: 20,
      color: theme.accent,
      bold: true,
      fontFace: "맑은 고딕",
    });
  }

  // 오른쪽 불릿
  const rightBullets = data.right_bullets || [];
  if (rightBullets.length > 0) {
    const items = rightBullets.map((b) => ({
      text: b,
      options: {
        fontSize: 16,
        color: theme.textColor,
        bullet: { code: "2022", color: theme.bulletColor },
        paraSpaceAfter: 6,
      },
    }));
    slide.addText(items, {
      x: 5.4,
      y: 2.0,
      w: 3.8,
      h: 3.5,
      fontFace: "맑은 고딕",
      valign: "top",
    });
  }

  // 시각 자료 지시사항
  if (data.visual_note) {
    slide.addText(`[시각 자료] ${data.visual_note}`, {
      x: 0.8,
      y: 5.8,
      w: 8.4,
      h: 0.6,
      fontSize: 10,
      color: theme.visualNoteColor,
      fontFace: "맑은 고딕",
      italic: true,
    });
  }
}

function buildQuoteSlide(pptx, data, theme) {
  const slide = pptx.addSlide();
  slide.background = { color: theme.bgColor };

  // 큰 따옴표
  slide.addText("\u201C", {
    x: 1.0,
    y: 1.0,
    w: 1,
    h: 1,
    fontSize: 72,
    color: theme.accent,
    bold: true,
    fontFace: "Georgia",
  });

  // 인용문
  slide.addText(data.quote || "", {
    x: 1.5,
    y: 2.2,
    w: 7,
    h: 2.5,
    fontSize: 24,
    color: theme.textColor,
    fontFace: "맑은 고딕",
    italic: true,
    valign: "top",
  });

  // 출처
  if (data.attribution) {
    slide.addText(`\u2014 ${data.attribution}`, {
      x: 1.5,
      y: 4.6,
      w: 7,
      h: 0.5,
      fontSize: 16,
      color: theme.subtitleColor,
      fontFace: "맑은 고딕",
    });
  }
}

function buildSummarySlide(pptx, data, theme) {
  const slide = pptx.addSlide();
  slide.background = { color: theme.bgColor };

  // 상단 악센트 바 (두꺼운 버전)
  slide.addShape(pptx.ShapeType.rect, {
    x: 0,
    y: 0,
    w: "100%",
    h: 0.12,
    fill: { color: theme.accent },
  });

  // 제목
  slide.addText(data.title || "핵심 정리", {
    x: 0.6,
    y: 0.4,
    w: 8,
    h: 0.8,
    fontSize: 32,
    color: theme.titleColor,
    bold: true,
    fontFace: "맑은 고딕",
  });

  // 요약 항목들
  const bullets = data.bullets || [];
  bullets.forEach((item, i) => {
    const y = 1.5 + i * 0.8;

    // 번호
    slide.addText(String(i + 1), {
      x: 0.8,
      y,
      w: 0.5,
      h: 0.5,
      fontSize: 22,
      color: theme.accent,
      bold: true,
      align: "center",
      fontFace: "맑은 고딕",
    });

    // 텍스트
    slide.addText(item, {
      x: 1.5,
      y,
      w: 7.5,
      h: 0.5,
      fontSize: 20,
      color: theme.textColor,
      fontFace: "맑은 고딕",
    });
  });
}

function buildClosingSlide(pptx, data, theme) {
  const slide = pptx.addSlide();
  slide.background = { color: theme.titleBg };

  // 제목
  slide.addText(data.title || "감사합니다", {
    x: 1.0,
    y: 2.2,
    w: "80%",
    h: 1.2,
    fontSize: 44,
    color: theme.coverTitleColor,
    bold: true,
    align: "center",
    fontFace: "맑은 고딕",
  });

  // 악센트 라인
  slide.addShape(pptx.ShapeType.rect, {
    x: 4.0,
    y: 3.5,
    w: 2.0,
    h: 0.04,
    fill: { color: theme.accent },
  });

  // 부제목
  if (data.subtitle) {
    slide.addText(data.subtitle, {
      x: 1.0,
      y: 3.8,
      w: "80%",
      h: 0.8,
      fontSize: 22,
      color: theme.coverSubtitleColor,
      align: "center",
      fontFace: "맑은 고딕",
    });
  }
}

// ── Slide Type Router ──────────────────────────────────────────────

const BUILDERS = {
  title: buildTitleSlide,
  agenda: buildAgendaSlide,
  content: buildContentSlide,
  two_column: buildTwoColumnSlide,
  quote: buildQuoteSlide,
  summary: buildSummarySlide,
  closing: buildClosingSlide,
};

// ── Main ───────────────────────────────────────────────────────────

async function generate(data, outputPath) {
  const themeName = data.theme || "professional";
  const theme = THEMES[themeName] || THEMES.professional;

  const pptx = new PptxGenJS();
  pptx.layout = "LAYOUT_WIDE"; // 16:9 (13.33 x 7.5 inches)
  pptx.author = "PPT Generator";
  pptx.title = data.title || "Presentation";

  const slides = data.slides || [];
  for (const slideData of slides) {
    const slideType = slideData.type || "content";
    const builder = BUILDERS[slideType] || buildContentSlide;
    builder(pptx, slideData, theme);
  }

  await pptx.writeFile({ fileName: outputPath });
  console.log(`Generated: ${outputPath} (${slides.length} slides, theme: ${themeName})`);
}

function parseArgs() {
  const args = process.argv.slice(2);
  const parsed = {};
  for (let i = 0; i < args.length; i += 2) {
    const key = args[i].replace(/^--/, "");
    parsed[key] = args[i + 1];
  }
  return parsed;
}

async function main() {
  const args = parseArgs();

  if (!args.input || !args.output) {
    console.error("Usage: node generate_pptx.js --input slides.json --output output.pptx [--theme professional]");
    process.exit(1);
  }

  const inputPath = path.resolve(args.input);
  if (!fs.existsSync(inputPath)) {
    console.error(`Error: Input file not found: ${inputPath}`);
    process.exit(1);
  }

  const data = JSON.parse(fs.readFileSync(inputPath, "utf-8"));

  // CLI 테마가 지정되면 JSON 테마를 오버라이드
  if (args.theme) {
    data.theme = args.theme;
  }

  await generate(data, args.output);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
