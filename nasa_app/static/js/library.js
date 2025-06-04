document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('search-form');
  const input = document.getElementById('search-input');
  const grid = document.getElementById('library-grid');
  const loadMoreBtn = document.getElementById('load-more-btn');
  const suggestionBox = document.getElementById('suggestion-box');

  const modal = document.getElementById('media-modal');
  const modalContent = document.getElementById('modal-content');
  const modalClose = document.getElementById('modal-close');

  let currentQuery = '';
  let currentPage = 1;

  // Fetch results from NASA API
  async function fetchResults(query, page = 1, append = false) {
    try {
      const res = await fetch(`/library/?q=${encodeURIComponent(query)}&page=${page}`, {
        headers: { 'X-Requested-With': 'XMLHttpRequest' }
      });
      const data = await res.json();

      if (!append) grid.innerHTML = '';

      if (data.items.length === 0 && !append) {
        grid.innerHTML = `<p>No results found for "${query}".</p>`;
        loadMoreBtn.style.display = 'none';
        return;
      }

      data.items.forEach(item => {
        const card = document.createElement('div');
        card.className = 'media-card';

        const img = document.createElement('img');
        img.src = item.thumb_url || 'https://via.placeholder.com/150?text=No+Image';
        img.alt = item.title;

        const title = document.createElement('p');
        title.textContent = item.title;

        card.appendChild(img);
        card.appendChild(title);

        card.addEventListener('click', () => openModal(item));
        grid.appendChild(card);
      });

      loadMoreBtn.style.display = data.items.length > 0 ? 'block' : 'none';
    } catch (err) {
      console.error('Error fetching library results:', err);
    }
  }

  // Open modal with item details
  function openModal(item) {
  modal.style.display = 'flex';

  let mediaContent = '';
  if (item.media_type === 'video' && item.video_url) {
    mediaContent = `
      <video controls autoplay style="max-width:100%; max-height:400px;">
        <source src="${item.video_url}" type="video/mp4">
        Your browser does not support the video tag.
      </video>
    `;
  } else {
    mediaContent = `<img src="${item.thumb_url}" alt="${item.title}" style="max-width:100%; max-height:400px;">`;
  }

  modalContent.innerHTML = `
    <h3>${item.title}</h3>
    ${mediaContent}
    <p>${item.description}</p>
    <p><strong>Type:</strong> ${item.media_type}</p>
    <a href="https://images.nasa.gov/details-${item.nasa_id}" target="_blank" rel="noopener noreferrer">View Full Item</a>
  `;
}



  // Close modal
  function closeModal() {
    modal.style.display = 'none';
    modalContent.innerHTML = '';
  }

  // Submit search form
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    currentQuery = input.value.trim();
    if (!currentQuery) return;
    currentPage = 1;
    fetchResults(currentQuery, currentPage, false);
    suggestionBox.style.display = 'none';
  });

  // Load more button
  loadMoreBtn.addEventListener('click', () => {
    currentPage++;
    fetchResults(currentQuery, currentPage, true);
  });

  // Close modal handlers
  modalClose.addEventListener('click', closeModal);
  modal.addEventListener('click', (e) => {
    if (e.target === modal) closeModal();
  });

  // Suggestion clicks fill input and start search
  suggestionBox.addEventListener('click', (e) => {
    if (e.target.tagName === 'A') {
      e.preventDefault();
      const suggestion = e.target.getAttribute('data-query');
      input.value = suggestion;
      currentQuery = suggestion;
      currentPage = 1;
      fetchResults(currentQuery, currentPage, false);
      suggestionBox.style.display = 'none';
    }
  });

});
