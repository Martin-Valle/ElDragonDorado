// admin.js
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

const SUPA_URL = 'https://kspraznekysiwyelcpmf.supabase.co';
const SUPA_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtzcHJhem5la3lzaXd5ZWxjcG1mIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE5MDcyODEsImV4cCI6MjA2NzQ4MzI4MX0.LaWu00R5uHIW8spHJQX--gAJ1uOIoRz2wvQGFI5C4Lk';
const supabase = createClient(SUPA_URL, SUPA_KEY);

// ————————————————————————————————————————————————
// 1) Listener de estado de sesión (misma pestaña)
supabase.auth.onAuthStateChange((event, session) => {
  if (event === 'SIGNED_OUT') {
    localStorage.removeItem('usuario')
    window.location.replace('index.html')
  }
})

document.addEventListener('DOMContentLoaded', () => {
  // — DOM refs —
  const sections      = {
    products: document.getElementById('section-products'),
    invoices: document.getElementById('section-invoices'),
  }
  const tblProducts   = document.querySelector('#tbl-products tbody')
  const tblInvoices   = document.querySelector('#tbl-invoices tbody')
  const modalProd     = document.getElementById('modal-product')
  const modalDetails  = document.getElementById('modal-details')
  const modalInvoice  = document.getElementById('modal-invoice')
  const formProduct   = document.getElementById('form-product')
  const btnCloseDet   = document.getElementById('btn-close-details')
  const btnCloseInv   = document.getElementById('btn-close-inv')
  const btnAddProduct = document.getElementById('btn-add-product')
  const btnLogout     = document.getElementById('btn-logout')
  let editingId       = null

  // — Filtros —
  const filterCategory = document.getElementById('filter-category')
  const sortStock      = document.getElementById('sort-stock')
  const sortName       = document.getElementById('sort-name')

  let currentFilterCat = ''
  let currentSortStock = ''
  let currentSortName  = ''

  // — Navegación entre secciones —
  document.getElementById('btn-products').onclick = () => showSection('products')
  document.getElementById('btn-invoices').onclick = () => showSection('invoices')
  function showSection(key) {
    Object.values(sections).forEach(s => s.classList.add('hidden'))
    sections[key].classList.remove('hidden')
    if (key === 'products') loadProducts()
    else loadInvoices()
  }

  // — Logout —
  btnLogout.addEventListener('click', async () => {
    await supabase.auth.signOut()
  })

  // — Verifica usuario + role admin —
  async function init() {
    const { data: { user }, error: userErr } = await supabase.auth.getUser()
    if (userErr || !user) return window.location.replace('login.html')

    const { data: perfil, error: profErr } = await supabase
      .from('usuarios')
      .select('role')
      .eq('id', user.id)
      .single()
    if (profErr || perfil.role !== 'admin') {
      alert('No autorizado')
      return window.location.replace('login.html')
    }
    showSection('products')
  }

  // — Cargar productos con filtros y orden —
  async function loadProducts() {
    let query = supabase
      .from('productos')
      .select('id,nombre,precio,stock,categoria,imagen')

    // 1) Filtrar categoría
    if (currentFilterCat) {
      query = query.eq('categoria', currentFilterCat)
    }

    // 2) Ordenar
    // - Primero por stock
    if (currentSortStock === 'stock_desc') {
      query = query.order('stock', { ascending: false })
    } else if (currentSortStock === 'stock_asc') {
      query = query.order('stock', { ascending: true })
    }

    // - Luego por nombre, si se seleccionó
    if (currentSortName === 'name_asc') {
      query = query.order('nombre', { ascending: true })
    } else if (currentSortName === 'name_desc') {
      query = query.order('nombre', { ascending: false })
    }

    const { data: productos, error } = await query.order('id', { ascending: true })
    if (error) {
      return alert('Error al cargar productos: ' + error.message)
    }

    tblProducts.innerHTML = ''
    productos.forEach(p => {
      const tr = document.createElement('tr')
      tr.innerHTML = `
        <td>${p.id}</td>
        <td>${p.nombre}</td>
        <td>$${parseFloat(p.precio).toFixed(2)}</td>
        <td>${p.stock}</td>
        <td>${p.categoria}</td>
        <td>
          <img src="${p.imagen}"
               alt="${p.nombre}"
               style="width:50px;height:50px;object-fit:cover;">
        </td>
        <td>
          <button class="action" onclick='openDetails(${JSON.stringify(p)})'>🔍</button>
          <button class="action" onclick='openModal(${JSON.stringify(p)})'>✏️</button>
          <button class="action" onclick='deleteProduct("${p.id}")'>🗑️</button>
        </td>
      `
      tblProducts.appendChild(tr)
    })
  }

  // — Listeners de filtros —
  filterCategory.addEventListener('change', () => {
    currentFilterCat = filterCategory.value
    loadProducts()
  })
  sortStock.addEventListener('change', () => {
    currentSortStock = sortStock.value
    loadProducts()
  })
  sortName.addEventListener('change', () => {
    currentSortName = sortName.value
    loadProducts()
  })

// — Cargar facturas —
async function loadInvoices() {
  const { data: facturas, error } = await supabase
    .from('facturas')
    .select('id,user_id,total,created_at')
    .order('created_at', { ascending: false })
  if (error) {
    return alert('Error al cargar facturas: ' + error.message)
  }

  tblInvoices.innerHTML = ''
  facturas.forEach(f => {
    const tr = document.createElement('tr')
    tr.innerHTML = `
      <td>
        <a 
          href="../views/factura.html?id=${f.id}"
          target="_blank"
          rel="noopener noreferrer"
        >
          ${f.id}
        </a>
      </td>
      <td>${f.user_id}</td>
      <td>$${parseFloat(f.total).toFixed(2)}</td>
      <td>${new Date(f.created_at).toLocaleString()}</td>
    `
    tblInvoices.appendChild(tr)
  })
}

  // — Modal crear/editar producto —
  window.openModal = p => {
    editingId = p.id || null
    document.getElementById('modal-title').textContent =
      editingId ? 'Editar Plato' : 'Nuevo Plato'
    formProduct.nombre.value    = p.nombre    || ''
    formProduct.precio.value    = p.precio    != null ? p.precio : ''
    formProduct.stock.value     = p.stock     != null ? p.stock  : ''
    formProduct.categoria.value = p.categoria || ''
    formProduct.imagen.value    = p.imagen    || ''
    modalProd.classList.remove('hidden')
  }
  function closeModal() {
    editingId = null
    formProduct.reset()
    modalProd.classList.add('hidden')
  }
  document.getElementById('btn-cancel').onclick = closeModal
  btnAddProduct.onclick = () => openModal({})

  formProduct.addEventListener('submit', async e => {
    e.preventDefault()
    const f         = new FormData(formProduct)
    const nombre    = f.get('nombre').trim()
    const precio    = parseFloat(f.get('precio'))
    const stock     = parseInt(f.get('stock'), 10)
    const categoria = f.get('categoria')
    const imagen    = f.get('imagen').trim()

    if (nombre.length < 3)         return alert('Nombre ≥ 3 caracteres')
    if (isNaN(precio) || precio<0) return alert('Precio ≥ 0')
    if (isNaN(stock)  || stock<0)  return alert('Stock ≥ 0')
    if (!categoria)                return alert('Categoría requerida')
    if (!imagen)                   return alert('URL imagen requerida')

    let res
    if (editingId) {
      res = await supabase
        .from('productos')
        .update({ nombre, precio, stock, categoria, imagen })
        .eq('id', editingId)
    } else {
      res = await supabase
        .from('productos')
        .insert({ nombre, precio, stock, categoria, imagen })
        .select()
    }
    if (res.error) alert(res.error.message)
    else {
      closeModal()
      loadProducts()
    }
  })

  // — Eliminar producto (y detalles) —
  window.deleteProduct = async id => {
    if (!confirm('¿Eliminar este plato?')) return
    let { error } = await supabase
      .from('detalle_factura')
      .delete()
      .eq('producto_id', id)
    if (error) return alert('No se pudo eliminar detalles.')
    ({ error } = await supabase
      .from('productos')
      .delete()
      .eq('id', id))
    if (error) alert('No se pudo eliminar el plato.')
    else loadProducts()
  }

  // — Ver detalles de producto —
  window.openDetails = p => {
    document.getElementById('detail-id').textContent       = p.id
    document.getElementById('detail-name').textContent     = p.nombre
    document.getElementById('detail-price').textContent    = parseFloat(p.precio).toFixed(2)
    document.getElementById('detail-stock').textContent    = p.stock
    document.getElementById('detail-category').textContent = p.categoria
    document.getElementById('detail-image').src            = p.imagen
    modalDetails.classList.remove('hidden')
  }
  btnCloseDet.onclick = () => modalDetails.classList.add('hidden')

  // — Ver detalle de factura —
  window.openInvoice = async invId => {
    const { data: [inv], error: invErr } = await supabase
      .from('facturas')
      .select('id,user_id,total,created_at')
      .eq('id', invId)
    if (invErr) return alert(invErr.message)

    document.getElementById('inv-id').textContent    = inv.id
    document.getElementById('inv-user').textContent  = inv.user_id
    document.getElementById('inv-total').textContent = parseFloat(inv.total).toFixed(2)
    document.getElementById('inv-date').textContent  = new Date(inv.created_at).toLocaleString()

    const { data: details, error: detErr } = await supabase
      .from('detalle_factura')
      .select(`
        cantidad,
        precio_unitario,
        subtotal,
        producto:productos(nombre)
      `)
      .eq('factura_id', invId)
    if (detErr) return alert(detErr.message)

    const tbody = document.querySelector('#tbl-inv-details tbody')
    tbody.innerHTML = ''
    details.forEach(d => {
      const tr = document.createElement('tr')
      tr.innerHTML = `
        <td>${d.producto.nombre}</td>
        <td>${d.cantidad}</td>
        <td>$${parseFloat(d.precio_unitario).toFixed(2)}</td>
        <td>$${parseFloat(d.subtotal).toFixed(2)}</td>
      `
      tbody.appendChild(tr)
    })

    modalInvoice.classList.remove('hidden')
  }
  btnCloseInv.onclick = () => modalInvoice.classList.add('hidden')

  // — Arranque —
  init()
})
