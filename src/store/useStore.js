import { create } from 'zustand';

const useStore = create((set, get) => ({
  // Input state
  inputMode: 'keyword', // 'keyword' | 'playlist'
  keywordInput: '',
  playlistUrl: '',

  // Processing state
  isLoading: false,
  loadingMessage: '',
  error: null,

  // Playlist analysis result
  playlistData: null,
  thumbnailCollection: null,
  moodAnalysis: null,

  // Generated thumbnails
  generatedThumbnails: [],
  selectedThumbnail: null,

  // Actions: Input
  setInputMode: (mode) => set({ inputMode: mode, error: null }),
  setKeywordInput: (value) => set({ keywordInput: value }),
  setPlaylistUrl: (value) => set({ playlistUrl: value }),

  // Actions: Loading
  setLoading: (isLoading, message = '') =>
    set({ isLoading, loadingMessage: message }),
  setError: (error) => set({ error, isLoading: false }),
  clearError: () => set({ error: null }),

  // Actions: Playlist data
  setPlaylistData: (data) => set({ playlistData: data }),
  setThumbnailCollection: (data) => set({ thumbnailCollection: data }),
  setMoodAnalysis: (data) => set({ moodAnalysis: data }),

  // Actions: Generated thumbnails
  setGeneratedThumbnails: (thumbnails) => set({ generatedThumbnails: thumbnails }),
  addGeneratedThumbnail: (thumbnail) =>
    set((state) => ({
      generatedThumbnails: [...state.generatedThumbnails, thumbnail],
    })),
  selectThumbnail: (index) =>
    set((state) => ({
      selectedThumbnail: state.generatedThumbnails[index] || null,
    })),
  clearSelectedThumbnail: () => set({ selectedThumbnail: null }),

  // Actions: Reset
  resetAll: () =>
    set({
      keywordInput: '',
      playlistUrl: '',
      isLoading: false,
      loadingMessage: '',
      error: null,
      playlistData: null,
      thumbnailCollection: null,
      moodAnalysis: null,
      generatedThumbnails: [],
      selectedThumbnail: null,
    }),

  // Computed-like helpers
  hasResults: () => get().generatedThumbnails.length > 0,
  hasPlaylistData: () => get().playlistData !== null,
}));

export default useStore;
