/**
 * Thumbnail Composer Engine (v2 - Image Support)
 * Canvas-based thumbnail generation running in the renderer process
 *
 * Supports:
 * - Real image backgrounds (YouTube thumbnails, external images)
 * - Gradient fallback when image loading fails
 * - Overlay system for text readability on photos
 * - Debug logging for all image operations
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
    overlayStyle: 'full',
  },
  leftAligned: {
    name: '좌측 정렬',
    textX: 80,
    textY: THUMBNAIL_HEIGHT / 2,
    textAlign: 'left',
    maxTextWidth: THUMBNAIL_WIDTH * 0.6,
    overlayStyle: 'leftHalf',
  },
  bottomCenter: {
    name: '하단 중앙',
    textX: THUMBNAIL_WIDTH / 2,
    textY: THUMBNAIL_HEIGHT * 0.75,
    textAlign: 'center',
    maxTextWidth: THUMBNAIL_WIDTH * 0.85,
    overlayStyle: 'bottomGradient',
  },
  splitLeft: {
    name: '분할 좌측',
    textX: THUMBNAIL_WIDTH * 0.3,
    textY: THUMBNAIL_HEIGHT / 2,
    textAlign: 'center',
    maxTextWidth: THUMBNAIL_WIDTH * 0.5,
    overlayStyle: 'leftHalf',
  },
  topLeft: {
    name: '상단 좌측',
    textX: 80,
    textY: THUMBNAIL_HEIGHT * 0.3,
    textAlign: 'left',
    maxTextWidth: THUMBNAIL_WIDTH * 0.65,
    overlayStyle: 'topGradient',
  },
};

// Design presets for different moods
const DESIGN_PRESETS = {
  calm: {
    gradients: [['#E0F2FE', '#BAE6FD'], ['#DBEAFE', '#BFDBFE'], ['#E0E7FF', '#C7D2FE'], ['#F0F9FF', '#E0F2FE']],
    textColor: '#1E3A5F', subTextColor: '#64748B',
    imageTextColor: '#FFFFFF', imageSubTextColor: '#E2E8F0',
    fontSize: 64, fontWeight: '600', overlayOpacity: 0.45,
  },
  energetic: {
    gradients: [['#FF6B6B', '#FFE66D'], ['#F97316', '#FBBF24'], ['#EF4444', '#F59E0B'], ['#DC2626', '#FB923C']],
    textColor: '#FFFFFF', subTextColor: '#FEF3C7',
    imageTextColor: '#FFFFFF', imageSubTextColor: '#FEF3C7',
    fontSize: 72, fontWeight: '800', overlayOpacity: 0.4,
  },
  emotional: {
    gradients: [['#667EEA', '#764BA2'], ['#6366F1', '#A855F7'], ['#4F46E5', '#7C3AED'], ['#312E81', '#6D28D9']],
    textColor: '#FFFFFF', subTextColor: '#E0E7FF',
    imageTextColor: '#FFFFFF', imageSubTextColor: '#E0E7FF',
    fontSize: 60, fontWeight: '600', overlayOpacity: 0.5,
  },
  cozy: {
    gradients: [['#F6D365', '#FDA085'], ['#FBBF24', '#F59E0B'], ['#FDE68A', '#FCA5A1'], ['#FEF3C7', '#FECACA']],
    textColor: '#78350F', subTextColor: '#92400E',
    imageTextColor: '#FFFFFF', imageSubTextColor: '#FDE68A',
    fontSize: 60, fontWeight: '600', overlayOpacity: 0.45,
  },
  dark: {
    gradients: [['#0F0C29', '#302B63'], ['#1A1A2E', '#16213E'], ['#0F172A', '#1E293B'], ['#111827', '#1F2937']],
    textColor: '#FFFFFF', subTextColor: '#94A3B8',
    imageTextColor: '#FFFFFF', imageSubTextColor: '#94A3B8',
    fontSize: 64, fontWeight: '700', overlayOpacity: 0.55,
  },
  nature: {
    gradients: [['#56AB2F', '#A8E063'], ['#11998E', '#38EF7D'], ['#134E5E', '#71B280'], ['#076585', '#D4FC79']],
    textColor: '#FFFFFF', subTextColor: '#D1FAE5',
    imageTextColor: '#FFFFFF', imageSubTextColor: '#D1FAE5',
    fontSize: 60, fontWeight: '600', overlayOpacity: 0.4,
  },
  romantic: {
    gradients: [['#FF9A9E', '#FAD0C4'], ['#FBC2EB', '#A6C1EE'], ['#F093FB', '#F5576C'], ['#FF9A9E', '#FECFEF']],
    textColor: '#831843', subTextColor: '#9D174D',
    imageTextColor: '#FFFFFF', imageSubTextColor: '#FBCFE8',
    fontSize: 60, fontWeight: '600', overlayOpacity: 0.45,
  },
  classical: {
    gradients: [['#F5F0E8', '#D4C4A8'], ['#E8DCC8', '#C0AD88'], ['#F5F0E8', '#E8DCC8'], ['#FFFBEB', '#FDE68A']],
    textColor: '#44403C', subTextColor: '#78716C',
    imageTextColor: '#FFFFFF', imageSubTextColor: '#E8DCC8',
    fontSize: 58, fontWeight: '500', overlayOpacity: 0.45,
  },
};

// ─── Image Loading ──────────────────────────────────────────

/**
 * Load an image from URL.
 *
 * Electron: 메인 프로세스 프록시로 다운로드 → base64 data URL (CORS 완전 우회)
 * 브라우저: fetch→blob→objectURL (개발용)
 * data:image URL: 직접 로드 (fallback 이미지)
 *
 * Returns HTMLImageElement or null on failure.
 */
