import React from 'react';
import useStore from '../store/useStore';

export default function LoadingOverlay() {
  const { loadingMessage } = useStore();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/60 backdrop-blur-sm">
      <div className="flex flex-col items-center gap-4">
        {/* Animated logo */}
        <div className="relative">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-louver-accent to-louver-violet flex items-center justify-center animate-pulse-soft">
            <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>

          {/* Spinning ring */}
          <div className="absolute -inset-2">
            <svg className="w-20 h-20 animate-spin" viewBox="0 0 80 80" style={{ animationDuration: '3s' }}>
              <circle
                cx="40"
                cy="40"
                r="36"
                fill="none"
                stroke="#E0E7FF"
                strokeWidth="2"
              />
              <circle
                cx="40"
                cy="40"
                r="36"
                fill="none"
                stroke="#6366F1"
                strokeWidth="2"
                strokeDasharray="80 140"
                strokeLinecap="round"
              />
            </svg>
          </div>
        </div>

        <div className="text-center">
          <p className="text-sm font-medium text-louver-text-primary">
            {loadingMessage || '처리 중...'}
          </p>
          <p className="text-xs text-louver-text-muted mt-1">잠시만 기다려주세요</p>
        </div>
      </div>
    </div>
  );
}
