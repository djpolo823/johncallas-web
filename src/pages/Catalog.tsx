import React, { useState, useEffect, useMemo } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link, useSearchParams } from 'react-router-dom';
import { SearchX, SlidersHorizontal, X } from 'lucide-react';
import { ProductService } from '../services/productService';
import type { Product } from '../types';

export const Catalog: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const searchQuery = searchParams.get('q') || '';
  const categoryQuery = searchParams.get('categoria') || '';

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  // Filter States
  const [selectedUso, setSelectedUso] = useState<string>('');
  const [selectedTamano, setSelectedTamano] = useState<string>('');
  const [selectedColor, setSelectedColor] = useState<string>('');
  const [maxPrice, setMaxPrice] = useState<number>(300);

  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      try {
        const data = await ProductService.getProducts();
        setProducts(data);
      } catch (err) {
        console.error('Error fetching products:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, []);

  // Filter combinations
  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      // 1. Search Query
      const matchesSearch = searchQuery === '' || 
        product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.description.toLowerCase().includes(searchQuery.toLowerCase());
      
      // 2. Category
      const matchesCategory = categoryQuery === '' || product.categoryId === categoryQuery;

      // 3. Price
      const matchesPrice = product.price <= maxPrice;

      // 4. Occasion/Uso
      const matchesUso = selectedUso === '' || product.filters?.uso === selectedUso;

      // 5. Size/Tamano
      const matchesTamano = selectedTamano === '' || product.filters?.tamano === selectedTamano;

      // 6. Color
      const matchesColor = selectedColor === '' || product.filters?.color === selectedColor;

      return matchesSearch && matchesCategory && matchesPrice && matchesUso && matchesTamano && matchesColor;
    });
  }, [products, searchQuery, categoryQuery, maxPrice, selectedUso, selectedTamano, selectedColor]);

  const handleCategoryClick = (cat: string) => {
    if (cat === '') {
      searchParams.delete('categoria');
    } else {
      searchParams.set('categoria', cat);
    }
    setSearchParams(searchParams);
  };

  const handleClearFilters = () => {
    setSelectedUso('');
    setSelectedTamano('');
    setSelectedColor('');
    setMaxPrice(300);
    searchParams.delete('categoria');
    searchParams.delete('q');
    setSearchParams(searchParams);
  };

  const getPageTitle = () => {
    if (searchQuery) return `Resultados para "${searchQuery}"`;
    if (categoryQuery === 'bolsos') return 'Bolsos Premium';
    if (categoryQuery === 'billeteras') return 'Billeteras y Tarjeteros';
    if (categoryQuery === 'cosmetiqueras') return 'Cosmetiqueras de Viaje';
    return 'Colección Completa';
  };

  const getPageSubtitle = () => {
    if (searchQuery) return `Encontramos ${filteredProducts.length} artículo(s) de lujo`;
    return 'Piezas atemporales diseñadas bajo una filosofía de elegancia consciente y durabilidad excepcional.';
  };

  // SEO Description
  const getSEODescription = () => {
    if (categoryQuery === 'bolsos') return 'Descubre nuestros bolsos de cuero premium hechos a mano por artesanos expertos. Elegancia minimalista y funcional para el día a día.';
    return 'Explora la colección exclusiva de marroquinería femenina JohnCallas. Bolsos, billeteras y cosmetiqueras creados con materiales nobles de origen ético.';
  };

  return (
    <div style={{ paddingTop: '2.5rem', paddingBottom: '6rem', backgroundColor: 'var(--color-off-white)' }} className="animate-fade-in">
      
      {/* High Fidelity Dynamic SEO Optimization */}
      <Helmet>
        <title>{`${getPageTitle()} | JohnCallas`}</title>
        <meta name="description" content={getSEODescription()} />
        <link rel="canonical" href={`https://johncallas.com/catalogo${categoryQuery ? `?categoria=${categoryQuery}` : ''}`} />
        
        {/* Open Graph Tags for Premium Social Sharing */}
        <meta property="og:title" content={`${getPageTitle()} | JohnCallas`} />
        <meta property="og:description" content={getSEODescription()} />
        <meta property="og:type" content="website" />
        <meta property="og:url" content={`https://johncallas.com/catalogo${categoryQuery ? `?categoria=${categoryQuery}` : ''}`} />
        <meta property="og:image" content={filteredProducts[0]?.images[0] || 'https://images.unsplash.com/photo-1590874103328-eac38a683ce7?q=80&w=600'} />
        <meta property="og:site_name" content="JohnCallas" />
        <meta name="twitter:card" content="summary_large_image" />
      </Helmet>

      <div className="container">
        
        {/* Editorial Page Header */}
        <div style={{ textAlign: 'center', marginBottom: '4rem', padding: '0 1rem' }}>
          <span style={{ textTransform: 'uppercase', letterSpacing: '0.2em', fontSize: '0.75rem', color: 'var(--color-gold-subtle)', fontWeight: 600 }}>
            Atelier de Diseño
          </span>
          <h1 className="text-serif" style={{ fontSize: '3.5rem', marginTop: '0.75rem', marginBottom: '1.5rem', color: 'var(--color-black)', fontWeight: 400 }}>
            {getPageTitle()}
          </h1>
          <p style={{ color: 'var(--color-text-secondary)', maxWidth: '600px', margin: '0 auto', fontSize: '1.125rem', lineHeight: 1.8, fontWeight: 300 }}>
            {getPageSubtitle()}
          </p>
        </div>

        {/* Action Bar */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--color-border)', paddingBottom: '1rem', marginBottom: '3rem' }}>
          
          {/* Quick Categories Navigation */}
          <div style={{ display: 'flex', gap: '2.5rem', overflowX: 'auto', paddingBottom: '0.25rem' }} className="hide-scrollbar">
            {['', 'bolsos', 'billeteras', 'cosmetiqueras'].map((catId) => {
              const label = catId === '' ? 'Todos' : catId.charAt(0).toUpperCase() + catId.slice(1);
              const isActive = categoryQuery === catId;
              return (
                <button
                  key={catId}
                  onClick={() => handleCategoryClick(catId)}
                  style={{
                    fontWeight: isActive ? 500 : 300,
                    fontSize: '0.875rem',
                    textTransform: 'uppercase',
                    letterSpacing: '0.1em',
                    borderBottom: isActive ? '1px solid var(--color-black)' : '1px solid transparent',
                    color: isActive ? 'var(--color-black)' : 'var(--color-text-secondary)',
                    paddingBottom: '0.5rem',
                    transition: 'all var(--transition-fast)'
                  }}
                >
                  {label}
                </button>
              );
            })}
          </div>

          {/* Trigger for the Sophisticated Side Drawer Filter */}
          <button 
            onClick={() => setIsFilterOpen(true)}
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '0.75rem', 
              color: 'var(--color-black)', 
              fontSize: '0.875rem',
              textTransform: 'uppercase',
              letterSpacing: '0.1em',
              fontWeight: 500
            }}
          >
            <SlidersHorizontal size={16} /> Filtrar Colección
          </button>
        </div>

        {/* Content Loading or Grid */}
        {loading ? (
          <div style={{ padding: '8rem 0', textAlign: 'center', color: 'var(--color-text-secondary)', fontSize: '1.125rem', fontStyle: 'italic' }}>
            Desvelando catálogo...
          </div>
        ) : filteredProducts.length > 0 ? (
          <div className="grid grid-cols-3" style={{ gap: '3rem 2rem' }}>
            {filteredProducts.map((product) => (
              <div key={product.id} style={{ display: 'flex', flexDirection: 'column' }} className="product-card">
                <Link 
                  to={`/producto/${product.id}`} 
                  style={{ 
                    position: 'relative', 
                    overflow: 'hidden', 
                    marginBottom: '1.5rem', 
                    backgroundColor: '#F5F5F5', 
                    aspectRatio: '4/5', 
                    display: 'block' 
                  }}
                >
                  <img 
                    src={product.images[0]} 
                    alt={product.name} 
                    style={{ 
                      width: '100%', 
                      height: '100%', 
                      objectFit: 'cover',
                      transition: 'transform var(--transition-slow)'
                    }} 
                    className="product-img"
                    loading="lazy"
                  />
                  {product.stock <= 2 && product.stock > 0 && (
                    <span style={{
                      position: 'absolute',
                      top: '1rem',
                      left: '1rem',
                      backgroundColor: 'rgba(255, 255, 255, 0.95)',
                      color: 'var(--color-black)',
                      fontSize: '0.65rem',
                      padding: '0.25rem 0.5rem',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em'
                    }}>
                      Edición Limitada
                    </span>
                  )}
                  {product.stock === 0 && (
                    <span style={{
                      position: 'absolute',
                      inset: 0,
                      backgroundColor: 'rgba(255, 255, 255, 0.65)',
                      color: 'var(--color-black)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '0.875rem',
                      textTransform: 'uppercase',
                      letterSpacing: '0.1em'
                    }}>
                      Agotado
                    </span>
                  )}
                </Link>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <h3 className="text-serif" style={{ fontSize: '1.25rem', marginBottom: '0.35rem', fontWeight: 400 }}>
                      <Link to={`/producto/${product.id}`} style={{ color: 'var(--color-black)' }}>{product.name}</Link>
                    </h3>
                    <span style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      {product.category}
                    </span>
                  </div>
                  <span style={{ fontSize: '1.125rem', fontWeight: 400, color: 'var(--color-black)' }}>${product.price}</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '8rem 0', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <SearchX size={40} strokeWidth={1} color="var(--color-gold-subtle)" style={{ marginBottom: '2rem', opacity: 0.8 }} />
            <h2 className="text-serif" style={{ fontSize: '2.25rem', marginBottom: '1rem', fontWeight: 400 }}>No se hallaron coincidencias</h2>
            <p style={{ color: 'var(--color-text-secondary)', marginBottom: '3rem', fontSize: '1rem', maxWidth: '400px', lineHeight: 1.6 }}>
              Ajusta los filtros refinados o limpia la búsqueda para redescubrir la colección de piezas atemporales.
            </p>
            <button onClick={handleClearFilters} className="btn btn-outline">
              Limpiar Todos los Filtros
            </button>
          </div>
        )}
      </div>

      {/* Sophisticated Editorial Filter Side Drawer */}
      {isFilterOpen && (
        <div 
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(26,26,26,0.15)',
            backdropFilter: 'blur(3px)',
            zIndex: 1500,
            display: 'flex',
            justifyContent: 'flex-end'
          }}
          onClick={() => setIsFilterOpen(false)}
        >
          <div 
            style={{
              backgroundColor: 'var(--color-white)',
              width: '100%',
              maxWidth: '420px',
              height: '100%',
              padding: '4rem 3.5rem',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              boxShadow: '-10px 0 40px rgba(0,0,0,0.03)'
            }}
            onClick={(e) => e.stopPropagation()}
            className="animate-fade-in"
          >
            {/* Drawer Header */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3rem' }}>
                <h2 className="text-serif" style={{ fontSize: '2rem', margin: 0 }}>Filtros Refinados</h2>
                <button onClick={() => setIsFilterOpen(false)} style={{ color: 'var(--color-text-secondary)' }}>
                  <X size={20} />
                </button>
              </div>

              {/* Filters List */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
                
                {/* 1. Occasion/Uso */}
                <div>
                  <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--color-text-secondary)', display: 'block', marginBottom: '1rem' }}>
                    Ocasión de Uso
                  </span>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                    {['', 'Diario', 'Noche', 'Viaje', 'Formal'].map((uso) => (
                      <button
                        key={uso}
                        onClick={() => setSelectedUso(uso)}
                        style={{
                          padding: '0.45rem 0.85rem',
                          border: selectedUso === uso ? '1px solid var(--color-black)' : '1px solid var(--color-border)',
                          backgroundColor: selectedUso === uso ? 'var(--color-black)' : 'transparent',
                          color: selectedUso === uso ? 'var(--color-white)' : 'var(--color-text-primary)',
                          fontSize: '0.75rem',
                          textTransform: 'uppercase',
                          letterSpacing: '0.05em',
                          transition: 'all var(--transition-fast)'
                        }}
                      >
                        {uso === '' ? 'Cualquiera' : uso}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 2. Size/Tamano */}
                <div>
                  <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--color-text-secondary)', display: 'block', marginBottom: '1rem' }}>
                    Tamaño de Pieza
                  </span>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                    {['', 'Mini', 'Mediano', 'Grande'].map((tam) => (
                      <button
                        key={tam}
                        onClick={() => setSelectedTamano(tam)}
                        style={{
                          padding: '0.45rem 0.85rem',
                          border: selectedTamano === tam ? '1px solid var(--color-black)' : '1px solid var(--color-border)',
                          backgroundColor: selectedTamano === tam ? 'var(--color-black)' : 'transparent',
                          color: selectedTamano === tam ? 'var(--color-white)' : 'var(--color-text-primary)',
                          fontSize: '0.75rem',
                          textTransform: 'uppercase',
                          letterSpacing: '0.05em',
                          transition: 'all var(--transition-fast)'
                        }}
                      >
                        {tam === '' ? 'Todos' : tam}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 3. Color */}
                <div>
                  <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--color-text-secondary)', display: 'block', marginBottom: '1rem' }}>
                    Tono del Cuero
                  </span>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                    {['', 'Negro Onyx', 'Cognac', 'Beige', 'Off-White', 'Gold'].map((col) => (
                      <button
                        key={col}
                        onClick={() => setSelectedColor(col)}
                        style={{
                          padding: '0.45rem 0.85rem',
                          border: selectedColor === col ? '1px solid var(--color-black)' : '1px solid var(--color-border)',
                          backgroundColor: selectedColor === col ? 'var(--color-black)' : 'transparent',
                          color: selectedColor === col ? 'var(--color-white)' : 'var(--color-text-primary)',
                          fontSize: '0.75rem',
                          textTransform: 'uppercase',
                          letterSpacing: '0.05em',
                          transition: 'all var(--transition-fast)'
                        }}
                      >
                        {col === '' ? 'Todos' : col}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 4. Price Slider */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                    <span style={{ color: 'var(--color-text-secondary)' }}>Precio Máximo</span>
                    <span style={{ fontWeight: 500, color: 'var(--color-black)' }}>${maxPrice} USD</span>
                  </div>
                  <input 
                    type="range" 
                    min="50" 
                    max="350" 
                    step="10" 
                    value={maxPrice}
                    onChange={(e) => setMaxPrice(Number(e.target.value))}
                    style={{
                      width: '100%',
                      accentColor: 'var(--color-black)',
                      outline: 'none',
                      height: '2px',
                      backgroundColor: 'var(--color-border)'
                    }}
                  />
                </div>

              </div>
            </div>

            {/* Bottom Actions */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <button 
                onClick={() => setIsFilterOpen(false)}
                className="btn btn-primary"
                style={{ width: '100%' }}
              >
                Aplicar Filtros
              </button>
              <button 
                onClick={handleClearFilters}
                className="btn btn-outline"
                style={{ width: '100%' }}
              >
                Limpiar Todo
              </button>
            </div>

          </div>
        </div>
      )}

      <style>{`
        .product-card:hover .product-img { transform: scale(1.03); }
        .hide-scrollbar::-webkit-scrollbar { display: none; }
        .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
};

export default Catalog;
