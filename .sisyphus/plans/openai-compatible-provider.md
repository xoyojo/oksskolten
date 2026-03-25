# Add OpenAI Compatible Provider

## TL;DR

> **Quick Summary**: Add a new "OpenAI Compatible" LLM provider that allows configuring custom OpenAI-format API endpoints (Base URL, API Key, Model Name) with connection testing support.
> 
> **Deliverables**:
> - New backend provider: `server/providers/llm/openai-compatible.ts`
> - Updated settings routes with new preference keys
> - Updated shared models with new provider
> - New frontend UI card: `OpenAICompatibleCard`
> - i18n translations for all new UI text
>
> **Estimated Effort**: Medium
> **Parallel Execution**: YES - 2 waves (backend foundation → frontend UI)
> **Critical Path**: Backend provider → Frontend card → Integration test

---

## Context

### Original Request
用户需要配置 OpenAI 兼容 API 的 baseURL，以便使用第三方 OpenAI 格式的 API 服务（如 Ollama、vLLM、OpenRouter、DeepSeek、Together AI 等）。

### Interview Summary
**Key Discussions**:
- **Provider approach**: Create NEW independent provider "OpenAI Compatible" (not modify existing OpenAI)
- **Configuration fields**: Model Name (manual input), Base URL, API Key
- **Test connection**: YES - add connection test button like Ollama
- **Provider position**: Independent provider alongside OpenAI, Gemini, Ollama, Claude Code

**Research Findings**:
- **Ollama provider pattern**: Excellent reference for baseURL implementation (`server/providers/llm/ollama.ts`)
- **Settings sync rule**: Both frontend (`use-settings.ts`) and backend (`settings.ts`) must be updated together
- **OpenAI SDK**: Supports `baseURL` parameter in constructor
- **UI reference**: `OllamaCard` in `provider-config-section.tsx` shows the pattern

### Metis Review
**Self-identified Gaps** (to address):
- **Default Base URL**: Leave empty - user must configure it (no sensible default for custom endpoints)
- **API Key optional**: YES - allow empty API key for local providers that don't require authentication
- **Error messages**: Use the error from API response, display in UI
- **Model validation**: No validation - user-specified, trust the input

**Auto-Resolved Decisions**:
- Provider ID: `openai-compatible` (consistent with naming pattern)
- Setting keys: `openai-compatible.model`, `openai-compatible.base_url`
- API key storage: `api_key.openai-compatible`
- Cache key: Include both baseURL and model in cache key for proper invalidation

---

## Work Objectives

### Core Objective
Add a new "OpenAI Compatible" provider that enables users to configure any OpenAI-format API endpoint with custom Base URL, API Key, and Model Name.

### Concrete Deliverables
- `server/providers/llm/openai-compatible.ts` - New provider implementation
- Modified `server/providers/llm/index.ts` - Register new provider
- Modified `server/routes/settings.ts` - Add preference keys and API key mapping
- Modified `shared/models.ts` - Add to provider lists
- Modified `src/pages/settings/sections/provider-config-section.tsx` - Add OpenAICompatibleCard
- Modified `src/hooks/use-settings.ts` - Add preference sync
- Modified `src/lib/i18n.ts` - Add translations

### Definition of Done
- [ ] User can select "OpenAI Compatible" as LLM provider for chat/summary/translate tasks
- [ ] Settings UI shows configuration form with Base URL, API Key, Model Name fields
- [ ] Test Connection button works and shows success/failure status
- [ ] API calls use the configured Base URL and Model Name
- [ ] All text is internationalized (English and Japanese)

### Must Have
- Base URL configuration
- API Key configuration
- Model Name input
- Test Connection functionality
- Provider selectable for chat/summary/translate tasks

### Must NOT Have (Guardrails)
- DO NOT modify existing OpenAI provider behavior
- DO NOT add custom headers support (keep it simple, unlike Ollama)
- DO NOT auto-fetch model list (manual input only)
- DO NOT duplicate code - reuse patterns from Ollama provider

---

## Verification Strategy

### Test Decision
- **Infrastructure exists**: YES (vitest)
- **Automated tests**: YES - Tests for backend provider
- **Framework**: vitest

