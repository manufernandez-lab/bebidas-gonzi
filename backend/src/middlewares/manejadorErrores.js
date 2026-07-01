export const manejadorErrores = (err, req, res, next) => {
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Error interno del servidor';
  let errors = err.errors || undefined;

  // Formatear errores de validación de Zod
  if (err.name === 'ZodError') {
    statusCode = 400;
    message = 'Error de validación en la petición';
    errors = err.errors.map(e => ({
      path: e.path.join('.'),
      message: e.message
    }));
  }

  if (statusCode === 500) {
    console.error('💥 ERROR INESPERADO:', err);
  }

  res.status(statusCode).json({
    status: statusCode === 500 ? 'error' : 'fail',
    message,
    ...(errors && { errors })
  });
};
