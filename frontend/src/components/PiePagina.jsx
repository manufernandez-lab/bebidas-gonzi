import React from 'react';
import { Link } from 'react-router-dom';

export default function PiePagina() {
  return (
    <footer style={{
      textAlign: 'center',
      padding: '2rem 0',
      color: 'var(--text-secondary)',
      fontSize: '0.85rem',
      borderTop: '1px solid var(--glass-border)',
      marginTop: '5rem',
      background: 'rgba(197, 160, 89, 0.05)'
    }}>
      <div className="container">
        <p>© {new Date().getFullYear()} Gonzi Delivery de Bebidas. Todos los derechos reservados.</p>
        <p style={{ fontSize: '0.75rem', marginTop: '0.25rem', opacity: 0.6 }}>
          Arquitectura Limpia &bull; Carga Instantánea &bull; Envío por WhatsApp
        </p>
        <div style={{ marginTop: '1rem' }}>
          <Link 
            to="/admin" 
            style={{ 
              color: 'var(--text-secondary)', 
              textDecoration: 'none', 
              fontSize: '0.8rem', 
              fontWeight: 600,
              opacity: 0.6,
              transition: 'var(--transition)'
            }}
            onMouseOver={(e) => e.target.style.opacity = 1}
            onMouseOut={(e) => e.target.style.opacity = 0.6}
          >
            Administración del Sitio
          </Link>
        </div>
      </div>
    </footer>
  );
}
