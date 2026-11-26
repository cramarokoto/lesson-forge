#!/usr/bin/env bash
# Fetch the official referential once and cache its text, page by page, for every agent.
# Usage: scripts/referential.sh <slug> <pdf-url>
# Writes work/<slug>/referential.txt with "=== page N ===" markers and the fetch date.
set -euo pipefail
slug="$1"; url="$2"; out="work/$slug/referential.txt"; tmp="$(mktemp -d)"
mkdir -p "work/$slug"
curl -sS -L -m 120 -o "$tmp/ref.pdf" "$url"
pages=$(pdfinfo "$tmp/ref.pdf" | awk '/^Pages:/{print $2}')
{ echo "source: $url"; echo "fetched: $(date -u +%F)"; echo "pages: $pages"
  for p in $(seq 1 "$pages"); do echo; echo "=== page $p ==="; pdftotext -layout -f "$p" -l "$p" "$tmp/ref.pdf" -; done; } > "$out"
rm -rf "$tmp"; echo "$out ($(wc -w < "$out") words)"
