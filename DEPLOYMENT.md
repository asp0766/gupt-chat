# Deploying Gupt Chat

## Before deployment

1. Create a MongoDB Atlas database and create a database user with access only to the Gupt Chat database. Copy its `mongodb+srv://` connection string.
2. Create a Cloudinary **unsigned** upload preset. Restrict it to an application-specific folder, image and audio/video formats, and a 10 MB maximum upload size.
3. Commit and push this repository to GitHub. Never commit either `.env` file.

Every push and pull request to `main` runs the GitHub Actions workflow in `.github/workflows/ci.yml`. It performs clean dependency installation, backend syntax checks, and a production Vite build before deployment.

## Render API

Create a new Blueprint in Render and select this repository. Render reads `render.yaml` from the repository root. Set the prompted values:

- `MONGODB_URI`: the MongoDB Atlas connection string.
- `CLIENT_ORIGIN`: the final Vercel deployment URL, for example `https://gupt-chat.vercel.app`.

After deployment, open `https://<render-service>.onrender.com/health`. It must return `{"ok":true,"service":"gupt-chat-server"}`.

## Vercel client

Import the same GitHub repository into Vercel. In **Root Directory**, select `client`. Vercel reads `client/vercel.json`. Add these environment variables for Production, Preview, and Development as appropriate:

- `VITE_SOCKET_URL`: the Render API origin, without a trailing slash, for example `https://gupt-chat-api.onrender.com`.
- `VITE_CLOUDINARY_CLOUD_NAME`: your Cloudinary cloud name.
- `VITE_CLOUDINARY_UNSIGNED_UPLOAD_PRESET`: your restricted unsigned upload preset.

Deploy the client, then update Render's `CLIENT_ORIGIN` with the exact Vercel production URL and redeploy the API.

## Production notes

The deployed configuration is intentionally a single Socket.io instance. For horizontal scaling, add the Socket.io Redis adapter and enable sticky sessions at the load balancer before increasing the instance count. MongoDB TTL deletion is asynchronous; the owner `terminate-room` event immediately deletes active room and message documents.
