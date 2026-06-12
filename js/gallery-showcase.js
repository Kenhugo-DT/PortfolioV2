(function () {
  const galleryStore = new Map();

  function escapeText(value = '') {
    return String(value).replace(/[&<>"']/g, char => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;'
    }[char]));
  }

  function getImages(root) {
    return galleryStore.get(root?.dataset.galleryId) || [];
  }

  function getIndex(root) {
    return Number(root?.dataset.currentIndex || 0);
  }

  function setIndex(root, nextIndex) {
    const images = getImages(root);
    if (!root || images.length === 0) return;

    const index = (nextIndex + images.length) % images.length;
    const image = images[index];
    root.dataset.currentIndex = String(index);

    root.querySelectorAll('[data-gallery-main]').forEach(img => {
      img.src = image.src;
      img.alt = image.description || root.dataset.galleryTitle || 'Gallery image';
    });

    root.querySelectorAll('[data-gallery-description]').forEach(desc => {
      desc.textContent = image.description || '';
    });

    root.querySelectorAll('[data-gallery-index]').forEach(thumb => {
      thumb.classList.toggle('is-active', Number(thumb.dataset.galleryIndex) === index);
    });

  }

  function getCurrentImage(root) {
    return getImages(root)[getIndex(root)];
  }

  function openFullscreen(root) {
    const image = getCurrentImage(root);
    if (!image) return;

    const overlay = document.createElement('div');
    overlay.className = 'portfolio-gallery-lightbox is-open';
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'true');
    overlay.setAttribute('aria-label', `${root.dataset.galleryTitle || 'Gallery'} image`);
    overlay.innerHTML = `
      <img src="${escapeText(image.src)}" alt="${escapeText(image.description || root.dataset.galleryTitle || 'Gallery image')}" data-gallery-lightbox-close>
      <div class="portfolio-gallery-fullcaption">${escapeText(image.description || '')}</div>
    `;

    document.body.appendChild(overlay);
    document.body.classList.add('gallery-modal-open');
  }

  function closeFullscreen() {
    document.querySelector('.portfolio-gallery-lightbox.is-open')?.remove();
    document.body.classList.remove('gallery-modal-open');
  }

  window.renderPortfolioGallery = function renderPortfolioGallery(project) {
    const images = project.images || [];
    const galleryId = project.id || `gallery-${Date.now()}`;
    galleryStore.set(galleryId, images);

    if (images.length === 0) {
      return '<div class="portfolio-gallery-empty">No images available</div>';
    }

    const firstImage = images[0];
    const thumbnails = images.map((image, index) => `
      <button class="portfolio-gallery-thumb ${index === 0 ? 'is-active' : ''}" type="button" data-gallery-index="${index}" aria-label="Show image ${index + 1}">
        <img src="${escapeText(image.src)}" alt="">
      </button>
    `).join('');

    return `
      <div class="portfolio-gallery" data-gallery-id="${escapeText(galleryId)}" data-current-index="0" data-gallery-title="${escapeText(project.title)}">
        <div class="portfolio-gallery-main" data-gallery-open role="button" tabindex="0" aria-label="Open image gallery">
          <img src="${escapeText(firstImage.src)}" alt="${escapeText(firstImage.description || project.title)}" data-gallery-main>
          ${images.length > 1 ? `
            <button class="portfolio-gallery-nav portfolio-gallery-prev" type="button" data-gallery-step="-1" aria-label="Previous image">&lsaquo;</button>
            <button class="portfolio-gallery-nav portfolio-gallery-next" type="button" data-gallery-step="1" aria-label="Next image">&rsaquo;</button>
          ` : ''}
        </div>
        <div class="portfolio-gallery-caption" data-gallery-description>${escapeText(firstImage.description || '')}</div>
        ${images.length > 1 ? `
          <div class="portfolio-gallery-thumbs" aria-label="Gallery thumbnails">${thumbnails}</div>
        ` : ''}
      </div>
    `;
  };

  document.addEventListener('click', event => {
    if (event.target.closest('[data-gallery-lightbox-close]')) {
      event.preventDefault();
      event.stopPropagation();
      closeFullscreen();
      return;
    }

    const root = event.target.closest('.portfolio-gallery');
    if (!root) return;

    const thumb = event.target.closest('[data-gallery-index]');
    const step = event.target.closest('[data-gallery-step]');
    const open = event.target.closest('[data-gallery-open]');

    if (thumb || step || open) {
      event.preventDefault();
      event.stopPropagation();
    }

    if (thumb) setIndex(root, Number(thumb.dataset.galleryIndex));
    else if (step) setIndex(root, getIndex(root) + Number(step.dataset.galleryStep));
    else if (open) openFullscreen(root);
  });

  document.addEventListener('keydown', event => {
    if (document.querySelector('.portfolio-gallery-lightbox.is-open')) {
      if (event.key === 'Escape') closeFullscreen();
      return;
    }

    const focusedGallery = document.activeElement?.closest?.('.portfolio-gallery');
    if (focusedGallery && (event.key === 'Enter' || event.key === ' ')) {
      event.preventDefault();
      openFullscreen(focusedGallery);
    }
  });
})();
