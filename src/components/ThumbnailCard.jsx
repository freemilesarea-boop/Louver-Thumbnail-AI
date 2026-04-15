import React, { useState, useEffect } from 'react';
import { scoreThumbnail } from '../services/api';

export default function ThumbnailCard({ thumbnail, index, onSelect, onDownload }) {
  const [score, setScore] = useState(null);
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    // Score the thumbnail on mount
    scoreThumbnail(thumbnail.config).then((result) => {
      if (result.success) {
        setScore(result.data);
      }
    });
  }, [thumbnail.config]);

  const gradeColors = {
    S: 'bg-gradient-to-r from-yellow-400 to-amber-500 text-white',
    A: 'bg-emerald-500 text-white',
    B: 'bg-blue-500 text-white',
    C: 'bg-gray-400 text-white',
    D: 'bg-gray-300 text-gray-600',
  };

  return (
    <div
      className="card overflow-hidden cursor-pointer group"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={() => onSelect(index)}
    >
      {/* Thumbnail preview */}
      <div className="relative aspect-video overflow-hidden">
        <img
          src={thumbnail.dataUrl}
          alt={`Thumbnail variant ${index + 1}`}
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
        />

        {/* Hover overlay */}
        {isHovered && (
          <div className="absolute inset-0 bg-black/30 flex items-center justify-center gap-3 animate-fade-in">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onSelect(index);
              }}
              className="px-3 py-1.5 bg-white rounded-lg text-sm font-medium text-louver-text-primary hover:bg-gray-100 transition-colors"
            >
              상세 보기
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDownload(thumbnail);
              }}
              className="px-3 py-1.5 bg-louver-accent rounded-lg text-sm font-medium text-white hover:bg-indigo-600 transition-colors"
            >
              다운로드
            </button>
          </div>
        )}

        {/* Image source badge */}
        <div className="absolute top-2 left-2">
          <div className={`px-2 py-1 rounded-lg text-xs font-medium ${
            thumbnail.usedImage
              ? 'bg-emerald-500/90 text-white'
              : 'bg-gray-500/70 text-white'
          }`}>
            {thumbnail.usedImage ? '이미지' : '그라데이션'}
          </div>
        </div>

        {/* CTR Score badge */}
        {score && (
          <div className="absolute top-2 right-2">
            <div className={`px-2 py-1 rounded-lg text-xs font-bold ${gradeColors[score.grade] || gradeColors.C}`}>
              {score.grade} · {score.totalScore}점
            </div>
          </div>
        )}
      </div>

      {/* Card info */}
      <div className="p-3 space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-louver-text-secondary">
            {thumbnail.layout}
          </span>
          {score && (
            <span className="text-xs text-louver-text-muted">
              CTR 예상: {score.totalScore}점
            </span>
          )}
        </div>

        {/* Score breakdown mini bar */}
        {score && (
          <div className="flex gap-0.5 h-1.5 rounded-full overflow-hidden bg-louver-warmgray">
            <div
              className="bg-indigo-400 rounded-l-full"
              style={{ width: `${(score.breakdown.contrast.score / 25) * 100}%` }}
              title="배경 대비"
            />
            <div
              className="bg-blue-400"
              style={{ width: `${(score.breakdown.readability.score / 25) * 100}%` }}
              title="가독성"
            />
            <div
              className="bg-violet-400"
              style={{ width: `${(score.breakdown.emotion.score / 25) * 100}%` }}
              title="감정 자극"
            />
            <div
              className="bg-emerald-400 rounded-r-full"
              style={{ width: `${(score.breakdown.style.score / 25) * 100}%` }}
              title="스타일"
            />
          </div>
        )}

        {/* Gradient colors preview */}
        <div className="flex items-center gap-1.5">
          {thumbnail.gradientColors?.map((color, i) => (
            <div
              key={i}
              className="w-4 h-4 rounded-full border border-louver-border"
              style={{ backgroundColor: color }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
