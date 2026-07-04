import React, { useState, useEffect } from 'react';
import api from '../services/clienteApi';
import { useStoreConfig } from '../context/ContextoConfiguracion.jsx';

export default function Admin() {
  const { refreshConfig } = useStoreConfig();

  // Authentication states
  const [isAuthenticated, setIsAuthenticated] = useState(
    sessionStorage.getItem('admin_auth') === 'true'
  );
  const [passwordInput, setPasswordInput] = useState('');
  const [authError, setAuthError] = useState('');

  // Active tab state
  const [activeTab, setActiveTab] = useState('products'); // 'products' or 'schedule'

  // Data states
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState('');

  // Form states for creating/editing product
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    price: '',
    category: 'Cervezas',
    imageUrl: '',
    isAvailable: true
  });

  // Schedule config states
  const [scheduleConfig, setScheduleConfig] = useState(null);
  const [configLoading, setConfigLoading] = useState(false);
  const [configError, setConfigError] = useState('');
  const [configSuccess, setConfigSuccess] = useState('');

  const categories = [
    'Promos',
    'Aperitivos',
    'Bebidas Blancas',
    'Cervezas',
    'Bebidas Sin Alcohol',
    'Hielo',
    'Vinos'
  ];

  const fetchProducts = async () => {
    try {
      const response = await api.get('/products');
      setProducts(response.data.data.products);
    } catch (err) {
      console.error(err);
      setError('Error al cargar productos');
    }
  };

  const loadData = async () => {
    setLoading(true);
    setError(null);
    await fetchProducts();
    setLoading(false);
  };

  const fetchConfig = async () => {
    try {
      setConfigLoading(true);
      setConfigError('');
      const response = await api.get('/config');
      const conf = response.data.data.config;
      setScheduleConfig(conf);
    } catch (err) {
      console.error(err);
      setConfigError('Error al cargar la configuración de horarios');
    } finally {
      setConfigLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      loadData();
      fetchConfig();
    }
  }, [isAuthenticated]);

  const handleDayChange = (dayIndex, field, value) => {
    setScheduleConfig(prev => {
      if (!prev) return null;
      const updatedSchedule = prev.schedule.map(d => {
        if (d.dayIndex === dayIndex) {
          return { ...d, [field]: value };
        }
        return d;
      });
      return { ...prev, schedule: updatedSchedule };
    });
  };

  const handleSaveConfig = async () => {
    try {
      setConfigError('');
      setConfigSuccess('');
      
      // Validate times before sending
      const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
      for (const d of scheduleConfig.schedule) {
        if (d.isOpen) {
          if (!timeRegex.test(d.openTime) || !timeRegex.test(d.closeTime)) {
            setConfigError(`Formato de hora inválido en ${d.dayName} (debe ser HH:MM, ej. 20:00)`);
            return;
          }
        }
      }

      const payload = {
        schedule: scheduleConfig.schedule
      };

      const response = await api.put('/config', payload);
      setScheduleConfig(response.data.data.config);
      refreshConfig(); // Update global context immediately
      setConfigSuccess('Horarios actualizados con éxito');
      setTimeout(() => setConfigSuccess(''), 4000);
    } catch (err) {
      console.error(err);
      setConfigError('Error al guardar la configuración');
    }
  };

  const showNotification = (msg) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(''), 4000);
  };

  const handleAuthSubmit = (e) => {
    e.preventDefault();
    if (passwordInput === 'RomaGonzi27') {
      setIsAuthenticated(true);
      sessionStorage.setItem('admin_auth', 'true');
      setAuthError('');
    } else {
      setAuthError('Contraseña incorrecta. Intenta de nuevo.');
      setPasswordInput('');
    }
  };

  const handleOpenCreateModal = () => {
    setEditingProduct(null);
    setFormData({
      name: '',
      price: '',
      category: 'Cervezas',
      imageUrl: '',
      isAvailable: true
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      price: product.price,
      category: product.category,
      imageUrl: product.imageUrl,
      isAvailable: product.isAvailable !== undefined ? product.isAvailable : true
    });
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingProduct(null);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 800;
        const MAX_HEIGHT = 800;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height;
            height = MAX_HEIGHT;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.85);

        setFormData(prev => ({
          ...prev,
          imageUrl: dataUrl
        }));
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
  };

  const handleSubmitProduct = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...formData,
        price: Number(formData.price)
      };

      if (editingProduct) {
        await api.put(`/products/${editingProduct.id}`, payload);
        showNotification('Producto actualizado con éxito');
      } else {
        await api.post('/products', payload);
        showNotification('Producto creado con éxito');
      }
      handleCloseModal();
      await fetchProducts();
    } catch (err) {
      console.error(err);
      setError('Error al guardar el producto. Verifica los campos.');
    }
  };

  const handleDeleteProduct = async (id) => {
    if (!window.confirm('¿Estás seguro de que quieres eliminar este producto?')) return;
    try {
      await api.delete(`/products/${id}`);
      showNotification('Producto eliminado con éxito');
      await fetchProducts();
    } catch (err) {
      console.error(err);
      setError('Error al eliminar el producto');
    }
  };

  // Lock Screen Rendering
  if (!isAuthenticated) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '75vh',
        padding: '2rem 1rem'
      }} className="animate-slide-up">
        <div className="glass-panel" style={{
          padding: '2.5rem',
          borderRadius: '24px',
          width: '100%',
          maxWidth: '400px',
          textAlign: 'center',
          boxShadow: '0 20px 40px rgba(0,0,0,0.08)',
          border: '1px solid var(--glass-border)'
        }}>
          {/* Lock Icon */}
          <div style={{
            width: '60px',
            height: '60px',
            borderRadius: '50%',
            background: 'rgba(198, 40, 40, 0.08)',
            color: 'var(--accent)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 1.5rem'
          }}>
            <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
              <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
            </svg>
          </div>

          <h2 style={{ fontSize: '1.6rem', fontWeight: 900, fontFamily: 'var(--font-serif)', marginBottom: '0.5rem' }}>
            Acceso <span className="text-gradient">Restringido</span>
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', marginBottom: '1.75rem', lineHeight: '1.4' }}>
            Ingresá la contraseña de administración para gestionar el stock del sitio.
          </p>

          <form onSubmit={handleAuthSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <input
              type="password"
              placeholder="Contraseña"
              value={passwordInput}
              onChange={(e) => setPasswordInput(e.target.value)}
              required
              className="form-input"
              style={{
                width: '100%',
                textAlign: 'center',
                letterSpacing: passwordInput ? '4px' : 'normal',
                fontSize: '1rem',
                height: '46px'
              }}
            />

            {authError && (
              <span style={{
                color: '#C62828',
                fontSize: '0.8rem',
                fontWeight: 600,
                marginTop: '-0.25rem',
                display: 'block'
              }}>
                {authError}
              </span>
            )}

            <button
              type="submit"
              className="btn btn-primary"
              style={{
                width: '100%',
                padding: '0.75rem',
                fontSize: '0.95rem',
                fontWeight: 700,
                borderRadius: '12px',
                marginTop: '0.5rem'
              }}
            >
              Ingresar
            </button>
          </form>
        </div>
      </div>
    );
  }

  // Admin Dashboard Rendering
  return (
    <div className="container animate-slide-up" style={{ marginTop: '2rem', minHeight: '80vh', paddingBottom: '3rem' }}>
      
      {/* Header */}
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '2.2rem', fontWeight: 900, fontFamily: 'var(--font-serif)', marginBottom: '0.25rem' }}>
            Panel de <span className="text-gradient">Control</span>
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
            Administrá las bebidas y el stock de la tienda.
          </p>
        </div>

        {/* Global Notifications */}
        {successMsg && (
          <div style={{
            background: 'var(--success-bg, #E8F5E9)',
            color: 'var(--success-color, #2E7D32)',
            padding: '0.75rem 1.5rem',
            borderRadius: '12px',
            border: '1px solid var(--success-border, #A5D6A7)',
            fontSize: '0.9rem',
            fontWeight: 600,
            boxShadow: '0 4px 12px rgba(46, 125, 50, 0.1)',
            animation: 'fadeIn 0.3s'
          }}>
            {successMsg}
          </div>
        )}

        {error && (
          <div style={{
            background: '#FFEBEE',
            color: '#C62828',
            padding: '0.75rem 1.5rem',
            borderRadius: '12px',
            border: '1px solid #FFCDD2',
            fontSize: '0.9rem',
            fontWeight: 600,
            boxShadow: '0 4px 12px rgba(198, 40, 40, 0.1)',
            animation: 'fadeIn 0.3s'
          }}>
            {error}
            <button onClick={() => setError(null)} style={{ marginLeft: '1rem', background: 'none', border: 'none', color: '#C62828', cursor: 'pointer', fontWeight: 700 }}>✕</button>
          </div>
        )}
      </header>

      {/* Tabs */}
      <div style={{
        display: 'flex',
        gap: '0.75rem',
        borderBottom: '1px solid var(--glass-border)',
        marginBottom: '2.5rem',
        paddingBottom: '0.5rem'
      }}>
        <button
          onClick={() => setActiveTab('products')}
          style={{
            background: 'none',
            border: 'none',
            borderBottom: activeTab === 'products' ? '3px solid var(--accent)' : '3px solid transparent',
            color: activeTab === 'products' ? 'var(--text-primary)' : 'var(--text-secondary)',
            padding: '0.5rem 1.25rem',
            fontSize: '1rem',
            fontWeight: 700,
            cursor: 'pointer',
            transition: 'var(--transition)'
          }}
        >
          Gestionar Productos
        </button>
        <button
          onClick={() => setActiveTab('schedule')}
          style={{
            background: 'none',
            border: 'none',
            borderBottom: activeTab === 'schedule' ? '3px solid var(--accent)' : '3px solid transparent',
            color: activeTab === 'schedule' ? 'var(--text-primary)' : 'var(--text-secondary)',
            padding: '0.5rem 1.25rem',
            fontSize: '1rem',
            fontWeight: 700,
            cursor: 'pointer',
            transition: 'var(--transition)'
          }}
        >
          Horarios de Atención
        </button>
      </div>

      {activeTab === 'products' && (
        loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '5rem 0' }}>
            <div style={{
              width: '40px',
              height: '40px',
              border: '3px solid rgba(0,0,0,0.1)',
              borderTopColor: 'var(--accent)',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite'
            }}></div>
          </div>
        ) : (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 800 }}>Listado de Productos</h3>
              <button onClick={handleOpenCreateModal} className="btn btn-primary" style={{ padding: '0.6rem 1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
                </svg>
                Agregar Bebida
              </button>
            </div>

            {products.length === 0 ? (
              <div className="glass-panel" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                No hay productos registrados. Carga uno nuevo usando el botón de arriba.
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
                {products.map(product => (
                  <div key={product.id} className="glass-panel animate-scale-up" style={{
                    padding: '1.25rem',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '1rem',
                    position: 'relative',
                    border: '1px solid var(--glass-border)'
                  }}>
                    <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                      <img
                        src={product.imageUrl}
                        alt={product.name}
                        style={{
                          width: '70px',
                          height: '70px',
                          objectFit: 'cover',
                          borderRadius: '12px',
                          border: '1px solid var(--glass-border)'
                        }}
                      />
                      <div>
                        <span style={{
                          fontSize: '0.75rem',
                          fontWeight: 700,
                          color: 'var(--accent-gold)',
                          textTransform: 'uppercase',
                          letterSpacing: '0.5px'
                        }}>
                          {product.category}
                        </span>
                        <h4 style={{ fontSize: '1.05rem', fontWeight: 800, margin: '2px 0 4px', color: 'var(--text-primary)' }}>
                          {product.name}
                        </h4>
                        <span style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                          ${product.price.toLocaleString('es-AR')}
                        </span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginTop: '0.25rem' }}>
                          <span style={{
                            display: 'inline-block',
                            width: '8px',
                            height: '8px',
                            borderRadius: '50%',
                            background: product.isAvailable !== false ? '#2E7D32' : '#C62828'
                          }}></span>
                          <span style={{
                            fontSize: '0.75rem',
                            fontWeight: 600,
                            color: product.isAvailable !== false ? '#2E7D32' : '#C62828'
                          }}>
                            {product.isAvailable !== false ? 'Disponible' : 'No disponible'}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div style={{
                      display: 'flex',
                      justifyContent: 'flex-end',
                      alignItems: 'center',
                      borderTop: '1px solid var(--glass-border)',
                      paddingTop: '0.75rem',
                      marginTop: 'auto'
                    }}>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button
                          onClick={() => handleOpenEditModal(product)}
                          className="btn"
                          style={{
                            padding: '0.4rem 0.8rem',
                            fontSize: '0.8rem',
                            borderRadius: '8px',
                            border: '1px solid var(--glass-border)',
                            background: '#ffffff',
                            fontWeight: 600,
                            cursor: 'pointer',
                            color: 'var(--text-primary)'
                          }}
                        >
                          Editar
                        </button>
                        <button
                          onClick={() => handleDeleteProduct(product.id)}
                          className="btn"
                          style={{
                            padding: '0.4rem 0.8rem',
                            fontSize: '0.8rem',
                            borderRadius: '8px',
                            border: '1px solid #FFCDD2',
                            background: '#FFEBEE',
                            color: '#C62828',
                            fontWeight: 600,
                            cursor: 'pointer'
                          }}
                        >
                          Eliminar
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
            )}
          </div>
        )
      )}

      {activeTab === 'schedule' && (
        <div>
          {/* Schedule Configuration List */}
          <div className="glass-panel" style={{ padding: '2rem', border: '1px solid var(--glass-border)' }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
              </svg>
              Horarios Semanales Programados
            </h3>
            
            {configLoading ? (
              <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem 0' }}>
                <div style={{ width: '30px', height: '30px', border: '3px solid rgba(0,0,0,0.1)', borderTopColor: 'var(--accent)', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
              </div>
            ) : scheduleConfig ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                {scheduleConfig.schedule.map((day, idx) => (
                  <div key={day.dayIndex} style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    paddingBottom: '1.25rem',
                    borderBottom: idx !== 6 ? '1px solid var(--glass-border)' : 'none',
                    flexWrap: 'wrap',
                    gap: '1.25rem'
                  }}>
                    <div style={{ minWidth: '120px' }}>
                      <span style={{ fontWeight: 800, fontSize: '1rem', color: 'var(--text-primary)' }}>{day.dayName}</span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <input
                        type="checkbox"
                        id={`day-${day.dayIndex}-active`}
                        checked={day.isOpen}
                        onChange={(e) => handleDayChange(day.dayIndex, 'isOpen', e.target.checked)}
                        style={{ width: '18px', height: '18px', cursor: 'pointer', accentColor: 'var(--accent)' }}
                      />
                      <label htmlFor={`day-${day.dayIndex}-active`} style={{ fontSize: '0.9rem', fontWeight: 600, cursor: 'pointer', userSelect: 'none' }}>
                        {day.isOpen ? 'Atiende' : 'Cerrado'}
                      </label>
                    </div>

                    {day.isOpen && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <div>
                          <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.25rem' }}>Desde</span>
                          <input
                            type="text"
                            placeholder="20:00"
                            value={day.openTime}
                            onChange={(e) => handleDayChange(day.dayIndex, 'openTime', e.target.value)}
                            className="form-input"
                            style={{ width: '90px', padding: '0.4rem 0.6rem', textAlign: 'center', fontSize: '0.9rem' }}
                          />
                        </div>
                        <span style={{ marginTop: '1.25rem', fontWeight: 'bold', color: 'var(--text-secondary)' }}>a</span>
                        <div>
                          <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.25rem' }}>Hasta</span>
                          <input
                            type="text"
                            placeholder="02:00"
                            value={day.closeTime}
                            onChange={(e) => handleDayChange(day.dayIndex, 'closeTime', e.target.value)}
                            className="form-input"
                            style={{ width: '90px', padding: '0.4rem 0.6rem', textAlign: 'center', fontSize: '0.9rem' }}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                ))}

                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1.5rem', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
                  {configSuccess && <span style={{ color: '#2E7D32', fontSize: '0.9rem', fontWeight: 700 }}>✓ {configSuccess}</span>}
                  {configError && <span style={{ color: '#C62828', fontSize: '0.9rem', fontWeight: 700 }}>✗ {configError}</span>}
                  <button
                    type="button"
                    onClick={handleSaveConfig}
                    className="btn btn-primary"
                    style={{ padding: '0.75rem 2rem', borderRadius: '12px', fontWeight: 700 }}
                  >
                    Guardar Horarios
                  </button>
                </div>
              </div>
            ) : (
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>No se pudo cargar la configuración de los horarios.</p>
            )}
          </div>
        </div>
      )}

      {/* Modal - Create / Edit Product */}
      {isModalOpen && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          background: 'rgba(0, 0, 0, 0.4)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000,
          animation: 'fadeIn 0.25s'
        }}>
          <div className="glass-panel animate-scale-up" style={{
            background: '#ffffff',
            padding: '2rem',
            borderRadius: '24px',
            width: '90%',
            maxWidth: '500px',
            boxShadow: '0 20px 40px rgba(0,0,0,0.15)',
            border: '1px solid var(--glass-border)'
          }}>
            <h3 style={{ fontSize: '1.5rem', fontWeight: 900, fontFamily: 'var(--font-serif)', marginBottom: '1.5rem' }}>
              {editingProduct ? 'Editar Bebida' : 'Agregar Nueva Bebida'}
            </h3>

            <form onSubmit={handleSubmitProduct} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: '0.35rem', color: 'var(--text-primary)' }}>Nombre del Producto</label>
                <input
                  type="text"
                  name="name"
                  required
                  autoComplete="off"
                  autoCorrect="off"
                  autoCapitalize="none"
                  spellCheck={false}
                  autocorrect="off"
                  autocapitalize="none"
                  spellcheck="false"
                  data-gramm="false"
                  data-enable-grammarly="false"
                  placeholder="ej. Fernet Branca 750ml"
                  value={formData.name}
                  onChange={handleInputChange}
                  className="form-input"
                  style={{ width: '100%' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: '0.35rem', color: 'var(--text-primary)' }}>Precio ($)</label>
                  <input
                    type="number"
                    name="price"
                    required
                    placeholder="ej. 8500"
                    value={formData.price}
                    onChange={handleInputChange}
                    className="form-input"
                    style={{ width: '100%' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: '0.35rem', color: 'var(--text-primary)' }}>Categoría</label>
                  <select
                    name="category"
                    value={formData.category}
                    onChange={handleInputChange}
                    className="form-input"
                    style={{ width: '100%', cursor: 'pointer' }}
                  >
                    {categories.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: '0.35rem', color: 'var(--text-primary)' }}>Foto del Producto</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="form-input"
                  style={{ width: '100%', padding: '0.5rem', cursor: 'pointer' }}
                  required={!formData.imageUrl}
                />
                {formData.imageUrl && (
                  <div style={{ marginTop: '0.75rem', textAlign: 'center' }}>
                    <p style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>Vista previa:</p>
                    <img
                      src={formData.imageUrl}
                      alt="Vista previa"
                      style={{
                        maxWidth: '100%',
                        maxHeight: '140px',
                        borderRadius: '12px',
                        objectFit: 'contain',
                        border: '1px solid var(--glass-border)',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.08)'
                      }}
                    />
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.25rem' }}>
                <input
                  type="checkbox"
                  id="isAvailable"
                  name="isAvailable"
                  checked={formData.isAvailable}
                  onChange={(e) => setFormData(prev => ({ ...prev, isAvailable: e.target.checked }))}
                  style={{
                    width: '18px',
                    height: '18px',
                    cursor: 'pointer',
                    accentColor: 'var(--accent)'
                  }}
                />
                <label 
                  htmlFor="isAvailable" 
                  style={{ 
                    fontSize: '0.9rem', 
                    fontWeight: 700, 
                    color: 'var(--text-primary)',
                    cursor: 'pointer',
                    userSelect: 'none'
                  }}
                >
                  Producto Disponible (se muestra en el catálogo)
                </label>
              </div>

              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', marginTop: '1rem' }}>
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="btn"
                  style={{
                    padding: '0.6rem 1.25rem',
                    borderRadius: '12px',
                    border: '1px solid var(--glass-border)',
                    background: '#ffffff',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{
                    padding: '0.6rem 1.5rem',
                    borderRadius: '12px',
                    fontWeight: 700
                  }}
                >
                  {editingProduct ? 'Guardar Cambios' : 'Crear Producto'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
