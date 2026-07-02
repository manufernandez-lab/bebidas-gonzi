import React, { useState, useEffect } from 'react';
import api from '../services/clienteApi';
import { useCart } from '../context/ContextoCarrito.jsx';

export default function Catalogo() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFlavors, setSelectedFlavors] = useState({});
  const { addToCart, cartItems } = useCart();

  const categories = [
    { name: 'Todos', value: '' },
    { name: 'Promos', value: 'promos' },
    { name: 'Aperitivos', value: 'aperitivos' },
    { name: 'Bebidas Blancas', value: 'bebidas blancas' },
    { name: 'Cervezas', value: 'cervezas' },
    { name: 'Bebidas Sin Alcohol', value: 'bebidas sin alcohol' },
    { name: 'Hielo', value: 'hielo' },
    { name: 'Vinos', value: 'vinos' }
  ];

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const params = {};
      if (selectedCategory) params.category = selectedCategory;
      if (searchQuery) params.search = searchQuery;

      const response = await api.get('/products', { params });
      setProducts(response.data.data.products);
      setError(null);
    } catch (err) {
      console.error(err);
      setError('No se pudieron cargar las bebidas. Intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [selectedCategory, searchQuery]);

  const getCartQty = (productId, flavor = null) => {
    const item = cartItems.find(i => i.product.id === productId && i.flavor === flavor);
    return item ? item.quantity : 0;
  };

  return (
    <div className="container animate-slide-up" style={{ marginTop: '2rem', minHeight: '80vh' }}>
      <header style={{ textAlign: 'center', marginBottom: '3rem' }}>
        <h1 style={{ fontSize: '2.8rem', fontWeight: 900, fontFamily: 'var(--font-serif)', marginBottom: '0.5rem', lineHeight: '1.2' }}>
          Tus bebidas, <span className="text-gradient">listas para disfrutar</span>
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '1.05rem', maxWidth: '600px', margin: '0 auto' }}>
          Enterate de novedades y nuevas promos en nuestro{' '}
          <a
            href="https://www.instagram.com/deliverydebebidas_gonzi/"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              color: 'var(--accent)',
              fontWeight: 700,
              textDecoration: 'none',
              borderBottom: '2px solid transparent',
              transition: 'all 0.2s ease'
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.borderBottomColor = 'var(--accent)';
              e.currentTarget.style.opacity = '0.85';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.borderBottomColor = 'transparent';
              e.currentTarget.style.opacity = '1';
            }}
          >
            Instagram 📸
          </a>
        </p>
      </header>

      <div className="glass-panel" style={{
        padding: '1.5rem',
        marginBottom: '2rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '1rem'
      }}>
        <div style={{ position: 'relative' }}>
          <input
            type="text"
            placeholder="Buscar bebidas (ej. Fernet, Cerveza, Coca...)"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="form-input"
            style={{ paddingLeft: '2.75rem', height: '48px' }}
          />
          <svg
            style={{
              position: 'absolute',
              left: '1rem',
              top: '50%',
              transform: 'translateY(-50%)',
              color: 'var(--text-secondary)'
            }}
            xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
          >
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
        </div>

        <div style={{
          display: 'flex',
          gap: '0.5rem',
          flexWrap: 'wrap',
        }}>
          {categories.map((cat) => (
            <button
              key={cat.name}
              onClick={() => setSelectedCategory(cat.value)}
              className="btn"
              style={{
                padding: '0.4rem 1.1rem',
                fontSize: '0.85rem',
                borderRadius: '9999px',
                background: selectedCategory === cat.value ? 'var(--accent)' : 'rgba(255, 255, 255, 0.65)',
                color: selectedCategory === cat.value ? '#ffffff' : 'var(--text-primary)',
                border: selectedCategory === cat.value ? 'none' : '1px solid var(--glass-border)',
                boxShadow: selectedCategory === cat.value ? '0 4px 12px rgba(198, 40, 40, 0.2)' : 'none'
              }}
            >
              {cat.name}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '5rem 0' }}>
          <div style={{
            width: '45px',
            height: '45px',
            border: '4px solid rgba(245, 158, 11, 0.1)',
            borderTop: '4px solid var(--accent)',
            borderRadius: '50%',
            animation: 'spin 0.8s linear infinite'
          }}></div>
          <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
        </div>
      ) : error ? (
        <div className="glass-panel" style={{ textAlign: 'center', padding: '3rem', color: 'var(--danger)' }}>
          <p>{error}</p>
          <button onClick={fetchProducts} className="btn btn-primary" style={{ marginTop: '1rem', padding: '0.5rem 1rem' }}>Reintentar</button>
        </div>
      ) : products.length === 0 ? (
        <div className="glass-panel" style={{ textAlign: 'center', padding: '4rem 2rem', color: 'var(--text-secondary)' }}>
          <span style={{ fontSize: '3rem' }}>🔍</span>
          <h3 style={{ marginTop: '1rem', color: 'var(--text-primary)' }}>No encontramos productos</h3>
          <p style={{ fontSize: '0.9rem', marginTop: '0.25rem' }}>Prueba escribiendo otra palabra o selecciona otra categoría.</p>
        </div>
      ) : (
        <div className="products-grid">
          {products.map((product) => {
            const isSmirnoff = product.name.toLowerCase().includes('smirnoff');
            const isSky = product.name.toLowerCase().includes('sky');
            const isPolitburo = product.name.toLowerCase().includes('politburo');
            const isPolitburoPack = isPolitburo && (product.name.toLowerCase().includes('3 unidades') || product.name.toLowerCase().includes('6 unidades'));
            const hasFlavors = isSmirnoff || isSky || isPolitburo;

            const defaultFlavor = isSmirnoff 
              ? 'Clasico' 
              : (isSky ? 'Cosmic' : (isPolitburo ? (isPolitburoPack ? 'Variado / Combinado' : 'Ipa') : null));
            const selectedFlavor = hasFlavors ? (selectedFlavors[product.id] || defaultFlavor) : null;
            const inCartQty = getCartQty(product.id, selectedFlavor);

            const flavorOptions = isSmirnoff 
              ? ['Clasico', 'Frutos Rojos', 'Manzana'] 
              : (isSky ? ['Cosmic', 'Raspberry'] : (isPolitburo ? (isPolitburoPack ? ['Variado / Combinado', 'Ipa', 'Apa', 'Session Ipa'] : ['Ipa', 'Apa', 'Session Ipa']) : []));

            return (
              <div 
                key={product.id} 
                className="glass-panel" 
                style={{ 
                  display: 'flex', 
                  flexDirection: 'column', 
                  overflow: 'hidden',
                  borderRadius: '16px'
                }}
              >
                <div style={{ width: '100%', height: '200px', position: 'relative', overflow: 'hidden', background: 'var(--bg-secondary)' }}>
                  <img 
                    src={product.imageUrl} 
                    alt={product.name} 
                    style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'var(--transition)' }}
                    onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.04)'}
                    onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
                  />
                  <span style={{
                    position: 'absolute',
                    top: '0.75rem',
                    left: '0.75rem',
                    background: 'rgba(255, 255, 255, 0.95)',
                    backdropFilter: 'blur(6px)',
                    color: 'var(--accent-gold)',
                    padding: '0.3rem 0.75rem',
                    borderRadius: '6px',
                    fontSize: '0.7rem',
                    fontWeight: 800,
                    letterSpacing: '0.75px',
                    textTransform: 'uppercase',
                    border: '1px solid var(--accent-gold)',
                    boxShadow: '0 2px 8px rgba(197, 160, 89, 0.15)'
                  }}>
                    {product.category}
                  </span>
                </div>

                <div style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', flexGrow: 1 }}>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '0.5rem', color: 'var(--text-primary)' }}>
                    {product.name}
                  </h3>
                  
                  {hasFlavors && (
                    <div style={{ marginBottom: '1rem', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                      <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                        Sabor:
                      </label>
                      <select
                        value={selectedFlavor}
                        onChange={(e) => setSelectedFlavors(prev => ({ ...prev, [product.id]: e.target.value }))}
                        className="form-input"
                        style={{
                          padding: '0.4rem 0.8rem',
                          borderRadius: '8px',
                          border: '1px solid var(--glass-border)',
                          background: 'rgba(255, 255, 255, 0.8)',
                          fontSize: '0.85rem',
                          color: 'var(--text-primary)',
                          outline: 'none',
                          cursor: 'pointer',
                          height: '36px'
                        }}
                      >
                        {flavorOptions.map(option => (
                          <option key={option} value={option}>
                            {option === 'Clasico' ? 'Clásico' : option}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto' }}>
                    <div>
                      <span style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                        ${product.price.toLocaleString('es-AR')}
                      </span>
                    </div>

                    <button
                      onClick={() => addToCart(product, 1, selectedFlavor)}
                      className="btn btn-primary"
                      style={{
                        padding: '0.5rem 1rem',
                        fontSize: '0.8rem',
                        borderRadius: '8px',
                        fontWeight: 700
                      }}
                    >
                      {inCartQty > 0 ? `Agregado (${inCartQty})` : '+ Agregar'}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
