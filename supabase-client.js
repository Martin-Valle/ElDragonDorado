import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm'

const supabase = createClient(
  'https://kspraznekysiwyelcpmf.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtzcHJhem5la3lzaXd5ZWxjcG1mIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE5MDcyODEsImV4cCI6MjA2NzQ4MzI4MX0.LaWu00R5uHIW8spHJQX--gAJ1uOIoRz2wvQGFI5C4Lk'
)


// 2) Toggle modo oscuro / claro
function setupThemeToggle() {
  const btn  = document.getElementById('btnToggleTema');
  const body = document.body;
  if (!btn) return;

  // Inicializa según lo guardado
  const tema = localStorage.getItem('tema') || 'light';
  if (tema === 'dark') {
    body.classList.add('dark-mode');
    btn.textContent = '☀️';
  } else {
    body.classList.remove('dark-mode');
    btn.textContent = '🌙';
  }

  // Al clic, alterna y guarda
  btn.addEventListener('click', () => {
    const isDark = body.classList.toggle('dark-mode');
    btn.textContent = isDark ? '☀️' : '🌙';
    localStorage.setItem('tema', isDark ? 'dark' : 'light');
  });
}

// 5) Reproductor de vídeo
function setupVideoPlayer() {
  const video    = document.getElementById('miVideo');
  if (!video) return;

  const btnPlay  = document.getElementById('btnPlay');
  const btnMute  = document.getElementById('btnMute');
  const volInput = document.getElementById('volumen');
  const barra    = document.getElementById('barra');
  const progreso = document.getElementById('progreso');
  let interval;

  const updateBar = () => {
    if (!video.ended) {
      const pct = (video.currentTime / video.duration) * 100;
      progreso.style.width = `${pct}%`;
    } else {
      progreso.style.width = '0%';
      clearInterval(interval);
      btnPlay?.classList.replace('icon-pause','icon-play');
    }
  };

  btnPlay?.addEventListener('click', () => {
    if (video.paused || video.ended) {
      video.play()
        .then(() => {
          btnPlay.classList.replace('icon-play','icon-pause');
          interval = setInterval(updateBar, 500);
        })
        .catch(() => showToast('⚠️ Error al reproducir el vídeo.'));
    } else {
      video.pause();
      btnPlay.classList.replace('icon-pause','icon-play');
      clearInterval(interval);
    }
  });

  btnMute?.addEventListener('click', () => {
    video.muted = !video.muted;
    btnMute.classList.toggle('icon-mute', video.muted);
    btnMute.classList.toggle('icon-volume', !video.muted);
  });

  volInput?.addEventListener('input', () => {
    video.volume = +volInput.value;
    if (video.volume === 0) {
      video.muted = true;
      btnMute?.classList.replace('icon-volume','icon-mute');
    } else {
      video.muted = false;
      btnMute?.classList.replace('icon-mute','icon-volume');
    }
  });

  barra?.addEventListener('click', e => {
    const rect = barra.getBoundingClientRect();
    const pct  = (e.clientX - rect.left) / barra.offsetWidth;
    video.currentTime = pct * video.duration;
    progreso.style.width = `${pct * 100}%`;
  });
}
// 6) Inicialización única al cargar el DOM
window.addEventListener('DOMContentLoaded', () => {
  setupThemeToggle();
  setupMobileMenu();
  setupAuthButtons();
  setupVideoPlayer();
});
