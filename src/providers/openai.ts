import axios from 'axios';
import { AIProvider, TranslationOptions, TranslationError, ErrorType } from '../types';

export class OpenAIProvider implements AIProvider {
  public name = 'OpenAI';
  private apiKey?: string;
  private model: string;
  private available = true;

  constructor(apiKey?: string, model: string = 'gpt-3.5-turbo') {
    this.apiKey = apiKey;
    this.model = model;
  }

  isAvailable(): boolean {
    return this.available;
  }

  async translate(text: string, options: TranslationOptions): Promise<string> {
    if (!this.apiKey) {
      throw new TranslationError('OpenAI API key is required', ErrorType.API_ERROR, this.name);
    }

    try {
      const prompt = `Translate the following text from ${options.sourceLanguage || 'auto-detect'} to ${options.targetLanguage}. Only return the translation, no explanations:\n\n${text}`;
      
      const response = await axios.post(
        'https://api.openai.com/v1/chat/completions',
        {
          model: this.model,
          messages: [
            {
              role: 'system',
              content: 'You are a professional translator. Translate text accurately and only return the translation.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          temperature: 0.3
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.apiKey}`
          },
          timeout: 15000
        }
      );

      if (response.data?.choices?.[0]?.message?.content) {
        return response.data.choices[0].message.content.trim();
      }

      throw new TranslationError('Invalid response from OpenAI', ErrorType.API_ERROR, this.name);
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
