let allMissions = [];

document.addEventListener("DOMContentLoaded", () => {
  fetch("/static/isro/data/isro_missions.json")
    .then(response => response.json())
    .then(data => {
      allMissions = data;
      populateYearFilter(data);
      renderMissions(data);
    });

  document.getElementById("apply-filters").addEventListener("click", () => {
    applyFilters();
  });
});

function populateYearFilter(missions) {
  const years = [...new Set(missions.map(m => new Date(m.launch_date).getFullYear()))].sort((a, b) => b - a);
  const yearFilter = document.getElementById("year-filter");
  years.forEach(year => {
    const opt = document.createElement("option");
    opt.value = year;
    opt.textContent = year;
    yearFilter.appendChild(opt);
  });
}

function applyFilters() {
  const search = document.getElementById("search-box").value.toLowerCase();
  const type = document.getElementById("type-filter").value;
  const year = document.getElementById("year-filter").value;
  const sort = document.getElementById("sort-option").value;

  let filtered = allMissions.filter(m => {
    const matchName = m.name.toLowerCase().includes(search);
    const matchType = !type || m.type === type;
    const matchYear = !year || new Date(m.launch_date).getFullYear().toString() === year;
    return matchName && matchType && matchYear;
  });

  if (sort === "name") {
    filtered.sort((a, b) => a.name.localeCompare(b.name));
  } else if (sort === "launch_date") {
    filtered.sort((a, b) => new Date(b.launch_date) - new Date(a.launch_date));
  }

  renderMissions(filtered);
}

function renderMissions(missions) {
  const list = document.getElementById("mission-list");
  if (!missions.length) {
    list.innerHTML = "<p>No missions found.</p>";
    return;
  }

  list.innerHTML = missions.map(m => `
    <div class="mission-card">
      <h3>${m.name}</h3>
      <p><strong>Launch Date:</strong> ${m.launch_date}</p>
      <p><strong>Vehicle:</strong> ${m.vehicle}</p>
      <p><strong>Orbit:</strong> ${m.orbit}</p>
      <p><strong>Type:</strong> ${m.type}</p>
    </div>
  `).join("");
}
