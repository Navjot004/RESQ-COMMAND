const express = require('express');

const router = express.Router();

// Simple in-memory cache to respect Nominatim policy and ensure sub-second response
const cache = new Map();
const CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes

function getCached(key) {
  const item = cache.get(key);
  if (item && Date.now() - item.time < CACHE_TTL_MS) {
    return item.data;
  }
  if (item) {
    cache.delete(key);
  }
  return null;
}

function setCache(key, data) {
  if (cache.size > 200) {
    // Purge oldest entries if cache grows
    const oldestKey = cache.keys().next().value;
    cache.delete(oldestKey);
  }
  cache.set(key, { time: Date.now(), data });
}

// Format clean human-readable name from Nominatim address object
function formatCleanName(item) {
  if (!item) return '';
  const addr = item.address || {};
  const parts = [];

  const mainName = item.name || addr.road || addr.village || addr.town || addr.city || addr.suburb || addr.hamlet;
  if (mainName) parts.push(mainName);

  const localArea = addr.suburb || addr.hamlet || addr.county || addr.state_district;
  if (localArea && !parts.includes(localArea)) parts.push(localArea);

  const region = addr.state || addr.province;
  if (region && !parts.includes(region)) parts.push(region);

  const country = addr.country;
  if (country && !parts.includes(country)) parts.push(country);

  return parts.length > 0 ? parts.join(', ') : item.display_name;
}

// GET /api/geocode/search?q=Solang
router.get('/search', async (req, res) => {
  const query = (req.query.q || '').trim();
  if (!query) {
    return res.status(400).json({ detail: 'Search query "q" is required' });
  }

  const cacheKey = `search:${query.toLowerCase()}`;
  const cached = getCached(cacheKey);
  if (cached) {
    return res.json({ results: cached, source: 'cache' });
  }

  try {
    const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&addressdetails=1&limit=6`;
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'RESQ-Command-SAR-Platform/1.0 (Emergency Coordination Team)',
        'Accept-Language': 'en-US,en;q=0.9',
      },
    });

    if (!response.ok) {
      return res.status(response.status).json({ detail: 'Geocoding upstream service error' });
    }

    const data = await response.json();
    const formatted = data.map((item) => ({
      id: item.place_id,
      name: item.name || '',
      clean_name: formatCleanName(item),
      display_name: item.display_name,
      lat: parseFloat(item.lat),
      lng: parseFloat(item.lon),
      type: item.type,
      class: item.class,
    }));

    setCache(cacheKey, formatted);
    return res.json({ results: formatted, source: 'nominatim' });
  } catch (error) {
    console.error('Geocode search error:', error);
    return res.status(500).json({ detail: 'Failed to search location' });
  }
});

// GET /api/geocode/reverse?lat=32.245&lng=77.187
router.get('/reverse', async (req, res) => {
  const lat = parseFloat(req.query.lat);
  const lng = parseFloat(req.query.lng || req.query.lon);

  if (isNaN(lat) || isNaN(lng)) {
    return res.status(400).json({ detail: 'Valid "lat" and "lng" query parameters are required' });
  }

  // Round slightly for caching nearby clicks
  const cacheKey = `rev:${lat.toFixed(4)},${lng.toFixed(4)}`;
  const cached = getCached(cacheKey);
  if (cached) {
    return res.json({ ...cached, source: 'cache' });
  }

  try {
    const url = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&addressdetails=1`;
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'RESQ-Command-SAR-Platform/1.0 (Emergency Coordination Team)',
        'Accept-Language': 'en-US,en;q=0.9',
      },
    });

    if (!response.ok) {
      return res.status(response.status).json({ detail: 'Reverse geocode upstream error' });
    }

    const data = await response.json();
    if (data.error) {
      // Wilderness or unmapped territory
      const fallback = {
        clean_name: `Tactical Coordinates (${lat.toFixed(4)}°N, ${lng.toFixed(4)}°E)`,
        display_name: `Uncharted Grid Sector [${lat.toFixed(5)}, ${lng.toFixed(5)}]`,
        lat,
        lng,
        is_wilderness: true,
      };
      return res.json(fallback);
    }

    const result = {
      clean_name: formatCleanName(data),
      display_name: data.display_name,
      lat,
      lng,
      address: data.address || {},
    };

    setCache(cacheKey, result);
    return res.json({ ...result, source: 'nominatim' });
  } catch (error) {
    console.error('Geocode reverse error:', error);
    return res.status(500).json({ detail: 'Failed to reverse geocode coordinate' });
  }
});

module.exports = router;

