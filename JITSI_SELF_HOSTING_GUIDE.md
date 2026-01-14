# Jitsi Self-Hosting Guide

## Why Self-Host?

The public Jitsi instance (meet.jit.si) has limitations:
- Cannot fully disable the "waiting for moderator" screen
- Shows "Log-in" prompt when room is empty
- Limited control over room configuration

**Self-hosting gives you:**
- ✅ Full control over room settings
- ✅ No "waiting for moderator" screen
- ✅ No login prompts
- ✅ First user auto-starts meeting
- ✅ Custom branding
- ✅ Better security and privacy

## Quick Setup Options

### Option 1: Docker (Recommended - Easiest)

```bash
# 1. Install Docker and Docker Compose
# 2. Create docker-compose.yml:

version: '3'

services:
  web:
    image: jitsi/web:latest
    restart: unless-stopped
    ports:
      - '${HTTP_PORT}:80'
      - '${HTTPS_PORT}:443'
    volumes:
      - ${CONFIG}/web:/config
      - ${CONFIG}/web/letsencrypt:/etc/letsencrypt
    environment:
      - ENABLE_LETSENCRYPT=${ENABLE_LETSENCRYPT}
      - ENABLE_HTTP_REDIRECT=${ENABLE_HTTP_REDIRECT}
      - ENABLE_WELCOME_PAGE=${ENABLE_WELCOME_PAGE}
      - JVB_HOSTNAME=${JVB_HOSTNAME}
      - JVB_PORT=${JVB_PORT}
      - JVB_MUC=none
      - JVB_BREWERY_MUC=none
      - JVB_AUTH_USER=focus
      - JVB_AUTH_PASS=${JVB_AUTH_PASS}
      - JVB_STUN_SERVERS=meet-jit-si-turnrelay.jitsi.net:443
      - JVB_ENABLE_APIS=xmpp,rest
      - PUBLIC_URL=${PUBLIC_URL}
      - XMPP_DOMAIN=${XMPP_DOMAIN}
      - XMPP_AUTH_DOMAIN=${XMPP_AUTH_DOMAIN}
      - XMPP_GUEST_DOMAIN=${XMPP_GUEST_DOMAIN}
      - XMPP_MUC_DOMAIN=${XMPP_MUC_DOMAIN}
      - XMPP_INTERNAL_MUC_DOMAIN=${XMPP_INTERNAL_MUC_DOMAIN}
      - XMPP_RECORDER_DOMAIN=${XMPP_RECORDER_DOMAIN}
      - XMPP_MODULES=${XMPP_MODULES}
      - XMPP_MUC_MODULES=${XMPP_MUC_MODULES}
      - XMPP_INTERNAL_MUC_MODULES=${XMPP_INTERNAL_MUC_MODULES}
      - XMPP_CROSS_DOMAIN=${XMPP_CROSS_DOMAIN}
      - ENABLE_RECORDING=${ENABLE_RECORDING}
      - ENABLE_TRANSCRIPTIONS=${ENABLE_TRANSCRIPTIONS}
      - ENABLE_LOBBY=${ENABLE_LOBBY}
      - ENABLE_PREJOIN_PAGE=${ENABLE_PREJOIN_PAGE}
      - ENABLE_WELCOME_PAGE=${ENABLE_WELCOME_PAGE}
      - ENABLE_CLOSE_PAGE=${ENABLE_CLOSE_PAGE}
      - ENABLE_NOISY_MIC_DETECTION=${ENABLE_NOISY_MIC_DETECTION}
      - ENABLE_BREAKOUT_ROOMS=${ENABLE_BREAKOUT_ROOMS}
      - ENABLE_MEETING_PASSWORD=${ENABLE_MEETING_PASSWORD}
      - LOG_LEVEL=${LOG_LEVEL}
      - DISABLE_HTTPS=${DISABLE_HTTPS}
      - JICOFO_ENABLE_MULTI_BRIDGE=${JICOFO_ENABLE_MULTI_BRIDGE}
      - JICOFO_BRIDGE_MUC=${JICOFO_BRIDGE_MUC}
      - JICOFO_ENABLE_HEALTH_CHECKS=${JICOFO_ENABLE_HEALTH_CHECKS}
      - JVB_ENABLE_APIS=${JVB_ENABLE_APIS}
      - JVB_ENABLE_STATS_ID=${JVB_ENABLE_STATS_ID}
      - JVB_STUN_SERVERS=${JVB_STUN_SERVERS}
      - JVB_ENABLE_COLIBRI_WEBSOCKET=${JVB_ENABLE_COLIBRI_WEBSOCKET}
      - ENABLE_SIMULCAST=${ENABLE_SIMULCAST}
      - ENABLE_REMB=${ENABLE_REMB}
      - ENABLE_TCC=${ENABLE_TCC}
      - CHANNEL_LAST_N=${CHANNEL_LAST_N}
      - START_AUDIO_MUTED=${START_AUDIO_MUTED}
      - START_VIDEO_MUTED=${START_VIDEO_MUTED}
      - TESTING_OCTO_PROBABILITY=${TESTING_OCTO_PROBABILITY}
      - TESTING_CAP_SCALE=${TESTING_CAP_SCALE}
      - XMPP_SERVER=${XMPP_SERVER}
    networks:
      - meet.jitsi

  prosody:
    image: jitsi/prosody:latest
    restart: unless-stopped
    volumes:
      - ${CONFIG}/prosody:/config
    environment:
      - AUTH_TYPE=${AUTH_TYPE}
      - ENABLE_AUTH=${ENABLE_AUTH}
      - ENABLE_GUESTS=${ENABLE_GUESTS}
      - ENABLE_LOBBY=${ENABLE_LOBBY}
      - ENABLE_LOBBY_PASSWORD=${ENABLE_LOBBY_PASSWORD}
      - ENABLE_LOBBY_WAITING_ROOM=${ENABLE_LOBBY_WAITING_ROOM}
      - ENABLE_LOBBY_WHITELIST=${ENABLE_LOBBY_WHITELIST}
      - ENABLE_LOBBY_BLACKLIST=${ENABLE_LOBBY_BLACKLIST}
      - ENABLE_LOBBY_LOGGING=${ENABLE_LOBBY_LOGGING}
      - ENABLE_PREJOIN_PAGE=${ENABLE_PREJOIN_PAGE}
      - ENABLE_WELCOME_PAGE=${ENABLE_WELCOME_PAGE}
      - ENABLE_CLOSE_PAGE=${ENABLE_CLOSE_PAGE}
      - ENABLE_NOISY_MIC_DETECTION=${ENABLE_NOISY_MIC_DETECTION}
      - ENABLE_BREAKOUT_ROOMS=${ENABLE_BREAKOUT_ROOMS}
      - ENABLE_MEETING_PASSWORD=${ENABLE_MEETING_PASSWORD}
      - GLOBAL_MODULES=${GLOBAL_MODULES}
      - LDAP_URL=${LDAP_URL}
      - LDAP_BASE=${LDAP_BASE}
      - LDAP_BINDDN=${LDAP_BINDDN}
      - LDAP_BINDPW=${LDAP_BINDPW}
      - LDAP_FILTER=${LDAP_FILTER}
      - LDAP_AUTH_METHOD=${LDAP_AUTH_METHOD}
      - LDAP_VERSION=${LDAP_VERSION}
      - LDAP_USE_TLS=${LDAP_USE_TLS}
      - LDAP_TLS_CIPHERS=${LDAP_TLS_CIPHERS}
      - LDAP_TLS_CHECK_PEER=${LDAP_TLS_CHECK_PEER}
      - LDAP_TLS_CACERT_FILE=${LDAP_TLS_CACERT_FILE}
      - LDAP_TLS_CACERT_DIR=${LDAP_TLS_CACERT_DIR}
      - LDAP_START_TLS=${LDAP_START_TLS}
      - XMPP_DOMAIN=${XMPP_DOMAIN}
      - XMPP_AUTH_DOMAIN=${XMPP_AUTH_DOMAIN}
      - XMPP_GUEST_DOMAIN=${XMPP_GUEST_DOMAIN}
      - XMPP_MUC_DOMAIN=${XMPP_MUC_DOMAIN}
      - XMPP_INTERNAL_MUC_DOMAIN=${XMPP_INTERNAL_MUC_DOMAIN}
      - XMPP_RECORDER_DOMAIN=${XMPP_RECORDER_DOMAIN}
      - XMPP_MODULES=${XMPP_MODULES}
      - XMPP_MUC_MODULES=${XMPP_MUC_MODULES}
      - XMPP_INTERNAL_MUC_MODULES=${XMPP_INTERNAL_MUC_MODULES}
      - XMPP_CROSS_DOMAIN=${XMPP_CROSS_DOMAIN}
      - JVB_AUTH_USER=${JVB_AUTH_USER}
      - JVB_AUTH_PASS=${JVB_AUTH_PASS}
      - JICOFO_AUTH_USER=${JICOFO_AUTH_USER}
      - JICOFO_AUTH_PASS=${JICOFO_AUTH_PASS}
      - JWT_APP_ID=${JWT_APP_ID}
      - JWT_APP_SECRET=${JWT_APP_SECRET}
      - JWT_ACCEPTED_ISSUERS=${JWT_ACCEPTED_ISSUERS}
      - JWT_ACCEPTED_AUDIENCES=${JWT_ACCEPTED_AUDIENCES}
      - JWT_ASAP_KEYSERVER=${JWT_ASAP_KEYSERVER}
      - JWT_ALLOW_EMPTY=${JWT_ALLOW_EMPTY}
      - JWT_AUTH_TYPE=${JWT_AUTH_TYPE}
      - JWT_TOKEN_AUTH_MODULE=${JWT_TOKEN_AUTH_MODULE}
      - LOG_LEVEL=${LOG_LEVEL}
    networks:
      - meet.jitsi

  jvb:
    image: jitsi/jvb:latest
    restart: unless-stopped
    ports:
      - '${JVB_PORT}:${JVB_PORT}/udp'
      - '${JVB_TCP_PORT}:${JVB_TCP_PORT}/tcp'
    volumes:
      - ${CONFIG}/jvb:/config
    environment:
      - DOCKER_HOST_ADDRESS=${DOCKER_HOST_ADDRESS}
      - XMPP_AUTH_DOMAIN=${XMPP_AUTH_DOMAIN}
      - XMPP_INTERNAL_MUC_DOMAIN=${XMPP_INTERNAL_MUC_DOMAIN}
      - XMPP_SERVER=${XMPP_SERVER}
      - JVB_AUTH_USER=${JVB_AUTH_USER}
      - JVB_AUTH_PASS=${JVB_AUTH_PASS}
      - JVB_STUN_SERVERS=${JVB_STUN_SERVERS}
      - JVB_ENABLE_APIS=${JVB_ENABLE_APIS}
      - JVB_ENABLE_STATS_ID=${JVB_ENABLE_STATS_ID}
      - JVB_ENABLE_COLIBRI_WEBSOCKET=${JVB_ENABLE_COLIBRI_WEBSOCKET}
      - ENABLE_SIMULCAST=${ENABLE_SIMULCAST}
      - ENABLE_REMB=${ENABLE_REMB}
      - ENABLE_TCC=${ENABLE_TCC}
      - CHANNEL_LAST_N=${CHANNEL_LAST_N}
      - LOG_LEVEL=${LOG_LEVEL}
    networks:
      - meet.jitsi

  jicofo:
    image: jitsi/jicofo:latest
    restart: unless-stopped
    volumes:
      - ${CONFIG}/jicofo:/config
    environment:
      - ENABLE_AUTH=${ENABLE_AUTH}
      - ENABLE_RECORDING=${ENABLE_RECORDING}
      - XMPP_DOMAIN=${XMPP_DOMAIN}
      - XMPP_AUTH_DOMAIN=${XMPP_AUTH_DOMAIN}
      - XMPP_INTERNAL_MUC_DOMAIN=${XMPP_INTERNAL_MUC_DOMAIN}
      - XMPP_SERVER=${XMPP_SERVER}
      - JICOFO_AUTH_USER=${JICOFO_AUTH_USER}
      - JICOFO_AUTH_PASS=${JICOFO_AUTH_PASS}
      - JICOFO_ENABLE_HEALTH_CHECKS=${JICOFO_ENABLE_HEALTH_CHECKS}
      - JICOFO_RESERVATION_REST_BASE_URL=${JICOFO_RESERVATION_REST_BASE_URL}
      - ENABLE_SCTP=${ENABLE_SCTP}
      - TZ=${TZ}
      - LOG_LEVEL=${LOG_LEVEL}
    networks:
      - meet.jitsi

networks:
  meet.jitsi:
    external: true
```

