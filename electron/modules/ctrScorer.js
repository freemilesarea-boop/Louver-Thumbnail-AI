/**
 * CTR Scoring Module
 * - Structural readability score
 * - Emotional impact score
 * - YouTube playlist style conformity
 * - Total score calculation
 */

function calculateContrastScore(config) {
  // Evaluate background-to-text contrast
  let score = 0;
  const { backgroundColor, textColor, hasGradient } = config;

  // High contrast between text and background is good
  if (backgroundColor && textColor) {
    const bgLuminance = estimateLuminance(backgroundColor);
    const textLuminance = estimateLuminance(textColor);
    const contrastRatio = Math.abs(bgLuminance - textLuminance);

    if (contrastRatio > 0.7) score += 25;
    else if (contrastRatio > 0.5) score += 20;
    else if (contrastRatio > 0.3) score += 12;
    else score += 5;
  } else {
    score += 15; // Default assumption
  }

  // Gradients tend to perform better visually
  if (hasGradient) score += 3;

  return Math.min(score, 25);
}

function calculateReadabilityScore(config) {
  let score = 0;
  const { fontSize, textLength, hasTextShadow, fontWeight } = config;

  // Larger fonts are more readable on thumbnails
  if (fontSize >= 60) score += 10;
  else if (fontSize >= 48) score += 8;
  else if (fontSize >= 36) score += 6;
  else score += 3;

  // Shorter text is better for thumbnails
  if (textLength <= 10) score += 8;
  else if (textLength <= 20) score += 6;
  else if (textLength <= 30) score += 4;
  else score += 2;

  // Text shadow improves readability
  if (hasTextShadow) score += 4;

  // Bold text stands out more
  if (fontWeight === 'bold' || fontWeight >= 700) score += 3;

  return Math.min(score, 25);
}

function calculateEmotionScore(config) {
  let score = 0;
  const { moodMatch, hasImage, colorHarmony, hasEmoji } = config;

  // Mood match with playlist content
  if (moodMatch === 'high') score += 10;
  else if (moodMatch === 'medium') score += 7;
  else score += 3;

  // Having a relevant image increases engagement
  if (hasImage) score += 8;

  // Color harmony
  if (colorHarmony === 'high') score += 5;
  else if (colorHarmony === 'medium') score += 3;
  else score += 1;

  // Emojis can boost CTR slightly
  if (hasEmoji) score += 2;

  return Math.min(score, 25);
}

function calculateStyleScore(config) {
  let score = 0;
  const { layoutType, aspectRatio, hasPlaylistIndicator, textPosition } = config;

  // Correct aspect ratio for YouTube thumbnails
  if (aspectRatio === '16:9') score += 5;

  // Clean layouts perform better
  if (layoutType === 'centered') score += 6;
  else if (layoutType === 'left-aligned') score += 5;
  else if (layoutType === 'split') score += 7;
  else score += 3;

  // Playlist indicator (e.g., track count, music icon)
  if (hasPlaylistIndicator) score += 4;

  // Text position affects engagement
  if (textPosition === 'center') score += 5;
  else if (textPosition === 'bottom') score += 4;
  else if (textPosition === 'top') score += 3;

  // Baseline style conformity
  score += 3;

  return Math.min(score, 25);
}

function estimateLuminance(color) {
  // Simple luminance estimation from hex color
  if (!color) return 0.5;

  let hex = color.replace('#', '');
  if (hex.length === 3) {
    hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2];
  }

  const r = parseInt(hex.substring(0, 2), 16) / 255;
  const g = parseInt(hex.substring(2, 4), 16) / 255;
  const b = parseInt(hex.substring(4, 6), 16) / 255;

  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function scoreThumbnail(config) {
  const contrast = calculateContrastScore(config);
  const readability = calculateReadabilityScore(config);
  const emotion = calculateEmotionScore(config);
  const style = calculateStyleScore(config);

  const totalScore = contrast + readability + emotion + style;

  let grade;
  if (totalScore >= 85) grade = 'S';
  else if (totalScore >= 75) grade = 'A';
  else if (totalScore >= 65) grade = 'B';
  else if (totalScore >= 50) grade = 'C';
  else grade = 'D';

  return {
    totalScore,
    grade,
    breakdown: {
      contrast: { score: contrast, max: 25, label: '배경 대비' },
      readability: { score: readability, max: 25, label: '텍스트 가독성' },
      emotion: { score: emotion, max: 25, label: '감정 자극 요소' },
      style: { score: style, max: 25, label: '스타일 적합도' },
    },
    recommendations: generateRecommendations({ contrast, readability, emotion, style }),
  };
}

function generateRecommendations(scores) {
  const recommendations = [];

  if (scores.contrast < 15) {
    recommendations.push('배경과 텍스트의 대비를 높여보세요.');
  }
  if (scores.readability < 15) {
    recommendations.push('텍스트 크기를 키우거나 글자 수를 줄여보세요.');
  }
  if (scores.emotion < 15) {
    recommendations.push('플레이리스트 분위기에 맞는 이미지나 색상을 추가해보세요.');
  }
  if (scores.style < 15) {
    recommendations.push('레이아웃을 중앙 정렬 또는 분할 구도로 변경해보세요.');
  }

  if (recommendations.length === 0) {
    recommendations.push('훌륭한 썸네일입니다! 높은 CTR이 예상됩니다.');
  }

  return recommendations;
}

module.exports = { scoreThumbnail };
