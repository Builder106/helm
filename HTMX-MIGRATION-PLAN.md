# Helm: HTMX Migration Plan

This document outlines the strategy for migrating Helm's frontend from a React Single Page Application (SPA) to an HTMX-driven hypermedia architecture.

## 1. Architectural Shift
Currently, Helm splits the frontend (`/front`, React + Vite) and backend (`/back`). The backend serves JSON APIs, and the frontend maintains duplicate state to render the UI. 

In the new architecture:
- **Server-Side Rendering (SSR):** The backend will generate and return raw HTML fragments instead of JSON.
- **Hypermedia-Driven:** HTMX attributes (`hx-get`, `hx-post`, `hx-swap`) will handle DOM updates by replacing specific elements with the HTML returned from the server.
- **Lightweight Interactivity:** Alpine.js will replace React's local state for things like modal toggles, dropdowns, and client-side validation.

## 2. Phase 1: Backend Preparation
1. **Template Engine Selection:** Introduce a templating engine to the Node.js backend (e.g., EJS, Pug, or Nunjucks) to render HTML server-side.
2. **Endpoint Refactoring:** 
   - Identify all current JSON endpoints in `/back`.
   - Create parallel endpoints that return HTML fragments. For example, instead of returning `[{ "id": 1, "task": "OCR" }]`, return `<tr><td>1</td><td>OCR</td></tr>`.
3. **Data Fetching:** Shift all data fetching logic (currently in `useEffect` or React Query/SWR) to the backend route handlers.

## 3. Phase 2: Frontend Replacement
1. **Remove React & Vite:** Delete the existing React dependencies and Vite configuration from `/front`.
2. **Setup HTMX & Alpine.js:** Include `htmx.org` and `alpinejs` via CDN or npm in the base HTML template.
3. **Migrate Views to Templates:** 
   - Convert JSX components into server-side templates.
   - Replace React `onClick` and `onSubmit` handlers with `hx-post` and `hx-target`.
4. **Charts Migration:** Helm currently uses `react-chartjs-2`. This will be replaced with vanilla `Chart.js`, initialized via an Alpine.js component or a simple script tag that re-evaluates when HTMX swaps in the canvas element.

## 4. Phase 3: Consolidation
1. **Merge Codebases:** Move the HTML templates directly into the `/back` directory's structure, effectively merging the project into a single monolithic backend that serves the UI.
2. **Remove `/front`:** Delete the now-obsolete frontend directory.
3. **Update Build Scripts:** Modify `package.json` to reflect the simplified build process (no more `pnpm --filter "./front" build`).

## 5. Trade-offs & Considerations
- **Pros:** Massively reduced JavaScript bundle, no client-side state synchronization issues, simplified mental model (everything is on the server).
- **Cons:** Server must handle rendering overhead, slightly more latency for UI interactions that require a round-trip (mitigated by Alpine.js for optimistic UI).
