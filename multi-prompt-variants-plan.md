## Plan: Multi-Prompt Variants (No New Table/Route)

Add batch variant generation via extending existing `prompt-remix` route to accept multiple prompts, enforce limits (≤10 total, ≤5 concurrent), and surface a lightweight variants panel with client-managed state and optional persisted chosen primary.

**Steps:**
1. Extend `web/src/app/api/prompt-remix/route.ts` to accept `prompts: string[]` (or single `remixPrompt`), validate length ≤10, run pool (max 5 concurrent) returning `{ results: [{ prompt, url }] }`.
2. Add optional columns in `images` (`variant_urls JSON`, `variant_prompts JSON`) in Supabase migration or skip persistence (store only client-side) and update `coloring_page_url` when user selects one.
3. Create prompt set helper in `web/src/lib/openai.ts` (`buildVariantPrompt(baseImageDescription, theme)`) with curated themes list (e.g. camping, amusement park, beach, space, underwater).
4. Add “Variants” expandable panel in `web/src/app/dashboard/page.tsx` image card: preset theme chips + custom input + “Generate All” button, progressive rendering of incoming results with skeletons.
5. Manage client state: per-image `variants[]`, selection handler to promote chosen variant (updates `images` row via existing update logic) and optionally discard others from memory.

**Open Questions:**
1. Persist unused variant URLs (JSON columns) or keep purely ephemeral client state?
2. Allow mixing preset + custom prompts in one batch or restrict to one mode per run?
3. Include basic cost/usage indicator (e.g. “7/10 variants used”) or omit for now?
