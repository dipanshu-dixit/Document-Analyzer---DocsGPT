# Document Intelligence System - Regression Test Plan

## Purpose
This test plan validates architectural invariants and prevents reintroduction of structural bugs. These are not unit tests - they are **invariant checks** that verify the system cannot enter invalid states.

## Critical Invariants (Must Never Break)

### 1. Document Lifecycle Contract
**Invariant**: Only PARSED documents are queryable

**Test Cases**:
- [ ] Upload document → Chat input disabled
- [ ] Start parsing → Chat input disabled  
- [ ] Parsing fails → Chat input disabled
- [ ] Parsing succeeds → Chat input enabled
- [ ] Refresh during parsing → Document marked PARSE_FAILED
- [ ] Refresh after parsing → Chat input enabled (if artifact exists)

**Failure Symptoms**: Chat input enabled when document not PARSED

---

### 2. Evidence Truth Contract  
**Invariant**: Evidence panel only shows mechanically derived facts

**Test Cases**:
- [ ] No document → "No document selected"
- [ ] Document uploaded → "No evidence available"  
- [ ] Document parsing → "No evidence available"
- [ ] Document parsed → Shows document facts only
- [ ] Never shows structure without parsing

**Failure Symptoms**: Evidence panel shows fake structure or optimistic data

---

### 3. Input Event Contract
**Invariant**: UI events never leak into model requests

**Test Cases**:
- [ ] Type question → Send → Response contains no `[object PointerEvent]`
- [ ] Click suggestion → Input populated, not sent
- [ ] Press Enter → Question sent as string only
- [ ] All model requests contain only primitives (string, number, boolean)

**Failure Symptoms**: Model responses contain DOM event artifacts

---

### 4. State Persistence Contract
**Invariant**: Only canonical state persisted, pessimistic rehydration

**Test Cases**:
- [ ] Upload + parse + refresh → Document state preserved correctly
- [ ] Upload + refresh (no parse) → Document state UPLOADED
- [ ] Parse + refresh mid-parse → Document state PARSE_FAILED  
- [ ] Chat + refresh → Messages preserved
- [ ] Invalid storage → System starts clean (no crash)

**Failure Symptoms**: Phantom readiness after refresh, fake evidence after reload

---

### 5. Intent Clarity Contract
**Invariant**: Every model request has explicit intent

**Test Cases**:
- [ ] Click "What are the key findings?" → Intent = EXTRACT
- [ ] Click "Summarize for executive review" → Intent = SUMMARIZE
- [ ] Type custom question → Intent inferred correctly
- [ ] All responses match intent format (numbered for EXTRACT, sections for SUMMARIZE)

**Failure Symptoms**: Q&A formatting when not requested, inconsistent response structure

---

## Regression Scenarios (Historical Bugs)

### Scenario A: The Upload Confusion
1. Upload document
2. **Verify**: Chat input disabled
3. **Verify**: Suggestions not shown
4. **Verify**: Evidence panel shows "No evidence available"
5. Parse document
6. **Verify**: Chat input enabled
7. **Verify**: Suggestions appear

**Pass Criteria**: No UI lies about readiness

---

### Scenario B: The Refresh Test
1. Upload + parse document
2. Add some chat messages  
3. Refresh page
4. **Verify**: Session restored
5. **Verify**: Document state correct
6. **Verify**: Messages restored
7. **Verify**: Chat input state matches document state

**Pass Criteria**: No phantom states after refresh

---

### Scenario C: The Event Leakage Test
1. Upload + parse document
2. Click suggested question
3. **Verify**: Input populated only (not sent)
4. Press Enter to send
5. **Verify**: Response contains no DOM artifacts
6. **Verify**: Response format matches intent

**Pass Criteria**: Clean model interaction

---

### Scenario D: The Storage Corruption Test
1. Manually corrupt localStorage (invalid JSON)
2. Refresh page
3. **Verify**: System starts clean (no crash)
4. **Verify**: No error dialogs
5. **Verify**: Can create new session

**Pass Criteria**: Graceful degradation

---

## Architecture Validation Checklist

### Store Separation ✓
- [ ] SessionStore only manages sessions
- [ ] DocumentStore only manages documents  
- [ ] ChatStore only manages messages
- [ ] No cross-store mutations

### UI Purity ✓
- [ ] UI renders based on store state only
- [ ] No UI-local state that duplicates store state
- [ ] Input state synchronized with stores
- [ ] Scroll behavior deterministic

