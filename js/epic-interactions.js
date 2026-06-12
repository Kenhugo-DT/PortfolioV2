document.addEventListener('DOMContentLoaded', () => {
  const root = document.documentElement;
  const body = document.body;
  const panels = Array.from(document.querySelectorAll('.portfolio-panel'));
  const motionAllowed = !window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  body.classList.add('epic-ready');

  function pulseClass(element, className, duration = 700) {
    if (!element) return;
    element.classList.remove(className);
    void element.offsetWidth;
    element.classList.add(className);
    window.setTimeout(() => element.classList.remove(className), duration);
  }

  function setActivePanel(panel) {
    if (!panel) return;
    body.dataset.activeSite = panel.dataset.site || 'home';
  }

  const activeObserver = new MutationObserver(() => {
    setActivePanel(document.querySelector('.portfolio-panel.active'));
  });

  panels.forEach(panel => {
    activeObserver.observe(panel, { attributes: true, attributeFilter: ['class'] });
  });

  setActivePanel(document.querySelector('.portfolio-panel.active') || panels.find(panel => panel.dataset.site === 'home'));

  window.addEventListener('pointermove', event => {
    const x = event.clientX / Math.max(window.innerWidth, 1);
    const y = event.clientY / Math.max(window.innerHeight, 1);
    root.style.setProperty('--pointer-x', x.toFixed(3));
    root.style.setProperty('--pointer-y', y.toFixed(3));
  }, { passive: true });

  document.addEventListener('click', event => {
    const wheelItem = event.target.closest('.wheel-item');
    if (!wheelItem || !motionAllowed || !window.gsap) return;

    gsap.fromTo(wheelItem, {
      boxShadow: '0 0 0 rgba(255,255,255,0)'
    }, {
      boxShadow: '0 0 34px rgba(255,255,255,0.18)',
      duration: 0.22,
      yoyo: true,
      repeat: 1,
      overwrite: true
    });
  });

  document.addEventListener('pointerdown', event => {
    const navFlag = event.target.closest('.nav-flag');
    if (navFlag) navFlag.classList.add('is-pressed');
  });

  document.addEventListener('pointerup', () => {
    document.querySelectorAll('.nav-flag.is-pressed').forEach(flag => flag.classList.remove('is-pressed'));
  });

  const homePanel = document.querySelector('.panel-center');
  const landingFlags = {
    webdev: homePanel && homePanel.querySelector('.flag-left'),
    creative: homePanel && homePanel.querySelector('.flag-right')
  };
  let focusedTeaser = '';
  let teaserFrame = 0;
  let lastPointer = null;

  function clamp(value, min = 0, max = 1) {
    return Math.min(max, Math.max(min, value));
  }

  function easeProximity(value) {
    const t = clamp(value);
    return t * t * (3 - 2 * t);
  }

  function getFlagProximity(flag, pointer) {
    if (!flag || !pointer || !homePanel.classList.contains('active')) return 0;
    const rect = flag.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const distance = Math.hypot(pointer.x - centerX, pointer.y - centerY);
    const radius = Math.min(window.innerWidth * 0.38, 520);
    return easeProximity(1 - distance / Math.max(radius, 220));
  }

  function setTeaserVars(name, strength) {
    const prefix = name === 'webdev' ? 'webdev' : 'creative';
    const glow = 8 + strength * 40;
    const scale = 0.72 + strength * 0.4;
    const opacity = strength < 0.03 ? 0 : 0.06 + strength * 0.94;
    homePanel.style.setProperty(`--${prefix}-opacity`, opacity.toFixed(3));
    homePanel.style.setProperty(`--${prefix}-scale`, scale.toFixed(3));
    homePanel.style.setProperty(`--${prefix}-glow`, `${glow.toFixed(1)}px`);

    if (name === 'webdev') {
      homePanel.style.setProperty('--webdev-window-x', `${(-42 * strength).toFixed(1)}px`);
      homePanel.style.setProperty('--webdev-window-y', `${(-16 * strength).toFixed(1)}px`);
      homePanel.style.setProperty('--webdev-grid-x', `${(44 * strength).toFixed(1)}px`);
      homePanel.style.setProperty('--webdev-grid-y', `${(18 * strength).toFixed(1)}px`);
      homePanel.style.setProperty('--webdev-orbit-x', `${(52 * strength).toFixed(1)}px`);
      homePanel.style.setProperty('--webdev-orbit-y', `${(-28 * strength).toFixed(1)}px`);
    } else {
      homePanel.style.setProperty('--creative-paint-x', `${(-26 * strength).toFixed(1)}px`);
      homePanel.style.setProperty('--creative-paint-y', `${(-18 * strength).toFixed(1)}px`);
      homePanel.style.setProperty('--creative-brush-x', `${(-72 * strength).toFixed(1)}px`);
      homePanel.style.setProperty('--creative-brush-y', `${(-8 * strength).toFixed(1)}px`);
      homePanel.style.setProperty('--creative-reach', (0.48 + strength * 0.62).toFixed(3));
      homePanel.style.setProperty('--creative-frame-x', `${(-38 * strength).toFixed(1)}px`);
      homePanel.style.setProperty('--creative-frame-y', `${(30 * strength).toFixed(1)}px`);
    }
  }

  function updateLandingTeasers() {
    teaserFrame = 0;
    if (!homePanel || !motionAllowed) return;

    const webdev = focusedTeaser === 'webdev' ? 1 : getFlagProximity(landingFlags.webdev, lastPointer);
    const creative = focusedTeaser === 'creative' ? 1 : getFlagProximity(landingFlags.creative, lastPointer);

    setTeaserVars('webdev', webdev);
    setTeaserVars('creative', creative);

    const activeTeaser = webdev > creative && webdev > 0.12 ? 'webdev' : creative > 0.12 ? 'creative' : '';
    if (activeTeaser) homePanel.dataset.teaser = activeTeaser;
    else delete homePanel.dataset.teaser;
  }

  function requestTeaserUpdate() {
    if (!teaserFrame) teaserFrame = window.requestAnimationFrame(updateLandingTeasers);
  }

  if (homePanel) {
    window.addEventListener('pointermove', event => {
      lastPointer = { x: event.clientX, y: event.clientY };
      requestTeaserUpdate();
    }, { passive: true });

    window.addEventListener('pointerleave', () => {
      lastPointer = null;
      focusedTeaser = '';
      requestTeaserUpdate();
    });

    Object.entries(landingFlags).forEach(([name, flag]) => {
      if (!flag) return;
      flag.addEventListener('focus', () => {
        focusedTeaser = name;
        requestTeaserUpdate();
      });
      flag.addEventListener('blur', () => {
        focusedTeaser = '';
        requestTeaserUpdate();
      });
    });
  }

  document.addEventListener('project:changing', event => {
    const panel = event.target.closest('.portfolio-panel');
    pulseClass(panel, 'project-changing', 760);
  });

  document.addEventListener('project:changed', event => {
    const panel = event.target.closest('.portfolio-panel');
    const details = panel && panel.querySelector('.showcase-details');
    const description = panel && panel.querySelector('.project-description-box');
    pulseClass(details, 'project-revealed', 900);
    pulseClass(description, 'project-revealed', 900);
  });

  const showcaseObserver = new MutationObserver(mutations => {
    if (!motionAllowed || !window.gsap) return;

    mutations.forEach(mutation => {
      const details = mutation.target.closest('.showcase-details');
      if (!details) return;

      gsap.fromTo(details.children, {
        opacity: 0,
        y: 16,
        scale: 0.985
      }, {
        opacity: 1,
        y: 0,
        scale: 1,
        duration: 0.52,
        stagger: 0.06,
        ease: 'back.out(1.35)',
        overwrite: true
      });
    });
  });

  document.querySelectorAll('.showcase-details').forEach(details => {
    showcaseObserver.observe(details, { childList: true });
  });

  const audio = document.getElementById('audio-player');
  if (audio) {
    audio.addEventListener('play', () => body.classList.add('is-playing'));
    audio.addEventListener('pause', () => body.classList.remove('is-playing'));
    audio.addEventListener('ended', () => body.classList.remove('is-playing'));
  }
});