async function loadImage(url) {
  if (!url) {
    console.log('[Composer] No image URL');
    return null;
  }

  try {
    let imgSrc;

    if (url.startsWith('data:')) {
      // 이미 data URL (fallback 이미지) → 바로 사용
      imgSrc = url;
      console.log('[Composer] Loading data URL image');
    } else if (typeof window !== 'undefined' && window.louverAPI?.isElectron) {
      // Electron: 메인 프로세스에서 다운로드 (CORS 없음)
      console.log(`[Composer] Fetching via Electron proxy: ${url}`);
      const result = await window.louverAPI.fetchImage(url);
      if (!result.success) {
        console.warn(`[Composer] ✗ Electron proxy failed: ${result.error}`);
        return null;
      }
      imgSrc = result.dataUrl;
    } else {
      // 브라우저: fetch → blob → objectURL
      console.log(`[Composer] Fetching via browser: ${url}`);
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);
      const response = await fetch(url, { mode: 'cors', signal: controller.signal });
      clearTimeout(timeoutId);
      if (!response.ok) {
        console.warn(`[Composer] ✗ HTTP ${response.status}: ${url}`);
        return null;
      }
      const blob = await response.blob();
      imgSrc = URL.createObjectURL(blob);
    }

    // Image 엘리먼트로 변환
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        console.log(`[Composer] ✓ Image ready: ${img.width}x${img.height}`);
        resolve(img);
      };
      img.onerror = () => {
        console.warn(`[Composer] ✗ Image element error`);
        resolve(null);
      };
      img.src = imgSrc;
    });
  } catch (err) {
    console.warn(`[Composer] ✗ ${err.name === 'AbortError' ? 'Timeout' : err.message}: ${url}`);
    return null;
  }
}

// ─── Drawing Functions ──────────────────────────────────────

function createCanvas() {
  const canvas = document.createElement('canvas');
  canvas.width = THUMBNAIL_WIDTH;
  canvas.height = THUMBNAIL_HEIGHT;
  return canvas;
}

/**
 * Draw image as background with cover-fit (fills entire canvas, crops excess)
 */
