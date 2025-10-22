// Script principal: baixa imagens ausentes do tema e do banco, com relatório unificado
// Execute com: node wp-missing-assets-resolver/download-all-missing-assets.js

const path = require('path')
const fs = require('fs')
const { https, http } = require('follow-redirects')
const {
  getThemeMissingImages,
  downloadFile,
  ensureDirExists,
} = require('./download-theme-missing-assets')
const { getDbMissingImages } = require('./download-db-missing-assets')

// --- Relatório ---
function getReportDir() {
  const now = new Date()
  const pad = (n) => n.toString().padStart(2, '0')
  const dirName = `${pad(now.getDate())}-${pad(
    now.getMonth() + 1,
  )}-${now.getFullYear()}-${pad(now.getHours())}-${pad(
    now.getMinutes(),
  )}-download-imagens-relatorio`
  const reportDir = path.resolve(__dirname, 'relatorios', dirName)
  if (!fs.existsSync(reportDir)) fs.mkdirSync(reportDir, { recursive: true })
  return reportDir
}
const reportDir = getReportDir()
const logBaixadas = path.join(reportDir, 'download-imagens.txt')
const logAusentes = path.join(reportDir, 'imagensausentes.txt')
function logImagemBaixada(msg) {
  fs.appendFileSync(logBaixadas, msg + '\n')
}
function logImagemAusente(msg) {
  fs.appendFileSync(logAusentes, msg + '\n')
}

// --- Download e relatório ---
async function baixarImagens(urlsSet) {
  let baixadas = 0
  for (const url of urlsSet) {
    const relPath = url.replace(/^https?:\/\/[^/]+/, '')
    const localPath = path.resolve(__dirname, '../' + relPath)
    if (fs.existsSync(localPath)) continue
    process.stdout.write(`Verificando ${url} ... `)
    try {
      ensureDirExists(path.dirname(localPath))
      await downloadFile(url, localPath)
      logImagemBaixada(url)
      console.log('✅ BAIXADO')
      baixadas++
    } catch (err) {
      logImagemAusente(url)
      console.log('❌ AUSENTE EM PROD')
    }
  }
  return baixadas
}

// --- Execução principal ---
;(async () => {
  console.log('🔎 Buscando imagens no tema...')
  const themeUrls = new Set(await getThemeMissingImages())
  console.log(`Encontradas ${themeUrls.size} imagens no tema.`)

  console.log('🔎 Buscando imagens no banco de dados...')
  const dbUrls = new Set(await getDbMissingImages())
  console.log(`Encontradas ${dbUrls.size} imagens no banco.`)

  // Unifica e remove duplicadas
  const allUrls = new Set([...themeUrls, ...dbUrls])
  console.log(`Total de URLs únicas: ${allUrls.size}`)

  // Baixa e gera relatório
  const baixadas = await baixarImagens(allUrls)

  console.log('\n✅ Finalizado!')
  console.log(`🖼️ Imagens baixadas: ${baixadas}`)
  console.log(`📄 Relatório salvo em: ${reportDir}`)
})()
