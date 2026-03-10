'use strict';
'require form';
'require uci';
'require view';

return view.extend({
	load: function() {
		return uci.load('zeroclaw');
	},

	render: function() {
		var m, s, o;

		m = new form.Map('zeroclaw', _('ZeroClaw Settings'), _('Configure the ZeroClaw runtime and provider-related options.'));

		m.description = _('This page exposes the full UCI-backed ZeroClaw settings. For first-time setup, you can start in the Onboarding page; for ongoing maintenance, use this page to fine-tune runtime behavior.');

		s = m.section(form.NamedSection, 'main', 'zeroclaw', _('Basic Settings'));
		s.anonymous = true;
		s.description = _('These options control how the ZeroClaw daemon listens, where it stores runtime state, and whether it should be enabled by default.');

		o = s.option(form.Flag, 'enabled', _('Enable'));
		o.rmempty = false;
		o.description = _('Enable or disable the service in UCI. The init script only starts ZeroClaw when this option is enabled.');

		o = s.option(form.Value, 'host', _('Listen host'));
		o.datatype = 'ipaddr("nomask")';
		o.placeholder = '127.0.0.1';
		o.rmempty = false;
		o.description = _('Recommended default: 127.0.0.1. Change this only if you intentionally want to expose the service beyond localhost.');

		o = s.option(form.Value, 'port', _('Listen port'));
		o.datatype = 'port';
		o.placeholder = '42617';
		o.rmempty = false;
		o.description = _('Daemon listen port. Make sure it does not conflict with other local services.');

		o = s.option(form.Flag, 'allow_public_bind', _('Allow public bind'));
		o.rmempty = false;
		o.description = _('Keep this disabled unless you have reviewed the exposure risk and really want binding beyond localhost.');

		o = s.option(form.Flag, 'require_pairing', _('Require pairing'));
		o.rmempty = false;
		o.description = _('Controls the upstream gateway pairing requirement. Keep this enabled unless you have a deliberate reason to relax gateway authentication flow.');

		o = s.option(form.Value, 'workspace', _('Workspace'));
		o.placeholder = '/var/lib/zeroclaw';
		o.rmempty = false;
		o.description = _('Recommended default: /var/lib/zeroclaw. This path is used as HOME and as the rendered workspace state directory.');

		o = s.option(form.ListValue, 'log_level', _('Log level'));
		[ 'trace', 'debug', 'info', 'warn', 'error' ].forEach(function(level) {
			o.value(level);
		});
		o.default = 'info';
		o.description = _('Recommended default: info. Use debug or trace temporarily while diagnosing issues.');

		s = m.section(form.NamedSection, 'main', 'zeroclaw', _('Model Runtime Defaults'));
		s.anonymous = true;
		s.description = _('These values control the default runtime model behavior written into the generated ZeroClaw config.');

		o = s.option(form.Value, 'temperature', _('Default temperature'));
		o.datatype = 'ufloat';
		o.placeholder = '0.7';
		o.description = _('Upstream default model temperature. Typical values are between 0.0 and 2.0.');

		s = m.section(form.NamedSection, 'main', 'zeroclaw', _('Provider Settings'));
		s.anonymous = true;
		s.description = _('These options feed the package renderer and become part of the generated ZeroClaw runtime TOML configuration.');

		o = s.option(form.Value, 'provider', _('Provider'));
		o.placeholder = 'openrouter';
		o.rmempty = false;
		o.description = _('Example values: openrouter, openai, anthropic. Keep provider and model aligned.');

		o = s.option(form.Value, 'api_base', _('API base URL'));
		o.placeholder = 'https://api.example.com/v1';
		o.description = _('Optional override for the upstream API endpoint. Leave empty when the provider default is sufficient.');

		o = s.option(form.Value, 'model', _('Model'));
		o.placeholder = 'anthropic/claude-sonnet-4-6';
		o.description = _('Set the default model to be written into the generated runtime config.');

		o = s.option(form.Value, 'api_key', _('API key'));
		o.password = true;
		o.rmempty = true;
		o.description = _('Provider credential used by the generated config. Avoid sharing screenshots or backups with this value exposed.');

		s = m.section(form.NamedSection, 'main', 'zeroclaw', _('Observability Settings'));
		s.anonymous = true;
		s.description = _('These options control lightweight runtime visibility and trace capture. Keep them conservative on small OpenWrt devices.');

		o = s.option(form.ListValue, 'observability_backend', _('Observability backend'));
		[ 'none', 'noop', 'log', 'prometheus', 'otel', 'opentelemetry', 'otlp' ].forEach(function(mode) {
			o.value(mode);
		});
		o.default = 'log';
		o.description = _('Recommended default here is log. OTel-related backends are upstream-supported but may be excessive for many router deployments.');

		o = s.option(form.ListValue, 'runtime_trace_mode', _('Runtime trace mode'));
		[ 'none', 'rolling', 'full' ].forEach(function(mode) {
			o.value(mode);
		});
		o.default = 'none';
		o.description = _('Runtime traces are useful for debugging tool/model failures, but may contain sensitive content.');

		o = s.option(form.Value, 'runtime_trace_path', _('Runtime trace path'));
		o.placeholder = 'state/runtime-trace.jsonl';
		o.description = _('Relative paths are resolved under the ZeroClaw workspace.');

		o = s.option(form.Value, 'runtime_trace_max_entries', _('Runtime trace max entries'));
		o.datatype = 'uinteger';
		o.placeholder = '200';
		o.description = _('Used when runtime trace mode is set to rolling.');

		s = m.section(form.NamedSection, 'main', 'zeroclaw', _('Agent Loop Settings'));
		s.anonymous = true;
		s.description = _('These settings tune the upstream agent loop budget and history limits. Larger values may increase cost, latency, and memory usage.');

		o = s.option(form.Value, 'agent_max_tool_iterations', _('Max tool iterations'));
		o.datatype = 'uinteger';
		o.placeholder = '10';
		o.description = _('Maximum tool-call loop turns per user message.');

		o = s.option(form.Value, 'agent_max_history_messages', _('Max history messages'));
		o.datatype = 'uinteger';
		o.placeholder = '50';
		o.description = _('Conversation history retention limit per session.');

		o = s.option(form.Flag, 'agent_parallel_tools', _('Enable parallel tools'));
		o.rmempty = false;
		o.description = _('Allow the upstream runtime to execute independent tool calls concurrently where supported.');

		s = m.section(form.NamedSection, 'main', 'zeroclaw', _('Memory Settings'));
		s.anonymous = true;
		s.description = _('These settings cover the upstream memory backend and whether user-stated facts are persisted automatically.');

		o = s.option(form.ListValue, 'memory_backend', _('Memory backend'));
		[ 'sqlite', 'lucid', 'markdown', 'none' ].forEach(function(mode) {
			o.value(mode);
		});
		o.default = 'sqlite';
		o.description = _('Recommended default: sqlite.');

		o = s.option(form.Flag, 'memory_auto_save', _('Enable memory auto save'));
		o.rmempty = false;
		o.description = _('Persist user-stated inputs automatically through the selected upstream memory backend.');

		return m.render();
	}
});
