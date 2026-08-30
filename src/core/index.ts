import type { AIProvider, ProviderConfig, AIResponse } from './types';

export * from './types';

/**
 * Provider-neutral entry point. Features depend only on this, never on a
 * concrete provider, so adding an API-backed provider later needs no changes
 * outside src/providers/.
 */
export class ProviderCore {
    constructor(private provider: AIProvider) {}

    /** Swaps the backing provider in place when settings change, so features
     *  holding this instance always dispatch through the current config. */
    setProvider(provider: AIProvider): void {
        this.provider = provider;
    }

    async generate(prompt: string, config?: ProviderConfig): Promise<AIResponse> {
        return this.provider.generate(prompt, config);
    }
}
