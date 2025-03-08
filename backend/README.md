# Socket.IO Chat Backend

This is the backend server for the Socket.IO chat application.

## Environment Variables

Create a `.env` file with the following variables:

```
PORT=5000
FRONTEND_URL=https://your-frontend-url.vercel.app
NODE_ENV=production
```

## Development

```bash
# Install dependencies
npm install

# Run in development mode
npm run dev
```

## Production

```bash
# Install dependencies
npm install --production

# Start the server
npm start
```

## Deployment on Railway

1. Create a new project on Railway
2. Connect your GitHub repository
3. Select the backend folder as the source directory
4. Set the environment variables:
   - `PORT`: 5000 (Railway will override this)
   - `FRONTEND_URL`: Your Vercel frontend URL
   - `NODE_ENV`: production
5. Deploy the application

## API Endpoints

- `GET /`: Server status
- `GET /health`: Health check endpoint
- WebSocket: Socket.IO connection 