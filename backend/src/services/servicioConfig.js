import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { isMongoConnected, StoreConfigModel } from '../config/db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const filePath = path.join(__dirname, '../data/storeConfig.json');

const defaultSchedule = [
  { dayIndex: 0, dayName: 'Domingo', isOpen: true, openTime: '20:00', closeTime: '02:00' },
  { dayIndex: 1, dayName: 'Lunes', isOpen: true, openTime: '20:00', closeTime: '02:00' },
  { dayIndex: 2, dayName: 'Martes', isOpen: true, openTime: '20:00', closeTime: '02:00' },
  { dayIndex: 3, dayName: 'Miércoles', isOpen: true, openTime: '20:00', closeTime: '02:00' },
  { dayIndex: 4, dayName: 'Jueves', isOpen: true, openTime: '20:00', closeTime: '02:00' },
  { dayIndex: 5, dayName: 'Viernes', isOpen: true, openTime: '20:00', closeTime: '04:00' },
  { dayIndex: 6, dayName: 'Sábado', isOpen: true, openTime: '20:00', closeTime: '04:00' }
];

const defaultConfig = {
  key: 'main',
  isOpenOverride: null,
  schedule: defaultSchedule
};

const initData = async () => {
  try {
    await fs.mkdir(path.dirname(filePath), { recursive: true });
    try {
      await fs.access(filePath);
    } catch {
      await fs.writeFile(filePath, JSON.stringify(defaultConfig, null, 2));
    }
  } catch (error) {
    console.error('Error al inicializar la base de datos de configuración de tienda:', error);
  }
};

await initData();

const timeToMinutes = (timeStr) => {
  if (!timeStr) return 0;
  const [hours, minutes] = timeStr.split(':').map(Number);
  return hours * 60 + minutes;
};

export const servicioConfig = {
  async getConfigRaw() {
    if (isMongoConnected()) {
      let doc = await StoreConfigModel.findOne({ key: 'main' }).lean();
      if (!doc) {
        doc = await StoreConfigModel.create(defaultConfig);
        return doc.toObject();
      }
      return doc;
    }
    try {
      const data = await fs.readFile(filePath, 'utf-8');
      return JSON.parse(data);
    } catch {
      return defaultConfig;
    }
  },

  async getConfig() {
    const config = await this.getConfigRaw();
    const isOpen = this.calculateIsOpen(config);
    return { ...config, isOpen };
  },

  async updateConfig(newConfig) {
    const payload = {
      isOpenOverride: newConfig.isOpenOverride,
      schedule: newConfig.schedule
    };

    if (isMongoConnected()) {
      const doc = await StoreConfigModel.findOneAndUpdate(
        { key: 'main' },
        payload,
        { new: true, upsert: true }
      ).lean();
      const isOpen = this.calculateIsOpen(doc);
      return { ...doc, isOpen };
    }

    const current = await this.getConfigRaw();
    const updated = { ...current, ...payload };
    await fs.writeFile(filePath, JSON.stringify(updated, null, 2));
    const isOpen = this.calculateIsOpen(updated);
    return { ...updated, isOpen };
  },

  calculateIsOpen(config) {
    if (config.isOpenOverride === true) return true;
    if (config.isOpenOverride === false) return false;

    // Get time in America/Argentina/Buenos_Aires (UTC-3)
    const argDate = new Date(new Date().toLocaleString('en-US', { timeZone: 'America/Argentina/Buenos_Aires' }));
    const dayIndex = argDate.getDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
    const nowMinutes = argDate.getHours() * 60 + argDate.getMinutes();

    const todaySchedule = config.schedule.find(s => s.dayIndex === dayIndex);
    const yesterdayIndex = (dayIndex - 1 + 7) % 7;
    const yesterdaySchedule = config.schedule.find(s => s.dayIndex === yesterdayIndex);

    // 1. Check if today's shift is active
    if (todaySchedule && todaySchedule.isOpen) {
      const open = timeToMinutes(todaySchedule.openTime);
      const close = timeToMinutes(todaySchedule.closeTime);

      if (close > open) {
        // Same-day shift (e.g. 20:00 to 23:30)
        if (nowMinutes >= open && nowMinutes < close) {
          return true;
        }
      } else {
        // Midnight-spanning shift (e.g. 20:00 to 02:00)
        if (nowMinutes >= open || nowMinutes < close) {
          return true;
        }
      }
    }

    // 2. Check if yesterday's shift spanned midnight and is still active
    if (yesterdaySchedule && yesterdaySchedule.isOpen) {
      const open = timeToMinutes(yesterdaySchedule.openTime);
      const close = timeToMinutes(yesterdaySchedule.closeTime);

      if (close <= open) {
        // Yesterday's shift spanned past midnight. Are we still in that window?
        if (nowMinutes < close) {
          return true;
        }
      }
    }

    return false;
  }
};
