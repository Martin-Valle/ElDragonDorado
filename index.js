// js/index.js

import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm'

// ————————————————————————————————
// 1) Configura tu cliente Supabase
// ————————————————————————————————
const SUPA_URL = 'https://kspraznekysiwyelcpmf.supabase.co'
const SUPA_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtzcHJhem5la3lzaXd5ZWxjcG1mIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE5MDcyODEsImV4cCI6MjA2NzQ4MzI4MX0.LaWu00R5uHIW8spHJQX--gAJ1uOIoRz2wvQGFI5C4Lk'
const supabase = createClient(SUPA_URL, SUPA_KEY)

// ————————————————————————————————
// 2) DOMContentLoaded: arrancamos toda la lógica
// ————————————————————————————————
document.addEventListener('DOMContentLoaded', async () => {
  const page = window.location.pathname.split('/').pop()

  // — PROTECCIÓN LOGIN —
  if (page === 'login.html') {
    const stored = localStorage.getItem('usuario')
    if (stored) {
      const { role } = JSON.parse(stored)
      return location.replace(role === 'admin' ? 'admin.html' : 'menu.html')
    }
    const { data: { session } } = await supabase.auth.getSession()
    if (session?.user) return location.replace('menu.html')
  }

  // — PROTECCIÓN MENU / ADMIN —
  if (page === 'menu.html' || page === 'admin.html') {
    const stored = localStorage.getItem('usuario')
    if (!stored) return location.replace('login.html')
  }

  // — CONFIG. GENERAL —
  const {
    data: { session },
    error: sessionErr
  } = await supabase.auth.getSession()
  if (sessionErr) console.error('Error al obtener sesión:', sessionErr.message)

  handleAuthState(session)
  supabase.auth.onAuthStateChange((_, newSession) => {
    handleAuthState(newSession)
  })

  initThemeToggle()
  initMobileMenu()

  // 👉 Actualiza el carrito desde BD o localStorage
  await updateCartCount()
})

/**
 * Actualiza todos los badges de carrito (busca .cart-count)
 */
async function updateCartCount() {
  // Si tu carrito está en Supabase, usa esta sección:
  const {
    data: { session }
  } = await supabase.auth.getSession()
  let count = 0

  if (session?.user) {
    // Cuenta filas en tu tabla "carrito" filtradas por usuario_id
    const { count: c, error } = await supabase
      .from('carrito')
      .select('*', { count: 'exact', head: true })
      .eq('usuario_id', session.user.id)

    if (!error && typeof c === 'number') {
      count = c
    }
  } else {
    // Si aún quieres fallback a localStorage:
    const items = JSON.parse(localStorage.getItem('carritoCitas') || '[]')
    count = items.length
  }

  document.querySelectorAll('.cart-count').forEach(el => {
    el.textContent = `(${count})`
  })
}

/**
 * Muestra login/logout y refresca carrito al cambiar auth
 */
async function handleAuthState(session) {
  const container = document.querySelector('.auth-buttons')
  if (!container) return

  if (session?.user) {
    let nombreUsuario = null
    try {
      const u = JSON.parse(localStorage.getItem('usuario') || '{}')
      nombreUsuario = u.nombre || null
    } catch {}
    if (!nombreUsuario) {
      const { data: perfil } = await supabase
        .from('usuarios')
        .select('nombre')
        .eq('id', session.user.id)
        .single()
      nombreUsuario = perfil?.nombre || null
    }
    if (!nombreUsuario) nombreUsuario = session.user.email

    container.innerHTML = `
      <span class="usuario-nombre">👤 ${nombreUsuario}</span>
      <button id="btn-logout" class="btn-logout">Cerrar Sesión</button>
    `
    document.getElementById('btn-logout')?.addEventListener('click', async () => {
  await supabase.auth.signOut()
  localStorage.removeItem('usuario')
  // Ahora vamos al login, para empezar sin sesión
  location.replace('login.html')
})

  } else {
    container.innerHTML = `
      <button id="btn-login" class="btn-login">Iniciar Sesión</button>
    `
    document.getElementById('btn-login')?.addEventListener('click', () => {
      location.href = 'login.html'
    })
  }

  // Cada vez que cambie la auth, refresca el carrito
  await updateCartCount()
}

function initThemeToggle() {
  const btn = document.getElementById('btnToggleTema')
  const body = document.body
  if (!btn) return

  const saved = localStorage.getItem('tema')
  if (saved === 'dark') {
    body.classList.add('dark-mode')
    btn.textContent = '☀️'
  } else {
    btn.textContent = '🌙'
  }
  btn.addEventListener('click', () => {
    const dark = body.classList.toggle('dark-mode')
    btn.textContent = dark ? '☀️' : '🌙'
    localStorage.setItem('tema', dark ? 'dark' : 'light')
  })
}

function initMobileMenu() {
  const toggle = document.getElementById('menu-toggle')
  const nav = document.getElementById('nav-links')
  if (toggle && nav) {
    toggle.addEventListener('click', () => nav.classList.toggle('active'))
  }
}
// al final de index.js

function initThemeToggle() {
  const btn  = document.getElementById('btnToggleTema')
  if (!btn) return
  const body = document.body
  if (localStorage.getItem('tema') === 'dark') {
    body.classList.add('dark-mode')
    btn.textContent = '☀️'
  } else {
    btn.textContent = '🌙'
  }
  btn.addEventListener('click', () => {
    const dark = body.classList.toggle('dark-mode')
    btn.textContent = dark ? '☀️' : '🌙'
    localStorage.setItem('tema', dark ? 'dark' : 'light')
  })
}