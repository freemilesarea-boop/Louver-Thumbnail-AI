import React, { useState } from 'react';
import useStore from '../store/useStore';
import {
  parsePlaylist, collectThumbnails, analyzeMood, analyzeKeywordMood,
  getImageUrlsForKeyword, getImageUrlsFromPlaylist, testPexelsApiKey,
} from '../services/api';
import { generateThumbnailSet } from '../services/thumbnailComposer';
import { getUsageSummary } from '../services/apiUsage';
import { getCacheStats, clearAllCache } from '../services/cache';

export default function InputSection() {
  const {
    inputMode, setInputMode,
    keywordInput, setKeywordInput,
    playlistUrl, setPlaylistUrl,
    pexelsApiKey, setPexelsApiKey, apiStatus, setApiStatus,
    setLoading, setError,
    setPlaylistData, setThumbnailCollection, setMoodAnalysis,
    setGeneratedThumbnails,
    isLoading,
  } = useStore();

  const [thumbnailCount, setThumbnailCount] = useState(6);
  const [showApiConfig, setShowApiConfig] = useState(false);
  const [apiKeyInput, setApiKeyInput] = useState(pexelsApiKey);
  const [apiTesting, setApiTesting] = useState(false);

  const usage = getUsageSummary();
  const cacheStats = getCacheStats();

  const handleSaveApiKey = async () => {
    const key = apiKeyInput.trim();
    if (!key) { setPexelsApiKey(''); setApiStatus('idle'); return; }
    setApiTesting(true);
    const result = await testPexelsApiKey(key);
    setApiTesting(false);
    if (result.valid) {
      setPexelsApiKey(key);
      setApiStatus('connected');
      setShowApiConfig(false);
    } else {
      setApiStatus('error');
      setError(`Pexels API: ${result.error}`);
    }
  };

  const handlePlaylistSubmit = async () => {
    if (!playlistUrl.trim()) { setError('유튜브 재생목록 링크를 입력해주세요.'); return; }
    try {
      setLoading(true, '재생목록 분석 중...');
      const parseResult = await parsePlaylist(playlistUrl.trim());
      if (!parseResult.success) { setError(parseResult.error); return; }
      setPlaylistData(parseResult.data);

      setLoading(true, '썸네일 수집 중...');
      const thumbResult = await collectThumbnails(parseResult.data);
      if (!thumbResult.success) { setError(thumbResult.error); return; }
      setThumbnailCollection(thumbResult.data);

      setLoading(true, '분위기 분석 중...');
      const moodResult = await analyzeMood({ playlistData: parseResult.data, thumbnails: thumbResult.data });
      if (!moodResult.success) { setError(moodResult.error); return; }
      setMoodAnalysis(moodResult.data);

      // YouTube 썸네일 우선 사용
      setLoading(true, 'YouTube 썸네일 추출 중...');
      const { urls: imageUrls, source } = getImageUrlsFromPlaylist(parseResult.data, thumbnailCount);

      setLoading(true, `썸네일 생성 중... (소스: ${source})`);
      const thumbnails = await generateThumbnailSet({
        title: parseResult.data.title,
        subTitle: parseResult.data.channelName || '',
        mood: moodResult.data.primaryMood,
        trackCount: parseResult.data.items.length,
        count: thumbnailCount,
        imageUrls,
      });

      setGeneratedThumbnails(thumbnails);
      setLoading(false);
    } catch (err) {
      setError(err.message || '처리 중 오류가 발생했습니다.');
    }
  };

  const handleKeywordSubmit = async () => {
    if (!keywordInput.trim()) { setError('키워드를 입력해주세요.'); return; }
    try {
      setLoading(true, '키워드 분석 중...');
      const moodResult = analyzeKeywordMood(keywordInput.trim());
      setMoodAnalysis({ ...moodResult, playlistTitle: keywordInput.trim(), trackCount: 0 });

      const apiSource = pexelsApiKey ? 'Pexels API' : '내장 이미지';
      setLoading(true, `${apiSource}에서 이미지 로드 중...`);

      const { urls: imageUrls, source } = await getImageUrlsForKeyword(
        keywordInput.trim(), moodResult.primaryMood, thumbnailCount, pexelsApiKey
      );

      setLoading(true, `썸네일 생성 중... (소스: ${source})`);
      const thumbnails = await generateThumbnailSet({
        title: keywordInput.trim(),
        subTitle: '',
        mood: moodResult.primaryMood,
        trackCount: null,
        count: thumbnailCount,
        imageUrls,
      });

      setGeneratedThumbnails(thumbnails);
      setLoading(false);
    } catch (err) {
      setError(err.message || '처리 중 오류가 발생했습니다.');
    }
  };

  const handleSubmit = () => {
    if (inputMode === 'playlist') handlePlaylistSubmit();
    else handleKeywordSubmit();
  };

  return (
    <section className="space-y-3 animate-fade-in">
      {/* API 상태 + 사용량 바 */}
      <div className="card p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* API 상태 */}
            <div className="flex items-center gap-1.5">
              <div className={`w-2 h-2 rounded-full ${
                apiStatus === 'connected' ? 'bg-emerald-500' :
                pexelsApiKey ? 'bg-yellow-500' : 'bg-gray-300'
              }`} />
              <span className="text-xs font-medium text-louver-text-secondary">
                {apiStatus === 'connected' ? 'Pexels 연결됨' : pexelsApiKey ? 'Pexels 키 설정됨' : 'Fallback 모드'}
              </span>
            </div>

            {/* 사용량 */}
            <div className="h-4 w-px bg-louver-border" />
            <div className="flex items-center gap-3 text-xs text-louver-text-muted">
              <span>Pexels <strong className="text-louver-text-secondary">{usage.pexels}</strong></span>
              <span>YouTube <strong className="text-louver-text-secondary">{usage.youtube}</strong></span>
              <span>Picsum <strong className="text-louver-text-secondary">{usage.picsum || 0}</strong></span>
              {pexelsApiKey && (
                <span className="text-louver-accent">잔여 ~{usage.pexelsRemaining}회/월</span>
              )}
            </div>

            {/* 캐시 */}
            {cacheStats.entries > 0 && (
              <>
                <div className="h-4 w-px bg-louver-border" />
                <span className="text-xs text-louver-text-muted">
                  캐시 {cacheStats.entries}건 ({cacheStats.sizeKB}KB)
                </span>
                <button onClick={() => { clearAllCache(); window.location.reload(); }}
                  className="text-xs text-red-400 hover:text-red-600">초기화</button>
              </>
            )}
          </div>

          <button
            onClick={() => setShowApiConfig(!showApiConfig)}
            className="text-xs text-louver-accent hover:underline"
          >
            {showApiConfig ? '닫기' : 'API 설정'}
          </button>
        </div>

        {showApiConfig && (
          <div className="mt-3 pt-3 border-t border-louver-border space-y-2">
            <label className="block text-xs font-medium text-louver-text-secondary">Pexels API Key</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={apiKeyInput}
                onChange={(e) => setApiKeyInput(e.target.value)}
                placeholder="Pexels API Key"
                className="input-field text-sm flex-1"
              />
              <button onClick={handleSaveApiKey} disabled={apiTesting}
                className="btn-primary text-sm px-4 whitespace-nowrap">
                {apiTesting ? '확인...' : '연결'}
              </button>
            </div>
            <p className="text-xs text-louver-text-muted">
              <a href="https://www.pexels.com/api/new/" target="_blank" rel="noreferrer"
                 className="text-louver-accent hover:underline">pexels.com/api</a> 에서 무료 발급 (월 200회)
            </p>
          </div>
        )}
      </div>

      {/* 입력 영역 */}
      <div className="card p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="section-title">썸네일 제작 시작</h2>
          <div className="flex items-center gap-1 bg-louver-warmgray rounded-lg p-1">
            <button
              onClick={() => setInputMode('keyword')}
              className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all duration-200 ${
                inputMode === 'keyword' ? 'bg-white text-louver-text-primary shadow-sm' : 'text-louver-text-muted hover:text-louver-text-secondary'
              }`}>키워드 입력</button>
            <button
              onClick={() => setInputMode('playlist')}
              className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all duration-200 ${
                inputMode === 'playlist' ? 'bg-white text-louver-text-primary shadow-sm' : 'text-louver-text-muted hover:text-louver-text-secondary'
              }`}>재생목록 링크</button>
          </div>
        </div>

        <div className="space-y-4">
          {inputMode === 'keyword' ? (
            <div>
              <label className="block text-sm font-medium text-louver-text-secondary mb-2">
                플레이리스트 키워드 또는 제목을 입력하세요
              </label>
              <input type="text" value={keywordInput}
                onChange={(e) => setKeywordInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && !isLoading && handleSubmit()}
                placeholder="예: 새벽 감성 팝, 카페에서 듣는 재즈, 야경 드라이브 플레이리스트"
                className="input-field text-base" disabled={isLoading} />
            </div>
          ) : (
            <div>
              <label className="block text-sm font-medium text-louver-text-secondary mb-2">
                유튜브 재생목록 링크를 입력하세요
              </label>
              <input type="url" value={playlistUrl}
                onChange={(e) => setPlaylistUrl(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && !isLoading && handleSubmit()}
                placeholder="https://www.youtube.com/playlist?list=..."
                className="input-field text-base" disabled={isLoading} />
              <p className="text-xs text-louver-text-muted mt-1">
                YouTube 썸네일이 Pexels보다 우선 사용됩니다
              </p>
            </div>
          )}

          <div className="flex items-center gap-6 pt-2">
            <div className="flex items-center gap-2">
              <label className="text-sm text-louver-text-secondary">생성 개수:</label>
              <select value={thumbnailCount}
                onChange={(e) => setThumbnailCount(Number(e.target.value))}
                className="px-3 py-1.5 bg-white border border-louver-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-louver-accent"
                disabled={isLoading}>
                {[3, 5, 6, 8, 10].map((n) => <option key={n} value={n}>{n}개</option>)}
              </select>
            </div>
            <button onClick={handleSubmit} disabled={isLoading}
              className="btn-primary ml-auto flex items-center gap-2">
              {isLoading ? (
                <><svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg> 처리 중...</>
              ) : (
                <><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg> 썸네일 생성</>
              )}
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
