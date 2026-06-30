import React, { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import { Trash2, ArrowRight, Minus, Plus, ShoppingBag, Check, Loader2, Hammer } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { CheckoutService } from '../services/checkoutService';

const Cart: React.FC = () => {
  const { items, totalItems, subtotal, removeItem, updateQuantity, clearCart } = useCart();
  const { currentUser } = useAuth();
  
  const [checkoutStarted, setCheckoutStarted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [invoiceNumber, setInvoiceNumber] = useState<string>('');
  const [opsGenerated, setOpsGenerated] = useState<string[]>([]);

  const shipping = 0; // Free shipping
  const total = subtotal + shipping;

  const handleCheckout = async () => {
    if (items.length === 0) return;
    setLoading(true);
    setError(null);
    try {
      const result = await CheckoutService.procesarCheckout(
        items,
        currentUser?.id || null
      );
      
      if (result.success) {
        setInvoiceNumber(result.factura);
        setOpsGenerated(result.opsGeneradas);
        setCheckoutStarted(true);
        clearCart();
      } else {
        setError(result.mensaje);
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Error al procesar el checkout.');
    } finally {
      setLoading(false);
    }
  };

  if (checkoutStarted) {
    return (
      <div style={{ paddingTop: '4rem', paddingBottom: '6rem', backgroundColor: 'var(--color-off-white)' }}>
        <Helmet>
          <title>Pedido Confirmado | JohnCallas</title>
        </Helmet>
        <div className="container" style={{ maxWidth: '650px', textAlign: 'center', padding: '6rem 2rem', backgroundColor: 'var(--color-white)', border: '1px solid var(--color-border)', boxShadow: '0 20px 40px rgba(0,0,0,0.02)' }}>
          <div style={{
            width: '64px',
            height: '64px',
            borderRadius: '50%',
            backgroundColor: 'var(--color-black)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 2rem'
          }}>
            <Check size={28} color="var(--color-white)" />
          </div>
          <h1 className="text-serif" style={{ fontSize: '2.5rem', marginBottom: '0.5rem', color: 'var(--color-black)' }}>
            Pedido Confirmado
          </h1>
          <span style={{ 
            fontFamily: 'monospace', 
            textTransform: 'uppercase', 
            letterSpacing: '0.15em', 
            fontSize: '0.85rem', 
            color: 'var(--color-gold-subtle)',
            fontWeight: 500,
            display: 'block',
            marginBottom: '2rem'
          }}>
            Factura: {invoiceNumber}
          </span>
          
          <p style={{ color: 'var(--color-text-secondary)', fontSize: '1.05rem', lineHeight: 1.8, marginBottom: '2.5rem', fontWeight: 300 }}>
            Gracias por tu confianza en la maestría JohnCallas. Hemos recibido tu pedido y estamos preparando los detalles de embalaje y envío exclusivo.
          </p>

          {opsGenerated.length > 0 && (
            <div style={{
              backgroundColor: '#FAF9F5',
              border: '1px solid #EFECE3',
              borderRadius: '4px',
              padding: '2rem',
              marginBottom: '3rem',
              textAlign: 'left',
            }}>
              <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start', marginBottom: '1rem' }}>
                <div style={{ 
                  color: 'var(--color-gold-subtle)', 
                  backgroundColor: 'var(--color-white)',
                  padding: '0.5rem',
                  borderRadius: '50%',
                  border: '1px solid #EFECE3',
                  display: 'flex'
                }}>
                  <Hammer size={18} />
                </div>
                <div>
                  <h4 className="text-serif" style={{ margin: 0, fontSize: '1.1rem', color: 'var(--color-black)' }}>
                    Elaboración Artesanal Bajo Pedido (MTO)
                  </h4>
                  <p style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)', margin: '0.25rem 0 0 0' }}>
                    Selección exclusiva sin stock físico inmediato.
                  </p>
                </div>
              </div>
              <p style={{ fontSize: '0.9rem', color: 'var(--color-text-secondary)', lineHeight: 1.6, margin: 0 }}>
                Para honrar nuestro compromiso con el "Quiet Luxury", hemos asignado tu pieza a un maestro artesano en nuestro taller principal. Se han iniciado las órdenes de producción:
              </p>
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginTop: '1rem' }}>
                {opsGenerated.map((opCode) => (
                  <span key={opCode} style={{ 
                    backgroundColor: 'var(--color-white)', 
                    border: '1px solid var(--color-border)', 
                    padding: '0.35rem 0.75rem', 
                    borderRadius: '4px', 
                    fontSize: '0.8rem', 
                    fontFamily: 'monospace',
                    fontWeight: 600,
                    color: 'var(--color-black)'
                  }}>
                    {opCode}
                  </span>
                ))}
              </div>
              <p style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', marginTop: '1rem', fontStyle: 'italic', marginBlockEnd: 0 }}>
                * El lead-time de fabricación estimado es de 7 días hábiles. Te enviaremos actualizaciones a medida que avance el corte y costura de tu pieza.
              </p>
            </div>
          )}

          <Link to="/catalogo" className="btn btn-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', width: '100%', justifyContent: 'center', padding: '1rem' }}>
            Seguir Explorando <ArrowRight size={16} />
          </Link>
        </div>
      </div>
    );
  }


  return (
<div style={{ paddingTop: '2rem', paddingBottom: '6rem', backgroundColor: '#fafafa' }} className="animate-fade-in">
  <Helmet>
    <title>{`Carrito (${totalItems}) | JohnCallas`}</title>
  </Helmet>
  <h1 className="text-serif" style={{ fontSize: '2rem', marginBottom: '2rem', color: 'var(--color-black)' }}>Carrito</h1>

      <div className="container" style={{ maxWidth: '1000px' }}>
        
        {/* Header */}
        <div style={{ marginBottom: '3rem' }}>
          <span style={{ textTransform: 'uppercase', letterSpacing: '0.15em', fontSize: '0.75rem', color: 'var(--color-gold-subtle)', fontWeight: 600 }}>
            Tu Selección
          </span>
          <h1 className="text-serif" style={{ fontSize: '2.5rem', marginTop: '0.5rem', marginBottom: 0, color: 'var(--color-black)' }}>
            Carrito de Compras
          </h1>
        </div>

        {items.length > 0 ? (
          <div className="grid cart-layout" style={{ gridTemplateColumns: '2fr 1fr', gap: '4rem', alignItems: 'flex-start' }}>
            
            {/* Cart Items */}
            <div>
              <div style={{ borderBottom: '1px solid var(--color-border)', paddingBottom: '1rem', marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', color: 'var(--color-text-secondary)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                <span>Producto ({totalItems} {totalItems === 1 ? 'pieza' : 'piezas'})</span>
                <span>Total</span>
              </div>

              {items.map((item) => (
                <div key={item.id} style={{ display: 'flex', gap: '2rem', marginBottom: '2rem', paddingBottom: '2rem', borderBottom: '1px solid var(--color-border)' }}>
                  <Link to={`/producto/${item.id}`} style={{ flexShrink: 0 }}>
                    <img 
                      src={item.image} 
                      alt={item.name} 
                      style={{ width: '120px', height: '150px', objectFit: 'cover', backgroundColor: '#F5F5F5' }} 
                    />
                  </Link>
                  
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <div>
                        <h3 className="text-serif" style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>
                          <Link to={`/producto/${item.id}`} style={{ color: 'var(--color-black)' }}>{item.name}</Link>
                        </h3>
                        <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.875rem', marginBottom: '0.25rem' }}>Color: {item.color}</p>
                        <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.75rem', fontFamily: 'monospace' }}>REF: {item.ref}</p>
                        <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.875rem', marginTop: '0.5rem' }}>${Number(item.price || 0).toFixed(2)} USD</p>
                      </div>
                      <span style={{ fontWeight: 500, color: 'var(--color-black)', fontSize: '1.05rem' }}>
                        ${(Number(item.price || 0) * Number(item.quantity || 1)).toFixed(2)} USD
                      </span>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: '1rem' }}>
                      {/* Quantity Controls */}
                      <div style={{ display: 'flex', alignItems: 'center', border: '1px solid var(--color-border)' }}>
                        <button 
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          style={{ 
                            padding: '0.5rem 0.75rem', 
                            color: 'var(--color-text-secondary)',
                            display: 'flex',
                            alignItems: 'center',
                            transition: 'color 0.2s'
                          }}
                          aria-label="Reducir cantidad"
                        >
                          <Minus size={14} />
                        </button>
                        <span style={{ 
                          padding: '0.5rem 1rem', 
                          fontSize: '0.875rem', 
                          minWidth: '40px', 
                          textAlign: 'center',
                          borderLeft: '1px solid var(--color-border)',
                          borderRight: '1px solid var(--color-border)'
                        }}>
                          {item.quantity}
                        </span>
                        <button 
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          style={{ 
                            padding: '0.5rem 0.75rem', 
                            color: 'var(--color-text-secondary)',
                            display: 'flex',
                            alignItems: 'center',
                            transition: 'color 0.2s'
                          }}
                          aria-label="Aumentar cantidad"
                        >
                          <Plus size={14} />
                        </button>
                      </div>

                      {/* Remove Button */}
                      <button 
                        onClick={() => removeItem(item.id)}
                        style={{ 
                          color: 'var(--color-text-secondary)', 
                          display: 'flex', 
                          alignItems: 'center', 
                          gap: '0.5rem', 
                          fontSize: '0.8rem',
                          textTransform: 'uppercase',
                          letterSpacing: '0.05em',
                          transition: 'color 0.2s'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.color = '#D98888'}
                        onMouseLeave={(e) => e.currentTarget.style.color = 'var(--color-text-secondary)'}
                      >
                        <Trash2 size={14} /> Eliminar
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Order Summary */}
            <div style={{ backgroundColor: 'var(--color-white)', padding: '2.5rem', border: '1px solid var(--color-border)', position: 'sticky', top: '100px' }}>
              <h2 className="text-serif" style={{ fontSize: '1.5rem', marginBottom: '2rem', color: 'var(--color-black)' }}>Resumen del Pedido</h2>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem', color: 'var(--color-text-secondary)', fontSize: '0.875rem' }}>
                <span>Subtotal ({totalItems} {totalItems === 1 ? 'artículo' : 'artículos'})</span>
                <span>${Number(subtotal || 0).toFixed(2)} USD</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2rem', color: 'var(--color-text-secondary)', fontSize: '0.875rem' }}>
                <span>Envío</span>
                <span style={{ color: 'var(--color-gold-subtle)', fontWeight: 500 }}>Cortesía</span>
              </div>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2rem', paddingTop: '1.5rem', borderTop: '1px solid var(--color-border)', fontWeight: 500, fontSize: '1.25rem', color: 'var(--color-black)' }}>
                <span>Total</span>
                <span>${Number(total || 0).toFixed(2)} USD</span>
              </div>

              {error && (
                <div style={{ 
                  color: '#9C3E3E', 
                  backgroundColor: '#FDF7F7', 
                  border: '1px solid #F3DFDF', 
                  padding: '1rem', 
                  marginBottom: '1.5rem', 
                  borderRadius: '4px', 
                  fontSize: '0.85rem',
                  textAlign: 'left',
                  lineHeight: 1.5
                }}>
                  {error}
                </div>
              )}

              <button 
                onClick={handleCheckout}
                disabled={loading}
                className="btn btn-primary" 
                style={{ 
                  width: '100%', 
                  marginBottom: '1rem', 
                  padding: '1.1rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                  opacity: loading ? 0.75 : 1,
                  cursor: loading ? 'not-allowed' : 'pointer',
                  border: 'none',
                  transition: 'all 0.2s ease-in-out'
                }}
              >
                {loading ? (
                  <>
                    <Loader2 className="animate-spin" size={16} style={{ animation: 'spin 1s linear infinite' }} />
                    Procesando Maestría...
                  </>
                ) : (
                  'Confirmar y Reservar Pieza'
                )}
              </button>
              
              <Link to="/catalogo" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', fontSize: '0.875rem', color: 'var(--color-text-secondary)', marginTop: '1.5rem', transition: 'color 0.2s' }}>
                Continuar Comprando <ArrowRight size={16} />
              </Link>
            </div>
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '6rem 0', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <ShoppingBag size={48} strokeWidth={1} style={{ color: 'var(--color-leather-beige)', marginBottom: '2rem' }} />
            <h2 className="text-serif" style={{ fontSize: '2.25rem', marginBottom: '1rem', fontWeight: 400, color: 'var(--color-black)' }}>
              Tu carrito está vacío
            </h2>
            <p style={{ fontSize: '1rem', color: 'var(--color-text-secondary)', marginBottom: '3rem', maxWidth: '400px', lineHeight: 1.6, fontWeight: 300 }}>
              Descubre nuestra colección de piezas artesanales de marroquinería y encuentra algo especial.
            </p>
            <Link to="/catalogo" className="btn btn-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
              Descubrir la Colección <ArrowRight size={16} />
            </Link>
          </div>
        )}
      </div>

      <style>{`
        @media (max-width: 768px) {
          .cart-layout { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
};

export default Cart;
