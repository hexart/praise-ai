# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Praise-AI is an AI-powered emotional companion chat application built with React + TypeScript. It provides emotional support through three chat modes (Smart, Praise, Comfort) and supports multiple AI providers (Ollama, OpenAI, Claude, Qwen).

**Tech Stack:**
- Frontend: React 19.2.3 + TypeScript 5.9.3
- Build Tool: Vite 7.3.0
- Styling: Tailwind CSS 4.1.18
- Icons: Lucide React 0.562.0
- Package Manager: PNPM 10.18.3
- Backend: FastAPI + Python (Ollama proxy service)

## Common Commands

### Frontend Development

```bash
# Navigate to frontend directory
cd frontend

# Development
pnpm dev              # Start dev server (http://localhost:5173)
pnpm build            # Build for production
pnpm preview          # Preview production build
pnpm lint             # Run ESLint

# Docker
pnpm docker:build     # Build Docker image
pnpm docker:run       # Run Docker container

# Cleanup
pnpm clean            # Remove node_modules and dist
```

### Full Stack Development

```bash
# Start both frontend and backend (from project root)
./dev.sh              # macOS/Linux
dev.bat               # Windows
```

This script automatically:
- Checks for Python virtual environment and dependencies
- Starts FastAPI backend on port 8000
- Starts Vite frontend on port 5173
- Gracefully handles Ctrl+C to stop both services

### Backend (Ollama Proxy)

```bash
cd backend

# Create virtual environment (first time only)
python -m venv .venv

# Activate virtual environment
source .venv/bin/activate    # macOS/Linux
.venv\Scripts\activate       # Windows

# Install dependencies
pip install -r requirements.txt

# Run proxy service
python main.py              # Runs on http://localhost:8000
```

## Architecture Overview

### Hook-Based State Management

The application uses a hierarchical hook architecture where `useApp` integrates all subsystems:

**useApp** (Main orchestrator)
- Manages global app settings and user ID
- Integrates provider, chat, and emotion analysis hooks
- Handles data import/export and reset operations

**useProvider** (AI Provider management)
- Supports multiple providers: Ollama (local), OpenAI, Claude (Anthropic), Qwen, Custom
- Manages provider lifecycle: initialization, connection testing, model loading
- Stores provider configs separately per provider type in localStorage
- Connection state tracking (isConnected, connectedProvider, connectedModel)

**useChat** (Chat functionality)
- Handles message sending with streaming support
- Manages chat history with auto-save to localStorage
- Integrates with emotion analysis for smart mode
- Prevents concurrent requests during streaming

**useEmotionAnalysis** (Emotion tracking)
- Analyzes user emotions using LLM or fallback keyword matching
- Tracks emotion history and trends
- Recommends chat modes based on emotional state
- Shares provider instance with chat system

### Dual Emotion Analysis System

The app uses **two separate emotion analysis mechanisms**:

1. **useChat's emotion analysis**: Real-time emotion detection for smart mode recommendations
2. **useEmotionAnalysis**: Historical emotion tracking, trend analysis, and statistics

Both systems share the same Provider instance (configured via `useApp`) to ensure consistency.

### Provider Pattern

All AI providers inherit from `BaseProvider`:

```typescript
abstract class BaseProvider {
  abstract testConnection(): Promise<APIResponse>
  abstract listModels(): Promise<APIResponse<ModelsResponse>>
  abstract switchModel(modelName: string): Promise<APIResponse>
  abstract sendMessage(request: ChatRequest): Promise<APIResponse>
  abstract sendStreamMessage(request: ChatRequest, callbacks): Promise<void>
}
```

**Key Provider Requirements:**
- Must override `buildHeaders()` to set proper authentication headers
- Must call official APIs directly (no SDK wrappers)
- Must support both streaming and non-streaming responses
- Configuration stored per-provider-type with fallback to environment variables

**Environment Variable Hierarchy:**
User localStorage config > Environment variables > Default values

### Two-Stage LLM Interaction

For intelligent responses, the app performs **two sequential LLM calls**:

1. **Emotion Analysis**: Analyzes user input to determine emotional state, intensity, and needs
2. **Response Generation**: Generates appropriate response based on analysis and chat mode

This separation ensures accurate emotion understanding before crafting responses.

### Service Layer

**EmotionAnalysisService**: LLM-based emotion analysis with keyword-based fallback
**PromptService**: Generates system prompts for different chat modes
**QuoteService**: Provides contextual quotes based on emotional state
**ResponseDiversityService**: Prevents repetitive response patterns

## Key Implementation Details

### Provider Configuration Storage

Each provider type has its own localStorage key:
- `provider_config_ollama`
- `provider_config_openai`
- `provider_config_anthropic`
- `provider_config_qwen`
- `provider_config_custom`

This allows switching between providers without losing their individual configurations.

### Streaming Response Handling

Streaming uses Server-Sent Events (SSE) format. The `BaseProvider.handleStream()` method:
1. Reads response body as stream
2. Decodes chunks with TextDecoder
3. Calls provider-specific `processStreamChunk()` to parse SSE format
4. Invokes callbacks with extracted content

Each provider must implement `processStreamChunk()` to handle their specific SSE format.

### Concurrent Request Prevention

When a streaming request is active:
- `chat.isLoading` is set to true
- `chat.streamingMessageId` tracks the streaming message
- Input is disabled until streaming completes

This prevents message mixing and state corruption.

### Theme Support

The app uses `useTheme` hook with localStorage persistence:
- Supports light/dark/system modes
- Uses Tailwind's `dark:` prefix for styling
- System preference detection via `window.matchMedia`

