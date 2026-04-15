/**
 * Image Cache Service
 * - localStorage 기반 캐싱
 * - 동일 키워드 재검색 시 API 재요청 방지
 * - TTL 7일 기본 설정
 * - 캐시 키: keyword + mood 해시
 */

const CACHE_PREFIX = 'louver-img-cache-';
const DEFAULT_TTL = 7 * 24 * 60 * 60 * 1000; // 7일 (ms)

function hashKey(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0;
  }
  return Math.abs(hash).toString(36);
}

function getCacheKey(keyword, mood, source) {
  return `${CACHE_PREFIX}${hashKey(`${keyword}|${mood}|${source}`)}`;
}

/**
 * 캐시에서 이미지 URL 조회
 * @returns {{ urls: string[], source: string } | null}
 */
export function getFromCache(keyword, mood, source = 'pexels') {
  const key = getCacheKey(keyword, mood, source);

  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;

    const cached = JSON.parse(raw);
    const age = Date.now() - cached.timestamp;

    if (age > (cached.ttl || DEFAULT_TTL)) {
      // TTL 만료 → 캐시 삭제
      localStorage.removeItem(key);
      console.log(`[Cache] 만료됨: "${keyword}" (${(age / 86400000).toFixed(1)}일 경과)`);
      return null;
    }

    console.log(`[Cache] ✓ 캐시 히트: "${keyword}" (${cached.urls.length}개, ${(age / 3600000).toFixed(1)}시간 전)`);
    return { urls: cached.urls, source: cached.source };
  } catch {
    return null;
  }
}

/**
 * 캐시에 이미지 URL 저장
 */
export function saveToCache(keyword, mood, urls, source = 'pexels', ttl = DEFAULT_TTL) {
  const key = getCacheKey(keyword, mood, source);

  try {
    const entry = {
      keyword,
      mood,
      urls,
      source,
      timestamp: Date.now(),
      ttl,
    };
    localStorage.setItem(key, JSON.stringify(entry));
    console.log(`[Cache] 저장: "${keyword}" → ${urls.length}개 URL (TTL: ${(ttl / 86400000).toFixed(0)}일)`);
  } catch (e) {
    // localStorage 용량 초과 시 오래된 캐시 정리
    if (e.name === 'QuotaExceededError') {
      clearOldCache();
      try {
        localStorage.setItem(key, JSON.stringify({ keyword, mood, urls, source, timestamp: Date.now(), ttl }));
      } catch {
        console.warn('[Cache] 저장 실패: 용량 초과');
      }
    }
  }
}

/**
 * 오래된 캐시 항목 정리
 */
export function clearOldCache() {
  const keysToRemove = [];

  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (!key.startsWith(CACHE_PREFIX)) continue;

    try {
      const cached = JSON.parse(localStorage.getItem(key));
      const age = Date.now() - cached.timestamp;
      if (age > (cached.ttl || DEFAULT_TTL)) {
        keysToRemove.push(key);
      }
    } catch {
      keysToRemove.push(key);
    }
  }

  keysToRemove.forEach((k) => localStorage.removeItem(k));
  console.log(`[Cache] ${keysToRemove.length}개 만료 항목 정리`);
}

/**
 * 전체 캐시 통계
 */
export function getCacheStats() {
  let count = 0;
  let totalSize = 0;

  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (!key.startsWith(CACHE_PREFIX)) continue;
    count++;
    totalSize += (localStorage.getItem(key) || '').length;
  }

  return {
    entries: count,
    sizeKB: (totalSize / 1024).toFixed(1),
  };
}

/**
 * 전체 캐시 초기화
 */
export function clearAllCache() {
  const keysToRemove = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key.startsWith(CACHE_PREFIX)) keysToRemove.push(key);
  }
  keysToRemove.forEach((k) => localStorage.removeItem(k));
  console.log(`[Cache] 전체 캐시 초기화: ${keysToRemove.length}개 삭제`);
}
