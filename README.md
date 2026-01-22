# FNPulse - Financial News Portal

A modern financial news website with a powerful admin dashboard for content management.

## 🌐 Live Site

- **Production**: [Your Cloudflare Pages URL]
- **Admin Dashboard**: `http://localhost:3000` (local only)

## 📁 Project Structure

```
FNPulse/
├── News/                    # Public website (deployed to Cloudflare Pages)
│   ├── index.html          # Homepage
│   ├── article-*.html      # Article pages
│   ├── css/                # Stylesheets
│   ├── js/                 # JavaScript
│   └── img/                # Images
│
└── admin/                   # Admin dashboard (local only)
    ├── server.js           # Express server
    ├── views/              # EJS templates
    ├── utils/              # Utilities (parsers, generators)
    ├── data/               # Content & config storage
    └── public/             # Admin assets
```

## 🚀 Deployment Workflow

### Method: GitHub + Cloudflare Pages (Recommended)

1. **Make changes** in the admin dashboard
2. **Push to GitHub** - Click "Push to GitHub" button
3. **Auto-deploy** - Cloudflare Pages automatically deploys

**Setup Guide**: See [GITHUB_DEPLOYMENT_GUIDE.md](GITHUB_DEPLOYMENT_GUIDE.md)

## 🛠️ Local Development

### Prerequisites

- Node.js 14+ and npm
- Git

### Installation

```bash
# Clone repository
git clone https://github.com/YOUR_USERNAME/fnpulse.git
cd fnpulse

# Install dependencies
cd admin
npm install

# Start admin dashboard
npm start
```

The admin dashboard will be available at `http://localhost:3000`

## 📝 Admin Dashboard Features

- ✅ **Article Management** - Create, edit, publish articles
- ✅ **Rich Text Editor** - WYSIWYG & HTML mode
- ✅ **Author Profiles** - Manage author bios and social links
- ✅ **Ad Banner Management** - Control ad placements
- ✅ **Navigation Editor** - Customize site menus
- ✅ **Image Upload** - Manage media library
- ✅ **SEO Settings** - Meta titles, descriptions, OG tags
- ✅ **Site Updater** - Auto-update homepage & category pages
- ✅ **Git Integration** - One-click push to GitHub
- ✅ **Preview Mode** - Preview articles before publishing

## 🔧 Configuration

Configuration is stored in `admin/data/config.json`:

```json
{
  "siteName": "FNPulse",
  "siteUrl": "https://fnpulse.com",
  "deployment": {
    "github": {
      "repository": "https://github.com/username/fnpulse.git",
      "branch": "main"
    },
    "cloudflare": {
      "accountId": "your-account-id",
      "projectName": "fnpulse"
    }
  }
}
```

## 📦 Technologies

### Frontend (Public Site)
- HTML5, CSS3, JavaScript
- Bootstrap 5
- jQuery
- Slick Carousel

### Backend (Admin Dashboard)
- Node.js + Express
- EJS templating
- Cheerio (HTML parsing)
- Multer (file uploads)
- Git integration

### Hosting
- **Cloudflare Pages** - Public site
- **GitHub** - Version control & backup
- **Local** - Admin dashboard (security by design)

## 🔐 Security

- Admin dashboard runs **locally only** (not deployed)
- All content changes go through Git (version controlled)
- Sensitive files excluded via `.gitignore`
- No database required (file-based storage)

## 📚 Documentation

- [GitHub + Cloudflare Deployment Guide](GITHUB_DEPLOYMENT_GUIDE.md)
- [Admin Dashboard Setup](admin/README.md)

## 🤝 Contributing

This is a personal project, but suggestions are welcome!

1. Fork the repository
2. Create a feature branch (`git checkout -b feature-name`)
3. Commit changes (`git commit -m 'Add feature'`)
4. Push to branch (`git push origin feature-name`)
5. Open a Pull Request

## 📄 License

See [LICENSE.txt](News/LICENSE.txt)

## 👤 Author

**Jesus Guzman**
- Financial News Expert
- Website: [fnpulse.com](https://fnpulse.com)

---

Made with ❤️ for financial news enthusiasts
