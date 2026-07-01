import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../context/ContextoCarrito.jsx';

export default function Carrito() {
  const { cartItems, cartTotal, updateQuantity, removeFromCart, clearCart } = useCart();
  const navigate = useNavigate();

  if (cartItems.length === 0) {
    return (
      <div className="container animate-slide-up" style={{ marginTop: '4rem', textAlign: 'center', minHeight: '60vh' }}>
        <div className="glass-panel" style={{ padding: '4rem 2rem', maxWidth: '600px', margin: '0 auto' }}>
          <span style={{ fontSize: '4rem' }}>🛒</span>
          <h2 style={{ marginTop: '1.5rem', fontSize: '1.8rem', fontWeight: 800 }}>Tu carrito está vacío</h2>
          <p style={{ color: 'var(--text-secondary)', margin: '1rem 0 2rem 0', fontSize: '0.95rem' }}>
            Añade algunas bebidas heladas desde nuestro catálogo para empezar tu pedido.
          </p>
          <Link to="/" className="btn btn-primary">
            Ver Catálogo
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container animate-slide-up" style={{ marginTop: '2rem', minHeight: '80vh' }}>
      <h1 style={{ fontSize: '2rem', fontWeight: 800, marginBottom: '2rem' }}>Tu Carrito</h1>

      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr',
        gap: '2rem',
      }} className="cart-layout">
        <style>{`
          @media (min-width: 900px) {
            .cart-layout {
              grid-template-columns: 2fr 1fr !important;
            }
          }
        `}</style>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {cartItems.map((item) => (
            <div 
              key={`${item.product.id}-${item.flavor || 'none'}`} 
              className="glass-panel animate-fade-in" 
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '1.25rem',
                padding: '1.25rem',
                flexWrap: 'wrap'
              }}
            >
              <img 
                src={item.product.imageUrl} 
                alt={item.product.name} 
                style={{ width: '70px', height: '70px', objectFit: 'cover', borderRadius: '10px' }}
              />

              <div style={{ flexGrow: 1, minWidth: '150px' }}>
                <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-primary)' }}>{item.product.name}</h3>
                {item.flavor && (
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.2rem', marginBottom: '0.3rem' }}>
                    Sabor: <strong style={{ color: 'var(--accent-gold)' }}>{item.flavor}</strong>
                  </div>
                )}
                <span style={{ color: 'var(--accent)', fontSize: '0.85rem', fontWeight: 700 }}>
                  ${item.product.price.toLocaleString('es-AR')} c/u
                </span>
              </div>

              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '0.5rem', 
                background: 'rgba(255,255,255,0.65)', 
                padding: '0.25rem 0.5rem', 
                borderRadius: '8px', 
                border: '1px solid var(--glass-border)' 
              }}>
                <button 
                  onClick={() => updateQuantity(item.product.id, item.quantity - 1, item.flavor)}
                  className="btn btn-secondary"
                  style={{ width: '28px', height: '28px', padding: 0, borderRadius: '6px', fontSize: '0.9rem' }}
                >
                  -
                </button>
                <span style={{ width: '24px', textAlign: 'center', fontWeight: 'bold', fontSize: '0.9rem' }}>{item.quantity}</span>
                <button 
                  onClick={() => updateQuantity(item.product.id, item.quantity + 1, item.flavor)}
                  className="btn btn-secondary"
                  style={{ width: '28px', height: '28px', padding: 0, borderRadius: '6px', fontSize: '0.9rem' }}
                >
                  +
                </button>
              </div>

              <div style={{ minWidth: '90px', textAlign: 'right' }}>
                <span style={{ fontSize: '1.1rem', fontWeight: 800 }}>
                  ${(item.product.price * item.quantity).toLocaleString('es-AR')}
                </span>
              </div>

              <button
                onClick={() => removeFromCart(item.product.id, item.flavor)}
                className="btn btn-secondary btn-icon"
                style={{ 
                  background: 'rgba(239, 68, 68, 0.08)', 
                  borderColor: 'rgba(239, 68, 68, 0.15)', 
                  color: 'var(--danger)',
                  transition: 'var(--transition)'
                }}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/>
                </svg>
              </button>
            </div>
          ))}

          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '1rem', gap: '1rem', flexWrap: 'wrap' }}>
            <button onClick={clearCart} className="btn btn-secondary" style={{ padding: '0.6rem 1.25rem', fontSize: '0.85rem' }}>
              Vaciar Carrito
            </button>
            <Link to="/" className="btn btn-secondary" style={{ padding: '0.6rem 1.25rem', fontSize: '0.85rem' }}>
              Seguir Comprando
            </Link>
          </div>
        </div>

        <div style={{ height: 'fit-content' }}>
          <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 800, borderBottom: '1px solid var(--glass-border)', paddingBottom: '0.75rem' }}>
              Resumen del Pedido
            </h2>

            <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
              <span>Subtotal ({cartItems.reduce((acc, i) => acc + i.quantity, 0)} items)</span>
              <span>${cartTotal.toLocaleString('es-AR')}</span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
              <span>Costo de envío</span>
              <span style={{ color: 'var(--success)', fontWeight: 700 }}>Bonificado</span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid var(--glass-border)', paddingTop: '1.25rem', marginTop: '0.25rem' }}>
              <span style={{ fontWeight: 700, fontSize: '1.1rem' }}>Total</span>
              <span style={{ fontWeight: 800, fontSize: '1.4rem', color: 'var(--accent)' }}>
                ${cartTotal.toLocaleString('es-AR')}
              </span>
            </div>

            <button 
              onClick={() => navigate('/checkout')}
              className="btn btn-primary"
              style={{ width: '100%', padding: '0.85rem', fontSize: '1rem', marginTop: '0.5rem', borderRadius: '10px' }}
            >
              Confirmar Pedido
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
