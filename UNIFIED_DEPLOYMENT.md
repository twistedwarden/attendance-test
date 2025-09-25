# Unified Deployment Guide

This guide explains how to deploy the entire Attendance System as a single unit, with the backend serving both the frontend and fp-api.

## Architecture Overview

The unified deployment consists of:

- **Frontend**: React application built and served as static files
- **Backend**: Main API server handling all business logic
- **FP-API**: Fingerprint API integrated as routes under `/api/fingerprint`
- **Database**: Single MySQL database shared by all services

## Deployment Options

### Option 1: Direct Deployment (Recommended)

1. **Build and Deploy**:

   ```bash
   # Make deployment script executable
   chmod +x deploy-unified.sh

   # Run unified deployment
   ./deploy-unified.sh

   # Start the unified server
   cd backend && npm start
   ```

2. **Access the Application**:
   - Frontend: `http://localhost:5000`
   - API: `http://localhost:5000/api/*`
   - Fingerprint API: `http://localhost:5000/api/fingerprint/*`

### Option 2: Docker Deployment

1. **Using Docker Compose** (includes database):

   ```bash
   # Copy environment file
   cp env.example .env

   # Edit .env with your configuration
   nano .env

   # Start all services
   docker-compose up -d
   ```

2. **Using Docker only** (external database):

   ```bash
   # Build the image
   docker build -t attendance-system .

   # Run the container
   docker run -p 5000:5000 \
     -e DB_HOST=your-db-host \
     -e DB_USER=your-db-user \
     -e DB_PASSWORD=your-db-password \
     -e JWT_SECRET=your-jwt-secret \
     -e ESP32_API_KEY=your-esp32-key \
     attendance-system
   ```

### Option 3: Railway Deployment

The project is already configured for Railway deployment:

1. **Connect to Railway**:

   - The `railway.json` file is already configured
   - Railway will automatically build the frontend and serve it from the backend

2. **Set Environment Variables** in Railway dashboard:
   ```
   NODE_ENV=production
   DB_HOST=your-db-host
   DB_USER=your-db-user
   DB_PASSWORD=your-db-password
   JWT_SECRET=your-jwt-secret
   ESP32_API_KEY=your-esp32-key
   ```

## Environment Configuration

### Required Variables

| Variable        | Description               | Example                           |
| --------------- | ------------------------- | --------------------------------- |
| `DB_HOST`       | Database host             | `localhost` or `your-db-host.com` |
| `DB_USER`       | Database username         | `attendance_user`                 |
| `DB_PASSWORD`   | Database password         | `secure_password`                 |
| `DB_NAME`       | Database name             | `attendance`                      |
| `JWT_SECRET`    | JWT signing secret        | `your-super-secret-key`           |
| `ESP32_API_KEY` | API key for ESP32 devices | `your_esp32_api_key`              |

### Optional Variables

| Variable      | Description          | Default                 |
| ------------- | -------------------- | ----------------------- |
| `PORT`        | Server port          | `5000`                  |
| `NODE_ENV`    | Environment          | `production`            |
| `CORS_ORIGIN` | Allowed CORS origins | `http://localhost:5000` |
| `SMTP_HOST`   | Email server         | `smtp.gmail.com`        |
| `SMTP_USER`   | Email username       | -                       |
| `SMTP_PASS`   | Email password       | -                       |

## How It Works

### 1. **Frontend Integration**

- React app is built using `npm run build`
- Built files are served as static files from `/dist`
- Backend serves the frontend at the root path (`/`)

### 2. **FP-API Integration**

- FP-API routes are dynamically imported in `backend/server.js`
- Routes are mounted at `/api/fingerprint`
- Same database connection as the main backend

### 3. **API Structure**

```
/                           # Frontend (React app)
/api/auth/*                 # Authentication endpoints
/api/users/*                # User management
/api/admin/*                # Admin endpoints
/api/parent/*               # Parent endpoints
/api/teacher/*              # Teacher endpoints
/api/registrar/*            # Registrar endpoints
/api/fingerprint/*          # Fingerprint API endpoints
/health                     # Health check
```

## Benefits of Unified Deployment

1. **Single Server**: Only one server to manage and monitor
2. **Simplified Deployment**: One build process, one deployment
3. **Shared Resources**: Single database connection, shared middleware
4. **Cost Effective**: Lower hosting costs
5. **Easier Scaling**: Scale the entire application together
6. **Simplified CORS**: No cross-origin issues between services

## Production Considerations

### Security

- Use HTTPS in production
- Set strong JWT secrets
- Configure proper CORS origins
- Use environment variables for sensitive data
- Enable rate limiting

### Performance

- Use a reverse proxy (nginx) for static file serving
- Enable gzip compression
- Set up caching headers
- Monitor database connections

### Monitoring

- Set up health checks
- Monitor server logs
- Track API response times
- Monitor database performance

## Troubleshooting

### Common Issues

1. **FP-API not loading**:

   - Check that fp-api dependencies are installed
   - Verify fp-api/.env configuration
   - Check server logs for import errors

2. **Frontend not serving**:

   - Ensure `npm run build` completed successfully
   - Check that `/dist` directory exists
   - Verify NODE_ENV is set to production

3. **Database connection issues**:

   - Verify database credentials
   - Check database server is running
   - Ensure database exists and is accessible

4. **CORS errors**:
   - Update CORS_ORIGIN to match your domain
   - Check that all API calls use the correct base URL

### Logs

- Backend logs: Check the terminal where you started the server
- Frontend errors: Check browser console
- Database errors: Check database server logs

## Migration from Separate Services

If you're currently running the services separately:

1. **Stop separate services**:

   ```bash
   # Stop fp-api server (if running)
   # Stop backend server (if running)
   ```

2. **Update environment variables**:

   - Merge backend/.env and fp-api/.env into a single .env
   - Update any hardcoded URLs in the frontend

3. **Deploy unified version**:

   ```bash
   ./deploy-unified.sh
   cd backend && npm start
   ```

4. **Test all functionality**:
   - Test frontend access
   - Test all API endpoints
   - Test fingerprint functionality
   - Test authentication flow

## Support

For deployment issues:

1. Check the logs for error messages
2. Verify all environment variables are set
3. Test database connectivity
4. Ensure all dependencies are installed
5. Check that ports are not in use by other services
