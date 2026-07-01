import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../services/clienteApi';

export default function PedidoExitoso() {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [autoRedirected, setAutoRedirected] = useState(false);

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        setLoading(true);
        const response = await api.get(`/orders/${id}`);
        setOrder(response.data.data.order);
      } catch (err) {
        console.error(err);
        setError('No se pudo encontrar la información del pedido.');
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchOrder();
    }
  }, [id]);

  const getWhatsappUrl = (orderData) => {
    if (!orderData) return '';
    const PHONE_NUMBER = '5492984596403';
    const paymentMethodNames = {
      cash: 'Efectivo al recibir',
      transfer: 'Transferencia bancaria previa'
    };

    let message = `🍻 *PEDIDO DE BEBIDAS - BEBIDAS GONZI* 🍻\n`;
    message += `==========================================\n`;
    message += `👤 *Cliente:* ${orderData.customerName}\n`;
    message += `📍 *Dirección:* ${orderData.deliveryAddress}\n`;
    message += `💳 *Pago:* ${paymentMethodNames[orderData.paymentMethod] || orderData.paymentMethod}\n`;
    if (orderData.paymentMethod === 'transfer') {
      message += `🔑 *Alias:* BebidasGonzi\n`;
    }
    message += `\n`;

    message += `🛒 *Detalle del Pedido:*\n`;
    orderData.items.forEach(item => {
      message += `• ${item.quantity}x ${item.name} ($${item.price.toLocaleString('es-AR')} c/u) - Subtotal: $${item.subtotal.toLocaleString('es-AR')}\n`;
    });

    message += `\n💰 *Total a pagar:* $${orderData.totalAmount.toLocaleString('es-AR')}\n`;

    if (orderData.lat && orderData.lng) {
      message += `\n📍 *Ubicación en tiempo real:* https://maps.google.com/?q=${orderData.lat},${orderData.lng}\n`;
    } else {
      message += `\n📍 *Mapa de dirección:* https://maps.google.com/?q=${encodeURIComponent(orderData.deliveryAddress)}\n`;
    }

    message += `==========================================\n`;
    message += `¡Favor de preparar el pedido helado! ❄️`;

    const encodedMessage = encodeURIComponent(message);
    return `https://wa.me/${PHONE_NUMBER}?text=${encodedMessage}`;
  };

  useEffect(() => {
    if (order && !autoRedirected) {
      const orderAgeMs = new Date() - new Date(order.createdAt);
      // Auto redirect if the order was created in the last 3 minutes
      if (orderAgeMs < 180000) {
        setAutoRedirected(true);
        window.location.href = getWhatsappUrl(order);
      }
    }
  }, [order, autoRedirected]);

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '10rem 0' }}>
        <div style={{
          width: '45px',
          height: '45px',
          border: '4px solid rgba(198, 40, 40, 0.1)',
          borderTop: '4px solid var(--accent)',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite'
        }}></div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="container animate-slide-up" style={{ marginTop: '4rem', textAlign: 'center' }}>
        <div className="glass-panel" style={{ padding: '3rem', maxWidth: '600px', margin: '0 auto' }}>
          <span style={{ fontSize: '3rem', color: 'var(--danger)' }}>⚠️</span>
          <h2 style={{ marginTop: '1rem', color: 'var(--text-primary)' }}>Error al buscar el pedido</h2>
          <p style={{ color: 'var(--text-secondary)', margin: '1rem 0 2rem 0' }}>{error || 'No pudimos recuperar tu pedido.'}</p>
          <Link to="/" className="btn btn-primary">Volver al Catálogo</Link>
        </div>
      </div>
    );
  }

  const paymentMethods = {
    cash: 'Efectivo al recibir',
    card: 'Tarjeta (Posnet móvil)',
    transfer: 'Transferencia bancaria'
  };

  const whatsappUrl = getWhatsappUrl(order);

  return (
    <div className="container animate-slide-up" style={{ marginTop: '3rem', minHeight: '80vh', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <div className="glass-panel" style={{ padding: '2.5rem', maxWidth: '650px', width: '100%', textAlign: 'center', borderRadius: '20px' }}>
        <span style={{ fontSize: '4rem' }}>🎉</span>
        <h1 style={{ fontSize: '2rem', fontWeight: 800, marginTop: '1rem', marginBottom: '0.5rem', color: 'var(--text-primary)' }}>
          ¡Pedido Confirmado!
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', maxWidth: '450px', margin: '0 auto 1.5rem auto' }}>
          El pedido ha sido registrado en nuestro sistema. Si la redirección a WhatsApp no se abrió automáticamente, por favor haz clic en el botón verde de abajo para enviarle los detalles al repartidor.
        </p>

        <a 
          href={whatsappUrl} 
          className="btn btn-whatsapp btn-whatsapp-pulse" 
          style={{ 
            width: '100%', 
            padding: '0.9rem 2rem', 
            fontSize: '1.05rem', 
            marginBottom: '1.5rem',
            borderRadius: '9999px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.5rem',
            textDecoration: 'none',
            fontWeight: 'bold'
          }}
        >
          <svg 
            width="20" 
            height="20" 
            viewBox="0 0 24 24" 
            fill="currentColor"
            style={{ marginRight: '0.25rem' }}
          >
            <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.514 2.266 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.502-5.724-1.455L0 24zm6.035-4.321c1.558.924 3.011 1.411 4.585 1.412 5.513 0 9.993-4.48 9.997-9.996.002-2.673-1.04-5.186-2.936-7.085C15.84 2.112 13.33 1.07 10.66 1.07 5.148 1.07.669 5.55.665 11.067c-.001 1.636.43 3.23 1.25 4.636l-.974 3.556 3.655-.959c1.378.825 2.8.12 1.496.12zM17.56 14.86c-.277-.139-1.643-.81-1.9-.904-.258-.093-.446-.139-.633.14-.188.28-.724.904-.889 1.092-.164.186-.33.21-.608.07-.28-.14-1.18-.435-2.247-1.387-.83-.74-1.39-1.653-1.553-1.932-.164-.28-.018-.43.12-.569.125-.127.278-.327.417-.49.139-.164.186-.28.278-.466.091-.186.046-.35-.022-.49-.069-.14-.633-1.528-.868-2.09-.23-.55-.48-.475-.66-.484-.17-.008-.367-.01-.563-.01-.197 0-.518.074-.789.37-.27.295-1.03.107-1.03 2.612s1.828 4.93 2.083 5.275c.254.345 3.597 5.493 8.713 7.703 1.218.525 2.17.84 2.91 1.074 1.223.388 2.336.333 3.216.2.98-.148 3.023-1.237 3.447-2.433.424-1.196.424-2.22.296-2.433-.127-.214-.446-.35-.723-.49z"/>
          </svg>
          Enviar Pedido por WhatsApp
        </a>

        <div style={{
          background: 'rgba(255, 255, 255, 0.65)',
          border: '1px solid var(--glass-border)',
          borderRadius: '14px',
          padding: '1.25rem',
          margin: '1.5rem 0',
          textAlign: 'left'
        }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '0.75rem', borderBottom: '1px solid var(--glass-border)', paddingBottom: '0.5rem', color: 'var(--accent)' }}>
            Información de Entrega
          </h3>
          <p style={{ fontSize: '0.9rem', marginBottom: '0.4rem', color: 'var(--text-secondary)' }}>
            <strong>Pedido ID:</strong> <span style={{ fontFamily: 'monospace', color: 'var(--text-primary)' }}>{order.id}</span>
          </p>
          <p style={{ fontSize: '0.9rem', marginBottom: '0.4rem', color: 'var(--text-secondary)' }}>
            <strong>Cliente:</strong> <span style={{ color: 'var(--text-primary)' }}>{order.customerName}</span>
          </p>
          <p style={{ fontSize: '0.9rem', marginBottom: '0.4rem', color: 'var(--text-secondary)' }}>
            <strong>Dirección:</strong> <span style={{ color: 'var(--text-primary)' }}>{order.deliveryAddress}</span>
          </p>
          <p style={{ fontSize: '0.9rem', marginBottom: '0.4rem', color: 'var(--text-secondary)' }}>
            <strong>Método de pago:</strong> <span style={{ color: 'var(--text-primary)' }}>{paymentMethods[order.paymentMethod]}</span>
          </p>
          {order.paymentMethod === 'transfer' && (
            <p style={{ fontSize: '0.9rem', marginBottom: '0.4rem', color: 'var(--text-secondary)' }}>
              <strong>Alias para Transferencia:</strong> <span style={{ color: 'var(--accent)', fontWeight: 700 }}>BebidasGonzi</span>
            </p>
          )}
          <p style={{ fontSize: '0.9rem', marginBottom: '0.4rem', color: 'var(--text-secondary)' }}>
            <strong>Fecha:</strong> <span style={{ color: 'var(--text-primary)' }}>{new Date(order.createdAt).toLocaleString('es-AR')}</span>
          </p>
          {order.lat && order.lng && (
            <p style={{ fontSize: '0.9rem', color: 'var(--success)', marginTop: '0.5rem', fontWeight: 500 }}>
              📍 Coordenadas de GPS enviadas para entrega exacta.
            </p>
          )}
        </div>

        <div style={{
          background: 'rgba(255, 255, 255, 0.65)',
          border: '1px solid var(--glass-border)',
          borderRadius: '14px',
          padding: '1.25rem',
          margin: '0 0 2rem 0',
          textAlign: 'left'
        }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '0.75rem', borderBottom: '1px solid var(--glass-border)', paddingBottom: '0.5rem', color: 'var(--text-primary)' }}>
            Resumen de Productos
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {order.items.map((item, idx) => (
              <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
                <span style={{ color: 'var(--text-secondary)' }}>
                  {item.quantity}x {item.name}
                </span>
                <span style={{ fontWeight: 600 }}>
                  ${item.subtotal.toLocaleString('es-AR')}
                </span>
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid var(--glass-border)', paddingTop: '0.75rem', marginTop: '0.75rem', fontWeight: 'bold' }}>
            <span style={{ color: 'var(--text-secondary)' }}>Monto Total</span>
            <span style={{ color: 'var(--accent)', fontSize: '1.2rem', fontWeight: 800 }}>${order.totalAmount.toLocaleString('es-AR')}</span>
          </div>
        </div>

        <Link to="/" className="btn btn-secondary" style={{ padding: '0.75rem 2rem', width: '100%' }}>
          Volver al Catálogo
        </Link>
      </div>
    </div>
  );
}
