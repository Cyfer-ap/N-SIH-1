let solarFlareChart;
let kpIndexChart;

document.addEventListener('DOMContentLoaded', () => {
  const solarFlareCtx = document.getElementById('solarFlareChart').getContext('2d');
  const kpIndexCtx = document.getElementById('kpIndexChart').getContext('2d');

  solarFlareChart = new Chart(solarFlareCtx, {
    type: 'bar',
    data: {
      labels: [],
      datasets: [{
        label: 'Solar Flare Intensity (log scale)',
        data: [],
        backgroundColor: 'rgba(255, 159, 64, 0.7)'
      }]
    },
    options: {
      responsive: true,
      plugins: {
        tooltip: {
          callbacks: {
            label: function(context) {
              return `Intensity: ${context.raw}`;
            }
          }
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          title: { display: true, text: 'Flare Strength (approx)' }
        }
      }
    }
  });

  kpIndexChart = new Chart(kpIndexCtx, {
    type: 'line',
    data: {
      labels: [],
      datasets: [{
        label: 'Kp Index',
        data: [],
        fill: false,
        borderColor: 'rgba(54, 162, 235, 1)',
        tension: 0.3
      }]
    },
    options: {
      responsive: true,
      scales: {
        y: {
          min: 0,
          max: 9,
          title: { display: true, text: 'Kp Index' }
        }
      }
    }
  });
});

// Utility to convert solar flare class string to numeric approximation
function convertFlareClassToValue(classType) {
  if (!classType || typeof classType !== 'string') return 0;

  const classLetter = classType[0].toUpperCase();
  const magnitude = parseFloat(classType.slice(1));

  if (isNaN(magnitude)) return 0;

  switch (classLetter) {
    case 'A': return magnitude * 1;
    case 'B': return magnitude * 10;
    case 'C': return magnitude * 100;
    case 'M': return magnitude * 1000;
    case 'X': return magnitude * 10000;
    default: return 0;
  }
}

function updateSolarFlareChart(events) {
  const labels = events.map(e => e.peakTime?.slice(0, 10) || 'Unknown');
  const data = events.map(e => convertFlareClassToValue(e.classType));

  solarFlareChart.data.labels = labels;
  solarFlareChart.data.datasets[0].data = data;
  solarFlareChart.update();
}

function updateKpIndexChart(events) {
  const labels = [];
  const data = [];

  for (const e of events) {
    // Defensive check for structure
    if (e.kpIndex && Array.isArray(e.kpIndex) && e.kpIndex.length > 0) {
      const kp = parseFloat(e.kpIndex[0].kpIndex);  // use first kpIndex value
      const time = e.startTime?.slice(0, 10) || e.kpIndex[0].observedTime?.slice(0, 10) || 'Unknown';

      if (!isNaN(kp)) {
        labels.push(time);
        data.push(kp);
      }
    }
  }

  console.log("KP Index Labels:", labels);
  console.log("KP Index Data:", data);

  if (labels.length === 0 || data.length === 0) {
    console.warn("No valid KP Index data to render chart.");
  }

  kpIndexChart.data.labels = labels;
  kpIndexChart.data.datasets[0].data = data;
  kpIndexChart.update();
}