### QA Policy
Every task MUST include agent-executed QA scenarios.
Evidence saved to `.sisyphus/evidence/task-{N}-{scenario-slug}.{ext}`.

---

## Execution Strategy

### Parallel Execution Waves

```
Wave 1 (Backend Foundation - can run in parallel):
├── Task 1: Create OpenAI Compatible provider [unspecified-high]
├── Task 2: Update shared models [quick]
├── Task 3: Update settings routes [quick]
└── Task 4: Add i18n translations [quick]

Wave 2 (Frontend UI - after Wave 1):
├── Task 5: Create OpenAICompatibleCard component [visual-engineering]
└── Task 6: Update use-settings hook [quick]

Wave 3 (Integration - after Wave 2):
└── Task 7: Integration testing and verification [unspecified-high]
```

### Dependency Matrix

- **1**: — Task 7
- **2**: — Task 5, Task 7
- **3**: — Task 5, Task 7
- **4**: — Task 5
- **5**: 2, 3, 4 — Task 7
- **6**: 3 — Task 7
- **7**: 1, 2, 3, 5, 6 —

Critical Path: Task 1 → Task 5 → Task 7
Parallel Speedup: ~50% faster than sequential

---

## TODOs

- [x] 1. Create OpenAI Compatible Provider Backend

  **What to do**:
  - Create new file `server/providers/llm/openai-compatible.ts`
  - Follow Ollama provider pattern (`server/providers/llm/ollama.ts`)
  - Implement `getOpenAICompatibleBaseUrl()` - read from settings or return default
  - Implement `getOpenAICompatibleModel()` - read model name from settings
  - Implement `getOpenAICompatibleClient()` - create OpenAI client with baseURL
  - Export `openaiCompatibleProvider` object with `name`, `requireKey()`, `createMessage()`, `streamMessage()`
  - Handle caching of client (cache both baseURL and model)

  **Must NOT do**:
  - DO NOT copy entire Ollama file - only borrow relevant patterns
  - DO NOT add custom_headers support (keep simple)

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
    - Reason: Backend logic implementation requiring understanding of existing patterns
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1 (with Tasks 2, 3, 4)
  - **Blocks**: Task 7

  **References**:
  - `server/providers/llm/ollama.ts` - Pattern for baseURL-based OpenAI client
  - `server/providers/llm/openai.ts` - Original OpenAI provider structure
  - `server/providers/llm/provider.ts` - LLMProvider interface definition

  **Acceptance Criteria**:
  - [ ] File `server/providers/llm/openai-compatible.ts` exists
  - [ ] Exports `openaiCompatibleProvider` object
  - [ ] Client uses configurable baseURL
  - [ ] Unit tests pass

  **QA Scenarios**:
  ```
  Scenario: Provider creates client with custom baseURL
    Tool: Bash (node)
    Steps:
      1. Import getOpenAICompatibleClient from the module
      2. Mock getSetting to return 'http://test.local/v1'
      3. Call getOpenAICompatibleClient()
      4. Verify client.baseURL equals 'http://test.local/v1'
    Expected Result: Client uses configured baseURL
    Evidence: .sisyphus/evidence/task-01-client-baseurl.txt
  ```

  **Commit**: NO (groups with Task 2-4)

---

