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
    backgroundVinylArt: document.getElementById('backgroundVinylArt'),
    navbar: document.getElementById('navbar'),
    topNavMenu: document.getElementById('topNavMenu'),
    topNavMenuBtn: document.getElementById('topNavMenuBtn'),
    topNavDropdown: document.getElementById('topNavDropdown'),
    mobileMenuBtn: document.getElementById('mobileMenuBtn'),
    mobileMenu: document.getElementById('mobileMenu'),
    filterBar: document.getElementById('filterBar'),
    releasesGrid: document.getElementById('releasesGrid'),
    playerBar: document.getElementById('playerBar'),
    vinylToggle: document.getElementById('vinylToggle'),
    vinylArt: document.getElementById('vinylArt'),
    playerShell: document.querySelector('.player-shell'),
    collapsePlayerBtn: document.getElementById('collapsePlayerBtn'),
    playerPages: document.getElementById('playerPages'),
    playerArt: document.getElementById('playerArt'),
    playerTitle: document.getElementById('playerTitle'),
    playerStatus: document.getElementById('playerStatus'),
    playerLyricsTitle: document.getElementById('playerLyricsTitle'),
    playerLyricsStatus: document.getElementById('playerLyricsStatus'),
    playerLyrics: document.getElementById('playerLyrics'),
    playerVolumeControl: document.getElementById('playerVolumeControl'),
    volumeToggleBtn: document.getElementById('volumeToggleBtn'),
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
    feedbackForm: document.getElementById('feedbackForm'),
    feedbackTrack: document.getElementById('feedbackTrack'),
    feedbackName: document.getElementById('feedbackName'),
    feedbackMessage: document.getElementById('feedbackMessage'),
    feedbackStatus: document.getElementById('feedbackStatus'),
    feedbackFilter: document.getElementById('feedbackFilter'),
    feedbackList: document.getElementById('feedbackList'),
    feedbackListTitle: document.getElementById('feedbackListTitle'),
    supportOneTimeLink: document.getElementById('supportOneTimeLink'),
    supportStatus: document.getElementById('supportStatus'),
    yearSpan: document.getElementById('yearSpan'),
  };

  const visualizerContext = els.audioVisualizer.getContext('2d');
  const visualizerLevels = new Array(32).fill(0);
  let visualizerFrameId = null;
  let visualizerGradient = null;
  let lastVisualizerFrameTime = 0;
  let lastLyricsUpdateTime = 0;
  let modalTrackIndex = currentIndex;
  let playerAutoCollapseTimeout = null;

  const scrollObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        entry.target.classList.toggle('is-revealed', entry.isIntersecting);
      });
    },
    { threshold: 0.14 }
  );

  function registerScrollReveals() {
    document.querySelectorAll('.society-reveal, .scroll-card, .song-scroll-reveal').forEach((element) => {
      if (!element.classList.contains('is-revealed')) {
        scrollObserver.observe(element);
      }
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

    registerScrollReveals();
  }

  function makeCoverMarkup(track) {
    return `<img src="${track.coverUrl}" alt="${track.title} cover art" class="release-cover-image" loading="lazy" />`;
  }

  function updateMediaSessionMetadata(track) {
    if (!navigator.mediaSession || typeof window.MediaMetadata !== 'function') return;

    navigator.mediaSession.metadata = new window.MediaMetadata({
      title: track.title,
      artist: 'ALPHA',
      album: 'The Alpha Effect',
      artwork: [{ src: new URL(track.coverUrl, document.baseURI).href }],
    });
  }

  function updateMediaSessionPlaybackState(isPlaying) {
    if (!navigator.mediaSession) return;
    navigator.mediaSession.playbackState = isPlaying ? 'playing' : engine.isPaused ? 'paused' : 'none';
  }

  function setMediaSessionActionHandler(action, handler) {
    const mediaSession = navigator.mediaSession;
    if (!mediaSession || typeof mediaSession.setActionHandler !== 'function') return;

    try {
      mediaSession.setActionHandler(action, handler);
    } catch (error) {
      if (error.name !== 'NotSupportedError') throw error;
    }
  }

  function parseTimedLyrics(source) {
    return source.split(/\r?\n/).reduce((lyrics, line) => {
      const match = line.match(/^\[(\d+):([0-5]\d)(?:\.(\d{1,3}))?\]\s*(.+)$/);
      if (!match) return lyrics;

      const text = match[4].trim();
      if (!text) return lyrics;

      const fraction = match[3] ? Number(`0.${match[3]}`) : 0;
      lyrics.push({
        time: Number(match[1]) * 60 + Number(match[2]) + fraction,
        text,
      });
      return lyrics;
    }, []);
  }

  function parseLyrics(source) {
    const timedLyrics = parseTimedLyrics(source);
    if (timedLyrics.length) return timedLyrics;

    return source
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean)
      .map((text) => ({ text }));
  }

  async function loadTrackLyrics() {
    await Promise.all(RELEASES.map(async (track) => {
      if (!track.lyricsUrl) return;

      try {
        const response = await fetch(track.lyricsUrl);
        if (!response.ok) {
          throw new Error(`Request failed with status ${response.status}`);
        }

        const source = await response.text();
        const lyrics = parseLyrics(source);
        if (lyrics.length) {
          track.lyrics = lyrics;
        }
      } catch (error) {
        console.error(`Unable to load lyrics for ${track.title} from ${track.lyricsUrl}:`, error);
      }
    }));

    syncPlayerUI(engine.isPlaying);
    updateSyncedLyrics();
  }

  function syncPlayerUI(isPlaying) {
    const track = RELEASES[currentIndex];
    document.documentElement.style.setProperty('--track-accent', track.accent);
    els.playerTitle.textContent = track.title;
    els.playerArt.innerHTML = `<img src="${track.coverUrl}" alt="" class="w-full h-full object-cover" />`;
    els.vinylArt.src = track.coverUrl;
    els.backgroundVinylArt.src = track.coverUrl;
    els.vinylToggle.setAttribute('aria-label', `${els.playerBar.classList.contains('is-expanded') ? 'Collapse' : 'Open'} player for ${track.title}`);
    els.playerLyricsTitle.textContent = track.title;
    els.playerStatus.textContent = isPlaying ? 'Playing' : engine.isPaused ? 'Paused' : 'Ready to play';

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
        if (button.classList.contains('release-play-toggle')) {
          button.setAttribute('aria-label', `${cardIsPlaying ? 'Pause' : 'Play'} ${cardTitle}`);
        }
      });
    });
  }

  function renderSyncedLyrics(container, status, track, trackIndex) {
    container.replaceChildren();
    container.scrollTop = 0;
    container.dataset.trackIndex = String(trackIndex);
    container.dataset.lyricIndex = '-2';

    if (!track.lyrics.length) {
      const emptyState = document.createElement('p');
      emptyState.className = 'lyric-screen-empty';
      emptyState.textContent = 'Lyrics will appear here once they are added.';
      container.appendChild(emptyState);
      status.textContent = 'Lyrics not added yet';
      return;
    }

    const lyricList = document.createElement('div');
    lyricList.className = 'lyric-screen-list';

    track.lyrics.forEach((line, index) => {
      const lyricLine = document.createElement('p');
      lyricLine.className = 'lyric-screen-line';
      lyricLine.dataset.lyricIndex = String(index);
      lyricLine.textContent = line.text;
      lyricList.appendChild(lyricLine);
    });

    container.appendChild(lyricList);
    updateLyricScreen(container, status, track, trackIndex);
  }

  function updateLyricScreen(container, status, track, trackIndex) {
    if (!track) return;
    if (!track.lyrics.length) {
      status.textContent = 'Lyrics not added yet';
      return;
    }
    if (!Number.isFinite(track.lyrics[0].time)) {
      if (container.dataset.lyricIndex !== 'full') {
        container.dataset.lyricIndex = 'full';
        container.querySelectorAll('.lyric-screen-line').forEach((line) => {
          line.classList.remove('is-active', 'is-past', 'is-upcoming');
          line.setAttribute('aria-current', 'false');
        });
      }
      status.textContent = 'Full lyrics';
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

    const nextIndex = isCurrentTrack && activeIndex >= 0 ? activeIndex : -1;
    if (container.dataset.lyricIndex !== String(nextIndex)) {
      container.dataset.lyricIndex = String(nextIndex);
      container.querySelectorAll('.lyric-screen-line').forEach((line, index) => {
        line.classList.toggle('is-active', index === nextIndex);
        line.classList.toggle('is-past', nextIndex >= 0 && index < nextIndex);
        line.classList.toggle('is-upcoming', nextIndex < 0 || index > nextIndex);
        line.setAttribute('aria-current', index === nextIndex ? 'true' : 'false');
      });

      if (nextIndex >= 0) {
        const activeLine = container.querySelector(`[data-lyric-index="${nextIndex}"]`);
        if (activeLine) {
          const targetTop = activeLine.offsetTop - ((container.clientHeight - activeLine.clientHeight) / 2);
          container.scrollTo({
            top: Math.max(0, targetTop),
            behavior: engine.isPlaying ? 'smooth' : 'auto'
          });
        }
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

  function setLyricsPage(showLyrics) {
    els.playerBar.classList.toggle('is-lyrics', showLyrics);
    els.playerPages.querySelector('.player-track-page').setAttribute('aria-hidden', String(showLyrics));
    els.playerPages.querySelector('.player-lyrics-page').setAttribute('aria-hidden', String(!showLyrics));
    els.lyricsBtn.setAttribute('aria-expanded', String(showLyrics));
    els.lyricsBtn.setAttribute('aria-label', showLyrics ? 'Show playback controls' : 'Show lyrics');
    els.lyricsBtn.textContent = showLyrics ? 'PLAYER' : 'LYRICS';
    if (showLyrics) updateSyncedLyrics();
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

  function drawAudioVisualizer(frameTime) {
    visualizerFrameId = null;
    if (!engine.isPlaying) return;
    if (frameTime - lastVisualizerFrameTime < 1000 / 30) {
      visualizerFrameId = requestAnimationFrame(drawAudioVisualizer);
      return;
    }
    lastVisualizerFrameTime = frameTime;

    const canvas = els.audioVisualizer;
    const context = visualizerContext;
    const width = canvas.clientWidth;
    const height = canvas.clientHeight;
    const pixelRatio = Math.min(window.devicePixelRatio || 1, 1);
    const pixelWidth = Math.round(width * pixelRatio);
    const pixelHeight = Math.round(height * pixelRatio);

    if (canvas.width !== pixelWidth || canvas.height !== pixelHeight) {
      canvas.width = pixelWidth;
      canvas.height = pixelHeight;
      context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
      visualizerGradient = context.createLinearGradient(0, 0, width, 0);
      visualizerGradient.addColorStop(0, 'rgba(34, 211, 238, 0.92)');
      visualizerGradient.addColorStop(0.38, 'rgba(59, 130, 246, 0.92)');
      visualizerGradient.addColorStop(0.72, 'rgba(168, 85, 247, 0.92)');
      visualizerGradient.addColorStop(1, 'rgba(236, 72, 153, 0.92)');
    }

    context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
    context.clearRect(0, 0, width, height);

    const frequencyData = engine.getFrequencyData();
    if (frameTime - lastLyricsUpdateTime >= 120) {
      lastLyricsUpdateTime = frameTime;
      updateSyncedLyrics();
    }
    if (frequencyData) {
      const baseY = height * 0.94;
      const slotWidth = width / visualizerLevels.length;

      context.globalCompositeOperation = 'source-over';
      context.fillStyle = visualizerGradient;
      for (let index = 0; index < visualizerLevels.length; index += 1) {
        const start = 2 + Math.floor((index / visualizerLevels.length) * 92);
        const end = Math.min(frequencyData.length, 2 + Math.floor(((index + 1) / visualizerLevels.length) * 92));
        const binCount = Math.max(1, end - start);
        let total = 0;
        for (let bin = start; bin < start + binCount; bin += 1) {
          total += frequencyData[bin] || 0;
        }

        const average = total / binCount;
        const target = Math.max(0, (average - 8) / 247);
        visualizerLevels[index] += (target - visualizerLevels[index]) * (target > visualizerLevels[index] ? 0.34 : 0.12);

        const level = visualizerLevels[index];
        const barHeight = 3 + level * height * 0.56;
        const barWidth = Math.max(2, slotWidth * 0.58);
        const x = index * slotWidth + (slotWidth - barWidth) / 2;
        context.globalAlpha = 0.2 + level * 0.8;
        context.fillRect(x, baseY - barHeight, barWidth, barHeight);
        context.globalAlpha = 0.08 + level * 0.24;
        context.fillRect(x, baseY + 2, barWidth, Math.max(2, barHeight * 0.08));
      }
      context.globalAlpha = 1;
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
    lastVisualizerFrameTime = 0;
    lastLyricsUpdateTime = 0;
  }

  function selectAndPlay(index, startTime = 0) {
    currentIndex = (index + RELEASES.length) % RELEASES.length;
    els.playerBar.classList.remove('is-idle');
    popPlayerOutForSong();
    updateMediaSessionMetadata(RELEASES[currentIndex]);
    syncPlayerUI(true);
    engine.playTrack(RELEASES[currentIndex], startTime);
  }

  function setPlayerExpanded(expanded) {
    els.playerBar.classList.toggle('is-expanded', expanded);
    els.playerShell.setAttribute('aria-hidden', String(!expanded));
    els.vinylToggle.setAttribute('aria-expanded', String(expanded));
    els.vinylToggle.setAttribute('aria-label', `${expanded ? 'Collapse' : 'Open'} player for ${RELEASES[currentIndex].title}`);
  }

  function collapsePlayer(restoreFocus) {
    setPlayerExpanded(false);
    els.playerVolumeControl.classList.remove('is-open');
    els.volumeToggleBtn.setAttribute('aria-expanded', 'false');
    els.volumeToggleBtn.setAttribute('aria-label', 'Show volume control');
    setLyricsPage(false);
    if (restoreFocus) els.vinylToggle.focus();
  }

  function popPlayerOutForSong() {
    if (playerAutoCollapseTimeout !== null) {
      clearTimeout(playerAutoCollapseTimeout);
    }

    setPlayerExpanded(true);
    playerAutoCollapseTimeout = setTimeout(() => {
      playerAutoCollapseTimeout = null;
      collapsePlayer(els.playerShell.contains(document.activeElement));
    }, 6000);
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

  function playPreviousTrack() {
    if (engine.getCurrentTime() > 3) {
      engine.seek(0);
      updatePlayerProgress();
      updateSyncedLyrics();
      return;
    }
    selectAndPlay(currentIndex - 1);
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
          <article class="release-row song-scroll-reveal" data-track-id="${track.id}" style="--release-accent: ${track.accent}">
            <img class="release-cover-thumb" src="${track.coverUrl}" alt="" aria-hidden="true" loading="lazy" decoding="async" />
            <div class="release-track-info">
              <h3 class="font-display font-bold text-lg sm:text-xl text-white truncate">${track.title}</h3>
              <time class="release-duration" datetime="PT${track.duration}S">${formatPlayerTime(track.duration)}</time>
            </div>
            <button type="button" data-play-idx="${realIdx}" class="release-play-toggle" aria-label="Play ${track.title}" aria-pressed="false">
              <svg class="release-play-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5v14l11-7z"/></svg>
              <svg class="release-pause-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M6 5h4v14H6zm8 0h4v14h-4z"/></svg>
            </button>
          </article>
        `;
      })
      .join('');

    els.releasesGrid.querySelectorAll('[data-play-idx]').forEach((btn) => {
      btn.addEventListener('click', (event) => {
        event.stopPropagation();
        const index = Number(btn.dataset.playIdx);
        if ((engine.isPlaying || engine.isPaused) && index === currentIndex) {
          popPlayerOutForSong();
          togglePlayerPlayback();
        } else {
          selectAndPlay(index);
        }
      });
    });

    registerScrollReveals();
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
    updateMediaSessionPlaybackState(playing);
    syncPlayerUI(playing);
    updateSyncedLyrics();
    if (playing && visualizerFrameId === null) {
      visualizerFrameId = requestAnimationFrame(drawAudioVisualizer);
    } else if (!playing) {
      stopAudioVisualizer();
    }
  };
  engine.onError = (error) => {
    els.playerStatus.textContent = `Playback error: ${error.message}`;
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

  setMediaSessionActionHandler('play', () => {
    if (engine.isPaused) {
      engine.resume();
    } else if (!engine.isPlaying) {
      selectAndPlay(currentIndex);
    }
  });
  setMediaSessionActionHandler('pause', () => engine.pause());
  setMediaSessionActionHandler('previoustrack', playPreviousTrack);
  setMediaSessionActionHandler('nexttrack', playNextTrack);

  els.togglePlayBtn.addEventListener('click', togglePlayerPlayback);

  els.heroStreamBtn.addEventListener('click', () => selectAndPlay(0));
  els.vinylToggle.addEventListener('click', () => {
    const expanded = !els.playerBar.classList.contains('is-expanded');
    setPlayerExpanded(expanded);
    (expanded ? els.collapsePlayerBtn : els.vinylToggle).focus();
  });
  els.collapsePlayerBtn.addEventListener('click', () => {
    if (playerAutoCollapseTimeout !== null) {
      clearTimeout(playerAutoCollapseTimeout);
      playerAutoCollapseTimeout = null;
    }
    collapsePlayer(true);
  });
  els.volumeToggleBtn.addEventListener('click', () => {
    const showVolume = els.playerVolumeControl.classList.toggle('is-open');
    els.volumeToggleBtn.setAttribute('aria-expanded', String(showVolume));
    els.volumeToggleBtn.setAttribute('aria-label', showVolume ? 'Hide volume control' : 'Show volume control');
  });
  els.lyricsBtn.addEventListener('click', () => {
    const showLyrics = !els.playerBar.classList.contains('is-lyrics');
    setLyricsPage(showLyrics);
  });
  let touchStart = null;
  els.playerPages.addEventListener('touchstart', (event) => {
    const target = event.target;
    touchStart = target.closest('button, input, label')
      ? null
      : { x: event.changedTouches[0].clientX, y: event.changedTouches[0].clientY };
  }, { passive: true });
  els.playerPages.addEventListener('touchend', (event) => {
    if (!touchStart) return;
    const deltaX = event.changedTouches[0].clientX - touchStart.x;
    const deltaY = event.changedTouches[0].clientY - touchStart.y;
    touchStart = null;
    if (Math.abs(deltaX) < 48 || Math.abs(deltaX) < Math.abs(deltaY) * 1.25) return;
    setLyricsPage(deltaX < 0);
  }, { passive: true });
  els.prevTrackBtn.addEventListener('click', playPreviousTrack);
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
    if (e.key === 'Escape') {
      closeModal();
      els.topNavDropdown.classList.add('hidden');
      els.topNavMenuBtn.setAttribute('aria-expanded', 'false');
    }
  });

  els.topNavMenuBtn.addEventListener('click', () => {
    const isExpanded = els.topNavMenuBtn.getAttribute('aria-expanded') === 'true';
    els.topNavMenuBtn.setAttribute('aria-expanded', String(!isExpanded));
    els.topNavDropdown.classList.toggle('hidden', isExpanded);
  });

  els.topNavDropdown.querySelectorAll('a').forEach((link) => {
    link.addEventListener('click', () => {
      els.topNavDropdown.classList.add('hidden');
      els.topNavMenuBtn.setAttribute('aria-expanded', 'false');
    });
  });

  document.addEventListener('click', (event) => {
    if (!els.topNavMenu.contains(event.target)) {
      els.topNavDropdown.classList.add('hidden');
      els.topNavMenuBtn.setAttribute('aria-expanded', 'false');
    }
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

  const FEEDBACK_STORAGE_KEY = 'tae-song-feedback';

  function getFeedback() {
    try {
      const saved = JSON.parse(localStorage.getItem(FEEDBACK_STORAGE_KEY));
      return Array.isArray(saved) ? saved : [];
    } catch (_) {
      return [];
    }
  }

  function saveFeedback(items) {
    try {
      localStorage.setItem(FEEDBACK_STORAGE_KEY, JSON.stringify(items));
    } catch (_) {
      els.feedbackStatus.textContent = 'Could not save feedback in this browser.';
    }
  }

  function populateFeedbackTracks() {
    const options = RELEASES.map((track) =>
      `<option value="${track.id}">${track.title}</option>`
    ).join('');

    els.feedbackTrack.innerHTML = options;
    els.feedbackFilter.innerHTML =
      '<option value="all">All songs</option>' + options;
  }

  function configureSupportLink(link, url) {
    if (!url) return 'missing';

    try {
      const paymentUrl = new URL(url);
      if (paymentUrl.protocol !== 'https:') {
        throw new Error('Flutterwave payment links must use HTTPS.');
      }

      link.href = paymentUrl.href;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      link.removeAttribute('aria-disabled');
      link.removeAttribute('tabindex');
      return 'ready';
    } catch (error) {
      console.error('Invalid Support TAE payment link:', error);
      link.textContent = 'Payment link unavailable';
      return 'invalid';
    }
  }

  function setupSupportLinks() {
    const oneTime = configureSupportLink(els.supportOneTimeLink, SUPPORT_PAYMENT_LINK);

    if (oneTime === 'invalid') {
      els.supportStatus.textContent = 'The Flutterwave checkout link must be corrected before it can be used.';
    } else if (oneTime === 'ready') {
      els.supportStatus.textContent = 'Secure one-time checkout is provided by Flutterwave.';
    }
  }

  function formatFeedbackDate(timestamp) {
    return new Intl.DateTimeFormat(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    }).format(new Date(timestamp));
  }

  function renderFeedback() {
    const filter = els.feedbackFilter.value || 'all';
    const track = RELEASES.find((item) => item.id === filter);
    els.feedbackListTitle.textContent = track ? track.title : 'All songs';

    const items = getFeedback()
      .filter((item) => filter === 'all' || item.trackId === filter)
      .sort((a, b) => b.createdAt - a.createdAt);

    els.feedbackList.replaceChildren();

    if (!items.length) {
      const empty = document.createElement('p');
      empty.className = 'feedback-empty';
      empty.textContent = track
        ? `Be the first to share feedback on ${track.title}.`
        : 'No feedback yet. Be the first to share a thought.';
      els.feedbackList.appendChild(empty);
      return;
    }

    items.forEach((item) => {
      const trackItem = RELEASES.find((release) => release.id === item.trackId);
      const card = document.createElement('article');
      card.className = 'feedback-item';

      const heading = document.createElement('div');
      heading.className = 'feedback-item-heading';

      const name = document.createElement('strong');
      name.textContent = item.name || 'Anonymous listener';

      const rating = document.createElement('span');
      rating.className = 'feedback-rating';
      rating.setAttribute('aria-label', `${item.rating} out of 5 stars`);
      rating.textContent = `${'\u2605'.repeat(item.rating)}${'\u2606'.repeat(5 - item.rating)}`;

      heading.append(name, rating);

      const message = document.createElement('p');
      message.className = 'feedback-message';
      message.textContent = item.message;

      const meta = document.createElement('p');
      meta.className = 'feedback-meta';
      meta.textContent = `${trackItem ? trackItem.title : 'TAE Track'}  \u2022  ${formatFeedbackDate(item.createdAt)}`;

      card.append(heading, message, meta);
      els.feedbackList.appendChild(card);
    });
  }

  if (els.feedbackForm) {
    populateFeedbackTracks();
    renderFeedback();

    els.feedbackFilter.addEventListener('change', renderFeedback);

    els.feedbackForm.addEventListener('submit', (event) => {
      event.preventDefault();
      const ratingInput = els.feedbackForm.querySelector('input[name="feedbackRating"]:checked');
      if (!ratingInput) {
        els.feedbackStatus.textContent = 'Choose a rating before posting.';
        return;
      }

      const selectedTrack = RELEASES.find((item) => item.id === els.feedbackTrack.value);
      if (!selectedTrack) return;

      const item = {
        trackId: selectedTrack.id,
        rating: Number(ratingInput.value),
        name: els.feedbackName.value.trim(),
        message: els.feedbackMessage.value.trim(),
        createdAt: Date.now()
      };

      if (!item.message) return;

      const items = getFeedback();
      items.push(item);
      saveFeedback(items);
      els.feedbackStatus.textContent = 'Feedback posted.';
      els.feedbackForm.reset();
      els.feedbackFilter.value = selectedTrack.id;
      renderFeedback();

      setTimeout(() => {
        els.feedbackStatus.textContent = '';
      }, 2400);
    });
  }

  els.contactForm.addEventListener('submit', (e) => {
    e.preventDefault();
    els.formStatus.textContent = 'Inquiry drafted. Connect a form endpoint (Formspree/EmailJS) to send live.';
    els.contactForm.reset();
  });

  let navbarIsScrolled = false;
  const updateNavbarScrollState = () => {
    const isScrolled = window.scrollY > 24;
    if (isScrolled === navbarIsScrolled) return;
    navbarIsScrolled = isScrolled;
    if (isScrolled) {
      els.navbar.classList.add('bg-obsidian/90', 'backdrop-blur-xl', 'border-white/10');
    } else {
      els.navbar.classList.remove('bg-obsidian/90', 'backdrop-blur-xl', 'border-white/10');
    }
  };
  window.addEventListener('scroll', updateNavbarScrollState, { passive: true });
  updateNavbarScrollState();

  if (els.yearSpan) {
    els.yearSpan.textContent = new Date().getFullYear();
  }

  setupSupportLinks();
  syncPlayerUI(false);
  updateShuffleButton();
  updateRepeatButton();
  renderFilters();
  renderReleases();
  registerScrollReveals();
  loadTrackLyrics();
})();
