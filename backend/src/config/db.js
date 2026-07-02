import mongoose from 'mongoose';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let connected = false;

export const isMongoConnected = () => connected;

// Schemas
const productSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  price: { type: Number, required: true },
  category: { type: String, required: true },
  imageUrl: { type: String, required: true },
  isAvailable: { type: Boolean, default: true }
});

const orderItemSchema = new mongoose.Schema({
  productId: String,
  name: String,
  price: Number,
  quantity: Number,
  subtotal: Number
});

const orderSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  customerName: String,
  customerPhone: String,
  deliveryAddress: String,
  notes: String,
  lat: Number,
  lng: Number,
  paymentMethod: String,
  items: [orderItemSchema],
  totalAmount: Number,
  status: { type: String, default: 'pending' },
  createdAt: { type: Date, default: Date.now }
});

export const ProductModel = mongoose.model('Product', productSchema);
export const OrderModel = mongoose.model('Order', orderSchema);

export const connectDB = async () => {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.log('⚠️  No MONGODB_URI found. Falling back to local JSON database.');
    return;
  }

  try {
    await mongoose.connect(uri);
    connected = true;
    console.log('🔌 Connected to MongoDB Cloud successfully.');

    // Seed database if empty
    const productCount = await ProductModel.countDocuments();
    if (productCount === 0) {
      console.log('🌱 MongoDB database is empty. Seeding initial products from categories/');
      const categoriesDir = path.join(__dirname, '../data/categories');
      await fs.mkdir(categoriesDir, { recursive: true });
      const files = await fs.readdir(categoriesDir);
      let allProducts = [];

      for (const file of files) {
        if (file.endsWith('.json')) {
          const content = await fs.readFile(path.join(categoriesDir, file), 'utf-8');
          try {
            const parsed = JSON.parse(content);
            if (Array.isArray(parsed)) {
              allProducts = allProducts.concat(parsed);
            }
          } catch (e) {
            console.error(`Error parsing file ${file}:`, e);
          }
        }
      }

      if (allProducts.length > 0) {
        await ProductModel.insertMany(allProducts);
        console.log(`🌱 Seeded ${allProducts.length} products to MongoDB.`);
      }
    }
  } catch (err) {
    console.error('❌ Failed to connect to MongoDB:', err.message);
    console.log('⚠️  Falling back to local JSON database.');
  }
};
