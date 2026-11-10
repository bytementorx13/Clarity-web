# Clarity Web

Clarity is a modern client and project management dashboard for studios and agencies. It helps teams track active projects, deadlines, team allocations, payouts, and project details in a focused workspace.

## Features

- Overview dashboard with project statistics
- Client and project tracking
- Deadline monitoring for open projects
- Team and payout overview
- Add, edit, and complete project records
- Search and filter by project status
- Local API proxy for frontend-to-backend development

## Tech Stack

- React
- Vite
- JavaScript
- Lucide React icons
- Tailwind CSS (via Vite plugin)

## Project Structure

```text
clarity-web/
├── index.html
├── package.json
├── vite.config.js
├── src/
│   ├── main.jsx
│   └── styles.css
├── dist/
├── .gitignore
└── README.md
```

## Prerequisites

Before running the frontend locally, make sure you have:

- Node.js 18+
- npm or pnpm

## Installation

```bash
npm install
```

## Run locally

```bash
npm run dev
```

The app runs by default on:

```text
http://localhost:5173
```

## Backend integration

This frontend is configured to proxy API requests to the local backend:

```js
'/api': {
  target: 'http://localhost:8000',
  changeOrigin: true,
}
```

So requests such as `/api/v1/clients` are forwarded to the backend running on port `8000` during local development.

## Production environment

For deployment, set the API base URL in the frontend environment:

```bash
VITE_API_URL=https://your-backend-url.com
```

Then use that value in the frontend fetch calls instead of relying on the local proxy.

## Build for production

```bash
npm run build
```

The production build will be generated in the `dist/` folder.

## Preview production build locally

```bash
npm run preview
```

## Deployment

This frontend is intended to be deployed on Netlify or any static hosting platform that supports Vite builds.

Typical Netlify config:

- Build command: `npm run build`
- Publish directory: `dist`

## Notes

- The frontend repository is kept separate from the backend service.
- Do not commit backend files or environment secrets to this repo.
- Keep Firebase credentials and production secrets in the backend environment only.

## License

This project is for internal or personal use unless otherwise specified.
