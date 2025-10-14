# Vercel Deployment Guide for Royal Threading and Beauty Backend

This guide will help us deploy the Royal Threading and Beauty backend service to Vercel without modifying any existing functionality.

## Prerequisites

1. **Vercel Account**: Sign up at [vercel.com](https://vercel.com)
2. **Environment Variables**: Have all our production environment variables ready
3. **MongoDB Atlas**: Set up a MongoDB Atlas cluster for production database
4. **Firebase Project**: Have our Firebase service account credentials ready

## Deployment Steps

### 1. Connect Repository to Vercel

1. Go to [vercel.com/dashboard](https://vercel.com/dashboard)
2. Click "New Project"
3. Import our GitHub repository
4. Select this backend folder as the root directory

### 2. Configure Build Settings

Vercel will automatically detect the project configuration from `vercel.json`, but ensure these settings:

- **Framework Preset**: Other
- **Build Command**: `npm run vercel-build`
- **Output Directory**: `dist`
- **Install Command**: `npm install`
- **Node.js Version**: 22.x

### 3. Set Environment Variables

In our Vercel project dashboard, go to Settings → Environment Variables and add:

#### Project Configuration

```
PROJECT_NAME = Royal Threading and Beauty
ENVIRONMENT = production
PORT = 8070
SERVER_BASE_URL = https://our-app-name.vercel.app
```

#### Database

```
MONGODB_URI = mongodb+srv://username:password@cluster.mongodb.net/database?retryWrites=true&w=majority
```

#### Email Configuration

```
SMTP_EMAIL = our-email@domain.com
SMTP_PASSWORD = our-email-password
```

#### Firebase Configuration

```
FIREBASE_PROJECT_ID = our-firebase-project-id
FIREBASE_PRIVATE_KEY = -----BEGIN PRIVATE KEY-----
our-private-key-content
-----END PRIVATE KEY-----
FIREBASE_CLIENT_EMAIL = firebase-adminsdk-xyz@project.iam.gserviceaccount.com
```

#### JWT Configuration (if using authentication)

```
ACCESS_TOKEN_PUBLIC_KEY = our-base64-encoded-public-key
ACCESS_TOKEN_PRIVATE_KEY = our-base64-encoded-private-key
ACCESS_TOKEN_EXPIRY = 15m
REFRESH_TOKEN_PUBLIC_KEY = our-base64-encoded-refresh-public-key
REFRESH_TOKEN_PRIVATE_KEY = our-base64-encoded-refresh-private-key
REFRESH_TOKEN_EXPIRY = 1y
```

### 4. Deploy

1. Click "Deploy" in Vercel dashboard
2. Wait for the build to complete
3. our API will be available at `https://our-app-name.vercel.app`

## API Endpoints

After deployment, our API endpoints will be:

- **Root**: `https://our-app-name.vercel.app/`
- **Contact Form**: `https://our-app-name.vercel.app/v1/contact/submit`
- **API Root**: `https://our-app-name.vercel.app/v1/`

## Important Notes

### Environment-Specific Behavior

- **Development**: API endpoints are prefixed with `/api/v1`
- **Production**: API endpoints are prefixed with `/v1`

### File Structure Added for Vercel

```
├── vercel.json           # Vercel configuration
├── api/
│   └── index.ts         # Vercel serverless function entry point
├── .env      # Production environment variables reference
└── VERCEL_DEPLOYMENT.md # This deployment guide
```

### CORS Configuration

The application automatically configures CORS based on environment:

- **Development**: Allows all origins (`*`)
- **Production**: Restricts to specified localhost ports

### Logging

- Console logs will appear in Vercel function logs
- Error logs are written to `logs/error.log` (may not persist in serverless environment)

## Troubleshooting

### Build Failures

1. Check Node.js version is set to 22.x
2. Ensure all environment variables are set correctly
3. Check build logs for missing dependencies

### Runtime Errors

1. Verify MongoDB connection string
2. Check Firebase service account credentials
3. Ensure all required environment variables are set

### Email Issues

1. Verify SMTP credentials
2. Check email templates are copied correctly during build
3. Ensure email server allows connections from Vercel IPs

### Database Connection Issues

1. Whitelist Vercel IPs in MongoDB Atlas
2. Check connection string format
3. Verify database user permissions

## Monitoring

Monitor our deployment through:

- **Vercel Dashboard**: Build logs, function logs, analytics
- **Application Logs**: Check function logs for Winston logger output
- **Database Monitoring**: MongoDB Atlas monitoring dashboard

## Security Considerations

1. **Environment Variables**: Never commit sensitive data to repository
2. **CORS**: Review and update CORS origins for production domains
3. **Rate Limiting**: Consider implementing rate limiting for production
4. **Database Security**: Use strong passwords and restrict database access

## Scaling

Vercel automatically scales our serverless functions. For heavy workloads:

1. Monitor function execution time (max 30s as configured)
2. Consider upgrading Vercel plan for higher limits
3. Optimize database queries for better performance

## Support

For deployment issues:

1. Check Vercel documentation
2. Review function logs in Vercel dashboard
3. Contact Vercel support if needed

---

**Note**: This deployment setup maintains all existing functionality while making the application compatible with Vercel's serverless environment. No existing files or functionality has been modified.
