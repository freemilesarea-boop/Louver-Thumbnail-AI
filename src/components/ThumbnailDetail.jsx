import React, { useState, useEffect } from 'react';
import useStore from '../store/useStore';
import { scoreThumbnail, saveThumbnail } from '../services/api';

export default function ThumbnailDetail() {
  const { selectedThumbnail, clearSelectedThumbnail } = useStore();
  const [score, setScore] = useState(null);

  useEffect(() => {
    if (selectedThumbnail) {
      scoreThumbnail(selectedThumbnail.config).then((result) => {
        if (result.success) setScore(result.data);
      });
    }
  }, [selectedThumbnail]);

  if (!selectedThumbnail) return null;

  const handleDownload = async () => {
    const timestamp = new Date().toISOString().slice(0, 10);
    const filename = `louver-thumbnail-${timestamp}-${selectedThumbnail.id.slice(-4)}.png`;
    await saveThumbnail({ dataUrl: selectedThumbnail.dataUrl, filename });
  };

  const gradeColors = {
    S: 'text-amber-500',
    A: 'text-emerald-500',
    B: 'text-blue-500',
    C: 'text-gray-500',
    D: 'text-gray-400',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-2xl shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-louver-border">
          <h3 className="text-lg font-semibold text-louver-text-primary">
            썸네일 상세
          </h3>
          <button
            onClick={clearSelectedThumbnail}
            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-louver-warmgray transition-colors"
          >
            <svg className="w-5 h-5 text-louver-text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-5 space-y-5">
          {/* Thumbnail preview */}
          <div className="rounded-xl overflow-hidden border border-louver-border shadow-soft">
            <img
              src={selectedThumbnail.dataUrl}
              alt="Selected thumbnail"
              className="w-full"
            />
          </div>

          {/* Info grid */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <span className="text-xs text-louver-text-muted">레이아웃</span>
              <p className="text-sm font-medium text-louver-text-primary">{selectedThumbnail.layout}</p>
            </div>
            <div className="space-y-1">
              <span className="text-xs text-louver-text-muted">분위기</span>
              <p className="text-sm font-medium text-louver-text-primary capitalize">{selectedThumbnail.mood}</p>
            </div>
            <div className="space-y-1">
              <span className="text-xs text-louver-text-muted">해상도</span>
              <p className="text-sm font-medium text-louver-text-primary">1280 x 720</p>
            </div>
            <div className="space-y-1">
              <span className="text-xs text-louver-text-muted">그래디언트</span>
              <div className="flex items-center gap-1.5">
                {selectedThumbnail.gradientColors?.map((c, i) => (
                  <div key={i} className="flex items-center gap-1">
                    <div className="w-4 h-4 rounded border border-louver-border" style={{ backgroundColor: c }} />
                    <span className="text-xs text-louver-text-muted">{c}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* CTR Score */}
          {score && (
            <div className="card p-5">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-sm font-semibold text-louver-text-primary">CTR 예측 점수</h4>
                <div className="flex items-center gap-2">
                  <span className={`text-3xl font-bold ${gradeColors[score.grade]}`}>
                    {score.grade}
                  </span>
                  <span className="text-2xl font-bold text-louver-text-primary">
                    {score.totalScore}
                    <span className="text-sm font-normal text-louver-text-muted">/100</span>
                  </span>
                </div>
              </div>

              {/* Score breakdown */}
              <div className="space-y-3">
                {Object.entries(score.breakdown).map(([key, item]) => (
                  <div key={key} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-louver-text-secondary">{item.label}</span>
                      <span className="text-louver-text-muted">{item.score}/{item.max}</span>
                    </div>
                    <div className="h-2 bg-louver-warmgray rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-louver-accent to-louver-violet transition-all duration-500"
                        style={{ width: `${(item.score / item.max) * 100}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>

              {/* Recommendations */}
              {score.recommendations?.length > 0 && (
                <div className="mt-4 pt-4 border-t border-louver-border">
                  <p className="text-xs font-medium text-louver-text-secondary mb-2">개선 제안</p>
                  <ul className="space-y-1">
                    {score.recommendations.map((rec, i) => (
                      <li key={i} className="text-xs text-louver-text-muted flex items-start gap-1.5">
                        <span className="text-louver-accent mt-0.5">-</span>
                        {rec}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center gap-3 pt-2">
            <button onClick={handleDownload} className="btn-primary flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              PNG 다운로드
            </button>
            <button onClick={clearSelectedThumbnail} className="btn-secondary">
              닫기
            </button>
          </div>
        </div>

        {/* Footer branding */}
        <div className="px-5 py-3 border-t border-louver-border text-center">
          <span className="text-xs text-louver-text-muted">Designed & Developed by Louver</span>
        </div>
      </div>
    </div>
  );
}
