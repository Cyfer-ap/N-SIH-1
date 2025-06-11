document.addEventListener("DOMContentLoaded", function () {
    const loading = document.getElementById("loading");

    fetch("/solar/get-sunburst-hierarchy/")
        .then(res => res.json())
        .then(data => {
            loading.style.display = "none";

            const chartData = [{
                type: "sunburst",
                labels: data.labels,
                parents: data.parents,
                hovertext: data.hovertexts,
                hoverinfo: "text",
                outsidetextfont: { size: 14, color: "#333" },
                leaf: { opacity: 0.8 },
                marker: { line: { width: 1 } },
            }];

            const layout = {
                margin: { l: 0, r: 0, b: 0, t: 10 },
                sunburstcolorway: ["#4e79a7", "#f28e2b", "#e15759", "#76b7b2", "#59a14f", "#edc949"],
                extendsunburstcolorway: true
            };

            Plotly.newPlot("sunburst-chart", chartData, layout, { responsive: true });

            populateTable(data.labels, data.parents);
        })
        .catch(err => {
            loading.innerText = "❌ Failed to load chart.";
            console.error(err);
        });

    document.getElementById("toggle-table").addEventListener("click", function () {
        const table = document.getElementById("data-table");
        const isHidden = table.classList.contains("hidden");
        this.textContent = isHidden ? "🔽 Hide Tabular Data" : "📋 Show Tabular Data";
        table.classList.toggle("hidden");
    });

    function populateTable(labels, parents) {
        const tableBody = document.getElementById("table-body");
        tableBody.innerHTML = "";

        labels.forEach((label, index) => {
            if (label === "Sun") return;
            const type = parents[index] === "Sun" ? "Planet" : "Moon";
            const parent = parents[index];
            const row = `<tr><td>${type}</td><td>${label}</td><td>${parent}</td></tr>`;
            tableBody.insertAdjacentHTML("beforeend", row);
        });
    }
});
