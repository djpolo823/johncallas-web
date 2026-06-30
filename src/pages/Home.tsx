import React from 'react';
import { Helmet } from 'react-helmet-async';
import { useNavigate } from 'react-router-dom';
import { Link } from 'react-router-dom';

const Home: React.FC = () => {
  const navigate = useNavigate();

  const categories = [
    {
      id: 'bolsos',
      name: 'Bolsos',
      image: 'https://images.unsplash.com/photo-1591561954557-26941169b49e?q=80&w=1974&auto=format&fit=crop',
    },
    {
      id: 'billeteras',
      name: 'Billeteras',
      image: '/billetera-home.jpg',
    },
    {
      id: 'cosmetiqueras',
      name: 'Cosmetiqueras',
      image: 'https://images.unsplash.com/photo-1599305090598-fe179d501227?q=80&w=2000&auto=format&fit=crop',
    },
  ];

  const handleCategoryClick = (catId: string) => {
    navigate(`/catalogo?categoria=${catId}`);
  };

  return (
    <>
      {/* SEO */}
      <Helmet>
        <title>JohnCallas | Elegancia con Propósito</title>
        <meta
          name="description"
          content="Marroquinería premium para decisiones de compra conscientes."
        />
      </Helmet>

      {/* Hero Section */}
      <section
        style={{ height: '90vh', position: 'relative', overflow: 'hidden' }}
        className="animate-fade-in"
      >
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            backgroundImage:
              'url("https://images.unsplash.com/photo-1590874103328-eac38a683ce7?q=80&w=2072&auto=format&fit=crop")',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            filter: 'brightness(0.7)',
          }}
        ></div>
        <div
          className="container"
          style={{
            position: 'relative',
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            textAlign: 'center',
            color: 'var(--color-white)',
          }}
        >
          <span
            style={{
              textTransform: 'uppercase',
              letterSpacing: '0.2em',
              fontSize: '0.75rem',
              marginBottom: '1rem',
              color: 'var(--color-leather-beige)',
            }}
          >
            Nueva Colección
          </span>
          <h1 className="text-serif" style={{ fontSize: 'clamp(2.5rem, 5vw, 4.5rem)', marginBottom: '1.5rem', maxWidth: '800px' }}>
            El arte de elegir <span style={{ fontStyle: 'italic', color: 'var(--color-leather-beige)' }}>mejor</span>,
            <br />
            no de comprar más.
          </h1>
          <p
            style={{
              fontSize: '1.125rem',
              maxWidth: '600px',
              marginBottom: '2.5rem',
              fontWeight: 300,
              opacity: 0.9,
            }}
          >
            Marroquinería de diseño atemporal, creada con técnicas artesanales para acompañarte toda la vida.
          </p>
          <div style={{ display: 'flex', gap: '1rem' }}>
            <Link to="/catalogo" className="btn" style={{ backgroundColor: 'var(--color-white)', color: 'var(--color-black)' }}>Descubrir Colección</Link>
            <Link to="/guia" className="btn" style={{ border: '1px solid var(--color-white)', color: 'var(--color-white)' }}>Nuestra Filosofía</Link>
          </div>
        </div>
      </section>

      {/* Quick Access Categories */}
      <section style={{ padding: '5rem 0 2rem 0', backgroundColor: 'var(--color-white)' }}>
        <div className="container">
          <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
            <h2 className="text-serif" style={{ fontSize: '2rem' }}>
              Explorar Categorías
            </h2>
          </div>
          <div className="grid grid-cols-3" style={{ gap: '2rem' }}>
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => handleCategoryClick(cat.id)}
                style={{
                  position: 'relative',
                  display: 'block',
                  overflow: 'hidden',
                  aspectRatio: '4/5',
                  border: 'none',
                  background: 'transparent',
                  cursor: 'pointer',
                }}
                className="category-card"
              >
                <img src={cat.image} alt={cat.name} className="category-img" style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform var(--transition-slow)' }} />
                <div className="category-overlay" style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(0,0,0,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background-color var(--transition-normal)' }}>
                  <h3 className="text-serif" style={{ color: 'var(--color-white)', fontSize: '2rem', letterSpacing: '0.05em', textShadow: '0 2px 10px rgba(0,0,0,0.3)' }}>
                    {cat.name}
                  </h3>
                </div>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Rest of the page (featured products, philosophy, etc.) remains unchanged */}
    </>
  );
};

export default Home;
