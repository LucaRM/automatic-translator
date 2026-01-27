# Translation CLI Consumer

A simple command-line tool to consume the automatic-translator API.

## Prerequisites

Make sure the translation API server is running:

```bash
# In the main project directory
npm start
```

The server should be running on `http://localhost:3008`

## Usage

### List Available Providers

```bash
node translate-cli.js --list
```

### Translate Text

```bash
# Basic translation
node translate-cli.js "Hello world" es

# Specify source language
node translate-cli.js "Hello world" es --source en

# Use specific provider
node translate-cli.js "Hello world" fr --provider Gemini

# Complex example
node translate-cli.js "The quick brown fox jumps over the lazy dog" es --source en --provider GoogleTranslate
```

### Help

```bash
node translate-cli.js --help
```

## Examples

```bash
# English to Spanish
node translate-cli.js "Hello, how are you?" es

# French to English
node translate-cli.js "Bonjour le monde" en --source fr

# Using a specific provider
node translate-cli.js "Good morning" de --provider MyMemory

# List all providers and their status
node translate-cli.js --list
```

## Environment Variables

You can change the API URL:

```bash
TRANSLATE_API_URL=http://your-server:3008 node translate-cli.js "Hello" es
```

## Common Language Codes

- `en` - English
- `es` - Spanish
- `fr` - French
- `de` - German
- `it` - Italian
- `pt` - Portuguese
- `ru` - Russian
- `zh` - Chinese
- `ja` - Japanese
- `ko` - Korean
