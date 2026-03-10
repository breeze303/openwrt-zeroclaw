#!/bin/sh

set -eu

UCI_PATH="zeroclaw.main"
OUT_DIR="/etc/zeroclaw"
OUT_FILE="$OUT_DIR/config.toml"
WORKSPACE_DIR="${ZEROCLAW_RENDER_WORKSPACE:-$(uci -q get ${UCI_PATH}.workspace 2>/dev/null || printf '/var/lib/zeroclaw')}"
WORKSPACE_CONFIG="$WORKSPACE_DIR/config.toml"

get_opt() {
	local key="$1"
	local default="${2-}"
	uci -q get "$UCI_PATH.$key" 2>/dev/null || printf '%s' "$default"
}

bool_opt() {
	case "$(get_opt "$1" "$2")" in
		1|true|yes|on) printf 'true' ;;
		*) printf 'false' ;;
	esac
}

toml_escape() {
	printf '%s' "$1" | sed 's/\\/\\\\/g; s/"/\\"/g'
}

append_string() {
	local key="$1"
	local value="$2"
	[ -n "$value" ] || return 0
	printf '%s = "%s"\n' "$key" "$(toml_escape "$value")" >> "$TMP_FILE"
}

append_bool() {
	local key="$1"
	local value="$2"
	printf '%s = %s\n' "$key" "$value" >> "$TMP_FILE"
}

append_int() {
	local key="$1"
	local value="$2"
	[ -n "$value" ] || return 0
	printf '%s = %s\n' "$key" "$value" >> "$TMP_FILE"
}

append_float() {
	local key="$1"
	local value="$2"
	[ -n "$value" ] || return 0
	printf '%s = %s\n' "$key" "$value" >> "$TMP_FILE"
}

mkdir -p "$OUT_DIR" "$WORKSPACE_DIR"

HOST="$(get_opt host '127.0.0.1')"
PORT="$(get_opt port '42617')"
ALLOW_PUBLIC_BIND="$(bool_opt allow_public_bind 0)"
REQUIRE_PAIRING="$(bool_opt require_pairing 1)"
PROVIDER="$(get_opt provider 'openrouter')"
MODEL="$(get_opt model '')"
API_BASE="$(get_opt api_base '')"
API_KEY="$(get_opt api_key '')"
TEMPERATURE="$(get_opt temperature '0.7')"
OBS_BACKEND="$(get_opt observability_backend 'log')"
TRACE_MODE="$(get_opt runtime_trace_mode 'none')"
TRACE_PATH="$(get_opt runtime_trace_path 'state/runtime-trace.jsonl')"
TRACE_MAX_ENTRIES="$(get_opt runtime_trace_max_entries '200')"
AGENT_MAX_TOOL_ITERATIONS="$(get_opt agent_max_tool_iterations '10')"
AGENT_MAX_HISTORY_MESSAGES="$(get_opt agent_max_history_messages '50')"
AGENT_PARALLEL_TOOLS="$(bool_opt agent_parallel_tools 0)"
MEMORY_BACKEND="$(get_opt memory_backend 'sqlite')"
MEMORY_AUTO_SAVE="$(bool_opt memory_auto_save 1)"
TMP_FILE="$(mktemp /tmp/zeroclaw-config.XXXXXX)"
trap 'rm -f "$TMP_FILE"' EXIT INT TERM

append_string "default_provider" "$PROVIDER"
append_string "default_model" "$MODEL"
append_string "api_key" "$API_KEY"
append_string "api_url" "$API_BASE"
append_float "default_temperature" "$TEMPERATURE"

printf '[gateway]\n' >> "$TMP_FILE"
printf 'host = "%s"\n' "$(toml_escape "$HOST")" >> "$TMP_FILE"
printf 'port = %s\n' "$PORT" >> "$TMP_FILE"
printf 'allow_public_bind = %s\n' "$ALLOW_PUBLIC_BIND" >> "$TMP_FILE"
printf 'require_pairing = %s\n' "$REQUIRE_PAIRING" >> "$TMP_FILE"

printf '[observability]\n' >> "$TMP_FILE"
append_string "backend" "$OBS_BACKEND"
append_string "runtime_trace_mode" "$TRACE_MODE"
append_string "runtime_trace_path" "$TRACE_PATH"
append_int "runtime_trace_max_entries" "$TRACE_MAX_ENTRIES"

printf '[agent]\n' >> "$TMP_FILE"
append_int "max_tool_iterations" "$AGENT_MAX_TOOL_ITERATIONS"
append_int "max_history_messages" "$AGENT_MAX_HISTORY_MESSAGES"
append_bool "parallel_tools" "$AGENT_PARALLEL_TOOLS"

printf '[memory]\n' >> "$TMP_FILE"
append_string "backend" "$MEMORY_BACKEND"
append_bool "auto_save" "$MEMORY_AUTO_SAVE"

cp "$TMP_FILE" "$OUT_FILE"
mv "$TMP_FILE" "$WORKSPACE_CONFIG"
trap - EXIT INT TERM

exit 0
