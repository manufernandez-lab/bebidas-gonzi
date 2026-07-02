import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/ContextoCarrito.jsx';
import api from '../services/clienteApi';

export default function FinalizarPedido() {
  const { cartItems, cartTotal, clearCart } = useCart();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [locationStatus, setLocationStatus] = useState('');
  const [coords, setCoords] = useState({ lat: null, lng: null });
  const [hasItemsOnMount] = useState(cartItems.length > 0);

  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm({
    defaultValues: {
      customerName: '',
      deliveryAddress: '',
      paymentMethod: 'cash',
      notes: ''
    }
  });
  const paymentMethod = watch('paymentMethod');

  useEffect(() => {
    if (!hasItemsOnMount) {
      navigate('/', { replace: true });
    }
  }, [hasItemsOnMount, navigate]);

  if (!hasItemsOnMount) {
    return null;
  }

  const handleGetLocation = () => {
    if (!navigator.geolocation) {
      setLocationStatus('La geolocalización no está soportada por tu navegador');
      return;
    }

    setLocationStatus('Obteniendo coordenadas (GPS)...');

    const success = (position) => {
      const { latitude, longitude } = position.coords;
      setCoords({ lat: latitude, lng: longitude });
      setValue('lat', latitude);
      setValue('lng', longitude);
      setLocationStatus('📍 Coordenadas obtenidas. Buscando dirección...');

      fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latitude}&lon=${longitude}`, {
        headers: {
          'Accept-Language': 'es'
        }
      })
        .then(res => res.json())
        .then(data => {
          if (data && data.address) {
            const addressInfo = data.address;
            const street = addressInfo.road || addressInfo.pedestrian || addressInfo.suburb || '';
            const number = addressInfo.house_number || '';
            const city = addressInfo.city || addressInfo.town || addressInfo.village || '';
            
            let formattedAddress = '';
            if (street) {
              formattedAddress = street;
              if (number) formattedAddress += ` ${number}`;
              if (city) formattedAddress += `, ${city}`;
            } else {
              formattedAddress = data.display_name;
            }
            
            setValue('deliveryAddress', formattedAddress, { shouldValidate: true });
            setLocationStatus('📍 Ubicación y dirección obtenidas con éxito.');
          } else {
            setLocationStatus('📍 Ubicación obtenida. Por favor, escribe tu dirección manualmente.');
          }
        })
        .catch(err => {
          console.error(err);
          setLocationStatus('📍 Ubicación obtenida. Por favor, escribe tu dirección manualmente.');
        });
    };

    const error = (err) => {
      console.warn(`ERROR GPS (${err.code}): ${err.message}. Intentando aproximado...`);
      setLocationStatus('Buscando ubicación aproximada...');
      
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setCoords({ lat: latitude, lng: longitude });
          setValue('lat', latitude);
          setValue('lng', longitude);
          
          fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latitude}&lon=${longitude}`, {
            headers: {
              'Accept-Language': 'es'
            }
          })
            .then(res => res.json())
            .then(data => {
              if (data && data.address) {
                const addressInfo = data.address;
                const street = addressInfo.road || addressInfo.pedestrian || addressInfo.suburb || '';
                const number = addressInfo.house_number || '';
                const city = addressInfo.city || addressInfo.town || addressInfo.village || '';
                
                let formattedAddress = '';
                if (street) {
                  formattedAddress = street;
                  if (number) formattedAddress += ` ${number}`;
                  if (city) formattedAddress += `, ${city}`;
                } else {
                  formattedAddress = data.display_name;
                }
                
                setValue('deliveryAddress', formattedAddress, { shouldValidate: true });
                setLocationStatus('📍 Ubicación aproximada y dirección obtenidas.');
              } else {
                setLocationStatus('📍 Ubicación aproximada obtenida.');
              }
            })
            .catch(err => {
              console.error(err);
              setLocationStatus('📍 Ubicación aproximada obtenida.');
            });
        },
        (fallbackErr) => {
          console.error('Fallback geolocation error:', fallbackErr);
          setLocationStatus('No se pudo acceder a tu ubicación. Por favor, escribe tu dirección detallada.');
        },
        { enableHighAccuracy: false, timeout: 8000 }
      );
    };

    navigator.geolocation.getCurrentPosition(success, error, { enableHighAccuracy: true, timeout: 10000 });
  };

  const onSubmit = async (data) => {
    try {
      setLoading(true);

      const payload = {
        customerName: data.customerName,
        deliveryAddress: data.deliveryAddress,
        paymentMethod: data.paymentMethod,
        notes: data.notes || undefined,
        lat: coords.lat ? Number(coords.lat) : undefined,
        lng: coords.lng ? Number(coords.lng) : undefined,
        items: cartItems.map(item => ({
          productId: item.product.id,
          quantity: item.quantity,
          flavor: item.flavor || undefined
        }))
      };

      const response = await api.post('/orders', payload);
      const createdOrder = response.data.data.order;

      clearCart();
      navigate(`/order-success/${createdOrder.id}`);
    } catch (err) {
      console.error(err);
      const backendError = err.response?.data?.message || 'Hubo un error al procesar tu pedido. Verifica la disponibilidad.';
      alert(backendError);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container animate-slide-up" style={{ marginTop: '2rem', minHeight: '80vh' }}>
      <h1 style={{ fontSize: '2rem', fontWeight: 800, marginBottom: '2rem' }}>Finalizar Pedido</h1>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '2rem' }} className="checkout-layout">
        <style>{`
          @media (min-width: 900px) {
            .checkout-layout {
              grid-template-columns: 1.5fr 1fr !important;
            }
          }
        `}</style>

        <div className="glass-panel" style={{ padding: '2rem' }}>
          <h2 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '1.5rem', color: 'var(--text-primary)' }}>
            Completa tus Datos
          </h2>

          <form onSubmit={handleSubmit(onSubmit)}>
            <div className="form-group">
              <label className="form-label">Nombre Completo</label>
              <input
                type="text"
                className={`form-input ${errors.customerName ? 'error' : ''}`}
                placeholder="Ej. Juan Pérez"
                {...register('customerName', {
                  required: 'El nombre es obligatorio',
                  minLength: { value: 2, message: 'El nombre debe tener al menos 2 caracteres' }
                })}
              />
              {errors.customerName && <span className="form-error">{errors.customerName.message}</span>}
            </div>


            <div className="form-group">
              <label className="form-label">Dirección de Entrega</label>
              <input
                type="text"
                className={`form-input ${errors.deliveryAddress ? 'error' : ''}`}
                placeholder="Calle y altura (ej. Av. Corrientes 1500, Piso 3 A)"
                {...register('deliveryAddress', {
                  required: 'La dirección es obligatoria para la entrega',
                  minLength: { value: 5, message: 'La dirección debe ser más descriptiva' }
                })}
              />
              {errors.deliveryAddress && <span className="form-error">{errors.deliveryAddress.message}</span>}
            </div>

            <div className="form-group" style={{ marginBottom: '1.5rem' }}>
              <button
                type="button"
                onClick={handleGetLocation}
                className="btn btn-secondary"
                style={{ width: '100%', fontSize: '0.85rem', padding: '0.65rem 1rem', borderRadius: '8px', gap: '0.4rem' }}
              >
                <span>📍</span> Usar mi ubicación GPS actual
              </button>
              {locationStatus && (
                <p style={{
                  fontSize: '0.8rem',
                  color: locationStatus.includes('éxito') ? 'var(--success)' : 'var(--text-secondary)',
                  marginTop: '0.4rem',
                  fontWeight: 500
                }}>
                  {locationStatus}
                </p>
              )}
            </div>

            <div className="form-group" style={{ marginBottom: '1.5rem' }}>
              <label className="form-label">Método de Pago</label>
              <select
                className="form-input"
                {...register('paymentMethod', { required: true })}
                style={{ background: '#ffffff', color: 'var(--text-primary)' }}
              >
                <option value="cash" style={{ background: '#ffffff', color: 'var(--text-primary)' }}>Efectivo al recibir</option>
                <option value="transfer" style={{ background: '#ffffff', color: 'var(--text-primary)' }}>Transferencia bancaria</option>
              </select>
            </div>

            {paymentMethod === 'transfer' && (
              <div style={{
                background: 'rgba(197, 160, 89, 0.08)',
                border: '1px solid rgba(197, 160, 89, 0.25)',
                borderRadius: '12px',
                padding: '1.25rem',
                marginBottom: '1.5rem',
                fontSize: '0.9rem',
                textAlign: 'left'
              }}>
                <div style={{ fontWeight: 700, color: 'var(--accent)', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                  <span>🔑</span> Datos de Transferencia:
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', marginBottom: '0.5rem' }}>
                  <div><strong>Mercado Pago (Alias):</strong> <span style={{ fontFamily: 'monospace', fontWeight: 700 }}>Bebidasgonzi</span></div>
                  <div><strong>Banco (Alias):</strong> <span style={{ fontFamily: 'monospace', fontWeight: 700 }}>Boldo.aceite.sepia</span></div>
                </div>
                <div style={{ color: 'var(--danger)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.3rem', borderTop: '1px dashed rgba(197, 160, 89, 0.3)', paddingTop: '0.5rem', marginTop: '0.5rem' }}>
                  <span>⚠️</span> Enviar comprobante para poder recibir el pedido
                </div>
              </div>
            )}

            <div className="form-group" style={{ marginBottom: '2rem' }}>
              <label className="form-label">Notas / Instrucciones adicionales (Opcional)</label>
              <textarea
                className="form-input"
                placeholder="Ej: Timbre roto, llamar al llegar. Para el pack de cervezas: 2 IPA y 1 APA."
                rows="3"
                style={{ resize: 'vertical', minHeight: '80px', height: 'auto', background: '#ffffff', color: 'var(--text-primary)' }}
                {...register('notes')}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary"
              style={{ width: '100%', padding: '0.85rem', fontSize: '1rem', borderRadius: '10px' }}
            >
              {loading ? 'Creando Pedido...' : 'Enviar Pedido y Abrir WhatsApp'}
            </button>
          </form>
        </div>

        <div style={{ height: 'fit-content' }}>
          <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 700, borderBottom: '1px solid var(--glass-border)', paddingBottom: '0.5rem', color: 'var(--text-primary)' }}>
              Detalle
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', maxHeight: '250px', overflowY: 'auto' }}>
              {cartItems.map((item) => (
                <div key={`${item.product.id}-${item.flavor || 'none'}`} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>
                    {item.quantity}x {item.product.name} {item.flavor ? `(${item.flavor})` : ''}
                  </span>
                  <span style={{ fontWeight: 600 }}>
                    ${(item.product.price * item.quantity).toLocaleString('es-AR')}
                  </span>
                </div>
              ))}
            </div>

            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              borderTop: '1px solid var(--glass-border)',
              paddingTop: '1rem',
              marginTop: '0.5rem'
            }}>
              <span style={{ fontWeight: 700 }}>Total</span>
              <span style={{ fontWeight: 800, fontSize: '1.25rem', color: 'var(--accent)' }}>
                ${cartTotal.toLocaleString('es-AR')}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
