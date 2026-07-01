import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { CartProvider } from './context/ContextoCarrito';
import BarraNavegacion from './components/BarraNavegacion';
import PiePagina from './components/PiePagina';
import Catalogo from './pages/Catalogo';
import Carrito from './pages/Carrito';
import FinalizarPedido from './pages/FinalizarPedido';
import PedidoExitoso from './pages/PedidoExitoso';
import Admin from './pages/Admin';

export default function Aplicacion() {
  return (
    <CartProvider>
      <BrowserRouter>
        <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
          <BarraNavegacion />
          <main style={{ flexGrow: 1 }}>
            <Routes>
              <Route path="/" element={<Catalogo />} />
              <Route path="/cart" element={<Carrito />} />
              <Route path="/checkout" element={<FinalizarPedido />} />
              <Route path="/order-success/:id" element={<PedidoExitoso />} />
              <Route path="/admin" element={<Admin />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>
          <PiePagina />
        </div>
      </BrowserRouter>
    </CartProvider>
  );
}
