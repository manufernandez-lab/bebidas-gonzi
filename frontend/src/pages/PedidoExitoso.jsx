import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../services/clienteApi';

export default function PedidoExitoso() {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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

  return (
    <div className="container animate-slide-up" style={{ marginTop: '3rem', minHeight: '80vh', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <div className="glass-panel" style={{ padding: '2.5rem', maxWidth: '650px', width: '100%', textAlign: 'center', borderRadius: '20px' }}>
        <span style={{ fontSize: '4rem' }}>🎉</span>
        <h1 style={{ fontSize: '2rem', fontWeight: 800, marginTop: '1rem', marginBottom: '0.5rem', color: 'var(--text-primary)' }}>
          ¡Pedido Confirmado!
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', maxWidth: '450px', margin: '0 auto 2rem auto' }}>
          El pedido ha sido registrado exitosamente y se ha abierto WhatsApp para coordinar el envío con el repartidor.
        </p>

        <div style={{
          background: 'rgba(255, 255, 255, 0.65)',
          border: '1px solid var(--glass-border)',
          borderRadius: '14px',
          padding: '1.25rem',
          margin: '2rem 0',
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
          margin: '0 0 2.5rem 0',
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

        <Link to="/" className="btn btn-primary" style={{ padding: '0.75rem 2rem' }}>
          Volver al Catálogo
        </Link>
      </div>
    </div>
  );
}
