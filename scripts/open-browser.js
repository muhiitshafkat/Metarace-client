#!/usr/bin/env node
/**
 * Waits until the Next.js dev server answers on localhost, then opens the
 * default browser once. Zero dependencies (built-in http + child_process).
 *
 * Config via env:
 *   OPEN_URL       full URL to open (overrides PORT)   default: http://localhost:3000
 *   PORT           port to poll/open                    default: 3000
 *   OPEN_TIMEOUT   give up after this many ms           default: 60000
 *   NO_OPEN=1      skip opening (useful for CI/headless)
 */
const http = require("http");
const { spawn } = require("child_process");

const PORT = process.env.PORT || "3000";
const URL = process.env.OPEN_URL || `http://localhost:${PORT}`;
const TIMEOUT = Number(process.env.OPEN_TIMEOUT || 60000);
const INTERVAL = 500;

// This script runs under `concurrently -k`, which kills sibling processes
// (the API + Next dev server) as soon as ANY process exits. So once our work
// is done we must NOT exit — we idle quietly until concurrently tears the
// whole group down on Ctrl-C.
function idleForever() {
  // Keep the event loop alive without doing anything.
  setInterval(() => {}, 1 << 30);
}

if (process.env.NO_OPEN === "1") {
  console.log("[open-browser] NO_OPEN=1 set — skipping.");
  idleForever();
  return;
}

function openBrowser(url) {
  const platform = process.platform;
  let cmd;
  let args;
  if (platform === "darwin") {
    cmd = "open";
    args = [url];
  } else if (platform === "win32") {
    // `start` is a cmd builtin; empty "" is the window-title arg.
    cmd = "cmd";
    args = ["/c", "start", "", url];
  } else {
    cmd = "xdg-open";
    args = [url];
  }
  try {
    const child = spawn(cmd, args, { stdio: "ignore", detached: true });
    child.on("error", (err) => {
      console.warn(`[open-browser] could not launch browser (${err.message}). Open ${url} manually.`);
    });
    child.unref();
  } catch (err) {
    console.warn(`[open-browser] could not launch browser (${err.message}). Open ${url} manually.`);
  }
}

function ping() {
  return new Promise((resolve) => {
    const req = http.get(URL, (res) => {
      res.resume(); // drain
      resolve(true);
    });
    req.on("error", () => resolve(false));
    req.setTimeout(INTERVAL, () => {
      req.destroy();
      resolve(false);
    });
  });
}

(async () => {
  const start = Date.now();
  console.log(`[open-browser] waiting for ${URL} ...`);
  // eslint-disable-next-line no-constant-condition
  while (true) {
    if (await ping()) {
      console.log(`[open-browser] ${URL} is up — opening browser.`);
      openBrowser(URL);
      idleForever();
      return;
    }
    if (Date.now() - start > TIMEOUT) {
      console.warn(`[open-browser] timed out after ${TIMEOUT}ms waiting for ${URL}. Not opening.`);
      idleForever();
      return;
    }
    await new Promise((r) => setTimeout(r, INTERVAL));
  }
})();
