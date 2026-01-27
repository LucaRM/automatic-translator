#!/usr/bin/env node

const axios = require('axios');

const API_URL = process.env.TRANSLATE_API_URL || 'http://localhost:3008';

// Colors for terminal output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  blue: '\x1b[34m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m'
};

function showHelp() {
  console.log(`
${colors.cyan}Translation CLI${colors.reset}
Usage: node translate-cli.js [options] <text> <targetLanguage>

${colors.yellow}Options:${colors.reset}
  --provider <name>    Use specific translation provider
  --source <lang>      Source language (auto-detect if omitted)
  --list              List all available providers
  --help              Show this help message

${colors.yellow}Examples:${colors.reset}
  node translate-cli.js "Hello world" es
  node translate-cli.js "Hello world" es --source en
  node translate-cli.js "Bonjour" en --provider Gemini
  node translate-cli.js --list

${colors.yellow}Available Providers:${colors.reset}
  Free: MyMemory, LibreTranslate, HuggingFace, Lingva, GoogleTranslate, Yandex
  Premium (need API keys): Gemini, OpenAI, Anthropic, Groq, DeepL
`);
}

async function listProviders() {
  try {
    console.log(`${colors.cyan}Fetching providers...${colors.reset}\n`);
    
    const response = await axios.get(`${API_URL}/providers/all`);
    const { providers, total, available } = response.data;

    console.log(`${colors.green}Total Providers: ${total}${colors.reset}`);
    console.log(`${colors.green}Available: ${available}${colors.reset}\n`);

    providers.forEach(p => {
      const status = p.available 
        ? `${colors.green}✓ Available${colors.reset}` 
        : `${colors.red}✗ Unavailable${colors.reset}`;
      console.log(`  ${p.name.padEnd(20)} ${status}`);
    });

  } catch (error) {
    console.error(`${colors.red}Error: ${error.message}${colors.reset}`);
    console.error(`${colors.yellow}Make sure the API server is running on ${API_URL}${colors.reset}`);
    process.exit(1);
  }
}

async function translate(text, targetLanguage, options = {}) {
  try {
    console.log(`${colors.cyan}Translating...${colors.reset}\n`);
    
    const body = {
      text,
      targetLanguage,
      ...(options.sourceLanguage && { sourceLanguage: options.sourceLanguage }),
      ...(options.provider && { provider: options.provider })
    };

    const response = await axios.post(`${API_URL}/translate`, body);
    const { translatedText, provider, chunks } = response.data;

    console.log(`${colors.blue}Original:${colors.reset}`);
    console.log(`  ${text}\n`);

    console.log(`${colors.green}Translated:${colors.reset}`);
    console.log(`  ${translatedText}\n`);

    console.log(`${colors.yellow}Provider:${colors.reset} ${provider}`);
    console.log(`${colors.yellow}Chunks:${colors.reset} ${chunks}`);

  } catch (error) {
    if (error.response) {
      console.error(`${colors.red}Translation Error:${colors.reset}`);
      console.error(`  ${error.response.data.error || error.message}`);
    } else {
      console.error(`${colors.red}Error: ${error.message}${colors.reset}`);
      console.error(`${colors.yellow}Make sure the API server is running on ${API_URL}${colors.reset}`);
    }
    process.exit(1);
  }
}

// Parse command line arguments
const args = process.argv.slice(2);

if (args.length === 0 || args.includes('--help')) {
  showHelp();
  process.exit(0);
}

if (args.includes('--list')) {
  listProviders();
} else {
  const options = {};
  const positionalArgs = [];

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--provider') {
      options.provider = args[++i];
    } else if (args[i] === '--source') {
      options.sourceLanguage = args[++i];
    } else if (!args[i].startsWith('--')) {
      positionalArgs.push(args[i]);
    }
  }

  if (positionalArgs.length < 2) {
    console.error(`${colors.red}Error: Missing required arguments${colors.reset}\n`);
    showHelp();
    process.exit(1);
  }

  const [text, targetLanguage] = positionalArgs;
  translate(text, targetLanguage, options);
}
