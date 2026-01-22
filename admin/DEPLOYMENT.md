# Cloudflare Pages Deployment Guide

## Quick Setup

This admin tool now includes one-click deployment to Cloudflare Pages! Follow these steps to configure it:

### 1. Create a Cloudflare Pages Project

1. Log in to your [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. Go to **Workers & Pages**
3. Click **Create application** → **Pages** → **Connect to Git** (or **Direct Upload**)
4. Create a project named `fnpulse` (or your preferred name)

### 2. Get Your Account ID

1. In the Cloudflare dashboard, go to **Workers & Pages**
2. Look for your **Account ID** in the right sidebar
3. Copy this ID (looks like: `abc123def456...`)

### 3. Create an API Token

1. Click your profile icon (top right) → **My Profile**
2. Go to **API Tokens** tab
3. Click **Create Token**
4. Use the **Edit Cloudflare Workers** template
5. Configure permissions:
   - **Account** → **Cloudflare Pages** → **Edit**
6. Click **Continue to summary** → **Create Token**
7. **Copy the token immediately** (you won't see it again!)

### 4. Configure the Admin Tool

1. Open the admin dashboard
2. Go to **Settings** (⚙️)
3. Scroll to **Cloudflare Pages Deployment** section
4. Fill in:
   - **Account ID**: Your Cloudflare account ID
   - **Project Name**: Your Pages project name (e.g., `fnpulse`)
   - **API Token**: The API token you just created
5. Click **Save Settings**

### 5. Deploy Your Site

1. Go back to the **Dashboard**
2. Click **Deploy to CF** (🚀) button
3. Wait for the deployment to complete
4. Your site will be live at: `https://fnpulse.pages.dev`

## Deployment Methods

The admin tool supports two deployment methods:

### Method 1: Wrangler CLI (Default)
- Uses the official Cloudflare CLI tool
- Requires Wrangler to be installed globally: `npm install -g wrangler`
- Login with: `wrangler login`
- Faster and more reliable

### Method 2: Direct API Upload
- Uses Cloudflare's Pages API directly
- No additional installation required
- Creates a zip file and uploads it
- Good fallback if Wrangler isn't available

To change the method, edit the `deploySite()` function in `dashboard.ejs`:
```javascript
body: JSON.stringify({ method: 'wrangler' }) // or 'api'
```

## What Gets Deployed?

The deployment process:
1. Copies the entire `/News` folder to a temporary `/deploy` directory
2. Packages it as `deploy.zip` (for API method) or deploys directly (for Wrangler)
3. Uploads to Cloudflare Pages
4. Returns the deployment URL

## Troubleshooting

### "Wrangler not found"
Install Wrangler globally:
```bash
npm install -g wrangler
wrangler login
```

### "Unauthorized" or "Invalid token"
- Check that your API token has the correct permissions
- Make sure you copied the token correctly (no extra spaces)
- Token must have **Cloudflare Pages - Edit** permission

### "Project not found"
- Verify the project name matches exactly (case-sensitive)
- Make sure the project exists in your Cloudflare dashboard
- The project must be in the account matching your Account ID

### "Deployment failed"
- Check your internet connection
- Verify all credentials are correct in Settings
- Try the alternative deployment method (API vs Wrangler)
- Check the admin console logs for detailed error messages

## Custom Domains

To use a custom domain:
1. Deploy your site using the admin tool
2. Go to Cloudflare Pages dashboard
3. Select your project → **Custom domains**
4. Add your domain (e.g., `fnpulse.com`)
5. Follow Cloudflare's DNS setup instructions

## Automatic Deployments

For continuous deployment:
1. Connect your GitHub repository to Cloudflare Pages
2. Set the **Build output directory** to `/News`
3. Every push to main will automatically deploy
4. Use the admin tool for manual/immediate deployments

## Security Notes

- **API Token**: Keep your API token secure! It has write access to your Cloudflare account.
- **config.json**: Do not commit `config.json` if it contains your API token
- Consider using environment variables for production deployments
- Rotate your API tokens periodically

## Additional Resources

- [Cloudflare Pages Docs](https://developers.cloudflare.com/pages/)
- [Wrangler CLI Docs](https://developers.cloudflare.com/workers/wrangler/)
- [Cloudflare API Docs](https://api.cloudflare.com/)
