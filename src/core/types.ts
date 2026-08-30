export interface ProviderConfig {
    model?: string;
    timeout?: number;
    extraArgs?: string;
}

export interface AIResponse {
    success: boolean;
    data?: string;
    error?: string;
}

export interface AIProvider {
    generate(prompt: string, config?: ProviderConfig): Promise<AIResponse>;
}
