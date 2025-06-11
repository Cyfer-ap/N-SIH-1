// mars.js

document.addEventListener('DOMContentLoaded', () => {
  const photosGrid = document.getElementById('photos-grid');
  const loadMoreBtn = document.getElementById('load-more-btn');
  const modal = document.getElementById('photo-modal');
  const modalImg = document.getElementById('modal-img');
  const modalCaption = document.getElementById('modal-caption');
  const modalClose = document.getElementById('modal-close');

  // Parameters for pagination and filtering
  let currentPage = 1;
  const photosPerPage = 21;  // 3x7 grid initially
  let isLoading = false;

  // Get initial filter values from form
  const filterForm = document.getElementById('filter-form');
  const dateInput = document.getElementById('date');
  const roverSelect = document.getElementById('rover');

  let currentDate = dateInput.value;
  let currentRover = roverSelect.value;

  // Rover date ranges
  const roverDateRanges = {
    curiosity: {
      min: '2012-08-06',
      max: new Date().toISOString().split('T')[0] // today
    },
    opportunity: {
      min: '2004-01-25',
      max: '2018-06-10'
    },
    spirit: {
      min: '2004-01-04',
      max: '2010-03-22'
    }
  };

  // Update date input min and max based on rover
  function updateDateRange(rover) {
    const range = roverDateRanges[rover];
    if (!range) return;

    dateInput.min = range.min;
    dateInput.max = range.max;

    // If current date is outside range, reset to min date
    if (dateInput.value < range.min || dateInput.value > range.max) {
      dateInput.value = range.min;
      currentDate = range.min;
    }
  }

  // Initialize date input limits on page load
  updateDateRange(currentRover);

  // Update date limits on rover change
  roverSelect.addEventListener('change', () => {
    currentRover = roverSelect.value;
    updateDateRange(currentRover);
  });

  // Show Load More button only if there are photos initially
  if (photosGrid.children.length > 0) {
    loadMoreBtn.style.display = 'block';
  }

  // Helper to fetch photos from backend with AJAX
  async function fetchPhotos(page, append = true) {
    if (isLoading) return;
    isLoading = true;
    loadMoreBtn.textContent = 'Loading...';

    try {
      const url = new URL(window.location.href);
      url.searchParams.set('date', currentDate);
      url.searchParams.set('rover', currentRover);
      url.searchParams.set('page', page);

      const response = await fetch(url.toString(), {
        headers: { 'X-Requested-With': 'XMLHttpRequest' }
      });

      if (!response.ok) throw new Error('Network response was not OK');

      const data = await response.json();

      if (data.photos && data.photos.length > 0) {
        if (!append) photosGrid.innerHTML = ''; // clear for new filter

        for (const photo of data.photos) {
          const card = createPhotoCard(photo);
          photosGrid.appendChild(card);
        }

        loadMoreBtn.style.display = data.has_more ? 'block' : 'none';
      } else {
        if (!append) {
          photosGrid.innerHTML = '<p id="no-photos-msg">No photos available for this date and rover.</p>';
          loadMoreBtn.style.display = 'none';
        }
      }
    } catch (error) {
      console.error('Error fetching photos:', error);
      if (!append) {
        photosGrid.innerHTML = '<p id="no-photos-msg">Failed to load photos.</p>';
      }
      loadMoreBtn.style.display = 'none';
    } finally {
      isLoading = false;
      loadMoreBtn.textContent = 'Load More';
    }
  }

  // Create photo card DOM element
  function createPhotoCard(photo) {
    const card = document.createElement('div');
    card.className = 'photo-card';

    const img = document.createElement('img');
    img.src = photo.img_src;
    img.alt = 'Mars Photo';
    img.setAttribute('data-photo-id', photo.id);
    img.dataset.camera = photo.camera.full_name;

    card.appendChild(img);

    const p = document.createElement('p');
    p.innerHTML = `<strong>Camera:</strong> ${photo.camera.full_name}`;
    card.appendChild(p);

    // Open modal on click
    img.addEventListener('click', () => openModal(photo));

    return card;
  }

  // Open modal and show large image + caption
  function openModal(photo) {
    modal.style.display = 'flex';
    modalImg.src = photo.img_src;
    modalCaption.textContent = `Camera: ${photo.camera.full_name} | Earth Date: ${photo.earth_date}`;
  }

  // Close modal function
  function closeModal() {
    modal.style.display = 'none';
    modalImg.src = '';
    modalCaption.textContent = '';
  }

  // Event listeners for modal close
  modalClose.addEventListener('click', closeModal);
  modal.addEventListener('click', (e) => {
    if (e.target === modal) closeModal();
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeModal();
  });

  // Load more button click handler
  loadMoreBtn.addEventListener('click', () => {
    currentPage++;
    fetchPhotos(currentPage, true);
  });

  // Filter form submit handler - reload photos
  filterForm.addEventListener('submit', (e) => {
    e.preventDefault();

    currentDate = dateInput.value;
    currentRover = roverSelect.value;
    currentPage = 1;

    fetchPhotos(currentPage, false);
  });
});
