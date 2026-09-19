// Busca imagens ausentes referenciadas no banco e baixa do prod
const fs = require('fs')
const path = require('path')
const { https, http } = require('follow-redirects')
const mysql = require('mysql2/promise')

require('dotenv').config()
const prodDomain = process.env.PROD_DOMAIN
const db = {
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,
  charset: process.env.DB_CHARSET,
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
async function getDbMissingImages() {
  const conn = await mysql.createConnection(db)
  const tablesAndFields = [
    { table: 'wp_posts', fields: ['post_content', 'guid'] },
    { table: 'wp_postmeta', fields: ['meta_value'] },
    { table: 'wp_options', fields: ['option_value'] },
  ]
  const allUrls = new Set()
  for (const { table, fields } of tablesAndFields) {
    for (const field of fields) {
      const [rows] = await conn.query(`SELECT \`${field}\` FROM \`${table}\``)
      for (const row of rows) {
        const urls = extractUploadsUrls(row[field])
        urls.forEach((url) => allUrls.add(url))
      }
    }
  }
  await conn.end()
  return Array.from(allUrls)
}
module.exports = { getDbMissingImages }
