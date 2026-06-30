import React from 'react';
import { Link } from 'react-router-dom';
import { Mail } from 'lucide-react';

const Footer: React.FC = () => {
  return (
    <footer style={{ backgroundColor: 'var(--color-black)', color: 'var(--color-white)', paddingTop: '4rem', paddingBottom: '2rem', marginTop: 'auto' }}>
      <div className="container">
        <div className="grid grid-cols-4 mb-4" style={{ gap: '2rem' }}>
          
          <div style={{ gridColumn: 'span 1' }}>
            <h3 className="text-serif" style={{ fontSize: '1.5rem', marginBottom: '1.5rem', letterSpacing: '0.1em' }}>JOHNCALLAS</h3>
            <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.875rem', marginBottom: '1.5rem' }}>
              Marroquinería femenina con propósito. Diseños atemporales para la mujer contemporánea que valora la elegancia y la calidad artesanal.
            </p>
            <div style={{ display: 'flex', gap: '1rem', fontSize: '0.875rem' }}>
              <a href="#" aria-label="Instagram" style={{ color: 'var(--color-text-secondary)' }}>Instagram</a>
              <a href="#" aria-label="Facebook" style={{ color: 'var(--color-text-secondary)' }}>Facebook</a>
            </div>
          </div>

          <div>
            <h4 style={{ textTransform: 'uppercase', letterSpacing: '0.05em', fontSize: '0.875rem', marginBottom: '1.5rem' }}>Colección</h4>
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <li><Link to="/catalogo" style={{ color: 'var(--color-text-secondary)', fontSize: '0.875rem' }}>Bolsos de Hombro</Link></li>
              <li><Link to="/catalogo" style={{ color: 'var(--color-text-secondary)', fontSize: '0.875rem' }}>Tote Bags</Link></li>
              <li><Link to="/catalogo" style={{ color: 'var(--color-text-secondary)', fontSize: '0.875rem' }}>Bandoleras</Link></li>
              <li><Link to="/catalogo" style={{ color: 'var(--color-text-secondary)', fontSize: '0.875rem' }}>Accesorios</Link></li>
            </ul>
          </div>

          <div>
            <h4 style={{ textTransform: 'uppercase', letterSpacing: '0.05em', fontSize: '0.875rem', marginBottom: '1.5rem' }}>Soporte</h4>
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <li><Link to="/contacto" style={{ color: 'var(--color-text-secondary)', fontSize: '0.875rem' }}>Contacto</Link></li>
              <li><Link to="/envios" style={{ color: 'var(--color-text-secondary)', fontSize: '0.875rem' }}>Envíos y Devoluciones</Link></li>
              <li><Link to="/cuidado" style={{ color: 'var(--color-text-secondary)', fontSize: '0.875rem' }}>Cuidado del Cuero</Link></li>
              <li><Link to="/faq" style={{ color: 'var(--color-text-secondary)', fontSize: '0.875rem' }}>Preguntas Frecuentes</Link></li>
            </ul>
          </div>

          <div>
            <h4 style={{ textTransform: 'uppercase', letterSpacing: '0.05em', fontSize: '0.875rem', marginBottom: '1.5rem' }}>Newsletter</h4>
            <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.875rem', marginBottom: '1rem' }}>
              Suscríbete para recibir novedades y acceso anticipado a nuevas colecciones.
            </p>
            <form style={{ display: 'flex', borderBottom: '1px solid var(--color-text-secondary)' }}>
              <input 
                type="email" 
                placeholder="Tu correo electrónico" 
                style={{ 
                  background: 'none', 
                  border: 'none', 
                  color: 'var(--color-white)', 
                  padding: '0.5rem 0',
                  flex: 1,
                  outline: 'none',
                  fontSize: '0.875rem'
                }} 
              />
              <button type="submit" style={{ color: 'var(--color-white)' }}>
                <Mail size={18} />
              </button>
            </form>
          </div>

        </div>

        <div style={{ 
          borderTop: '1px solid #333', 
          paddingTop: '1.5rem', 
          display: 'flex', 
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem'
        }}>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.75rem' }}>
            &copy; {new Date().getFullYear()} JOHNCALLAS. Todos los derechos reservados.
          </p>
          <div style={{ display: 'flex', gap: '1.5rem' }}>
            <Link to="/privacidad" style={{ color: 'var(--color-text-secondary)', fontSize: '0.75rem' }}>Política de Privacidad</Link>
            <Link to="/terminos" style={{ color: 'var(--color-text-secondary)', fontSize: '0.75rem' }}>Términos de Servicio</Link>
          </div>
        </div>
      </div>
      
      <style>{`
        @media (max-width: 768px) {
          footer .grid-cols-4 { grid-template-columns: 1fr; }
          footer .grid-cols-4 > div:first-child { margin-bottom: 1rem; }
        }
      `}</style>
    </footer>
  );
};

export default Footer;
