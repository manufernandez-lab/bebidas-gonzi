import React, { createContext, useState, useEffect, useContext } from 'react';

const CartContext = createContext();

export const CartProvider = ({ children }) => {
  const [cartItems, setCartItems] = useState(() => {
    const localData = localStorage.getItem('delivery_cart');
    return localData ? JSON.parse(localData) : [];
  });

  useEffect(() => {
    localStorage.setItem('delivery_cart', JSON.stringify(cartItems));
  }, [cartItems]);

  const addToCart = (product, quantity = 1, flavor = null) => {
    setCartItems(prevItems => {
      const existingItem = prevItems.find(item => 
        item.product.id === product.id && item.flavor === flavor
      );
      if (existingItem) {
        const newQty = existingItem.quantity + quantity;
        return prevItems.map(item =>
          (item.product.id === product.id && item.flavor === flavor) ? { ...item, quantity: newQty } : item
        );
      }
      return [...prevItems, { product, quantity, flavor }];
    });
  };

  const removeFromCart = (productId, flavor = null) => {
    setCartItems(prevItems => prevItems.filter(item => 
      !(item.product.id === productId && item.flavor === flavor)
    ));
  };

  const updateQuantity = (productId, quantity, flavor = null) => {
    if (quantity <= 0) {
      removeFromCart(productId, flavor);
      return;
    }
    setCartItems(prevItems =>
      prevItems.map(item =>
        (item.product.id === productId && item.flavor === flavor) ? { ...item, quantity } : item
      )
    );
  };

  const clearCart = () => {
    setCartItems([]);
  };

  const cartCount = cartItems.reduce((total, item) => total + item.quantity, 0);
  const cartTotal = cartItems.reduce((total, item) => total + item.product.price * item.quantity, 0);

  return (
    <CartContext.Provider value={{
      cartItems,
      addToCart,
      removeFromCart,
      updateQuantity,
      clearCart,
      cartCount,
      cartTotal
    }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => useContext(CartContext);
