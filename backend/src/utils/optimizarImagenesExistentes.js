import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import sharp from 'sharp';
import mongoose from 'mongoose';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Cargar variables de entorno desde la raíz del proyecto
dotenv.config({ path: path.join(__dirname, '../../../.env') });

const uploadsDir = path.join(__dirname, '../../uploads');
const categoriesDir = path.join(__dirname, '../data/categories');
const productsFilePath = path.join(__dirname, '../data/products.json');

// Definir un modelo de Producto autocontenido para la migración de MongoDB
const Schema = mongoose.Schema;
const ProductSchema = new Schema({
  id: String,
  name: String,
  imageUrl: String
});
const Product = mongoose.models.Product || mongoose.model('Product', ProductSchema);

const runMigration = async () => {
  console.log('🚀 Iniciando script de migración y optimización de imágenes existentes...');
  
  try {
    // 1. Leer archivos de la carpeta uploads
    const files = await fs.readdir(uploadsDir).catch(() => []);
    if (files.length === 0) {
      console.log('⚠️  No se encontraron archivos en la carpeta de subidas (uploads).');
      return;
    }

    const imageRegex = /\.(jpg|jpeg|png)$/i;
    const filesToProcess = files.filter(file => imageRegex.test(file));

    if (filesToProcess.length === 0) {
      console.log('✨ No hay imágenes JPG, JPEG o PNG para procesar en la carpeta uploads.');
      return;
    }

    console.log(`🔍 Se encontraron ${filesToProcess.length} imágenes para optimizar.`);
    
    let totalOldSize = 0;
    let totalNewSize = 0;
    const mappings = [];

    // 2. Procesar imágenes una por una con sharp
    for (const file of filesToProcess) {
      const oldPath = path.join(uploadsDir, file);
      const newFilename = file.replace(imageRegex, '.webp');
      const newPath = path.join(uploadsDir, newFilename);

      try {
        const oldStats = await fs.stat(oldPath);
        totalOldSize += oldStats.size;

        console.log(`⚙️  Optimizando: ${file} (${(oldStats.size / 1024).toFixed(1)} KB)...`);

        // Convertir y comprimir
        await sharp(oldPath)
          .resize({ width: 800, withoutEnlargement: true })
          .webp({ quality: 80 })
          .toFile(newPath);

        const newStats = await fs.stat(newPath);
        totalNewSize += newStats.size;

        mappings.push({
          oldUrl: `/uploads/${file}`,
          newUrl: `/uploads/${newFilename}`,
          oldFile: oldPath,
          name: file
        });

        console.log(`✅ Convertida a WebP: ${newFilename} (${(newStats.size / 1024).toFixed(1)} KB)`);
      } catch (err) {
        console.error(`❌ Error procesando el archivo ${file}:`, err);
      }
    }

    if (mappings.length === 0) {
      console.log('⚠️  No se pudo procesar ninguna imagen con éxito.');
      return;
    }

    // 3. Actualizar referencias en los JSON locales de categorías
    console.log('\n📝 Actualizando referencias en bases de datos JSON locales...');
    const categoryFiles = await fs.readdir(categoriesDir).catch(() => []);
    
    for (const catFile of categoryFiles) {
      if (catFile.endsWith('.json')) {
        const catPath = path.join(categoriesDir, catFile);
        const contentStr = await fs.readFile(catPath, 'utf-8');
        try {
          const products = JSON.parse(contentStr);
          let modified = false;

          if (Array.isArray(products)) {
            for (const product of products) {
              const match = mappings.find(m => m.oldUrl === product.imageUrl);
              if (match) {
                product.imageUrl = match.newUrl;
                modified = true;
              }
            }
          }

          if (modified) {
            await fs.writeFile(catPath, JSON.stringify(products, null, 2));
            console.log(`💾 Categoría actualizada: ${catFile}`);
          }
        } catch (jsonErr) {
          console.error(`Error parseando categoría ${catFile}:`, jsonErr);
        }
      }
    }

    // 4. Actualizar referencias en products.json global
    try {
      const prodContentStr = await fs.readFile(productsFilePath, 'utf-8').catch(() => null);
      if (prodContentStr) {
        const products = JSON.parse(prodContentStr);
        let modified = false;
        if (Array.isArray(products)) {
          for (const product of products) {
            const match = mappings.find(m => m.oldUrl === product.imageUrl);
            if (match) {
              product.imageUrl = match.newUrl;
              modified = true;
            }
          }
        }
        if (modified) {
          await fs.writeFile(productsFilePath, JSON.stringify(products, null, 2));
          console.log('💾 Archivo products.json global actualizado.');
        }
      }
    } catch (prodErr) {
      console.error('Error al actualizar products.json global:', prodErr);
    }

    // 5. Conectarse a MongoDB y actualizar referencias si la URI está disponible
    if (process.env.MONGODB_URI) {
      console.log('\n🔌 Conectando a MongoDB para actualizar referencias en la nube...');
      try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('🔌 Conexión exitosa a MongoDB.');

        let mongoUpdates = 0;
        for (const mapping of mappings) {
          const res = await Product.updateMany(
            { imageUrl: mapping.oldUrl },
            { imageUrl: mapping.newUrl }
          );
          mongoUpdates += res.modifiedCount;
        }
        
        console.log(`💾 Se actualizaron ${mongoUpdates} registros en MongoDB.`);
      } catch (mongoErr) {
        console.error('❌ Error actualizando referencias en MongoDB:', mongoErr);
      } finally {
        await mongoose.disconnect();
        console.log('🔌 Desconectado de MongoDB.');
      }
    } else {
      console.log('\n⚠️  No se detectó MONGODB_URI. Omitiendo actualización en MongoDB.');
    }

    // 6. Eliminar archivos antiguos de imagen
    console.log('\n🗑️  Eliminando archivos antiguos originales...');
    for (const mapping of mappings) {
      await fs.unlink(mapping.oldFile).catch(err => {
        console.error(`No se pudo eliminar el archivo original ${mapping.name}:`, err);
      });
    }

    // 7. Mostrar resumen de optimización
    const savingBytes = totalOldSize - totalNewSize;
    const savingMB = (savingBytes / (1024 * 1024)).toFixed(2);
    const percent = ((savingBytes / totalOldSize) * 100).toFixed(1);
    
    console.log('\n🎉 ================================================= 🎉');
    console.log('🏆 ¡MIGRACIÓN Y OPTIMIZACIÓN COMPLETADA CON ÉXITO!');
    console.log(`📊 Tamaño original total: ${(totalOldSize / (1024 * 1024)).toFixed(2)} MB`);
    console.log(`📊 Nuevo tamaño total (WebP): ${(totalNewSize / (1024 * 1024)).toFixed(2)} MB`);
    console.log(`🔥 Espacio liberado en disco: ${savingMB} MB (${percent}% de ahorro)`);
    console.log('🎉 ================================================= 🎉\n');

  } catch (error) {
    console.error('💥 Error crítico durante el proceso de migración:', error);
  }
};

runMigration();
