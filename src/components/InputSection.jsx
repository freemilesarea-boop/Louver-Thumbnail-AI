import React, { useState } from 'react';
import useStore from '../store/useStore';
import {
  parsePlaylist, collectThumbnails, analyzeMood, analyzeKeywordMood,
  getImageUrlsForKeyword, getImageUrlsFromPlaylist, testPexelsApiKey,
} from '../services/api';
import { generateThumbnailSet } from '../services/thumbnailComposer';

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
  const [showApiConfig, setShowApiConfig] = useState(!pexelsApiKey);
  const [apiKeyInput, setApiKeyInput] = useState(pexelsApiKey);
  const [apiTesting, setApiTesting] = useState(false);

  const handleSaveApiKey = async () => {
    const key = apiKeyInput.trim();
    if (!key) {
      setPexelsApiKey('');
      setApiStatus('idle');
      return;
    }

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
    if (!playlistUrl.trim()) {
      setError('유튜브 재생목록 링크를 입력해주세요.');
      return;
    }

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

      // YouTube 썸네일 추출
      setLoading(true, 'YouTube 썸네일에서 이미지 추출 중...');
      const { urls: imageUrls, source } = getImageUrlsFromPlaylist(parseResult.data, thumbnailCount);
      console.log(`[Input] 이미지 소스: ${source}, ${imageUrls.length}개`);

      setLoading(true, '이미지 기반 썸네일 생성 중...');
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
      console.error('[Input] Error:', err);
      setError(err.message || '처리 중 오류가 발생했습니다.');
    }
  };

  const handleKeywordSubmit = async () => {
    if (!keywordInput.trim()) {
      setError('키워드를 입력해주세요.');
      return;
    }

    try {
      setLoading(true, '키워드 분석 중...');
      const moodResult = analyzeKeywordMood(keywordInput.trim());
      setMoodAnalysis({ ...moodResult, playlistTitle: keywordInput.trim(), trackCount: 0 });

      // Pexels API 또는 fallback으로 이미지 검색
      const apiSource = pexelsApiKey ? 'Pexels API' : 'Picsum (fallback)';
      setLoading(true, `${apiSource}에서 이미지 검색 중...`);

      const { urls: imageUrls, source } = await getImageUrlsForKeyword(
        keywordInput.trim(), moodResult.primaryMood, thumbnailCount, pexelsApiKey
      );
      console.log(`[Input] 이미지 소스: ${source}, ${imageUrls.length}개`);

      setLoading(true, '이미지 기반 썸네일 생성 중...');
      const thumbnails = await generateThumbnailSet({
        title: keywordInput.trim(),
        subTitle: source === 'pexels' ? 'Powered by Pexels' : '',
        mood: moodResult.primaryMood,
        trackCount: null,
        count: thumbnailCount,
        imageUrls,
      });

      const imageCount = thumbnails.filter((t) => t.usedImage).length;
      console.log(`[Input] 결과: ${thumbnails.length}개 (이미지: ${imageCount}개)`);

      setGeneratedThumbnails(thumbnails);
      setLoading(false);
    } catch (err) {
      console.error('[Input] Error:', err);
      setError(err.message || '처리 중 오류가 발생했습니다.');
    }
  };

  const handleSubmit = () => {
    if (inputMode === 'playlist') handlePlaylistSubmit();
    else handleKeywordSubmit();
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !isLoading) handleSubmit();
  };

  return (
    <section className="space-y-3 animate-fade-in">
      {/* API 설정 */}
      <div className="card p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${
              apiStatus === 'connected' ? 'bg-emerald-500' :
              apiStatus === 'error' ? 'bg-red-500' :
              pexelsApiKey ? 'bg-yellow-500' : 'bg-gray-300'
            }`} />
            <span className="text-sm font-medium text-louver-text-secondary">
              이미지 API
            </span>
            <span className="text-xs text-louver-text-muted">
              {apiStatus === 'connected' ? 'Pexels 연결됨' :
               pexelsApiKey ? 'Pexels 키 설정됨' :
               '미연결 (fallback 모드)'}
            </span>
          </div>
          <button
            onClick={() => setShowApiConfig(!showApiConfig)}
            className="text-xs text-louver-accent hover:underline"
          >
            {showApiConfig ? '닫기' : '설정'}
          </button>
        </div>

        {showApiConfig && (
          <div className="mt-3 pt-3 border-t border-louver-border space-y-3">
            <div>
              <label className="block text-xs font-medium text-louver-text-secondary mb-1">
                Pexels API Key
              </label>
              <p className="text-xs text-louver-text-muted mb-2">
                <a href="https://www.pexels.com/api/new/" target="_blank" rel="noreferrer"
                   className="text-louver-accent hover:underline">
                  pexels.com/api
                </a>
                에서 무료 API 키를 발급받으세요 (월 200회 무료)
              </p>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={apiKeyInput}
                  onChange={(e) => setApiKeyInput(e.target.value)}
                  placeholder="Pexels API Key 입력"
                  className="input-field text-sm flex-1"
                />
                <button
                  onClick={handleSaveApiKey}
                  disabled={apiTesting}
                  className="btn-primary text-sm px-4 whitespace-nowrap"
                >
                  {apiTesting ? '확인 중...' : '연결'}
                </button>
              </div>
            </div>
            {!pexelsApiKey && (
              <p className="text-xs text-amber-600 bg-amber-50 rounded-lg p-2">
                API 키 없이도 사용 가능합니다. 다만 키워드와 무관한 랜덤 이미지가 사용됩니다.
                Pexels API를 연결하면 키워드에 맞는 고품질 이미지를 가져옵니다.
              </p>
            )}
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
                inputMode === 'keyword'
                  ? 'bg-white text-louver-text-primary shadow-sm'
                  : 'text-louver-text-muted hover:text-louver-text-secondary'
              }`}
            >
              키워드 입력
            </button>
            <button
              onClick={() => setInputMode('playlist')}
              className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all duration-200 ${
                inputMode === 'playlist'
                  ? 'bg-white text-louver-text-primary shadow-sm'
                  : 'text-louver-text-muted hover:text-louver-text-secondary'
              }`}
            >
              재생목록 링크
            </button>
          </div>
        </div>

        <div className="space-y-4">
          {inputMode === 'keyword' ? (
            <div>
              <label className="block text-sm font-medium text-louver-text-secondary mb-2">
                플레이리스트 키워드 또는 제목을 입력하세요
              </label>
              <input
                type="text"
                value={keywordInput}
                onChange={(e) => setKeywordInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="예: 새벽 감성 팝, 카페에서 듣는 재즈, 야경 드라이브 플레이리스트"
                className="input-field text-base"
                disabled={isLoading}
              />
            </div>
          ) : (
            <div>
              <label className="block text-sm font-medium text-louver-text-secondary mb-2">
                유튜브 재생목록 링크를 입력하세요
              </label>
              <input
                type="url"
                value={playlistUrl}
                onChange={(e) => setPlaylistUrl(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="https://www.youtube.com/playlist?list=..."
                className="input-field text-base"
                disabled={isLoading}
              />
            </div>
          )}

          <div className="flex items-center gap-6 pt-2">
            <div className="flex items-center gap-2">
              <label className="text-sm text-louver-text-secondary">생성 개수:</label>
              <select
                value={thumbnailCount}
                onChange={(e) => setThumbnailCount(Number(e.target.value))}
                className="px-3 py-1.5 bg-white border border-louver-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-louver-accent"
                disabled={isLoading}
              >
                <option value={3}>3개</option>
                <option value={5}>5개</option>
                <option value={6}>6개</option>
                <option value={8}>8개</option>
                <option value={10}>10개</option>
              </select>
            </div>

            <button
              onClick={handleSubmit}
              disabled={isLoading}
              className="btn-primary ml-auto flex items-center gap-2"
            >
              {isLoading ? (
                <>
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  처리 중...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  썸네일 생성
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
