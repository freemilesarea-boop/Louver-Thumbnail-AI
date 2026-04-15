import React from 'react';
import useStore from '../store/useStore';

export default function PlaylistAnalysis() {
  const { playlistData, moodAnalysis, thumbnailCollection } = useStore();

  if (!playlistData || !moodAnalysis) return null;

  return (
    <section className="space-y-4 animate-fade-in">
      <h2 className="section-title">분석 결과</h2>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Playlist Info Card */}
        <div className="card p-5">
          <div className="flex items-center gap-2 mb-3">
            <svg className="w-4 h-4 text-louver-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
            </svg>
            <h3 className="text-sm font-semibold text-louver-text-primary">재생목록 정보</h3>
          </div>
          <div className="space-y-2">
            <p className="text-sm font-medium text-louver-text-primary truncate" title={playlistData.title}>
              {playlistData.title}
            </p>
            {playlistData.channelName && (
              <p className="text-xs text-louver-text-muted">
                {playlistData.channelName}
              </p>
            )}
            <div className="flex items-center gap-3 pt-1">
              <span className="badge bg-indigo-50 text-louver-accent">
                {playlistData.items?.length || playlistData.videoCount}곡
              </span>
            </div>
          </div>
        </div>

        {/* Mood Analysis Card */}
        <div className="card p-5">
          <div className="flex items-center gap-2 mb-3">
            <svg className="w-4 h-4 text-louver-violet" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
            <h3 className="text-sm font-semibold text-louver-text-primary">분위기 분석</h3>
          </div>
          <div className="space-y-2">
            <p className="text-sm font-medium text-louver-text-primary">
              {moodAnalysis.moodLabel}
            </p>
            {moodAnalysis.allMoods?.length > 1 && (
              <div className="flex flex-wrap gap-1.5">
                {moodAnalysis.allMoods.slice(1).map((m, i) => (
                  <span key={i} className="badge bg-purple-50 text-louver-violet">
                    {m.label}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Color Palette Card */}
        <div className="card p-5">
          <div className="flex items-center gap-2 mb-3">
            <svg className="w-4 h-4 text-louver-mint" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
            </svg>
            <h3 className="text-sm font-semibold text-louver-text-primary">추천 컬러</h3>
          </div>
          <div className="flex items-center gap-2">
            {(moodAnalysis.suggestedColors || []).slice(0, 5).map((color, i) => (
              <div
                key={i}
                className="w-8 h-8 rounded-lg border border-louver-border shadow-sm"
                style={{ backgroundColor: color }}
                title={color}
              />
            ))}
          </div>
          {moodAnalysis.suggestedGradient && (
            <div
              className="mt-3 h-6 rounded-lg border border-louver-border"
              style={{
                background: `linear-gradient(to right, ${moodAnalysis.suggestedGradient[0]}, ${moodAnalysis.suggestedGradient[1]})`,
              }}
            />
          )}
        </div>
      </div>

      {/* Collected thumbnails preview */}
      {thumbnailCollection && thumbnailCollection.representatives?.length > 0 && (
        <div className="card p-5">
          <div className="flex items-center gap-2 mb-3">
            <svg className="w-4 h-4 text-louver-blue" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <h3 className="text-sm font-semibold text-louver-text-primary">
              대표 이미지 후보 ({thumbnailCollection.totalCount}개 수집)
            </h3>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {thumbnailCollection.representatives.map((rep, i) => (
              <div key={i} className="space-y-1.5">
                <div className="aspect-video bg-louver-warmgray rounded-lg border border-louver-border overflow-hidden flex items-center justify-center">
                  {rep.thumbnailUrl ? (
                    <img
                      src={rep.thumbnailUrl}
                      alt={rep.title}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.target.style.display = 'none';
                        e.target.parentElement.innerHTML = `<span class="text-xs text-louver-text-muted">${rep.title?.slice(0, 20)}</span>`;
                      }}
                    />
                  ) : (
                    <span className="text-xs text-louver-text-muted text-center px-2">
                      {rep.title?.slice(0, 30)}
                    </span>
                  )}
                </div>
                <p className="text-xs text-louver-text-muted truncate" title={rep.reason}>
                  {rep.reason}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Extracted keywords */}
      {moodAnalysis.extractedKeywords?.length > 0 && (
        <div className="flex flex-wrap gap-2">
          <span className="text-xs text-louver-text-muted mr-1">추출 키워드:</span>
          {moodAnalysis.extractedKeywords.map((kw, i) => (
            <span key={i} className="badge bg-louver-warmgray text-louver-text-secondary">
              {kw}
            </span>
          ))}
        </div>
      )}
    </section>
  );
}