function drawImageBackground(ctx, img) {
  const imgRatio = img.width / img.height;
  const canvasRatio = THUMBNAIL_WIDTH / THUMBNAIL_HEIGHT;

  let drawWidth, drawHeight, offsetX, offsetY;

  if (imgRatio > canvasRatio) {
    // Image is wider - fit height, crop sides
    drawHeight = THUMBNAIL_HEIGHT;
    drawWidth = img.width * (THUMBNAIL_HEIGHT / img.height);
    offsetX = -(drawWidth - THUMBNAIL_WIDTH) / 2;
    offsetY = 0;
  } else {
    // Image is taller - fit width, crop top/bottom
    drawWidth = THUMBNAIL_WIDTH;
    drawHeight = img.height * (THUMBNAIL_WIDTH / img.width);
    offsetX = 0;
    offsetY = -(drawHeight - THUMBNAIL_HEIGHT) / 2;
  }

  ctx.drawImage(img, offsetX, offsetY, drawWidth, drawHeight);
}

/**
 * Draw overlay on top of image for text readability
 */
function drawImageOverlay(ctx, overlayStyle, opacity) {
  switch (overlayStyle) {
    case 'bottomGradient': {
      const grad = ctx.createLinearGradient(0, THUMBNAIL_HEIGHT * 0.3, 0, THUMBNAIL_HEIGHT);
      grad.addColorStop(0, 'rgba(0, 0, 0, 0)');
      grad.addColorStop(0.5, `rgba(0, 0, 0, ${opacity * 0.5})`);
      grad.addColorStop(1, `rgba(0, 0, 0, ${opacity})`);
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, THUMBNAIL_WIDTH, THUMBNAIL_HEIGHT);
      break;
    }
    case 'topGradient': {
      const grad = ctx.createLinearGradient(0, 0, 0, THUMBNAIL_HEIGHT * 0.7);
      grad.addColorStop(0, `rgba(0, 0, 0, ${opacity})`);
      grad.addColorStop(0.5, `rgba(0, 0, 0, ${opacity * 0.5})`);
      grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, THUMBNAIL_WIDTH, THUMBNAIL_HEIGHT);
      break;
    }
    case 'leftHalf': {
      const grad = ctx.createLinearGradient(0, 0, THUMBNAIL_WIDTH * 0.7, 0);
      grad.addColorStop(0, `rgba(0, 0, 0, ${opacity})`);
      grad.addColorStop(0.6, `rgba(0, 0, 0, ${opacity * 0.4})`);
      grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, THUMBNAIL_WIDTH, THUMBNAIL_HEIGHT);
      break;
    }
    case 'full':
    default: {
      ctx.fillStyle = `rgba(0, 0, 0, ${opacity})`;
      ctx.fillRect(0, 0, THUMBNAIL_WIDTH, THUMBNAIL_HEIGHT);
      break;
    }
  }
}

function drawGradientBackground(ctx, colors) {
  const gradient = ctx.createLinearGradient(0, 0, THUMBNAIL_WIDTH, THUMBNAIL_HEIGHT);
  gradient.addColorStop(0, colors[0]);
  gradient.addColorStop(1, colors[1]);
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, THUMBNAIL_WIDTH, THUMBNAIL_HEIGHT);
}

function drawDecorationElements(ctx, mood, gradientColors) {
  ctx.save();
  ctx.globalAlpha = 0.08;

  if (mood === 'calm' || mood === 'nature') {
    for (let i = 0; i < 5; i++) {
      ctx.beginPath();
      ctx.arc(
        Math.random() * THUMBNAIL_WIDTH, Math.random() * THUMBNAIL_HEIGHT,
        80 + Math.random() * 120, 0, Math.PI * 2
      );
      ctx.fillStyle = gradientColors[0];
      ctx.fill();
    }
  } else if (mood === 'energetic') {
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 3;
    for (let i = 0; i < 8; i++) {
      ctx.beginPath();
      ctx.moveTo(Math.random() * THUMBNAIL_WIDTH, 0);
      ctx.lineTo(Math.random() * THUMBNAIL_WIDTH, THUMBNAIL_HEIGHT);
      ctx.stroke();
    }
  } else if (mood === 'dark') {
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 0.5;
    ctx.globalAlpha = 0.03;
    for (let x = 0; x < THUMBNAIL_WIDTH; x += 40) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, THUMBNAIL_HEIGHT); ctx.stroke();
    }
    for (let y = 0; y < THUMBNAIL_HEIGHT; y += 40) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(THUMBNAIL_WIDTH, y); ctx.stroke();
    }
  } else if (mood === 'emotional') {
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
  if (currentLine) lines.push(currentLine);
  return lines;
}

