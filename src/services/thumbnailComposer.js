/**
 * Thumbnail Composer Engine
 * Canvas-based thumbnail generation running in the renderer process
 *
 * Generates 1280x720 YouTube thumbnail images with:
 * - Background gradients or images
 * - Text overlay with proper typography
 * - Layout composition
 * - CTR-optimized design patterns
 */

const THUMBNAIL_WIDTH = 1280;
const THUMBNAIL_HEIGHT = 720;

// Predefined layout templates
const LAYOUTS = {
  centered: {
    name: '중앙 정렬',
    textX: THUMBNAIL_WIDTH / 2,
    textY: THUMBNAIL_HEIGHT / 2,
    textAlign: 'center',
    maxTextWidth: THUMBNAIL_WIDTH * 0.8,
  },
  leftAligned: {
    name: '좌측 정렬',
    textX: 80,
    textY: THUMBNAIL_HEIGHT / 2,
    textAlign: 'left',
    maxTextWidth: THUMBNAIL_WIDTH * 0.6,
  },
  bottomCenter: {
    name: '하단 중앙',
    textX: THUMBNAIL_WIDTH / 2,
    textY: THUMBNAIL_HEIGHT * 0.72,
    textAlign: 'center',
    maxTextWidth: THUMBNAIL_WIDTH * 0.85,
  },
  splitLeft: {
    name: '분할 좌측',
    textX: THUMBNAIL_WIDTH * 0.3,
    textY: THUMBNAIL_HEIGHT / 2,
    textAlign: 'center',
    maxTextWidth: THUMBNAIL_WIDTH * 0.5,
  },
  topLeft: {
    name: '상단 좌측',
    textX: 80,
    textY: THUMBNAIL_HEIGHT * 0.3,
    textAlign: 'left',
    maxTextWidth: THUMBNAIL_WIDTH * 0.65,
  },
};

// Design presets for different moods
const DESIGN_PRESETS = {
  calm: {
    gradients: [
      ['#E0F2FE', '#BAE6FD'],
      ['#DBEAFE', '#BFDBFE'],
      ['#E0E7FF', '#C7D2FE'],
      ['#F0F9FF', '#E0F2FE'],
    ],
    textColor: '#1E3A5F',
    subTextColor: '#64748B',
    fontSize: 64,
    fontWeight: '600',
    overlayOpacity: 0,
  },
  energetic: {
    gradients: [
      ['#FF6B6B', '#FFE66D'],
      ['#F97316', '#FBBF24'],
      ['#EF4444', '#F59E0B'],
      ['#DC2626', '#FB923C'],
    ],
    textColor: '#FFFFFF',
    subTextColor: '#FEF3C7',
    fontSize: 72,
    fontWeight: '800',
    overlayOpacity: 0.1,
  },
  emotional: {
    gradients: [
      ['#667EEA', '#764BA2'],
      ['#6366F1', '#A855F7'],
      ['#4F46E5', '#7C3AED'],
      ['#312E81', '#6D28D9'],
    ],
    textColor: '#FFFFFF',
    subTextColor: '#E0E7FF',
    fontSize: 60,
    fontWeight: '600',
    overlayOpacity: 0.15,
  },
  cozy: {
    gradients: [
      ['#F6D365', '#FDA085'],
      ['#FBBF24', '#F59E0B'],
      ['#FDE68A', '#FCA5A1'],
      ['#FEF3C7', '#FECACA'],
    ],
    textColor: '#78350F',
    subTextColor: '#92400E',
    fontSize: 60,
    fontWeight: '600',
    overlayOpacity: 0,
  },
  dark: {
    gradients: [
      ['#0F0C29', '#302B63'],
      ['#1A1A2E', '#16213E'],
      ['#0F172A', '#1E293B'],
      ['#111827', '#1F2937'],
    ],
    textColor: '#FFFFFF',
    subTextColor: '#94A3B8',
    fontSize: 64,
    fontWeight: '700',
    overlayOpacity: 0,
  },
  nature: {
    gradients: [
      ['#56AB2F', '#A8E063'],
      ['#11998E', '#38EF7D'],
      ['#134E5E', '#71B280'],
      ['#076585', '#FFF'],
    ],
    textColor: '#FFFFFF',
    subTextColor: '#D1FAE5',
    fontSize: 60,
    fontWeight: '600',
    overlayOpacity: 0.1,
  },
  romantic: {
    gradients: [
      ['#FF9A9E', '#FAD0C4'],
      ['#FBC2EB', '#A6C1EE'],
      ['#F093FB', '#F5576C'],
      ['#FF9A9E', '#FECFEF'],
    ],
    textColor: '#831843',
    subTextColor: '#9D174D',
    fontSize: 60,
    fontWeight: '600',
    overlayOpacity: 0,
  },
  classical: {
    gradients: [
      ['#F5F0E8', '#D4C4A8'],
      ['#E8DCC8', '#C0AD88'],
      ['#F5F0E8', '#E8DCC8'],
      ['#FFFBEB', '#FDE68A'],
    ],
    textColor: '#44403C',
    subTextColor: '#78716C',
    fontSize: 58,
    fontWeight: '500',
    overlayOpacity: 0,
  },
};

