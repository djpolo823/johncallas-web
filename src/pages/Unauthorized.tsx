import React from 'react';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import { ShieldAlert } from 'lucide-react';

export const Unauthorized: React.FC = () => {
  return (
    <div style={{
      minHeight: '80vh',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      textAlign: 'center',
      padding: '2rem',
      backgroundColor: 'var(--color-off-white)'
    }}>
      <Helmet>
        <title>Acceso No Autorizado | JohnCallas</title>
      </Helmet>

      <div style={{ maxWidth: '500px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <ShieldAlert size={48} strokeWidth={1} style={{ color: 'var(--color-gold-subtle)', marginBottom: '2rem' }} />
        
        <h1 className="text-serif" style={{ fontSize: '2.5rem', marginBottom: '1rem', color: 'var(--color-black)' }}>
          Acceso Restringido
        </h1>
        
        <p style={{
          color: 'var(--color-text-secondary)',
          fontSize: '1.125rem',
          lineHeight: 1.8,
          marginBottom: '2.5rem',
          fontWeight: 300
        }}>
          Tu cuenta no cuenta con las credenciales necesarias para acceder a esta colección privada.
        </p>

        <div style={{ display: 'flex', gap: '1rem' }}>
          <Link to="/" className="btn btn-primary" style={{ minWidth: '150px' }}>
            Ir al Inicio
          </Link>
          <Link to="/login" className="btn btn-outline" style={{ minWidth: '150px' }}>
            Iniciar Sesión
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Unauthorized;
