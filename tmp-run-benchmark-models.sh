#!/usr/bin/env bash
# Temporary: run full benchmark for several models (sequential). Edit MODELS, then:
#   ./tmp-run-benchmark-models.sh
# 3 iterations by default; add --scoring-only to the make line for rescoring only.

set -euo pipefail
cd "$(dirname "$0")"

MODELS=(
  "anthropic/claude-opus-4.6"
  "anthropic/claude-sonnet-4.6"
  "deepseek/deepseek-v3.2"
  "openai/gpt-5.4"
  "openai/gpt-5.4-mini"
  "google/gemini-3-flash-preview"
  "x-ai/grok-4-fast"
)

for m in "${MODELS[@]}"; do
  echo ""
  echo "========== benchmark: ${m} =========="
  make do-benchmark -- --scoring-only --model "$m"
done

echo ""
echo "+ All listed models finished."
