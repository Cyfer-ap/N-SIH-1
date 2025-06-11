document.addEventListener("DOMContentLoaded", function () {
    const loader = document.getElementById("loading-indicator");
    const treeContainer = document.getElementById("hierarchy-tree");
    const zoomGroup = document.getElementById("zoom-controls");

    loader.style.display = "block";

    fetch("/solar/get-hierarchy/")
        .then(res => res.json())
        .then(data => {
            loader.style.display = "none";
            zoomGroup.style.display = "flex";
            renderCollapsibleTree(data);
            populateTable(flattenHierarchy(data));
        })
        .catch(error => {
            loader.innerText = "❌ Failed to load data";
            console.error("Fetch error:", error);
        });

    document.getElementById("toggle-table").addEventListener("click", function () {
        const table = document.getElementById("data-table");
        const isHidden = table.classList.contains("hidden");
        this.textContent = isHidden ? "🔽 Hide Tabular Data" : "📋 Show Tabular Data";
        table.classList.toggle("hidden");
    });
});

function renderCollapsibleTree(data) {
    const container = document.getElementById("hierarchy-tree");
    const width = container.offsetWidth;
    const height = 700;
    let i = 0;

    const svg = d3.select("#hierarchy-tree")
        .append("svg")
        .attr("width", width)
        .attr("height", height);

    const g = svg.append("g").attr("transform", "translate(100,40)");

    const zoom = d3.zoom()
        .scaleExtent([0.3, 3])
        .on("zoom", (event) => g.attr("transform", event.transform));

    svg.call(zoom);

    const root = d3.hierarchy(data);
    const treeLayout = d3.tree().size([height - 80, width - 250]);

    root.x0 = height / 2;
    root.y0 = 0;
    root.children.forEach(collapse);

    update(root);

    function collapse(d) {
        if (d.children) {
            d._children = d.children;
            d._children.forEach(collapse);
            d.children = null;
        }
    }

    function update(source) {
        const treeData = treeLayout(root);
        const nodes = treeData.descendants();
        const links = treeData.links();

        nodes.forEach(d => d.y = d.depth * 140);

        const node = g.selectAll("g.node")
            .data(nodes, d => d.id || (d.id = ++i));

        const nodeEnter = node.enter().append("g")
            .attr("class", "node")
            .attr("transform", d => `translate(${source.y0},${source.x0})`)
            .on("click", function (event, d) {
                if (d.children) {
                    d._children = d.children;
                    d.children = null;
                } else {
                    d.children = d._children;
                    d._children = null;
                }
                update(d);
            });

        nodeEnter.append("circle")
            .attr("r", 6)
            .style("fill", d => d._children ? "#69b3a2" : "#4e79a7");

        nodeEnter.append("text")
            .attr("dy", "0.35em")
            .attr("x", d => d._children ? -10 : 10)
            .attr("text-anchor", d => d._children ? "end" : "start")
            .text(d => d.data.name);

        const nodeUpdate = nodeEnter.merge(node);
        nodeUpdate.transition().duration(500)
            .attr("transform", d => `translate(${d.y},${d.x})`);

        node.exit().transition().remove();

        const link = g.selectAll("path.link")
            .data(links, d => d.target.id);

        const linkEnter = link.enter().insert("path", "g")
            .attr("class", "link")
            .attr("d", d => {
                const o = { x: source.x0, y: source.y0 };
                return diagonal(o, o);
            });

        linkEnter.merge(link).transition().duration(500)
            .attr("d", d => diagonal(d.source, d.target));

        link.exit().transition().remove();

        nodes.forEach(d => {
            d.x0 = d.x;
            d.y0 = d.y;
        });
    }

    function diagonal(s, d) {
        return `M ${s.y},${s.x}
                C ${(s.y + d.y) / 2},${s.x},
                  ${(s.y + d.y) / 2},${d.x},
                  ${d.y},${d.x}`;
    }

    document.getElementById("zoom-in").onclick = () => svg.transition().call(zoom.scaleBy, 1.2);
    document.getElementById("zoom-out").onclick = () => svg.transition().call(zoom.scaleBy, 0.8);
    document.getElementById("reset").onclick = () => svg.transition().duration(500).call(
        zoom.transform, d3.zoomIdentity.translate(100, 40).scale(1)
    );
}

function flattenHierarchy(data, parent = "") {
    const result = [{ type: parent ? "Moon" : "Planet", name: data.name, parent: parent }];
    if (data.children) {
        for (const child of data.children) {
            result.push(...flattenHierarchy(child, data.name));
        }
    }
    return result;
}

function populateTable(flat) {
    const tbody = document.getElementById("table-body");
    tbody.innerHTML = "";
    flat.forEach(row => {
        tbody.insertAdjacentHTML("beforeend",
            `<tr><td>${row.type}</td><td>${row.name}</td><td>${row.parent}</td></tr>`);
    });
}
