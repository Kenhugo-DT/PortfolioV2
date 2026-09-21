document.addEventListener('DOMContentLoaded', () => {
  const track = document.querySelector('.panel-track');
  const panels = Array.from(document.querySelectorAll('.portfolio-panel'));
  const navFlags = Array.from(document.querySelectorAll('.nav-flag'));
  let navMap;
  let navMapNodes = [];

  let currentX = 0;
  let currentY = 0;

  const contentMap = window.portfolioProjects;
  const hydratedShowcases = new Set();

  const currentProjectIndex = {
    webdev: Math.max(0, contentMap.webdev.findIndex(project => project.featured)),
    creativity: Math.max(0, contentMap.creativity.findIndex(project => project.featured))
  };

  function init() {
    renderWheel('webdev');
    renderWheel('creativity');
    initNavigationMap();
    updateNavigation(0, 0, false);
  }

  function getPanel(x, y) {
    return panels.find(p => parseInt(p.dataset.x) === x && parseInt(p.dataset.y) === y);
  }

  function updateNavigation(x, y, animate = true) {
    const targetPanel = getPanel(x, y);
    const targetColumn = document.querySelector(`.panel-column[data-x="${x}"]`);
    if (!targetPanel || !targetColumn) return;
    const previousPanel = getPanel(currentX, currentY);
    if (previousPanel && previousPanel !== targetPanel) {
      previousPanel.dispatchEvent(new CustomEvent('panel:leaving', { bubbles: true }));
      targetPanel.dispatchEvent(new CustomEvent('panel:entering', { bubbles: true }));
    }
    currentX = x; currentY = y;
    const offsetX = -targetColumn.offsetLeft, offsetY = -targetPanel.offsetTop;
    if (window.gsap && animate) {
      gsap.to(track, { x: offsetX, y: offsetY, duration: 0.8, ease: 'power3.inOut' });
    } else if (window.gsap) {
      gsap.set(track, { x: offsetX, y: offsetY });
    } else {
      track.style.transform = `translate(${offsetX}px, ${offsetY}px)`;
    }
    panels.forEach(p => p.classList.toggle('active', parseInt(p.dataset.x) === x && parseInt(p.dataset.y) === y));
    if (contentMap[targetPanel.dataset.site]) {
      ensureShowcase(targetPanel.dataset.site, animate);
    }
    if (targetPanel.classList.contains('panel-about') || window.matchMedia('(max-width: 760px)').matches) {
      window.requestAnimationFrame(() => targetPanel.scrollTo({ top: 0, behavior: 'auto' }));
    }
    updateNavigationMap(x, y, animate);
  }

  function isShowcaseReady(site) {
    return hydratedShowcases.has(site) || panels.some(panel => panel.dataset.site === site && panel.classList.contains('active'));
  }

  function ensureShowcase(site, emitMotion = false) {
    if (!contentMap[site]) return;
    hydratedShowcases.add(site);
    updateShowcase(site, emitMotion);
  }

  function initNavigationMap() {
    const shell = document.getElementById('portfolio-shell');
    if (!shell || !panels.length) return;

    const coords = panels.map(panel => ({
      panel,
      x: parseInt(panel.dataset.x, 10),
      y: parseInt(panel.dataset.y, 10),
      site: panel.dataset.site || 'panel'
    }));
    const minX = Math.min(...coords.map(point => point.x));
    const maxX = Math.max(...coords.map(point => point.x));
    const minY = Math.min(...coords.map(point => point.y));
    const maxY = Math.max(...coords.map(point => point.y));
    const cols = maxX - minX + 1;
    const rows = maxY - minY + 1;

    navMap = document.createElement('nav');
    navMap.className = 'layout-map';
    navMap.setAttribute('aria-label', 'Layout map');
    navMap.style.setProperty('--map-cols', cols);
    navMap.style.setProperty('--map-rows', rows);

    const title = document.createElement('span');
    title.className = 'layout-map-title';
    title.textContent = 'Map';
    navMap.appendChild(title);

    const grid = document.createElement('div');
    grid.className = 'layout-map-grid';

    navMapNodes = coords.map(({ panel, x, y, site }) => {
      const button = document.createElement('button');
      const heading = panel.querySelector('h2, h3');
      const label = heading ? heading.textContent.trim() : site;
      button.className = `layout-map-node map-node-${site}`;
      button.type = 'button';
      button.dataset.x = String(x);
      button.dataset.y = String(y);
      button.style.gridColumn = String(x - minX + 1);
      button.style.gridRow = String(y - minY + 1);
      button.setAttribute('aria-label', `Go to ${label}`);
      button.innerHTML = `<span class="layout-map-node-dot"></span><span class="layout-map-node-label">${site}</span>`;
      button.addEventListener('click', event => {
        event.preventDefault();
        updateNavigation(x, y);
      });
      grid.appendChild(button);
      return button;
    });

    navMap.appendChild(grid);
    shell.appendChild(navMap);
    initDraggableNavigationMap();
  }

  function initDraggableNavigationMap() {
    if (!navMap) return;

    const storageKey = 'ken-layout-map-position';
    const dragState = {
      pointerId: null,
      startX: 0,
      startY: 0,
      mapX: 0,
      mapY: 0,
      clickNode: null,
      dragging: false,
      suppressClick: false
    };

    function clamp(value, min, max) {
      return Math.min(max, Math.max(min, value));
    }

    function applyPosition(x, y) {
      const rect = navMap.getBoundingClientRect();
      const maxX = window.innerWidth - rect.width - 8;
      const maxY = window.innerHeight - rect.height - 8;
      const nextX = clamp(x, 8, Math.max(8, maxX));
      const nextY = clamp(y, 8, Math.max(8, maxY));

      navMap.style.left = `${nextX}px`;
      navMap.style.top = `${nextY}px`;
      navMap.style.right = 'auto';
      navMap.style.bottom = 'auto';
    }

    function restorePosition() {
      try {
        const saved = JSON.parse(localStorage.getItem(storageKey));
        if (saved && Number.isFinite(saved.x) && Number.isFinite(saved.y)) {
          applyPosition(saved.x, saved.y);
        }
      } catch (_) {
        try {
          localStorage.removeItem(storageKey);
        } catch (_) {}
      }
    }

    function savePosition() {
      const rect = navMap.getBoundingClientRect();
      try {
        localStorage.setItem(storageKey, JSON.stringify({ x: rect.left, y: rect.top }));
      } catch (_) {}
    }

    function isReadableContent(element) {
      if (!element || navMap.contains(element)) return false;
      if (element.closest('.layout-map, header#header')) return false;
      return Boolean(element.closest('p, h1, h2, h3, li, a, button, .about-copy, .funfact-list, .music-player, .showcase-details, .project-description-box, .center-copy'));
    }

    function isReadableContentUnderMap() {
      const rect = navMap.getBoundingClientRect();
      const samplePoints = [
        [rect.left + rect.width * 0.5, rect.top + rect.height * 0.5],
        [rect.left + rect.width * 0.18, rect.top + rect.height * 0.18],
        [rect.left + rect.width * 0.82, rect.top + rect.height * 0.18],
        [rect.left + rect.width * 0.18, rect.top + rect.height * 0.82],
        [rect.left + rect.width * 0.82, rect.top + rect.height * 0.82],
        [rect.left + rect.width * 0.5, rect.top + rect.height * 0.18],
        [rect.left + rect.width * 0.5, rect.top + rect.height * 0.82]
      ];

      navMap.style.pointerEvents = 'none';
      const hasReadableContent = samplePoints.some(([x, y]) => {
        if (x < 0 || y < 0 || x > window.innerWidth || y > window.innerHeight) return false;
        return document.elementsFromPoint(x, y).some(isReadableContent);
      });
      navMap.style.pointerEvents = '';

      return hasReadableContent;
    }

    restorePosition();

    navMap.addEventListener('pointerdown', event => {
      if (event.button !== 0) return;
      const rect = navMap.getBoundingClientRect();
      dragState.pointerId = event.pointerId;
      dragState.startX = event.clientX;
      dragState.startY = event.clientY;
      dragState.mapX = rect.left;
      dragState.mapY = rect.top;
      dragState.clickNode = event.target.closest('.layout-map-node');
      dragState.dragging = false;
      dragState.suppressClick = false;
      navMap.setPointerCapture(event.pointerId);
    });

    navMap.addEventListener('pointermove', event => {
      if (dragState.pointerId !== event.pointerId) return;
      const dx = event.clientX - dragState.startX;
      const dy = event.clientY - dragState.startY;

      if (!dragState.dragging && Math.hypot(dx, dy) > 6) {
        dragState.dragging = true;
        dragState.suppressClick = true;
        navMap.classList.add('is-dragging');
      }

      if (!dragState.dragging) return;
      event.preventDefault();
      applyPosition(dragState.mapX + dx, dragState.mapY + dy);
      navMap.classList.toggle('is-over-text', isReadableContentUnderMap());
    });

    navMap.addEventListener('pointerup', event => {
      if (dragState.pointerId !== event.pointerId) return;
      if (dragState.dragging) savePosition();
      if (!dragState.dragging && dragState.clickNode) {
        const x = Number(dragState.clickNode.dataset.x);
        const y = Number(dragState.clickNode.dataset.y);
        if (Number.isFinite(x) && Number.isFinite(y)) updateNavigation(x, y);
        dragState.suppressClick = true;
      }
      navMap.classList.remove('is-dragging', 'is-over-text');
      if (navMap.hasPointerCapture(event.pointerId)) navMap.releasePointerCapture(event.pointerId);
      dragState.pointerId = null;
      dragState.clickNode = null;
      dragState.dragging = false;
    });

    navMap.addEventListener('pointercancel', event => {
      navMap.classList.remove('is-dragging', 'is-over-text');
      if (navMap.hasPointerCapture(event.pointerId)) navMap.releasePointerCapture(event.pointerId);
      dragState.pointerId = null;
      dragState.clickNode = null;
      dragState.dragging = false;
    });

    navMap.addEventListener('click', event => {
      if (!dragState.suppressClick) return;
      event.preventDefault();
      event.stopPropagation();
      dragState.suppressClick = false;
    }, true);

    window.addEventListener('resize', () => {
      const rect = navMap.getBoundingClientRect();
      applyPosition(rect.left, rect.top);
      savePosition();
    });
  }

  function updateNavigationMap(x, y, animate = true) {
    if (!navMap) return;
    navMapNodes.forEach(node => {
      const isActive = parseInt(node.dataset.x, 10) === x && parseInt(node.dataset.y, 10) === y;
      node.classList.toggle('active', isActive);
      node.setAttribute('aria-current', isActive ? 'location' : 'false');
    });

    if (!animate || !window.gsap) return;
    const activeNode = navMap.querySelector('.layout-map-node.active');
    if (activeNode) {
      gsap.fromTo(activeNode, { scale: 0.78 }, { scale: 1, duration: 0.45, ease: 'back.out(2.4)', overwrite: true });
    }
  }

  function renderWheel(site) {
    const container = document.querySelector(`.wheel-items[data-wheel="${site}"]`);
    const projects = contentMap[site] || [];
    if (!container || !projects.length) return;
    container.innerHTML = `<div class="wheel-drum">` + projects.map((p, i) => `
      <button class="wheel-item${p.featured ? ' featured' : ''}" data-index="${i}" aria-label="View project: ${p.title}">
        ${p.badge ? `<em class="wheel-item-badge">${p.badge}</em>` : ''}
        <strong>${p.title}</strong>
        <span>${p.subtitle}</span>
      </button>
    `).join('') + `</div>`;
    setupStableWheel(site, container);
  }

  function setupStableWheel(site, container) {
    if (!window.gsap) {
      setupStaticWheelFallback(site, container);
      return;
    }

    const drum = container.querySelector('.wheel-drum');
    const items = gsap.utils.toArray(drum.querySelectorAll('.wheel-item'));
    const itemCount = items.length;
    const itemGap = 92;
    let wheelPosition = currentProjectIndex[site];
    let dragStartY = 0;
    let dragCurrentY = 0;
    let dragStartPosition = 0;
    let isDragging = false;
    let pointerDownItem = null;
    let wheelSnapTimer = null;

    function wrapIndex(index) {
      return (index % itemCount + itemCount) % itemCount;
    }

    function wrapPosition(position) {
      return (position % itemCount + itemCount) % itemCount;
    }

    function getWheelOffset(index, wheelPosition) {
      let offset = index - wheelPosition;
      if (offset > itemCount / 2) offset -= itemCount;
      if (offset < -itemCount / 2) offset += itemCount;
      return offset;
    }

    function renderWheelPosition(wheelPosition, animate = true) {
      const activeIdx = wrapIndex(Math.round(wheelPosition));
      items.forEach((item, i) => {
        const offset = getWheelOffset(i, wheelPosition);
        const distance = Math.abs(offset);
        item.classList.toggle('active', i === activeIdx);
        const props = {
          x: 0,
          y: offset * itemGap,
          z: 0,
          rotation: 0,
          rotationX: 0,
          scale: i === activeIdx ? 1 : Math.max(0.78, 1 - distance * 0.08),
          opacity: distance > 2 ? 0 : Math.max(0.32, 1 - distance * 0.28),
          pointerEvents: distance > 2 ? 'none' : 'auto',
          zIndex: 10 - distance,
          ease: 'power2.out',
          overwrite: true
        };

        if (animate) gsap.to(item, { ...props, duration: 0.28 });
        else gsap.set(item, props);
      });
    }

    function setActive(index, animate = true) {
      const activeIdx = wrapIndex(index);
      const hasChanged = currentProjectIndex[site] !== activeIdx;
      currentProjectIndex[site] = activeIdx;
      wheelPosition = activeIdx;

      renderWheelPosition(activeIdx, animate);
      if (isShowcaseReady(site) && (hasChanged || !animate)) updateShowcase(site, hasChanged);
    }

    function snapToNearest() {
      setActive(Math.round(wheelPosition));
    }

    // PREVENT GLOBAL INTERFERENCE
    container.addEventListener('pointerdown', e => {
      e.preventDefault();
      e.stopPropagation();
      isDragging = false;
      pointerDownItem = e.target.closest('.wheel-item');
      dragStartY = e.clientY;
      dragCurrentY = e.clientY;
      dragStartPosition = wheelPosition;
      clearTimeout(wheelSnapTimer);
      gsap.killTweensOf(items);
      container.setPointerCapture(e.pointerId);
    });

    container.addEventListener('pointermove', e => {
      if (!container.hasPointerCapture(e.pointerId)) return;
      e.preventDefault();
      e.stopPropagation();

      const deltaY = e.clientY - dragStartY;
      dragCurrentY = e.clientY;
      if (Math.abs(deltaY) > 6) isDragging = true;

      wheelPosition = wrapPosition(dragStartPosition - (deltaY / itemGap));
      renderWheelPosition(wheelPosition, false);
    });

    container.addEventListener('pointerup', e => {
      e.preventDefault();
      e.stopPropagation();
      if (isDragging) {
        snapToNearest();
      } else if (pointerDownItem) {
        setActive(parseInt(pointerDownItem.dataset.index, 10));
      }
      pointerDownItem = null;
      if (container.hasPointerCapture(e.pointerId)) container.releasePointerCapture(e.pointerId);
    });

    container.addEventListener('pointercancel', e => {
      if (isDragging) setActive(currentProjectIndex[site]);
      pointerDownItem = null;
      if (container.hasPointerCapture(e.pointerId)) container.releasePointerCapture(e.pointerId);
    });

    container.addEventListener('wheel', e => {
      e.preventDefault(); e.stopPropagation();
      clearTimeout(wheelSnapTimer);
      gsap.killTweensOf(items);

      const wheelStep = Math.max(-1, Math.min(1, e.deltaY / itemGap));
      wheelPosition = wrapPosition(wheelPosition + wheelStep);
      renderWheelPosition(wheelPosition, false);

      wheelSnapTimer = setTimeout(snapToNearest, 120);
    }, { passive: false });

    setActive(currentProjectIndex[site], false);
  }

  function setupStaticWheelFallback(site, container) {
    const items = Array.from(container.querySelectorAll('.wheel-item'));

    function setActive(index, emitMotion = true) {
      currentProjectIndex[site] = index;
      items.forEach((item, itemIndex) => {
        const offset = itemIndex - index;
        item.classList.toggle('active', itemIndex === index);
        item.style.transform = `translateY(${offset * 92}px) scale(${itemIndex === index ? 1 : 0.88})`;
        item.style.opacity = Math.abs(offset) > 2 ? '0' : String(Math.max(0.34, 1 - Math.abs(offset) * 0.28));
        item.style.pointerEvents = Math.abs(offset) > 2 ? 'none' : 'auto';
        item.style.zIndex = String(10 - Math.abs(offset));
      });
      updateShowcase(site, emitMotion);
    }

    items.forEach((item, index) => {
      item.addEventListener('click', event => {
        event.preventDefault();
        event.stopPropagation();
        setActive(index);
      });
    });

    container.addEventListener('wheel', event => {
      event.preventDefault();
      event.stopPropagation();
      const step = event.deltaY > 0 ? 1 : -1;
      const nextIndex = (currentProjectIndex[site] + step + items.length) % items.length;
      setActive(nextIndex);
    }, { passive: false });

    setActive(currentProjectIndex[site], false);
  }

  function updateShowcase(site, emitMotion = true) {
    const panel = panels.find(p => p.dataset.site === site);
    if (!panel) return;
    const project = contentMap[site][currentProjectIndex[site]];
    const details = panel.querySelector('.showcase-details'), links = panel.querySelector('.showcase-links');
    const descTitle = panel.querySelector('.project-description-title'), descText = panel.querySelector('.project-description-text');
    if (emitMotion) panel.dispatchEvent(new CustomEvent('project:changing', { bubbles: true, detail: { site, project } }));
    if (descTitle) descTitle.textContent = project.title;
    if (descText) descText.textContent = project.description;
    if (details) {
      details.classList.toggle('has-gallery-showcase', project.showcaseType === 'gallery');
      details.classList.toggle('has-image-showcase', project.showcaseType === 'image');
      details.classList.toggle('has-youtube-showcase', project.showcaseType === 'youtube');
      details.classList.toggle('has-embed-showcase', project.showcaseType === 'embed');
      details.closest('.showcase-area')?.classList.toggle('has-gallery-project', project.showcaseType === 'gallery');
      if (project.showcaseType === 'youtube') {
        details.innerHTML = `<div class="showcase-youtube-preview"><div class="showcase-youtube"><iframe src="https://www.youtube.com/embed/${project.videoId}" title="${project.title}" loading="lazy" allowfullscreen></iframe></div><div class="showcase-youtube-copy"><h3 class="showcase-project-title">${project.title}</h3><p class="showcase-project-subtitle">${project.subtitle}</p></div></div>`;
      } else if (project.showcaseType === 'gallery' && window.renderPortfolioGallery) {
        details.innerHTML = window.renderPortfolioGallery(project);
      } else if (project.showcaseType === 'image') {
        details.innerHTML = `<div class="showcase-image-preview"><figure class="showcase-image-frame"><img src="${project.image}" alt="${project.title} screenshot" loading="lazy" decoding="async"></figure><div class="showcase-image-copy"><h3 class="showcase-project-title">${project.title}</h3><p class="showcase-project-subtitle">${project.subtitle}</p></div></div>`;
      } else if (project.showcaseType === 'embed') {
        details.innerHTML = `<div class="showcase-embed-preview"><div class="showcase-embed-frame"><iframe src="${project.embedUrl}" title="${project.title}" loading="lazy" allow="fullscreen; gamepad; pointer-lock"></iframe></div><div class="showcase-embed-copy"><h3 class="showcase-project-title">${project.title}</h3><p class="showcase-project-subtitle">${project.subtitle}</p></div></div>`;
      } else {
        details.innerHTML = `<h3 class="showcase-project-title">${project.title}</h3><p class="showcase-project-subtitle">${project.subtitle}</p>`;
      }
    }
    if (links) {
      links.innerHTML = (project.links || []).map(l => `<a href="${l.href}" ${l.href.startsWith('http') ? 'target="_blank" rel="noopener noreferrer"' : ''}>${l.label}</a>`).join('');
      links.hidden = !project.links || project.links.length === 0;
    }
    if (emitMotion) panel.dispatchEvent(new CustomEvent('project:changed', { bubbles: true, detail: { site, project } }));
  }

  let startX, startY;
  window.addEventListener('mousedown', e => {
    // STRICT EXCLUSION: Do not start swipe if clicking the wheel or its children
    if (e.target.closest('.wheel-drum, .wheel-items, .layout-map, button, a')) return;
    startX = e.clientX; startY = e.clientY;
  });

  window.addEventListener('mouseup', e => {
    if (startX === undefined) return;
    const dx = e.clientX - startX, dy = e.clientY - startY;
    if (Math.abs(dx) > 50 || Math.abs(dy) > 50) {
      if (Math.abs(dx) > Math.abs(dy)) { if (dx > 0) move('left'); else move('right'); }
      else { if (dy > 0) move('top'); else move('bottom'); }
    }
    startX = undefined;
  });

  function move(dir) {
    let nx = currentX, ny = currentY;
    if (dir === 'left') nx--; if (dir === 'right') nx++;
    if (dir === 'top') ny--; if (dir === 'bottom') ny++;
    if ((nx !== currentX && currentY === 0) || (ny !== currentY && currentX === 0)) updateNavigation(nx, ny);
  }
  navFlags.forEach(f => f.onclick = () => move(f.dataset.target));
  window.addEventListener('wheel', e => {
    if (e.target.closest('.wheel-items')) return;
    if (Math.abs(e.deltaX) > 30) (e.deltaX > 0 ? move('right') : move('left'));
    else if (Math.abs(e.deltaY) > 30) (e.deltaY > 0 ? move('bottom') : move('top'));
  }, { passive: true });

  init();
});
