/**
 * Offline Fallback Image Generator
 *
 * API 실패 시 사용할 내장 이미지 세트 (100장+)
 * Canvas로 로컬 생성 → 네트워크 불필요
 * 8 무드 × 13 변형 = 104개 고유 이미지
 */

const W = 1280;
const H = 720;

// 무드별 컬러 팔레트 (각 13변형)
const MOOD_PALETTES = {
  calm: [
    { bg: ['#E0F2FE', '#BAE6FD'], accent: '#7DD3FC' },
    { bg: ['#DBEAFE', '#BFDBFE'], accent: '#93C5FD' },
    { bg: ['#E0E7FF', '#C7D2FE'], accent: '#A5B4FC' },
    { bg: ['#F0F9FF', '#E0F2FE'], accent: '#BAE6FD' },
    { bg: ['#ECFEFF', '#CFFAFE'], accent: '#67E8F9' },
    { bg: ['#F0FDFA', '#CCFBF1'], accent: '#5EEAD4' },
    { bg: ['#EFF6FF', '#DBEAFE'], accent: '#60A5FA' },
    { bg: ['#F8FAFC', '#E2E8F0'], accent: '#94A3B8' },
    { bg: ['#F0F9FF', '#BAE6FD'], accent: '#38BDF8' },
    { bg: ['#ECFDF5', '#A7F3D0'], accent: '#34D399' },
    { bg: ['#F5F3FF', '#DDD6FE'], accent: '#A78BFA' },
    { bg: ['#FFF7ED', '#FED7AA'], accent: '#FB923C' },
    { bg: ['#FEFCE8', '#FDE68A'], accent: '#FBBF24' },
  ],
  energetic: [
    { bg: ['#FF6B6B', '#FFE66D'], accent: '#FF8E53' },
    { bg: ['#F97316', '#FBBF24'], accent: '#FB923C' },
    { bg: ['#EF4444', '#F59E0B'], accent: '#F97316' },
    { bg: ['#DC2626', '#FB923C'], accent: '#FBBF24' },
    { bg: ['#E11D48', '#F472B6'], accent: '#EC4899' },
    { bg: ['#7C3AED', '#F472B6'], accent: '#C084FC' },
    { bg: ['#EA580C', '#FACC15'], accent: '#FB923C' },
    { bg: ['#DB2777', '#F97316'], accent: '#F472B6' },
    { bg: ['#9333EA', '#EC4899'], accent: '#C084FC' },
    { bg: ['#2563EB', '#06B6D4'], accent: '#38BDF8' },
    { bg: ['#059669', '#34D399'], accent: '#6EE7B7' },
    { bg: ['#D946EF', '#F472B6'], accent: '#E879F9' },
    { bg: ['#F43F5E', '#FCD34D'], accent: '#FB7185' },
  ],
  emotional: [
    { bg: ['#667EEA', '#764BA2'], accent: '#818CF8' },
    { bg: ['#6366F1', '#A855F7'], accent: '#8B5CF6' },
    { bg: ['#4F46E5', '#7C3AED'], accent: '#6366F1' },
    { bg: ['#312E81', '#6D28D9'], accent: '#4338CA' },
    { bg: ['#1E1B4B', '#4338CA'], accent: '#3730A3' },
    { bg: ['#3730A3', '#7C3AED'], accent: '#6366F1' },
    { bg: ['#1E3A5F', '#4338CA'], accent: '#3B82F6' },
    { bg: ['#0F172A', '#334155'], accent: '#475569' },
    { bg: ['#18181B', '#3F3F46'], accent: '#52525B' },
    { bg: ['#1E293B', '#475569'], accent: '#64748B' },
    { bg: ['#0C4A6E', '#1E40AF'], accent: '#1D4ED8' },
    { bg: ['#581C87', '#7E22CE'], accent: '#9333EA' },
    { bg: ['#134E4A', '#065F46'], accent: '#047857' },
  ],
  cozy: [
    { bg: ['#F6D365', '#FDA085'], accent: '#FBBF24' },
    { bg: ['#FBBF24', '#F59E0B'], accent: '#D97706' },
    { bg: ['#FDE68A', '#FCA5A1'], accent: '#F87171' },
    { bg: ['#FEF3C7', '#FECACA'], accent: '#FDE68A' },
    { bg: ['#FFF7ED', '#FFEDD5'], accent: '#FDBA74' },
    { bg: ['#FFFBEB', '#FEF3C7'], accent: '#FDE68A' },
    { bg: ['#D4A574', '#F6D365'], accent: '#C4956A' },
    { bg: ['#92400E', '#D97706'], accent: '#B45309' },
    { bg: ['#FEF9C3', '#FDE047'], accent: '#FACC15' },
    { bg: ['#FFF1F2', '#FECDD3'], accent: '#FDA4AF' },
    { bg: ['#F5F0E8', '#E8DCC8'], accent: '#D4C4A8' },
    { bg: ['#ECFCCB', '#BEF264'], accent: '#A3E635' },
    { bg: ['#FDF2F8', '#FBCFE8'], accent: '#F9A8D4' },
  ],
  dark: [
    { bg: ['#0F0C29', '#302B63'], accent: '#4338CA' },
    { bg: ['#1A1A2E', '#16213E'], accent: '#0F3460' },
    { bg: ['#0F172A', '#1E293B'], accent: '#334155' },
    { bg: ['#111827', '#1F2937'], accent: '#374151' },
    { bg: ['#18181B', '#27272A'], accent: '#3F3F46' },
    { bg: ['#020617', '#0F172A'], accent: '#1E293B' },
    { bg: ['#1C1917', '#292524'], accent: '#44403C' },
    { bg: ['#0C0A09', '#1C1917'], accent: '#292524' },
    { bg: ['#0A0A0A', '#171717'], accent: '#262626' },
    { bg: ['#0D1117', '#161B22'], accent: '#21262D' },
    { bg: ['#0F172A', '#0C4A6E'], accent: '#075985' },
    { bg: ['#1E1B4B', '#312E81'], accent: '#3730A3' },
    { bg: ['#14532D', '#064E3B'], accent: '#065F46' },
  ],
  nature: [
    { bg: ['#56AB2F', '#A8E063'], accent: '#65A30D' },
    { bg: ['#11998E', '#38EF7D'], accent: '#10B981' },
    { bg: ['#134E5E', '#71B280'], accent: '#059669' },
    { bg: ['#076585', '#D4FC79'], accent: '#0EA5E9' },
    { bg: ['#0F766E', '#34D399'], accent: '#14B8A6' },
    { bg: ['#047857', '#6EE7B7'], accent: '#10B981' },
    { bg: ['#15803D', '#86EFAC'], accent: '#22C55E' },
    { bg: ['#1D4ED8', '#38BDF8'], accent: '#3B82F6' },
    { bg: ['#0E7490', '#67E8F9'], accent: '#06B6D4' },
    { bg: ['#166534', '#4ADE80'], accent: '#22C55E' },
    { bg: ['#365314', '#84CC16'], accent: '#65A30D' },
    { bg: ['#064E3B', '#34D399'], accent: '#10B981' },
    { bg: ['#1E3A5F', '#67E8F9'], accent: '#22D3EE' },
  ],
  romantic: [
    { bg: ['#FF9A9E', '#FAD0C4'], accent: '#FB7185' },
    { bg: ['#FBC2EB', '#A6C1EE'], accent: '#D946EF' },
    { bg: ['#F093FB', '#F5576C'], accent: '#EC4899' },
    { bg: ['#FF9A9E', '#FECFEF'], accent: '#F472B6' },
    { bg: ['#FDA4AF', '#FECDD3'], accent: '#FB7185' },
    { bg: ['#FDE68A', '#F9A8D4'], accent: '#F472B6' },
    { bg: ['#F9A8D4', '#C084FC'], accent: '#D946EF' },
    { bg: ['#FBCFE8', '#DDD6FE'], accent: '#E879F9' },
    { bg: ['#FFE4E6', '#FCE7F3'], accent: '#FDA4AF' },
    { bg: ['#E11D48', '#9333EA'], accent: '#DB2777' },
    { bg: ['#BE185D', '#7C3AED'], accent: '#A21CAF' },
    { bg: ['#F472B6', '#C084FC'], accent: '#E879F9' },
    { bg: ['#FCA5A1', '#FDE68A'], accent: '#FBBF24' },
  ],
  classical: [
    { bg: ['#F5F0E8', '#D4C4A8'], accent: '#C0AD88' },
    { bg: ['#E8DCC8', '#C0AD88'], accent: '#A89668' },
    { bg: ['#F5F0E8', '#E8DCC8'], accent: '#D4C4A8' },
    { bg: ['#FFFBEB', '#FDE68A'], accent: '#FBBF24' },
    { bg: ['#FAF5FF', '#E9D5FF'], accent: '#C084FC' },
    { bg: ['#F5F5F4', '#D6D3D1'], accent: '#A8A29E' },
    { bg: ['#FAFAF9', '#E7E5E4'], accent: '#D6D3D1' },
    { bg: ['#FEF2F2', '#FECACA'], accent: '#FCA5A5' },
    { bg: ['#FEFCE8', '#FEF08A'], accent: '#FACC15' },
    { bg: ['#F0FDF4', '#BBF7D0'], accent: '#86EFAC' },
    { bg: ['#EFF6FF', '#BFDBFE'], accent: '#93C5FD' },
    { bg: ['#F8FAFC', '#CBD5E1'], accent: '#94A3B8' },
    { bg: ['#FFFBEB', '#FEF3C7'], accent: '#FDE68A' },
  ],
};

