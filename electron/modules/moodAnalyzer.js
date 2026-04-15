/**
 * Mood Analysis Module
 * - Keyword-based mood extraction from titles
 * - Sentiment/mood labeling
 * - Category classification
 * - Color palette suggestion
 */

const MOOD_KEYWORDS = {
  calm: {
    keywords: ['잔잔', '편안', '힐링', 'calm', 'relax', 'peaceful', 'chill', '평화', '고요', 'gentle', 'soft', 'quiet', '수면', 'sleep', 'ambient'],
    label: '잔잔한 / 편안한',
    colors: ['#E0F2FE', '#BAE6FD', '#7DD3FC', '#93C5FD', '#C7D2FE'],
    gradient: ['#E0F7FA', '#B2EBF2'],
    fontStyle: 'light',
  },
  energetic: {
    keywords: ['신나는', '에너지', 'energy', 'upbeat', 'party', 'dance', '클럽', 'EDM', 'hype', 'pump', '운동', 'workout', 'gym', 'power'],
    label: '에너지틱 / 신나는',
    colors: ['#FEF3C7', '#FDE68A', '#FCD34D', '#FB923C', '#F97316'],
    gradient: ['#FF6B6B', '#FFE66D'],
    fontStyle: 'bold',
  },
  emotional: {
    keywords: ['감성', '새벽', '밤', 'night', 'emotional', 'sad', 'melancholy', '슬픈', '이별', '눈물', '감동', '추억', 'nostalgic', 'sentimental', 'lonely'],
    label: '감성적 / 새벽 감성',
    colors: ['#EDE9FE', '#C4B5FD', '#A78BFA', '#818CF8', '#6366F1'],
    gradient: ['#667EEA', '#764BA2'],
    fontStyle: 'medium',
  },
  cozy: {
    keywords: ['카페', 'cafe', 'coffee', '따뜻', 'warm', 'cozy', '아늑', '봄', 'spring', 'acoustic', '어쿠스틱', '포근', 'comfortable'],
    label: '아늑한 / 카페 감성',
    colors: ['#FEF3C7', '#FDE68A', '#D4A574', '#C4956A', '#B8860B'],
    gradient: ['#F6D365', '#FDA085'],
    fontStyle: 'medium',
  },
  dark: {
    keywords: ['어두운', 'dark', '야경', '도시', 'city', 'urban', 'night drive', '드라이브', '네온', 'neon', 'cyberpunk', 'lo-fi', 'lofi'],
    label: '다크 / 도시적',
    colors: ['#1E1B4B', '#312E81', '#3730A3', '#4338CA', '#4F46E5'],
    gradient: ['#0F0C29', '#302B63'],
    fontStyle: 'bold',
  },
  nature: {
    keywords: ['자연', 'nature', '숲', 'forest', '바다', 'ocean', 'sea', '비', 'rain', '새소리', 'birds', '물소리', 'water', '여름', 'summer', '가을', 'autumn'],
    label: '자연 / 힐링',
    colors: ['#D1FAE5', '#6EE7B7', '#34D399', '#10B981', '#059669'],
    gradient: ['#56AB2F', '#A8E063'],
    fontStyle: 'light',
  },
  romantic: {
    keywords: ['로맨틱', 'romantic', 'love', '사랑', '연인', '데이트', 'date', 'valentine', 'sweet', '달달', 'crush'],
    label: '로맨틱 / 사랑',
    colors: ['#FCE7F3', '#FBCFE8', '#F9A8D4', '#F472B6', '#EC4899'],
    gradient: ['#FF9A9E', '#FAD0C4'],
    fontStyle: 'medium',
  },
  classical: {
    keywords: ['클래식', 'classical', 'piano', '피아노', 'orchestra', '오케스트라', 'violin', '바이올린', 'sonata', 'concerto', 'opera'],
    label: '클래식 / 우아한',
    colors: ['#F5F0E8', '#E8DCC8', '#D4C4A8', '#C0AD88', '#A89668'],
    gradient: ['#F5F0E8', '#D4C4A8'],
    fontStyle: 'light',
  },
};

const GENRE_KEYWORDS = {
  pop: ['pop', '팝', 'k-pop', 'kpop'],
  hiphop: ['힙합', 'hip-hop', 'hiphop', 'rap', '랩'],
  rnb: ['r&b', 'rnb', '알앤비'],
  jazz: ['재즈', 'jazz', 'swing', 'bossa'],
  rock: ['록', 'rock', 'band', '밴드', 'guitar'],
  electronic: ['일렉', 'electronic', 'EDM', 'house', 'techno'],
  indie: ['인디', 'indie', 'alternative'],
  folk: ['포크', 'folk', 'acoustic'],
};

function extractKeywords(text) {
  if (!text) return [];
  return text
    .toLowerCase()
    .replace(/[^\w\sㄱ-ㅎ가-힣a-z0-9-]/g, ' ')
    .split(/\s+/)
    .filter((word) => word.length > 1);
}

function detectMood(keywords) {
  const scores = {};

  for (const [mood, config] of Object.entries(MOOD_KEYWORDS)) {
    scores[mood] = 0;
    for (const keyword of keywords) {
      for (const moodKeyword of config.keywords) {
        if (keyword.includes(moodKeyword) || moodKeyword.includes(keyword)) {
          scores[mood] += 1;
        }
      }
    }
  }

  // Sort by score and return top moods
  const sorted = Object.entries(scores)
    .sort(([, a], [, b]) => b - a)
    .filter(([, score]) => score > 0);

  if (sorted.length === 0) {
    // Default to calm mood
    return [{ mood: 'calm', score: 1 }];
  }

  return sorted.slice(0, 3).map(([mood, score]) => ({ mood, score }));
}

function detectGenre(keywords) {
  for (const [genre, genreKeywords] of Object.entries(GENRE_KEYWORDS)) {
    for (const keyword of keywords) {
      for (const gk of genreKeywords) {
        if (keyword.includes(gk) || gk.includes(keyword)) {
          return genre;
        }
      }
    }
  }
  return 'general';
}

function analyzeMood(playlistData, _thumbnails) {
  // Collect all text for analysis
  const allText = [
    playlistData.title || '',
    playlistData.description || '',
    ...(playlistData.items || []).map((item) => item.title),
    ...(playlistData.items || []).map((item) => item.artist),
  ].join(' ');

  const keywords = extractKeywords(allText);
  const detectedMoods = detectMood(keywords);
  const genre = detectGenre(keywords);

  const primaryMood = detectedMoods[0]?.mood || 'calm';
  const moodConfig = MOOD_KEYWORDS[primaryMood];

  return {
    primaryMood,
    moodLabel: moodConfig.label,
    allMoods: detectedMoods.map((m) => ({
      ...m,
      label: MOOD_KEYWORDS[m.mood].label,
    })),
    genre,
    suggestedColors: moodConfig.colors,
    suggestedGradient: moodConfig.gradient,
    fontStyle: moodConfig.fontStyle,
    extractedKeywords: [...new Set(keywords)].slice(0, 15),
    playlistTitle: playlistData.title,
    trackCount: (playlistData.items || []).length,
  };
}

function getMoodConfig(moodKey) {
  return MOOD_KEYWORDS[moodKey] || MOOD_KEYWORDS.calm;
}

module.exports = { analyzeMood, getMoodConfig, MOOD_KEYWORDS };
