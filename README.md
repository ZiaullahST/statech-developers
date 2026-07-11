# STATECH Engineering Team Website

A professional corporate website with a **team-only admin dashboard** for editing site content, managing services, team members, and contact messages.

## Features

- **Public website** — Home, About, Team, Services, Contact pages
- **Multilingual support** — English, Persian (Farsi), Pashto with RTL
- **Fully responsive** — Mobile, tablet, and desktop layouts
- **Team-only admin** — Login-protected dashboard at `/admin`
- **Content management** — Edit homepage, about page, services, team, testimonials, and site settings
- **Contact form** — Submissions saved and viewable in admin
- **Team access control** — Admins can add/remove team member accounts

## Multilingual Support

The website is fully available in **three languages**:

| Language | Code | Script | Direction |
|----------|------|--------|-----------|
| **English** | `en` | Latin | LTR |
| **دری (Dari)** | `fa` | Arabic/Persian script | RTL |
| **پښتو (Pashto)** | `ps` | Arabic/Pashto script | RTL |

Use the language switcher in the navigation bar on any page. Your choice is saved automatically.

Translation files live in `assets/i18n/`:
- `en.json` — English
- `fa.json` — Dari (Afghan Persian)
- `ps.json` — Pashto

To edit translations, update the JSON files directly. All page content — navigation, headings, forms, FAQs, services, and footer — is translated.

## Quick Start

### Run locally (ready to use)

**Windows:** Double-click `start.bat`

**Or from terminal:**
```bash
npm install
npm start
```

| URL | Purpose |
|-----|---------|
| http://localhost:3000 | Public website |
| http://localhost:3000/login | Team admin login |
| http://localhost:3000/admin | Admin dashboard |

**Default login:** `admin@statech.com` / `changeme123` — change after first sign-in.

See **[DEPLOY.md](DEPLOY.md)** for Docker, Render, and cloud hosting instructions.

### Configure environment

## Project Structure

```
statech-website/
├── server/
│   ├── index.js          # Express server, API routes, auth
│   ├── auth.js           # Auth middleware
│   ├── users.js          # User management
│   └── db.js             # JSON file storage
├── data/
│   ├── content.json      # Website content (editable via admin)
│   └── messages.json     # Contact form submissions
├── index.html            # Homepage
├── about.html
├── team.html
├── services.html
├── contact.html
├── login.html            # Team login (not in public nav)
├── admin.html            # Protected admin dashboard
├── assets/
│   ├── css/
│   ├── js/
│   │   ├── main.js           # i18n, navigation, contact form
│   │   ├── content-loader.js # Loads CMS content on public pages
│   │   └── admin.js          # Admin dashboard logic
│   └── i18n/
├── package.json
└── .env.example
```

## Admin Dashboard

| Section | What you can edit |
|---------|-------------------|
| **Dashboard** | Overview stats and recent messages |
| **Site Content** | Homepage hero, stats, about text, testimonials |
| **Services** | Add, edit, or remove service offerings |
| **Team** | Leadership and engineering team members |
| **Messages** | View and manage contact form submissions |
| **Team Access** | Add/remove admin accounts (admin role only) |
| **Settings** | Site name, contact info, change your password |

## Default Login

On first run, a default admin account is created from `.env`:

- Email: value of `ADMIN_EMAIL` (default: `admin@statech.com`)
- Password: value of `ADMIN_PASSWORD` (default: `changeme123`)

**Change the default password immediately after first login.**

## Adding Team Members

1. Sign in as an admin
2. Go to **Team Access**
3. Click **Add Team Member**
4. Set name, email, password, and role (Editor or Admin)

Editors can edit content and view messages. Admins can also manage team access.

## Deployment

This site requires Node.js hosting (not plain static hosting) because of the backend API and authentication.

**Recommended platforms:** Railway, Render, Fly.io, DigitalOcean App Platform, or any VPS with Node.js.

1. Set environment variables (`SESSION_SECRET`, `ADMIN_EMAIL`, `ADMIN_PASSWORD`, `NODE_ENV=production`)
2. Run `npm start`
3. Ensure `data/` directory is writable (for content and messages persistence)

For production, use a persistent volume or migrate to a database for `data/` files.

## Development

```bash
npm run dev   # Starts server with auto-reload (--watch)
```

## Technologies

- HTML5, Bootstrap 5.3, CSS3, JavaScript (ES6+)
- Node.js, Express, express-session, bcryptjs
- JSON file storage (no database required for small teams)

---

**Built for the STATECH Engineering Team**
