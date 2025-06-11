document.addEventListener("DOMContentLoaded", () => {
    const searchBox = document.getElementById("search-box");
    const suggestions = document.getElementById("suggestions");
    const typeSelect = document.getElementById("type-select");
    const bodySelect = document.getElementById("body-select");

    let timer = null;

    // Format the API response into an array of objects
    function formatApiResults(data) {
        if (data.bodies?.data && data.bodies?.records) {
            const keys = data.bodies.data;
            const records = data.bodies.records;
            return records.map(row => {
                const obj = {};
                keys.forEach((key, i) => obj[key] = row[i]);
                return obj;
            });
        } else if (Array.isArray(data.bodies)) {
            return data.bodies;
        }
        return [];
    }

    // Show autocomplete suggestions
    function showSuggestions(list) {
    suggestions.innerHTML = "";
    if (list.length === 0) {
        suggestions.style.display = "none";
        return;
    }

    list.slice(0, 8).forEach(item => {
        const div = document.createElement("div");
        div.textContent = `${item.englishName} (${item.id})`;
        div.classList.add("suggestion");
        div.addEventListener("click", () => {
            searchBox.value = item.id;
            suggestions.innerHTML = "";
            suggestions.style.display = "none";
        });
        suggestions.appendChild(div);
    });

    suggestions.style.display = "block";
}


    // Fetch and display autocomplete matches
    async function fetchSuggestions(type, query) {
        const filter = type ? `&filter[]=bodyType,eq,${type}` : '';
        const url = `https://api.le-systeme-solaire.net/rest/bodies/?data=id,englishName${filter}&page=1,100&rowData=true`;

        try {
            const res = await fetch(url);
            const data = await res.json();
            const formatted = formatApiResults(data);

            const matches = formatted.filter(b =>
                b.englishName?.toLowerCase().includes(query.toLowerCase()) ||
                b.id?.toLowerCase().includes(query.toLowerCase())
            );

            showSuggestions(matches);
        } catch (err) {
            console.error("Autocomplete fetch failed:", err);
        }
    }

    // Fetch and populate the body dropdown
    async function fetchCategoryList(type) {
        bodySelect.innerHTML = `<option value="">-- Select a body --</option>`;
        if (!type) return;

        const url = `https://api.le-systeme-solaire.net/rest/bodies/?data=id,englishName&filter[]=bodyType,eq,${type}&page=1,100&rowData=true`;

        try {
            const res = await fetch(url);
            const data = await res.json();
            const formatted = formatApiResults(data);

            formatted.sort((a, b) => (a.englishName > b.englishName ? 1 : -1));
            formatted.forEach(item => {
                const opt = document.createElement("option");
                opt.value = item.id;
                opt.textContent = `${item.englishName} (${item.id})`;
                bodySelect.appendChild(opt);
            });
        } catch (err) {
            console.error("Dropdown fetch failed:", err);
        }
    }

    // === Event Listeners ===

    // Autocomplete typing handler
    searchBox.addEventListener("input", () => {
        const val = searchBox.value.trim();
        const selectedType = typeSelect.value;

        clearTimeout(timer);
        if (val.length < 2) {
            suggestions.innerHTML = "";
            return;
        }

        timer = setTimeout(() => {
            fetchSuggestions(selectedType, val);
        }, 300);
    });

    // Category dropdown selection → update list
    typeSelect.addEventListener("change", () => {
        const selectedType = typeSelect.value;
        fetchCategoryList(selectedType);
    });

    // Body dropdown selection → autofill search
    bodySelect.addEventListener("change", function () {
        if (this.value) {
            searchBox.value = this.value;
            suggestions.innerHTML = "";
        }
    });

    // On load, trigger default dropdown
    if (typeSelect.value) {
        fetchCategoryList(typeSelect.value);
    }
});
