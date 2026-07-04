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

const dayScheduleSchema = new mongoose.Schema({
  dayIndex: { type: Number, required: true }, // 0 (Sunday) to 6 (Saturday)
  dayName: { type: String, required: true },  // "Domingo", "Lunes", etc.
  isOpen: { type: Boolean, default: true },
  openTime: { type: String, default: '20:00' },
  closeTime: { type: String, default: '02:00' }
}, { _id: false });

const storeConfigSchema = new mongoose.Schema({
  key: { type: String, default: 'main', unique: true },
  isOpenOverride: { type: Boolean, default: null }, // null = follow schedule, true = force open, false = force closed
  schedule: [dayScheduleSchema]
});

const defaultSchedule = [
  { dayIndex: 0, dayName: 'Domingo', isOpen: true, openTime: '20:00', closeTime: '02:00' },
  { dayIndex: 1, dayName: 'Lunes', isOpen: true, openTime: '20:00', closeTime: '02:00' },
  { dayIndex: 2, dayName: 'Martes', isOpen: true, openTime: '20:00', closeTime: '02:00' },
  { dayIndex: 3, dayName: 'Miércoles', isOpen: true, openTime: '20:00', closeTime: '02:00' },
  { dayIndex: 4, dayName: 'Jueves', isOpen: true, openTime: '20:00', closeTime: '02:00' },
  { dayIndex: 5, dayName: 'Viernes', isOpen: true, openTime: '20:00', closeTime: '04:00' },
  { dayIndex: 6, dayName: 'Sábado', isOpen: true, openTime: '20:00', closeTime: '04:00' }
];

export const ProductModel = mongoose.model('Product', productSchema);
export const OrderModel = mongoose.model('Order', orderSchema);
export const StoreConfigModel = mongoose.model('StoreConfig', storeConfigSchema);

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

    // Seed store config if empty
    const configCount = await StoreConfigModel.countDocuments();
    if (configCount === 0) {
      console.log('🌱 MongoDB store config is empty. Seeding initial schedule.');
      await StoreConfigModel.create({
        key: 'main',
        isOpenOverride: null,
        schedule: defaultSchedule
      });
      console.log('🌱 Seeded default store config to MongoDB.');
    }
  } catch (err) {
    console.error('❌ Failed to connect to MongoDB:', err.message);
    console.log('⚠️  Falling back to local JSON database.');
  }
};
