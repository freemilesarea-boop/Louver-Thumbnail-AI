import React from 'react';
import useStore from '../store/useStore';
import ThumbnailCard from './ThumbnailCard';
import { saveThumbnail } from '../services/api';

export default function ThumbnailResults() {
  const { generatedThumbnails, selectThumbnail } = useStore();

  const handleDownload = async (thumbnail) => {
    const timestamp = new Date().toISOString().slice(0, 10);
    const filename = `louver-thumbnail-${timestamp}-${thumbnail.id.slice(-4)}.png`;

    await saveThumbnail({
      dataUrl: thumbnail.dataUrl,
      filename,
    });
  };

  const handleDownloadAll = async () => {
    for (const thumb of generatedThumbnails) {
      const timestamp = new Date().toISOString().slice(0, 10);
      const filename = `louver-thumbnail-${timestamp}-${thumb.id.slice(-4)}.png`;

      // Browser download for each
      const link = document.createElement('a');
      link.download = filename;
      link.href = thumb.dataUrl;
      link.click();

      // Small delay between downloads
      await new Promise((r) => setTimeout(r, 300));
    }
  };

  if (generatedThumbnails.length === 0) return null;

  return (
    <section className="space-y-4 animate-fade-in">
      <div className="flex items-center justify-between">
        <h2 className="section-title">
          생성된 썸네일
          <span className="ml-2 text-sm font-normal text-louver-text-muted">
            ({generatedThumbnails.length}개)
          </span>
        </h2>
        <button onClick={handleDownloadAll} className="btn-secondary text-sm flex items-center gap-2">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          전체 다운로드
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {generatedThumbnails.map((thumb, index) => (
          <ThumbnailCard
            key={thumb.id}
            thumbnail={thumb}
            index={index}
            onSelect={selectThumbnail}
            onDownload={handleDownload}
          />
        ))}
      </div>
    </section>
  );
}
