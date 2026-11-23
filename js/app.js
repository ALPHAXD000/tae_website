// The Alpha Effect (TAE) — UI Rendering, Society Gate & Interactions

(function () {
  const engine = window.taeAudio;
  let currentIndex = 0;
  let activeFilter = 'All';
  let shuffleEnabled = false;
  let repeatMode = 'off';

  const els = {
    introGate: document.getElementById('introGate'),
    enterSocietyBtn: document.getElementById('enterSocietyBtn'),
    themeToggle: document.getElementById('themeToggle'),
    themeWave: document.getElementById('themeWave'),
    audioVisualizer: document.getElementById('audioVisualizer'),
    navbar: document.getElementById('navbar'),
    mobileMenuBtn: document.getElementById('mobileMenuBtn'),
    mobileMenu: document.getElementById('mobileMenu'),
    filterBar: document.getElementById('filterBar'),
    releasesGrid: document.getElementById('releasesGrid'),
    playerArt: document.getElementById('playerArt'),
    playerTitle: document.getElementById('playerTitle'),
    playerMeta: document.getElementById('playerMeta'),
    playerLyricsPanel: document.getElementById('playerLyricsPanel'),
    playerLyricsTitle: document.getElementById('playerLyricsTitle'),
    playerLyricsStatus: document.getElementById('playerLyricsStatus'),
    playerLyrics: document.getElementById('playerLyrics'),
    togglePlayBtn: document.getElementById('togglePlayBtn'),
    playIcon: document.getElementById('playIcon'),
    pauseIcon: document.getElementById('pauseIcon'),
    prevTrackBtn: document.getElementById('prevTrackBtn'),
    nextTrackBtn: document.getElementById('nextTrackBtn'),
    shuffleBtn: document.getElementById('shuffleBtn'),
    repeatBtn: document.getElementById('repeatBtn'),
    repeatOneBadge: document.getElementById('repeatOneBadge'),
    playerSeekSlider: document.getElementById('playerSeekSlider'),
    playerCurrentTime: document.getElementById('playerCurrentTime'),
    playerDuration: document.getElementById('playerDuration'),
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
    els.playerLyricsTitle.textContent = track.title;

    els.playIcon.classList.toggle('hidden', isPlaying);
    els.pauseIcon.classList.toggle('hidden', !isPlaying);
    els.togglePlayBtn.setAttribute('aria-label', isPlaying ? 'Pause' : 'Play');
    renderSyncedLyrics(els.playerLyrics, els.playerLyricsStatus, track, currentIndex);
    updateSyncedLyrics();
    updatePlayerProgress();
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

  function renderSyncedLyrics(container, status, track, trackIndex) {
    container.replaceChildren();
    container.dataset.trackIndex = String(trackIndex);
    container.dataset.lyricIndex = '-2';

    if (!track.lyrics.length) {
      const emptyState = document.createElement('p');
      emptyState.className = 'lyric-screen-empty';
      emptyState.textContent = 'Timed lyrics will appear here once they are added.';
      container.appendChild(emptyState);
      status.textContent = 'Lyrics not added yet';
      return;
    }

    updateLyricScreen(container, status, track, trackIndex);
  }

  function updateLyricScreen(container, status, track, trackIndex) {
    if (!track) return;
    if (!track.lyrics.length) {
      status.textContent = 'Lyrics not added yet';
      return;
    }
    const isCurrentTrack = trackIndex === currentIndex;
    const currentTime = isCurrentTrack ? engine.getCurrentTime() : -1;
    let activeIndex = -1;
    if (isCurrentTrack) {
      for (let index = 0; index < track.lyrics.length; index += 1) {
        if (track.lyrics[index].time > currentTime) break;
        activeIndex = index;
      }
    }

    const nextLine = isCurrentTrack && activeIndex >= 0 ? track.lyrics[activeIndex] : null;
    const nextIndex = nextLine ? activeIndex : -1;
    if (container.dataset.lyricIndex !== String(nextIndex)) {
      container.dataset.lyricIndex = String(nextIndex);
      container.replaceChildren();
      if (nextLine) {
        const line = document.createElement('p');
        line.className = 'lyric-screen-line';
        line.textContent = nextLine.text;
        container.appendChild(line);
      }
    }

    status.textContent = !isCurrentTrack
      ? 'Play this track to follow its lyrics'
      : engine.isPlaying
        ? 'Lyrics follow the song'
        : 'Press play to follow the lyrics';
  }

  function updateSyncedLyrics() {
    updateLyricScreen(els.playerLyrics, els.playerLyricsStatus, RELEASES[currentIndex], currentIndex);
    updateLyricScreen(els.modalLyrics, els.lyricsStatus, RELEASES[modalTrackIndex], modalTrackIndex);
  }

  function formatPlayerTime(seconds) {
    if (!Number.isFinite(seconds) || seconds < 0) return '0:00';
    const wholeSeconds = Math.floor(seconds);
    return `${Math.floor(wholeSeconds / 60)}:${String(wholeSeconds % 60).padStart(2, '0')}`;
  }

  function updatePlayerProgress() {
    const duration = engine.audioEl.duration;
    const currentTime = engine.getCurrentTime();
    const canSeek = Number.isFinite(duration) && duration > 0;
    els.playerSeekSlider.disabled = !canSeek;
    els.playerSeekSlider.max = canSeek ? String(duration) : '0';
    els.playerSeekSlider.value = canSeek ? String(Math.min(currentTime, duration)) : '0';
    els.playerCurrentTime.textContent = formatPlayerTime(currentTime);
    els.playerDuration.textContent = formatPlayerTime(duration);
    const progress = canSeek ? (currentTime / duration) * 100 : 0;
    els.playerSeekSlider.style.setProperty('--seek-progress', `${progress}%`);
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

  function togglePlayerPlayback() {
    if (engine.isPlaying) {
      engine.pause();
    } else if (engine.isPaused) {
      engine.resume();
    } else {
      selectAndPlay(currentIndex);
    }
  }

  function playNextTrack() {
    if (shuffleEnabled && RELEASES.length > 1) {
      const choices = RELEASES.map((_, index) => index).filter((index) => index !== currentIndex);
      selectAndPlay(choices[Math.floor(Math.random() * choices.length)]);
      return;
    }
    selectAndPlay(currentIndex + 1);
  }

  function updateShuffleButton() {
    els.shuffleBtn.setAttribute('aria-pressed', String(shuffleEnabled));
    els.shuffleBtn.setAttribute('aria-label', shuffleEnabled ? 'Turn shuffle off' : 'Turn shuffle on');
    els.shuffleBtn.title = shuffleEnabled ? 'Shuffle on' : 'Shuffle off';
  }

  function updateRepeatButton() {
    const isRepeatOn = repeatMode !== 'off';
    const repeatLabel = repeatMode === 'one' ? 'Repeat current track' : isRepeatOn ? 'Repeat all tracks' : 'Repeat off';
    els.repeatBtn.setAttribute('aria-pressed', String(isRepeatOn));
    els.repeatBtn.setAttribute('aria-label', repeatLabel);
    els.repeatBtn.title = repeatLabel;
    els.repeatOneBadge.classList.toggle('hidden', repeatMode !== 'one');
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
          togglePlayerPlayback();
        } else if (engine.isPaused && index === currentIndex) {
          togglePlayerPlayback();
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

  function openModal(idx) {
    const track = RELEASES[idx];
    if (!track) return;
    modalTrackIndex = idx;
    els.modalArt.innerHTML = makeCoverMarkup(track);
    els.modalTag.textContent = `${track.type} \u2022 ${track.year} \u2022 ALPHA`;
    els.modalTitle.textContent = track.title;
    els.modalNotes.textContent = track.notes;
    renderSyncedLyrics(els.modalLyrics, els.lyricsStatus, track, idx);
    updateSyncedLyrics();
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

  engine.onStateChange = (playing) => {
    syncPlayerUI(playing);
    updateSyncedLyrics();
    if (playing && visualizerFrameId === null) {
      visualizerFrameId = requestAnimationFrame(drawAudioVisualizer);
    } else if (!playing) {
      stopAudioVisualizer();
    }
  };
  engine.onError = (error) => {
    els.playerMeta.textContent = `Playback error: ${error.message}`;
  };
  engine.onEnded = () => {
    if (repeatMode === 'one') {
      selectAndPlay(currentIndex);
    } else if (shuffleEnabled && RELEASES.length > 1) {
      playNextTrack();
    } else if (currentIndex < RELEASES.length - 1 || repeatMode === 'all') {
      selectAndPlay(currentIndex + 1);
    }
  };

  els.togglePlayBtn.addEventListener('click', togglePlayerPlayback);

  els.heroStreamBtn.addEventListener('click', () => selectAndPlay(0));
  els.lyricsBtn.addEventListener('click', () => {
    const isOpen = !els.playerLyricsPanel.classList.contains('hidden');
    els.playerLyricsPanel.classList.toggle('hidden', isOpen);
    els.lyricsBtn.setAttribute('aria-expanded', String(!isOpen));
    els.lyricsBtn.setAttribute('aria-label', isOpen ? 'Show lyrics' : 'Hide lyrics');
    if (!isOpen) updateSyncedLyrics();
  });
  els.prevTrackBtn.addEventListener('click', () => {
    if (engine.getCurrentTime() > 3) {
      engine.seek(0);
      updatePlayerProgress();
      updateSyncedLyrics();
      return;
    }
    selectAndPlay(currentIndex - 1);
  });
  els.nextTrackBtn.addEventListener('click', playNextTrack);
  els.shuffleBtn.addEventListener('click', () => {
    shuffleEnabled = !shuffleEnabled;
    updateShuffleButton();
  });
  els.repeatBtn.addEventListener('click', () => {
    repeatMode = repeatMode === 'off' ? 'all' : repeatMode === 'all' ? 'one' : 'off';
    updateRepeatButton();
  });
  els.playerSeekSlider.addEventListener('input', () => {
    engine.seek(Number(els.playerSeekSlider.value));
    updatePlayerProgress();
    updateSyncedLyrics();
  });

  els.volumeSlider.addEventListener('input', (e) => {
    engine.setVolume(e.target.value);
  });
  ['loadedmetadata', 'durationchange', 'timeupdate', 'seeked'].forEach((eventName) => {
    engine.audioEl.addEventListener(eventName, updatePlayerProgress);
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
  updateShuffleButton();
  updateRepeatButton();
  renderFilters();
  renderReleases();
  registerScrollCards();
})();