function drawText(ctx, config) {
  const {
    text, subText, layout, textColor, subTextColor,
    fontSize, fontWeight, hasTextShadow = true,
  } = config;

  const layoutConfig = LAYOUTS[layout] || LAYOUTS.centered;

  if (hasTextShadow) {
    ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
    ctx.shadowBlur = 12;
    ctx.shadowOffsetX = 2;
    ctx.shadowOffsetY = 3;
  }

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

  if (subText) {
    ctx.shadowBlur = 6;
    ctx.font = `400 ${Math.round(fontSize * 0.4)}px Inter, sans-serif`;
    ctx.fillStyle = subTextColor;
    ctx.fillText(subText, layoutConfig.textX, startY + lines.length * lineHeight + fontSize * 0.3);
  }

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

  ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
  const radius = badgeHeight / 2;
  ctx.beginPath();
  ctx.roundRect(badgeX - badgeWidth, badgeY - badgeHeight / 2, badgeWidth, badgeHeight, radius);
  ctx.fill();

  ctx.fillStyle = '#FFFFFF';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(badgeText, badgeX - badgeWidth / 2, badgeY);
}

function drawLouverWatermark(ctx) {
  ctx.save();
  ctx.font = '400 14px Inter, sans-serif';
  ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
  ctx.textAlign = 'right';
  ctx.textBaseline = 'bottom';
  ctx.fillText('Louver', THUMBNAIL_WIDTH - 24, THUMBNAIL_HEIGHT - 16);
  ctx.restore();
}

// ─── Main Generation (Async) ────────────────────────────────

/**
 * Generate a single thumbnail variant (async - loads image)
 */
async function generateThumbnail(config) {
  const {
    title,
    subTitle = '',
    mood = 'calm',
    layout = 'centered',
    variantIndex = 0,
    trackCount = null,
    customGradient = null,
    imageUrl = null,
  } = config;

  const canvas = createCanvas();
  const ctx = canvas.getContext('2d');
  const preset = DESIGN_PRESETS[mood] || DESIGN_PRESETS.calm;
  const gradientColors = customGradient || preset.gradients[variantIndex % preset.gradients.length];
  const layoutConfig = LAYOUTS[layout] || LAYOUTS.centered;

  let usedImage = false;
  let imageSource = 'none';

  // ── Step 1: Try to load and draw image background ──
  if (imageUrl) {
    console.log(`[Composer] Variant ${variantIndex}: Attempting image load → ${imageUrl}`);
    const img = await loadImage(imageUrl);

    if (img) {
      drawImageBackground(ctx, img);
      drawImageOverlay(ctx, layoutConfig.overlayStyle, preset.overlayOpacity);
      usedImage = true;
      imageSource = imageUrl;
      console.log(`[Composer] Variant ${variantIndex}: ✓ Using IMAGE background`);
    } else {
      console.warn(`[Composer] Variant ${variantIndex}: ✗ Image failed, using GRADIENT fallback`);
      drawGradientBackground(ctx, gradientColors);
      drawDecorationElements(ctx, mood, gradientColors);
      imageSource = 'gradient-fallback';
    }
  } else {
    // No image URL provided — use gradient
    console.log(`[Composer] Variant ${variantIndex}: No imageUrl provided, using GRADIENT`);
    drawGradientBackground(ctx, gradientColors);
    drawDecorationElements(ctx, mood, gradientColors);
    imageSource = 'gradient-no-url';
  }

  // ── Step 2: Draw text (use image-optimized colors when on photo) ──
  drawText(ctx, {
    text: title,
    subText: subTitle,
    layout,
    textColor: usedImage ? preset.imageTextColor : preset.textColor,
    subTextColor: usedImage ? preset.imageSubTextColor : preset.subTextColor,
    fontSize: preset.fontSize,
    fontWeight: preset.fontWeight,
  });

  // ── Step 3: Draw playlist badge ──
  if (trackCount) {
    drawPlaylistBadge(ctx, trackCount);
  }

  // ── Step 4: Draw Louver watermark ──
  drawLouverWatermark(ctx);

  // ── Debug summary ──
  console.log(`[Composer] Variant ${variantIndex} complete → image: ${usedImage}, source: ${imageSource}, layout: ${layout}`);

  return {
    dataUrl: canvas.toDataURL('image/png'),
    usedImage,
    imageSource,
  };
}

