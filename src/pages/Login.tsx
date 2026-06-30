import React, { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Role } from '../types';
import { ArrowRight, Eye, EyeOff } from 'lucide-react';

export const Login: React.FC = () => {
  const { login, register } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [selectedRole, setSelectedRole] = useState<Role>(Role.CLIENT);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Read where the user was heading before auth redirect
  const from = (location.state as any)?.from?.pathname || null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (isRegister) {
        // Register flow
        const user = await register(email, name, password, selectedRole);
        redirectUser(user.role);
      } else {
        // Login flow
        const user = await login(email, password);
        redirectUser(user.role);
      }
    } catch (err: any) {
      setError(err.message || 'Ocurrió un error inesperado.');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoAccess = async (demoEmail: string) => {
    setError(null);
    setLoading(true);
    try {
      const user = await login(demoEmail);
      redirectUser(user.role);
    } catch (err: any) {
      setError(err.message || 'Error al usar acceso rápido.');
    } finally {
      setLoading(false);
    }
  };

  const redirectUser = (role: Role) => {
    // If there was a redirect URL, use it
    if (from) {
      navigate(from, { replace: true });
      return;
    }

    // Default redirects based on role
    if (role === Role.ADMIN) {
      navigate('/admin');
    } else if (role === Role.VENDOR) {
      navigate('/vendedor');
    } else if (role === Role.INVENTARIO) {
      navigate('/almacen');
    } else if (role === Role.ARTESANO) {
      navigate('/produccion');
    } else {
      navigate('/');
    }
  };

  return (
    <div style={{ minHeight: 'calc(100vh - 70px)', display: 'flex', backgroundColor: 'var(--color-off-white)' }} className="animate-fade-in">
      <Helmet>
        <title>{isRegister ? 'Registro' : 'Iniciar Sesión'} | JohnCallas</title>
      </Helmet>

      <div className="login-grid" style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', width: '100%' }}>
        {/* Left Side: Stunning Fashion Editorial Image */}
        <div className="login-image-section" style={{ position: 'relative', overflow: 'hidden', height: '100%' }}>
          <div style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: 'url("https://images.unsplash.com/photo-1590874103328-eac38a683ce7?q=80&w=2072&auto=format&fit=crop")',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            filter: 'brightness(0.65)'
          }}></div>
          <div style={{
            position: 'relative',
            height: '100%',
            padding: '4rem',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            color: 'var(--color-white)'
          }}>
            <span className="text-serif" style={{ fontSize: '1.25rem', letterSpacing: '0.15em', fontWeight: 600 }}>
              JOHNCALLAS
            </span>
            <div>
              <h2 className="text-serif" style={{ fontSize: '3rem', lineHeight: 1.2, marginBottom: '1.5rem' }}>
                La sutileza de lo atemporal.
              </h2>
              <p style={{ fontSize: '1rem', maxWidth: '400px', fontWeight: 300, opacity: 0.9, lineHeight: 1.8 }}>
                Piezas de marroquinería exclusivas y conscientes diseñadas para perdurar en el tiempo y contar tu historia.
              </p>
            </div>
            <span style={{ fontSize: '0.75rem', opacity: 0.5, letterSpacing: '0.05em' }}>
              © 2026 JOHNCALLAS. Todos los derechos reservados.
            </span>
          </div>
        </div>

        {/* Right Side: Editorial Minimal Form */}
        <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '4rem 6rem', position: 'relative' }} className="login-form-container">
          <div style={{ maxWidth: '400px', width: '100%', margin: '0 auto' }}>
            <h1 className="text-serif" style={{ fontSize: '2.5rem', marginBottom: '0.5rem', color: 'var(--color-black)' }}>
              {isRegister ? 'Crear Cuenta' : 'Bienvenido'}
            </h1>
            <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.875rem', marginBottom: '2.5rem' }}>
              {isRegister ? 'Únete a nuestra experiencia de compra exclusiva.' : 'Por favor ingresa tus datos para acceder.'}
            </p>

            {error && (
              <div style={{
                backgroundColor: '#FAF5F5',
                borderLeft: '2px solid #D98888',
                color: '#8A3E3E',
                padding: '1rem',
                fontSize: '0.875rem',
                marginBottom: '2rem',
                lineHeight: 1.5
              }}>
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              {isRegister && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <label htmlFor="name" style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--color-text-secondary)' }}>
                    Nombre Completo
                  </label>
                  <input
                    id="name"
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Alexandra Von"
                    style={{
                      padding: '0.75rem 0',
                      border: 'none',
                      borderBottom: '1px solid var(--color-border)',
                      backgroundColor: 'transparent',
                      outline: 'none',
                      fontSize: '1rem',
                      fontFamily: 'var(--font-sans)',
                      transition: 'border-color var(--transition-fast)'
                    }}
                    onFocus={(e) => e.target.style.borderBottomColor = 'var(--color-black)'}
                    onBlur={(e) => e.target.style.borderBottomColor = 'var(--color-border)'}
                  />
                </div>
              )}

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <label htmlFor="email" style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--color-text-secondary)' }}>
                  Correo Electrónico
                </label>
                <input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="alexandra@example.com"
                  style={{
                    padding: '0.75rem 0',
                    border: 'none',
                    borderBottom: '1px solid var(--color-border)',
                    backgroundColor: 'transparent',
                    outline: 'none',
                    fontSize: '1rem',
                    fontFamily: 'var(--font-sans)',
                    transition: 'border-color var(--transition-fast)'
                  }}
                  onFocus={(e) => e.target.style.borderBottomColor = 'var(--color-black)'}
                  onBlur={(e) => e.target.style.borderBottomColor = 'var(--color-border)'}
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', position: 'relative' }}>
                <label htmlFor="password" style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--color-text-secondary)' }}>
                  Contraseña
                </label>
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  style={{
                    padding: '0.75rem 2rem 0.75rem 0',
                    border: 'none',
                    borderBottom: '1px solid var(--color-border)',
                    backgroundColor: 'transparent',
                    outline: 'none',
                    fontSize: '1rem',
                    fontFamily: 'var(--font-sans)',
                    transition: 'border-color var(--transition-fast)'
                  }}
                  onFocus={(e) => e.target.style.borderBottomColor = 'var(--color-black)'}
                  onBlur={(e) => e.target.style.borderBottomColor = 'var(--color-border)'}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{ position: 'absolute', right: 0, bottom: '8px', color: 'var(--color-text-secondary)' }}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>

              {isRegister && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '0.5rem' }}>
                  <label style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--color-text-secondary)' }}>
                    Rol de Usuario
                  </label>
                  <div style={{ display: 'flex', gap: '1rem', marginTop: '0.25rem' }}>
                    {[Role.CLIENT, Role.VENDOR, Role.ADMIN].map((role) => (
                      <button
                        key={role}
                        type="button"
                        onClick={() => setSelectedRole(role)}
                        style={{
                          flex: 1,
                          padding: '0.5rem 1rem',
                          border: selectedRole === role ? '1px solid var(--color-black)' : '1px solid var(--color-border)',
                          backgroundColor: selectedRole === role ? 'var(--color-black)' : 'transparent',
                          color: selectedRole === role ? 'var(--color-white)' : 'var(--color-text-primary)',
                          fontSize: '0.75rem',
                          textTransform: 'uppercase',
                          letterSpacing: '0.05em',
                          transition: 'all var(--transition-fast)'
                        }}
                      >
                        {role}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="btn btn-primary"
                style={{
                  marginTop: '1.5rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.75rem'
                }}
              >
                {loading ? 'Procesando...' : isRegister ? 'Registrarse' : 'Iniciar Sesión'}
                {!loading && <ArrowRight size={16} />}
              </button>
            </form>

            <div style={{ textAlign: 'center', marginTop: '2.5rem' }}>
              <button
                onClick={() => {
                  setIsRegister(!isRegister);
                  setError(null);
                }}
                style={{
                  fontSize: '0.875rem',
                  color: 'var(--color-text-secondary)',
                  textDecoration: 'underline'
                }}
              >
                {isRegister ? '¿Ya tienes una cuenta? Inicia sesión' : '¿No tienes cuenta? Regístrate aquí'}
              </button>
            </div>
          </div>

          {/* Development / Demo Mode Floating Selector */}
          {import.meta.env.DEV && (
            <div style={{
              position: 'absolute',
              bottom: '1.5rem',
              left: '50%',
              transform: 'translateX(-50%)',
              backgroundColor: 'rgba(255, 255, 255, 0.9)',
              border: '1px solid var(--color-leather-beige)',
              padding: '0.75rem 1.5rem',
              borderRadius: '4px',
              boxShadow: '0 4px 20px rgba(0,0,0,0.03)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '0.5rem',
              width: '90%',
              maxWidth: '380px'
            }}>
              <span style={{ fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 600, color: 'var(--color-gold-subtle)' }}>
                Acceso Rápido Demo
              </span>
              <div style={{ display: 'flex', gap: '0.5rem', width: '100%', flexWrap: 'wrap' }}>
                {([
                  { label: 'Admin', email: 'admin@johncallas.com', color: '#3A3A3A' },
                  { label: 'Vendedor', email: 'vendedor@johncallas.com', color: '#3A3A3A' },
                  { label: 'Cliente', email: 'cliente@johncallas.com', color: '#3A3A3A' },
                  { label: '⊞ Almacén', email: 'inventario@johncallas.com', color: '#5A7A6A' },
                  { label: '✂ Taller', email: 'artesano@johncallas.com', color: '#B07A30' },
                ] as const).map(({ label, email, color }) => (
                  <button
                    key={email}
                    onClick={() => handleDemoAccess(email)}
                    style={{
                      flex: '1 1 calc(33% - 0.5rem)',
                      padding: '0.4rem 0.5rem',
                      fontSize: '0.62rem',
                      border: '1px solid var(--color-border)',
                      backgroundColor: 'var(--color-white)',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                      fontWeight: 600,
                      color,
                      cursor: 'pointer',
                    }}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <style>{`
        @media (max-width: 900px) {
          .login-grid { grid-template-columns: 1fr !important; }
          .login-image-section { display: none !important; }
          .login-form-container { padding: 4rem 2rem !important; }
        }
      `}</style>
    </div>
  );
};

export default Login;
