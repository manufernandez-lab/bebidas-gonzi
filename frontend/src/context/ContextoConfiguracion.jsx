import React, { createContext, useState, useEffect, useContext } from 'react';
import api from '../services/clienteApi';

const StoreConfigContext = createContext();

export const StoreConfigProvider = ({ children }) => {
  const [config, setConfig] = useState(null);
  const [isOpen, setIsOpen] = useState(true);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchConfig = async () => {
    try {
      const response = await api.get('/config');
      if (response.data && response.data.data && response.data.data.config) {
        setConfig(response.data.data.config);
        setIsOpen(response.data.data.config.isOpen);
      }
      setError(null);
    } catch (err) {
      console.error('Error fetching store config:', err);
      setError('No se pudo cargar la configuración de la tienda');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConfig();
    // Refresh the status every 60 seconds
    const interval = setInterval(fetchConfig, 60000);
    return () => clearInterval(interval);
  }, []);

  const refreshConfig = () => {
    fetchConfig();
  };

  return (
    <StoreConfigContext.Provider value={{
      config,
      isOpen,
      loading,
      error,
      refreshConfig
    }}>
      {children}
    </StoreConfigContext.Provider>
  );
};

export const useStoreConfig = () => useContext(StoreConfigContext);
