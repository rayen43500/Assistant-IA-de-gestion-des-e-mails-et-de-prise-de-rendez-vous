import mongoose from 'mongoose';

// Désactiver le buffering Mongoose pour empêcher tout blocage réseau de 10s si MongoDB est hors-ligne
mongoose.set('bufferCommands', false);
mongoose.set('bufferTimeoutMS', 1000);

export const connectDB = async () => {
  const uri = process.env.MONGO_URI || 'mongodb://localhost:27017/ai_cabinet_db';
  try {
    const conn = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 2000,
      connectTimeoutMS: 2000,
    });
    console.log(`[MongoDB] Connecté avec succès : ${conn.connection.host}`);
  } catch (error) {
    console.warn(`[MongoDB] Avertissement connexion (${error.message}). Le serveur reste actif avec persistance locale sécurisée.`);
  }
};
