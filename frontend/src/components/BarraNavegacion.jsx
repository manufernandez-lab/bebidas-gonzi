import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useCart } from '../context/ContextoCarrito.jsx';
import { useStoreConfig } from '../context/ContextoConfiguracion.jsx';

export default function BarraNavegacion() {
  const { cartCount } = useCart();
  const location = useLocation();
  const { isOpen, config } = useStoreConfig();
  const [showHours, setShowHours] = useState(false);

  // Dynamic badge styling and texts
  const badgeText = isOpen ? 'Abierto' : 'Cerrado';
  const badgeColor = isOpen ? '#2E7D32' : '#C62828';
  const badgeBg = isOpen ? 'rgba(46, 125, 50, 0.08)' : 'rgba(198, 40, 40, 0.08)';
  const badgeBorder = isOpen ? 'rgba(46, 125, 50, 0.2)' : 'rgba(198, 40, 40, 0.2)';

  return (
    <nav className="glass-panel" style={{
      position: 'sticky',
      top: '1rem',
      margin: '1rem auto',
      zIndex: 100,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: '0.75rem',
      padding: '1rem 2rem',
      maxWidth: '1200px',
      width: 'calc(100% - 2rem)',
      borderRadius: '24px',
    }}>
      <Link to="/" style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '0.75rem',
        textDecoration: 'none',
        color: 'var(--text-primary)',
        transition: 'var(--transition)',
        width: '100%',
        borderBottom: '1px solid var(--glass-border)',
        paddingBottom: '0.75rem'
      }}>
        <svg viewBox="0 0 120 120" width="52" height="52" style={{ flexShrink: 0 }}>
          {/* Concentric Circles */}
          <circle cx="60" cy="60" r="56" fill="#FFFDF9" stroke="var(--accent-gold)" strokeWidth="1.5" />
          <circle cx="60" cy="60" r="51" fill="none" stroke="var(--accent-gold)" strokeWidth="0.8" />
          
          {/* Truck Silhouette */}
          <path d="M 40 48 L 78 48 L 76 42 L 62 42 L 59 36 L 46 36 L 40 42 Z" fill="#1F1D1A" />
          {/* Cabin window */}
          <path d="M 48 38 L 57 38 L 59 42 L 48 42 Z" fill="#FFFDF9" />
          {/* Wheels */}
          <circle cx="48" cy="48" r="5" fill="#1F1D1A" stroke="var(--accent-gold)" strokeWidth="1" />
          <circle cx="69" cy="48" r="5" fill="#1F1D1A" stroke="var(--accent-gold)" strokeWidth="1" />
          <circle cx="48" cy="48" r="1.5" fill="#FFFDF9" />
          <circle cx="69" cy="48" r="1.5" fill="#FFFDF9" />
          
          {/* Bottle in the back, tilted */}
          <path d="M 64 42 L 76 29 C 77.5 27.5 79.5 29.5 78 31 L 66 44 Z" fill="#1F1D1A" />
          {/* Gold details on bottle */}
          <path d="M 72 33.5 L 75 30.5" stroke="var(--accent-gold)" strokeWidth="1.5" strokeLinecap="round" />
          
          {/* Sparkles / shine */}
          <path d="M 58 26 L 58 29 M 55 27 L 61 27" stroke="var(--accent-gold)" strokeWidth="0.8" />
          <circle cx="63" cy="25" r="1" fill="var(--accent-gold)" />
          <circle cx="53" cy="24" r="0.8" fill="var(--accent-gold)" />

          {/* Brand Name "GONZI" */}
          <text x="60" y="74" textAnchor="middle" fontFamily="var(--font-serif)" fontWeight="900" fontSize="18" fill="var(--text-primary)" letterSpacing="1">GONZI</text>
          
          {/* Subtitle "DELIVERY DE BEBIDAS" */}
          <text x="60" y="89" textAnchor="middle" fontFamily="var(--font-sans)" fontWeight="800" fontSize="6.5" fill="var(--accent-gold)" letterSpacing="0.4">DELIVERY DE BEBIDAS</text>
          
          {/* Bottom Divider */}
          <line x1="42" y1="97" x2="78" y2="97" stroke="var(--accent-gold)" strokeWidth="0.8" />
        </svg>
        <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.1 }}>
          <span style={{ fontSize: '1.4rem', fontWeight: 900, fontFamily: 'var(--font-serif)', letterSpacing: '0.5px' }}>
            Gonzi
          </span>
          <span style={{ fontSize: '0.65rem', fontWeight: 800, color: 'var(--accent-gold)', letterSpacing: '1px', textTransform: 'uppercase' }}>
            Delivery de Bebidas
          </span>
        </div>
      </Link>

      <div style={{ 
        display: 'flex', 
        gap: '1.5rem', 
        alignItems: 'center',
        justifyContent: 'center',
        width: '100%',
        flexWrap: 'wrap'
      }}>
        {/* Horarios Dropdown */}
        <div style={{ position: 'relative' }}>
          <button 
            onClick={() => setShowHours(!showHours)}
            onMouseEnter={() => setShowHours(true)}
            onMouseLeave={() => setShowHours(false)}
            style={{
              background: badgeBg,
              color: badgeColor,
              border: `1px solid ${badgeBorder}`,
              padding: '0.4rem 0.9rem',
              borderRadius: '9999px',
              fontSize: '0.85rem',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              transition: 'var(--transition)',
              outline: 'none'
            }}
          >
            <span style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              background: badgeColor,
              display: 'inline-block',
              boxShadow: `0 0 8px ${badgeColor}`
            }}></span>
            {badgeText}
          </button>
          
          {showHours && config && config.schedule && (
            <div 
              onMouseEnter={() => setShowHours(true)}
              onMouseLeave={() => setShowHours(false)}
              style={{
                position: 'absolute',
                top: '100%',
                right: '50%',
                transform: 'translateX(50%)',
                marginTop: '0.75rem',
                background: '#ffffff',
                border: '1px solid var(--glass-border)',
                borderRadius: '16px',
                padding: '1rem',
                boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
                zIndex: 150,
                width: '260px',
                animation: 'fadeIn 0.2s ease'
              }}
            >
              <h4 style={{ margin: '0 0 0.75rem', fontSize: '0.9rem', fontWeight: 800, fontFamily: 'var(--font-serif)', color: 'var(--text-primary)', borderBottom: '1px solid var(--glass-border)', paddingBottom: '0.5rem', textAlign: 'center' }}>
                Horarios de Atención
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                {config.schedule.map((s) => {
                  const todayIndex = new Date(new Date().toLocaleString('en-US', { timeZone: 'America/Argentina/Buenos_Aires' })).getDay();
                  const isToday = s.dayIndex === todayIndex;
                  return (
                    <div key={s.dayIndex} style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      fontSize: '0.8rem',
                      fontWeight: isToday ? 800 : 500,
                      color: isToday ? 'var(--accent)' : 'var(--text-secondary)'
                    }}>
                      <span>{s.dayName}</span>
                      <span>
                        {s.isOpen ? `${s.openTime} a ${s.closeTime} hs` : 'Cerrado'}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        <Link 
          to="/" 
          style={{
            textDecoration: 'none',
            color: location.pathname === '/' ? 'var(--accent)' : 'var(--text-secondary)',
            fontWeight: 600,
            fontSize: '0.95rem',
            transition: 'var(--transition)'
          }}
        >
          Catálogo
        </Link>

        
        <Link 
          to="/cart" 
          style={{
            textDecoration: 'none',
            position: 'relative',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.5rem 1.25rem',
            background: 'rgba(255, 255, 255, 0.04)',
            borderRadius: '9999px',
            border: '1px solid var(--glass-border)',
            color: 'var(--text-primary)',
            fontSize: '0.95rem',
            fontWeight: 600,
            transition: 'var(--transition)'
          }}
          className="btn-secondary"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="8" cy="21" r="1"/>
            <circle cx="19" cy="21" r="1"/>
            <path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12"/>
          </svg>
          <span>Carrito</span>
          {cartCount > 0 && (
            <span style={{
              background: 'var(--accent)',
              color: '#ffffff',
              fontWeight: 800,
              fontSize: '0.75rem',
              minWidth: '20px',
              height: '20px',
              borderRadius: '10px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '0 6px',
              boxShadow: '0 0 10px rgba(198, 40, 40, 0.4)'
            }}>
              {cartCount}
            </span>
          )}
        </Link>
      </div>
    </nav>
  );
}
