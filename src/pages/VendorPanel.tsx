import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { useAuth } from '../context/AuthContext';
import type { Product } from '../types';
import { ProductService } from '../services/productService';
import { ShoppingBag, Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const VendorPanel: React.FC = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    fetchVendorProducts();
  }, [currentUser]);

  const fetchVendorProducts = async () => {
    if (!currentUser) return;
    try {
      const allProducts = await ProductService.getProducts();
      // Filter only products belonging to this vendor in a real application
      // For demo purposes, we will show all products that have vendor ownerId, or fallback to standard ones
      const vendorData = allProducts.filter(p => p.ownerId === currentUser.id || !p.ownerId);
      setProducts(vendorData);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div style={{ paddingTop: '2rem', paddingBottom: '6rem', backgroundColor: 'var(--color-off-white)' }} className="animate-fade-in">
      <Helmet>
        <title>Panel de Vendedor | JohnCallas</title>
      </Helmet>

      <div className="container">
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '4rem' }}>
          <div>
            <span style={{ textTransform: 'uppercase', letterSpacing: '0.15em', fontSize: '0.75rem', color: 'var(--color-gold-subtle)', fontWeight: 600 }}>
              Atelier del Vendedor
            </span>
            <h1 className="text-serif" style={{ fontSize: '3rem', marginTop: '0.5rem', marginBottom: 0, color: 'var(--color-black)' }}>
              Tus Creaciones
            </h1>
          </div>
          
          <button 
            onClick={() => navigate('/admin')} // Vendors can redirect to their tool
            className="btn btn-primary"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}
          >
            <Plus size={16} /> Agregar Pieza
          </button>
        </div>

        {/* Info Card */}
        <div style={{
          backgroundColor: 'var(--color-white)',
          border: '1px solid var(--color-border)',
          padding: '3rem',
          textAlign: 'center',
          maxWidth: '600px',
          margin: '0 auto'
        }}>
          <ShoppingBag size={40} strokeWidth={1} style={{ color: 'var(--color-gold-subtle)', marginBottom: '1.5rem' }} />
          <h2 className="text-serif" style={{ fontSize: '1.75rem', marginBottom: '1rem', color: 'var(--color-black)' }}>
            Bienvenido, {currentUser?.name}
          </h2>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.875rem', lineHeight: 1.6, marginBottom: '2rem' }}>
            Como vendedor asociado de JohnCallas, puedes publicar tus propias colecciones de marroquinería premium y gestionar sus niveles de existencias. 
          </p>
          <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: '1.5rem', display: 'flex', justifyContent: 'space-around' }}>
            <div>
              <span style={{ fontSize: '1.5rem', display: 'block', color: 'var(--color-black)' }}>{products.length}</span>
              <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--color-text-secondary)' }}>Productos</span>
            </div>
            <div>
              <span style={{ fontSize: '1.5rem', display: 'block', color: 'var(--color-black)' }}>{products.reduce((acc, p) => acc + p.stock, 0)}</span>
              <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--color-text-secondary)' }}>Stock Total</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VendorPanel;
