import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm'

const supabase = createClient(
  'https://kspraznekysiwyelcpmf.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtzcHJhem5la3lzaXd5ZWxjcG1mIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE5MDcyODEsImV4cCI6MjA2NzQ4MzI4MX0.LaWu00R5uHIW8spHJQX--gAJ1uOIoRz2wvQGFI5C4Lk'
)

const form = document.getElementById('registroForm')
const errorMsg = document.getElementById('errorMsg')
const successMsg = document.getElementById('successMsg')

form.addEventListener('submit', async (e) => {
  e.preventDefault()
  errorMsg.textContent = ''
  successMsg.textContent = ''

  if (!form.checkValidity()) {
    form.reportValidity()
    return
  }

  const nombre = form.nombre.value.trim()
  const correo = form.email.value.trim()
  const telefono = form.telefono.value.trim()
  const pass = form.contrasena.value.trim()
  const confirm = form.confirmarContrasena.value.trim()

  if (pass !== confirm) {
    errorMsg.textContent = '❌ Las contraseñas no coinciden'
    return
  }

  try {
    // 1. Crear usuario en Supabase Auth
    const { data, error: authError } = await supabase.auth.signUp({
      email: correo,
      password: pass
    })

    if (authError) throw authError
    const userId = data.user?.id
    if (!userId) throw new Error('No se pudo obtener el ID del usuario.')

    // 2. Insertar usuario en la tabla usuarios (con ID explícito)
    const { error: insertError } = await supabase.from('usuarios').insert([{
      id: userId,
      nombre,
      correo,
      telefono,
      role: 'user'
    }])

    if (insertError) throw insertError

    successMsg.textContent = '✅ ¡Registro exitoso!'
    setTimeout(() => {
      window.location.href = 'login.html'
    }, 2000)

  } catch (err) {
    console.error('Registro error:', err)
    errorMsg.textContent = '❌ ' + (err.message || 'Error inesperado')
  }
})
