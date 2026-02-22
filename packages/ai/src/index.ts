import Ollama from 'ollama';

export interface AIProvider {
  generate(prompt: string, options?: GenerateOptions): Promise<AIResponse>;
  chat(messages: ChatMessage[], options?: GenerateOptions): Promise<AIResponse>;
}

export interface GenerateOptions {
  model?: string;
  temperature?: number;
  maxTokens?: number;
  stream?: boolean;
}

export interface AIResponse {
  content: string;
  model: string;
  done: boolean;
}

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export type ProviderType = 'ollama' | 'openai' | 'anthropic';

export interface ProviderConfig {
  type: ProviderType;
  baseUrl?: string;
  apiKey?: string;
  defaultModel: string;
}

export class AIService {
  private provider: AIProvider;
  private defaultModel: string;

  constructor(config: ProviderConfig) {
    this.defaultModel = config.defaultModel;
    this.provider = this.createProvider(config);
  }

  private createProvider(config: ProviderConfig): AIProvider {
    switch (config.type) {
      case 'ollama':
        return new OllamaProvider(config.baseUrl || 'http://localhost:11434');
      case 'openai':
        return new OpenAIProvider(config.apiKey!, config.baseUrl);
      case 'anthropic':
        return new AnthropicProvider(config.apiKey!, config.baseUrl);
      default:
        throw new Error(`Unsupported provider: ${config.type}`);
    }
  }

  async generate(prompt: string, options?: GenerateOptions): Promise<AIResponse> {
    return this.provider.generate(prompt, {
      model: options?.model || this.defaultModel,
      ...options,
    });
  }

  async chat(messages: ChatMessage[], options?: GenerateOptions): Promise<AIResponse> {
    return this.provider.chat(messages, {
      model: options?.model || this.defaultModel,
      ...options,
    });
  }

  async generatePlan(userPrompt: string): Promise<PlanOutput> {
    const systemPrompt = `You are a helpful AI assistant that generates structured plans. 
Create a detailed plan with tasks based on the user's request.
Respond ONLY with valid JSON in this format:
{
  "title": "Plan Title",
  "description": "Brief description",
  "tasks": [
    { "title": "Task 1", "description": "Task description", "xpValue": 10 }
  ]
}`;

    const response = await this.chat(
      [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      { temperature: 0.7 }
    );

    try {
      return JSON.parse(response.content) as PlanOutput;
    } catch {
      throw new Error('Failed to parse AI response as PlanOutput');
    }
  }

  static fromEnv(): AIService {
    const baseUrl = process.env.OLLAMA_BASE_URL || 'http://localhost:11434';
    const model = process.env.AI_MODEL || 'mistral';
    const providerType = (process.env.AI_PROVIDER as ProviderType) || 'ollama';

    return new AIService({
      type: providerType,
      baseUrl,
      defaultModel: model,
    });
  }
}

class OllamaProvider implements AIProvider {
  private client: typeof Ollama;

  constructor(baseUrl: string) {
    this.client = Ollama;
  }

  async generate(prompt: string, options?: GenerateOptions): Promise<AIResponse> {
    const response = await this.client.generate({
      model: options?.model || 'mistral',
      prompt,
      options: {
        temperature: options?.temperature,
        num_predict: options?.maxTokens,
      },
    });
    return {
      content: response.response,
      model: response.model,
      done: response.done,
    };
  }

  async chat(messages: ChatMessage[], options?: GenerateOptions): Promise<AIResponse> {
    const response = await this.client.chat({
      model: options?.model || 'mistral',
      messages: messages as any,
      options: {
        temperature: options?.temperature,
        num_predict: options?.maxTokens,
      },
    });
    return {
      content: response.message.content,
      model: response.model,
      done: response.done,
    };
  }
}

class OpenAIProvider implements AIProvider {
  private apiKey: string;
  private baseUrl: string;

  constructor(apiKey: string, baseUrl?: string) {
    this.apiKey = apiKey;
    this.baseUrl = baseUrl || 'https://api.openai.com/v1';
  }

  async generate(prompt: string, options?: GenerateOptions): Promise<AIResponse> {
    throw new Error('OpenAI completion API not implemented');
  }

  async chat(messages: ChatMessage[], options?: GenerateOptions): Promise<AIResponse> {
    throw new Error('OpenAI chat API not implemented');
  }
}

class AnthropicProvider implements AIProvider {
  private apiKey: string;
  private baseUrl: string;

  constructor(apiKey: string, baseUrl?: string) {
    this.apiKey = apiKey;
    this.baseUrl = baseUrl || 'https://api.anthropic.com/v1';
  }

  async generate(prompt: string, options?: GenerateOptions): Promise<AIResponse> {
    throw new Error('Anthropic completion API not implemented');
  }

  async chat(messages: ChatMessage[], options?: GenerateOptions): Promise<AIResponse> {
    throw new Error('Anthropic messages API not implemented');
  }
}

export interface PlanOutput {
  title: string;
  description: string;
  tasks: {
    title: string;
    description: string;
    xpValue: number;
  }[];
}

export default AIService;
