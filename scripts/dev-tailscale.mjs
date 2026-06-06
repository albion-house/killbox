import { spawn, execFileSync } from "node:child_process";

const required = ["KILLBOX_PUBLIC_URL", "KILLBOX_CLIENT_PUBLIC_URL", "KILLBOX_ROOM_SECRET"];
const missing = required.filter((name) => !process.env[name]);
if (missing.length) {
  console.error(`Missing required Tailscale configuration: ${missing.join(", ")}`);
  console.error("See docs/tailscale-multiplayer.md for the complete setup.");
  process.exit(1);
}

const serverPort = Number(process.env.KILLBOX_SERVER_PORT ?? 2567);
const clientPort = Number(process.env.KILLBOX_CLIENT_PORT ?? 5173);

// Free the ports we are about to bind. A prior run that was force-killed can
// leave orphaned vite/tsx children listening, which otherwise fails startup
// with "port already in use". We host on fixed ports (the join URL points at
// them), so reclaiming them is preferable to silently moving to a new port.
function freePort(port) {
  let pids = "";
  try {
    pids = execFileSync("lsof", ["-ti", `tcp:${port}`, "-sTCP:LISTEN"], {
      encoding: "utf8",
    }).trim();
  } catch {
    return; // lsof exits non-zero when nothing is listening
  }
  for (const pid of pids.split(/\s+/).filter(Boolean)) {
    if (Number(pid) === process.pid) continue;
    try {
      process.kill(Number(pid), "SIGKILL");
      console.log(`[killbox] freed port ${port} (killed stale pid ${pid})`);
    } catch {
      // already gone
    }
  }
}

freePort(serverPort);
freePort(clientPort);

const env = {
  ...process.env,
  KILLBOX_MODE: "tailscale",
  KILLBOX_SERVER_HOST: process.env.KILLBOX_SERVER_HOST ?? "0.0.0.0",
  KILLBOX_CLIENT_HOST: process.env.KILLBOX_CLIENT_HOST ?? "0.0.0.0",
};

console.log(`[killbox] Tailscale Colyseus endpoint: ${env.KILLBOX_PUBLIC_URL}`);
console.log(`[killbox] Tailscale client URL: ${env.KILLBOX_CLIENT_PUBLIC_URL}`);
console.log("[killbox] The room ID is printed by the server. Share the room secret separately.");

const child = spawn("npm", ["run", "dev:multiplayer"], {
  env,
  stdio: "inherit",
});

for (const signal of ["SIGINT", "SIGTERM"]) {
  process.once(signal, () => child.kill(signal));
}

child.on("exit", (code) => process.exit(code ?? 0));
