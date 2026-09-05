const http = require('node:http')
const fs = require('node:fs/promises')
const path = require('node:path')

const filePath = path.join(__dirname, 'messages.json')
const accountsPath = path.join(__dirname, 'accounts.json')
const uploadsDir = path.join(__dirname, 'uploads')
const port = 8787

async function readMessages() {
  try { return JSON.parse(await fs.readFile(filePath, 'utf8')) } catch { return [] }
}

async function writeMessages(messages) {
  await fs.writeFile(filePath, `${JSON.stringify(messages, null, 2)}\n`, 'utf8')
}

async function readAccounts() {
  try { return JSON.parse(await fs.readFile(accountsPath, 'utf8')) } catch { return [{ username: 'giga', password: 'zaid' }] }
}

async function writeAccounts(accounts) {
  await fs.writeFile(accountsPath, `${JSON.stringify(accounts, null, 2)}\n`, 'utf8')
}

const server = http.createServer(async (request, response) => {
  response.setHeader('Access-Control-Allow-Origin', '*')
  response.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  response.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
  if (request.method === 'OPTIONS') { response.writeHead(204); response.end(); return }
  if (request.url.startsWith('/uploads/')) {
    try {
      const relativeUpload = request.url.slice('/uploads/'.length).split('?')[0]
      const uploadName = path.basename(relativeUpload)
      const uploadFolder = path.basename(path.dirname(relativeUpload))
      const image = await fs.readFile(path.join(uploadsDir, uploadFolder === 'pfps' || uploadFolder === 'banners' ? uploadFolder : '', uploadName))
      const contentType = uploadName.endsWith('.jpg') || uploadName.endsWith('.jpeg') ? 'image/jpeg' : uploadName.endsWith('.gif') ? 'image/gif' : 'image/png'
      response.writeHead(200, { 'Content-Type': contentType, 'Cache-Control': 'no-cache' })
      response.end(image)
    } catch { response.writeHead(404); response.end('Image not found') }
    return
  }
  if (request.url === '/api/uploads' && request.method === 'POST') {
    let body = ''
    request.on('data', (chunk) => { body += chunk })
    request.on('end', async () => {
      try {
        const { id, sender, receiver: _receiver, fileName, fileType, dataUrl, uploadType } = JSON.parse(body)
        const encoded = dataUrl.split(',')[1]
        const extension = fileType === 'image/jpeg' ? '.jpg' : fileType === 'image/gif' ? '.gif' : path.extname(String(fileName || '')).toLowerCase() || '.png'
        const folder = uploadType === 'pfp' ? 'pfps' : uploadType === 'banner' ? 'banners' : ''
        const filename = `${String(id).replace(/[^a-zA-Z0-9_-]/g, '')}-${String(sender).replace(/[^a-zA-Z0-9_-]/g, '')}${extension}`
        const destination = path.join(uploadsDir, folder, filename)
        await fs.mkdir(path.dirname(destination), { recursive: true })
        await fs.writeFile(destination, Buffer.from(encoded, 'base64'))
        response.writeHead(201, { 'Content-Type': 'application/json' })
        response.end(JSON.stringify({ path: `/uploads/${folder ? `${folder}/` : ''}${filename}` }))
      } catch { response.writeHead(400); response.end('Invalid image') }
    })
    return
  }
  if (request.url === '/api/accounts' && request.method === 'GET') {
    response.setHeader('Content-Type', 'application/json')
    response.end(JSON.stringify(await readAccounts()))
    return
  }
  if (request.url === '/api/accounts' && request.method === 'POST') {
    let body = ''
    request.on('data', (chunk) => { body += chunk })
    request.on('end', async () => {
      try {
        const account = JSON.parse(body)
        if (!account.username) throw new Error('Missing account fields')
        const accounts = await readAccounts()
        const existingIndex = accounts.findIndex((item) => item.username === account.username)
        if (existingIndex >= 0) accounts[existingIndex] = { ...accounts[existingIndex], ...account }
        else { if (!account.password) throw new Error('Missing password'); accounts.push({ username: account.username, password: account.password, avatarPath: account.avatarPath, bannerPath: account.bannerPath, bannerColor: account.bannerColor }) }
        await writeAccounts(accounts)
        response.writeHead(201, { 'Content-Type': 'application/json' })
        response.end(JSON.stringify({ username: account.username, password: account.password }))
      } catch { response.writeHead(400); response.end('Invalid account') }
    })
    return
  }
  if (request.url !== '/api/messages') { response.writeHead(404); response.end('Not found'); return }
  if (request.method === 'GET') {
    response.setHeader('Content-Type', 'application/json')
    response.end(JSON.stringify(await readMessages()))
    return
  }
  if (request.method === 'POST') {
    let body = ''
    request.on('data', (chunk) => { body += chunk })
    request.on('end', async () => {
      try {
        const message = JSON.parse(body)
        const messages = await readMessages()
        messages.push(message)
        await writeMessages(messages)
        response.writeHead(201, { 'Content-Type': 'application/json' })
        response.end(JSON.stringify(message))
      } catch {
        response.writeHead(400)
        response.end('Invalid message')
      }
    })
    return
  }
  response.writeHead(405)
  response.end('Method not allowed')
})

server.listen(port, () => console.log(`Message API listening on http://localhost:${port}`))
