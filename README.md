# Zlide

Zlide is a local-first messaging app. Accounts are kept in browser storage, while every sent message is appended to `messages.json` by the local Node API.

## Run

```bash
npm run dev:all
```

Open the Vite URL shown in the terminal. The API runs on port `8787` and the Vite app proxies `/api/messages` to it.

## Cloudflare

Keep `npm run dev:all` running, then open a second terminal and run:

```powershell
npm run tunnel
```

The command uses `cloudflared-windows-amd64.exe` from your Downloads folder and prints a temporary public URL for the app. The URL changes when the quick tunnel is restarted. The repository stores the launcher command, not the temporary URL.

## Message format

Every entry in `messages.json` includes `from` and `sent-to`, plus `sender` and `receiver`:

```json
{
  "id": "message-id",
  "sender": "alex",
  "receiver": "maya",
  "from": "alex",
  "sent-to": "maya",
  "text": "Hello",
  "createdAt": "2026-09-04T12:00:00.000Z"
}
```

Image uploads are saved in their original image format in `uploads/` using the message ID, sender, and receiver. The message stores its relative `imagePath`, and both sender and recipient load the same saved image in the chat.

The app refreshes messages periodically, so a recipient in another browser tab sees newly stored messages.
