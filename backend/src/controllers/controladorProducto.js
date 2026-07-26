import { servicioProducto } from '../services/servicioProducto.js';
import { ErrorAplicacion } from '../utils/errorAplicacion.js';

const mapProductImageUrl = (req, product) => {
  if (!product) return product;
  const protocol = req.protocol;
  const host = req.get('host');
  
  const mapped = { ...product };
  
  if (product.imageUrl && product.imageUrl.startsWith('/uploads/')) {
    mapped.imageUrl = `${protocol}://${host}${product.imageUrl}`;
    
    // Add small image URL
    const lastDotIndex = product.imageUrl.lastIndexOf('.');
    if (lastDotIndex !== -1) {
      const basePath = product.imageUrl.substring(0, lastDotIndex);
      const extension = product.imageUrl.substring(lastDotIndex);
      mapped.imageUrlSm = `${protocol}://${host}${basePath}-sm${extension}`;
    } else {
      mapped.imageUrlSm = `${protocol}://${host}${product.imageUrl}-sm`;
    }
  } else {
    // If it's external or base64 fallback
    mapped.imageUrlSm = product.imageUrl;
  }
  return mapped;
};

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
      data: { products: filtered.map(p => mapProductImageUrl(req, p)) }
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
      data: { product: mapProductImageUrl(req, product) }
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
      data: { product: mapProductImageUrl(req, newProduct) }
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
      data: { product: mapProductImageUrl(req, updated) }
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
