import axios from 'axios';
import { AIProvider, TranslationOptions, TranslationError, ErrorType } from '../types';

export class GeminiProvider implements AIProvider {
  public name = 'Gemini';
  private apiKey?: string;
  private available = true;

  constructor(apiKey?: string) {
    this.apiKey = apiKey;
  }

  isAvailable(): boolean {
    return this.available;
  }

  async translate(text: string, options: TranslationOptions): Promise<string> {
    if (!this.apiKey) {
      throw new TranslationError('Gemini API key is required', ErrorType.API_ERROR, this.name);
    }

    try {
      const prompt = `Translate the following text from ${options.sourceLanguage || 'auto-detect'} to ${options.targetLanguage}. Only return the translation, no explanations:\n\n${text}`;
      
      const response = await axios.post(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${this.apiKey}`,
        {
          contents: [{
            parts: [{
              text: prompt
            }]
          }]
        },
        {
          headers: { 'Content-Type': 'application/json' },
          timeout: 15000
        }
      );

      if (response.data?.candidates?.[0]?.content?.parts?.[0]?.text) {
        return response.data.candidates[0].content.parts[0].text.trim();
      }

      throw new TranslationError('Invalid response from Gemini', ErrorType.API_ERROR, this.name);
    } catch (error: any) {
      if (error.response?.status === 429) {
        this.available = false;
        throw new TranslationError('Rate limit exceeded', ErrorType.RATE_LIMIT, this.name);
      }
      if (error.response?.status === 401 || error.response?.status === 403) {
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
