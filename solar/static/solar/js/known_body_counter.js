window.addEventListener("load", function () {
    const cards = document.querySelectorAll(".card");

    cards.forEach(card => {
        let page = 1;
        let loading = false;

        card.addEventListener("click", async function () {
            const type = this.dataset.type;
            const container = document.getElementById(`details-${type}`);

            if (container.dataset.expanded === "true") {
                container.innerHTML = "";
                container.dataset.expanded = "false";
                page = 1;
                return;
            }

            container.innerHTML = "<p>Loading...</p>";
            container.dataset.expanded = "true";
            await fetchAndRender(type, container, page);
        });

        async function fetchAndRender(type, container, pageNumber) {
            if (loading) return;
            loading = true;

            try {
                const response = await fetch(`/solar/api/get-bodies/?type=${type}&page=${pageNumber}`);
                const result = await response.json();

                if (result.error) {
                    container.innerHTML = `<p class="error">${result.error}</p>`;
                } else {
                    const list = container.querySelector("ul.body-list") || document.createElement("ul");
                    list.classList.add("body-list");

                    result.bodies.forEach(b => {
                        const item = document.createElement("li");
                        item.innerHTML = `<a href="/solar/body-profile/?id=${b.id}" target="_blank">${b.englishName || b.id}</a>`;
                        list.appendChild(item);
                    });

                    if (!container.querySelector("ul.body-list")) {
                        container.innerHTML = "";
                        container.appendChild(list);
                    }

                    if (result.has_more) {
                        let btn = container.querySelector(".load-more");
                        if (!btn) {
                            btn = document.createElement("button");
                            btn.className = "load-more";
                            btn.textContent = "Load More";
                            btn.addEventListener("click", async () => {
                                page++;
                                await fetchAndRender(type, container, page);
                            });
                            container.appendChild(btn);
                        }
                    } else {
                        const btn = container.querySelector(".load-more");
                        if (btn) btn.remove();
                    }
                }
            } catch (err) {
                container.innerHTML = `<p class="error">Request failed.</p>`;
            }

            loading = false;
        }
    });
});
