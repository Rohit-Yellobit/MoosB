/**
 * Native Interactive Counterparts & Mentalist Dynamic Photo Experience
 * Replaces heavy WordPress/Elementor runtime & Webpack chunk loaders
 * with clean, dependency-free HTML5/ES6 implementations and live Google Drive synchronization.
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

    // Close on click outside
    document.addEventListener('click', function (e) {
      if (!e.target.closest('.elementor-widget-nav-menu')) {
        document.querySelectorAll('.elementor-nav-menu--dropdown.elementor-active').forEach(function (dropdown) {
          dropdown.classList.remove('elementor-active');
          dropdown.setAttribute('aria-hidden', 'true');
          dropdown.style.display = 'none';
        });
        document.querySelectorAll('.elementor-menu-toggle.elementor-active').forEach(function (toggle) {
          toggle.classList.remove('elementor-active');
          toggle.setAttribute('aria-expanded', 'false');
        });
      }
    });
  }

  // 3. Accordions / FAQ Toggles
  function initAccordions() {
    document.querySelectorAll('.elementor-accordion .elementor-tab-title').forEach(function (title) {
      title.addEventListener('click', function () {
        const container = this.closest('.elementor-accordion');
        const tabId = this.getAttribute('data-tab');
        const content = container ? container.querySelector('.elementor-tab-content[data-tab="' + tabId + '"]') : null;
        
        if (!content) return;
        const isOpen = this.classList.contains('elementor-active');
        
        // Close others in this accordion if exclusive mode
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

  // 4. Luxury Mentalist Dynamic Gallery & Video Theatre (Google Drive + Local Sync)
  function initDynamicMentalistGallery() {
    // Inject custom CSS styling for mentalist luxury gallery & lightbox
    if (!document.getElementById('mentalist-gallery-custom-styles')) {
      const style = document.createElement('style');
      style.id = 'mentalist-gallery-custom-styles';
      style.textContent = `
        /* Gallery Container with Atmospheric Stage Spotlight & Dynamic Mind-Waves Aurora */
        .elementor-element-86da493 {
          position: relative !important;
          overflow: hidden !important;
          background: radial-gradient(ellipse 90% 60% at 50% 20%, #141b26 0%, #0b0f16 45%, #05070a 100%) !important;
        }

        /* Ambient Canvas Backdrop */
        #moosb-aurora-canvas {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          pointer-events: none;
          z-index: 1;
          opacity: 0.95;
        }

        /* Ambient Subtle Stage Spotlight */
        .moosb-stage-spotlight {
          position: absolute;
          top: -15%;
          left: 50%;
          transform: translateX(-50%);
          width: 130%;
          height: 900px;
          background: radial-gradient(ellipse 60% 45% at 50% 0%, rgba(243, 223, 186, 0.22) 0%, rgba(197, 155, 104, 0.08) 45%, transparent 75%);
          pointer-events: none;
          z-index: 2;
          animation: moosbSpotlightBreathe 9s ease-in-out infinite alternate;
        }

        /* Subtle Cinema Texture Mesh */
        .moosb-cinema-mesh {
          position: absolute;
          inset: 0;
          background-image: radial-gradient(rgba(243, 223, 186, 0.08) 1px, transparent 1px);
          background-size: 28px 28px;
          pointer-events: none;
          z-index: 2;
          opacity: 0.45;
        }

        @keyframes moosbSpotlightBreathe {
          0% { opacity: 0.75; transform: translateX(-50%) scaleY(1); }
          50% { opacity: 1; transform: translateX(-50%) scaleY(1.15); }
          100% { opacity: 0.8; transform: translateX(-50%) scaleY(0.95); }
        }

        /* Mentalist Gallery Container & Controls */
        .moosb-mentalist-gallery-wrapper {
          width: 100%;
          max-width: 1240px;
          margin: 0 auto;
          padding: 20px 16px 40px;
          box-sizing: border-box;
          position: relative;
          z-index: 10;
        }

        .moosb-gallery-header-tabs {
          display: flex;
          flex-wrap: wrap;
          justify-content: center;
          align-items: center;
          gap: 12px;
          margin-bottom: 36px;
        }

        .moosb-filter-pill {
          background: rgba(18, 22, 30, 0.7);
          border: 1px solid rgba(197, 155, 104, 0.28);
          color: #d1d5db;
          font-family: inherit;
          font-size: 14px;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          padding: 10px 22px;
          border-radius: 9999px;
          cursor: pointer;
          transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
          backdrop-filter: blur(10px);
          user-select: none;
          display: inline-flex;
          align-items: center;
          gap: 8px;
        }

        .moosb-filter-pill:hover,
        .moosb-filter-pill.active {
          background: linear-gradient(135deg, rgba(197, 155, 104, 0.95), rgba(168, 126, 75, 0.9));
          color: #0b0f17;
          border-color: #f3dfba;
          box-shadow: 0 8px 24px rgba(197, 155, 104, 0.35);
          transform: translateY(-2px);
          font-weight: 600;
        }

        .moosb-filter-badge {
          font-size: 11px;
          padding: 2px 7px;
          border-radius: 999px;
          background: rgba(0, 0, 0, 0.35);
          color: inherit;
        }
        .moosb-filter-pill.active .moosb-filter-badge {
          background: rgba(0, 0, 0, 0.2);
          color: #000;
        }

        /* 3D Asymmetrical Deck Bento Grid */
        .moosb-gallery-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          grid-auto-flow: dense;
          gap: 22px;
          perspective: 1200px;
        }

        @media (max-width: 1024px) {
          .moosb-gallery-grid {
            grid-template-columns: repeat(2, 1fr);
            gap: 16px;
          }
        }
        @media (max-width: 640px) {
          .moosb-gallery-grid {
            grid-template-columns: 1fr;
            gap: 16px;
          }
        }

        /* Mentalist Photo & Video Card */
        .moosb-card {
          position: relative;
          border-radius: 14px;
          overflow: hidden;
          background: #0d1117;
          border: 1px solid rgba(197, 155, 104, 0.2);
          box-shadow: 0 16px 36px rgba(0, 0, 0, 0.45);
          cursor: pointer;
          transition: transform 0.45s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.45s cubic-bezier(0.16, 1, 0.3, 1), border-color 0.45s ease;
          aspect-ratio: 4 / 3;
          transform-style: preserve-3d;
          will-change: transform;
        }

        .moosb-card.featured-card {
          grid-column: span 2;
          aspect-ratio: 16 / 9;
        }

        @media (max-width: 640px) {
          .moosb-card.featured-card {
            grid-column: span 1;
            aspect-ratio: 4 / 3;
          }
        }

        .moosb-card:hover {
          border-color: rgba(243, 223, 186, 0.7);
          box-shadow: 0 24px 50px rgba(0, 0, 0, 0.65), 0 0 30px rgba(197, 155, 104, 0.3);
          transform: translateY(-6px) scale(1.015);
        }

        .moosb-card-img-wrapper {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          overflow: hidden;
        }

        .moosb-card-img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          object-position: center;
          transition: transform 0.8s cubic-bezier(0.16, 1, 0.3, 1), filter 0.8s ease;
          filter: grayscale(12%) contrast(105%) brightness(0.95);
        }

        .moosb-card:hover .moosb-card-img {
          transform: scale(1.08);
          filter: grayscale(0%) contrast(110%) brightness(1.05);
        }

        /* Ambient Dynamic Specular Spotlight */
        .moosb-card-sheen {
          position: absolute;
          inset: 0;
          pointer-events: none;
          background: radial-gradient(circle at 50% 50%, rgba(255, 230, 180, 0.22) 0%, rgba(0, 0, 0, 0) 70%);
          opacity: 0;
          transition: opacity 0.4s ease;
          mix-blend-mode: screen;
        }
        .moosb-card:hover .moosb-card-sheen {
          opacity: 1;
        }

        /* Card Shutter Overlay & Typography */
        .moosb-card-overlay {
          position: absolute;
          inset: 0;
          background: linear-gradient(180deg, rgba(0,0,0,0) 40%, rgba(0,0,0,0.85) 100%);
          display: flex;
          flex-direction: column;
          justify-content: flex-end;
          padding: 20px;
          box-sizing: border-box;
          transition: background 0.3s ease;
          z-index: 2;
        }

        .moosb-card-tag {
          align-self: flex-start;
          font-size: 11px;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: #f3dfba;
          background: rgba(0, 0, 0, 0.6);
          border: 1px solid rgba(197, 155, 104, 0.4);
          padding: 3px 10px;
          border-radius: 999px;
          margin-bottom: 6px;
          backdrop-filter: blur(6px);
        }

        .moosb-card-title {
          font-size: 16px;
          font-weight: 600;
          color: #ffffff;
          margin: 0;
          letter-spacing: 0.02em;
          text-shadow: 0 2px 6px rgba(0,0,0,0.8);
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }

        /* Play Button for Video Portals */
        .moosb-play-pulse-btn {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: 58px;
          height: 58px;
          border-radius: 50%;
          background: rgba(15, 20, 28, 0.85);
          border: 2px solid #f3dfba;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #f3dfba;
          box-shadow: 0 0 24px rgba(197, 155, 104, 0.5);
          transition: all 0.3s ease;
          z-index: 3;
        }

        .moosb-play-pulse-btn svg {
          width: 22px;
          height: 22px;
          fill: currentColor;
          margin-left: 3px;
        }

        .moosb-card:hover .moosb-play-pulse-btn {
          transform: translate(-50%, -50%) scale(1.15);
          background: #f3dfba;
          color: #0b0f17;
          box-shadow: 0 0 35px rgba(243, 223, 186, 0.8);
        }

        /* Unified Fullscreen Darkroom Lightbox & Video Cinema */
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
          background: rgba(6, 8, 12, 0.94);
          backdrop-filter: blur(12px);
        }
        .nlb-container {
          position: relative;
          z-index: 2;
          width: 90vw;
          max-width: 1200px;
          max-height: 90vh;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
        }
        .nlb-media-wrapper {
          position: relative;
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          max-height: 78vh;
        }
        .nlb-image {
          max-width: 100%;
          max-height: 78vh;
          object-fit: contain;
          border-radius: 8px;
          border: 1px solid rgba(197, 155, 104, 0.3);
          box-shadow: 0 25px 50px rgba(0,0,0,0.8);
          user-select: none;
        }
        .nlb-video-frame {
          width: 100%;
          aspect-ratio: 16 / 9;
          max-height: 78vh;
          border-radius: 8px;
          border: 1px solid rgba(197, 155, 104, 0.3);
          box-shadow: 0 25px 50px rgba(0,0,0,0.8);
        }
        .nlb-caption-box {
          margin-top: 14px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          width: 100%;
          max-width: 800px;
          padding: 0 10px;
        }
        .nlb-caption {
          color: #f3dfba;
          font-size: 15px;
          font-weight: 500;
          letter-spacing: 0.03em;
        }
        .nlb-counter {
          color: #9ca3af;
          font-size: 13px;
          letter-spacing: 0.1em;
        }
        .nlb-close, .nlb-prev, .nlb-next {
          position: fixed;
          background: rgba(22, 28, 38, 0.85);
          border: 1px solid rgba(197, 155, 104, 0.3);
          color: #f3dfba;
          border-radius: 50%;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.25s ease;
          z-index: 10;
        }
        .nlb-close:hover, .nlb-prev:hover, .nlb-next:hover {
          background: #f3dfba;
          color: #0b0f17;
          box-shadow: 0 0 20px rgba(197, 155, 104, 0.6);
        }
        .nlb-close {
          top: 24px;
          right: 28px;
          width: 46px;
          height: 46px;
          font-size: 28px;
        }
        .nlb-prev, .nlb-next {
          top: 50%;
          transform: translateY(-50%);
          width: 52px;
          height: 52px;
          font-size: 24px;
        }
        .nlb-prev { left: 24px; }
        .nlb-next { right: 24px; }
        @media (max-width: 640px) {
          .nlb-prev { left: 10px; width: 40px; height: 40px; font-size: 18px; }
          .nlb-next { right: 10px; width: 40px; height: 40px; font-size: 18px; }
          .nlb-close { top: 16px; right: 16px; width: 40px; height: 40px; font-size: 22px; }
        }
      `;
      document.head.appendChild(style);
    }

    // Modal DOM instantiation
    let modal = document.getElementById('native-lightbox-modal');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'native-lightbox-modal';
      modal.innerHTML = `
        <div class="nlb-backdrop"></div>
        <div class="nlb-container">
          <button class="nlb-close" aria-label="Close">&times;</button>
          <button class="nlb-prev" aria-label="Previous">&#10094;</button>
          <div class="nlb-media-wrapper">
            <img class="nlb-image" src="" alt="" style="display:none;" />
            <iframe class="nlb-video-frame" src="" frameborder="0" allow="autoplay; encrypted-media; picture-in-picture" allowfullscreen style="display:none;"></iframe>
          </div>
          <div class="nlb-caption-box">
            <div class="nlb-caption"></div>
            <div class="nlb-counter"></div>
          </div>
          <button class="nlb-next" aria-label="Next">&#10095;</button>
        </div>
      `;
      document.body.appendChild(modal);
    }

    const nlbImg = modal.querySelector('.nlb-image');
    const nlbFrame = modal.querySelector('.nlb-video-frame');
    const nlbCaption = modal.querySelector('.nlb-caption');
    const nlbCounter = modal.querySelector('.nlb-counter');

    let allGalleryItems = [];
    let activeFilter = 'all';
    let currentLightboxIndex = 0;

    // Audience Testimonial YouTube video collection
    const audienceVideos = [
      { id: 'tOaPunbvVKc', title: 'Astounded Minds: Celebrity & Audience Reaction' },
      { id: '_IOLhQPdAms', title: 'Unbelievable Telepathy: Live Crowd Moments' },
      { id: '-ZDGRQNuzFg', title: 'Speechless: Corporate Gala Performance' },
      { id: 'sJrIlTcyaLA', title: 'Pure Magic: Unfiltered Spectator Awe' },
      { id: 'kJGpEnEJ8qU', title: 'Mind Reading Climax: Audience Testimonials' },
      { id: 'S19mgIfEJjk', title: 'Instant Astonishment: Live Event Magic' },
      { id: 'GbMR9JlXs8s', title: 'Behind the Mystery: Spectator Voices' },
      { id: 'SHiMhq9QQJw', title: 'Unforgettable Experience: Global Audience Reflections' }
    ];

    // Build the container if in index page
    const audienceSection = document.getElementById('gallm');
    const loveSection = document.querySelector('.elementor-element-86da493');
    
    // Target insertion container
    const targetMount = document.querySelector('.elementor-element-996e653') || (loveSection ? loveSection.querySelector('.e-con-inner') : null) || audienceSection;

    if (!targetMount) return;

    // Fetch dynamic photos from /api/gallery (Google Drive Folder)
    fetch('/api/gallery')
      .then(function (res) { return res.json(); })
      .then(function (data) {
        let drivePhotos = (data && data.items) ? data.items : [];
        renderUnifiedMentalistGallery(drivePhotos);
      })
      .catch(function (err) {
        console.warn('Google Drive Gallery API fallback:', err);
        renderUnifiedMentalistGallery([]);
      });

    function renderUnifiedMentalistGallery(driveItems) {
      allGalleryItems = [];

      // Curated mentalism thematic titles for photo moments (never using raw filenames)
      const audienceCaptions = [
        'Live Spectator Telepathy & Reaction',
        'Unfiltered Audience Astonishment',
        'Mind-Reading Moment in Real-Time',
        'Interactive Crowd Engagement',
        'Pure Gasps & Disbelief',
        'Corporate Gala Wonder',
        'Collective Mind Illusion'
      ];

      const stageCaptions = [
        'Stage Illusion & Psychological Artistry',
        'The Art of Prestidigitation',
        'Direct Thought Projection',
        'Centerstage Hypnotic Mystery',
        'Grand Stage Climax',
        'Uncanny Mental Phenomenon',
        'The Illusionist in Motion'
      ];

      // Add Drive / Dynamic Photos
      driveItems.forEach(function (photo, i) {
        const isAudience = (i % 2 === 0);
        const captionList = isAudience ? audienceCaptions : stageCaptions;
        const caption = captionList[i % captionList.length];
        const tag = isAudience ? 'Audience Awe' : 'Stage Illusion';

        allGalleryItems.push({
          type: 'photo',
          category: isAudience ? 'audience' : 'stage',
          src: photo.url,
          thumb: photo.thumbnailUrl || photo.url,
          caption: caption,
          tag: tag,
          isFeatured: (i === 0 || i === 7)
        });
      });

      // Add Local Existing Photos if Drive had fewer items
      if (allGalleryItems.length < 15) {
        const localImgList = [
          'moosb_2.webp', 'gall_19.webp', 'gall_5.webp', 'gall_17.webp',
          'gall_8.webp', 'gall_13.webp', 'gall_12.webp', 'gall_16.webp',
          'gall_2.webp', 'gall_15.webp', 'gall_3.webp', 'gall_9.webp',
          'moosb_8.webp', 'gall_14.webp', 'gall_18.webp', 'gall_11.webp',
          'gall_10.webp', 'gall_7.webp', 'gall_6.webp', 'moosb_7.webp',
          'gall_4.webp', 'gall_1.webp', 'moosb_10.webp', 'moosb_4.webp'
        ];
        localImgList.forEach(function (file, idx) {
          const isAudience = (idx % 2 === 0);
          const captionList = isAudience ? audienceCaptions : stageCaptions;
          const caption = captionList[idx % captionList.length];
          const tag = isAudience ? 'Audience Wonder' : 'Mind & Mystery';

          allGalleryItems.push({
            type: 'photo',
            category: isAudience ? 'audience' : 'stage',
            src: `/assets/images/gallery/${file}`,
            thumb: `/assets/images/gallery/${file}`,
            caption: caption,
            tag: tag,
            isFeatured: (idx === 0 || idx === 6)
          });
        });
      }

      // Add Videos
      audienceVideos.forEach(function (vid, idx) {
        allGalleryItems.push({
          type: 'video',
          category: 'videos',
          videoId: vid.id,
          src: `https://www.youtube.com/embed/${vid.id}?autoplay=1`,
          thumb: `https://img.youtube.com/vi/${vid.id}/hqdefault.jpg`,
          caption: vid.title,
          tag: 'Video Testimonial',
          isFeatured: (idx === 0)
        });
      });

      // Render custom gallery container
      let galleryWrapper = document.getElementById('moosb-mentalist-gallery');
      if (!galleryWrapper) {
        galleryWrapper = document.createElement('div');
        galleryWrapper.id = 'moosb-mentalist-gallery';
        galleryWrapper.className = 'moosb-mentalist-gallery-wrapper';

        // Clear existing empty elementor video placeholders & hide orphaned section
        const emptyVideoContainer = document.querySelector('.elementor-element-0634999');
        if (emptyVideoContainer) {
          emptyVideoContainer.style.display = 'none';
        }
        const orphanedSection = document.querySelector('.elementor-element-568654c');
        if (orphanedSection) {
          orphanedSection.style.display = 'none';
        }

        // Ensure gallery container has anchor ID for navigation
        const galleryParent = document.querySelector('.elementor-element-86da493');
        if (galleryParent && !galleryParent.id) {
          galleryParent.id = 'gallm';
        }

        // Harmonize section heading
        const headingWidget = document.querySelector('.elementor-element-858c4bc .elementor-widget-container');
        if (headingWidget) {
          headingWidget.innerHTML = `
            <div style="text-align: center; max-width: 860px; margin: 0 auto 32px; padding: 0 16px;">
              <h2 class="elementor-heading-title" style="font-size: 38px; color: #f3dfba; margin-bottom: 14px; font-weight: 700; letter-spacing: -0.02em; line-height: 1.2;">What audience reflects</h2>
              <p style="color: #d1d5db; font-size: 16px; line-height: 1.6; margin: 0; font-weight: 400;">The goal is to create unforgettable experiences that leave lasting impressions. In this section, you'll hear directly from audience as they share their thoughts and reactions. Their reflections capture the wonder, surprise, and connection together.</p>
            </div>
          `;
        }

        // Insert wrapper cleanly
        targetMount.innerHTML = '';
        targetMount.appendChild(galleryWrapper);

        // Mount animated Mind-Waves & Stage Spotlight engine on the section container
        const parentSec = document.querySelector('.elementor-element-86da493') || targetMount;
        if (parentSec && !parentSec.querySelector('#moosb-aurora-canvas')) {
          parentSec.style.position = 'relative';
          
          const canvas = document.createElement('canvas');
          canvas.id = 'moosb-aurora-canvas';
          
          const spotlight = document.createElement('div');
          spotlight.className = 'moosb-stage-spotlight';
          
          const mesh = document.createElement('div');
          mesh.className = 'moosb-cinema-mesh';

          parentSec.insertBefore(mesh, parentSec.firstChild);
          parentSec.insertBefore(spotlight, parentSec.firstChild);
          parentSec.insertBefore(canvas, parentSec.firstChild);

          // Clean up any lingering flying cards layer
          const oldCardsLayer = parentSec.querySelector('.moosb-flying-cards-layer');
          if (oldCardsLayer) oldCardsLayer.remove();

          initAuroraMindWaves(canvas, parentSec);
        }
      }

      // Filter tabs counts
      const photoCount = allGalleryItems.filter(function (it) { return it.type === 'photo'; }).length;
      const videoCount = allGalleryItems.filter(function (it) { return it.type === 'video'; }).length;

      galleryWrapper.innerHTML = `
        <div class="moosb-gallery-header-tabs">
          <button class="moosb-filter-pill active" data-filter="all">
            All Moments <span class="moosb-filter-badge">${allGalleryItems.length}</span>
          </button>
          <button class="moosb-filter-pill" data-filter="audience">
            Audience Awe <span class="moosb-filter-badge">${allGalleryItems.filter(function(i){return i.category==='audience';}).length}</span>
          </button>
          <button class="moosb-filter-pill" data-filter="stage">
            Stage Illusions <span class="moosb-filter-badge">${allGalleryItems.filter(function(i){return i.category==='stage';}).length}</span>
          </button>
          <button class="moosb-filter-pill" data-filter="videos">
            Video Testimonials <span class="moosb-filter-badge">${videoCount}</span>
          </button>
        </div>

        <div class="moosb-gallery-grid" id="moosb-grid-inner"></div>
      `;

      // Filter pill interaction
      galleryWrapper.querySelectorAll('.moosb-filter-pill').forEach(function (btn) {
        btn.addEventListener('click', function () {
          galleryWrapper.querySelectorAll('.moosb-filter-pill').forEach(function (b) { b.classList.remove('active'); });
          this.classList.add('active');
          activeFilter = this.getAttribute('data-filter');
          renderCards();
        });
      });

      renderCards();
    }

    function renderCards() {
      const grid = document.getElementById('moosb-grid-inner');
      if (!grid) return;
      grid.innerHTML = '';

      const filtered = allGalleryItems.filter(function (item) {
        if (activeFilter === 'all') return true;
        if (activeFilter === 'videos') return item.type === 'video';
        return item.category === activeFilter;
      });

      filtered.forEach(function (item, idx) {
        const card = document.createElement('div');
        card.className = 'moosb-card' + (item.isFeatured ? ' featured-card' : '');
        card.setAttribute('data-index', idx);

        let innerHTML = `
          <div class="moosb-card-img-wrapper">
            <img class="moosb-card-img" src="${item.thumb}" alt="${item.caption}" loading="lazy" />
            <div class="moosb-card-sheen"></div>
          </div>
          <div class="moosb-card-overlay">
            <span class="moosb-card-tag">${item.tag}</span>
            <h4 class="moosb-card-title">${item.caption}</h4>
          </div>
        `;

        if (item.type === 'video') {
          innerHTML += `
            <div class="moosb-play-pulse-btn" aria-label="Play Video">
              <svg viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
            </div>
          `;
        }

        card.innerHTML = innerHTML;

        // 3D Tilt Physics on mouse move
        card.addEventListener('mousemove', function (e) {
          const rect = card.getBoundingClientRect();
          const x = e.clientX - rect.left;
          const y = e.clientY - rect.top;
          const centerX = rect.width / 2;
          const centerY = rect.height / 2;
          const rotateX = ((y - centerY) / centerY) * -7;
          const rotateY = ((x - centerX) / centerX) * 7;

          card.style.transform = `perspective(1000px) rotateX(${rotateX.toFixed(2)}deg) rotateY(${rotateY.toFixed(2)}deg) translateY(-6px) scale(1.02)`;

          const sheen = card.querySelector('.moosb-card-sheen');
          if (sheen) {
            sheen.style.background = `radial-gradient(circle at ${(x / rect.width) * 100}% ${(y / rect.height) * 100}%, rgba(255, 230, 180, 0.3) 0%, rgba(0, 0, 0, 0) 70%)`;
          }
        });

        card.addEventListener('mouseleave', function () {
          card.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg) translateY(0px) scale(1)';
        });

        // Click to open Lightbox
        card.addEventListener('click', function () {
          openUnifiedLightbox(filtered, idx);
        });

        grid.appendChild(card);
      });
    }

    function openUnifiedLightbox(items, index) {
      if (!items || items.length === 0) return;
      currentLightboxIndex = (index + items.length) % items.length;
      const cur = items[currentLightboxIndex];

      if (cur.type === 'video') {
        nlbImg.style.display = 'none';
        nlbFrame.style.display = 'block';
        nlbFrame.src = `https://www.youtube-nocookie.com/embed/${cur.videoId}?autoplay=1&rel=0&modestbranding=1`;
      } else {
        nlbFrame.style.display = 'none';
        nlbFrame.src = '';
        nlbImg.style.display = 'block';
        nlbImg.src = cur.src;
      }

      nlbCaption.textContent = cur.caption || cur.tag || 'Moos B • Live Experience';
      nlbCounter.textContent = `${currentLightboxIndex + 1} / ${items.length}`;

      modal.classList.add('nlb-active');
      document.body.style.overflow = 'hidden';

      // Rebind navigation
      modal.querySelector('.nlb-prev').onclick = function () { openUnifiedLightbox(items, currentLightboxIndex - 1); };
      modal.querySelector('.nlb-next').onclick = function () { openUnifiedLightbox(items, currentLightboxIndex + 1); };
    }

    function closeUnifiedLightbox() {
      modal.classList.remove('nlb-active');
      nlbFrame.src = '';
      document.body.style.overflow = '';
    }

    modal.querySelector('.nlb-close').onclick = closeUnifiedLightbox;
    modal.querySelector('.nlb-backdrop').onclick = closeUnifiedLightbox;

    document.addEventListener('keydown', function (e) {
      if (!modal.classList.contains('nlb-active')) return;
      if (e.key === 'Escape') closeUnifiedLightbox();
      if (e.key === 'ArrowLeft') modal.querySelector('.nlb-prev').click();
      if (e.key === 'ArrowRight') modal.querySelector('.nlb-next').click();
    });
  }

  // Dedicated 60FPS Mind-Waves Aurora & Floating Celestial Stardust Engine
  function initAuroraMindWaves(canvas, container) {
    if (!canvas || !canvas.getContext) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = 0;
    let height = 0;
    let mouseX = -1000;
    let mouseY = -1000;
    let mouseActive = false;
    let mouseTimer = null;

    // Responsive Canvas Resizing
    function resize() {
      const rect = container.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      width = rect.width || container.clientWidth || window.innerWidth;
      height = Math.max(700, rect.height || container.clientHeight || 900);

      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      canvas.style.width = width + 'px';
      canvas.style.height = height + 'px';
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.scale(dpr, dpr);
    }

    // Floating Stardust particles
    const particles = [];
    const particleCount = 55;
    for (let i = 0; i < particleCount; i++) {
      particles.push({
        x: Math.random() * (window.innerWidth || 1200),
        y: Math.random() * 1200,
        radius: Math.random() * 2.2 + 0.8,
        vx: (Math.random() - 0.5) * 0.35,
        vy: -(Math.random() * 0.45 + 0.2),
        baseAlpha: Math.random() * 0.5 + 0.35,
        pulseSpeed: Math.random() * 0.03 + 0.015,
        pulseOffset: Math.random() * Math.PI * 2,
        isGold: Math.random() > 0.3
      });
    }

    // Dynamic Aurora Fluid Blob Centers
    const blobs = [
      { xFactor: 0.22, yFactor: 0.22, r: 480, color1: 'rgba(243, 223, 186, 0.25)', color2: 'rgba(197, 155, 104, 0.1)', speed: 0.0008, phase: 0 },
      { xFactor: 0.78, yFactor: 0.38, r: 520, color1: 'rgba(217, 119, 6, 0.2)', color2: 'rgba(124, 58, 237, 0.14)', speed: 0.0006, phase: 2.4 },
      { xFactor: 0.3, yFactor: 0.75, r: 480, color1: 'rgba(243, 223, 186, 0.18)', color2: 'rgba(30, 41, 59, 0.25)', speed: 0.0007, phase: 4.1 },
      { xFactor: 0.82, yFactor: 0.85, r: 420, color1: 'rgba(197, 155, 104, 0.18)', color2: 'rgba(147, 51, 234, 0.12)', speed: 0.0009, phase: 1.5 }
    ];

    container.addEventListener('mousemove', function (e) {
      const rect = container.getBoundingClientRect();
      mouseX = e.clientX - rect.left;
      mouseY = e.clientY - rect.top;
      mouseActive = true;
      clearTimeout(mouseTimer);
      mouseTimer = setTimeout(function () {
        mouseActive = false;
      }, 2500);
    });

    container.addEventListener('mouseleave', function () {
      mouseActive = false;
    });

    resize();

    if (window.ResizeObserver) {
      const ro = new ResizeObserver(function () {
        resize();
      });
      ro.observe(container);
    } else {
      window.addEventListener('resize', resize);
    }

    let isVisible = true;
    if (window.IntersectionObserver) {
      const io = new IntersectionObserver(function (entries) {
        isVisible = entries[0].isIntersecting;
      }, { threshold: 0 });
      io.observe(container);
    }

    let time = 0;

    function render() {
      if (!isVisible) {
        requestAnimationFrame(render);
        return;
      }

      time += 1;
      ctx.clearRect(0, 0, width, height);

      // 1. Render Liquid Aurora Blobs with morphing radial gradients
      blobs.forEach(function (blob) {
        const driftX = Math.sin(time * blob.speed + blob.phase) * (width * 0.14);
        const driftY = Math.cos(time * blob.speed * 0.85 + blob.phase) * (height * 0.09);
        const cx = width * blob.xFactor + driftX;
        const cy = height * blob.yFactor + driftY;
        const radius = blob.r + Math.sin(time * 0.003 + blob.phase) * 50;

        const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, Math.max(10, radius));
        grad.addColorStop(0, blob.color1);
        grad.addColorStop(0.5, blob.color2);
        grad.addColorStop(1, 'rgba(0, 0, 0, 0)');

        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(cx, cy, radius, 0, Math.PI * 2);
        ctx.fill();
      });

      // 2. Telepathy Cursor Halo when mouse is active in section
      if (mouseActive && mouseX >= 0 && mouseY >= 0) {
        const cursorGrad = ctx.createRadialGradient(mouseX, mouseY, 0, mouseX, mouseY, 300);
        cursorGrad.addColorStop(0, 'rgba(243, 223, 186, 0.18)');
        cursorGrad.addColorStop(0.5, 'rgba(197, 155, 104, 0.06)');
        cursorGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = cursorGrad;
        ctx.beginPath();
        ctx.arc(mouseX, mouseY, 300, 0, Math.PI * 2);
        ctx.fill();
      }

      // 3. Floating Stardust Particles
      const isMobile = width <= 768;
      particles.forEach(function (p) {
        p.x += p.vx;
        p.y += p.vy;

        // Reset if floats off-top or sides
        if (p.y < -10) {
          p.y = height + 10;
          p.x = Math.random() * width;
        }
        if (p.x < -10) p.x = width + 10;
        if (p.x > width + 10) p.x = -10;

        // Gentle cursor deflection
        if (mouseActive) {
          const dx = p.x - mouseX;
          const dy = p.y - mouseY;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 140 && dist > 0) {
            p.x += (dx / dist) * 1.5;
            p.y += (dy / dist) * 1.5;
          }
        }

        const pulse = Math.sin(time * p.pulseSpeed + p.pulseOffset);
        const currentAlpha = Math.max(0.12, p.baseAlpha + pulse * 0.28);

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = p.isGold
          ? `rgba(243, 223, 186, ${currentAlpha})`
          : `rgba(255, 255, 255, ${currentAlpha * 0.85})`;
        if (!isMobile) {
          ctx.shadowColor = p.isGold ? 'rgba(243, 223, 186, 0.7)' : 'rgba(255, 255, 255, 0.5)';
          ctx.shadowBlur = 8;
        }
        ctx.fill();
        ctx.shadowBlur = 0;
      });

      requestAnimationFrame(render);
    }

    render();
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
        formData.forEach((value, key) => {
          data[key] = value;
        });

        // UI Loading state
        if (submitBtn) {
          submitBtn.disabled = true;
          submitBtn.innerHTML = '<span style="display:inline-flex;align-items:center;gap:8px;"><svg style="animation:spin 1s linear infinite;width:16px;height:16px;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10" stroke-dasharray="32" stroke-dashoffset="12"></circle></svg> Sending Inquiry...</span>';
        }

        // Show feedback message container
        let msgBox = form.querySelector('.elementor-message');
        if (!msgBox) {
          msgBox = document.createElement('div');
          msgBox.className = 'elementor-message';
          msgBox.style.cssText = 'margin-top: 16px; padding: 14px 18px; border-radius: 8px; font-size: 14px; font-weight: 500; line-height: 1.5; transition: all 0.3s ease; text-align: center;';
          form.appendChild(msgBox);
        }

        try {
          const response = await fetch('/api/contact', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Accept': 'application/json'
            },
            body: JSON.stringify({ form_fields: data })
          });

          const result = await response.json();

          if (response.ok && result.success) {
            msgBox.className = 'elementor-message elementor-message-success';
            msgBox.style.cssText += 'background: rgba(16, 185, 129, 0.12); border: 1px solid rgba(16, 185, 129, 0.4); color: #34d399; display: block;';
            msgBox.innerHTML = `✨ <strong>Thank You!</strong> ${result.message || 'Your inquiry has been sent to Moos B. We will connect with you shortly.'}`;
            form.reset();
          } else {
            throw new Error(result.message || 'Submission failed');
          }
        } catch (err) {
          msgBox.className = 'elementor-message elementor-message-danger';
          msgBox.style.cssText += 'background: rgba(239, 68, 68, 0.12); border: 1px solid rgba(239, 68, 68, 0.4); color: #f87171; display: block;';
          msgBox.innerHTML = `⚠️ ${err.message || 'An error occurred. Please try again or reach out directly via call/WhatsApp at 8138833005.'}`;
        } finally {
          if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.innerHTML = originalBtnText;
          }
          if (msgBox) {
            msgBox.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
          }
        }
      });
    });
  }

  // 7. Background Video Embed Handler
  function initBackgroundVideo() {
    function extractYouTubeId(url) {
      if (!url) return null;
      const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
      const match = url.match(regExp);
      return (match && match[2].length === 11) ? match[2] : null;
    }

    // Inject dedicated responsive video CSS for cinematic hero & phone layout
    if (!document.getElementById('static-hero-video-styles')) {
      const style = document.createElement('style');
      style.id = 'static-hero-video-styles';
      style.textContent = `
        /* Desktop Hero Container */
        @media (min-width: 1025px) {
          .elementor-element-9bc5304 {
            display: flex !important;
            min-height: 100vh !important;
            min-height: 100dvh !important;
            padding: 80px 20px 40px 20px !important;
            justify-content: center !important;
            align-items: center !important;
            position: relative !important;
            overflow: hidden !important;
            box-sizing: border-box !important;
          }
          .elementor-element-befc627 {
            display: none !important;
          }
        }

        /* Mobile Hero Container */
        @media (max-width: 1024px) {
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

        /* Hero Container Universal */
        .elementor-element-9bc5304,
        .elementor-element-befc627 {
          position: relative !important;
          overflow: hidden !important;
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
    window.addEventListener('resize', resizeAllBackgroundVideos);
    window.addEventListener('orientationchange', resizeAllBackgroundVideos);
  }

  // 8. Viewport Intersection Animations (Fade-in-up, etc.)
  function initAppearAnimations() {
    if (!('IntersectionObserver' in window)) return;

    const animatedElements = document.querySelectorAll(
      '[data-settings*="animation"], .elementor-invisible, .animated-slow, .animated-fast'
    );

    const observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          const el = entry.target;
          el.classList.remove('elementor-invisible');
          el.classList.add('animated');

          // Extract animation name if present in data-settings
          const raw = el.getAttribute('data-settings');
          if (raw) {
            try {
              const s = JSON.parse(raw);
              if (s._animation) {
                el.classList.add(s._animation);
              }
            } catch (e) {}
          }

          observer.unobserve(el);
        }
      });
    }, {
      rootMargin: '0px 0px -50px 0px',
      threshold: 0.1
    });

    animatedElements.forEach(function (el) {
      observer.observe(el);
    });
  }

  // 9. Parallax & Continuous Motion Effects
  function initMotionEffects() {
    const motionNodes = [];

    document.querySelectorAll('[data-settings*="motion_fx_motion_fx_scrolling"]').forEach(function (el) {
      try {
        const raw = el.getAttribute('data-settings');
        if (!raw) return;
        const s = JSON.parse(raw);
        if (s.motion_fx_motion_fx_scrolling === 'yes') {
          // Find the widget container or direct element to apply transforms
          const target = el.querySelector('.elementor-widget-container') || el;
          motionNodes.push({ el: el, target: target, settings: s });
        }
      } catch (e) {}
    });

    if (motionNodes.length === 0) return;

    let ticking = false;

    function updateMotion() {
      const windowHeight = window.innerHeight;

      for (let i = 0; i < motionNodes.length; i++) {
        const node = motionNodes[i];
        const rect = node.el.getBoundingClientRect();

        // Calculate progress percentage (0 = entering bottom, 100 = leaving top)
        const totalDistance = windowHeight + rect.height;
        const currentDistance = windowHeight - rect.top;
        const progress = Math.max(0, Math.min(1, currentDistance / totalDistance));
        const percent = progress * 100;

        const s = node.settings;
        const transforms = [];

        // 1. RotateZ
        if (s.motion_fx_rotateZ_effect === 'yes') {
          const speed = (s.motion_fx_rotateZ_speed && typeof s.motion_fx_rotateZ_speed.size === 'number') ? s.motion_fx_rotateZ_speed.size : 1;
          const dir = s.motion_fx_rotateZ_direction === 'negative' ? -1 : 1;
          const deg = (percent - 50) * speed * dir * 0.2;
          transforms.push('rotate(' + deg.toFixed(2) + 'deg)');
        }

        // 2. TranslateY
        if (s.motion_fx_translateY_effect === 'yes') {
          const speed = (s.motion_fx_translateY_speed && typeof s.motion_fx_translateY_speed.size === 'number') ? s.motion_fx_translateY_speed.size : 1;
          const dir = s.motion_fx_translateY_direction === 'negative' ? -1 : 1;
          let translateY = -(percent - 50) * speed * dir * 0.8;

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
    initDynamicMentalistGallery();
    initCarousels();
    initContactForm();
    initBackgroundVideo();
    initAppearAnimations();
    initMotionEffects();
    initDynamicCopyrightYear();

    // Ensure any residual flying cards layer is completely cleared
    document.querySelectorAll('.moosb-flying-cards-layer').forEach(function (el) {
      el.remove();
    });
  }

  // Ensure copyright year is always dynamically current
  function initDynamicCopyrightYear() {
    const currentYear = new Date().getFullYear();
    const yearEl = document.getElementById('moosb-current-year');
    if (yearEl) {
      yearEl.textContent = currentYear;
    }
    document.querySelectorAll('.elementor-element-a68d72a p, .elementor-element-f96404b p').forEach(function(p) {
      if (p.textContent.includes('Copyright') || p.textContent.includes('All rights reserved')) {
        p.innerHTML = `Copyright © <span id="moosb-current-year">${currentYear}</span> MoosB. All rights reserved.`;
      }
    });
  }
})();
