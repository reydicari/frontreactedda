import { useState, useEffect } from 'react'
import './usuarios.css'

const BASE_URL = 'http://localhost:5093/api/usuarios'

// Roles estáticos hasta que el back entregue el endpoint
const ROLES_ESTATICOS = [
  { id: 1, nombre: 'administrador', estado: true },
  { id: 2, nombre: 'secretaria', estado: true }
]

function getToken() {
  try {
    const authData = JSON.parse(sessionStorage.getItem('authData') || '{}')
    return authData.token || ''
  } catch {
    return ''
  }
}

function authHeaders() {
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${getToken()}`
  }
}

function Usuarios() {
  const [usuarios, setUsuarios] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [showAddModal, setShowAddModal] = useState(false)
  const [editingUser, setEditingUser] = useState(null)
  const [notification, setNotification] = useState(null)
  const [userToDelete, setUserToDelete] = useState(null)
  const [saving, setSaving] = useState(false)

  // Estado del formulario — sin nombrePersona ni fechaCreacion
  const [formData, setFormData] = useState({
    usuario1: '',
    clave: '',
    rol: ROLES_ESTATICOS[0],
    estado: true
  })

  // ── Notificación ────────────────────────────────────────────────────────────
  const showNotification = (message, type = 'success') => {
    setNotification({ message, type })
    setTimeout(() => setNotification(null), 3500)
  }

  // ── GET: cargar usuarios ─────────────────────────────────────────────────────
  const fetchUsuarios = async () => {
    setLoading(true)
    try {
      const res = await fetch(BASE_URL, { headers: authHeaders() })
      if (!res.ok) throw new Error(`Error ${res.status}`)
      const data = await res.json()

      console.log('respuesta de usuarios: ', data)
      setUsuarios(data)
    } catch (err) {
      console.error(err)
      showNotification('Error al cargar usuarios: ' + err.message, 'error')
    } finally {
      setLoading(false)
    }
  }

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { fetchUsuarios() }, [])

  // ── Abrir modal para agregar ─────────────────────────────────────────────────
  const handleAddNew = () => {
    setFormData({ usuario1: '', clave: '', rol: ROLES_ESTATICOS[0], estado: true })
    setEditingUser(null)
    setShowAddModal(true)
  }

  // ── Abrir modal para editar ──────────────────────────────────────────────────
  const handleEdit = (user) => {
    console.log('Editando usuario:', user)
    const rolActual = ROLES_ESTATICOS.find(r => r.nombre === user.rol?.nombre) || ROLES_ESTATICOS[0]
    setFormData({
      usuario1: user.usuario1,
      clave: '',
      rol: rolActual,
      estado: user.estado
    })
    setEditingUser(user)
    setShowAddModal(true)
  }

  // ── POST / PUT desde el formulario ──────────────────────────────────────────
  const handleSave = async (e) => {
    e.preventDefault()
    setSaving(true)

    const body = {
      usuario1: formData.usuario1,
      clave: formData.clave,
      rolId: formData.rol.id,
      estado: formData.estado
    }

    try {
      if (editingUser) {
        // PUT: editar
        const res = await fetch(`${BASE_URL}/${editingUser.id}`, {
          method: 'PUT',
          headers: authHeaders(),
          body: JSON.stringify({ ...body, id: editingUser.id })
        })
        if (!res.ok) throw new Error(`Error ${res.status}`)
        showNotification('Usuario actualizado exitosamente')
      } else {
        // POST: crear
        const res = await fetch(BASE_URL, {
          method: 'POST',
          headers: authHeaders(),
          body: JSON.stringify(body)
        })
        if (!res.ok) throw new Error(`Error ${res.status}`)
        showNotification('Nuevo usuario creado exitosamente')
      }
      setShowAddModal(false)
      setEditingUser(null)
      await fetchUsuarios()
    } catch (err) {
      console.error(err)
      showNotification('Error al guardar: ' + err.message, 'error')
    } finally {
      setSaving(false)
    }
  }

  // ── Toggle estado → PUT silencioso ──────────────────────────────────────────
  const toggleEstado = async (user) => {
    try {
      const res = await fetch(`${BASE_URL}/acceso/${user.id}`, {
        method: 'PUT',
        headers: authHeaders(),
      })
      if (!res.ok) throw new Error(`Error ${res.status}`)
      showNotification(`Estado actualizado exitosamente`, 'success')
      await fetchUsuarios()
    } catch (err) {
      console.error(err)
      showNotification('Error al cambiar estado: ' + err.message, 'error')
    }
  }

  // ── DELETE ───────────────────────────────────────────────────────────────────
  const handleDelete = (user) => setUserToDelete(user)

  const confirmDelete = async () => {
    if (!userToDelete) return
    try {
      const res = await fetch(`${BASE_URL}/${userToDelete.id}`, {
        method: 'DELETE',
        headers: authHeaders()
      })
      if (!res.ok) throw new Error(`Error ${res.status}`)
      showNotification(`Usuario eliminado correctamente`, 'error')
      setUserToDelete(null)
      await fetchUsuarios()
    } catch (err) {
      console.error(err)
      showNotification('Error al eliminar: ' + err.message, 'error')
    }
  }

  const cancelDelete = () => setUserToDelete(null)

  // ── Filtrar ──────────────────────────────────────────────────────────────────
  const filteredUsuarios = usuarios.filter(u =>
    u.usuario1?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.rol?.nombre?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  // ── Render ───────────────────────────────────────────────────────────────────
  return (
    <div className="usuarios-view">
      {/* Notificación */}
      {notification && (
        <div className={`notification ${notification.type}`}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            {notification.type === 'success' ? (
              <path d="M22 11.08V12a10 10 0 11-5.93-9.14" />
            ) : (
              <>
                <circle cx="12" cy="12" r="10" />
                <line x1="15" y1="9" x2="9" y2="15" />
                <line x1="9" y1="9" x2="15" y2="15" />
              </>
            )}
          </svg>
          <span>{notification.message}</span>
        </div>
      )}

      {/* Contenido */}
      <div className="content-card">
        {/* Barra de herramientas */}
        <div className="toolbar">
          <div className="search-box">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              type="text"
              placeholder="Buscar por usuario o rol..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
          </div>
          <button onClick={handleAddNew} className="add-btn">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            Nuevo Usuario
          </button>
        </div>

        {/* Tabla */}
        <div className="table-container">
          {loading ? (
            <div className="empty-state">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ animation: 'spin 1s linear infinite' }}>
                <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
              </svg>
              <h3>Cargando usuarios...</h3>
            </div>
          ) : (
            <table className="roles-table">
              <thead>
                <tr>
                  <th>Usuario</th>
                  <th>Rol</th>
                  <th>Acceso</th>
                  <th>Ultimo acceso</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsuarios.map((user) => (
                  <tr key={user.id}>
                    <td>
                      <div className="user-cell">
                        <div className="user-avatar-small">
                          {user.usuario1?.substring(0, 2).toUpperCase() || '??'}
                        </div>
                        <span className="username">{user.usuario1}</span>
                      </div>
                    </td>
                    <td>
                      <span className={`role-badge ${user.rol?.nombre?.toLowerCase() || ''}`}>
                        {user.rol?.nombre || '—'}
                      </span>
                    </td>
                    <td>
                      <label className="switch">
                        <input
                          type="checkbox"
                          checked={user.acceso}
                          onChange={() => toggleEstado(user)}
                        />
                        <span className="switch-slider"></span>
                      </label>
                    </td>
                    <td>
                      {user.ultimoAcceso ? new Date(user.ultimoAcceso).toLocaleString() : '—'}
                    </td>
                    <td>
                      <div className="action-buttons">
                        <button
                          onClick={() => handleEdit(user)}
                          className="action-btn edit-btn"
                          title="Editar"
                        >
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
                            <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => handleDelete(user)}
                          className="action-btn delete-btn"
                          title="Eliminar"
                        >
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <polyline points="3 6 5 6 21 6" />
                            <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
                            <line x1="10" y1="11" x2="10" y2="17" />
                            <line x1="14" y1="11" x2="14" y2="17" />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {!loading && filteredUsuarios.length === 0 && (
            <div className="empty-state">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              <h3>No se encontraron resultados</h3>
              <p>Intente con otros términos de búsqueda</p>
            </div>
          )}
        </div>
      </div>

      {/* Modal Agregar / Editar */}
      {showAddModal && (
        <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editingUser ? 'Editar Usuario' : 'Nuevo Usuario'}</h2>
              <button className="modal-close" onClick={() => setShowAddModal(false)}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleSave} className="modal-form">
              {/* Usuario */}
              <div className="input-group">
                <label className="input-label">Usuario</label>
                <input
                  type="text"
                  value={formData.usuario1}
                  onChange={(e) => setFormData({ ...formData, usuario1: e.target.value })}
                  className="input-field"
                  placeholder="Nombre de usuario"
                  required
                />
              </div>

              {/* Contraseña (solo para crear; opcional al editar) */}
              <div className="input-group">
                <label className="input-label">
                  Contraseña{editingUser ? ' (dejar vacío para no cambiar)' : ''}
                </label>
                <input
                  type="password"
                  value={formData.clave}
                  onChange={(e) => setFormData({ ...formData, clave: e.target.value })}
                  className="input-field"
                  placeholder="••••••••"
                  required={!editingUser}
                />
              </div>

              {/* Rol */}
              <div className="input-group">
                <label className="input-label">Rol</label>
                <select
                  value={formData.rol.id}
                  onChange={(e) => {
                    const selected = ROLES_ESTATICOS.find(r => r.id === Number(e.target.value))
                    setFormData({ ...formData, rol: selected })
                  }}
                  className="input-field"
                >
                  {ROLES_ESTATICOS.map(r => (
                    <option key={r.id} value={r.id}>{r.nombre}</option>
                  ))}
                </select>
              </div>

              {/* Estado */}
              <div className="input-group">
                <label className="input-label">Estado</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '4px' }}>
                  <label className="switch">
                    <input
                      type="checkbox"
                      checked={formData.estado}
                      onChange={(e) => setFormData({ ...formData, estado: e.target.checked })}
                    />
                    <span className="switch-slider"></span>
                  </label>
                  <span style={{ fontSize: '14px', fontWeight: '600', color: formData.estado ? '#10b981' : '#64748b' }}>
                    {formData.estado ? 'Activo' : 'Inactivo'}
                  </span>
                </div>
              </div>

              <div className="modal-actions">
                <button
                  type="button"
                  className="cancel-btn"
                  onClick={() => setShowAddModal(false)}
                  disabled={saving}
                >
                  Cancelar
                </button>
                <button type="submit" className="save-btn" disabled={saving}>
                  {saving ? 'Guardando...' : (editingUser ? 'Actualizar' : 'Crear') + ' Usuario'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Confirmar Eliminación */}
      {userToDelete && (
        <div className="modal-overlay" onClick={cancelDelete}>
          <div
            className="modal-content confirmation-modal"
            style={{ maxWidth: '400px' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <h2>Confirmar Eliminación</h2>
              <button className="modal-close" onClick={cancelDelete}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
            <div style={{ padding: '24px 32px' }}>
              <p style={{ color: 'var(--text-secondary)', fontSize: '15px', lineHeight: '1.6', margin: 0 }}>
                ¿Está seguro que desea eliminar el usuario <strong>{userToDelete.usuario1}</strong>? Esta acción no se puede deshacer.
              </p>
            </div>
            <div className="modal-actions" style={{ marginTop: '0' }}>
              <button className="cancel-btn" onClick={cancelDelete}>
                Cancelar
              </button>
              <button
                className="save-btn"
                style={{ background: 'var(--danger)', borderColor: 'var(--danger)', boxShadow: '0 4px 12px rgba(239, 68, 68, 0.2)' }}
                onClick={confirmDelete}
              >
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Usuarios