### Toast Notifications

Uses Sonner library (not custom implementation):
```typescript
import { toast } from 'sonner';

toast.success('Message', { description: 'Details' });
toast.error('Error', { description: 'Error details' });
```

## Code Style and Rules

### TypeScript Strictness

- **Never use `any` type** - ESLint rule enforces this
- Use specific types or `unknown` when type is truly unknown
- Maintain backward compatibility when refactoring types

### Component Design

- Single Responsibility Principle
- Avoid generic prefixes like "New" in filenames
- Delete unused components after refactoring

### Hook Usage

- Minimize dependencies in useEffect/useCallback
- Use useCallback for function references passed as props
- Don't pass entire objects as dependencies unless necessary

### State Management

- Reset connection state when switching providers
- Clear selected model when provider changes
- Use refs for values that don't need to trigger re-renders

### Error Handling

- Provide fallback mechanisms for critical services
- Log detailed errors for debugging
- Show user-friendly error messages

## Project Structure

```
praise-ai/
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── chat/           # Chat UI components
│   │   │   ├── layout/         # Layout components
│   │   │   ├── settings/       # Settings modal and panels
│   │   │   └── ui/             # Reusable UI components
│   │   ├── hooks/              # React Hooks (core state management)
│   │   │   ├── useApp.ts       # Main app orchestrator
│   │   │   ├── useProvider.ts  # Provider management
│   │   │   ├── useChat.ts      # Chat functionality
│   │   │   └── useEmotionAnalysis.ts  # Emotion tracking
│   │   ├── providers/          # AI provider implementations
│   │   │   ├── BaseProvider.ts
│   │   │   ├── OllamaProvider.ts
│   │   │   ├── OpenAIProvider.ts
│   │   │   ├── ClaudeProvider.ts
│   │   │   ├── QwenProvider.ts
│   │   │   └── CustomProvider.ts
│   │   ├── services/           # Business logic services
│   │   │   ├── EmotionAnalysisService.ts
│   │   │   ├── PromptService.ts
│   │   │   ├── QuoteService.ts
│   │   │   └── ResponseDiversityService.ts
│   │   ├── types/              # TypeScript type definitions
│   │   ├── utils/              # Utility functions
│   │   └── App.tsx
│   └── package.json
├── backend/                    # FastAPI Ollama proxy
│   ├── main.py
│   └── requirements.txt
├── dev.sh / dev.bat           # Development startup scripts
└── docs/                      # Detailed documentation
```

## Environment Variables

Frontend uses Vite environment variables (prefix: `VITE_`):

```bash
# Default Provider
VITE_DEFAULT_PROVIDER=qwen

# Provider Enable Flags
VITE_ENABLE_QWEN=true
VITE_ENABLE_OPENAI=true
VITE_ENABLE_CLAUDE=true
VITE_ENABLE_OLLAMA=true

# Ollama
VITE_OLLAMA_URL=http://localhost:8000

# OpenAI
VITE_OPENAI_URL=https://api.openai.com/v1
VITE_OPENAI_KEY=sk-...
VITE_OPENAI_DEFAULT_MODEL=gpt-4

# Claude (Anthropic)
VITE_CLAUDE_URL=https://api.anthropic.com/v1
VITE_CLAUDE_KEY=sk-ant-...
VITE_CLAUDE_DEFAULT_MODEL=claude-4-sonnet-20250514

# Qwen (Alibaba)
VITE_QWEN_URL=https://dashscope.aliyuncs.com/compatible-mode/v1
VITE_QWEN_KEY=sk-...
VITE_QWEN_DEFAULT_MODEL=qwen-plus
```

**Note:** When deployed to GitHub Pages, users must configure providers manually through the settings UI since environment variables aren't available.

## Testing and Debugging

### Debug Mode

Enable in Settings → General → Debug Mode to see:
- Detailed emotion analysis results
- Provider connection status
- Chat processing flow
- System prompts and user messages
- LLM request/response details

### Console Logging

The app uses a custom logger (`utils/logger.ts`) that respects debug mode:
- Module-specific loggers (e.g., `createModuleLogger('EmotionService')`)
- Automatic enable/disable based on debug setting
- Structured logging with context objects

### Common Debugging Tasks

1. **Check Provider Connection**: Settings → Provider → Test Connection
2. **View Emotion Analysis**: Enable Debug Mode, check console during chat
3. **Inspect LLM Interactions**: Look for `[LLM交互1]` and `[LLM交互2]` logs
4. **Monitor Streaming**: Watch `streamingMessageId` in console logs

## Adding New Providers

1. Create provider class extending `BaseProvider` in `src/providers/`
2. Implement all abstract methods (connection, models, send message)
3. Override `buildHeaders()` with proper authentication
4. Implement `processStreamChunk()` for streaming support
5. Register in `useProvider.ts` `createProvider()` function
6. Add to `ProviderType` type definition
7. Update `supportedProviders` list in `useProvider.ts`
8. Add configuration UI in `SettingsModal.tsx`

## Git Commit Conventions

Use descriptive commit messages with:
- Type prefix: `feat:`, `fix:`, `chore:`, `refactor:`
- Feature description
- List of changed files
- Explanation of changes and rationale

Example:
```
feat: Add Google Gemini provider support

Changed files:
- src/providers/GeminiProvider.ts (new)
- src/hooks/useProvider.ts
- src/types/provider.ts

Added Gemini as a new AI provider option with streaming support
and proper authentication handling.
```
