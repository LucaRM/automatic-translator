import axios from 'axios';
import { AIProvider, TranslationOptions, TranslationError, ErrorType } from '../types';

export class AnthropicProvider implements AIProvider {
  public name = 'Anthropic';
  private apiKey?: string;
  private model: string;
  private available = true;

  constructor(apiKey?: string, model: string = 'claude-3-haiku-20240307') {
    this.apiKey = apiKey;
    this.model = model;
  }

  isAvailable(): boolean {
    return this.available;
  }

  async translate(text: string, options: TranslationOptions): Promise<string> {
    if (!this.apiKey) {
      throw new TranslationError('Anthropic API key is required', ErrorType.API_ERROR, this.name);
    }

    try {
      const prompt = `Translate the following text from ${options.sourceLanguage || 'auto-detect'} to ${options.targetLanguage}. Only return the translation, no explanations:\n\n${text}`;
      
      const response = await axios.post(
        'https://api.anthropic.com/v1/messages',
        {
          model: this.model,
          max_tokens: 1024,
          messages: [
            {
              role: 'user',
              content: prompt
            }
          ]
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': this.apiKey,
            'anthropic-version': '2023-06-01'
          },
          timeout: 15000
        }
      );

      if (response.data?.content?.[0]?.text) {
        return response.data.content[0].text.trim();
      }

      throw new TranslationError('Invalid response from Anthropic', ErrorType.API_ERROR, this.name);
    } catch (error: any) {
      if (error.response?.status === 429) {
        this.available = false;
        throw new TranslationError('Rate limit exceeded', ErrorType.RATE_LIMIT, this.name);
      }
      if (error.response?.status === 401) {
        throw new TranslationError('Invalid API key', ErrorType.API_ERROR, this.name);
      }
      throw new TranslationError(
        error.message || 'Translation failed',
        ErrorType.API_ERROR,
        this.name
      );
    }
  }
}