### Option 2: Quick Deploy (8x8.vc, Jitsi Cloud)

Use a managed Jitsi service:
- **8x8.vc** - Free tier available
- **Jitsi Cloud** - Managed hosting
- **DigitalOcean Jitsi Droplet** - One-click deploy

### Option 3: Manual Installation

Follow official Jitsi installation guide:
https://jitsi.github.io/handbook/docs/devops-guide/devops-guide-quickstart

## Configuration for Your Use Case

Once self-hosted, update your `.env`:

```env
# In api/.env
JITSI_DOMAIN=meet.yourdomain.com  # Your self-hosted domain
JITSI_APP_ID=onementor
```

And in your Jitsi config files, set:

```javascript
// In Jitsi config
configOverwrite: {
  enableLobby: false,        // Disable lobby/waiting room
  prejoinPageEnabled: false, // Skip prejoin page
  requireDisplayName: false, // No login required
}
```

## Current Workaround (Public Instance)

For now, with the public instance, the login prompt will appear when the room is empty. Once someone joins, others can join immediately.

**The configuration I've added (`enableLobby: false`) should help, but full control requires self-hosting.**

Would you like me to:
1. Set up a Docker-based self-hosting solution?
2. Provide detailed configuration files?
3. Keep the current setup and document the limitation?
