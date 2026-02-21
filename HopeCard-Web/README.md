# HopeCard-Web

Digital assistance card system — manages distribution and tracking of social welfare aid (food, medical, financial) to beneficiaries.

## Tech Stack

| Tool | Version | Purpose |
|------|---------|---------|
| React | 18.2 | UI library |
| Vite | 4.3 | Build tool & dev server |
| Vitest | 4.x | Unit testing (jsdom) |
| ESLint | 9.x | Linting (flat config) |
| @vitest/coverage-v8 | 4.x | Code coverage |

## Project Structure

```
HopeCard-Web/
├── index.html              # Entry HTML
├── vite.config.js          # Vite build config
├── vitest.config.ts        # Vitest test config
├── eslint.config.js        # ESLint flat config
├── package.json
├── src/
│   ├── main.jsx            # React root mount
│   ├── App.jsx             # App shell (Header + Home + Footer)
│   ├── App.css             # Global styles
│   ├── components/
│   │   ├── Header.jsx      # Navigation header
│   │   └── Footer.jsx      # Site footer
│   └── pages/
│       ├── Home.jsx        # Landing page
│       ├── About.jsx       # About page
│       └── NotFound.jsx    # 404 page
└── tests/
    └── ui.test.js          # Smoke tests
```

## Getting Started

```bash
# From the repo root
cd HopeCard-Web

# Install dependencies
npm install

# Start dev server (http://localhost:5173)
npm run dev

# Run tests with coverage
npm test

# Production build
npm run build

# Preview production build locally
npm run preview
```

## Available Scripts

| Script | Command | Description |
|--------|---------|-------------|
| `dev` | `vite` | Start dev server with HMR |
| `build` | `vite build` | Create production build in `dist/` |
| `preview` | `vite preview` | Serve production build locally |
| `test` | `vitest run --coverage` | Run tests with v8 coverage |

## Vercel Deployment

This project is deployed to Vercel as part of the monorepo CI/CD pipeline. See the root [README.md](../README.md) for full setup instructions.

- **UAT**: Deployed automatically when code reaches the `uat` branch
- **Production**: Deployed after PR approval to `main`
