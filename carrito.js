// carrito.js

import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm'

const SUPA_URL = 'https://kspraznekysiwyelcpmf.supabase.co'
const SUPA_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtzcHJhem5la3lzaXd5ZWxjcG1mIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE5MDcyODEsImV4cCI6MjA2NzQ4MzI4MX0.LaWu00R5uHIW8spHJQX--gAJ1uOIoRz2wvQGFI5C4Lk'

const supabase = createClient(SUPA_URL, SUPA_KEY)

window.addEventListener('DOMContentLoaded', initCarrito)

async function initCarrito() {
  const user = JSON.parse(localStorage.getItem('usuario'))
  if (!user) {
    alert('🔒 Debes iniciar sesión.')
    return window.location.href = 'login.html'
  }

  document.querySelector('.btn-volver')
    .addEventListener('click', () => window.history.back())

  document.querySelector('.btn-seguir')
    .addEventListener('click', () => window.location.href = 'menu.html')

  document.querySelector('.btn-vaciar')
    .addEventListener('click', onVaciarCarrito)

  document.querySelector('.btn-confirmar')
    .addEventListener('click', _confirmarPedido)

  document.body.addEventListener('click', async e => {
    if (e.target.classList.contains('btn-mas')) {
      await _modificarCantidad(e.target.dataset.id, +1)
    }
    if (e.target.classList.contains('btn-menos')) {
      await _modificarCantidad(e.target.dataset.id, -1)
    }
  })

  await _renderizarCarrito()
  await _actualizarContador()
}

async function onVaciarCarrito() {
  const user = JSON.parse(localStorage.getItem('usuario'))
  // 1) Cuento ítems
  const { count, error: errCount } = await supabase
    .from('carrito')
    .select('*', { head: true, count: 'exact' })
    .eq('user_id', user.id)

  if (errCount) {
    return alert('❌ Error al comprobar el carrito.')
  }

  if (count === 0) {
    return alert('⚠️ Su carrito ya está vacío.')
  }

  // 2) Pido confirmación
  const ok = confirm('¿Está seguro que desea vaciar todo el carrito?')
  if (!ok) return

  // 3) Borro y renderizo
  await supabase.from('carrito').delete().eq('user_id', user.id)
  await _renderizarCarrito()
  await _actualizarContador()
}

// ---------------- RENDERIZADO ----------------
async function _renderizarCarrito() {
  const user = JSON.parse(localStorage.getItem('usuario'))
  const cont = document.querySelector('.contenedor-carrito')
  const tot  = document.querySelector('.carrito-total')
  cont.innerHTML = ''
  tot.innerHTML  = ''

  const { data: lineas, error } = await supabase
    .from('carrito')
    .select(`id, cantidad, producto:productos(id,nombre,precio,imagen)`)
    .eq('user_id', user.id)

  if (error) {
    return cont.innerHTML = `<p style="color:red">Error cargando carrito.</p>`
  }

  let subtotal = 0
  if (lineas.length === 0) {
    cont.innerHTML = '<p>Tu carrito está vacío.</p>'
  } else {
    lineas.forEach(lin => {
      const p = lin.producto
      const sub = p.precio * lin.cantidad
      subtotal += sub
      cont.insertAdjacentHTML('beforeend', `
        <div class="item-carrito">
          <div class="producto-img">
            <img src="${p.imagen}" alt="${p.nombre}"
                 onerror="this.src='https://via.placeholder.com/150'">
          </div>
          <div class="producto-info">
            <h4>${p.nombre}</h4>
            <p>Precio: $${p.precio.toFixed(2)}</p>
            <div class="cantidad-controles">
              <button class="btn-menos" data-id="${lin.id}">−</button>
              <span>${lin.cantidad}</span>
              <button class="btn-mas"  data-id="${lin.id}">+</button>
            </div>
            <p>Subtotal: $${sub.toFixed(2)}</p>
          </div>
        </div>
      `)
    })
  }

  const iva      = subtotal * 0.15
  const totalIVA = subtotal + iva
  tot.innerHTML = `
    <p><strong>Subtotal:</strong> $${subtotal.toFixed(2)}</p>
    <p><strong>IVA (15%):</strong> $${iva.toFixed(2)}</p>
    <p><strong>Total:</strong> $${totalIVA.toFixed(2)}</p>
  `
}
// ------------ MODIFICAR CANTIDAD ------------
async function _modificarCantidad(lineaId, delta) {
  const { data: [lin] } = await supabase
    .from('carrito').select('cantidad, producto_id').eq('id', lineaId).limit(1)
  if (!lin) return

  const nuevaCant = lin.cantidad + delta
  if (nuevaCant < 1) {
    await supabase.from('carrito').delete().eq('id', lineaId)
  } else {
    await supabase.from('carrito').update({ cantidad: nuevaCant }).eq('id', lineaId)
  }

  // Ajuste stock (opcional)
  const { data: prod } = await supabase
    .from('productos').select('stock').eq('id', lin.producto_id).single()
  if (prod) {
    await supabase.from('productos')
      .update({ stock: prod.stock - delta })
      .eq('id', lin.producto_id)
  }

  await _renderizarCarrito()
  await _actualizarContador()
}

