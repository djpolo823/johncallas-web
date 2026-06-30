import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { useParams, Link } from 'react-router-dom';
import { ChevronDown, ChevronUp, Check } from 'lucide-react';
import { ProductService } from '../services/productService';
import type { Product as ProductType } from '../types';
import { useCart } from '../context/CartContext';

export const Product: React.FC = () => {
  const { id } = useParams();
  
  const [product, setProduct] = useState<ProductType | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [activeTab, setActiveTab] = useState<'details' | 'shipping'>('details');
  const [selectedColor, setSelectedColor] = useState<string>('');
  const [addedToCart, setAddedToCart] = useState(false);

  useEffect(() => {
    const fetchProduct = async () => {
      if (!id) return;
      setLoading(true);
      try {
        const data = await ProductService.getProductById(id);
        setProduct(data);
        if (data) {
          setSelectedColor(data.filters?.color || 'Negro Onyx');
        }
      } catch (err) {
        console.error('Error fetching product:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchProduct();
  }, [id]);

  const { addItem } = useCart();

  const handleAddToCart = () => {
    if (!product) return;
    addItem({
      id: String(product.id),
      name: product.name,
      price: product.price,
      color: selectedColor,
      image: product.images[0] || '',
      ref: product.ref
    });
    setAddedToCart(true);
    setTimeout(() => setAddedToCart(false), 2000);
  };

  if (loading) {
    return (
      <div style={{
        height: '80vh',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'var(--color-off-white)'
      }}>
        <div style={{
          fontSize: '1rem',
          letterSpacing: '0.2em',
          textTransform: 'uppercase',
          color: 'var(--color-text-secondary)',
          animation: 'pulse 1.5s infinite ease-in-out'
        }}>
          Descubriendo Pieza...
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div style={{
        minHeight: '80vh',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'var(--color-off-white)',
        padding: '2rem',
        textAlign: 'center'
      }}>
        <h1 className="text-serif" style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>Pieza No Hallada</h1>
        <p style={{ color: 'var(--color-text-secondary)', marginBottom: '2.5rem', maxWidth: '400px' }}>
          El artículo de marroquinería que buscas no forma parte del catálogo activo.
        </p>
        <Link to="/catalogo" className="btn btn-primary">
          Regresar al Catálogo
        </Link>
      </div>
    );
  }

  // Fallback images array if somehow empty
  const images = product.images.length > 0 ? product.images : ['https://images.unsplash.com/photo-1590874103328-eac38a683ce7?q=80&w=600'];

  return (
    <div style={{ paddingBottom: '6rem', backgroundColor: 'var(--color-off-white)' }} className="animate-fade-in">
      
      {/* High Fidelity Dynamic SEO tags for the Product Detail page */}
      <Helmet>
        <title>{`${product.name} | JohnCallas`}</title>
        <meta name="description" content={`${product.description.slice(0, 155)}...`} />
        <link rel="canonical" href={`https://johncallas.com/producto/${product.id}`} />
        
        {/* Open Graph Product Tags */}
        <meta property="og:title" content={`${product.name} | JohnCallas`} />
        <meta property="og:description" content={product.description} />
        <meta property="og:type" content="product" />
        <meta property="og:url" content={`https://johncallas.com/producto/${product.id}`} />
        <meta property="og:image" content={images[0]} />
        <meta property="product:price:amount" content={product.price.toString()} />
        <meta property="product:price:currency" content="USD" />
        <meta name="twitter:card" content="summary_large_image" />
      </Helmet>

      <div className="container" style={{ marginTop: '2rem' }}>
        
        {/* Editorial Breadcrumb */}
        <div style={{ marginBottom: '3rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--color-text-secondary)' }}>
          <Link to="/">Inicio</Link> / <Link to="/catalogo">Colección</Link> / <span style={{ color: 'var(--color-black)', fontWeight: 500 }}>{product.name}</span>
        </div>

        <div className="grid grid-cols-2" style={{ gap: '5rem', alignItems: 'flex-start' }}>
          
          {/* Multi-Image Interactive Media Gallery */}
          <div style={{ display: 'flex', gap: '1.5rem' }} className="product-gallery-layout">
            
            {/* Thumbnails Sidebar Column */}
            {images.length > 1 && (
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '1rem',
                width: '70px',
                flexShrink: 0
              }} className="gallery-thumbnails">
                {images.map((imgUrl, idx) => (
                  <button
                    key={idx}
                    onClick={() => setActiveImageIndex(idx)}
                    style={{
                      width: '70px',
                      aspectRatio: '4/5',
                      border: idx === activeImageIndex ? '1px solid var(--color-gold-subtle)' : '1px solid var(--color-border)',
                      backgroundColor: 'var(--color-white)',
                      overflow: 'hidden',
                      padding: 0,
                      opacity: idx === activeImageIndex ? 1 : 0.6,
                      transition: 'all var(--transition-fast)'
                    }}
                    aria-label={`Ver imagen ${idx + 1}`}
                  >
                    <img src={imgUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  </button>
                ))}
              </div>
            )}

            {/* Active Display Image */}
            <div style={{ flex: 1, position: 'relative', overflow: 'hidden', backgroundColor: 'var(--color-white)', border: '1px solid var(--color-border)' }}>
              <img 
                src={images[activeImageIndex]} 
                alt={product.name} 
                style={{ width: '100%', aspectRatio: '4/5', objectFit: 'cover' }} 
              />
            </div>
          </div>

          {/* Product Specifications & Narrative */}
          <div style={{ position: 'sticky', top: '100px' }} className="product-info-column">
            
            {/* Visual Branding & SKU */}
            <span style={{ textTransform: 'uppercase', letterSpacing: '0.15em', fontSize: '0.75rem', color: 'var(--color-gold-subtle)', fontWeight: 600 }}>
              {product.category}
            </span>
            
            <h1 className="text-serif" style={{ fontSize: '3rem', marginTop: '0.5rem', marginBottom: '0.75rem', color: 'var(--color-black)', fontWeight: 400 }}>
              {product.name}
            </h1>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--color-border)', paddingBottom: '1.5rem', marginBottom: '2rem' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', fontFamily: 'monospace' }}>REF: {product.ref}</span>
              <span style={{ fontSize: '1.5rem', color: 'var(--color-black)', fontWeight: 400 }}>${product.price} USD</span>
            </div>

            {/* Description Narrative */}
            <p style={{ color: 'var(--color-text-secondary)', marginBottom: '2.5rem', fontSize: '1.05rem', lineHeight: 1.8, fontWeight: 300 }}>
              {product.description}
            </p>

            {/* Interactive Color Switcher */}
            <div style={{ marginBottom: '2.5rem' }}>
              <p style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '1rem', color: 'var(--color-text-secondary)' }}>
                Tono del Cuero: <span style={{ fontWeight: 500, color: 'var(--color-black)' }}>{selectedColor}</span>
              </p>
              
              <div style={{ display: 'flex', gap: '1rem' }}>
                {[
                  { name: 'Negro Onyx', hex: '#1A1A1A' },
                  { name: 'Cognac', hex: '#8B5A2B' },
                  { name: 'Beige', hex: '#EADDD7' },
                  { name: 'Off-White', hex: '#FAF9F6' },
                  { name: 'Gold', hex: '#CBAA6A' }
                ].map((colorObj) => {
                  const isColorActive = selectedColor === colorObj.name;
                  return (
                    <button
                      key={colorObj.name}
                      onClick={() => setSelectedColor(colorObj.name)}
                      style={{
                        width: '28px',
                        height: '28px',
                        borderRadius: '50%',
                        backgroundColor: colorObj.hex,
                        border: colorObj.name === 'Off-White' ? '1px solid var(--color-border)' : '1px solid transparent',
                        outline: isColorActive ? '1px solid var(--color-gold-subtle)' : 'none',
                        outlineOffset: '3px',
                        transition: 'all 0.2s ease'
                      }}
                      title={colorObj.name}
                      aria-label={colorObj.name}
                    />
                  );
                })}
              </div>
            </div>

            {/* Interactive CTA */}
            <div style={{ display: 'flex', gap: '1.5rem', marginBottom: '3.5rem' }}>
              {product.stock > 0 ? (
                <button 
                  onClick={handleAddToCart}
                  className="btn btn-primary" 
                  style={{ flex: 1, padding: '1rem 2rem', fontSize: '0.875rem' }}
                >
                  {addedToCart ? 'Pieza Agregada' : 'Agregar al Carrito'}
                </button>
              ) : (
                <button 
                  disabled
                  className="btn" 
                  style={{ flex: 1, padding: '1rem 2rem', fontSize: '0.875rem', backgroundColor: 'var(--color-border)', color: 'var(--color-text-secondary)', cursor: 'not-allowed' }}
                >
                  Pieza Agotada
                </button>
              )}
            </div>

            {/* Bullet Features (Technical Details) */}
            {product.features && product.features.length > 0 && (
              <ul style={{
                listStyle: 'none',
                padding: 0,
                marginBottom: '3.5rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '1rem',
                color: 'var(--color-text-secondary)',
                fontSize: '0.875rem',
                fontWeight: 300
              }}>
                {product.features.map((feature, idx) => (
                  <li key={idx} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <Check size={14} style={{ color: 'var(--color-gold-subtle)' }} />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            )}

            {/* Sophisticated Accordions */}
            <div style={{ borderTop: '1px solid var(--color-border)' }}>
              
              {/* Tab 1: Dimensions */}
              <div 
                style={{ padding: '1.5rem 0', borderBottom: '1px solid var(--color-border)', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                onClick={() => setActiveTab(activeTab === 'details' ? '' as any : 'details')}
              >
                <h3 style={{ fontSize: '0.875rem', textTransform: 'uppercase', letterSpacing: '0.1em', margin: 0, fontWeight: 500, color: 'var(--color-black)' }}>
                  Detalles y Dimensiones
                </h3>
                {activeTab === 'details' ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </div>
              {activeTab === 'details' && (
                <div style={{ paddingBottom: '1.5rem', color: 'var(--color-text-secondary)', fontSize: '0.875rem', lineHeight: 1.8, fontWeight: 300 }}>
                  Nuestras piezas de marroquinería son elaboradas a mano con cueros seleccionados. Las dimensiones aproximadas son:<br/>
                  • Alto: 28 cm | Ancho: 36 cm | Profundidad: 14 cm<br/>
                  • Compartimentos internos optimizados para dispositivos y pertenencias esenciales.<br/>
                  • Peso aproximado en vacío: 0.8 kg.
                </div>
              )}

              {/* Tab 2: Shipping */}
              <div 
                style={{ padding: '1.5rem 0', borderBottom: '1px solid var(--color-border)', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                onClick={() => setActiveTab(activeTab === 'shipping' ? '' as any : 'shipping')}
              >
                <h3 style={{ fontSize: '0.875rem', textTransform: 'uppercase', letterSpacing: '0.1em', margin: 0, fontWeight: 500, color: 'var(--color-black)' }}>
                  Envíos y Devoluciones
                </h3>
                {activeTab === 'shipping' ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </div>
              {activeTab === 'shipping' && (
                <div style={{ paddingBottom: '1.5rem', color: 'var(--color-text-secondary)', fontSize: '0.875rem', lineHeight: 1.8, fontWeight: 300 }}>
                  Ofrecemos envíos exprés de cortesía en todos los pedidos nacionales. Cada artículo es enviado en un empaque de diseño editorial rígido protector para asegurar su estado impecable. Devoluciones disponibles dentro de los 30 días posteriores.
                </div>
              )}
            </div>

          </div>
        </div>
      </div>
      
      <style>{`
        @media (max-width: 900px) {
          .grid-cols-2 { grid-template-columns: 1fr !important; gap: 3rem !important; }
          .product-gallery-layout { flexDirection: column-reverse !important; }
          .gallery-thumbnails { flexDirection: row !important; width: 100% !important; justifyContent: center !important; }
          .product-info-column { position: static !important; }
        }
      `}</style>
    </div>
  );
};

export default Product;
