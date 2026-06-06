# Tailscale Multiplayer Prototype

The multiplayer prototype runs one authoritative Colyseus room and a separate Phaser client. It is intended for private development playtests only. Room state is in memory and disappears when the server exits.

## Requirements

- Node.js 20 or newer
- `npm install`
- Tailscale installed and connected on every remote-play machine
- Tailnet ACLs and host firewalls that permit the configured client and server ports

The room secret prevents accidental joins. It is not production authentication. Share it separately from the browser join URL and do not commit it.

## Same-Machine Test

Start both services:

```sh
npm run dev:multiplayer
```

Defaults:

- Colyseus: `http://127.0.0.1:2567`
- Phaser client: `http://127.0.0.1:5173`
- Room secret: `dev-secret`

The server prints the active room ID and client join URL. Open that URL in two isolated browser contexts, enter the room secret in each, and join. The first connection receives `p1`; the second receives `p2`.

Both players must select **Ready** before **Start wave** is accepted. Build commands, wave simulation, resource changes, base health, rewards, and disconnect status come from the server.

Automated same-machine validation uses dynamic loopback ports:

```sh
npm run smoke:multiplayer
```

## Individual Services

Start only the authoritative server:

```sh
npm run dev:server
```

Start only the Phaser client:

```sh
npm run dev:client
```

The server exposes:

- `GET /health` for reachability checks
- `GET /config` for the current singleton room ID and advertised server endpoint

## Tailscale Host Setup

Find the hosting machine's Tailscale DNS name or IP:

```sh
tailscale status
tailscale ip -4
```

Choose a name or IP reachable by the other developer. Then configure both the Colyseus endpoint and Phaser client endpoint:

```sh
export KILLBOX_PUBLIC_URL=http://killbox-host:2567
export KILLBOX_CLIENT_PUBLIC_URL=http://killbox-host:5173
export KILLBOX_ROOM_SECRET='replace-with-a-private-value'
npm run dev:tailscale
```

`dev:tailscale` sets the server and client bind addresses to `0.0.0.0` unless explicitly overridden. It prints the active advertised endpoints, and the server prints the current room ID and join URL. Before binding, it reclaims its configured server and client ports, so a previous run that was force-killed and left an orphaned process will not block startup with a "port already in use" error.

### Hosting from a local env file (recommended)

To avoid exporting variables every session and to keep the room secret out of your shell history, copy `.env.example` to `.env` (which is gitignored), fill in this machine's Tailscale endpoints and a private secret, then run the mise task:

```sh
cp .env.example .env   # then edit the values
mise run play-tailscale
```

`play-tailscale` loads `.env` and runs `dev:tailscale`. The `.env` file holds `KILLBOX_PUBLIC_URL`, `KILLBOX_CLIENT_PUBLIC_URL`, and `KILLBOX_ROOM_SECRET`; it must never be committed.

Supported configuration:

- `KILLBOX_MODE=local|tailscale`
- `KILLBOX_SERVER_HOST` defaults to `127.0.0.1`, or `0.0.0.0` in Tailscale mode
- `KILLBOX_SERVER_PORT` defaults to `2567`
- `KILLBOX_PUBLIC_URL` is the Colyseus endpoint remote clients use
- `KILLBOX_CLIENT_HOST` defaults to `127.0.0.1`, or `0.0.0.0` in Tailscale mode
- `KILLBOX_CLIENT_PORT` defaults to `5173`
- `KILLBOX_CLIENT_PUBLIC_URL` is the Phaser client URL remote browsers open
- `KILLBOX_ROOM_SECRET` controls access to the development room

## Remote Join Flow

1. On the hosting machine, run `npm run dev:tailscale`.
2. Confirm the server prints the expected Tailscale-facing endpoints and a room ID.
3. From the remote machine, verify reachability:

   ```sh
   curl http://killbox-host:2567/health
   curl http://killbox-host:2567/config
   ```

4. Open the printed client join URL on both development machines.
5. Enter the shared room secret separately in both clients and join.
6. Verify distinct `p1` and `p2` slots, build a tower, ready both players, start a wave, and complete the wave.
7. Close one client and verify the other client shows its slot as disconnected.

If the Tailscale DNS name does not resolve, replace it in both public URLs with the host's Tailscale IPv4 address. If `/health` is unreachable, check Tailscale connectivity, ACLs, and the host firewall before debugging the game.

Stop the client and server with `Ctrl-C`. When all clients leave, the current room is disposed; requesting `/config` creates a fresh singleton room.

## Playing the Game

A couple of things are easy to miss once two players are connected:

- **Use the join URL the server prints, not the bare client URL.** The printed URL carries `?server=...&room=...` query parameters that auto-fill the Colyseus server and room fields. Opening `http://<host>:5173/` directly leaves the fields at their `127.0.0.1` defaults, which a remote player cannot reach. Only the room secret is entered by hand.
- **The room ID changes every time the server restarts.** Copy the fresh `Client join URL` from the `[server]` output after each start; an old room ID will not match the current singleton room.
- **Towers can only be built during the build phase.** The phase loop is `lobby → (both Ready) → build → (Start wave) → combat → reward → (Choose reward) → build → ...`. Build/upgrade/sell commands are rejected outside the build phase; `Cast volley` only works during combat; `Choose reward` only works in the reward phase and advances back to build.
- **There is no "restart" — the game runs continuous, escalating waves.** Each wave spawns more and tougher enemies, and it only ends on defeat (base health reaches 0). For a truly fresh game (wave 0, full base, starting supplies), restart the server (or have all clients disconnect to dispose the in-memory room), then rejoin the new room.
