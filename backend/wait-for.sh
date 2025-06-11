#!/bin/sh

hostport="$1"
shift

host=$(echo "$hostport" | cut -d: -f1)
port=$(echo "$hostport" | cut -d: -f2)

echo "Warte auf $host:$port..."

while ! nc -z "$host" "$port"; do
  sleep 1
done

echo "$host:$port ist erreichbar — starte..."

exec "$@"