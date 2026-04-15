# Remote Access Options

This app runs on a NAS on a local network. Because the backend communicates directly with the Daikin BRP15B61 device (`DAIKIN_HOST`), the backend must always remain on the local network. These options provide remote access to the app from outside the home.

---

## Options

### 1. Tailscale (easiest, recommended)

Install Tailscale on the NAS and your phone. It creates a private mesh VPN between your devices. The app is accessed at the NAS's Tailscale IP/hostname exactly as it is locally — no port forwarding, no static IP, no domain needed. Free tier is more than enough for personal use.

**Pros:** ~10 minutes to set up, zero network configuration, works seamlessly on mobile when switching between WiFi and cellular. Most NAS platforms (Synology, QNAP) have a native Tailscale package.

**Cons:** Requires installing Tailscale on every device you want to access from.

---

### 2. Cloudflare Tunnel

Add a `cloudflared` container to `docker-compose.yml`. It dials *out* to Cloudflare's network, creating a tunnel — no inbound port forwarding needed. You assign a public URL like `daikin.yourdomain.com` and Cloudflare routes traffic through the tunnel to the app. Cloudflare Access can be layered on top for authentication.

**Pros:** Clean public URL, works from any device without installing anything, handles TLS automatically, no static IP or port forwarding required.

**Cons:** Requires a Cloudflare account and a domain name (~$10/yr). Traffic routes via Cloudflare. Needs an auth layer added.

---

### 3. WireGuard VPN on the NAS/router

Many NAS platforms have native WireGuard support. Run a WireGuard server on the NAS or router and install the WireGuard app on your phone. Once connected, the phone is effectively on the home network.

**Pros:** Very secure (VPN handles auth), fast protocol, great on mobile (handles network switching gracefully), no external services.

**Cons:** More setup required (key exchange, config files). Needs either a static public IP or a DDNS service.

---

### 4. Port forwarding + DDNS + reverse proxy

Forward port 443 (or 8080) on the router to the NAS. Use a Dynamic DNS service (DuckDNS, No-IP, or the NAS's built-in DDNS) to get a stable hostname. Optionally add an Nginx Proxy Manager or Caddy container for HTTPS termination.

**Pros:** Full control, no third-party services beyond DDNS. Widely documented approach.

**Cons:** Most setup work, exposes the NAS directly to the internet, requires a static DHCP reservation for the NAS, and needs an auth layer added.

---

## Security Note

This app has **no authentication** — anyone who can reach it can control your heating. VPN-based options (Tailscale, WireGuard) handle this naturally since the VPN itself is the auth layer. URL-based options (Cloudflare Tunnel, port forwarding) expose a public endpoint and need authentication added separately:

- **Cloudflare Tunnel:** Use [Cloudflare Access](https://developers.cloudflare.com/cloudflare-one/policies/access/) (free for personal use)
- **Port forwarding:** Add HTTP basic auth via the reverse proxy (Nginx, Caddy)

---

## Recommendation

For a home NAS, **Tailscale** is the lowest-effort, most robust option. If you want a URL accessible from a browser without any app on the connecting device, **Cloudflare Tunnel + Cloudflare Access** is the cleanest approach.
