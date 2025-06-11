document.addEventListener("DOMContentLoaded", () => {
    const container = document.getElementById("orbit-map");
    const select = document.getElementById("body-type-select");
    const zoomBtns = {
        inner: document.getElementById("zoom-inner"),
        outer: document.getElementById("zoom-outer"),
        full: document.getElementById("zoom-full")
    };
    const animateBtn = document.getElementById("toggle-animation");

    let allBodies = [];
    let zoomMode = "full";
    let animate = false;
    let lastType = "planet";

    fetch("https://api.le-systeme-solaire.net/rest/bodies/")
        .then(r => r.json())
        .then(data => {
            console.log("Fetched bodies:", data.bodies.length);
            allBodies = data.bodies;
            renderOrbits(lastType);
        })
        .catch(err => {
            console.error("Fetch failed", err);
            container.innerText = "Failed to load data";
        });

    select.addEventListener("change", () => {
        lastType = select.value;
        renderOrbits(lastType);
    });

    Object.entries(zoomBtns).forEach(([mode, btn]) => {
        btn.addEventListener("click", () => {
            zoomMode = mode;
            renderOrbits(lastType);
        });
    });

    animateBtn.addEventListener("click", () => {
        animate = !animate;
        renderOrbits(lastType);
    });

    function renderOrbits(type) {
        container.innerHTML = "";
        const filtered = allBodies.filter(b => {
            const a = b.semimajorAxis, e = b.eccentricity;
            if (!a || e == null) return false;
            const bt = (b.bodyType || "").toLowerCase();
            if (type === "planet" && !b.isPlanet) return false;
            if (type === "moon" && !bt.includes("moon")) return false;
            if (type === "comet" && !bt.includes("comet")) return false;
            return true;
        });

        if (!filtered.length) {
            container.innerHTML = "<p style='color:white'>No orbit data found.</p>";
            return;
        }

        const colorPalette = ['#ff6f61', '#6b5b95', '#88b04b', '#f7cac9', '#92a8d1', '#955251', '#b565a7', '#009b77', '#dd4124', '#45b8ac'];
        const traces = [];
        const bodyMarkers = [];
        const frames = [];

        const steps = 100;
        const thetaFrames = Array.from({ length: steps }, (_, i) => i * (2 * Math.PI / steps));

        filtered.forEach((body, index) => {
            const a = body.semimajorAxis;
            const e = body.eccentricity;
            const b = a * Math.sqrt(1 - e ** 2);
            const offsetX = -a * e;
            const name = body.englishName || body.id;
            const color = colorPalette[index % colorPalette.length];

            // Orbit path
            const theta = Array.from({ length: 360 }, (_, i) => i * Math.PI / 180);
            const xOrbit = theta.map(t => a * Math.cos(t) + offsetX);
            const yOrbit = theta.map(t => b * Math.sin(t));

            traces.push({
                x: xOrbit,
                y: yOrbit,
                mode: 'lines',
                name: name,
                hoverinfo: 'name+text',
                text: `a: ${a.toLocaleString()} km<br>e: ${e}`,
                line: { color: color, width: 2 }
            });

            // Initial marker for frame 0
            const initTheta = thetaFrames[0];
            const x = a * Math.cos(initTheta) + offsetX;
            const y = b * Math.sin(initTheta);

            bodyMarkers.push({
                x: [x],
                y: [y],
                mode: 'markers',
                name: `${name} Position`,
                marker: { size: 6, color: color },
                showlegend: false,
                hoverinfo: 'none'
            });

            // Frames for animation
            thetaFrames.forEach((thetaT, fIndex) => {
                const x = a * Math.cos(thetaT) + offsetX;
                const y = b * Math.sin(thetaT);
                if (!frames[fIndex]) frames[fIndex] = { data: [], name: fIndex };
                frames[fIndex].data.push({
                    x: [x],
                    y: [y],
                    mode: 'markers',
                    marker: { size: 6, color: color },
                    showlegend: false
                });
            });
        });

        // Add the Sun
        traces.unshift({
            x: [0], y: [0],
            mode: 'markers+text',
            name: 'Sun',
            marker: { size: 12, color: 'orange' },
            text: ['☀️'],
            textposition: 'top center'
        });

        const zoomRange = {
            inner: 1e8,
            outer: 8e9,
            full: 2e10
        };

        const layout = {
            title: '2D Orbit Viewer',
            xaxis: { title: 'X (km)', range: [-zoomRange[zoomMode], zoomRange[zoomMode]], showgrid: true },
            yaxis: { title: 'Y (km)', range: [-zoomRange[zoomMode], zoomRange[zoomMode]], showgrid: true },
            showlegend: true,
            margin: { t: 40 },
            updatemenus: [] // ❌ No Play Button
        };

        // Plot base + initial markers
        Plotly.newPlot('orbit-map', [...traces, ...bodyMarkers], layout, { responsive: true });

        // 🌀 Animate instantly (if enabled)
        if (animate) {
            Plotly.addFrames('orbit-map', frames);
            Plotly.animate('orbit-map', frames.map(f => f.name), {
                frame: { duration: 50, redraw: true },
                transition: { duration: 0 },
                mode: 'immediate'
            });
        }
    }
});
