import { spawn } from 'child_process';
import type { AIProvider, ProviderConfig, AIResponse } from '../core/types';
import type { AISettings } from '../settings';

/**
 * Splits a user-supplied argument string into argv, honouring quoted segments.
 * Kept deliberately simple: the CLI is spawned without a shell, so the only
 * job here is to let users write `--flag "two words"` in settings.
 */
function parseArgs(raw: string): string[] {
    const matches = raw.match(/"[^"]*"|'[^']*'|\S+/g);
    if (!matches) return [];
    return matches.map(arg => {
        const quoted = /^"(.*)"$/.exec(arg) ?? /^'(.*)'$/.exec(arg);
        return quoted ? quoted[1] : arg;
    });
}

export class CliProvider implements AIProvider {
    constructor(private settings: AISettings) {}

    async generate(prompt: string, config?: ProviderConfig): Promise<AIResponse> {
        const command = this.settings.cliPath.trim();
        if (!command) {
            return { success: false, error: 'No AI CLI path configured.' };
        }

        const timeout = config?.timeout ?? this.settings.timeout ?? 30000;
        const model = config?.model ?? this.settings.model;
        const args = parseArgs(config?.extraArgs ?? this.settings.extraArgs);
        if (model) args.push('--model', model);

        return new Promise<AIResponse>(resolve => {
            // shell: false — the command and args are user-configured paths, not
            // a shell expression. Avoids quoting/injection issues on Windows.
            const child = spawn(command, args, { shell: false });

            let stdout = '';
            let stderr = '';
            let settled = false;

            const finish = (result: AIResponse) => {
                if (settled) return;
                settled = true;
                clearTimeout(timer);
                resolve(result);
            };

            const timer = setTimeout(() => {
                child.kill();
                finish({ success: false, error: `AI CLI timed out after ${timeout}ms.` });
            }, timeout);

            child.stdout.on('data', chunk => { stdout += String(chunk); });
            child.stderr.on('data', chunk => { stderr += String(chunk); });

            child.on('error', err => {
                finish({ success: false, error: `Failed to start AI CLI: ${err.message}` });
            });

            child.on('close', code => {
                if (code === 0) {
                    finish({ success: true, data: stdout.trim() });
                } else {
                    finish({ success: false, error: stderr.trim() || `AI CLI exited with code ${code}.` });
                }
            });

            child.stdin.on('error', () => { /* ignore EPIPE if the CLI exits early */ });
            child.stdin.write(prompt);
            child.stdin.end();
        });
    }
}