// 패턴 그리기 함수들 (13가지 변형)
const PATTERNS = [
  // 0: 대각선 그래디언트 + 원형 보케
  (ctx, palette) => {
    drawBg(ctx, palette.bg, 'diagonal');
    drawBokeh(ctx, palette.accent, 8, 60, 140);
  },
  // 1: 방사형 그래디언트 + 라인
  (ctx, palette) => {
    drawBg(ctx, palette.bg, 'radial');
    drawLines(ctx, palette.accent, 12, 2);
  },
  // 2: 수평 그래디언트 + 큰 원
  (ctx, palette) => {
    drawBg(ctx, palette.bg, 'horizontal');
    drawCircles(ctx, palette.accent, 3, 150, 300);
  },
  // 3: 수직 그래디언트 + 삼각형
  (ctx, palette) => {
    drawBg(ctx, palette.bg, 'vertical');
    drawTriangles(ctx, palette.accent, 6);
  },
  // 4: 대각선 + 격자
  (ctx, palette) => {
    drawBg(ctx, palette.bg, 'diagonal');
    drawGrid(ctx, palette.accent, 60);
  },
  // 5: 방사형 + 물결
  (ctx, palette) => {
    drawBg(ctx, palette.bg, 'radial');
    drawWaves(ctx, palette.accent, 4);
  },
  // 6: 수평 + 다이아몬드
  (ctx, palette) => {
    drawBg(ctx, palette.bg, 'horizontal');
    drawDiamonds(ctx, palette.accent, 5);
  },
  // 7: 수직 + 스트라이프
  (ctx, palette) => {
    drawBg(ctx, palette.bg, 'vertical');
    drawStripes(ctx, palette.accent, 20);
  },
  // 8: 대각선 + 작은 보케 다수
  (ctx, palette) => {
    drawBg(ctx, palette.bg, 'diagonal');
    drawBokeh(ctx, palette.accent, 20, 20, 60);
  },
  // 9: 방사형 + 큰 블러 원
  (ctx, palette) => {
    drawBg(ctx, palette.bg, 'radial');
    drawBlurredCircle(ctx, palette.accent, W * 0.5, H * 0.5, 400);
  },
  // 10: 수평 + 코너 빛
  (ctx, palette) => {
    drawBg(ctx, palette.bg, 'horizontal');
    drawCornerLight(ctx, palette.accent);
  },
  // 11: 대각선 역방향 + 점
  (ctx, palette) => {
    drawBg(ctx, palette.bg, 'diagonal-reverse');
    drawDots(ctx, palette.accent, 40);
  },
  // 12: 방사형 + 곡선
  (ctx, palette) => {
    drawBg(ctx, palette.bg, 'radial');
    drawCurves(ctx, palette.accent, 5);
  },
];

