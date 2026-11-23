// The Alpha Effect (TAE) — UI Rendering, Society Gate & Interactions

(function () {
  const engine = window.taeAudio;
  let currentIndex = 0;
  let activeFilter = 'All';

  const els = {
    introGate: document.getElementById('introGate'),
    enterSocietyBtn: document.getElementById('enterSocietyBtn'),
    themeToggle: document.getElementById('themeToggle'),
    themeWave: document.getElementById('themeWave'),
    audioVisualizer: document.getElementById('audioVisualizer'),
    floatingLyrics: document.getElementById('floatingLyrics'),
    lyricBubblesToggle: document.getElementById('lyricBubblesToggle'),
    navbar: document.getElementById('navbar'),
    mobileMenuBtn: document.getElementById('mobileMenuBtn'),
    mobileMenu: document.getElementById('mobileMenu'),
    filterBar: document.getElementById('filterBar'),
    releasesGrid: document.getElementById('releasesGrid'),
    visualsGrid: document.getElementById('visualsGrid'),
    playerArt: document.getElementById('playerArt'),
    playerTitle: document.getElementById('playerTitle'),
    playerMeta: document.getElementById('playerMeta'),
    togglePlayBtn: document.getElementById('togglePlayBtn'),
    playIcon: document.getElementById('playIcon'),
    pauseIcon: document.getElementById('pauseIcon'),
    prevTrackBtn: document.getElementById('prevTrackBtn'),
    nextTrackBtn: document.getElementById('nextTrackBtn'),
    lyricsBtn: document.getElementById('lyricsBtn'),
    lyricsStatus: document.getElementById('lyricsStatus'),
    volumeSlider: document.getElementById('volumeSlider'),
    heroStreamBtn: document.getElementById('heroStreamBtn'),
    releaseModal: document.getElementById('releaseModal'),
    closeModalBtn: document.getElementById('closeModalBtn'),
    modalArt: document.getElementById('modalArt'),
    modalTag: document.getElementById('modalTag'),
    modalTitle: document.getElementById('modalTitle'),
    modalNotes: document.getElementById('modalNotes'),
    modalLyrics: document.getElementById('modalLyrics'),
    modalPlayBtn: document.getElementById('modalPlayBtn'),
    copyBioBtn: document.getElementById('copyBioBtn'),
    epkBioText: document.getElementById('epkBioText'),
    contactForm: document.getElementById('contactForm'),
    formStatus: document.getElementById('formStatus'),
    yearSpan: document.getElementById('yearSpan'),
  };

  const revealTargets = Array.from(document.querySelectorAll('.society-reveal')).filter(
    (el) => el !== els.introGate
  );
  const visualizerContext = els.audioVisualizer.getContext('2d');
  const visualizerLevels = new Array(64).fill(0);
  let visualizerFrameId = null;
  let modalTrackIndex = currentIndex;
  let lastActiveLyricIndex = -1;
  let lastFloatingLyricIndex = -1;
  let lastFloatingTrackId = null;
  let lyricBubblesEnabled = true;

  const scrollObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-revealed');
          scrollObserver.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.14 }
  );

  function registerScrollCards() {
    document.querySelectorAll('.scroll-card').forEach((card) => {
      scrollObserver.observe(card);
    });
  }

  function revealSocietyStepByStep() {
    if (els.introGate) {
      els.introGate.classList.add('is-dismissed');
      els.introGate.style.pointerEvents = 'none';
      setTimeout(() => {
        els.introGate.style.display = 'none';
      }, 720);
    }

    revealTargets.forEach((el, idx) => {
      setTimeout(() => {
        el.classList.add('is-revealed');
      }, 180 + idx * 180);
    });

    setTimeout(() => {
      registerScrollCards();
    }, 350);
  }

  function makeCoverMarkup(track) {
    return `<img src="${track.coverUrl}" alt="${track.title} cover art" class="release-cover-image" loading="lazy" />`;
  }

  function syncPlayerUI(isPlaying) {
    const track = RELEASES[currentIndex];
    els.playerTitle.textContent = track.title;
    els.playerMeta.textContent = `ALPHA \u2022 ${track.type.toUpperCase()}`;
    els.playerArt.innerHTML = `<img src="${track.coverUrl}" alt="" class="w-full h-full object-cover" />`;

    els.playIcon.classList.toggle('hidden', isPlaying);
    els.pauseIcon.classList.toggle('hidden', !isPlaying);
    document.body.classList.toggle('music-playing', isPlaying);
    document.querySelectorAll('[data-track-id]').forEach((card) => {
      const cardIsPlaying = isPlaying && card.dataset.trackId === track.id;
      const cardTitle = card.querySelector('h3').textContent;
      card.classList.toggle('is-playing', cardIsPlaying);
      card.querySelectorAll('[data-play-idx]').forEach((button) => {
        button.setAttribute('aria-pressed', String(cardIsPlaying));
        if (button.classList.contains('release-art-play')) {
          button.setAttribute('aria-label', `${cardIsPlaying ? 'Pause' : 'Play'} ${cardTitle}`);
        }
      });
    });
  }

  function formatLyricTime(seconds) {
    const totalSeconds = Math.floor(seconds);
    const minutes = Math.floor(totalSeconds / 60);
    return `${minutes}:${String(totalSeconds % 60).padStart(2, '0')}`;
  }

  function renderSyncedLyrics(track, trackIndex) {
    els.modalLyrics.replaceChildren();
    lastActiveLyricIndex = -1;

    if (!track.lyrics.length) {
      const emptyState = document.createElement('p');
      emptyState.className = 'text-sm text-zinc-400';
      emptyState.textContent = 'Timed lyrics will appear here once they are added.';
      els.modalLyrics.appendChild(emptyState);
      els.lyricsStatus.textContent = 'Lyrics not added yet';
      return;
    }

    track.lyrics.forEach((line, lineIndex) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'synced-lyric-line';
      button.dataset.lyricIndex = String(lineIndex);
      button.dataset.trackIndex = String(trackIndex);
      button.setAttribute('aria-label', `Seek to ${formatLyricTime(line.time)}: ${line.text}`);

      const timestamp = document.createElement('span');
      timestamp.className = 'synced-lyric-time';
      timestamp.textContent = formatLyricTime(line.time);

      const text = document.createElement('span');
      text.className = 'synced-lyric-text';
      text.textContent = line.text;

      button.append(timestamp, text);
      button.addEventListener('click', () => {
        const idx = Number(button.dataset.trackIndex);
        const selectedTrack = RELEASES[idx];
        const selectedLine = selectedTrack.lyrics[Number(button.dataset.lyricIndex)];
        if (engine.isPlaying && idx === currentIndex) {
          engine.seek(selectedLine.time);
          updateSyncedLyrics();
        } else {
          selectAndPlay(idx, selectedLine.time);
        }
      });
      els.modalLyrics.appendChild(button);
    });

    updateSyncedLyrics();
  }

  function updateSyncedLyrics() {
    const track = RELEASES[modalTrackIndex];
    if (!track || !track.lyrics.length) return;

    const isCurrentTrack = modalTrackIndex === currentIndex;
    const currentTime = isCurrentTrack ? engine.getCurrentTime() : -1;
    let activeIndex = -1;
    if (isCurrentTrack) {
      for (let index = 0; index < track.lyrics.length; index += 1) {
        if (track.lyrics[index].time > currentTime) break;
        activeIndex = index;
      }
    }

    const lines = els.modalLyrics.querySelectorAll('.synced-lyric-line');
    lines.forEach((line, index) => {
      const isActive = index === activeIndex;
      line.classList.toggle('is-active', isActive);
      line.setAttribute('aria-current', isActive ? 'true' : 'false');
    });

    els.lyricsStatus.textContent = isCurrentTrack && engine.isPlaying
      ? 'Playing · tap a line to jump'
      : 'Tap a line to play from there';

    if (activeIndex !== lastActiveLyricIndex && activeIndex >= 0) {
      lines[activeIndex].scrollIntoView({
        block: 'nearest',
        behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth',
      });
    }
    lastActiveLyricIndex = activeIndex;
  }

  function updateFloatingLyrics() {
    const track = RELEASES[currentIndex];
    if (!lyricBubblesEnabled || !engine.isPlaying || !track || !track.lyrics.length) return;

    const currentTime = engine.getCurrentTime();
    let activeIndex = -1;
    for (let index = 0; index < track.lyrics.length; index += 1) {
      if (track.lyrics[index].time > currentTime) break;
      activeIndex = index;
    }

    if (activeIndex < 0) {
      lastFloatingLyricIndex = -1;
      return;
    }
    if (track.id === lastFloatingTrackId && activeIndex === lastFloatingLyricIndex) return;
    lastFloatingTrackId = track.id;
    lastFloatingLyricIndex = activeIndex;

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const bubble = document.createElement('span');
    bubble.className = 'floating-lyric';
    bubble.textContent = track.lyrics[activeIndex].text;
    bubble.style.setProperty('--lyric-accent', track.accent);
    const drift = Math.round(Math.random() * 100 - 50);
    bubble.style.setProperty('--lyric-left', `${18 + Math.random() * 64}%`);
    bubble.style.setProperty('--lyric-drift', `${drift}px`);
    bubble.style.setProperty('--lyric-drift-small', `${drift * 0.2}px`);
    els.floatingLyrics.appendChild(bubble);
    bubble.addEventListener('animationend', () => bubble.remove(), { once: true });
  }

  function drawAudioVisualizer() {
    visualizerFrameId = null;
    if (!engine.isPlaying) return;

    const canvas = els.audioVisualizer;
    const context = visualizerContext;
    const width = canvas.clientWidth;
    const height = canvas.clientHeight;
    const pixelRatio = Math.min(window.devicePixelRatio || 1, 1.5);
    const pixelWidth = Math.round(width * pixelRatio);
    const pixelHeight = Math.round(height * pixelRatio);

    if (canvas.width !== pixelWidth || canvas.height !== pixelHeight) {
      canvas.width = pixelWidth;
      canvas.height = pixelHeight;
    }

    context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
    context.clearRect(0, 0, width, height);

    const frequencyData = engine.getFrequencyData();
    updateSyncedLyrics();
    updateFloatingLyrics();
    if (frequencyData) {
      const baseY = height * 0.94;
      const slotWidth = width / visualizerLevels.length;

      context.globalCompositeOperation = 'lighter';
      for (let index = 0; index < visualizerLevels.length; index += 1) {
        const start = 2 + Math.floor((index / visualizerLevels.length) * 92);
        const end = Math.min(frequencyData.length, 2 + Math.floor(((index + 1) / visualizerLevels.length) * 92));
        let total = 0;
        for (let bin = start; bin < Math.max(start + 1, end); bin += 1) {
          total += frequencyData[bin] || 0;
        }

        const average = total / Math.max(1, end - start);
        const target = Math.max(0, (average - 8) / 247);
        visualizerLevels[index] += (target - visualizerLevels[index]) * (target > visualizerLevels[index] ? 0.34 : 0.12);

        const level = visualizerLevels[index];
        const barHeight = 3 + level * height * 0.56;
        const barWidth = Math.max(2, slotWidth * 0.58);
        const x = index * slotWidth + (slotWidth - barWidth) / 2;
        const hue = 185 + (index / visualizerLevels.length) * 145;
        const gradient = context.createLinearGradient(0, baseY - barHeight, 0, baseY);
        gradient.addColorStop(0, `hsla(${hue}, 100%, 76%, ${0.08 + level * 0.52})`);
        gradient.addColorStop(0.55, `hsla(${hue + 28}, 100%, 62%, ${0.12 + level * 0.62})`);
        gradient.addColorStop(1, `hsla(${hue + 70}, 100%, 54%, ${0.1 + level * 0.72})`);

        context.fillStyle = gradient;
        context.shadowColor = `hsla(${hue}, 100%, 62%, ${level * 0.5})`;
        context.shadowBlur = 8 + level * 22;
        context.fillRect(x, baseY - barHeight, barWidth, barHeight);
        context.fillRect(x, baseY + 2, barWidth, Math.max(2, barHeight * 0.08));
      }
      context.globalCompositeOperation = 'source-over';
      context.shadowBlur = 0;
    }

    visualizerFrameId = requestAnimationFrame(drawAudioVisualizer);
  }

  function stopAudioVisualizer() {
    if (visualizerFrameId !== null) {
      cancelAnimationFrame(visualizerFrameId);
      visualizerFrameId = null;
    }

    visualizerLevels.fill(0);
    visualizerContext.clearRect(0, 0, els.audioVisualizer.width, els.audioVisualizer.height);
  }

  function selectAndPlay(index, startTime = 0) {
    currentIndex = (index + RELEASES.length) % RELEASES.length;
    syncPlayerUI(true);
    engine.playTrack(RELEASES[currentIndex], startTime);
  }

  function renderFilters() {
    const types = ['All', ...new Set(RELEASES.map((r) => r.type))];
    els.filterBar.innerHTML = types
      .map((type) => {
        const active = type === activeFilter;
        const cls = active
          ? 'bg-amber-400 text-obsidian border-amber-400 font-semibold'
          : 'bg-charcoal/80 text-zinc-400 border-white/10 hover:border-amber-400/40 hover:text-white';
        return `<button type="button" data-filter="${type}" class="px-3.5 py-1.5 rounded-full border transition-colors cursor-pointer ${cls}">${type}</button>`;
      })
      .join('');

    els.filterBar.querySelectorAll('button').forEach((btn) => {
      btn.addEventListener('click', () => {
        activeFilter = btn.dataset.filter;
        renderFilters();
        renderReleases();
      });
    });
  }

  function renderReleases() {
    const list = activeFilter === 'All' ? RELEASES : RELEASES.filter((r) => r.type === activeFilter);
    els.releasesGrid.innerHTML = list
      .map((track) => {
        const realIdx = RELEASES.findIndex((r) => r.id === track.id);
        return `
          <article class="tae-card release-card scroll-card rounded-2xl overflow-hidden flex flex-col justify-between group" data-track-id="${track.id}" style="--release-accent: ${track.accent}">
            <div class="release-art cursor-pointer" data-open-modal="${realIdx}" role="button" tabindex="0" aria-label="View ${track.title} details">
              ${makeCoverMarkup(track)}
              <span class="release-art-glow" aria-hidden="true"></span>
              <button type="button" data-play-idx="${realIdx}" class="release-art-play" aria-label="Play ${track.title}">
                <svg class="release-play-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5v14l11-7z"/></svg>
                <svg class="release-pause-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M6 5h4v14H6zm8 0h4v14h-4z"/></svg>
              </button>
              <span class="release-art-label">${track.type} <span aria-hidden="true">/</span> ${track.year}</span>
            </div>
            <div class="p-5 flex-1 flex flex-col justify-between gap-4">
              <div>
                <div class="flex items-center justify-between font-mono text-[11px] text-zinc-400 mb-1.5">
                  <span class="text-amber-300">${track.type}</span>
                  <span>TAE ORIGINAL</span>
                </div>
                <h3 class="font-display font-bold text-xl text-white">${track.title}</h3>
                <p class="text-xs text-zinc-400 mt-1.5 line-clamp-2">${track.notes}</p>
              </div>
              <div class="flex items-center justify-between pt-3 border-t border-white/10">
                <button type="button" data-play-idx="${realIdx}" class="inline-flex items-center gap-2 font-mono text-xs uppercase tracking-wider text-blue-300 hover:text-amber-300 cursor-pointer">
                  &#9654; Play Track
                </button>
                <button type="button" data-open-modal="${realIdx}" class="font-mono text-xs text-zinc-400 hover:text-white cursor-pointer">
                  Lyrics &amp; Info
                </button>
              </div>
            </div>
          </article>
        `;
      })
      .join('');

    els.releasesGrid.querySelectorAll('[data-play-idx]').forEach((btn) => {
      btn.addEventListener('click', (event) => {
        event.stopPropagation();
        const index = Number(btn.dataset.playIdx);
        if (engine.isPlaying && index === currentIndex) {
          engine.stop();
        } else {
          selectAndPlay(index);
        }
      });
    });

    els.releasesGrid.querySelectorAll('[data-open-modal]').forEach((el) => {
      el.addEventListener('click', () => openModal(Number(el.dataset.openModal)));
      el.addEventListener('keydown', (event) => {
        if (event.target === el && (event.key === 'Enter' || event.key === ' ')) {
          event.preventDefault();
          openModal(Number(el.dataset.openModal));
        }
      });
    });

    registerScrollCards();
  }

  function renderVisuals() {
    els.visualsGrid.innerHTML = VISUALS.map((item) => {
      const media = item.imageUrl
        ? `<img src="${item.imageUrl}" alt="${item.title}" class="w-full h-52 object-cover" />`
        : `<div class="h-52 bg-gradient-to-tr from-blue-950/90 via-charcoal to-amber-950/30 flex items-center justify-center p-6 text-center">
             <span class="px-3.5 py-1.5 rounded-full border border-amber-400/40 font-mono text-xs tracking-widest text-amber-300">${item.badge}</span>
           </div>`;
      return `
        <figure class="tae-card scroll-card rounded-2xl overflow-hidden">
          ${media}
          <figcaption class="p-5">
            <p class="font-mono text-[11px] uppercase tracking-wider text-blue-400">${item.category}</p>
            <h3 class="font-display font-bold text-lg text-white mt-1">${item.title}</h3>
            <p class="text-xs text-zinc-400 mt-1.5">${item.caption}</p>
          </figcaption>
        </figure>
      `;
    }).join('');

    registerScrollCards();
  }

  function openModal(idx) {
    const track = RELEASES[idx];
    if (!track) return;
    modalTrackIndex = idx;
    els.modalArt.innerHTML = makeCoverMarkup(track);
    els.modalTag.textContent = `${track.type} \u2022 ${track.year} \u2022 ALPHA`;
    els.modalTitle.textContent = track.title;
    els.modalNotes.textContent = track.notes;
    renderSyncedLyrics(track, idx);
    els.modalPlayBtn.onclick = () => {
      selectAndPlay(idx);
      closeModal();
    };
    els.releaseModal.classList.remove('hidden');
    els.releaseModal.classList.add('flex');
  }

  function closeModal() {
    els.releaseModal.classList.add('hidden');
    els.releaseModal.classList.remove('flex');
  }

  if (els.enterSocietyBtn) {
    els.enterSocietyBtn.addEventListener('click', (e) => {
      e.preventDefault();
      revealSocietyStepByStep();
    });
  }

  els.themeToggle.addEventListener('click', () => {
    const isSwapped = document.body.classList.toggle('theme-swapped');
    const bounds = els.themeToggle.getBoundingClientRect();
    els.themeToggle.setAttribute('aria-pressed', String(isSwapped));
    els.themeToggle.setAttribute(
      'aria-label',
      isSwapped ? 'Switch to the blue-gold color theme' : 'Switch to the gold-blue color theme'
    );
    els.themeWave.style.setProperty('--wave-x', `${bounds.left + bounds.width / 2}px`);
    els.themeWave.style.setProperty('--wave-y', `${bounds.top + bounds.height / 2}px`);
    els.themeWave.style.setProperty('--wave-color', isSwapped ? '245 158 11' : '37 99 235');
    els.themeWave.classList.remove('is-active');
    void els.themeWave.offsetWidth;
    els.themeWave.classList.add('is-active');
  });

  els.themeWave.addEventListener('animationend', () => {
    els.themeWave.classList.remove('is-active');
  });

  els.lyricBubblesToggle.addEventListener('click', () => {
    lyricBubblesEnabled = !lyricBubblesEnabled;
    els.lyricBubblesToggle.setAttribute('aria-pressed', String(lyricBubblesEnabled));
    els.lyricBubblesToggle.setAttribute(
      'aria-label',
      lyricBubblesEnabled ? 'Turn lyric bubbles off' : 'Turn lyric bubbles on'
    );
    els.lyricBubblesToggle.textContent = lyricBubblesEnabled ? 'BUBBLES ON' : 'BUBBLES OFF';
    if (!lyricBubblesEnabled) {
      els.floatingLyrics.replaceChildren();
    } else {
      lastFloatingLyricIndex = -1;
      lastFloatingTrackId = null;
      updateFloatingLyrics();
    }
  });

  engine.onStateChange = (playing) => {
    syncPlayerUI(playing);
    updateSyncedLyrics();
    if (playing && visualizerFrameId === null) {
      updateFloatingLyrics();
      visualizerFrameId = requestAnimationFrame(drawAudioVisualizer);
    } else if (!playing) {
      stopAudioVisualizer();
    }
  };
  engine.onError = (error) => {
    els.playerMeta.textContent = `Playback error: ${error.message}`;
  };

  els.togglePlayBtn.addEventListener('click', () => {
    if (engine.isPlaying) {
      engine.stop();
    } else {
      selectAndPlay(currentIndex);
    }
  });

  els.heroStreamBtn.addEventListener('click', () => selectAndPlay(0));
  els.lyricsBtn.addEventListener('click', () => openModal(currentIndex));
  els.prevTrackBtn.addEventListener('click', () => selectAndPlay(currentIndex - 1));
  els.nextTrackBtn.addEventListener('click', () => selectAndPlay(currentIndex + 1));

  els.volumeSlider.addEventListener('input', (e) => {
    engine.setVolume(e.target.value);
  });

  els.closeModalBtn.addEventListener('click', closeModal);
  els.releaseModal.addEventListener('click', (e) => {
    if (e.target === els.releaseModal) closeModal();
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeModal();
  });

  els.mobileMenuBtn.addEventListener('click', () => {
    els.mobileMenu.classList.toggle('hidden');
  });

  els.copyBioBtn.addEventListener('click', () => {
    navigator.clipboard?.writeText(els.epkBioText.textContent.trim()).catch(() => {});
    els.copyBioBtn.textContent = 'Copied!';
    setTimeout(() => {
      els.copyBioBtn.textContent = 'Copy Bio';
    }, 1800);
  });

  els.contactForm.addEventListener('submit', (e) => {
    e.preventDefault();
    els.formStatus.textContent = 'Inquiry drafted. Connect a form endpoint (Formspree/EmailJS) to send live.';
    els.contactForm.reset();
  });

  window.addEventListener('scroll', () => {
    if (window.scrollY > 24) {
      els.navbar.classList.add('bg-obsidian/90', 'backdrop-blur-xl', 'border-white/10');
    } else {
      els.navbar.classList.remove('bg-obsidian/90', 'backdrop-blur-xl', 'border-white/10');
    }
  });

  if (els.yearSpan) {
    els.yearSpan.textContent = new Date().getFullYear();
  }

  syncPlayerUI(false);
  renderFilters();
  renderReleases();
  renderVisuals();
  registerScrollCards();
})();