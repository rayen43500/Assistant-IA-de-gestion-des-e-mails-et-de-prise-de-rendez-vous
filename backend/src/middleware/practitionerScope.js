import mongoose from 'mongoose';
import Doctor from '../models/Doctor.js';

/**
 * Cloisonnement des données selon le rôle.
 *
 *  - ADMIN / SUPER_ADMIN : tout le cabinet → {}
 *  - PRATICIEN          : uniquement ses patients → { doctorId }
 *  - PRATICIEN sans fiche Doctor : rien (jamais les patients des collègues)
 *  - PATIENT            : uniquement ses propres RDV / e-mails (filtre sur son adresse)
 *  - Session démo locale (utilisateur absent de la base) : pas de filtre
 *
 * @param {import('express').Request} req
 * @param {'appointment'|'email'|'generic'} [kind] modèle interrogé (pour le filtre patient)
 * @returns {Promise<object>} filtre MongoDB à fusionner dans la requête
 */
export async function getPractitionerScope(req, kind = 'generic') {
  const role = req.user?.role;
  const isRealUser = typeof req.user?.save === 'function';
  const NOTHING = { _id: new mongoose.Types.ObjectId() }; // ne correspond à aucun document

  if (role === 'PATIENT') {
    if (!isRealUser || !req.user.email) return NOTHING;
    if (kind === 'appointment') return { 'patient.email': req.user.email };
    if (kind === 'email') return { 'sender.email': req.user.email };
    return NOTHING;
  }

  if (role !== 'PRATICIEN') return {};
  if (!isRealUser || mongoose.connection.readyState !== 1) return {};

  if (req._practitionerScope) return req._practitionerScope;
  const doctor = await Doctor.findOne({ userId: req.user._id }).select('_id').lean();
  req._practitionerScope = doctor ? { doctorId: doctor._id } : { doctorId: new mongoose.Types.ObjectId() };
  return req._practitionerScope;
}
