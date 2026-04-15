import React from 'react';
import useStore from '../store/useStore';

export default function Header() {
  const { isLoading, loadingMessage, generatedThumbnails } = useStore();

  return (
    <header className="bg-white/80 backdrop-blur-md border-b border-louver-border sticky top-0 z-40">
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        {/* Logo & App Name */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-louver-accent to-louver-violet flex items-center justify-center">
            <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <div>
            <h1 className="text-lg font-bold text-louver-text-primary tracking-tight">
              Louver Thumbnail AI
            </h1>
          </div>
        </div>

        {/* Status */}
        <div className="flex items-center gap-4">
          {isLoading && (
            <div className="flex items-center gap-2 text-sm text-louver-text-secondary">
              <div className="w-2 h-2 rounded-full bg-louver-accent animate-pulse-soft" />
              <span>{loadingMessage || '처리 중...'}</span>
            </div>
          )}
          {generatedThumbnails.length > 0 && !isLoading && (
            <div className="flex items-center gap-2">
              <span className="badge bg-indigo-50 text-louver-accent">
                {generatedThumbnails.length}개 생성됨
              </span>
            </div>
          )}
          <button
            onClick={() => useStore.getState().resetAll()}
            className="text-sm text-louver-text-muted hover:text-louver-text-secondary transition-colors"
          >
            초기화
          </button>
        </div>
      </div>
    </header>
  );
}