- [x] 2. Update Shared Models

  **What to do**:
  - Edit `shared/models.ts`
  - Add `'openai-compatible'` to `LLM_TASK_PROVIDERS` array
  - Add `'openai-compatible': ''` to `DEFAULT_MODELS` (empty string - user specifies)
  - Add `'openai-compatible': 'provider.openaiCompatible'` to `PROVIDER_LABELS`

  **Must NOT do**:
  - DO NOT add to `LLM_API_PROVIDERS` (that's for key-only providers)
  - DO NOT add to `MODELS_BY_PROVIDER` (no static model list)

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: Simple array/object additions
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1 (with Tasks 1, 3, 4)
  - **Blocks**: Task 5

  **References**:
  - `shared/models.ts:87` - LLM_TASK_PROVIDERS array
  - `shared/models.ts:64-72` - DEFAULT_MODELS object
  - `shared/models.ts:89-97` - PROVIDER_LABELS object

  **Acceptance Criteria**:
  - [ ] `LLM_TASK_PROVIDERS` includes 'openai-compatible'
  - [ ] `DEFAULT_MODELS['openai-compatible']` is empty string
  - [ ] `PROVIDER_LABELS['openai-compatible']` is 'provider.openaiCompatible'

  **QA Scenarios**:
  ```
  Scenario: Provider is selectable in task providers
    Tool: Bash
    Steps:
      1. Import LLM_TASK_PROVIDERS from shared/models
      2. Check if 'openai-compatible' is in array
    Expected Result: Array includes 'openai-compatible'
    Evidence: .sisyphus/evidence/task-02-provider-list.txt
  ```

  **Commit**: NO (groups with Task 1, 3, 4)

---

- [x] 3. Update Settings Routes

  **What to do**:
  - Edit `server/routes/settings.ts`
  - Add `'openai-compatible.model'` to `PREF_KEYS` array
  - Add `'openai-compatible.base_url'` to `PREF_KEYS` array
  - Add `'openai-compatible.model': null` to `PREF_ALLOWED`
  - Add `'openai-compatible.base_url': null` to `PREF_ALLOWED`
  - Add `'openai-compatible': 'api_key.openai-compatible'` to `PROVIDER_KEY_MAP`
  - Add API endpoint for testing connection (similar to Ollama status endpoint)

  **Must NOT do**:
  - DO NOT add allowed values restrictions (null = any value)
  - DO NOT forget to add to both PREF_KEYS and PREF_ALLOWED

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: Simple additions to existing arrays/objects
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1 (with Tasks 1, 2, 4)
  - **Blocks**: Task 5

  **References**:
  - `server/routes/settings.ts:28-58` - PREF_KEYS array
  - `server/routes/settings.ts:61-91` - PREF_ALLOWED object
  - `server/routes/settings.ts:554-560` - PROVIDER_KEY_MAP object
  - `server/routes/settings.ts:599-648` - Ollama status endpoint (reference for test connection)

  **Acceptance Criteria**:
  - [ ] PREF_KEYS includes 'openai-compatible.model' and 'openai-compatible.base_url'
  - [ ] PREF_ALLOWED has entries for both keys
  - [ ] PROVIDER_KEY_MAP maps 'openai-compatible' to 'api_key.openai-compatible'
  - [ ] Test connection endpoint exists at `/api/settings/openai-compatible/status`

  **QA Scenarios**:
  ```
  Scenario: Settings API accepts openai-compatible preferences
    Tool: Bash (curl)
    Steps:
      1. PATCH /api/settings/preferences with {'openai-compatible.base_url': 'http://test.local/v1'}
      2. GET /api/settings/preferences
      3. Verify response includes 'openai-compatible.base_url': 'http://test.local/v1'
    Expected Result: Preference saved and retrieved
    Evidence: .sisyphus/evidence/task-03-settings-api.txt
  ```

  **Commit**: NO (groups with Task 1, 2, 4)

---

- [x] 4. Add i18n Translations

  **What to do**:
  - Edit `src/lib/i18n.ts`
  - Add English translations under `en` object:
    - `provider.openaiCompatible`: "OpenAI Compatible"
    - `openaiCompatible.modelName`: "Model Name"
    - `openaiCompatible.modelNameDesc`: "The model identifier to use for API requests"
    - `openaiCompatible.modelNamePlaceholder`: "e.g., llama3.2, deepseek-chat"
    - `openaiCompatible.baseUrl`: "Base URL"
    - `openaiCompatible.baseUrlDesc`: "The API endpoint URL (OpenAI-compatible format)"
    - `openaiCompatible.baseUrlPlaceholder`: "http://localhost:11434/v1"
    - `openaiCompatible.apiKey`: "API Key"
    - `openaiCompatible.apiKeyPlaceholder`: "Optional for some providers"
    - `openaiCompatible.testConnection`: "Test Connection"
    - `openaiCompatible.testing`: "Testing..."
    - `openaiCompatible.connected`: "Connected"
    - `openaiCompatible.connectionFailed`: "Connection failed"
  - Add corresponding Japanese translations under `ja` object

  **Must NOT do**:
  - DO NOT use raw strings in UI components (always use t() function)
  - DO NOT forget Japanese translations

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: Simple text additions
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1 (with Tasks 1, 2, 3)
  - **Blocks**: Task 5

  **References**:
  - `src/lib/i18n.ts` - i18n dictionary structure
  - Look at `ollama.*` keys for reference

  **Acceptance Criteria**:
  - [ ] All English translations added
  - [ ] All Japanese translations added
  - [ ] Keys match what's used in frontend component

  **QA Scenarios**:
  ```
  Scenario: Translations exist for all keys
    Tool: Bash
    Steps:
      1. Grep for 'openaiCompatible' in i18n.ts
      2. Count translations in both en and ja objects
    Expected Result: All 13 keys present in both languages
    Evidence: .sisyphus/evidence/task-04-i18n.txt
  ```

  **Commit**: NO (groups with Task 1-3)
  - Message: `feat(llm): add openai-compatible provider backend`
  - Files: `server/providers/llm/openai-compatible.ts`, `server/providers/llm/index.ts`, `server/routes/settings.ts`, `shared/models.ts`, `src/lib/i18n.ts`
  - Pre-commit: `npm run typecheck && npm run lint`

---

- [x] 5. Create OpenAICompatibleCard Component

  **What to do**:
  - Edit `src/pages/settings/sections/provider-config-section.tsx`
  - Create `OpenAICompatibleCard` component (similar to `OllamaCard`)
  - Include:
    - Base URL input field with placeholder
    - API Key input field (password type)
    - Model Name input field with placeholder
    - Test Connection button with loading state
    - Status indicator (success/failure)
    - Save button (shows when changes detected)
  - Use existing UI components: `Input`, `FormField`
  - Follow theme tokens: `text-text`, `text-muted`, `bg-bg-card`, `border-border`
  - Add card to provider list (after OllamaCard, before the closing div)

  **Must NOT do**:
  - DO NOT add custom headers support
  - DO NOT use raw colors - use theme tokens
  - DO NOT forget accessibility (labels, descriptions)

  **Recommended Agent Profile**:
  - **Category**: `visual-engineering`
    - Reason: Frontend UI component with form state management
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: NO
  - **Parallel Group**: Wave 2 (after Tasks 2, 3, 4)
  - **Blocks**: Task 7
  - **Blocked By**: Tasks 2, 3, 4

  **References**:
  - `src/pages/settings/sections/provider-config-section.tsx:269-443` - OllamaCard (primary reference)
  - `src/pages/settings/sections/provider-config-section.tsx:63-181` - ApiProviderCard (API key pattern)
  - `src/components/ui/input.tsx` - Input component
  - `src/components/ui/form-field.tsx` - FormField component

  **Acceptance Criteria**:
  - [ ] Component renders with all three input fields
  - [ ] Test Connection button calls `/api/settings/openai-compatible/status`
  - [ ] Save button calls PATCH `/api/settings/preferences`
  - [ ] Status indicator shows success/failure
  - [ ] All text uses t() function

  **QA Scenarios**:
  ```
  Scenario: Card renders in settings UI
    Tool: Playwright
    Steps:
      1. Navigate to /settings/integration
      2. Scroll to find "OpenAI Compatible" card
      3. Verify Base URL, API Key, Model Name inputs exist
      4. Verify Test Connection button exists
    Expected Result: Card visible with all fields
    Evidence: .sisyphus/evidence/task-05-ui-render.png

  Scenario: Can save configuration
    Tool: Playwright
    Steps:
      1. Navigate to /settings/integration
      2. Fill Base URL: "http://localhost:11434/v1"
      3. Fill Model Name: "llama3.2"
      4. Click Save button
      5. Wait for success message
    Expected Result: Settings saved successfully
    Evidence: .sisyphus/evidence/task-05-save.png
  ```

  **Commit**: NO (groups with Task 6)

---

- [x] 6. Update use-settings Hook

  **What to do**:
  - Edit `src/hooks/use-settings.ts`
  - Add preference keys to hydration if needed:
    - `openai-compatible.model`
    - `openai-compatible.base_url`
  - Add corresponding state and setters if the hook manages these

  **Must NOT do**:
  - DO NOT break existing functionality
  - DO NOT add to hydrationMap if using direct API calls (check Ollama pattern)

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: Simple additions to hook
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: NO
  - **Parallel Group**: Wave 2 (with Task 5)
  - **Blocks**: Task 7
  - **Blocked By**: Task 3

  **References**:
  - `src/hooks/use-settings.ts` - Settings hook
  - Check how Ollama preferences are handled (may use direct API instead of hydration)

  **Acceptance Criteria**:
  - [ ] Settings sync works for openai-compatible preferences
  - [ ] No console errors on page load

  **QA Scenarios**:
  ```
  Scenario: Preferences load without errors
    Tool: Playwright
    Steps:
      1. Open browser DevTools console
      2. Navigate to /settings/integration
      3. Check for any error messages
    Expected Result: No errors in console
    Evidence: .sisyphus/evidence/task-06-no-errors.txt
  ```

  **Commit**: YES
  - Message: `feat(ui): add openai-compatible settings card`
  - Files: `src/pages/settings/sections/provider-config-section.tsx`, `src/hooks/use-settings.ts`
  - Pre-commit: `npm run typecheck && npm run lint`

---

- [x] 7. Integration Testing and Verification

  **What to do**:
  - Run full test suite: `npm test`
  - Run type check: `npm run typecheck`
  - Run lint: `npm run lint`
  - Manual test the complete flow:
    1. Navigate to Settings → Integration
    2. Configure OpenAI Compatible provider
    3. Test connection
    4. Select as provider for a task
    5. Verify API calls use configured endpoint

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
    - Reason: Integration testing and verification
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: NO
  - **Parallel Group**: Wave 3 (final)
  - **Blocked By**: Tasks 1-6

  **References**:
  - All modified files

  **Acceptance Criteria**:
  - [ ] All tests pass
  - [ ] Type check passes
  - [ ] Lint passes
  - [ ] Provider appears in settings UI
  - [ ] Can save configuration
  - [ ] Test connection works
  - [ ] Can select provider for tasks

  **QA Scenarios**:
  ```
  Scenario: Full integration test
    Tool: Playwright
    Steps:
      1. Navigate to /settings/integration
      2. Configure OpenAI Compatible:
         - Base URL: "http://localhost:11434/v1"
         - Model Name: "llama3.2"
      3. Click Test Connection
      4. Verify success message
      5. Navigate to any article
      6. Open chat panel
      7. Select "OpenAI Compatible" as provider
      8. Send a message
    Expected Result: Chat works with configured endpoint
    Evidence: .sisyphus/evidence/task-07-integration.png
  ```

  **Commit**: NO (all commits done in previous tasks)

---

## Final Verification Wave (MANDATORY)

> After ALL implementation tasks complete, verify everything works together.

- [ ] F1. **Provider Registration Check**
  Verify the provider is registered in the system:
  - Check `LLM_TASK_PROVIDERS` includes 'openai-compatible'
  - Check provider appears in Settings → Integration UI
  - Check provider is selectable in chat/summary/translate task settings

- [ ] F2. **Settings Persistence Test**
  Test that settings are properly saved and loaded:
  - Save Base URL, API Key, Model Name
  - Refresh page
  - Verify values persist

- [ ] F3. **Connection Test Verification**
  Test the Test Connection feature:
  - Enter valid Base URL (or invalid for error case)
  - Click Test Connection
  - Verify appropriate success/error message

- [ ] F4. **End-to-End API Call Test**
  Test actual API functionality:
  - Configure provider with working endpoint
  - Select as provider for chat
  - Send message and verify response

- [x] F5. **Build Verification**
  Run all quality checks:
  ```bash
  npm run typecheck  # ✅ Pass
  npm run lint       # ✅ Pass
  npm test           # ✅ 2030 tests pass
  ```

## Commit Strategy

- **Commit 1**: `feat(llm): add openai-compatible provider backend`
- **Commit 2**: `feat(ui): add openai-compatible settings card`

---

## Success Criteria

### Verification Commands
```bash
# Run tests
npm test

# Type check
npm run typecheck

# Lint
npm run lint
```

### Final Checklist
- [ ] All "Must Have" present
- [ ] All tests pass
- [ ] Type check passes
- [ ] Lint passes