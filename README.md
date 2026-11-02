# 🏇 MetaRace

A live, interactive web app (a browser game with a marketplace and player profiles) that we're actively improving. This guide gets it running on your own machine so you can explore the real pages and flows — the look and feel is what we'd love a designer's eye on.

You don't need to be an engineer. If you use an AI coding tool, it can help with any setup step.

---

## Prerequisites

**1. A code editor / AI coding tool.** If you don't already use one, install **[VS Code](https://code.visualstudio.com/)** or **[Cursor](https://cursor.com/)**. You'll open the project folder and a terminal inside it.

**2. Node.js.** Install a current **LTS release (v20 or newer)** from **[nodejs.org](https://nodejs.org/)**.

**3. A modern browser** — Chrome, Firefox, or Edge.

---

## Run it

1. **Open the project.** In VS Code or Cursor: **File → Open Folder…** and select this project folder.
2. **Open the terminal:** **View → Terminal** (or `` Ctrl + ` ``). Commands you type there run in the project folder.
3. **Check Node is installed:**
   ```bash
   node -v
   npm -v
   ```
   Both should print a version number. If not, install Node from [nodejs.org](https://nodejs.org/) and reopen the terminal.
4. **Install dependencies** (first time, and after pulling changes):
   ```bash
   npm install
   ```
5. **Start the app** (runs the API and the frontend together):
   ```bash
   npm start
   ```
   Leave this terminal open while you use the app. If port `3000` is busy, run `npm run dev:3002` instead.
6. **Open it in your browser:** **http://localhost:3000** (the API runs on `http://localhost:4000`). Connect a wallet — a demo/test wallet is fine — to reach the full UI, then click through the pages.

> **No `.env` or Supabase setup needed.** This is a UI/UX design pass — every page and component is reviewable with just `npm install` + `npm start`, no backend credentials or database required. The optional keys in the developer section below only power live data and transactions; they don't affect the look, layout, or flow you're here to review. If the terminal shows an error, copy the full message and paste it to your AI coding tool, or send it to us.

---

## What we'd love your eye on

Walk the product like a real user and note specific, page-level things — the page, the element, what feels off, and what you'd do:

- **Landing / marketing** — first impression, hierarchy, spacing, the path into the app
- **Race / game UI** — readability, and the loading / transition states around a race
- **Connect & funds flows** — clarity, and the error / empty / rejected states
- **Profile & navigation** — layout, consistency, and mobile / tablet responsiveness
- **Everywhere** — loading / empty / success / error states, alignment, typography, colour consistency

There's no design system yet, so there's real room to shape the visual language. Send back specific per-page observations, what you'd change and how, and a rough scope — that's how we land on a fair plan together.

---

## For developers (optional)

- **Full run with environment:** `cp .env.example .env` and fill in your values (`SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `JWT_SECRET`, `REACT_APP_RPC_URL`, token address, reward wallet key). Never commit `.env` — it's gitignored.
- **Production-style local run:** `npm run start:prod`.
- **Contract deployment:** see [`contracts/DEPLOY_GUIDE.md`](contracts/DEPLOY_GUIDE.md).

---

MIT — see LICENSE.
