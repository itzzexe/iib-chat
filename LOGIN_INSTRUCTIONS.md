# Login Instructions

## Default Credentials

When the database is not connected (development mode), use these credentials to login:

- **Email:** `admin@app.com`
- **Password:** `admin123`

## Database Connection

If MongoDB is properly connected, you can:

1. **Register as Manager:** Create the first manager account through the registration form
2. **Register as Employee:** Create employee accounts that require manager approval

## Troubleshooting

### Login Issues
- Make sure you're using the correct email format
- Check that the server is running on the correct port
- Verify the database connection status in server logs

### Browser Warnings
- The "Module externalized for browser compatibility" warnings are normal and don't affect functionality
- React DevTools warning can be ignored in development

## Development Setup

1. Start the server: `npm run server:dev`
2. Start the client: `npm run dev`
3. Open http://localhost:5173 in your browser
4. Login with the default credentials above