import React from 'react';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';

const Blog: React.FC = () => {
  const articles = [
    {
      id: 1,
      title: 'Cómo elegir el bolso perfecto para tu tipo de cuerpo',
      category: 'Guía de Estilo',
      image: 'https://images.unsplash.com/photo-1594223274512-ad4803739b7c?q=80&w=1957&auto=format&fit=crop',
      excerpt: 'Descubre las proporciones y siluetas que mejor complementan tu figura natural.',
      date: '12 de Mayo, 2024'
    },
    {
      id: 2,
      title: 'El arte de cuidar el cuero plena flor',
      category: 'Cuidado',
      image: 'https://images.unsplash.com/photo-1584916201218-f4242ceb4809?q=80&w=1915&auto=format&fit=crop',
      excerpt: 'Guía paso a paso para mantener tus piezas JohnCallas impecables generación tras generación.',
      date: '28 de Abril, 2024'
    },
    {
      id: 3,
      title: 'Por qué menos es más: Construyendo un armario cápsula',
      category: 'Filosofía',
      image: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?q=80&w=2070&auto=format&fit=crop',
      excerpt: 'Invertir en piezas de calidad que trascienden las tendencias temporales.',
      date: '15 de Abril, 2024'
    }
  ];

  return (
    <div style={{ paddingBottom: '6rem' }}>
      <Helmet>
        <title>Guía de Estilo | JohnCallas</title>
        <meta name="description" content="Consejos de estilo, cuidado del cuero y filosofía de elegancia consciente." />
      </Helmet>

      {/* Header */}
      <section style={{ backgroundColor: 'var(--color-off-white)', padding: '6rem 0', marginBottom: '4rem', textAlign: 'center' }}>
        <div className="container" style={{ maxWidth: '800px' }}>
          <h1 className="text-serif" style={{ fontSize: '3.5rem', marginBottom: '1.5rem' }}>Guía de Estilo</h1>
          <p style={{ fontSize: '1.25rem', color: 'var(--color-text-secondary)', lineHeight: 1.6 }}>
            Exploramos el mundo del diseño atemporal, el cuidado de materiales nobles y la filosofía de elegir con propósito.
          </p>
        </div>
      </section>

      <div className="container">
        <div className="grid grid-cols-3" style={{ gap: '3rem' }}>
          {articles.map((article) => (
            <article key={article.id} style={{ display: 'flex', flexDirection: 'column' }}>
              <Link to={`/guia/${article.id}`} style={{ display: 'block', overflow: 'hidden', marginBottom: '1.5rem', aspectRatio: '4/3' }}>
                <img 
                  src={article.image} 
                  alt={article.title} 
                  style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform var(--transition-slow)' }} 
                  className="article-img"
                />
              </Link>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                <span style={{ color: 'var(--color-gold-subtle)' }}>{article.category}</span>
                <span style={{ color: 'var(--color-text-secondary)' }}>{article.date}</span>
              </div>
              <h2 className="text-serif" style={{ fontSize: '1.5rem', marginBottom: '1rem', lineHeight: 1.3 }}>
                <Link to={`/guia/${article.id}`}>{article.title}</Link>
              </h2>
              <p style={{ color: 'var(--color-text-secondary)', marginBottom: '1.5rem', flex: 1 }}>
                {article.excerpt}
              </p>
              <Link to={`/guia/${article.id}`} style={{ 
                display: 'inline-flex', 
                alignItems: 'center', 
                gap: '0.5rem', 
                color: 'var(--color-black)', 
                fontWeight: 500,
                fontSize: '0.875rem',
                borderBottom: '1px solid var(--color-black)',
                paddingBottom: '0.25rem',
                alignSelf: 'flex-start'
              }}>
                Leer artículo <ArrowRight size={16} />
              </Link>
            </article>
          ))}
        </div>
      </div>
      
      <style>{`
        article:hover .article-img { transform: scale(1.05); }
        @media (max-width: 768px) {
          .grid-cols-3 { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
};

export default Blog;
