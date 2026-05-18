# @insaatborsam/ai

Claude API prompt registry, Anthropic SDK wrapper'ları ve Supabase Edge Function client'ları.

## İçerik (Sprint 5+)

- `src/prompts/rfq-parser.md` — Haiku 4.5 RFQ parser system prompt (v1)
- `src/prompts/product-categorize.md` — Haiku 4.5 + Vision kategori önerici
- `src/clients/anthropic.ts` — `createAnthropicClient()` factory, logging hook
- `src/clients/openai-embedding.ts` — embedding generate + retry
- `src/types/ai-call-log.ts` — `ai_call_logs` tablosunun tipli interface'i

## Kural

- AI çağrıları **asla client-side** yapılmaz. Sadece Supabase Edge Function veya Next.js API route'tan çağrılır.
- Her prompt versiyonlanır (`prompts/v1/`, `prompts/v2/`) — eskisi A/B test ve rollback için saklanır.
- Detay: `docs/05-AI.md` + `ai-prompt-engineer` agent.