### Storage Contracts ✓
- [ ] Only canonical state persisted
- [ ] No derived flags in storage
- [ ] Pessimistic rehydration
- [ ] Version checking works

### Intent Clarity ✓
- [ ] Every model request has explicit intent
- [ ] Intent-specific prompts used
- [ ] Response format matches intent
- [ ] No backend guessing

---

## Red Flags (Immediate Investigation Required)

If you see any of these, the architecture has regressed:

🚨 **Chat input enabled when document not PARSED**
🚨 **Evidence panel showing structure without parsing**  
🚨 **`[object PointerEvent]` in model responses**
🚨 **Suggested questions auto-sending**
🚨 **Phantom readiness after refresh**
🚨 **Q&A formatting when not requested**
🚨 **Storage corruption crashing system**

---

## AI-Specific Regression Tests (Critical)

### Model Misbehavior Tests
**Purpose**: Assume model is adversarial, not cooperative

**Test Cases**:
- [ ] Model returns Q&A format despite intent → UI normalizes or rejects
- [ ] Model repeats question → Response cleaned automatically
- [ ] Model hallucinates page numbers → Evidence panel stays empty
- [ ] Model returns Markdown when plain text expected → Formatting stripped
- [ ] Model returns empty output → Error handled gracefully
- [ ] Model timeout → System degrades honestly

**Failure Symptoms**: UI breaks on model misbehavior, fake evidence from hallucinations

---

### Cross-Intent Contamination Tests
**Purpose**: Validate intent isolation is real, not cosmetic

**Test Sequence**:
1. Extract intent → Get structured bullets
2. Chat follow-up → Get conversational response
3. Summary intent → Get paragraph form
4. **Verify**: No format bleed-through between intents

**Failure Symptoms**: Previous intent affects current response format

---

### Session Boundary Tests
**Purpose**: Prevent evidence/context leakage across sessions

**Test Sequence**:
1. Ask questions in Session A
2. Switch to Session B with different document
3. Refresh browser
4. Return to Session A
5. **Verify**: Correct documents active, correct chat history, no evidence leakage

**Failure Symptoms**: Wrong document context, mixed chat histories

---

### Partial Failure Tests
**Purpose**: System degrades honestly under partial failures

**Test Cases**:
- [ ] Parsing succeeds, evidence retrieval fails → Evidence panel empty
- [ ] Evidence retrieval succeeds, generation fails → Error message shown
- [ ] Chat request times out → Timeout handled gracefully
- [ ] Storage partially corrupt → System starts clean

**Failure Symptoms**: Silent fallbacks, state advancement on failure

---

## Safe Evolution Guidelines

### ✅ Safe Changes (No Risk)
- Improve prompt quality per intent
- Add streaming to actions.js
- UX polish (typography, spacing, transitions)
- Add new intents to actions.js
- Optimize model parameters

### ❌ Dangerous Changes (High Risk)
- Merging stores "for convenience"
- Adding UI-local state
- Optimistic rehydration
- Letting UI infer readiness
- Auto-submit features
- One giant analyze endpoint

---

## Maintenance Notes

This system is **defensively architected**. Bugs that appear will be:
- Localized to single components
- Debuggable through store inspection  
- Non-structural (won't cascade)

The architecture prevents **implicit coupling** - the root cause of all original bugs.

**Key Insight**: This is a state machine with conversational interface, not a chat app with documents.

---

## Maintenance Doctrine (Share with Collaborators)

### The Three Laws of This System
1. **No implicit state** - If it isn't in a store, it doesn't exist
2. **No optimistic assumptions** - Absence of proof = block or empty state
3. **No model-driven structure** - Models produce content, never UI shape

*Any PR that violates these is rejected.*

### Safe Changes (No Architectural Review Required)
- Prompt improvements within intent boundaries
- UI styling and animations
- New intents in actions.js
- Performance optimizations
- Evidence renderer improvements

### Changes Requiring Architectural Review
- Store modifications
- Storage format changes
- Document lifecycle changes
- Chat flow modifications
- Parsing pipeline changes

### Future-Proofing Achieved
This architecture is ready for:
- Model swaps (OpenAI → local → hybrid)
- Multi-document reasoning
- Audit/compliance requirements
- Regulated environments
- Team scaling

**Key Separation**: Correctness from capability. Capabilities evolve, correctness must not.