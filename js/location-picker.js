/* ══════════════════════════════════════════════════════
   SAR COMMAND — TACTICAL LOCATION PICKER MODULE
   Interactive map selection, geocoding search, and 
   reverse geocoding to auto-fill place names & coordinates.
   100% Dynamic — Zero Hardcoded Data.
══════════════════════════════════════════════════════ */

const SARLocationPicker = {
  activeInstance: null,

  /**
   * Initializes an interactive location picker on a modal or form container.
   * @param {Object} opts Configuration options
   */
  init(opts) {
    // Clean up any previously initialized picker map
    this.destroy();

    const {
      mapElementId = 'incidentMiniMap',
      locationInputId = 'incLocation',
      latInputId = 'incLat',
      lngInputId = 'incLng',
      searchInputId = 'incLocationSearch',
      searchBtnId = 'incSearchBtn',
      gpsBtnId = 'incGpsBtn',
      clearBtnId = 'incClearSearchBtn',
      resultsContainerId = 'incSearchResults',
      coordsTagId = 'incCoordsTag',
      statusIndicatorId = 'incReverseGeocodeStatus',
      initialLat = 32.2455,
      initialLng = 77.1873,
      initialZoom = 12,
    } = opts;

    const mapEl = document.getElementById(mapElementId);
    if (!mapEl) {
      console.warn(`[LocationPicker] Element #${mapElementId} not found.`);
      return null;
    }

    const locInput = document.getElementById(locationInputId);
    const latInput = document.getElementById(latInputId);
    const lngInput = document.getElementById(lngInputId);
    const searchInput = document.getElementById(searchInputId);
    const searchBtn = document.getElementById(searchBtnId);
    const gpsBtn = document.getElementById(gpsBtnId);
    const clearBtn = document.getElementById(clearBtnId);
    const resultsContainer = document.getElementById(resultsContainerId);
    const coordsTag = document.getElementById(coordsTagId);
    const statusIndicator = document.getElementById(statusIndicatorId);

    // Initial coordinates from inputs if present
    const startLat = parseFloat(latInput?.value) || initialLat;
    const startLng = parseFloat(lngInput?.value) || initialLng;

    // Create Leaflet map instance
    const miniMap = L.map(mapElementId, {
      center: [startLat, startLng],
      zoom: initialZoom,
      zoomControl: true,
      attributionControl: false,
    });

    // ── Tactical Basemap Layers (No blocked OSM, No CARTO keys) ──
    const tacticalDark = L.layerGroup([
      L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}', {
        maxZoom: 16,
        crossOrigin: true,
      }),
      L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Reference/MapServer/tile/{z}/{y}/{x}', {
        maxZoom: 16,
        crossOrigin: true,
      }),
    ]);

    const satelliteRecon = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
      maxZoom: 18,
      crossOrigin: true,
    });

    const topoRelief = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}', {
      maxZoom: 17,
      crossOrigin: true,
    });

    tacticalDark.addTo(miniMap);

    // Basemap toggle control
    L.control.layers(
      {
        'Tactical Dark': tacticalDark,
        'Satellite Recon': satelliteRecon,
        'Topographic Relief': topoRelief,
      },
      null,
      { position: 'topright' }
    ).addTo(miniMap);

    // ── High-Visibility Pulsing Tactical Pin ──
    const pinIcon = L.divIcon({
      className: 'geo-tactical-pin-wrapper',
      html: `
        <div class="geo-tactical-pin">
          <div class="geo-pin-ring"></div>
          <div class="geo-pin-core"></div>
        </div>
      `,
      iconSize: [28, 28],
      iconAnchor: [14, 14],
    });

    const marker = L.marker([startLat, startLng], {
      icon: pinIcon,
      draggable: true,
      autoPan: true,
    }).addTo(miniMap);

    // Update UI elements with coordinate string
    function updateCoordsUI(lat, lng) {
      const latFixed = Number(lat).toFixed(5);
      const lngFixed = Number(lng).toFixed(5);

      if (latInput) latInput.value = latFixed;
      if (lngInput) lngInput.value = lngFixed;
      if (coordsTag) {
        coordsTag.innerHTML = `<strong>LAT:</strong> ${latFixed} &nbsp;|&nbsp; <strong>LNG:</strong> ${lngFixed}`;
      }
    }

    // Set status message
    function setStatus(text, type = 'info') {
      if (!statusIndicator) return;
      if (!text) {
        statusIndicator.innerHTML = '';
        statusIndicator.className = 'geo-status-indicator';
        return;
      }
      const icon = type === 'loading'
        ? '<span class="geo-spinner"></span>'
        : type === 'success' ? '✓' : 'ℹ';
      statusIndicator.className = `geo-status-indicator ${type}`;
      statusIndicator.innerHTML = `${icon} <span>${text}</span>`;
    }

    // ── Reverse Geocoding (Lat/Lng -> Human Location Name) ──
    let reverseTimeout = null;
    async function reverseGeocode(lat, lng) {
      setStatus('Identifying place name from map...', 'loading');
      clearTimeout(reverseTimeout);

      reverseTimeout = setTimeout(async () => {
        try {
          const apiBase = typeof API_BASE_URL !== 'undefined' ? API_BASE_URL : 'http://127.0.0.1:8000/api';
          let res = await fetch(`${apiBase}/geocode/reverse?lat=${lat}&lng=${lng}`).catch(() => null);

          // Direct Nominatim fallback if backend route unavailable
          if (!res || !res.ok) {
            res = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&addressdetails=1`);
          }

          if (res && res.ok) {
            const data = await res.json();
            const placeName = data.clean_name || data.display_name || `${lat.toFixed(4)}°N, ${lng.toFixed(4)}°E`;
            if (locInput) {
              locInput.value = placeName;
            }
            setStatus(`Location identified: ${placeName.split(',')[0]}`, 'success');
          } else {
            setStatus('Coordinates recorded (remote wilderness / unaddressed zone)', 'info');
          }
        } catch (err) {
          console.warn('[LocationPicker] Reverse geocode notice:', err);
          setStatus('Coordinates pinned on tactical map', 'info');
        }
      }, 300);
    }

    // ── Event: Click Map to Move Pin & Auto-Fill ──
    miniMap.on('click', (e) => {
      const { lat, lng } = e.latlng;
      marker.setLatLng([lat, lng]);
      updateCoordsUI(lat, lng);
      reverseGeocode(lat, lng);
    });

    // ── Event: Drag Pin ──
    marker.on('dragend', (e) => {
      const { lat, lng } = e.target.getLatLng();
      updateCoordsUI(lat, lng);
      reverseGeocode(lat, lng);
    });

    // ── Event: Manual Lat / Lng inputs change ──
    const handleCoordInputChange = () => {
      const lat = parseFloat(latInput?.value);
      const lng = parseFloat(lngInput?.value);
      if (!isNaN(lat) && !isNaN(lng) && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
        marker.setLatLng([lat, lng]);
        miniMap.panTo([lat, lng]);
        if (coordsTag) {
          coordsTag.innerHTML = `<strong>LAT:</strong> ${lat.toFixed(5)} &nbsp;|&nbsp; <strong>LNG:</strong> ${lng.toFixed(5)}`;
        }
      }
    };
    latInput?.addEventListener('input', handleCoordInputChange);
    lngInput?.addEventListener('input', handleCoordInputChange);

    // ── Event: Search Location by Name ──
    async function executeSearch() {
      const query = (searchInput?.value || '').trim();
      if (!query) {
        if (searchInput) searchInput.focus();
        return;
      }

      setStatus(`Searching "${query}"...`, 'loading');
      if (resultsContainer) {
        resultsContainer.innerHTML = '<div class="geo-search-loading"><span class="geo-spinner"></span> Scanning geographic database…</div>';
        resultsContainer.classList.remove('hidden');
      }

      try {
        const apiBase = typeof API_BASE_URL !== 'undefined' ? API_BASE_URL : 'http://127.0.0.1:8000/api';
        let res = await fetch(`${apiBase}/geocode/search?q=${encodeURIComponent(query)}`).catch(() => null);

        let items = [];
        if (res && res.ok) {
          const json = await res.json();
          items = json.results || [];
        } else {
          // Direct fallback
          const fallbackRes = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=5&addressdetails=1`);
          if (fallbackRes.ok) {
            const raw = await fallbackRes.json();
            items = raw.map(r => ({
              id: r.place_id,
              name: r.name,
              clean_name: r.display_name,
              display_name: r.display_name,
              lat: parseFloat(r.lat),
              lng: parseFloat(r.lon),
              type: r.type,
            }));
          }
        }

        if (!items || items.length === 0) {
          setStatus(`No matches found for "${query}"`, 'error');
          if (resultsContainer) {
            resultsContainer.innerHTML = `<div class="geo-search-empty">No locations matching "${query}". Try searching a nearby town, landmark, or mountain pass.</div>`;
          }
          return;
        }

        // Display results dropdown
        if (resultsContainer) {
          resultsContainer.innerHTML = `
            <div class="geo-search-header">Select Searched Location (${items.length} found):</div>
            ${items.map((item, idx) => `
              <div class="geo-search-item" data-idx="${idx}">
                <div class="geo-item-title">${item.name || item.clean_name.split(',')[0]}</div>
                <div class="geo-item-desc">${item.display_name}</div>
                <div class="geo-item-meta">
                  <span class="geo-type-badge">${item.type || 'place'}</span>
                  <span class="geo-coords">${item.lat.toFixed(4)}, ${item.lng.toFixed(4)}</span>
                </div>
              </div>
            `).join('')}
          `;
          resultsContainer.classList.remove('hidden');

          // Attach click listeners to each result
          const resultElements = resultsContainer.querySelectorAll('.geo-search-item');
          resultElements.forEach((el) => {
            el.addEventListener('click', () => {
              const idx = parseInt(el.getAttribute('data-idx'), 10);
              selectSearchResult(items[idx]);
            });
          });
        }

        // Auto select first match immediately for fast convenience
        selectSearchResult(items[0], false);
      } catch (err) {
        console.error('[LocationPicker] Search failed:', err);
        setStatus('Search service unavailable. Click on map to pick manually.', 'error');
      }
    }

    function selectSearchResult(item, closeDropdown = true) {
      if (!item) return;

      const lat = item.lat;
      const lng = item.lng;
      const name = item.clean_name || item.display_name;

      marker.setLatLng([lat, lng]);
      miniMap.setView([lat, lng], 13);
      updateCoordsUI(lat, lng);

      if (locInput) {
        locInput.value = name;
      }
      if (searchInput) {
        searchInput.value = item.name || name.split(',')[0];
      }

      setStatus(`Selected: ${name.split(',')[0]}`, 'success');

      if (closeDropdown && resultsContainer) {
        resultsContainer.classList.add('hidden');
      }
    }

    // Search button and Enter key listeners
    searchBtn?.addEventListener('click', executeSearch);
    searchInput?.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        executeSearch();
      }
    });

    searchInput?.addEventListener('input', () => {
      if (clearBtn) {
        if (searchInput.value.trim().length > 0) {
          clearBtn.classList.remove('hidden');
        } else {
          clearBtn.classList.add('hidden');
        }
      }
    });

    clearBtn?.addEventListener('click', () => {
      if (searchInput) searchInput.value = '';
      clearBtn.classList.add('hidden');
      if (resultsContainer) resultsContainer.classList.add('hidden');
      if (searchInput) searchInput.focus();
    });

    // ── Event: Detect Current GPS Location ──
    gpsBtn?.addEventListener('click', () => {
      if (!navigator.geolocation) {
        setStatus('Geolocation is not supported by this browser.', 'error');
        return;
      }

      setStatus('Acquiring device GPS fix...', 'loading');
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const lat = pos.coords.latitude;
          const lng = pos.coords.longitude;
          marker.setLatLng([lat, lng]);
          miniMap.setView([lat, lng], 14);
          updateCoordsUI(lat, lng);
          reverseGeocode(lat, lng);
          setStatus('GPS position locked (+/- ' + Math.round(pos.coords.accuracy) + 'm)', 'success');
        },
        (err) => {
          console.warn('[LocationPicker] GPS error:', err);
          setStatus('Unable to acquire GPS fix: ' + (err.message || 'Permission denied'), 'error');
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
    });

    // Initialize UI with initial values
    updateCoordsUI(startLat, startLng);

    // Initial reverse geocode if location input is currently blank
    if (locInput && !locInput.value.trim()) {
      reverseGeocode(startLat, startLng);
    }

    // Force Leaflet to re-calculate container dimensions after modal is shown in DOM
    setTimeout(() => {
      miniMap.invalidateSize();
    }, 200);
    setTimeout(() => {
      miniMap.invalidateSize();
    }, 500);

    // Store active instance
    this.activeInstance = {
      map: miniMap,
      marker,
      destroy: () => {
        try {
          miniMap.remove();
        } catch (e) {}
        this.activeInstance = null;
      },
    };

    window.activeMiniMap = miniMap;
    return this.activeInstance;
  },

  destroy() {
    if (this.activeInstance) {
      this.activeInstance.destroy();
    }
    if (window.activeMiniMap) {
      try {
        window.activeMiniMap.remove();
      } catch (e) {}
      window.activeMiniMap = null;
    }
  },
};

