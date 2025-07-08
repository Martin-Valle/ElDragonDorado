import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm'

/** 1) Instancia Supabase **/
const SUPA_URL = 'https://kspraznekysiwyelcpmf.supabase.co'
const SUPA_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtzcHJhem5la3lzaXd5ZWxjcG1mIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE5MDcyODEsImV4cCI6MjA2NzQ4MzI4MX0.LaWu00R5uHIW8spHJQX--gAJ1uOIoRz2wvQGFI5C4Lk'
const supabase = createClient(SUPA_URL, SUPA_KEY)

/** 2) DOM Ready **/
document.addEventListener('DOMContentLoaded', () => {
  initAuth()
  setupThemeToggle()
  setupMobileMenu()
  loadMenu()
  actualizarContadorCarrito()
})

/** Login/Logout dinámico **/
function initAuth() {
  const authDiv = document.querySelector('.auth-buttons')
  const user = JSON.parse(localStorage.getItem('usuario'))
  if (!authDiv) return

  if (user) {
    authDiv.innerHTML = `
      <span>👤 ${user.nombre}</span>
      <button id="btn-logout" class="btn-login">Cerrar Sesión</button>
    `
    document.getElementById('btn-logout')
  .addEventListener('click', async () => {
    // 1) Cierra sesión en Supabase
    await supabase.auth.signOut()
    // 2) Limpia localStorage
    localStorage.removeItem('usuario')
    // 3) Reemplaza la página para que "Atrás" no reactive sesión
    location.replace('index.html')
  })

  } else {
    authDiv.innerHTML = `<button id="btn-login" class="btn-login">Iniciar Sesión</button>`
    document.getElementById('btn-login')
      .addEventListener('click', () => location.href = 'login.html')
  }
}

/** Cambio claro/oscuro **/
function setupThemeToggle() {
  const btn = document.getElementById('btnToggleTema')
  if (!btn) return
  const body = document.body
  const tema = localStorage.getItem('tema')
  if (tema === 'dark') {
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

/** Menú hamburguesa **/
function setupMobileMenu() {
  const toggle = document.getElementById('menu-toggle')
  const nav    = document.getElementById('nav-links')
  if (toggle && nav) {
    toggle.addEventListener('click', () => nav.classList.toggle('active'))
  }
}

/** Carga y renderiza productos **/
async function loadMenu() {
  const { data: productos, error } = await supabase
    .from('productos')
    .select('*')
    .eq('visible', true)
    .order('categoria', { ascending: true })

  if (error) {
    console.error('Error al cargar productos:', error.message)
    return
  }

  const grupos = productos.reduce((acc, p) => {
    ;(acc[p.categoria] = acc[p.categoria]||[]).push(p)
    return acc
  }, {})

  const idMap = {
    'Combinaciones':'grid-combinaciones',
    'Entradas':'grid-entradas',
    'Sopas':'grid-sopas',
    'Arroz':'grid-arroz',
    'Bebidas':'grid-bebidas',
    'Postres':'grid-postres',
    'Extras':'grid-extras'
  }

  Object.entries(grupos).forEach(([cat, items]) => {
    const grid = document.getElementById(idMap[cat])
    if (!grid) return
    grid.innerHTML = ''
    items.forEach(p => {
      const card = document.createElement('div')
      card.className = 'plato-card'
      card.innerHTML = `
        <img src="${p.imagen}" alt="${p.nombre}"
             onerror="this.src='https://via.placeholder.com/240x180'">
        <h4>${p.nombre}</h4>
        <p>${p.descripcion||''}</p>
        <p class="precio">$${parseFloat(p.precio).toFixed(2)}</p>
        <button class="btn-agregar"
                data-producto-id="${p.id}"
                data-producto-nombre="${p.nombre}">
          Agregar
        </button>
      `
      card.querySelector('.btn-agregar')
          .addEventListener('click', () =>
            addToCart(p.id, p.nombre)
          )
      grid.appendChild(card)
    })
  })
}

/** Añade al carrito con mensaje personalizado **/
async function addToCart(productId, productoNombre) {
  const user = JSON.parse(localStorage.getItem('usuario'))
  if (!user) {
    return alert('🔒 Debes iniciar sesión.')
  }

  const { error } = await supabase
    .from('carrito')
    .insert([{
      user_id:     user.id,
      producto_id: productId,
      cantidad:    1
    }])

  if (error) {
    console.error('Error al añadir al carrito:', error.message)
    return alert('❌ No se pudo añadir al carrito.')
  }

  // Mensaje incluya nombre y cantidad
  alert(`✅ Se ha añadido 1 “${productoNombre}” al carrito.`)
  actualizarContadorCarrito()
}
/** Actualiza el contador sumando las cantidades **/
async function actualizarContadorCarrito() {
  const user = JSON.parse(localStorage.getItem('usuario'))
  const span = document.getElementById('cart-count')
  if (!user || !span) return

  // 1) Trae todas las filas con su cantidad
  const { data, error } = await supabase
    .from('carrito')
    .select('cantidad')
    .eq('user_id', user.id)

  if (error) {
    console.error('Error al leer carrito:', error.message)
    span.textContent = '(0)'
    localStorage.setItem('cartCount', 0)
    return
  }

  // 2) Suma todas las cantidades
  const total = data.reduce((sum, item) => sum + item.cantidad, 0)

  // 3) Muestra y sincroniza
  span.textContent = total > 0 ? `(${total})` : '(0)'
  localStorage.setItem('cartCount', total)
}
// justo después de crear tu client supabase
supabase.auth.onAuthStateChange((event, session) => {
  if (event === 'SIGNED_OUT') {
    // se cerró la sesión: lo mismo que cuando haces removeItem en Admin
    localStorage.removeItem('usuario')
    initAuth()
    actualizarContadorCarrito()
  }
})
window.addEventListener('storage', e => {
  if (e.key === 'usuario') {
    initAuth()
    actualizarContadorCarrito()
  }
})
