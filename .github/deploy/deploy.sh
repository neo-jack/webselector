#!/bin/sh
set -eu

: "${GHCR_USER:?GHCR_USER is required}"
: "${GHCR_TOKEN:?GHCR_TOKEN is required}"
: "${DEPLOY_IMAGE:?DEPLOY_IMAGE is required}"

CONTAINER_NAME=101my-aitool
APP_NETWORK=100my-page-network
previous="${CONTAINER_NAME}-previous"
saved=false
created=false
was_running=false
committed=false
registry_config=$(mktemp -d)

finish() {
    result=$?
    trap - EXIT HUP INT TERM
    if [ "$committed" = false ]; then
        if [ "$created" = true ]; then docker rm -f "$CONTAINER_NAME" || true; fi
        if [ "$saved" = true ]; then
            docker rename "$previous" "$CONTAINER_NAME" || true
            if [ "$was_running" = true ]; then docker start "$CONTAINER_NAME" || true; fi
        fi
    fi
    rm -rf "$registry_config"
    exit "$result"
}
trap finish EXIT
trap 'exit 143' HUP INT TERM

if docker container inspect "$previous" >/dev/null 2>&1; then
    echo "An unhandled rollback backup exists: $previous" >&2
    exit 1
fi
printf '%s' "$GHCR_TOKEN" | docker --config "$registry_config" login ghcr.io -u "$GHCR_USER" --password-stdin
docker --config "$registry_config" pull "$DEPLOY_IMAGE"
docker run --rm --network none "$DEPLOY_IMAGE" nginx -t
if ! docker network inspect "$APP_NETWORK" >/dev/null 2>&1; then
    docker network create "$APP_NETWORK"
fi

if docker container inspect "$CONTAINER_NAME" >/dev/null 2>&1; then
    was_running=$(docker inspect --format '{{.State.Running}}' "$CONTAINER_NAME")
    docker rename "$CONTAINER_NAME" "$previous"
    saved=true
    docker stop "$previous"
fi
docker create --name "$CONTAINER_NAME" --restart=unless-stopped \
    --network "$APP_NETWORK" --network-alias ai-tool \
    --log-driver json-file --log-opt max-size=5m --log-opt max-file=2 "$DEPLOY_IMAGE"
created=true
docker start "$CONTAINER_NAME"

attempt=0
healthy=false
while [ "$attempt" -lt 45 ]; do
    state=$(docker inspect --format '{{.State.Health.Status}}' "$CONTAINER_NAME" 2>/dev/null || true)
    if [ "$state" = healthy ]; then healthy=true; break; fi
    if [ "$state" = unhealthy ]; then break; fi
    attempt=$((attempt + 1))
    sleep 2
done
if [ "$healthy" != true ]; then
    echo 'AItool failed its health check; restoring the previous container.' >&2
    exit 1
fi

committed=true
if [ "$saved" = true ]; then docker rm "$previous"; fi
echo "AItool deployment is healthy: $DEPLOY_IMAGE"
