import mongoose from 'mongoose';

export const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/ai_cabinet_db');
    console.log(`[MongoDB] Connecté avec succès : ${conn.connection.host}`);
  } catch (error) {
    console.error(`[MongoDB] Erreur de connexion : ${error.message}`);
    // En développement, permet de continuer pour les tests d'API mock/santé
    if (process.env.NODE_ENV === 'production') {
      process.exit(1);
    }
  }
};
