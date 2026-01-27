export interface TranslationOptions {
  targetLanguage: string;
  sourceLanguage?: string;
  chunkSize?: number;
  specificProvider?: string; // If set, only use this provider (no fallback)
}

export interface AIProvider {
  name: string;
  translate(text: string, options: TranslationOptions): Promise<string>;
  isAvailable(): boolean;
}

export interface TranslationResult {
  translatedText: string;
  provider: string;
  chunks: number;
}

export enum ErrorType {
  RATE_LIMIT = 'RATE_LIMIT',
  API_ERROR = 'API_ERROR',
  NETWORK_ERROR = 'NETWORK_ERROR',
  UNKNOWN = 'UNKNOWN'
}

export class TranslationError extends Error {
  constructor(
    message: string,
    public type: ErrorType,
    public provider?: string
  ) {
    super(message);
    this.name = 'TranslationError';
  }
}
