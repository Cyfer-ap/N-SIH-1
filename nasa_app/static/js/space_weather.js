document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('space-weather-form');
  const resultsContainer = document.getElementById('space-weather-results');

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const start = new Date(document.getElementById('start-date').value);
    const end = new Date(document.getElementById('end-date').value);

    if (end - start > 14 * 24 * 60 * 60 * 1000) {
      alert("Please select a date range of 14 days or less.");
      return;
    }

    fetchEvents();
  });

  const fetchEvents = async () => {
    resultsContainer.innerHTML = '<p>Loading...</p>';

    const startDate = document.getElementById('start-date').value;
    const endDate = document.getElementById('end-date').value;
    const flareClassFilter = document.getElementById('flare-class-filter')?.value;
    const kpIndexFilter = document.getElementById('kp-index-filter')?.value;

    const url = new URL('/space-weather/', window.location.origin);
    if (startDate) url.searchParams.append('start', startDate);
    if (endDate) url.searchParams.append('end', endDate);

    try {
      const res = await fetch(url.toString(), {
        headers: { 'X-Requested-With': 'XMLHttpRequest' }
      });

      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);

      const data = await res.json();

      let html = '';
      html += formatEventList('Solar Flares', data.solar_flares, renderSolarFlares, flareClassFilter);
      html += formatEventList('Coronal Mass Ejections (CMEs)', data.cmes, renderCMEs);
      html += formatEventList('Geomagnetic Storms (GMS)', data.geomagnetic_storms, renderGMS, kpIndexFilter);
      html += formatEventList('Solar Energetic Particles (SEPs)', data.seps, renderSEPs);
      html += formatEventList('Interplanetary Shocks (IPS)', data.ips, renderIPS);

      resultsContainer.innerHTML = html;
    } catch (error) {
      resultsContainer.innerHTML = `<p>Error fetching space weather data: ${error.message}</p>`;
    }
  };

  const formatEventList = (title, events, renderFn, filterValue) => {
    if (!events || events.error) {
      return `<h3>${title}</h3><p>Error fetching data or no data available.</p>`;
    }
    if (events.length === 0) {
      return `<h3>${title}</h3><p>No events found.</p>`;
    }
    return `<h3>${title}</h3><ul>${renderFn(events, filterValue)}</ul>`;
  };

  const renderSolarFlares = (events, filter) => {
    const filtered = filter
      ? events.filter(e => e.classType && e.classType.startsWith(filter))
      : events;

    if (typeof updateSolarFlareChart === 'function') {
      updateSolarFlareChart(filtered);
    }


    return filtered.map(e => `
      <li>
        <strong>Class:</strong> ${e.classType || 'N/A'}<br>
        <strong>Peak Time:</strong> ${e.peakTime || 'N/A'}<br>
        <strong>Source Location:</strong> ${e.sourceLocation || 'N/A'}<br>
        <strong>Linked Events:</strong> ${e.linkedEvents?.join(', ') || 'None'}
      </li>
    `).join('');
  };

  const renderCMEs = (events) => {
    return events.map(e => `
      <li>
        <strong>Time:</strong> ${e.startTime || 'N/A'}<br>
        <strong>Speed:</strong> ${e.cmeAnalyses?.[0]?.speed || 'Unknown'} km/s<br>
        <strong>Type/Note:</strong> ${e.note || 'N/A'}
      </li>
    `).join('');
  };

  const renderGMS = (events, minKp) => {
    const filtered = minKp
      ? events.filter(e => e.kpIndex && Number(e.kpIndex) >= Number(minKp))
      : events;

    updateKpIndexChart(filtered);

    return filtered.map(e => `
      <li>
        <strong>Start:</strong> ${e.startTime || 'N/A'}<br>
        <strong>KP Index:</strong> ${e.kpIndex || 'N/A'}<br>
        <strong>Source Link:</strong> ${e.link ? `<a href="${e.link}" target="_blank">Details</a>` : 'N/A'}
      </li>
    `).join('');
  };

  const renderSEPs = (events) => {
    return events.map(e => `
      <li>
        <strong>Event ID:</strong> ${e.eventID || 'N/A'}<br>
        <strong>Start Time:</strong> ${e.eventTime || 'N/A'}<br>
        <strong>Instruments:</strong> ${e.instruments?.map(i => i.displayName).join(', ') || 'N/A'}
      </li>
    `).join('');
  };

  const renderIPS = (events) => {
    return events.map(e => `
      <li>
        <strong>Shock Time:</strong> ${e.shockTime || 'N/A'}<br>
        <strong>Location:</strong> ${e.location || 'N/A'}<br>
        <strong>Instruments:</strong> ${e.instruments?.map(i => i.displayName).join(', ') || 'N/A'}
      </li>
    `).join('');
  };

  // Load initial data
  fetchEvents();
});
