import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import crypto from 'crypto';
import { isMongoConnected, ProductModel } from '../config/db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const filePath = path.join(__dirname, '../data/products.json');
const categoriesDir = path.join(__dirname, '../data/categories');

const getCategoryFilename = (category) => {
  const mapping = {
    'promos': 'promos.json',
    'aperitivos': 'aperitivos.json',
    'bebidas blancas': 'bebidasBlancas.json',
    'cervezas': 'cervezas.json',
    'bebidas sin alcohol': 'bebidasSinAlcohol.json',
    'hielo': 'hielo.json',
    'vinos': 'vinos.json'
  };
  return mapping[category.toLowerCase()] || `${category.toLowerCase().replace(/\s+/g, '')}.json`;
};

const initData = async () => {
  try {
    await fs.mkdir(path.dirname(filePath), { recursive: true });
    await fs.mkdir(categoriesDir, { recursive: true });
    
    const files = await fs.readdir(categoriesDir);
    let allProducts = [];

    for (const file of files) {
      if (file.endsWith('.json')) {
        const fileContent = await fs.readFile(path.join(categoriesDir, file), 'utf-8');
        try {
          const products = JSON.parse(fileContent);
          if (Array.isArray(products)) {
            allProducts = allProducts.concat(products);
          }
        } catch (jsonErr) {
          console.error(`Error parseando el archivo ${file}:`, jsonErr);
        }
      }
    }

    await fs.writeFile(filePath, JSON.stringify(allProducts, null, 2));
    console.log('📦 Base de datos de productos regenerada exitosamente a partir de las categorías.');
  } catch (error) {
    console.error('Error al inicializar la base de datos de productos:', error);
  }
};

await initData();

export const servicioProducto = {
  async getAll() {
    if (isMongoConnected()) {
      return await ProductModel.find().lean();
    }
    const data = await fs.readFile(filePath, 'utf-8');
    return JSON.parse(data);
  },

  async getById(id) {
    if (isMongoConnected()) {
      return await ProductModel.findOne({ id }).lean();
    }
    const products = await this.getAll();
    return products.find(p => p.id === id);
  },

  async create(productData) {
    const id = productData.id || crypto.randomUUID();
    const newProduct = {
      id,
      name: productData.name,
      price: Number(productData.price),
      category: productData.category,
      imageUrl: productData.imageUrl,
      isAvailable: productData.isAvailable !== undefined ? productData.isAvailable : true
    };

    if (isMongoConnected()) {
      const doc = new ProductModel(newProduct);
      await doc.save();
      return doc.toObject();
    }

    const categoryFile = getCategoryFilename(newProduct.category);
    const categoryFilePath = path.join(categoriesDir, categoryFile);

    let categoryProducts = [];
    try {
      const content = await fs.readFile(categoryFilePath, 'utf-8');
      categoryProducts = JSON.parse(content);
    } catch {}

    categoryProducts.push(newProduct);
    await fs.writeFile(categoryFilePath, JSON.stringify(categoryProducts, null, 2));
    await initData();
    return newProduct;
  },

  async update(id, productData) {
    if (isMongoConnected()) {
      const doc = await ProductModel.findOneAndUpdate({ id }, productData, { new: true }).lean();
      return doc;
    }

    const files = await fs.readdir(categoriesDir);
    let originalProduct = null;
    let oldCategoryFile = null;

    for (const file of files) {
      if (file.endsWith('.json')) {
        const fileContent = await fs.readFile(path.join(categoriesDir, file), 'utf-8');
        try {
          const products = JSON.parse(fileContent);
          const found = products.find(p => p.id === id);
          if (found) {
            originalProduct = found;
            oldCategoryFile = file;
            break;
          }
        } catch {}
      }
    }

    if (!originalProduct) return null;

    const updatedProduct = {
      ...originalProduct,
      name: productData.name !== undefined ? productData.name : originalProduct.name,
      price: productData.price !== undefined ? Number(productData.price) : originalProduct.price,
      category: productData.category !== undefined ? productData.category : originalProduct.category,
      imageUrl: productData.imageUrl !== undefined ? productData.imageUrl : originalProduct.imageUrl,
      isAvailable: productData.isAvailable !== undefined ? productData.isAvailable : originalProduct.isAvailable
    };

    const newCategoryFile = getCategoryFilename(updatedProduct.category);

    if (oldCategoryFile !== newCategoryFile) {
      const oldFilePath = path.join(categoriesDir, oldCategoryFile);
      const oldContent = await fs.readFile(oldFilePath, 'utf-8');
      const oldProducts = JSON.parse(oldContent).filter(p => p.id !== id);
      await fs.writeFile(oldFilePath, JSON.stringify(oldProducts, null, 2));

      const newFilePath = path.join(categoriesDir, newCategoryFile);
      let newProducts = [];
      try {
        const newContent = await fs.readFile(newFilePath, 'utf-8');
        newProducts = JSON.parse(newContent);
      } catch {}
      newProducts.push(updatedProduct);
      await fs.writeFile(newFilePath, JSON.stringify(newProducts, null, 2));
    } else {
      const filePath = path.join(categoriesDir, oldCategoryFile);
      const content = await fs.readFile(filePath, 'utf-8');
      const products = JSON.parse(content);
      const index = products.findIndex(p => p.id === id);
      products[index] = updatedProduct;
      await fs.writeFile(filePath, JSON.stringify(products, null, 2));
    }

    await initData();
    return updatedProduct;
  },

  async delete(id) {
    if (isMongoConnected()) {
      return await ProductModel.findOneAndDelete({ id }).lean();
    }

    const files = await fs.readdir(categoriesDir);
    let deletedProduct = null;

    for (const file of files) {
      if (file.endsWith('.json')) {
        const filePath = path.join(categoriesDir, file);
        const fileContent = await fs.readFile(filePath, 'utf-8');
        try {
          const products = JSON.parse(fileContent);
          const found = products.find(p => p.id === id);
          if (found) {
            deletedProduct = found;
            const updated = products.filter(p => p.id !== id);
            await fs.writeFile(filePath, JSON.stringify(updated, null, 2));
            break;
          }
        } catch {}
      }
    }

    if (deletedProduct) {
      await initData();
    }
    return deletedProduct;
  }
};
