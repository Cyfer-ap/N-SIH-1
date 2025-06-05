document.addEventListener("DOMContentLoaded", function () {
  const latDisplay = document.getElementById("lat-display");
  const lonDisplay = document.getElementById("lon-display");
  const satSelect = document.getElementById("satellite-select");
  const placeInput = document.getElementById("place-input");
  const locateBtn = document.getElementById("locate-me");
  const passForm = document.getElementById("pass-form");
  const resultsDiv = document.getElementById("pass-results");

  const defaultLat = 28.6139;
  const defaultLon = 77.2090;
  const map = L.map("map").setView([defaultLat, defaultLon], 3);

  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: "© OpenStreetMap contributors"
  }).addTo(map);

  const satIcon = L.icon({
    iconUrl: "https://upload.wikimedia.org/wikipedia/commons/d/d0/International_Space_Station.svg",
    iconSize: [50, 32],
    iconAnchor: [25, 16]
  });

  const marker = L.marker([defaultLat, defaultLon], { icon: satIcon })
    .addTo(map)
    .bindPopup("🛰️ Satellite Position")
    .openPopup();

  let currentSatId = satSelect ? satSelect.value : "25544";
  let interval = null;

  function updatePositionOnMap(lat, lon) {
    marker.setLatLng([lat, lon]);
    map.setView([lat, lon], map.getZoom());
    latDisplay.textContent = lat.toFixed(4);
    lonDisplay.textContent = lon.toFixed(4);
  }

  async function fetchSatellitePosition(satId) {
    const observerLat = defaultLat;
    const observerLon = defaultLon;
    const observerAlt = 0;

    const url = `/api/satellite-position/?satid=${satId}&lat=${observerLat}&lon=${observerLon}&alt=${observerAlt}`;

    try {
      const response = await fetch(url);
      const data = await response.json();
      if (data.positions && data.positions.length > 0) {
        const pos = data.positions[0];
        updatePositionOnMap(pos.satlatitude, pos.satlongitude);
      }
    } catch (error) {
      console.error("Satellite position fetch failed:", error);
    }
  }

  if (satSelect) {
    interval = setInterval(() => fetchSatellitePosition(currentSatId), 5000);
    satSelect.addEventListener("change", function () {
      currentSatId = this.value;
      fetchSatellitePosition(currentSatId);
      clearInterval(interval);
      interval = setInterval(() => fetchSatellitePosition(currentSatId), 5000);
    });
    fetchSatellitePosition(currentSatId);
  }

  // Handle satellite pass prediction
  passForm?.addEventListener("submit", async function (e) {
    e.preventDefault();

    const latInput = parseFloat(document.getElementById("pass-lat").value);
    const lonInput = parseFloat(document.getElementById("pass-lon").value);

    if (
      isNaN(latInput) || isNaN(lonInput) ||
      latInput < -90 || latInput > 90 ||
      lonInput < -180 || lonInput > 180
    ) {
      resultsDiv.innerHTML = "❗ Please enter valid coordinates (Lat: -90 to 90, Lon: -180 to 180).";
      return;
    }

    resultsDiv.innerHTML = "⏳ Fetching pass times...";

    try {
      const satId = document.getElementById("satellite-select").value;

      const res = await fetch(`/api/iss-passes/?lat=${latInput}&lon=${lonInput}&satid=${satId}`);

      const data = await res.json();

      if (data.passes && data.passes.length > 0) {
        function isNightTime(date) {
          const hour = date.getUTCHours();
          return hour < 6 || hour > 19;
        }

        const now = new Date();
        let nextPass = null;

        const formatted = data.passes.map((pass, i) => {
          const start = new Date(pass.startUTC * 1000);
          const end = new Date(pass.endUTC * 1000);
          const duration = Math.round(pass.endUTC - pass.startUTC);
          if (!nextPass && start > now) nextPass = start;

          const isNight = isNightTime(start);
          const nightClass = isNight ? "night-pass" : "";
          const nightTag = isNight ? "🌙 " : "";

          return `<li class="${nightClass}">
            <strong>${nightTag}Pass ${i + 1}:</strong><br>
            🕒 ${start.toUTCString()} → ${end.toUTCString()}<br>
            ⏱️ Duration: ${duration} seconds
          </li>`;
        });

        resultsDiv.innerHTML = `
          <div id="countdown" class="countdown-box"></div>
          <ul>${formatted.join("")}</ul>
        `;

        if (nextPass) {
          const countdownBox = document.getElementById("countdown");
          function updateCountdown() {
            const now = new Date();
            const diff = Math.max(0, nextPass - now);
            const seconds = Math.floor((diff / 1000) % 60);
            const minutes = Math.floor((diff / 1000 / 60) % 60);
            const hours = Math.floor((diff / 1000 / 60 / 60));
            countdownBox.innerHTML = diff > 0
              ? `⏳ Next Pass in: <strong>${hours}h ${minutes}m ${seconds}s</strong>`
              : `🚀 The next ISS pass is happening now!`;
          }
          updateCountdown();
          setInterval(updateCountdown, 1000);
        }

      } else {
        resultsDiv.innerHTML = "❌ No visible ISS passes found for this location.<br><small>Try a more visible sky region, away from poles or oceans.</small>";
      }
    } catch (err) {
      console.error("Error fetching pass data:", err);
      resultsDiv.innerHTML = "❌ Server error while fetching pass data.";
    }
  });

  // Geolocation button
  locateBtn?.addEventListener("click", function () {
    if (!navigator.geolocation) {
      alert("Geolocation not supported.");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) => {
        document.getElementById("pass-lat").value = position.coords.latitude.toFixed(6);
        document.getElementById("pass-lon").value = position.coords.longitude.toFixed(6);
      },
      () => alert("❌ Could not get your location.")
    );
  });

  // City/place to coordinate conversion
  placeInput?.addEventListener("change", async function () {
    const place = this.value.trim();
    if (!place) return;

    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(place)}`);
      const data = await res.json();
      if (data.length > 0) {
        const best = data[0];
        document.getElementById("pass-lat").value = parseFloat(best.lat).toFixed(6);
        document.getElementById("pass-lon").value = parseFloat(best.lon).toFixed(6);
      } else {
        alert("❌ Place not found. Try a different name.");
      }
    } catch (err) {
      console.error("Place lookup error:", err);
      alert("❌ Error finding location.");
    }
  });
});


