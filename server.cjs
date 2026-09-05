const http = require('node:http')
const fs = require('node:fs/promises')
const path = require('node:path')

const filePath = path.join(__dirname, 'messages.json')
const uploadsDir = path.join(__dirname, 'uploads')
const port = 8787

async function readMessages() {
  try { return JSON.parse(await fs.readFile(filePath, 'utf8')) } catch { return [] }
}

async function writeMessages(messages) {
  await fs.writeFile(filePath, `${JSON.stringify(messages, null, 2)}\n`, 'utf8')
}

const server = http.createServer(async (request, response) => {
  response.setHeader('Access-Control-Allow-Origin', '*')
  response.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  response.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
  if (request.method === 'OPTIONS') { response.writeHead(204); response.end(); return }
  if (request.url.startsWith('/uploads/')) {
    try {
      const uploadName = path.basename(request.url.slice('/uploads/'.length))
      const image = await fs.readFile(path.join(uploadsDir, uploadName))
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
        const { id, sender, receiver, fileName, fileType, dataUrl } = JSON.parse(body)
        const encoded = dataUrl.split(',')[1]
        const extension = fileType === 'image/jpeg' ? '.jpg' : fileType === 'image/gif' ? '.gif' : path.extname(String(fileName || '')).toLowerCase() || '.png'
        const filename = `${String(id).replace(/[^a-zA-Z0-9_-]/g, '')}-${String(sender).replace(/[^a-zA-Z0-9_-]/g, '')}-to-${String(receiver).replace(/[^a-zA-Z0-9_-]/g, '')}${extension}`
        await fs.mkdir(uploadsDir, { recursive: true })
        await fs.writeFile(path.join(uploadsDir, filename), Buffer.from(encoded, 'base64'))
        response.writeHead(201, { 'Content-Type': 'application/json' })
        response.end(JSON.stringify({ path: `/uploads/${filename}` }))
      } catch { response.writeHead(400); response.end('Invalid image') }
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
