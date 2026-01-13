import axios, { AxiosInstance } from 'axios';
import { logger } from '../utils/logger';

export interface LLMResponse {
  content: string;
  model: string;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

export interface LLMConfig {
  provider: 'openai' | 'ollama';
  apiKey?: string;
  model: string;
  baseUrl?: string;
  temperature?: number;
  maxTokens?: number;
}

export class LLMClient {
  private client: AxiosInstance;
  private config: LLMConfig;

  constructor(config: LLMConfig) {
    this.config = {
      temperature: 0.7,
      maxTokens: 1000,
      ...config,
    };

    const baseURL = this.getBaseUrl();
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (config.provider === 'openai' && config.apiKey) {
      headers['Authorization'] = `Bearer ${config.apiKey}`;
    }

    this.client = axios.create({
      baseURL,
      headers,
      timeout: 30000,
    });
  }

  private getBaseUrl(): string {
    if (this.config.baseUrl) {
      return this.config.baseUrl;
    }
    
    switch (this.config.provider) {
      case 'openai':
        return 'https://api.openai.com/v1';
      case 'ollama':
        return 'http://localhost:11434/v1';
      default:
        throw new Error(`Unsupported provider: ${this.config.provider}`);
    }
  }

  async complete(prompt: string): Promise<LLMResponse> {
    try {
      const requestData = {
        model: this.config.model,
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: this.config.temperature,
        max_tokens: this.config.maxTokens,
      };

      logger.debug('LLM request', {
        provider: this.config.provider,
        model: this.config.model,
        promptLength: prompt.length,
      });

      const response = await this.client.post('/chat/completions', requestData);

      const content = response.data.choices[0]?.message?.content;
      if (!content) {
        throw new Error('No content in LLM response');
      }

      const llmResponse: LLMResponse = {
        content,
        model: response.data.model,
        usage: response.data.usage,
      };

      logger.debug('LLM response', {
        model: llmResponse.model,
        contentLength: content.length,
        usage: llmResponse.usage,
      });

      return llmResponse;
    } catch (error: any) {
      logger.error('LLM completion error', {
        provider: this.config.provider,
        error: error.message,
        status: error.response?.status,
      });
      throw new Error(`LLM completion failed: ${error.message}`);
    }
  }

  async completeWithRetry(prompt: string, maxRetries = 3): Promise<LLMResponse> {
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await this.complete(prompt);
      } catch (error: any) {
        lastError = error;
        logger.warn(`LLM retry ${attempt}/${maxRetries}`, {
          error: error.message,
        });

        if (attempt < maxRetries) {
          await this.sleep(Math.pow(2, attempt) * 1000);
        }
      }
    }

    throw lastError || new Error('LLM completion failed after retries');
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

export default LLMClient;
