import { AutomaticTranslator, GeminiProvider, OpenAIProvider } from './dist';

async function example() {
  // Example with default free providers
  const translator = new AutomaticTranslator();

  // Example 1: Simple translation
  console.log('Example 1: Simple translation (free providers)');
  const result1 = await translator.translate('Hello world!', {
    targetLanguage: 'es'
  });
  console.log(`Original: "Hello world!"`);
  console.log(`Translated: "${result1.translatedText}"`);
  console.log(`Provider: ${result1.provider}`);
  console.log();

  // Example 2: Long text with chunking
  console.log('Example 2: Long text with chunking');
  const longText = `
    The quick brown fox jumps over the lazy dog. This is a longer text that will be 
    automatically chunked into smaller pieces for translation. The system will break 
    it down at sentence boundaries to maintain context and readability. Each chunk 
    will be translated separately and then reassembled into the complete translated text.
  `;
  
  const result2 = await translator.translate(longText, {
    targetLanguage: 'fr',
    sourceLanguage: 'en'
  });
  console.log(`Chunks used: ${result2.chunks}`);
  console.log(`Provider: ${result2.provider}`);
  console.log(`Translated text: ${result2.translatedText}`);
  console.log();

  // Example 3: Check available providers
  console.log('Example 3: Available providers');
  const available = translator.getAvailableProviders();
  console.log('Available providers:', available);
  console.log();

  // Example 4: Using AI models (requires API keys - uncomment to use)
  console.log('Example 4: Using AI models (commented - requires API keys)');
  console.log('Uncomment the code below and add your API keys to test:');
  console.log('/*');
  console.log('const aiTranslator = new AutomaticTranslator([');
  console.log("  new GeminiProvider('your-gemini-api-key'),");
  console.log("  new OpenAIProvider('your-openai-api-key', 'gpt-3.5-turbo')");
  console.log(']);');
  console.log("const result = await aiTranslator.translate('Hello!', { targetLanguage: 'es' });");
  console.log('*/');
}

example().catch(console.error);
