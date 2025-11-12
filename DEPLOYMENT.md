# SecureOn WebApp - Deployment Instructions

## Netlify Deployment

### Option 1: Automatic Deployment from GitHub

1. **Go to Netlify Dashboard**
   - Visit [https://netlify.com](https://netlify.com)
   - Log in to your Netlify account
   - Click "New site from Git"

2. **Connect to GitHub**
   - Choose "GitHub" as your provider
   - Authorize Netlify to access your repositories
   - Select `DevTergentes/secureOn-webapp` repository
   - Select the `main` branch

3. **Build Settings**
   - Build command: `npm run build`
   - Publish directory: `dist/secureon-webapp/browser`
   - Click "Deploy site"

### Option 2: Manual Deployment

1. **Build the project locally**
   ```bash
   npm install
   npm run build
   ```

2. **Upload to Netlify**
   - Go to [https://netlify.com/drop](https://netlify.com/drop)
   - Drag and drop the `dist/secureon-webapp/browser` folder
   - Your site will be deployed automatically

### Build Configuration

The project is configured with:
- `netlify.toml` - Netlify configuration file
- `src/_redirects` - Angular routing configuration for SPA
- Increased budget limits in `angular.json` for production builds

### Environment Variables

After deployment, you may need to configure environment variables in Netlify:
1. Go to your site settings
2. Navigate to "Environment variables"
3. Add any required API keys or configuration

### Custom Domain (Optional)

To use a custom domain:
1. In your Netlify site dashboard, go to "Domain settings"
2. Click "Add custom domain"
3. Follow the DNS configuration instructions

### Build Status

The application will automatically rebuild and redeploy when you push changes to the `main` branch.

## Local Development

```bash
npm install
npm start
```

The app will be available at `http://localhost:4200`

## API Integration

The app is configured to use:
- Railway backend: `https://secureon-backend-production.up.railway.app`
- Delivery-specific sensor data from: `/api/secureon/v1/records/delivery/{id}`

## Support

For deployment issues, check:
- Netlify build logs in your dashboard
- Browser console for any API connection issues
- Ensure CORS is configured on your Railway backend for your Netlify domain