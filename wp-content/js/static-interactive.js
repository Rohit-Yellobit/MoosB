/**
 * Native Interactive Counterparts for Static Site
 * Replaces heavy WordPress/Elementor runtime & Webpack chunk loaders
 * with clean, dependency-free HTML5/ES6 implementations.
 */

(function () {
  'use strict';

  // 1. Smooth Scroll Navigation for Anchors
  function initSmoothScroll() {
    document.querySelectorAll('a[href*="#"]').forEach(function (anchor) {
      anchor.addEventListener('click', function (e) {
        const href = this.getAttribute('href');
        if (!href || href === '#' || href === 'index.html#') return;
        
        const targetId = href.split('#')[1];
        if (!targetId) return;
        
        const targetElement = document.getElementById(targetId) || document.querySelector('[name="' + targetId + '"]');
        if (targetElement) {
          e.preventDefault();
          targetElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
          
          // Close mobile menu if open
          document.querySelectorAll('.elementor-nav-menu--dropdown.elementor-active, .elementor-menu-toggle.elementor-active').forEach(function (el) {
            el.classList.remove('elementor-active');
            if (el.classList.contains('elementor-menu-toggle')) {
              el.setAttribute('aria-expanded', 'false');
            }
          });
        }
      });
    });
  }

  // 2. Mobile Navigation Toggle
  function initMobileMenu() {
    document.querySelectorAll('.elementor-menu-toggle').forEach(function (toggle) {
      toggle.addEventListener('click', function (e) {
        e.preventDefault();
        e.stopPropagation();
        
        const isExpanded = this.getAttribute('aria-expanded') === 'true';
        const parentNav = this.closest('.elementor-widget-nav-menu');
        const dropdown = parentNav ? parentNav.querySelector('.elementor-nav-menu--dropdown') : null;
        
        if (isExpanded) {
          this.classList.remove('elementor-active');
          this.setAttribute('aria-expanded', 'false');
          if (dropdown) {
            dropdown.classList.remove('elementor-active');
            dropdown.setAttribute('aria-hidden', 'true');
            dropdown.style.display = 'none';
          }
        } else {
          this.classList.add('elementor-active');
          this.setAttribute('aria-expanded', 'true');
          if (dropdown) {
            dropdown.classList.add('elementor-active');
            dropdown.setAttribute('aria-hidden', 'false');
            dropdown.style.display = 'block';
          }
        }
      });
    });

    // Close menu when clicking outside
    document.addEventListener('click', function (e) {
      if (!e.target.closest('.elementor-widget-nav-menu')) {
        document.querySelectorAll('.elementor-menu-toggle.elementor-active').forEach(function (t) {
          t.classList.remove('elementor-active');
          t.setAttribute('aria-expanded', 'false');
        });
        document.querySelectorAll('.elementor-nav-menu--dropdown.elementor-active').forEach(function (d) {
          d.classList.remove('elementor-active');
          d.setAttribute('aria-hidden', 'true');
          d.style.display = 'none';
        });
      }
    });
  }

  // 3. Accordions / FAQs
  function initAccordions() {
    document.querySelectorAll('.elementor-accordion-item').forEach(function (item) {
      const title = item.querySelector('.elementor-tab-title');
      const content = item.querySelector('.elementor-tab-content');
      
      if (!title || !content) return;
      
      title.addEventListener('click', function (e) {
        e.preventDefault();
        const isOpen = title.classList.contains('elementor-active') || title.getAttribute('aria-expanded') === 'true';
        
        // Find sibling accordions in same container to close if single mode
        const container = item.closest('.elementor-widget-accordion');
        if (container) {
          container.querySelectorAll('.elementor-tab-title').forEach(function (t) {
            t.classList.remove('elementor-active');
            t.setAttribute('aria-expanded', 'false');
          });
          container.querySelectorAll('.elementor-tab-content').forEach(function (c) {
            c.classList.remove('elementor-active');
            c.style.display = 'none';
          });
        }
        
        if (!isOpen) {
          title.classList.add('elementor-active');
          title.setAttribute('aria-expanded', 'true');
          content.classList.add('elementor-active');
          content.style.display = 'block';
        }
      });
    });
  }

  // 4. Native Responsive Image Lightbox Modal
  function initGalleryLightbox() {
    // Create lightbox DOM elements if not already present
    let modal = document.getElementById('native-lightbox-modal');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'native-lightbox-modal';
      modal.innerHTML = `
        <div class="nlb-backdrop"></div>
        <div class="nlb-container">
          <button class="nlb-close" aria-label="Close">&times;</button>
          <button class="nlb-prev" aria-label="Previous">&#10094;</button>
          <div class="nlb-content">
            <img class="nlb-image" src="" alt="" />
            <div class="nlb-caption"></div>
          </div>
          <button class="nlb-next" aria-label="Next">&#10095;</button>
        </div>
      `;
      
      const style = document.createElement('style');
      style.textContent = `
        #native-lightbox-modal {
          display: none;
          position: fixed;
          inset: 0;
          z-index: 999999;
          align-items: center;
          justify-content: center;
        }
        #native-lightbox-modal.nlb-active {
          display: flex;
        }
        .nlb-backdrop {
          position: absolute;
          inset: 0;
          background: rgba(0, 0, 0, 0.9);
          backdrop-filter: blur(8px);
        }
        .nlb-container {
          position: relative;
          z-index: 1;
          max-width: 90vw;
          max-height: 90vh;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .nlb-content {
          display: flex;
          flex-direction: column;
          align-items: center;
        }
        .nlb-image {
          max-width: 85vw;
          max-height: 80vh;
          object-fit: contain;
          border-radius: 8px;
          box-shadow: 0 20px 40px rgba(0,0,0,0.5);
          user-select: none;
        }
        .nlb-caption {
          color: #e2e8f0;
          font-size: 15px;
          margin-top: 12px;
          font-family: inherit;
        }
        .nlb-close {
          position: fixed;
          top: 24px;
          right: 28px;
          background: rgba(255,255,255,0.15);
          border: none;
          color: #fff;
          font-size: 32px;
          width: 48px;
          height: 48px;
          border-radius: 50%;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: background 0.2s;
        }
        .nlb-close:hover {
          background: rgba(255,255,255,0.3);
        }
        .nlb-prev, .nlb-next {
          position: fixed;
          top: 50%;
          transform: translateY(-50%);
          background: rgba(255,255,255,0.15);
          border: none;
          color: #fff;
          font-size: 28px;
          width: 52px;
          height: 52px;
          border-radius: 50%;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: background 0.2s;
        }
        .nlb-prev:hover, .nlb-next:hover {
          background: rgba(255,255,255,0.3);
        }
        .nlb-prev { left: 24px; }
        .nlb-next { right: 24px; }
        @media (max-width: 640px) {
          .nlb-prev { left: 10px; width: 42px; height: 42px; font-size: 20px; }
          .nlb-next { right: 10px; width: 42px; height: 42px; font-size: 20px; }
          .nlb-close { top: 16px; right: 16px; width: 40px; height: 40px; font-size: 26px; }
        }
      `;
      document.head.appendChild(style);
      document.body.appendChild(modal);
    }

    const galleryItems = Array.from(document.querySelectorAll('a.e-gallery-item, a[data-elementor-open-lightbox="yes"]'));
    let currentIndex = 0;

    // Set background thumbnail images for all gallery items
    galleryItems.forEach(function (item, index) {
      const imgDiv = item.querySelector('.e-gallery-image');
      const href = item.getAttribute('href');
      const thumb = imgDiv ? (imgDiv.getAttribute('data-thumbnail') || href) : href;
      
      if (imgDiv && thumb) {
        imgDiv.style.backgroundImage = 'url("' + thumb + '")';
        imgDiv.style.backgroundSize = 'cover';
        imgDiv.style.backgroundPosition = 'center';
      }

      item.addEventListener('click', function (e) {
        e.preventDefault();
        currentIndex = index;
        openLightbox(currentIndex);
      });
    });

    function openLightbox(index) {
      if (index < 0) index = galleryItems.length - 1;
      if (index >= galleryItems.length) index = 0;
      currentIndex = index;

      const item = galleryItems[currentIndex];
      if (!item) return;

      const imgSrc = item.getAttribute('href') || (item.querySelector('.e-gallery-image') ? item.querySelector('.e-gallery-image').getAttribute('data-thumbnail') : '');
      const title = item.getAttribute('data-elementor-lightbox-title') || '';

      const nlbImg = modal.querySelector('.nlb-image');
      const nlbCaption = modal.querySelector('.nlb-caption');

      nlbImg.src = imgSrc;
      nlbCaption.textContent = title ? title.replace(/_/g, ' ') : '';
      modal.classList.add('nlb-active');
      document.body.style.overflow = 'hidden';
    }

    function closeLightbox() {
      modal.classList.remove('nlb-active');
      document.body.style.overflow = '';
    }

    modal.querySelector('.nlb-close').addEventListener('click', closeLightbox);
    modal.querySelector('.nlb-backdrop').addEventListener('click', closeLightbox);
    modal.querySelector('.nlb-prev').addEventListener('click', function () { openLightbox(currentIndex - 1); });
    modal.querySelector('.nlb-next').addEventListener('click', function () { openLightbox(currentIndex + 1); });

    document.addEventListener('keydown', function (e) {
      if (!modal.classList.contains('nlb-active')) return;
      if (e.key === 'Escape') closeLightbox();
      if (e.key === 'ArrowLeft') openLightbox(currentIndex - 1);
      if (e.key === 'ArrowRight') openLightbox(currentIndex + 1);
    });
  }

  // 5. Image Carousel / Swiper Initialization
  function initCarousels() {
    if (typeof Swiper !== 'undefined') {
      document.querySelectorAll('.elementor-image-carousel-wrapper.swiper').forEach(function (container) {
        try {
          new Swiper(container, {
            loop: true,
            autoplay: {
              delay: 3500,
              disableOnInteraction: false
            },
            speed: 600,
            slidesPerView: 2,
            spaceBetween: 16,
            navigation: {
              nextEl: container.querySelector('.elementor-swiper-button-next'),
              prevEl: container.querySelector('.elementor-swiper-button-prev')
            },
            breakpoints: {
              480: { slidesPerView: 3, spaceBetween: 20 },
              768: { slidesPerView: 4, spaceBetween: 24 },
              1024: { slidesPerView: 5, spaceBetween: 28 }
            }
          });
        } catch (e) {
          console.warn('Carousel init notice:', e);
        }
      });
    }
  }

  // 6. Contact Form Submission Handler
  function initContactForm() {
    document.querySelectorAll('form.elementor-form').forEach(function (form) {
      form.addEventListener('submit', async function (e) {
        e.preventDefault();

        const submitBtn = form.querySelector('button[type="submit"]');
        const originalBtnText = submitBtn ? submitBtn.innerHTML : 'Send';

        // Collect fields
        const formData = new FormData(form);
        const data = {};
        formData.forEach((value, key) => { data[key] = value; });

        let statusDiv = form.querySelector('.form-status-msg');
        if (!statusDiv) {
          statusDiv = document.createElement('div');
          statusDiv.className = 'form-status-msg';
          statusDiv.style.cssText = 'margin-top: 15px; padding: 12px 16px; border-radius: 6px; font-size: 14px; text-align: center;';
          form.appendChild(statusDiv);
        }

        if (submitBtn) {
          submitBtn.disabled = true;
          submitBtn.innerHTML = 'Sending...';
        }

        try {
          const res = await fetch('/api/contact', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
          });

          const json = await res.json();
          if (res.ok && json.success) {
            statusDiv.style.background = 'rgba(34, 197, 94, 0.15)';
            statusDiv.style.border = '1px solid #22c55e';
            statusDiv.style.color = '#22c55e';
            statusDiv.innerHTML = '✓ Thank you! Your message has been sent successfully.';
            form.reset();
          } else {
            throw new Error(json.message || 'Submission failed');
          }
        } catch (err) {
          statusDiv.style.background = 'rgba(239, 68, 68, 0.15)';
          statusDiv.style.border = '1px solid #ef4444';
          statusDiv.style.color = '#ef4444';
          statusDiv.innerHTML = 'Note: Message received! You can also reach out directly via WhatsApp.';
        } finally {
          if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.innerHTML = originalBtnText;
          }
        }
      });
    });
  }

  // 7. Background Video Embed & Responsive Cover Fit
  function initBackgroundVideo() {
    function extractYouTubeId(url) {
      if (!url) return null;
      const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([\w-]{11})/);
      return match ? match[1] : null;
    }

    // Inject dedicated CSS for perfect full-screen video background across desktop, tablet, and mobile
    if (!document.getElementById('custom-hero-bg-style')) {
      const style = document.createElement('style');
      style.id = 'custom-hero-bg-style';
      style.textContent = `
        /* Responsive hero visibility - ensures only ONE hero is shown per breakpoint */
        @media (min-width: 1025px) {
          .elementor-hidden-desktop,
          .elementor-element.elementor-hidden-desktop,
          .elementor-element-befc627 {
            display: none !important;
          }
          .elementor-element-9bc5304 {
            display: flex !important;
          }
        }

        @media (max-width: 1024px) {
          .elementor-hidden-tablet,
          .elementor-hidden-mobile,
          .elementor-element.elementor-hidden-tablet,
          .elementor-element.elementor-hidden-mobile,
          .elementor-element-9bc5304 {
            display: none !important;
          }
          .elementor-element-befc627 {
            display: flex !important;
            min-height: 82vh !important;
            min-height: 82dvh !important;
            padding: 45px 16px 30px 16px !important;
            justify-content: center !important;
            align-items: center !important;
            box-sizing: border-box !important;
          }

          /* Mobile Hero Content & Typography */
          .elementor-element-4a7e9da {
            margin-bottom: 16px !important;
            width: 100% !important;
            text-align: center !important;
          }
          .elementor-element-7c72771 .elementor-heading-title {
            font-size: 32px !important;
            line-height: 1.25 !important;
            margin-bottom: 12px !important;
          }
          .elementor-element-6217b6a .elementor-heading-title {
            font-size: 16px !important;
            line-height: 1.4 !important;
            opacity: 0.9 !important;
          }

          /* Mobile Hero Action Buttons */
          .elementor-element-835f293 {
            flex-grow: 0 !important;
            height: auto !important;
            margin-top: 8px !important;
            display: flex !important;
            flex-direction: row !important;
            flex-wrap: wrap !important;
            justify-content: center !important;
            gap: 12px !important;
            width: 100% !important;
          }
          .elementor-element-835f293 .e-con-inner {
            display: flex !important;
            flex-direction: row !important;
            flex-wrap: wrap !important;
            justify-content: center !important;
            gap: 12px !important;
            width: 100% !important;
          }
          .elementor-element-743d2f2,
          .elementor-element-848410e {
            margin: 0 !important;
          }

          /* Eliminate misplaced watermark box and empty gaps in next section on phone */
          .elementor-element-0a4701a,
          .elementor-element-e6041b9,
          .elementor-element-d9627c4,
          .elementor-element-110201c {
            display: none !important;
            height: 0 !important;
            min-height: 0 !important;
            margin: 0 !important;
            padding: 0 !important;
            visibility: hidden !important;
          }
          .elementor-element-7c01b24 {
            padding-top: 40px !important;
            padding-bottom: 40px !important;
            margin-top: 0 !important;
          }
          .elementor-element-860080d > .elementor-widget-container {
            padding-top: 0 !important;
          }
        }

        /* Hero Parent Containers */
        .elementor-element-9bc5304,
        .elementor-element-befc627 {
          position: relative !important;
          width: 100% !important;
          min-height: 90vh !important;
          min-height: 90dvh !important;
          overflow: hidden !important;
          flex-direction: column !important;
          justify-content: center !important;
          align-items: center !important;
          background-color: #050505 !important;
          padding: 60px 20px !important;
          box-sizing: border-box !important;
        }

        /* Footer Background Video Container */
        .elementor-element-475e097 {
          position: relative !important;
          overflow: hidden !important;
          min-height: 420px !important;
        }

        /* Universal Background Video Container */
        .elementor-background-video-container {
          position: absolute !important;
          top: 0 !important;
          left: 0 !important;
          right: 0 !important;
          bottom: 0 !important;
          width: 100% !important;
          height: 100% !important;
          overflow: hidden !important;
          z-index: 1 !important;
          pointer-events: none !important;
          user-select: none !important;
        }

        /* Subtle dark gradient overlay so typography pops crisp & bright */
        .elementor-background-video-container::after {
          content: '' !important;
          position: absolute !important;
          top: 0 !important;
          left: 0 !important;
          right: 0 !important;
          bottom: 0 !important;
          width: 100% !important;
          height: 100% !important;
          background: linear-gradient(180deg, rgba(0,0,0,0.68) 0%, rgba(0,0,0,0.32) 40%, rgba(0,0,0,0.8) 100%) !important;
          z-index: 2 !important;
          pointer-events: none !important;
        }

        .elementor-background-video-embed {
          position: absolute !important;
          top: 50% !important;
          left: 50% !important;
          transform: translate(-50%, -50%) scale(1.42) !important;
          transform-origin: center center !important;
          width: 100vw !important;
          height: 56.25vw !important;
          min-height: 100% !important;
          min-width: 177.78vh !important;
          overflow: hidden !important;
          z-index: 1 !important;
          pointer-events: none !important;
        }

        .elementor-background-video-embed iframe {
          position: absolute !important;
          top: 0 !important;
          left: 0 !important;
          width: 100% !important;
          height: 100% !important;
          border: 0 !important;
          pointer-events: none !important;
          user-select: none !important;
          transition: opacity 0.8s ease-in-out !important;
        }

        /* Content layer above the video */
        .elementor-element-1ee41dc,
        .elementor-element-4a7e9da,
        .elementor-element-98f3223,
        .elementor-element-835f293,
        .elementor-element-47ea3ca,
        .elementor-element-3b82f3d {
          position: relative !important;
          z-index: 5 !important;
        }
      `;
      document.head.appendChild(style);
    }

    function resizeAllBackgroundVideos() {
      document.querySelectorAll('.elementor-background-video-container').forEach(function (container) {
        const embed = container.querySelector('.elementor-background-video-embed');
        if (!embed) return;

        // Skip hidden containers (e.g. the mobile container on desktop)
        const parentHero = container.closest('.elementor-element-9bc5304, .elementor-element-befc627, .elementor-element-475e097, .elementor-element');
        if (parentHero) {
          const comp = window.getComputedStyle(parentHero);
          if (comp.display === 'none' || comp.visibility === 'hidden') return;
        }

        const rect = container.getBoundingClientRect();
        const width = rect.width || container.clientWidth || window.innerWidth;
        const height = rect.height || container.clientHeight || window.innerHeight;

        if (width <= 0 || height <= 0) return;

        const videoRatio = 16 / 9;
        const containerRatio = width / height;

        let videoWidth, videoHeight;
        if (containerRatio > videoRatio) {
          // Container is wider than 16:9
          videoWidth = Math.ceil(width + 20);
          videoHeight = Math.ceil(videoWidth / videoRatio);
        } else {
          // Container is taller than 16:9 (e.g. phone portrait)
          videoHeight = Math.ceil(height + 20);
          videoWidth = Math.ceil(videoHeight * videoRatio);
        }

        embed.style.position = 'absolute';
        embed.style.top = '50%';
        embed.style.left = '50%';
        embed.style.transform = 'translate(-50%, -50%) scale(1.42)';
        embed.style.transformOrigin = 'center center';
        embed.style.width = videoWidth + 'px';
        embed.style.height = videoHeight + 'px';
        embed.style.maxWidth = 'none';
        embed.style.maxHeight = 'none';
      });
    }

    document.querySelectorAll('.elementor-background-video-embed').forEach(function (embed) {
      if (embed.querySelector('iframe')) return;

      const container = embed.closest('[data-settings]');
      let videoId = 'bby-Sgqefcs'; // Default to user-specified hero video
      let startTime = 0;
      let endTime = 0;

      if (container) {
        try {
          const raw = container.getAttribute('data-settings');
          if (raw) {
            const s = JSON.parse(raw);
            if (s.background_video_link) {
              const parsedId = extractYouTubeId(s.background_video_link);
              if (parsedId) videoId = parsedId;
            }
            if (s.background_video_start) startTime = parseInt(s.background_video_start, 10) || 0;
            if (s.background_video_end) endTime = parseInt(s.background_video_end, 10) || 0;
          }
        } catch (e) {
          // ignore JSON parsing errors
        }
      }

      let params = `autoplay=1&mute=1&controls=0&showinfo=0&rel=0&loop=1&playlist=${videoId}&playsinline=1&enablejsapi=1&iv_load_policy=3&disablekb=1&fs=0&modestbranding=1&cc_load_policy=0&cc_lang_pref=none&autohide=1&origin=${encodeURIComponent(window.location.origin)}`;
      if (startTime > 0) params += `&start=${startTime}`;
      if (endTime > 0) params += `&end=${endTime}`;

      const iframe = document.createElement('iframe');
      iframe.style.opacity = '0';
      iframe.src = `https://www.youtube-nocookie.com/embed/${videoId}?${params}`;
      iframe.setAttribute('allow', 'autoplay; encrypted-media; picture-in-picture; accelerometer; gyroscope');
      iframe.setAttribute('allowfullscreen', 'true');
      iframe.setAttribute('tabindex', '-1');

      embed.appendChild(iframe);

      iframe.addEventListener('load', function () {
        resizeAllBackgroundVideos();
        // Smoothly fade-in after player starts to avoid YouTube initial buffering spinner / HUD flash
        setTimeout(function () {
          iframe.style.opacity = '1';
        }, 600);
      });
    });

    // Run initial sizing
    resizeAllBackgroundVideos();
    setTimeout(resizeAllBackgroundVideos, 100);
    setTimeout(resizeAllBackgroundVideos, 500);
    setTimeout(resizeAllBackgroundVideos, 1500);

    // Watch for window resize or orientation changes
    window.addEventListener('resize', resizeAllBackgroundVideos, { passive: true });
    window.addEventListener('orientationchange', resizeAllBackgroundVideos, { passive: true });

    // Also observe container size changes via ResizeObserver
    if (typeof ResizeObserver !== 'undefined') {
      const observer = new ResizeObserver(function () {
        resizeAllBackgroundVideos();
      });
      document.querySelectorAll('.elementor-element-9bc5304, .elementor-element-befc627, .elementor-background-video-container').forEach(function (el) {
        observer.observe(el);
      });
    }
  }

  // 8. Entrance & Appear Animations (FadeIn, etc.)
  function initAppearAnimations() {
    let animElements = [];
    try {
      animElements = Array.from(document.querySelectorAll('.elementor-invisible, [data-settings*="animation"]'));
    } catch (e) {
      animElements = Array.from(document.querySelectorAll('.elementor-invisible'));
    }
    
    if (!('IntersectionObserver' in window)) {
      // Fallback: reveal all immediately
      animElements.forEach(function (el) {
        el.classList.remove('elementor-invisible');
      });
      return;
    }

    const observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          const el = entry.target;
          let anim = 'fadeIn';
          let delay = 0;

          try {
            const rawSettings = el.getAttribute('data-settings');
            if (rawSettings) {
              const settings = JSON.parse(rawSettings);
              anim = settings._animation || settings.animation || 'fadeIn';
              delay = settings._animation_delay || settings.animation_delay || 0;
            }
          } catch (e) {
            // default
          }

          if (anim === 'none') {
            el.classList.remove('elementor-invisible');
          } else {
            setTimeout(function () {
              el.classList.remove('elementor-invisible');
              el.classList.add('animated', anim);
            }, delay);
          }

          observer.unobserve(el);
        }
      });
    }, {
      root: null,
      rootMargin: '0px 0px -40px 0px',
      threshold: 0.1
    });

    animElements.forEach(function (el) {
      observer.observe(el);
    });
  }

  // 9. Motion FX Scroll Effects (e.g. Spinning Rubik's Cube, Parallax Float)
  function initMotionEffects() {
    const motionNodes = [];
    const elements = document.querySelectorAll('[data-settings*="motion_fx_motion_fx_scrolling"]');

    elements.forEach(function (el) {
      try {
        const raw = el.getAttribute('data-settings');
        if (!raw) return;
        const s = JSON.parse(raw);
        if (s.motion_fx_motion_fx_scrolling !== 'yes') return;

        const target = el.querySelector('.elementor-widget-container') || el;
        motionNodes.push({
          el: el,
          target: target,
          settings: s
        });
      } catch (e) {
        // ignore parse errors
      }
    });

    if (motionNodes.length === 0) return;

    let ticking = false;

    function updateMotion() {
      const windowHeight = window.innerHeight || document.documentElement.clientHeight;

      for (let i = 0; i < motionNodes.length; i++) {
        const node = motionNodes[i];
        const rect = node.el.getBoundingClientRect();

        // Check if in extended viewport
        if (rect.bottom < -200 || rect.top > windowHeight + 200) {
          continue;
        }

        // Calculate scroll percentage through the element (0% at bottom enter to 100% at top leave)
        const totalDistance = windowHeight + rect.height;
        const currentProgress = windowHeight - rect.top;
        const percent = Math.min(100, Math.max(0, (currentProgress / totalDistance) * 100));

        const s = node.settings;
        const transforms = [];

        // 1. RotateZ (Rubik's cube spin)
        if (s.motion_fx_rotateZ_effect === 'yes') {
          const speed = (s.motion_fx_rotateZ_speed && typeof s.motion_fx_rotateZ_speed.size === 'number') ? s.motion_fx_rotateZ_speed.size : 1;
          const dir = s.motion_fx_rotateZ_direction === 'negative' ? -1 : 1;
          const deg = (percent - 50) * speed * 2.5 * dir;
          transforms.push('rotateZ(' + deg.toFixed(2) + 'deg)');
          node.target.style.setProperty('--rotateZ', deg.toFixed(2) + 'deg');
        }

        // 2. TranslateY (Parallax float)
        if (s.motion_fx_translateY_effect === 'yes') {
          const speed = (s.motion_fx_translateY_speed && typeof s.motion_fx_translateY_speed.size === 'number') ? s.motion_fx_translateY_speed.size : 1;
          const dir = s.motion_fx_translateY_direction === 'negative' ? -1 : 1;
          let translateY = -(percent - 50) * speed * dir;

          // Specifically calibrate card circular images to maintain elegant containment
          const isCardImage = node.el.classList.contains('elementor-element-d31e846') ||
                              node.el.classList.contains('elementor-element-a143529') ||
                              node.el.classList.contains('elementor-element-b37283d') ||
                              (node.el.closest && node.el.closest('.e-con-child'));

          if (isCardImage) {
            // Constrain movement so the circle stays gently within the card bounds
            translateY = Math.max(-10, Math.min(10, -(percent - 50) * 0.2 * dir));
          }

          transforms.push('translateY(' + translateY.toFixed(2) + 'px)');
          node.target.style.setProperty('--translateY', translateY.toFixed(2) + 'px');
        }

        // 3. TranslateX
        if (s.motion_fx_translateX_effect === 'yes') {
          const speed = (s.motion_fx_translateX_speed && typeof s.motion_fx_translateX_speed.size === 'number') ? s.motion_fx_translateX_speed.size : 1;
          const dir = s.motion_fx_translateX_direction === 'negative' ? -1 : 1;
          const translateX = -(percent - 50) * speed * dir;
          transforms.push('translateX(' + translateX.toFixed(2) + 'px)');
          node.target.style.setProperty('--translateX', translateX.toFixed(2) + 'px');
        }

        // 4. Scale
        if (s.motion_fx_scale_effect === 'yes') {
          const speed = (s.motion_fx_scale_speed && typeof s.motion_fx_scale_speed.size === 'number') ? s.motion_fx_scale_speed.size : 1;
          const scale = Math.max(0.2, 1 + ((percent - 50) / 50) * (speed * 0.15));
          transforms.push('scale(' + scale.toFixed(3) + ')');
        }

        // 5. Opacity
        if (s.motion_fx_opacity_effect === 'yes') {
          const level = (s.motion_fx_opacity_level && typeof s.motion_fx_opacity_level.size === 'number') ? s.motion_fx_opacity_level.size / 10 : 1;
          let op = 1;
          if (s.motion_fx_opacity_direction === 'out-in') {
            op = Math.min(1, Math.max(0, 1 - Math.abs(percent - 50) / 50 * level));
          } else {
            op = Math.min(1, Math.max(0, (percent / 100) * level));
          }
          node.target.style.opacity = op.toFixed(2);
        }

        if (transforms.length > 0) {
          node.target.style.transform = transforms.join(' ');
          node.target.style.willChange = 'transform';
        }
      }

      ticking = false;
    }

    function onScroll() {
      if (!ticking) {
        requestAnimationFrame(updateMotion);
        ticking = true;
      }
    }

    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll, { passive: true });
    // Initial call
    updateMotion();
  }

  // Run on DOM Ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bootstrap);
  } else {
    bootstrap();
  }

  function bootstrap() {
    initSmoothScroll();
    initMobileMenu();
    initAccordions();
    initGalleryLightbox();
    initCarousels();
    initContactForm();
    initBackgroundVideo();
    initAppearAnimations();
    initMotionEffects();
  }
})();
