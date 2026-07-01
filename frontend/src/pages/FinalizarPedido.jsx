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

  const { register, handleSubmit, setValue, formState: { errors } } = useForm({
    defaultValues: {
      customerName: '',
      deliveryAddress: '',
      paymentMethod: 'cash'
    }
  });

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

    setLocationStatus('Obteniendo coordenadas...');

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setCoords({ lat: latitude, lng: longitude });
        setValue('lat', latitude);
        setValue('lng', longitude);
        setLocationStatus('📍 Ubicación GPS obtenida con éxito.');
      },
      (error) => {
        console.error(error);
        setLocationStatus('No se pudo acceder a tu ubicación. Por favor, escribe tu dirección detallada.');
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  const onSubmit = async (data) => {
    try {
      setLoading(true);

      const payload = {
        customerName: data.customerName,
        deliveryAddress: data.deliveryAddress,
        paymentMethod: data.paymentMethod,
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

      const PHONE_NUMBER = '5492984596403';
      const paymentMethodNames = {
        cash: 'Efectivo al recibir',
        transfer: 'Transferencia bancaria previa'
      };

      let message = `🍻 *PEDIDO DE BEBIDAS - BEBIDAS GONZI* 🍻\n`;
      message += `==========================================\n`;
      message += `👤 *Cliente:* ${createdOrder.customerName}\n`;
      message += `📍 *Dirección:* ${createdOrder.deliveryAddress}\n`;
      message += `💳 *Pago:* ${paymentMethodNames[createdOrder.paymentMethod]}\n`;
      if (createdOrder.paymentMethod === 'transfer') {
        message += `🔑 *Alias:* BebidasGonzi\n`;
      }
      message += `\n`;

      message += `🛒 *Detalle del Pedido:*\n`;
      createdOrder.items.forEach(item => {
        message += `• ${item.quantity}x ${item.name} ($${item.price.toLocaleString('es-AR')} c/u) - Subtotal: $${item.subtotal.toLocaleString('es-AR')}\n`;
      });

      message += `\n💰 *Total a pagar:* $${createdOrder.totalAmount.toLocaleString('es-AR')}\n`;

      if (createdOrder.lat && createdOrder.lng) {
        message += `\n📍 *Ubicación en tiempo real:* https://maps.google.com/?q=${createdOrder.lat},${createdOrder.lng}\n`;
      } else {
        message += `\n📍 *Mapa de dirección:* https://maps.google.com/?q=${encodeURIComponent(createdOrder.deliveryAddress)}\n`;
      }

      message += `==========================================\n`;
      message += `¡Favor de preparar el pedido helado! ❄️`;

      const encodedMessage = encodeURIComponent(message);
      const whatsappUrl = `https://wa.me/${PHONE_NUMBER}?text=${encodedMessage}`;

      clearCart();

      window.open(whatsappUrl, '_blank');

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

            <div className="form-group" style={{ marginBottom: '2rem' }}>
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