/**
 * Generate multiple thumbnail variants (async - loads images in parallel)
 */
async function generateThumbnailSet(config) {
  const {
    title,
    subTitle = '',
    mood = 'calm',
    trackCount = null,
    count = 6,
    imageUrls = [],
  } = config;

  console.log('═══════════════════════════════════════════');
  console.log('[Composer] generateThumbnailSet called');
  console.log(`[Composer] Title: "${title}"`);
  console.log(`[Composer] Mood: ${mood}`);
  console.log(`[Composer] Image URLs provided: ${imageUrls.length}`);
  imageUrls.forEach((url, i) => console.log(`  [${i}] ${url}`));
  console.log('═══════════════════════════════════════════');

  const layouts = Object.keys(LAYOUTS);
  const preset = DESIGN_PRESETS[mood] || DESIGN_PRESETS.calm;

  // Build generation promises
  const promises = [];

  for (let i = 0; i < count; i++) {
    const layout = layouts[i % layouts.length];
    const gradientColors = preset.gradients[i % preset.gradients.length];
    // Cycle through available images, or null if none
    const imageUrl = imageUrls.length > 0 ? imageUrls[i % imageUrls.length] : null;

    promises.push(
      generateThumbnail({
        title,
        subTitle,
        mood,
        layout,
        variantIndex: i,
        trackCount,
        customGradient: gradientColors,
        imageUrl,
      }).then((result) => ({
        id: `thumb-${Date.now()}-${i}`,
        dataUrl: result.dataUrl,
        layout: LAYOUTS[layout].name,
        mood,
        gradientColors,
        usedImage: result.usedImage,
        imageSource: result.imageSource,
        config: {
          backgroundColor: gradientColors[0],
          textColor: result.usedImage ? preset.imageTextColor : preset.textColor,
          hasGradient: !result.usedImage,
          fontSize: preset.fontSize,
          textLength: title.length,
          hasTextShadow: true,
          fontWeight: preset.fontWeight,
          moodMatch: 'high',
          hasImage: result.usedImage,
          colorHarmony: 'high',
          hasEmoji: false,
          layoutType: layout === 'centered' ? 'centered' : layout === 'splitLeft' ? 'split' : 'left-aligned',
          aspectRatio: '16:9',
          hasPlaylistIndicator: !!trackCount,
          textPosition: layout === 'bottomCenter' ? 'bottom' : layout === 'topLeft' ? 'top' : 'center',
        },
      }))
    );
  }

  const results = await Promise.all(promises);

  // Final summary
  const imageCount = results.filter((r) => r.usedImage).length;
  const gradientCount = results.filter((r) => !r.usedImage).length;
  console.log('───────────────────────────────────────────');
  console.log(`[Composer] DONE: ${results.length} thumbnails generated`);
  console.log(`[Composer]   Image-based: ${imageCount}`);
  console.log(`[Composer]   Gradient-based: ${gradientCount}`);
  console.log('───────────────────────────────────────────');

  return results;
}

export {
  generateThumbnail,
  generateThumbnailSet,
  loadImage,
  LAYOUTS,
  DESIGN_PRESETS,
  THUMBNAIL_WIDTH,
  THUMBNAIL_HEIGHT,
};
