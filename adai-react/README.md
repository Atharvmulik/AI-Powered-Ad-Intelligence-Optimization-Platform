# AdAI Intelligence Hub (Vite + React 19 + Tailwind CSS)

Welcome to the production-ready AdAI Intelligence Hub. The codebase has been optimized for size, performance, proper state boundaries, and modular structure.

## Technical Architecture & Folder Structure

```text
adai-react/
├── .env.example                    # Environment variable template
├── .env.development                # Dev default configuration
├── index.html                      # Root HTML with favicon & theme-color
├── package.json                    # Re-organized dependencies & custom scripts
├── vite.config.js                  # Alias resolution, manual chunk splitting & compression options
├── public/
│   ├── favicon.svg                 # App Icon
│   └── icons.svg                   # Navigation/KPI Icons
└── src/
    ├── main.jsx                    # Root execution entrypoint
    ├── App.jsx                     # Suspense lazy routes, contexts, and global ErrorBoundary
    ├── index.css                   # Global styles & Tailwind definitions
    ├── assets/                     # Shared static media asset directories
    ├── components/
    │   ├── layout/                 # Layout structure (Layout, Sidebar, TopBar)
    │   ├── common/                 # Shared widgets (ErrorBoundary, LoadingSpinner, KpiCard)
    │   └── dashboard/              # Isolated Dashboard widget items (Charts, Maps, Logs)
    ├── context/                    # Centralized React Context (AuthContext)
    ├── hooks/                      # Custom hooks (useAuth, useInterval)
    ├── constants/                  # Application constants (navigation config, initial mock streams)
    ├── utils/                      # Standard formatting and parsing utilities (formatters)
    ├── pages/                      # Cleaned page orchestrators
    └── styles/                     # Component-extracted CSS sheets (landing, auth)
```

## Setup & Running Locally

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Configure Environment Variables**
   Copy the example environment file:
   ```bash
   cp .env.example .env.local
   ```
   Set your dev API URLs inside `.env.local`.

3. **Launch Dev Server**
   ```bash
   npm run dev
   ```

4. **Production Build & Preview**
   ```bash
   # Compiles manual split chunks
   npm run build
   
   # Run the production bundle locally
   npm run preview
   ```

## Optimization Features

- **Route Lazy Loading:** Pages are chunk-split and loaded dynamically as the user navigates, minimizing the initial payload size.
- **Rollup Manual Chunks:** Large third-party packages (`react`, `recharts`, `framer-motion`) are bundled into separate vendor chunks so the browser can cache them independently.
- **Memory-Safe Hooks:** All live-updating intervals on the Dashboard utilize `useInterval` to prevent memory leaks on component unmounting.
- **Robust Error Handling:** Key widgets and the root App are wrapped in class-based `ErrorBoundary` structures to display useful reload fallbacks if rendering fails.
- **Context-based Auth:** User session is synchronized inside `AuthContext` to prevent raw `localStorage` reads on every render.
- **Bundle Visualization:** Run `npm run build:analyze` to trigger the `vite-bundle-visualizer` and examine exact chunk weightings.