function createCanvas() {
  const canvas = document.createElement('canvas');
  canvas.width = THUMBNAIL_WIDTH;
  canvas.height = THUMBNAIL_HEIGHT;
  return canvas;
}

function drawGradientBackground(ctx, colors) {
  const gradient = ctx.createLinearGradient(0, 0, THUMBNAIL_WIDTH, THUMBNAIL_HEIGHT);
  gradient.addColorStop(0, colors[0]);
  gradient.addColorStop(1, colors[1]);
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, THUMBNAIL_WIDTH, THUMBNAIL_HEIGHT);
}

function drawOverlay(ctx, opacity) {
  if (opacity <= 0) return;
  ctx.fillStyle = `rgba(0, 0, 0, ${opacity})`;
  ctx.fillRect(0, 0, THUMBNAIL_WIDTH, THUMBNAIL_HEIGHT);
}

function drawDecorationElements(ctx, mood, gradientColors) {
  ctx.save();
  ctx.globalAlpha = 0.08;

  if (mood === 'calm' || mood === 'nature') {
    // Soft circles
    for (let i = 0; i < 5; i++) {
      ctx.beginPath();
      ctx.arc(
        Math.random() * THUMBNAIL_WIDTH,
        Math.random() * THUMBNAIL_HEIGHT,
        80 + Math.random() * 120,
        0,
        Math.PI * 2
      );
      ctx.fillStyle = gradientColors[0];
      ctx.fill();
    }
  } else if (mood === 'energetic') {
    // Dynamic diagonal lines
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 3;
    for (let i = 0; i < 8; i++) {
      ctx.beginPath();
      ctx.moveTo(Math.random() * THUMBNAIL_WIDTH, 0);
      ctx.lineTo(Math.random() * THUMBNAIL_WIDTH, THUMBNAIL_HEIGHT);
      ctx.stroke();
    }
  } else if (mood === 'dark') {
    // Grid pattern
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 0.5;
    ctx.globalAlpha = 0.03;
    for (let x = 0; x < THUMBNAIL_WIDTH; x += 40) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, THUMBNAIL_HEIGHT);
      ctx.stroke();
    }
    for (let y = 0; y < THUMBNAIL_HEIGHT; y += 40) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(THUMBNAIL_WIDTH, y);
      ctx.stroke();
    }
  } else if (mood === 'emotional') {
    // Soft bokeh circles
    for (let i = 0; i < 8; i++) {
      const radius = 40 + Math.random() * 100;
      const x = Math.random() * THUMBNAIL_WIDTH;
      const y = Math.random() * THUMBNAIL_HEIGHT;
      const grad = ctx.createRadialGradient(x, y, 0, x, y, radius);
      grad.addColorStop(0, 'rgba(255, 255, 255, 0.15)');
      grad.addColorStop(1, 'rgba(255, 255, 255, 0)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  ctx.restore();
}

function wrapText(ctx, text, maxWidth) {
  const words = text.split('');
  const lines = [];
  let currentLine = '';

  for (const char of words) {
    const testLine = currentLine + char;
    const metrics = ctx.measureText(testLine);
    if (metrics.width > maxWidth && currentLine.length > 0) {
      lines.push(currentLine);
      currentLine = char;
    } else {
      currentLine = testLine;
    }
  }
  if (currentLine) {
    lines.push(currentLine);
  }
  return lines;
}

function drawText(ctx, config) {
  const {
    text,
    subText,
    layout,
    textColor,
    subTextColor,
    fontSize,
    fontWeight,
    hasTextShadow = true,
  } = config;

  const layoutConfig = LAYOUTS[layout] || LAYOUTS.centered;

  // Text shadow for readability
  if (hasTextShadow) {
    ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
    ctx.shadowBlur = 8;
    ctx.shadowOffsetX = 2;
    ctx.shadowOffsetY = 2;
  }

  // Main title
  ctx.font = `${fontWeight} ${fontSize}px Inter, sans-serif`;
  ctx.fillStyle = textColor;
  ctx.textAlign = layoutConfig.textAlign;
  ctx.textBaseline = 'middle';

  const lines = wrapText(ctx, text, layoutConfig.maxTextWidth);
  const lineHeight = fontSize * 1.3;
  const totalHeight = lines.length * lineHeight;
  const startY = layoutConfig.textY - totalHeight / 2 + lineHeight / 2;

  lines.forEach((line, i) => {
    ctx.fillText(line, layoutConfig.textX, startY + i * lineHeight);
  });

  // Sub text
  if (subText) {
    ctx.shadowBlur = 4;
    ctx.font = `400 ${Math.round(fontSize * 0.4)}px Inter, sans-serif`;
    ctx.fillStyle = subTextColor;
    ctx.fillText(
      subText,
      layoutConfig.textX,
      startY + lines.length * lineHeight + fontSize * 0.3
    );
  }

  // Reset shadow
  ctx.shadowColor = 'transparent';
  ctx.shadowBlur = 0;
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = 0;
}

function drawPlaylistBadge(ctx, trackCount) {
  if (!trackCount) return;

  const badgeText = `♪ ${trackCount} tracks`;
  const padding = 16;
  const badgeHeight = 36;
  const badgeX = THUMBNAIL_WIDTH - 40;
  const badgeY = 40;

  ctx.font = '500 16px Inter, sans-serif';
  const textWidth = ctx.measureText(badgeText).width;
  const badgeWidth = textWidth + padding * 2;

  // Badge background
  ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
  const radius = badgeHeight / 2;
  ctx.beginPath();
  ctx.roundRect(
    badgeX - badgeWidth,
    badgeY - badgeHeight / 2,
    badgeWidth,
    badgeHeight,
    radius
  );
  ctx.fill();

  // Badge text
  ctx.fillStyle = '#FFFFFF';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(badgeText, badgeX - badgeWidth / 2, badgeY);
}

function drawLouverWatermark(ctx) {
  ctx.save();
  ctx.font = '400 14px Inter, sans-serif';
  ctx.fillStyle = 'rgba(255, 255, 255, 0.35)';
  ctx.textAlign = 'right';
  ctx.textBaseline = 'bottom';
  ctx.fillText('Louver', THUMBNAIL_WIDTH - 24, THUMBNAIL_HEIGHT - 16);
  ctx.restore();
}

/**
 * Generate a single thumbnail variant
 */
function generateThumbnail(config) {
  const {
    title,
    subTitle = '',
    mood = 'calm',
    layout = 'centered',
    variantIndex = 0,
    trackCount = null,
    customGradient = null,
  } = config;

  const canvas = createCanvas();
  const ctx = canvas.getContext('2d');

  const preset = DESIGN_PRESETS[mood] || DESIGN_PRESETS.calm;
  const gradientColors =
    customGradient || preset.gradients[variantIndex % preset.gradients.length];

  // 1. Draw gradient background
  drawGradientBackground(ctx, gradientColors);

  // 2. Draw overlay
  drawOverlay(ctx, preset.overlayOpacity);

  // 3. Draw decoration elements
  drawDecorationElements(ctx, mood, gradientColors);

  // 4. Draw main text
  drawText(ctx, {
    text: title,
    subText: subTitle,
    layout,
    textColor: preset.textColor,
    subTextColor: preset.subTextColor,
    fontSize: preset.fontSize,
    fontWeight: preset.fontWeight,
  });

  // 5. Draw playlist badge
  if (trackCount) {
    drawPlaylistBadge(ctx, trackCount);
  }

  // 6. Draw Louver watermark
  drawLouverWatermark(ctx);

  return canvas.toDataURL('image/png');
}

/**
 * Generate multiple thumbnail variants
 */
function generateThumbnailSet(config) {
  const {
    title,
    subTitle = '',
    mood = 'calm',
    trackCount = null,
    count = 6,
  } = config;

  const layouts = Object.keys(LAYOUTS);
  const preset = DESIGN_PRESETS[mood] || DESIGN_PRESETS.calm;
  const results = [];

  for (let i = 0; i < count; i++) {
    const layout = layouts[i % layouts.length];
    const gradientColors = preset.gradients[i % preset.gradients.length];

    const dataUrl = generateThumbnail({
      title,
      subTitle,
      mood,
      layout,
      variantIndex: i,
      trackCount,
      customGradient: gradientColors,
    });

    results.push({
      id: `thumb-${Date.now()}-${i}`,
      dataUrl,
      layout: LAYOUTS[layout].name,
      mood,
      gradientColors,
      config: {
        backgroundColor: gradientColors[0],
        textColor: preset.textColor,
        hasGradient: true,
        fontSize: preset.fontSize,
        textLength: title.length,
        hasTextShadow: true,
        fontWeight: preset.fontWeight,
        moodMatch: 'high',
        hasImage: false,
        colorHarmony: 'high',
        hasEmoji: false,
        layoutType: layout === 'centered' ? 'centered' : layout === 'splitLeft' ? 'split' : 'left-aligned',
        aspectRatio: '16:9',
        hasPlaylistIndicator: !!trackCount,
        textPosition: layout === 'bottomCenter' ? 'bottom' : layout === 'topLeft' ? 'top' : 'center',
      },
    });
  }

  return results;
}

export {
  generateThumbnail,
  generateThumbnailSet,
  LAYOUTS,
  DESIGN_PRESETS,
  THUMBNAIL_WIDTH,
  THUMBNAIL_HEIGHT,
};
