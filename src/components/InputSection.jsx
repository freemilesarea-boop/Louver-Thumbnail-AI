import React, { useState } from 'react';
import useStore from '../store/useStore';
import { parsePlaylist, collectThumbnails, analyzeMood, analyzeKeywordMood } from '../services/api';
import { generateThumbnailSet } from '../services/thumbnailComposer';

export default function InputSection() {
  const {
    inputMode,
    setInputMode,
    keywordInput,
    setKeywordInput,
    playlistUrl,
    setPlaylistUrl,
    setLoading,
    setError,
    setPlaylistData,
    setThumbnailCollection,
    setMoodAnalysis,
    setGeneratedThumbnails,
    isLoading,
  } = useStore();

  const [thumbnailCount, setThumbnailCount] = useState(6);

  const handlePlaylistSubmit = async () => {
    if (!playlistUrl.trim()) {
      setError('유튜브 재생목록 링크를 입력해주세요.');
      return;
    }

    try {
      // Step 1: Parse playlist
      setLoading(true, '재생목록 분석 중...');
      const parseResult = await parsePlaylist(playlistUrl.trim());
      if (!parseResult.success) {
        setError(parseResult.error);
        return;
      }
      setPlaylistData(parseResult.data);

      // Step 2: Collect thumbnails
      setLoading(true, '썸네일 수집 중...');
      const thumbResult = await collectThumbnails(parseResult.data);
      if (!thumbResult.success) {
        setError(thumbResult.error);
        return;
      }
      setThumbnailCollection(thumbResult.data);

      // Step 3: Analyze mood
      setLoading(true, '분위기 분석 중...');
      const moodResult = await analyzeMood({
        playlistData: parseResult.data,
        thumbnails: thumbResult.data,
      });
      if (!moodResult.success) {
        setError(moodResult.error);
        return;
      }
      setMoodAnalysis(moodResult.data);

      // Step 4: Generate thumbnails
      setLoading(true, '썸네일 생성 중...');
      const thumbnails = generateThumbnailSet({
        title: parseResult.data.title,
        subTitle: parseResult.data.channelName || '',
        mood: moodResult.data.primaryMood,
        trackCount: parseResult.data.items.length,
        count: thumbnailCount,
      });
      setGeneratedThumbnails(thumbnails);

      setLoading(false);
    } catch (err) {
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

      // Analyze mood from keyword
      const moodResult = analyzeKeywordMood(keywordInput.trim());
      setMoodAnalysis({
        ...moodResult,
        playlistTitle: keywordInput.trim(),
        trackCount: 0,
      });

      // Generate thumbnails
      setLoading(true, '썸네일 생성 중...');
      const thumbnails = generateThumbnailSet({
        title: keywordInput.trim(),
        subTitle: '',
        mood: moodResult.primaryMood,
        trackCount: null,
        count: thumbnailCount,
      });
      setGeneratedThumbnails(thumbnails);

      setLoading(false);
    } catch (err) {
      setError(err.message || '처리 중 오류가 발생했습니다.');
    }
  };

  const handleSubmit = () => {
    if (inputMode === 'playlist') {
      handlePlaylistSubmit();
    } else {
      handleKeywordSubmit();
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !isLoading) {
      handleSubmit();
    }
  };

  return (
    <section className="card p-6 animate-fade-in">
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

        {/* Options */}
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
    </section>
  );
}
