# Deployment Guide for Simple ID Generator

This guide covers deploying the Simple ID Generator on Netlify and Vercel for free.

## Prerequisites

- GitHub account (for both platforms)
- Push your code to a GitHub repository
- Netlify or Vercel account (free tier)

## Netlify Deployment

### Step 1: Prepare for Netlify

1. Create a `netlify` folder in your project root
2. Create `netlify/functions/face.js` for the proxy function:

```javascript
exports.handler = async (event, context) => {
  // Only allow GET requests
  if (event.httpMethod !== 'GET') {
    return {
      statusCode: 405,
      body: 'Method Not Allowed'
    };
  }

  try {
    const response = await fetch('https://thispersondoesnotexist.com/', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const buffer = await response.arrayBuffer();
    const base64 = Buffer.from(buffer).toString('base64');

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'image/jpeg',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Access-Control-Allow-Origin': '*'
      },
      body: base64,
      isBase64Encoded: true
    };
  } catch (error) {
    console.error('Error fetching face:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Failed to fetch face image' })
    };
  }
};
```

3. Create `netlify.toml` in your project root:

```toml
[build]
  publish = "."

[[headers]]
  for = "/*"
  [headers.values]
    X-Frame-Options = "DENY"
    X-Content-Type-Options = "nosniff"
    X-XSS-Protection = "1; mode=block"

[[redirects]]
  from = "/api/face"
  to = "/.netlify/functions/face"
  status = 200
```

4. Update `js/dataGenerator.js` to use the new endpoint:

```javascript
// Change line 127 from:
const response = await fetch('/api/face');
// To:
const response = await fetch('/.netlify/functions/face');
```

### Step 2: Deploy to Netlify

1. Go to [netlify.com](https://netlify.com) and sign in
2. Click "Add new site" → "Import an existing project"
3. Connect your GitHub account and select your repository
4. Configure build settings:
   - Build command: (leave empty)
   - Publish directory: `.`
5. Click "Deploy site"

Your site will be live at `https://[your-site-name].netlify.app`

## Vercel Deployment

### Step 1: Prepare for Vercel

1. Create an `api` folder in your project root
2. Create `api/face.js` for the serverless function:

```javascript
export default async function handler(req, res) {
  // Only allow GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const response = await fetch('https://thispersondoesnotexist.com/', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const buffer = await response.arrayBuffer();
    
    res.setHeader('Content-Type', 'image/jpeg');
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Access-Control-Allow-Origin', '*');
    
    res.send(Buffer.from(buffer));
  } catch (error) {
    console.error('Error fetching face:', error);
    res.status(500).json({ error: 'Failed to fetch face image' });
  }
}
```

3. Create `vercel.json` in your project root:

```json
{
  "rewrites": [
    { "source": "/api/face", "destination": "/api/face" }
  ],
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "X-Content-Type-Options",
          "value": "nosniff"
        },
        {
          "key": "X-Frame-Options",
          "value": "DENY"
        },
        {
          "key": "X-XSS-Protection",
          "value": "1; mode=block"
        }
      ]
    }
  ]
}
```

### Step 2: Deploy to Vercel

1. Go to [vercel.com](https://vercel.com) and sign in
2. Click "Add New..." → "Project"
3. Import your GitHub repository
4. Configure project settings:
   - Framework Preset: Other
   - Root Directory: `./`
   - Build Command: (leave empty)
   - Output Directory: (leave empty)
5. Click "Deploy"

Your site will be live at `https://[your-project-name].vercel.app`

## Important Notes

### File Structure After Setup

```
simple-id-generator/
├── index.html
├── server.js (not used in deployment)
├── package.json
├── netlify.toml (for Netlify)
├── vercel.json (for Vercel)
├── js/
│   └── ... (your JS files)
├── styles/
│   └── main.css
├── netlify/
│   └── functions/
│       └── face.js (for Netlify)
└── api/
    └── face.js (for Vercel)
```

### Limitations on Free Tiers

**Netlify Free Tier:**
- 100GB bandwidth/month
- 300 build minutes/month
- 125,000 serverless function requests/month

**Vercel Free Tier (Hobby):**
- 100GB bandwidth/month
- 100GB-hours serverless function execution
- Unlimited static requests

### Troubleshooting

1. **CORS Issues**: Both configurations include CORS headers. If you still face issues, check browser console.

2. **Function Timeouts**: 
   - Netlify: 10 seconds default
   - Vercel: 10 seconds default
   
3. **Face API Rate Limiting**: thispersondoesnotexist.com may rate limit. Consider adding retry logic or caching.

4. **Build Failures**: Ensure you've committed all necessary files including the serverless functions.

### Environment Variables

Neither deployment requires environment variables for basic functionality. If you add features requiring secrets:

- **Netlify**: Site settings → Environment variables
- **Vercel**: Project settings → Environment Variables

### Custom Domain

Both platforms support custom domains on free tiers:

- **Netlify**: Domain settings → Add custom domain
- **Vercel**: Project settings → Domains

## Quick Deploy Buttons

Add these to your README for one-click deploys:

### Deploy to Netlify
```markdown
[![Deploy to Netlify](https://www.netlify.com/img/deploy/button.svg)](https://app.netlify.com/start/deploy?repository=https://github.com/YOUR_USERNAME/YOUR_REPO)
```

### Deploy to Vercel
```markdown
[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/YOUR_USERNAME/YOUR_REPO)
```

Replace `YOUR_USERNAME/YOUR_REPO` with your actual GitHub repository path.