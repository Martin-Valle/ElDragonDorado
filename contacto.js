// ————————————————————————————————————————
// 1) Toast helper
// ————————————————————————————————————————
function showToast(msg) {
  const container = document.getElementById('toast-container');
  if (!container) return;
  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.textContent = msg;
  container.appendChild(toast);
  toast.addEventListener('animationend', e => {
    if (e.animationName === 'fadeOut') container.removeChild(toast);
  });
}

// ————————————————————————————————————————
// 2) Toggle modo oscuro / claro
// ————————————————————————————————————————
function setupThemeToggle() {
  const btn  = document.getElementById('btnToggleTema');
  const body = document.body;
  if (!btn) return;

  // 2.1) Inicializa según localStorage
  const tema = localStorage.getItem('tema') || 'light';
  if (tema === 'dark') {
    body.classList.add('dark-mode');
    btn.textContent = '☀️';
  } else {
    btn.textContent = '🌙';
  }

  // 2.2) Al clic alterna y guarda
  btn.addEventListener('click', () => {
    const isDark = body.classList.toggle('dark-mode');
    btn.textContent = isDark ? '☀️' : '🌙';
    localStorage.setItem('tema', isDark ? 'dark' : 'light');
      
  });
}

// ————————————————————————————————————————
// 3) Reproductor de vídeo
// ————————————————————————————————————————
function setupVideoPlayer() {
  const video    = document.getElementById('miVideo');
  if (!video) return;

  const btnPlay  = document.getElementById('btnPlay');
  const btnMute  = document.getElementById('btnMute');
  const volInput = document.getElementById('volumen');
  const barra    = document.getElementById('barra');
  const prog     = document.getElementById('progreso');
  let interval;

  const updateBar = () => {
    if (!video.ended) {
      const p = (video.currentTime / video.duration) * 100;
      prog.style.width = `${p}%`;
    } else {
      prog.style.width = '0%';
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
    prog.style.width = `${pct * 100}%`;
  });
}

// ————————————————————————————————————————
// 4) Inicialización al cargar DOM
// ————————————————————————————————————————
window.addEventListener('DOMContentLoaded', () => {
  setupThemeToggle();
  setupVideoPlayer();
});
