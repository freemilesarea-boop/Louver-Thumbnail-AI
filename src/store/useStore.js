import { create } from 'zustand';

const useStore = create((set, get) => ({
  // API key (persisted in localStorage)
  pexelsApiKey: localStorage.getItem('louver-pexels-key') || '',
  apiStatus: localStorage.getItem('louver-pexels-key') ? 'connected' : 'idle',
  apiGatePassed: !!localStorage.getItem('louver-gate-passed'),

  // Input state
  inputMode: 'keyword',
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

  // Actions: API
  setPexelsApiKey: (key) => {
    localStorage.setItem('louver-pexels-key', key);
    set({ pexelsApiKey: key, apiStatus: key ? 'connected' : 'idle' });
  },
  setApiStatus: (status) => set({ apiStatus: status }),
  passApiGate: () => {
    localStorage.setItem('louver-gate-passed', '1');
    set({ apiGatePassed: true });
  },

  // Actions: Input
  setInputMode: (mode) => set({ inputMode: mode, error: null }),
  setKeywordInput: (value) => set({ keywordInput: value }),
  setPlaylistUrl: (value) => set({ playlistUrl: value }),

  // Actions: Loading
  setLoading: (isLoading, message = '') => set({ isLoading, loadingMessage: message }),
  setError: (error) => set({ error, isLoading: false }),
  clearError: () => set({ error: null }),

  // Actions: Data
  setPlaylistData: (data) => set({ playlistData: data }),
  setThumbnailCollection: (data) => set({ thumbnailCollection: data }),
  setMoodAnalysis: (data) => set({ moodAnalysis: data }),
  setGeneratedThumbnails: (thumbnails) => set({ generatedThumbnails: thumbnails }),
  selectThumbnail: (index) => set((state) => ({ selectedThumbnail: state.generatedThumbnails[index] || null })),
  clearSelectedThumbnail: () => set({ selectedThumbnail: null }),

  // Actions: Reset
  resetAll: () => set({
    keywordInput: '', playlistUrl: '',
    isLoading: false, loadingMessage: '', error: null,
    playlistData: null, thumbnailCollection: null, moodAnalysis: null,
    generatedThumbnails: [], selectedThumbnail: null,
  }),
}));

export default useStore;
