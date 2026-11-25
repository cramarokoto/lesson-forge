#!/usr/bin/env bash
# Scan a skill folder with NVIDIA SkillSpector before installing it (CLAUDE.md rule 9).
# Usage: scripts/scan-skill.sh <skill-dir> [--llm]
# Needs SkillSpector installed (https://github.com/NVIDIA/SkillSpector). Static scan by default;
# --llm adds the semantic stage (needs an API key). A clean result is not proof of safety.
set -euo pipefail
dir="$1"; shift || true
mode=(--no-llm); [ "${1:-}" = "--llm" ] && mode=()
command -v skillspector >/dev/null || { echo "skillspector not installed" >&2; exit 2; }
skillspector scan "$dir" "${mode[@]}" --format json --output "${dir%/}.skillspector.json"
echo "report: ${dir%/}.skillspector.json"
