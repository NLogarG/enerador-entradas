import 'dotenv/config'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import QRCode from 'qrcode'
import XLSX from 'xlsx'
import * as sgMail from '@sendgrid/mail'
import { db, FieldValue } from './src/firebaseAdmin.js'
import { buildEmailHTML } from './emailTemplate.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const {
  SENDGRID_API_KEY,
  MAIL_FROM,
  EVENTO_ID = 'BAILE-ESCOLAR-2025',
  EVENTO_NOMBRE = 'Baile Escolar 2025'
} = process.env

const DRY_RUN = !!process.env.DRY_RUN

// SendGrid init
sgMail.setApiKey(SENDGRID_API_KEY)

// Rutas
const DATA_DIR = path.join(__dirname, 'data')
const EXCEL_PATH = path.join(DATA_DIR, 'entradas.xlsx')
const QR_DIR = path.join(__dirname, 'qrs')
if (!fs.existsSync(QR_DIR)) fs.mkdirSync(QR_DIR, { recursive: true })

// Leer Excel (espera columnas: Alumno, Email, Entradas)
function readRowsFromExcel(filePath) {
  const wb = XLSX.readFile(filePath)
  const sheet = wb.Sheets[wb.SheetNames[0]]
  const rows = XLSX.utils.sheet_to_json(sheet, { defval: '' })
  return rows.map((r, i) => ({
    Alumno: String(r.Alumno || '').trim(),
    Email: String(r.Email || '').trim(),
    Entradas: Number(r.Entradas || 0),
    _row: i + 2 // fila estimada (1 encabezado)
  }))
}

async function createEntradaAndSend({ alumno, email, cantidad }) {
  if (!email || !cantidad || cantidad <= 0) {
    console.warn(`Fila inválida: email=${email}, cantidad=${cantidad}`)
    return
  }

  // 1) Crear doc en 'entradas'
  let docRef
  if (!DRY_RUN) {
    docRef = await db.collection('entradas').add({
      email,
      total: cantidad,
      usadas: 0,
      eventoId: EVENTO_ID,
      createdAt: FieldValue.serverTimestamp()
    })
  } else {
    docRef = { id: `SIM-${Math.random().toString(36).slice(2, 10)}` }
  }

  const codigo = docRef.id

  // 2) Generar QR
  const pngPath = path.join(QR_DIR, `QR_${codigo}.png`)
  await QRCode.toFile(pngPath, codigo, { width: 600, margin: 2 })

  // 3) Enviar correo con HTML + adjunto
  const html = buildEmailHTML({
    alumno,
    entradas: cantidad,
    eventoNombre: EVENTO_NOMBRE
  })
  const msg = {
    to: email,
    from: MAIL_FROM,
    subject: `Tus entradas para ${EVENTO_NOMBRE} (${cantidad})`,
    html,
    attachments: [
      {
        content: fs.readFileSync(pngPath).toString('base64'),
        filename: `QR_${codigo}.png`,
        type: 'image/png',
        disposition: 'attachment'
      }
    ]
  }

  if (!DRY_RUN) {
    await sgMail.send(msg)
  }

  return { codigo, pngPath, email, cantidad }
}

async function main() {
  console.log(`▶️  Generando entradas desde: ${EXCEL_PATH}`)
  console.log(
    `Evento: ${EVENTO_ID}  |  DRY_RUN=${
      DRY_RUN ? 'ON (no escribe/manda)' : 'OFF'
    }`
  )

  if (!fs.existsSync(EXCEL_PATH)) {
    console.error(
      'No encuentro data/entradas.xlsx. Crea la carpeta data/ y pon ahí el Excel.'
    )
    process.exit(1)
  }

  const rows = readRowsFromExcel(EXCEL_PATH)
  if (!rows.length) {
    console.log('No hay filas en el Excel.')
    return
  }

  let ok = 0,
    fail = 0
  for (const r of rows) {
    try {
      const alumno = r.Alumno
      const email = r.Email
      const cantidad = r.Entradas

      if (!email || !cantidad) throw new Error('Datos incompletos')
      const res = await createEntradaAndSend({ alumno, email, cantidad })
      console.log(`✅ ${email} -> ${res?.codigo}`)
      ok++
    } catch (e) {
      console.error(`❌ Fila ${r._row}:`, e.message)
      fail++
    }
  }

  console.log(`\nResumen: OK=${ok}  FAIL=${fail}`)
  console.log(`PNGs generados en: qrs/`)
}

main().catch((e) => {
  console.error('Error general:', e)
  process.exit(1)
})
