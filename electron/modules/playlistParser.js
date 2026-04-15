const axios = require('axios');

/**
 * Playlist Parser Module
 * - URL validation
 * - Playlist ID extraction
 * - Playlist metadata fetching via YouTube's internal API
 */

const PLAYLIST_URL_PATTERNS = [
  /[?&]list=([a-zA-Z0-9_-]+)/,
  /\/playlist\?list=([a-zA-Z0-9_-]+)/,
];

function extractPlaylistId(url) {
  for (const pattern of PLAYLIST_URL_PATTERNS) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  return null;
}

function validateUrl(url) {
  if (!url || typeof url !== 'string') {
    throw new Error('유효한 URL을 입력해주세요.');
  }

  const trimmed = url.trim();
  if (!trimmed.includes('youtube.com') && !trimmed.includes('youtu.be')) {
    throw new Error('유튜브 URL이 아닙니다. 유튜브 재생목록 링크를 입력해주세요.');
  }

  const playlistId = extractPlaylistId(trimmed);
  if (!playlistId) {
    throw new Error('재생목록 ID를 찾을 수 없습니다. 올바른 재생목록 링크인지 확인해주세요.');
  }

  return { url: trimmed, playlistId };
}

async function fetchPlaylistPage(playlistId) {
  const url = `https://www.youtube.com/playlist?list=${playlistId}`;

  const response = await axios.get(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept-Language': 'ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7',
    },
    timeout: 15000,
  });

  return response.data;
}

function extractInitialData(html) {
  const match = html.match(/var ytInitialData\s*=\s*(\{.+?\});/s);
  if (!match) {
    throw new Error('유튜브 페이지에서 데이터를 추출할 수 없습니다.');
  }

  try {
    return JSON.parse(match[1]);
  } catch {
    throw new Error('유튜브 데이터 파싱에 실패했습니다.');
  }
}

function parsePlaylistItems(initialData) {
  const items = [];

  try {
    const contents =
      initialData?.contents?.twoColumnBrowseResultsRenderer?.tabs?.[0]
        ?.tabRenderer?.content?.sectionListRenderer?.contents?.[0]
        ?.itemSectionRenderer?.contents?.[0]
        ?.playlistVideoListRenderer?.contents || [];

    for (const item of contents) {
      const video = item?.playlistVideoRenderer;
      if (!video) continue;

      const videoId = video.videoId;
      const title = video.title?.runs?.[0]?.text || '';
      const artist =
        video.shortBylineText?.runs?.[0]?.text || '';
      const duration = video.lengthText?.simpleText || '';

      // Get highest quality thumbnail
      const thumbnails = video.thumbnail?.thumbnails || [];
      const bestThumbnail =
        thumbnails.length > 0
          ? thumbnails[thumbnails.length - 1].url
          : `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;

      items.push({
        videoId,
        title,
        artist,
        duration,
        thumbnailUrl: bestThumbnail,
        thumbnails,
      });
    }
  } catch (e) {
    console.error('Error parsing playlist items:', e);
  }

  return items;
}

function extractPlaylistMeta(initialData) {
  try {
    const metadata =
      initialData?.metadata?.playlistMetadataRenderer || {};
    const sidebar =
      initialData?.sidebar?.playlistSidebarRenderer?.items?.[0]
        ?.playlistSidebarPrimaryInfoRenderer || {};
    const ownerInfo =
      initialData?.sidebar?.playlistSidebarRenderer?.items?.[1]
        ?.playlistSidebarSecondaryInfoRenderer?.videoOwner
        ?.videoOwnerRenderer || {};

    return {
      title: metadata.title || '',
      description: metadata.description || '',
      channelName: ownerInfo?.title?.runs?.[0]?.text || '',
      videoCount:
        sidebar?.stats?.[0]?.runs?.[0]?.text || '0',
    };
  } catch {
    return { title: '', description: '', channelName: '', videoCount: '0' };
  }
}

async function parsePlaylist(url) {
  const { playlistId } = validateUrl(url);
  const html = await fetchPlaylistPage(playlistId);
  const initialData = extractInitialData(html);

  const meta = extractPlaylistMeta(initialData);
  const items = parsePlaylistItems(initialData);

  return {
    playlistId,
    title: meta.title,
    description: meta.description,
    channelName: meta.channelName,
    videoCount: meta.videoCount,
    items,
    url,
  };
}

module.exports = { parsePlaylist, extractPlaylistId, validateUrl };