// ─── 배경 그리기 ──────────────────────────

function drawBg(ctx, colors, type) {
  let grad;
  switch (type) {
    case 'horizontal':
      grad = ctx.createLinearGradient(0, 0, W, 0);
      break;
    case 'vertical':
      grad = ctx.createLinearGradient(0, 0, 0, H);
      break;
    case 'diagonal-reverse':
      grad = ctx.createLinearGradient(W, 0, 0, H);
      break;
    case 'radial':
      grad = ctx.createRadialGradient(W / 2, H / 2, 0, W / 2, H / 2, W * 0.7);
      break;
    default: // diagonal
      grad = ctx.createLinearGradient(0, 0, W, H);
  }
  grad.addColorStop(0, colors[0]);
  grad.addColorStop(1, colors[1]);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, W, H);
}

// ─── 패턴 요소 ──────────────────────────

function drawBokeh(ctx, color, count, minR, maxR) {
  ctx.save();
  for (let i = 0; i < count; i++) {
    const r = minR + Math.random() * (maxR - minR);
    const x = Math.random() * W;
    const y = Math.random() * H;
    const grad = ctx.createRadialGradient(x, y, 0, x, y, r);
    grad.addColorStop(0, `${color}30`);
    grad.addColorStop(1, `${color}00`);
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

function drawLines(ctx, color, count, width) {
  ctx.save();
  ctx.strokeStyle = `${color}18`;
  ctx.lineWidth = width;
  for (let i = 0; i < count; i++) {
    ctx.beginPath();
    ctx.moveTo(Math.random() * W, 0);
    ctx.lineTo(Math.random() * W, H);
    ctx.stroke();
  }
  ctx.restore();
}

function drawCircles(ctx, color, count, minR, maxR) {
  ctx.save();
  ctx.globalAlpha = 0.08;
  for (let i = 0; i < count; i++) {
    ctx.beginPath();
    ctx.arc(Math.random() * W, Math.random() * H, minR + Math.random() * (maxR - minR), 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.fill();
  }
  ctx.restore();
}

function drawTriangles(ctx, color, count) {
  ctx.save();
  ctx.globalAlpha = 0.06;
  ctx.fillStyle = color;
  for (let i = 0; i < count; i++) {
    const s = 80 + Math.random() * 200;
    const x = Math.random() * W;
    const y = Math.random() * H;
    ctx.beginPath();
    ctx.moveTo(x, y - s / 2);
    ctx.lineTo(x - s / 2, y + s / 2);
    ctx.lineTo(x + s / 2, y + s / 2);
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();
}

function drawGrid(ctx, color, spacing) {
  ctx.save();
  ctx.strokeStyle = `${color}0A`;
  ctx.lineWidth = 1;
  for (let x = 0; x < W; x += spacing) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke(); }
  for (let y = 0; y < H; y += spacing) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }
  ctx.restore();
}

function drawWaves(ctx, color, count) {
  ctx.save();
  ctx.strokeStyle = `${color}15`;
  ctx.lineWidth = 2;
  for (let w = 0; w < count; w++) {
    const yOff = (H / (count + 1)) * (w + 1);
    ctx.beginPath();
    for (let x = 0; x <= W; x += 5) {
      const y = yOff + Math.sin((x / W) * Math.PI * 4 + w) * 40;
      x === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    }
    ctx.stroke();
  }
  ctx.restore();
}

function drawDiamonds(ctx, color, count) {
  ctx.save();
  ctx.globalAlpha = 0.06;
  ctx.fillStyle = color;
  for (let i = 0; i < count; i++) {
    const s = 60 + Math.random() * 140;
    const x = Math.random() * W;
    const y = Math.random() * H;
    ctx.beginPath();
    ctx.moveTo(x, y - s); ctx.lineTo(x + s * 0.6, y);
    ctx.lineTo(x, y + s); ctx.lineTo(x - s * 0.6, y);
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();
}

function drawStripes(ctx, color, spacing) {
  ctx.save();
  ctx.strokeStyle = `${color}0C`;
  ctx.lineWidth = spacing / 2;
  for (let x = -H; x < W + H; x += spacing * 2) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x + H, H);
    ctx.stroke();
  }
  ctx.restore();
}

function drawBlurredCircle(ctx, color, cx, cy, r) {
  ctx.save();
  const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
  grad.addColorStop(0, `${color}25`);
  grad.addColorStop(0.6, `${color}10`);
  grad.addColorStop(1, `${color}00`);
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawCornerLight(ctx, color) {
  ctx.save();
  const grad = ctx.createRadialGradient(0, 0, 0, 0, 0, W * 0.6);
  grad.addColorStop(0, `${color}20`);
  grad.addColorStop(1, `${color}00`);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, W, H);
  ctx.restore();
}

function drawDots(ctx, color, spacing) {
  ctx.save();
  ctx.fillStyle = `${color}12`;
  for (let x = spacing / 2; x < W; x += spacing) {
    for (let y = spacing / 2; y < H; y += spacing) {
      ctx.beginPath();
      ctx.arc(x, y, 2, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.restore();
}

function drawCurves(ctx, color, count) {
  ctx.save();
  ctx.strokeStyle = `${color}18`;
  ctx.lineWidth = 3;
  for (let i = 0; i < count; i++) {
    ctx.beginPath();
    const y1 = Math.random() * H;
    const y2 = Math.random() * H;
    ctx.moveTo(0, y1);
    ctx.bezierCurveTo(W * 0.3, y1 + 100, W * 0.7, y2 - 100, W, y2);
    ctx.stroke();
  }
  ctx.restore();
}

// ─── Public API ──────────────────────────

let generatedCache = {};

/**
 * 특정 무드의 fallback 이미지 data URL 배열 생성 (13개)
 * 캐시되어 동일 세션에서 재생성하지 않음
 */
export function getFallbackImages(mood, count = 6) {
  const cacheKey = `${mood}-${count}`;
  if (generatedCache[cacheKey]) {
    console.log(`[Fallback] 캐시 사용: ${mood} (${count}개)`);
    return generatedCache[cacheKey];
  }

  console.log(`[Fallback] 생성 중: ${mood} (${count}개)`);
  const palettes = MOOD_PALETTES[mood] || MOOD_PALETTES.calm;
  const urls = [];

  for (let i = 0; i < count; i++) {
    const canvas = document.createElement('canvas');
    canvas.width = W;
    canvas.height = H;
    const ctx = canvas.getContext('2d');

    const paletteIdx = i % palettes.length;
    const patternIdx = i % PATTERNS.length;

    PATTERNS[patternIdx](ctx, palettes[paletteIdx]);
    urls.push(canvas.toDataURL('image/jpeg', 0.85));
  }

  generatedCache[cacheKey] = urls;
  console.log(`[Fallback] ✓ ${urls.length}개 생성 완료 (${mood})`);
  return urls;
}

/**
 * 모든 무드의 전체 fallback 이미지 수
 */
export function getTotalFallbackCount() {
  return Object.keys(MOOD_PALETTES).length * 13; // 8 × 13 = 104
}

/**
 * 캐시 초기화
 */
export function clearFallbackCache() {
  generatedCache = {};
}
