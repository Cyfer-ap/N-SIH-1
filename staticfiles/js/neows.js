document.addEventListener("DOMContentLoaded", () => {
  if (!neoData || !Array.isArray(neoData)) {
    console.warn("NEO data not available or invalid");
    return;
  }

  const countByDate = {};
  let hazardousCount = 0, nonHazardousCount = 0;
  const missDistances = [], sizes = [], speeds = [];

  neoData.forEach(neo => {
    const date = neo.close_approach_date;
    countByDate[date] = (countByDate[date] || 0) + 1;

    if (neo.hazardous) hazardousCount++;
    else nonHazardousCount++;

    missDistances.push(parseFloat(neo.miss_distance));
    sizes.push((parseFloat(neo.diameter_min) + parseFloat(neo.diameter_max)) / 2);
    speeds.push(parseFloat(neo.velocity));
  });

  new Chart(document.getElementById("countByDateChart"), {
    type: "bar",
    data: {
      labels: Object.keys(countByDate),
      datasets: [{
        label: "NEO Count",
        data: Object.values(countByDate),
        backgroundColor: "#4e79a7"
      }]
    },
    options: {
      responsive: true,
      plugins: {
        title: {
          display: true,
          text: "NEO Count by Date"
        }
      }
    }
  });

  new Chart(document.getElementById("hazardousPieChart"), {
    type: "pie",
    data: {
      labels: ["Hazardous", "Non-Hazardous"],
      datasets: [{
        data: [hazardousCount, nonHazardousCount],
        backgroundColor: ["#e15759", "#59a14f"]
      }]
    },
    options: {
      responsive: true,
      plugins: {
        title: {
          display: true,
          text: "Hazardous vs Non-Hazardous NEOs"
        }
      }
    }
  });

  new Chart(document.getElementById("missDistanceChart"), {
    type: "bar",
    data: {
      labels: missDistances.map((_, i) => i + 1),
      datasets: [{
        label: "Miss Distance (km)",
        data: missDistances,
        backgroundColor: "#f28e2c"
      }]
    },
    options: {
      responsive: true,
      plugins: {
        title: {
          display: true,
          text: "Closest Approach Distance Distribution"
        }
      }
    }
  });

  new Chart(document.getElementById("sizeDistributionChart"), {
    type: "bar",
    data: {
      labels: sizes.map((_, i) => i + 1),
      datasets: [{
        label: "NEO Diameter (m)",
        data: sizes,
        backgroundColor: "#edc948"
      }]
    },
    options: {
      responsive: true,
      plugins: {
        title: {
          display: true,
          text: "NEO Size Distribution"
        }
      }
    }
  });

  new Chart(document.getElementById("speedChart"), {
    type: "line",
    data: {
      labels: speeds.map((_, i) => i + 1),
      datasets: [{
        label: "Velocity (km/h)",
        data: speeds,
        borderColor: "#76b7b2",
        fill: false,
        tension: 0.1
      }]
    },
    options: {
      responsive: true,
      plugins: {
        title: {
          display: true,
          text: "NEO Speed Distribution"
        }
      }
    }
  });
});
