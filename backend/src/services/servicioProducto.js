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

const saveBase64Image = async (base64Str) => {
  if (!base64Str || !base64Str.startsWith('data:image/')) {
    return base64Str;
  }
  
  try {
    const matches = base64Str.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
    if (!matches || matches.length !== 3) {
      return base64Str;
    }
    
    const type = matches[1];
    const buffer = Buffer.from(matches[2], 'base64');
    
    // Determine extension
    let ext = 'jpg';
    if (type.includes('png')) ext = 'png';
    else if (type.includes('webp')) ext = 'webp';
    else if (type.includes('gif')) ext = 'gif';
    
    const filename = `${crypto.randomUUID()}.${ext}`;
    const uploadsDir = path.join(__dirname, '../../uploads');
    
    // Ensure uploads directory exists
    await fs.mkdir(uploadsDir, { recursive: true });
    
    const destPath = path.join(uploadsDir, filename);
    await fs.writeFile(destPath, buffer);
    
    return `/uploads/${filename}`;
  } catch (error) {
    console.error('Error al guardar la imagen Base64:', error);
    return base64Str;
  }
};

const initData = async () => {
  try {
    await fs.mkdir(path.dirname(filePath), { recursive: true });
    await fs.mkdir(categoriesDir, { recursive: true });
    
    const uploadsDir = path.join(__dirname, '../../uploads');
    await fs.mkdir(uploadsDir, { recursive: true });

    const files = await fs.readdir(categoriesDir);
    let allProducts = [];

    for (const file of files) {
      if (file.endsWith('.json')) {
        const fileCategoryPath = path.join(categoriesDir, file);
        const fileContent = await fs.readFile(fileCategoryPath, 'utf-8');
        try {
          const products = JSON.parse(fileContent);
          if (Array.isArray(products)) {
            let modified = false;
            for (const product of products) {
              if (product.imageUrl && product.imageUrl.startsWith('data:image/')) {
                const savedPath = await saveBase64Image(product.imageUrl);
                if (savedPath.startsWith('/uploads/')) {
                  product.imageUrl = savedPath;
                  modified = true;
                }
              }
            }
            if (modified) {
              await fs.writeFile(fileCategoryPath, JSON.stringify(products, null, 2));
              console.log(`💾 Migradas imágenes Base64 a archivos físicos en categoría: ${file}`);
            }
            allProducts = allProducts.concat(products);
          }
        } catch (jsonErr) {
          console.error(`Error parseando el archivo ${file}:`, jsonErr);
        }
      }
    }

    // Si Mongo está conectado, migrar también las imágenes de los productos en la base de datos
    if (isMongoConnected()) {
      try {
        const mongoProducts = await ProductModel.find().lean();
        for (const product of mongoProducts) {
          if (product.imageUrl && product.imageUrl.startsWith('data:image/')) {
            const savedPath = await saveBase64Image(product.imageUrl);
            if (savedPath.startsWith('/uploads/')) {
              await ProductModel.updateOne({ id: product.id }, { imageUrl: savedPath });
              console.log(`💾 Migrada imagen en MongoDB para producto: ${product.name}`);
            }
          }
        }
      } catch (mongoErr) {
        console.error('Error migrando imágenes en MongoDB:', mongoErr);
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
    const imageUrl = await saveBase64Image(productData.imageUrl);
    const newProduct = {
      id,
      name: productData.name,
      price: Number(productData.price),
      category: productData.category,
      imageUrl,
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
      if (productData.imageUrl) {
        productData.imageUrl = await saveBase64Image(productData.imageUrl);
      }
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

    const imageUrl = productData.imageUrl !== undefined ? await saveBase64Image(productData.imageUrl) : originalProduct.imageUrl;

    const updatedProduct = {
      ...originalProduct,
      name: productData.name !== undefined ? productData.name : originalProduct.name,
      price: productData.price !== undefined ? Number(productData.price) : originalProduct.price,
      category: productData.category !== undefined ? productData.category : originalProduct.category,
      imageUrl,
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
