// login.js
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm'

const SUPA_URL = 'https://kspraznekysiwyelcpmf.supabase.co'
const SUPA_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtzcHJhem5la3lzaXd5ZWxjcG1mIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE5MDcyODEsImV4cCI6MjA2NzQ4MzI4MX0.LaWu00R5uHIW8spHJQX--gAJ1uOIoRz2wvQGFI5C4Lk'
const supabase = createClient(SUPA_URL, SUPA_KEY)

document.addEventListener('DOMContentLoaded', () => {
  const form     = document.getElementById('loginForm')
  const msgError = document.getElementById('msgError')

  form.addEventListener('submit', async e => {
    e.preventDefault()
    msgError.textContent = ''

    const email    = document.getElementById('correo').value.trim()
    const password = document.getElementById('clave').value.trim()

    // 1) Intentar iniciar sesión
    const { data, error: authErr } = await supabase.auth.signInWithPassword({
      email,
      password
    })
    if (authErr) {
      msgError.textContent = `❌ ${authErr.message}`
      return
    }

    const user = data.user

    // 2) Obtener perfil (nombre, teléfono, role) de la tabla "usuarios"
    const { data: profile, error: profileErr } = await supabase
      .from('usuarios')
      .select('nombre, telefono, role')
      .eq('id', user.id)
      .single()

    if (profileErr) {
      msgError.textContent = `❌ ${profileErr.message}`
      return
    }

    // 3) Guardar datos en localStorage
    const { nombre, telefono, role } = profile
    localStorage.setItem('usuario', JSON.stringify({
      id:       user.id,
      nombre,
      correo:   user.email,
      telefono,
      role
    }))

    // 4) Redirigir según rol
    if (role === 'admin') {
      window.location.href = 'admin.html'
    } else {
      window.location.href = 'index.html'
    }
  })
})
