'use strict';
'require fs';
'require uci';
'require view';

function execText(cmd, args) {
	return L.resolveDefault(fs.exec_direct(cmd, args || [], 'text'), '');
}

return view.extend({
	load: function() {
		return uci.load('zeroclaw');
	},

	render: function() {
		var uciSummary = E('div', { 'class': 'zc-mapping-grid' }, [ _('Loading UCI values...') ]);
		var tomlPreview = E('pre', { 'class': 'zc-console' }, [ _('Click Render to generate TOML preview from current UCI values.') ]);

		function currentValue(key, fallback) {
			var value = uci.get('zeroclaw', 'main', key);
			return (value != null && value !== '') ? value : fallback;
		}

		function updateUciSummary() {
			var mappings = [
				{ uci: 'enabled', toml: '(init script only)', value: currentValue('enabled', '0') },
				{ uci: 'provider', toml: 'default_provider', value: currentValue('provider', 'openrouter') },
				{ uci: 'model', toml: 'default_model', value: currentValue('model', '-') },
				{ uci: 'api_key', toml: 'api_key', value: currentValue('api_key', '') ? '******' : _('Missing') },
				{ uci: 'api_base', toml: 'api_url', value: currentValue('api_base', '') || _('Provider default') },
				{ uci: 'temperature', toml: 'default_temperature', value: currentValue('temperature', '0.7') },
				{ uci: 'host', toml: 'gateway.host', value: currentValue('host', '127.0.0.1') },
				{ uci: 'port', toml: 'gateway.port', value: currentValue('port', '42617') },
				{ uci: 'allow_public_bind', toml: 'gateway.allow_public_bind', value: currentValue('allow_public_bind', '0') === '1' ? 'true' : 'false' },
				{ uci: 'require_pairing', toml: 'gateway.require_pairing', value: currentValue('require_pairing', '1') === '1' ? 'true' : 'false' },
				{ uci: 'workspace', toml: '(env: ZEROCLAW_WORKSPACE, HOME)', value: currentValue('workspace', '/var/lib/zeroclaw') },
				{ uci: 'log_level', toml: '(env: RUST_LOG)', value: currentValue('log_level', 'info') },
				{ uci: 'observability_backend', toml: 'observability.backend', value: currentValue('observability_backend', 'log') },
				{ uci: 'runtime_trace_mode', toml: 'observability.runtime_trace_mode', value: currentValue('runtime_trace_mode', 'none') },
				{ uci: 'runtime_trace_path', toml: 'observability.runtime_trace_path', value: currentValue('runtime_trace_path', 'state/runtime-trace.jsonl') },
				{ uci: 'runtime_trace_max_entries', toml: 'observability.runtime_trace_max_entries', value: currentValue('runtime_trace_max_entries', '200') },
				{ uci: 'agent_max_tool_iterations', toml: 'agent.max_tool_iterations', value: currentValue('agent_max_tool_iterations', '10') },
				{ uci: 'agent_max_history_messages', toml: 'agent.max_history_messages', value: currentValue('agent_max_history_messages', '50') },
				{ uci: 'agent_parallel_tools', toml: 'agent.parallel_tools', value: currentValue('agent_parallel_tools', '0') === '1' ? 'true' : 'false' },
				{ uci: 'memory_backend', toml: 'memory.backend', value: currentValue('memory_backend', 'sqlite') },
				{ uci: 'memory_auto_save', toml: 'memory.auto_save', value: currentValue('memory_auto_save', '1') === '1' ? 'true' : 'false' }
			];

			uciSummary.innerHTML = '';
			mappings.forEach(function(m) {
				uciSummary.appendChild(E('div', { 'class': 'zc-mapping-row' }, [
					E('div', { 'class': 'zc-mapping-uci' }, [ E('strong', {}, [ m.uci ]) ]),
					E('div', { 'class': 'zc-mapping-arrow' }, [ '→' ]),
					E('div', { 'class': 'zc-mapping-toml' }, [ m.toml ]),
					E('div', { 'class': 'zc-mapping-value' }, [ m.value ])
				]));
			});
		}

		function renderToml() {
			tomlPreview.textContent = _('Rendering TOML from current UCI values...');
			return execText('/usr/libexec/zeroclaw/render-config.sh', []).then(function() {
				return execText('/bin/cat', [ '/etc/zeroclaw/config.toml' ]);
			}).then(function(output) {
				tomlPreview.textContent = (output || '').trim() || _('No rendered TOML output.');
			}).catch(function(err) {
				tomlPreview.textContent = _('TOML render failed: ') + err;
			});
		}

		updateUciSummary();

		return E('div', { 'class': 'zc-mapping-wrap' }, [
			E('style', {}, [
				'.zc-mapping-wrap{margin-top:16px;}' +
				'.zc-mapping-card{border:1px solid #e5e7eb;border-radius:8px;background:#fff;box-shadow:0 1px 3px rgba(0,0,0,.04);margin-bottom:16px;overflow:hidden;}' +
				'.zc-mapping-head{padding:12px 18px;border-bottom:1px solid #eef2f7;font-weight:600;color:#334155;background:#f8fafc;}' +
				'.zc-mapping-body{padding:16px 18px;}' +
				'.zc-mapping-desc{font-size:13px;color:#64748b;line-height:1.6;margin-bottom:12px;}' +
				'.zc-mapping-grid{display:grid;gap:8px;}' +
				'.zc-mapping-row{display:grid;grid-template-columns:minmax(180px,1fr) 40px minmax(200px,1.2fr) minmax(140px,1fr);gap:12px;padding:10px 12px;border:1px solid #eef2f7;border-radius:6px;background:#f8fafc;align-items:center;font-size:13px;}' +
				'.zc-mapping-uci{color:#334155;word-break:break-word;}' +
				'.zc-mapping-arrow{text-align:center;color:#94a3b8;font-weight:600;}' +
				'.zc-mapping-toml{color:#0f766e;font-family:monospace;word-break:break-word;}' +
				'.zc-mapping-value{color:#1e293b;font-family:monospace;word-break:break-word;}' +
				'.zc-console{margin:0;white-space:pre-wrap;max-height:32rem;overflow:auto;background:#111827;color:#dbe4f0;border-radius:6px;padding:14px 16px;line-height:1.6;}'
			]),
			E('div', { 'class': 'zc-mapping-card' }, [
				E('div', { 'class': 'zc-mapping-head' }, [ _('UCI to TOML Field Mapping') ]),
				E('div', { 'class': 'zc-mapping-body' }, [
					E('div', { 'class': 'zc-mapping-desc' }, [ _('This table shows how each UCI key in /etc/config/zeroclaw maps to the final TOML config or runtime environment. Fields marked with (env:...) or (init script only) do not appear directly in the generated TOML.') ]),
					uciSummary
				])
			]),
			E('div', { 'class': 'zc-mapping-card' }, [
				E('div', { 'class': 'zc-mapping-head' }, [ _('Rendered TOML Preview') ]),
				E('div', { 'class': 'zc-mapping-body' }, [
					E('div', { 'class': 'zc-mapping-desc' }, [ _('This preview is generated by /usr/libexec/zeroclaw/render-config.sh and reflects the current UCI values after Save & Apply. Use this to verify that your UCI changes produce the expected TOML output.') ]),
					E('div', {}, [
						E('button', {
							'class': 'btn cbi-button cbi-button-action',
							'click': ui.createHandlerFn(this, function() { return renderToml(); })
						}, [ _('Render TOML') ])
					]),
					E('div', { 'style': 'margin-top:16px' }, [ tomlPreview ])
				])
			])
		]);
	}
});
