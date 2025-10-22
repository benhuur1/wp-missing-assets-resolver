// Busca imagens ausentes referenciadas no tema e baixa do prod
const fs = require('fs')
const path = require('path')
const { https, http } = require('follow-redirects')
const mysql = require('mysql2/promise')

require('dotenv').config()
const prodDomain = process.env.PROD_DOMAIN

async function getActiveThemeDir() {
  const db = {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE,
    charset: process.env.DB_CHARSET,
  }
  const conn = await mysql.createConnection(db)
  const [rows] = await conn.query(
    "SELECT option_value FROM wp_options WHERE option_name = 'template'",
  )
  await conn.end()
  const themeName = rows[0]?.option_value || 'blackrun'
  return path.resolve(__dirname, `../wp-content/themes/${themeName}`)
}

function ensureDirExists(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
}
function extractUploadsUrls(text) {
  if (!text) return []
  const urls = new Set()
  // URLs absolutas
  const regexAbs = /https?:\/\/[^\s"'`<>]*\/wp-content\/uploads\/[\w\/-_.%]+/gi
  let match
  while ((match = regexAbs.exec(text)) !== null) urls.add(match[0])
  // URLs relativas
  const regexRel = /\/wp-content\/uploads\/[\w\/-_.%]+/gi
  while ((match = regexRel.exec(text)) !== null) urls.add(prodDomain + match[0])
  return Array.from(urls)
}
function downloadFile(url, dest) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(dest)
    const client = url.startsWith('https') ? https : http
    client
      .get(url, (response) => {
        if (response.statusCode !== 200) {
          file.close()
          fs.unlink(dest, () => {})
          return reject(`❌ Não encontrado em prod: ${url}`)
        }
        response.pipe(file)
        file.on('finish', () => file.close(resolve))
      })
      .on('error', (err) => {
        file.close()
        fs.unlink(dest, () => {})
        reject(`❌ Erro ao baixar: ${err.message}`)
      })
  })
}
function walk(dir, filelist = []) {
  fs.readdirSync(dir).forEach((file) => {
    const filepath = path.join(dir, file)
    if (fs.statSync(filepath).isDirectory()) {
      walk(filepath, filelist)
    } else if (/\.(php|blade\.php|js|scss|css|html)$/.test(file)) {
      filelist.push(filepath)
    }
  })
  return filelist
}

async function getThemeMissingImages() {
  const themeDir = await getActiveThemeDir()
  const files = walk(themeDir)
  const allUrls = new Set()
  files.forEach((file) => {
    const content = fs.readFileSync(file, 'utf-8')
    extractUploadsUrls(content).forEach((url) => allUrls.add(url))
  })
  return Array.from(allUrls)
}

module.exports = { getThemeMissingImages, downloadFile, ensureDirExists }
