#!/bin/sh
PORT=18080 /app/web/web &
/app/oauth2-proxy \
 --cookie-secret=$COOKIE_SECRET \
 --client-id=$CLIENT_ID \
 --client-secret=$CLIENT_SECRET \
 --email-domain='*' \
 --http-address=0.0.0.0:$PORT \
 --provider=github \
 --redirect-url=https://web-service-4t4b5whkda-uc.a.run.app/oauth2/callback \
 --scope=user:email \
 --upstream=http://127.0.0.1:18080
