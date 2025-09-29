// src/firebaseAdmin.js
import admin from 'firebase-admin'
import { createRequire } from 'module'
const require = createRequire(import.meta.url)

// Carga el JSON local
const serviceAccount = require('../serviceAccountKey.json')

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  })
}

export const db = admin.firestore()
export const FieldValue = admin.firestore.FieldValue
