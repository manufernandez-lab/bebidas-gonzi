import { servicioProducto } from '../services/servicioProducto.js';
import { ErrorAplicacion } from '../utils/errorAplicacion.js';

export const getAllProducts = async (req, res, next) => {
  try {
    const products = await servicioProducto.getAll();
    
    let filtered = [...products];
    const { category, search } = req.query;

    if (category) {
      filtered = filtered.filter(p => p.category.toLowerCase() === category.toLowerCase());
    }

    if (search) {
      filtered = filtered.filter(p => 
        p.name.toLowerCase().includes(search.toLowerCase())
      );
    }

    res.status(200).json({
      status: 'success',
      results: filtered.length,
      data: { products: filtered }
    });
  } catch (error) {
    next(error);
  }
};

export const getProductById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const product = await servicioProducto.getById(id);

    if (!product) {
      return next(new ErrorAplicacion('Producto no encontrado', 404));
    }

    res.status(200).json({
      status: 'success',
      data: { product }
    });
  } catch (error) {
    next(error);
  }
};

export const createProduct = async (req, res, next) => {
  try {
    const newProduct = await servicioProducto.create(req.body);
    res.status(201).json({
      status: 'success',
      data: { product: newProduct }
    });
  } catch (error) {
    next(error);
  }
};

export const updateProduct = async (req, res, next) => {
  try {
    const { id } = req.params;
    const updated = await servicioProducto.update(id, req.body);
    
    if (!updated) {
      return next(new ErrorAplicacion('Producto no encontrado', 404));
    }

    res.status(200).json({
      status: 'success',
      data: { product: updated }
    });
  } catch (error) {
    next(error);
  }
};

export const deleteProduct = async (req, res, next) => {
  try {
    const { id } = req.params;
    const deleted = await servicioProducto.delete(id);

    if (!deleted) {
      return next(new ErrorAplicacion('Producto no encontrado', 404));
    }

    res.status(200).json({
      status: 'success',
      message: 'Producto eliminado exitosamente',
      data: null
    });
  } catch (error) {
    next(error);
  }
};
