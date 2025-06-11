document.addEventListener("DOMContentLoaded", function () {
    const typeSelect = document.getElementById("type-select");
    const resultsDiv = document.getElementById("results");

    const filters = {
        gravity: document.getElementById("gravity-filter"),
        mass: document.getElementById("mass-filter"),
        radius: document.getElementById("radius-filter"),
        density: document.getElementById("density-filter"),
        escape: document.getElementById("escape-filter"),
        orbit: document.getElementById("orbit-filter"),
        discovery: document.getElementById("discovery-filter"),
    };

    const applyBtn = document.getElementById("apply-filters");
    const resetBtn = document.getElementById("reset-filters");
    const sortSelect = document.getElementById("sort-by");
    const downloadBtn = document.getElementById("download-csv");

    let allBodies = [];
    let lastFiltered = [];

    typeSelect.addEventListener("change", () => {
        const selectedType = typeSelect.value;
        resultsDiv.innerHTML = "";

        if (!selectedType) return;

        fetch(`/solar/ajax/celestial-by-type/?type=${selectedType}`)
            .then(res => res.json())
            .then(data => {
                if (data.error) {
                    resultsDiv.innerHTML = `<p class="error">Error: ${data.error}</p>`;
                    return;
                }

                allBodies = data.bodies;
                lastFiltered = allBodies;
                renderBodies(allBodies);
            });
    });

    applyBtn.addEventListener("click", () => {
        const filtered = allBodies.filter(body => {
            const g = parseFloat(body.gravity || 0);
            const m = body.mass ? body.mass.massValue * Math.pow(10, body.mass.massExponent) : 0;
            const r = parseFloat(body.meanRadius || 0);
            const d = parseFloat(body.density || 0);
            const e = parseFloat(body.escape || 0);
            const o = parseFloat(body.semimajorAxis || 0);
            const discoveryYear = body.discoveryDate ? parseInt(body.discoveryDate.split("-")[0]) : null;

            return matchRange(filters.gravity.value, g, {
                lt1: [null, 1],
                "1to5": [1, 5],
                "5to15": [5, 15],
                gt15: [15, null]
            }) &&
            matchRange(filters.mass.value, m, {
                lt22: [null, 1e22],
                "22to24": [1e22, 1e24],
                "24to26": [1e24, 1e26],
                gt26: [1e26, null]
            }) &&
            matchRange(filters.radius.value, r, {
                lt1000: [null, 1000],
                "1000to5000": [1000, 5000],
                gt5000: [5000, null]
            }) &&
            matchRange(filters.density.value, d, {
                lt1: [null, 1],
                "1to3": [1, 3],
                "3to6": [3, 6],
                gt6: [6, null]
            }) &&
            matchRange(filters.escape.value, e, {
                lt3000: [null, 3000],
                "3000to7000": [3000, 7000],
                gt7000: [7000, null]
            }) &&
            matchRange(filters.orbit.value, o, {
                lt100k: [null, 1e5],
                "100kto1m": [1e5, 1e6],
                gt1m: [1e6, null]
            }) &&
            matchRange(filters.discovery.value, discoveryYear, {
                lt1900: [null, 1900],
                "1900to1950": [1900, 1950],
                "1950to2000": [1950, 2000],
                gt2000: [2000, null]
            });
        });

        // sorting
        const sortKey = sortSelect.value;
        if (sortKey) {
            const [field, order] = sortKey.split("-");
            filtered.sort((a, b) => {
                const valA = extractSortValue(a, field);
                const valB = extractSortValue(b, field);
                return order === "asc" ? valA - valB : valB - valA;
            });
        }

        lastFiltered = filtered;
        renderBodies(filtered);
    });

    resetBtn.addEventListener("click", () => {
        Object.values(filters).forEach(select => select.value = "");
        sortSelect.value = "";
        renderBodies(allBodies);
        lastFiltered = allBodies;
    });

    downloadBtn.addEventListener("click", () => {
        const csvRows = [
            [
                "Name", "Type", "Gravity", "Mass", "Radius",
                "Density", "EscapeVelocity", "OrbitSemiMajorAxis", "DiscoveryDate", "DiscoveredBy"
            ].join(",")
        ];

        lastFiltered.forEach(body => {
            const massStr = body.mass ? `${body.mass.massValue}e${body.mass.massExponent}` : '';
            csvRows.push([
                body.englishName || "",
                body.bodyType || "",
                body.gravity || "",
                massStr,
                body.meanRadius || "",
                body.density || "",
                body.escape || "",
                body.semimajorAxis || "",
                body.discoveryDate || "",
                body.discoveredBy || ""
            ].join(","));
        });

        const blob = new Blob([csvRows.join("\n")], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = "celestial_bodies_filtered.csv";
        link.click();
        URL.revokeObjectURL(url);
    });

    function matchRange(key, val, ranges) {
        if (!key || !ranges[key]) return true;
        const [min, max] = ranges[key];
        return (min === null || val >= min) && (max === null || val <= max);
    }

    function extractSortValue(body, key) {
        switch (key) {
            case "mass":
                return body.mass ? body.mass.massValue * Math.pow(10, body.mass.massExponent) : 0;
            case "gravity":
                return parseFloat(body.gravity || 0);
            case "radius":
                return parseFloat(body.meanRadius || 0);
            case "density":
                return parseFloat(body.density || 0);
            case "escape":
                return parseFloat(body.escape || 0);
            case "orbit":
                return parseFloat(body.semimajorAxis || 0);
            case "discovery":
                return body.discoveryDate ? parseInt(body.discoveryDate.split("-")[0]) : 0;
            default:
                return 0;
        }
    }

    function renderBodies(bodies) {
        if (!bodies.length) {
            resultsDiv.innerHTML = "<p>No celestial bodies match the selected filters.</p>";
            return;
        }

        resultsDiv.innerHTML = bodies.map(body => `
            <div class="body-card">
                <h3>${body.englishName || "Unnamed"}</h3>
                <p><strong>Type:</strong> ${body.bodyType}</p>
                <p><strong>Gravity:</strong> ${body.gravity ?? 'N/A'} m/s²</p>
                <p><strong>Mass:</strong> ${
                    body.mass ? `${body.mass.massValue} ×10^${body.mass.massExponent}` : 'N/A'
                } kg</p>
                <p><strong>Radius:</strong> ${body.meanRadius ?? 'N/A'} km</p>
                <p><strong>Density:</strong> ${body.density ?? 'N/A'} g/cm³</p>
                <p><strong>Escape Velocity:</strong> ${body.escape ?? 'N/A'} m/s</p>
                <p><strong>Orbit (Semi-Major Axis):</strong> ${body.semimajorAxis ?? 'N/A'} km</p>
                <p><strong>Discovery Date:</strong> ${body.discoveryDate || 'N/A'}</p>
                <p><strong>Discovered By:</strong> ${body.discoveredBy || 'N/A'}</p>
            </div>
        `).join('');
    }
});
