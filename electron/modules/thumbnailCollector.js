const axios = require('axios');

/**
 * Thumbnail Collector Module
 * - Collect thumbnails from playlist items
 * - Select best resolution
 * - Remove duplicates
 * - Classify representative candidates
 */

async function fetchImageAsBase64(url) {
  try {
    const response = await axios.get(url, {
      responseType: 'arraybuffer',
      timeout: 10000,
    });
    const base64 = Buffer.from(response.data, 'base64').toString('base64');
    const contentType = response.headers['content-type'] || 'image/jpeg';
    return `data:${contentType};base64,${base64}`;
  } catch {
    return null;
  }
}

function getBestThumbnailUrl(videoId, thumbnails) {
  if (thumbnails && thumbnails.length > 0) {
    // Sort by resolution, pick highest
    const sorted = [...thumbnails].sort(
      (a, b) => (b.width || 0) * (b.height || 0) - (a.width || 0) * (a.height || 0)
    );
    return sorted[0].url;
  }
  // Fallback to maxresdefault, hqdefault
  return `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;
}

function removeDuplicates(items) {
  const seen = new Set();
  return items.filter((item) => {
    if (seen.has(item.videoId)) return false;
    seen.add(item.videoId);
    return true;
  });
}

async function collectThumbnails(playlistData) {
  const uniqueItems = removeDuplicates(playlistData.items || []);

  // Limit to first 20 items for performance
  const targetItems = uniqueItems.slice(0, 20);

  const collected = [];

  for (const item of targetItems) {
    const url = getBestThumbnailUrl(item.videoId, item.thumbnails);
    collected.push({
      videoId: item.videoId,
      title: item.title,
      artist: item.artist,
      thumbnailUrl: url,
    });
  }

  // Select representative candidates based on position in playlist
  const representatives = selectRepresentatives(collected);

  return {
    all: collected,
    representatives,
    totalCount: collected.length,
  };
}

function selectRepresentatives(thumbnails) {
  if (thumbnails.length === 0) return [];

  const candidates = [];

  // First item is always a candidate (playlist opener)
  candidates.push({ ...thumbnails[0], reason: '재생목록 첫 번째 트랙' });

  // Middle item represents the core mood
  if (thumbnails.length > 2) {
    const midIndex = Math.floor(thumbnails.length / 2);
    candidates.push({ ...thumbnails[midIndex], reason: '재생목록 중간 트랙 (핵심 무드)' });
  }

  // Last item for playlist closure
  if (thumbnails.length > 1) {
    candidates.push({
      ...thumbnails[thumbnails.length - 1],
      reason: '재생목록 마지막 트랙',
    });
  }

  // Pick one more at random quarter position
  if (thumbnails.length > 4) {
    const quarterIndex = Math.floor(thumbnails.length / 4);
    candidates.push({ ...thumbnails[quarterIndex], reason: '추가 대표 후보' });
  }

  return candidates;
}

module.exports = { collectThumbnails, fetchImageAsBase64 };