// --------- ACTUALIZAR CONTADOR ----------
async function _actualizarContador() {
  const user = JSON.parse(localStorage.getItem('usuario'))
  const { count } = await supabase
    .from('carrito')
    .select('*', { head: true, count: 'exact' })
    .eq('user_id', user.id)
  document.querySelector('.cart-count').textContent = count > 0 ? `(${count})` : ''
}

// --------- CONFIRMAR PEDIDO ----------
async function _confirmarPedido() {
  const user = JSON.parse(localStorage.getItem('usuario'))
  const { data: lineas, error: errLines } = await supabase
    .from('carrito')
    .select(`cantidad, producto:productos(id,precio,stock)`)
    .eq('user_id', user.id)

  if (errLines) {
    return alert('❌ Error al leer carrito.')
  }
  if (!lineas || lineas.length === 0) {
    return alert('⚠️ Tu carrito está vacío.')
  }

  // 1) VALIDAR STOCK para cada línea
  for (let { producto, cantidad } of lineas) {
    if (cantidad > producto.stock) {
      return alert(
        `😔 No hay suficiente stock de "${producto.id}". ` +
        `Disponibles: ${producto.stock}, solicitados: ${cantidad}`
      )
    }
  }

  // 2) Calcular total
  let total = 0
  lineas.forEach(l => {
    total += l.cantidad * l.producto.precio
  })

  // 3) Crear cabecera de factura
  const { data: fac, error: errFac } = await supabase
    .from('facturas')
    .insert({ user_id: user.id, total })
    .select('id')
    .single()
  if (errFac || !fac) {
    return alert('❌ Falló al crear la factura.')
  }

  // 4) Crear detalles
  const detalles = lineas.map(l => ({
    factura_id:      fac.id,
    producto_id:     l.producto.id,
    cantidad:        l.cantidad,
    precio_unitario: l.producto.precio,
    subtotal:        l.cantidad * l.producto.precio
  }))
  const { error: errDet } = await supabase
    .from('detalle_factura')
    .insert(detalles)
  if (errDet) {
    return alert('❌ Falló al crear los detalles.')
  }

  // 5) ACTUALIZAR STOCK de cada producto
  for (let { producto, cantidad } of lineas) {
    const nuevaCant = producto.stock - cantidad
    const { error: errUpd } = await supabase
      .from('productos')
      .update({ stock: nuevaCant })
      .eq('id', producto.id)
    if (errUpd) {
      console.error('Error actualizando stock:', errUpd)
      // no abortamos todo, pero avisamos al admin
    }
  }

  // 6) Vaciar carrito
  await supabase.from('carrito').delete().eq('user_id', user.id)

  alert('✅ Pedido confirmado correctamente.')
  await _renderizarCarrito()
  await _actualizarContador()
}
