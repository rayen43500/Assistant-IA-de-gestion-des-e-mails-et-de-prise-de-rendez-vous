import mongoose from 'mongoose';

/**
 * router.param('id', validateObjectIdParam) : un identifiant mal formé renvoie 404
 * au lieu d'une erreur 500 « Cast to ObjectId failed » (qui divulgue des détails internes).
 */
export function validateObjectIdParam(req, res, next, value) {
  if (!mongoose.isValidObjectId(String(value)) || !/^[0-9a-f]{24}$/i.test(String(value))) {
    return res.status(404).json({ message: 'Ressource introuvable.' });
  }
  next();
}
