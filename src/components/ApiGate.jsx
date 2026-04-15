import React, { useState } from 'react';
import useStore from '../store/useStore';
import { testPexelsApiKey } from '../services/api';
import { getTotalFallbackCount } from '../services/fallbackImages';

/**
 * API 키 입력 게이트
 * 앱 시작 시 API 키 설정 여부 확인
 * 키 없이도 진행 가능 (fallback 모드 안내)
 */
export default function ApiGate({ onComplete }) {
  const { setPexelsApiKey, setApiStatus } = useStore();
  const [keyInput, setKeyInput] = useState('');
  const [testing, setTesting] = useState(false);
  const [error, setError] = useState('');

  const handleConnect = async () => {
    if (!keyInput.trim()) {
      setError('API 키를 입력해주세요.');
      return;
    }

    setTesting(true);
    setError('');
    const result = await testPexelsApiKey(keyInput.trim());
    setTesting(false);

    if (result.valid) {
      setPexelsApiKey(keyInput.trim());
      setApiStatus('connected');
      onComplete();
    } else {
      setError(result.error);
    }
  };

  const handleSkip = () => {
    setApiStatus('idle');
    onComplete();
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') handleConnect();
  };

  return (
    <div className="min-h-screen bg-louver-bg flex items-center justify-center p-6">
      <div className="max-w-lg w-full space-y-6">
        {/* 로고 */}
        <div className="text-center space-y-3">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-louver-accent to-louver-violet flex items-center justify-center">
            <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-louver-text-primary">
            Louver Thumbnail AI
          </h1>
          <p className="text-sm text-louver-text-muted">
            YouTube 플레이리스트 썸네일 자동 생성
          </p>
        </div>

        {/* API 키 입력 카드 */}
        <div className="card p-6 space-y-5">
          <div>
            <h2 className="text-lg font-semibold text-louver-text-primary mb-1">
              이미지 API 연결
            </h2>
            <p className="text-sm text-louver-text-muted">
              고품질 이미지를 사용하려면 Pexels API 키가 필요합니다.
            </p>
          </div>

          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-louver-text-secondary mb-1.5">
                Pexels API Key
              </label>
              <input
                type="text"
                value={keyInput}
                onChange={(e) => { setKeyInput(e.target.value); setError(''); }}
                onKeyDown={handleKeyDown}
                placeholder="Pexels API Key 입력"
                className="input-field"
                disabled={testing}
              />
            </div>

            {error && (
              <p className="text-sm text-red-600 bg-red-50 rounded-lg p-2">{error}</p>
            )}

            <button
              onClick={handleConnect}
              disabled={testing}
              className="btn-primary w-full flex items-center justify-center gap-2"
            >
              {testing ? (
                <>
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  연결 확인 중...
                </>
              ) : '연결'}
            </button>
          </div>

          {/* API 키 발급 안내 */}
          <div className="bg-indigo-50 rounded-lg p-3 space-y-2">
            <p className="text-xs font-semibold text-louver-accent">API 키 발급 방법</p>
            <ol className="text-xs text-louver-text-secondary space-y-1 list-decimal list-inside">
              <li>
                <a href="https://www.pexels.com/api/new/" target="_blank" rel="noreferrer"
                   className="text-louver-accent hover:underline">pexels.com/api</a> 접속
              </li>
              <li>무료 회원가입 후 API Key 발급</li>
              <li>위 입력란에 Key 붙여넣기</li>
            </ol>
            <p className="text-xs text-louver-text-muted">무료 월 200회 요청 가능</p>
          </div>
        </div>

        {/* Skip 옵션 */}
        <div className="text-center space-y-2">
          <button
            onClick={handleSkip}
            className="text-sm text-louver-text-muted hover:text-louver-text-secondary transition-colors"
          >
            API 키 없이 시작하기 →
          </button>
          <p className="text-xs text-louver-text-muted">
            내장 이미지 {getTotalFallbackCount()}장으로 작동합니다 (키워드 무관 이미지)
          </p>
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-louver-text-muted pt-4">
          Designed & Developed by Louver
        </p>
      </div>
    </div>
  );
}
