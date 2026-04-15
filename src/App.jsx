import React from 'react';
import Header from './components/Header';
import InputSection from './components/InputSection';
import PlaylistAnalysis from './components/PlaylistAnalysis';
import ThumbnailResults from './components/ThumbnailResults';
import ThumbnailDetail from './components/ThumbnailDetail';
import Footer from './components/Footer';
import LoadingOverlay from './components/LoadingOverlay';
import useStore from './store/useStore';

export default function App() {
  const { isLoading, playlistData, moodAnalysis, generatedThumbnails, selectedThumbnail, error } = useStore();

  return (
    <div className="min-h-screen flex flex-col bg-louver-bg">
      <Header />

      <main className="flex-1 max-w-6xl w-full mx-auto px-6 py-8 space-y-8">
        {/* Error display */}
        {error && (
          <div className="animate-fade-in bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
            <svg className="w-5 h-5 text-red-500 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <p className="text-sm font-medium text-red-800">오류가 발생했습니다</p>
              <p className="text-sm text-red-600 mt-1">{error}</p>
            </div>
            <button
              onClick={() => useStore.getState().clearError()}
              className="ml-auto text-red-400 hover:text-red-600"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        )}

        {/* Input section */}
        <InputSection />

        {/* Playlist analysis results */}
        {playlistData && moodAnalysis && (
          <PlaylistAnalysis />
        )}

        {/* Generated thumbnail results */}
        {generatedThumbnails.length > 0 && (
          <ThumbnailResults />
        )}

        {/* Thumbnail detail modal */}
        {selectedThumbnail && (
          <ThumbnailDetail />
        )}
      </main>

      <Footer />

      {/* Loading overlay */}
      {isLoading && <LoadingOverlay />}
    </div>
  );
}
