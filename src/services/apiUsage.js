/**
 * API Usage Tracking Service
 * - 일별 요청 횟수 추적
 * - 사용량 통계 표시
 * - localStorage 기반 영구 저장
 */

const USAGE_KEY = 'louver-api-usage';
const HISTORY_KEY = 'louver-api-usage-history';

function getToday() {
  return new Date().toISOString().slice(0, 10); // "2024-01-15"
}

function loadUsage() {
  try {
    const raw = localStorage.getItem(USAGE_KEY);
    if (!raw) return { date: getToday(), pexels: 0, youtube: 0, fallback: 0 };
    const data = JSON.parse(raw);
    // 날짜가 바뀌면 리셋
    if (data.date !== getToday()) {
      saveToHistory(data);
      return { date: getToday(), pexels: 0, youtube: 0, fallback: 0 };
    }
    return data;
  } catch {
    return { date: getToday(), pexels: 0, youtube: 0, fallback: 0 };
  }
}

function saveUsage(data) {
  try {
    localStorage.setItem(USAGE_KEY, JSON.stringify(data));
  } catch { /* ignore */ }
}

function saveToHistory(dayData) {
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    const history = raw ? JSON.parse(raw) : [];
    history.push(dayData);
    // 최근 30일만 유지
    while (history.length > 30) history.shift();
    localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
  } catch { /* ignore */ }
}

/**
 * API 호출 기록
 * @param {'pexels' | 'youtube' | 'fallback' | 'picsum-fallback'} source
 * @param {number} count - 요청한 이미지 수
 */
export function recordApiCall(source, count = 1) {
  const usage = loadUsage();
  const key = source === 'picsum-fallback' ? 'fallback' : source;
  if (key in usage) {
    usage[key] += count;
  }
  saveUsage(usage);
  console.log(`[Usage] ${source} +${count} (오늘: Pexels ${usage.pexels}, YouTube ${usage.youtube}, Fallback ${usage.fallback})`);
}

/**
 * 오늘 사용량 조회
 */
export function getTodayUsage() {
  return loadUsage();
}

/**
 * 사용 기록 조회 (최근 30일)
 */
export function getUsageHistory() {
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

/**
 * 사용량 요약 텍스트
 */
export function getUsageSummary() {
  const usage = loadUsage();
  const total = usage.pexels + usage.youtube + usage.fallback;
  return {
    date: usage.date,
    total,
    pexels: usage.pexels,
    youtube: usage.youtube,
    fallback: usage.fallback,
    pexelsRemaining: Math.max(0, 200 - usage.pexels), // 월 200회 기준
  };
}

/**
 * 사용량 초기화
 */
export function resetUsage() {
  saveUsage({ date: getToday(), pexels: 0, youtube: 0, fallback: 0 });
}
