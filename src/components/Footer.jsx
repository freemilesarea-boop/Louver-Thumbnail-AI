import React from 'react';

export default function Footer() {
  return (
    <footer className="border-t border-louver-border bg-white/50 backdrop-blur-sm">
      <div className="max-w-6xl mx-auto px-6 py-5 flex flex-col items-center gap-2">
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded-md bg-gradient-to-br from-louver-accent to-louver-violet flex items-center justify-center">
            <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <span className="text-sm font-semibold text-louver-text-secondary tracking-tight">
            Designed & Developed by Louver
          </span>
        </div>
        <p className="text-xs text-louver-text-muted">
          YouTube Playlist Thumbnail AI Generator &middot; v1.0.0
        </p>
      </div>
    </footer>
  );
}
