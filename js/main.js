(() => {
  const root = document.documentElement;
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const desktopParallax = window.matchMedia('(min-width: 1001px)');
  const mobileNavigation = window.matchMedia('(max-width: 1240px)');

  let revealObserver = null;
  let revealTargets = [];
  let parallaxFrame = 0;

  const isHeroSection = (section) => section.matches('.hero, [class*="-hero"]');

  const getRevealTargets = () => {
    const sections = [...document.querySelectorAll('main section')].filter((section) => !isHeroSection(section));

    return sections.flatMap((section) => {
      const candidates = [...section.querySelectorAll('h2, h3, figure, article, .gallery-tile, [class*="-card"], [class*="__photo"], [class*="__visual"], [class*="__image"], p')];
      const targets = candidates.filter((element) => {
        if (element.matches('p') && element.matches('[class*="kicker"], [class*="caption"]')) return false;
        if (element.matches('p') && element.closest('figure')) return false;

        const containingCard = element.closest('article, .gallery-tile, [class*="-card"]');
        if (containingCard && containingCard !== element) return false;

        return true;
      });

      targets.forEach((element, index) => {
        element.classList.add('js-reveal');
        element.classList.remove('is-visible');
        element.style.setProperty('--reveal-delay', `${Math.min(index, 4) * 55}ms`);
      });

      return targets;
    });
  };

  const stopScrollReveal = () => {
    if (revealObserver) revealObserver.disconnect();
    revealObserver = null;
    revealTargets.forEach((element) => {
      element.classList.remove('js-reveal', 'is-visible');
      element.style.removeProperty('--reveal-delay');
    });
    revealTargets = [];
    root.classList.remove('has-motion');
  };

  const startScrollReveal = () => {
    if (reducedMotion.matches || !('IntersectionObserver' in window)) return;

    revealTargets = getRevealTargets();
    if (!revealTargets.length) return;

    try {
      const observer = new IntersectionObserver((entries, activeObserver) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add('is-visible');
          activeObserver.unobserve(entry.target);
        });
      }, { threshold: 0.12, rootMargin: '0px 0px -36px 0px' });

      root.classList.add('has-motion');
      revealObserver = observer;
      revealTargets.forEach((element) => observer.observe(element));
    } catch {
      stopScrollReveal();
    }
  };

  const parallaxTargets = [...document.querySelectorAll('[data-parallax]')];

  const updateParallax = () => {
    parallaxFrame = 0;
    if (reducedMotion.matches || !desktopParallax.matches) return;

    const viewportCenter = window.innerHeight / 2;
    parallaxTargets.forEach((element) => {
      const rect = element.getBoundingClientRect();
      const distanceFromCenter = rect.top + rect.height / 2 - viewportCenter;
      const offset = Math.max(-18, Math.min(18, distanceFromCenter * -0.025));
      element.style.setProperty('--parallax-offset', `${offset.toFixed(1)}px`);
    });
  };

  const scheduleParallaxUpdate = () => {
    if (parallaxFrame || reducedMotion.matches || !desktopParallax.matches) return;
    parallaxFrame = window.requestAnimationFrame(updateParallax);
  };

  const clearParallax = () => {
    if (parallaxFrame) window.cancelAnimationFrame(parallaxFrame);
    parallaxFrame = 0;
    parallaxTargets.forEach((element) => element.style.removeProperty('--parallax-offset'));
  };

  const header = document.querySelector('[data-site-header]');
  const toggle = document.querySelector('[data-menu-toggle]');
  const navigation = document.querySelector('[data-site-navigation]');

  if (header) {
    let scrollFrame = 0;
    const updateScrollState = () => {
      scrollFrame = 0;
      header.classList.toggle('is-scrolled', window.scrollY > 24);
    };

    const scheduleHeaderUpdate = () => {
      if (scrollFrame) return;
      scrollFrame = window.requestAnimationFrame(updateScrollState);
    };

    updateScrollState();
    window.addEventListener('scroll', scheduleHeaderUpdate, { passive: true });

    if (toggle && navigation) {
      const closeMenu = (restoreFocus = false) => {
        const wasOpen = header.classList.contains('is-menu-open');
        header.classList.remove('is-menu-open');
        toggle.setAttribute('aria-expanded', 'false');
        toggle.setAttribute('aria-label', 'Abrir menú');
        if (restoreFocus && wasOpen) toggle.focus();
      };

      toggle.addEventListener('click', () => {
        const isOpen = header.classList.toggle('is-menu-open');
        toggle.setAttribute('aria-expanded', String(isOpen));
        toggle.setAttribute('aria-label', isOpen ? 'Cerrar menú' : 'Abrir menú');
      });

      navigation.addEventListener('click', (event) => {
        if (event.target.closest('a')) closeMenu();
      });

      document.addEventListener('pointerdown', (event) => {
        if (!header.contains(event.target)) closeMenu();
      });

      document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape') closeMenu(true);
      });

      const handleNavigationBreakpoint = () => {
        if (!mobileNavigation.matches) closeMenu();
      };
      if (mobileNavigation.addEventListener) mobileNavigation.addEventListener('change', handleNavigationBreakpoint);
      else mobileNavigation.addListener(handleNavigationBreakpoint);
    }
  }

  const refreshMotion = () => {
    clearParallax();
    stopScrollReveal();
    if (!reducedMotion.matches) {
      startScrollReveal();
      scheduleParallaxUpdate();
    }
  };

  refreshMotion();
  window.addEventListener('scroll', scheduleParallaxUpdate, { passive: true });
  window.addEventListener('resize', scheduleParallaxUpdate, { passive: true });

  if (desktopParallax.addEventListener) desktopParallax.addEventListener('change', scheduleParallaxUpdate);
  else desktopParallax.addListener(scheduleParallaxUpdate);

  if (reducedMotion.addEventListener) reducedMotion.addEventListener('change', refreshMotion);
  else reducedMotion.addListener(refreshMotion);
})();
