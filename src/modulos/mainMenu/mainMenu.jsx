import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import './mainMenu.css'

// ─── Mapa de íconos (valor del campo "icono" devuelto por el back) ─────────────
const ICON_SVG = {
  'shield-lock': (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      <circle cx="12" cy="11" r="2" /><path d="M12 13v2" />
    </svg>
  ),
  'eye': (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  ),
  'plus': (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  ),
  'edit': (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
      <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
    </svg>
  ),
  'trash': (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6l-1 14H6L5 6" /><path d="M10 11v6M14 11v6" /><path d="M9 6V4h6v2" />
    </svg>
  ),
  'house': (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
      <polyline points="9 22 9 12 15 12 15 22" />
    </svg>
  ),
  'bar-chart': (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <line x1="18" y1="20" x2="18" y2="10" />
      <line x1="12" y1="20" x2="12" y2="4" />
      <line x1="6" y1="20" x2="6" y2="14" />
    </svg>
  ),
  'gear': (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z" />
    </svg>
  ),
  // Fallback genérico
  'default': (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
    </svg>
  ),
}

/** Devuelve el SVG del ícono o uno genérico */
const getIcon = (icono) => ICON_SVG[icono] ?? ICON_SVG['default']

/** Lee authData de sessionStorage de forma segura */
const getAuthData = () => {
  try {
    const raw = sessionStorage.getItem('authData')
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

/** Genera iniciales a partir del nombre de usuario */
const getInitials = (nombre = '') =>
  nombre
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('') || 'US'

function MainMenu() {
  const navigate = useNavigate()
  const location = useLocation()

  // ── Sesión ────────────────────────────────────────────────────────────────────
  const authData = getAuthData()

  if (!authData) {
    // Sin sesión → redirigir al login
    navigate('/login', { replace: true })
    return null
  }

  const { usuario } = authData
  const nombreUsuario = usuario?.usuario1 ?? 'Usuario'
  const rol = usuario?.rol ?? {}
  const nombreRol = rol?.nombre ?? 'Sin rol'

  // Filtrar sólo ítems de tipo "menu" raíz (padreId === null), ordenados por "orden"
  const menuItems = (rol?.menus ?? [])
    .filter((m) => m.tipo === 'menu' && m.padreId === null)
    .sort((a, b) => a.orden - b.orden)

  // ── Logout ────────────────────────────────────────────────────────────────────
  const handleLogout = () => {
    sessionStorage.removeItem('authData')
    navigate('/login')
  }

  // ── Título del header basado en menú activo ───────────────────────────────────
  const activeMenu = menuItems.find((m) => location.pathname === m.rutaAccion)
  const pageTitle = activeMenu?.nombre ?? 'Panel de Control'
  const pageSubtitle = activeMenu
    ? `Gestión de ${activeMenu.nombre.toLowerCase()}`
    : `Bienvenido, ${nombreUsuario}`

  return (
    <div className="admin-layout">
      {/* Sidebar */}
      <aside className="admin-sidebar">
        <div className="sidebar-header">
          <div className="sidebar-logo">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
            </svg>
          </div>
          <h2 className="sidebar-title">Panel Admin</h2>
        </div>

        <nav className="sidebar-nav">
          {menuItems.length === 0 ? (
            <p className="nav-empty">Sin menús asignados</p>
          ) : (
            menuItems.map((item) => (
              <NavLink
                key={item.id}
                to={item.rutaAccion}
                className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
              >
                {getIcon(item.icono)}
                <span>{item.nombre}</span>
              </NavLink>
            ))
          )}
        </nav>

        <button onClick={handleLogout} className="logout-btn">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" />
            <polyline points="16 17 21 12 16 7" />
            <line x1="21" y1="12" x2="9" y2="12" />
          </svg>
          <span>Cerrar Sesión</span>
        </button>
      </aside>

      {/* Contenido Principal */}
      <main className="admin-main">
        {/* Header */}
        <header className="admin-header">
          <div className="header-left">
            <h1 className="page-title">{pageTitle}</h1>
            <p className="page-subtitle">{pageSubtitle}</p>
          </div>
          <div className="header-right">
            <div className="user-info">
              <div className="user-avatar">
                <span>{getInitials(nombreUsuario)}</span>
              </div>
              <div className="user-details">
                <span className="user-name">{nombreUsuario}</span>
                <span className="user-role">{nombreRol}</span>
              </div>
            </div>
          </div>
        </header>

        {/* Contenedor donde se renderizarán las pantallas hijas */}
        <div className="main-content-container">
          <Outlet />
        </div>
      </main>
    </div>
  )
}

export default MainMenu
