# Automatic Translator Project Setup

## Progress Tracking

- [x] Verify that the copilot-instructions.md file in the .github directory is created.
- [x] Clarify Project Requirements
- [x] Scaffold the Project
- [x] Customize the Project
- [x] Install Required Extensions (None required)
- [x] Compile the Project
- [x] Create and Run Task (Not applicable for library package)
- [x] Launch the Project (Not applicable for library package)
- [x] Ensure Documentation is Complete

## Project Details

- **Type:** TypeScript npm package
- **Purpose:** Automatic translation service with AI model fallback
- **Key Features:**
  - String chunking (300 characters)
  - Multiple AI provider support
  - Automatic fallback on rate limits
  - Batch translation for large strings

## Project Structure

```
automatic-translator/
├── src/
│   ├── index.ts                 # Main exports
│   ├── translator.ts            # Core translator class
│   ├── types/
│   │   └── index.ts            # Type definitions
│   ├── providers/
│   │   ├── huggingface.ts      # HuggingFace provider
│   │   ├── libretranslate.ts   # LibreTranslate provider
│   │   └── mymemory.ts         # MyMemory provider
│   └── utils/
│       └── chunker.ts          # Text chunking utility
├── dist/                        # Compiled output (generated)
├── package.json
├── tsconfig.json
├── README.md
└── example.js                   # Usage examples

```

## Usage

This is a library package. To use it in other projects:

```bash
npm install automatic-translator
```

See README.md for complete usage documentation.
