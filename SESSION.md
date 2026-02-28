# Session Log — Loan Payoff Calculator

---

## 🔄 Next Session - Start Here

**Last session:** 2026-02-28 (Session 17)
**Context:** Reorganized left panel input order for better UX flow. No pending tasks.

### Pending Tasks
- None

---

## Session: 2026-02-28 (Session 17) — Left Panel Input Reorganization

### What Was Done
- Reorganized the left panel input fields in `index.html` for better logical flow
- Moved Loan Start Date from position 5 to position 1 (top of inputs)
- Moved Pay bi-weekly toggle from position 7 to position 9 (bottom of inputs)
- Extra Payment now sits directly below Monthly Payment (logically paired)

### Files Modified
- `index.html` — Reordered `<div class="field">` blocks inside `.inputs-body`:
  - Cut Loan Start Date block and pasted as first child of `.inputs-body`
  - Cut Bi-weekly payments block and pasted as last child of `.inputs-body`
  - No CSS or JS changes needed (all bindings are by element ID)

### Decisions Made
- **Start Date at top:** Sets temporal context for the loan; lightweight field (2 dropdowns) that doesn't create friction
- **Extra Payment below Monthly Payment:** These are logically paired — "what you pay" + "what extra you add." Previously separated by Start Date
- **Biweekly at bottom:** Niche strategy but kept visible (not collapsible) as a discovery moment — users scrolling down may think "wait, I can do that?" and ask their bank about it
- **No collapsible for biweekly:** User explicitly wants it visible to encourage discovery, not hidden behind a `<details>` toggle

### New input order:
1. Loan Start Date
2. Loan Balance
3. Annual Interest Rate
4. Loan Term
5. Monthly Payment
6. Extra Payment
7. One-time Lump Sum Payment
8. Pay off by
9. Pay bi-weekly

### Open Items
- None

---

## Session: 2026-02-27 (Session 16) — Short Link Implementation

### What Was Done
- Implemented server-side short links for the "Copy results link" button
- Created two Cloudflare Pages Functions for the API
- Modified `index.html`: extracted `buildParams()`, updated `loadHash()`, rewrote copy-link handler, replaced sync INIT with async IIFE

### Files Created
- `functions/api/s/index.js` — POST endpoint: generates 8-char code, stores URLSearchParams payload in Upstash Redis with `po_` prefix, 90-day TTL
- `functions/api/s/[code].js` — GET endpoint: retrieves payload by code from Redis

**`functions/api/s/index.js`:**
```javascript
export async function onRequestPost(context) {
  const { request, env } = context;
  let body;
  try { body = await request.json(); } catch { return new Response(null, { status: 400 }); }

  const { p } = body;
  if (!p || typeof p !== 'string') return new Response(null, { status: 400 });

  const url   = env.UPSTASH_REDIS_REST_URL;
  const token = env.UPSTASH_REDIS_REST_TOKEN;

  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let code;
  for (let i = 0; i < 5; i++) {
    code = Array.from({ length: 8 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
    const check = await fetch(url, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(['GET', 'po_' + code])
    });
    const { result } = await check.json();
    if (result === null) break;
  }

  await fetch(url, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(['SET', 'po_' + code, p, 'EX', 7776000])
  });

  return new Response(JSON.stringify({ code }), {
    headers: { 'Content-Type': 'application/json' }
  });
}
```

**`functions/api/s/[code].js`:**
```javascript
export async function onRequestGet(context) {
  const { params, env } = context;
  const code = params.code;
  if (!code) return new Response(null, { status: 400 });

  const url   = env.UPSTASH_REDIS_REST_URL;
  const token = env.UPSTASH_REDIS_REST_TOKEN;

  const response = await fetch(url, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(['GET', 'po_' + code])
  });
  const { result } = await response.json();

  if (result === null) return new Response(null, { status: 404 });
  return new Response(JSON.stringify({ p: result }), {
    headers: { 'Content-Type': 'application/json' }
  });
}
```

### Files Modified
- `index.html`
  - `buildParams()` — new function, extracted from `encodeHash()`, returns URLSearchParams string
  - `encodeHash()` — simplified to call `buildParams()`
  - `loadHash(hashStr)` — added optional string param; falls back to `window.location.hash.slice(1)` if not provided
  - COPY LINK IIFE — async handler: POSTs to `/api/s`, shows "Shortening…" state, falls back to long `#` URL if API fails
  - INIT block — replaced with async IIFE: checks `?s=` param, fetches payload from `/api/s/:code`, hydrates via `loadHash(p)`, cleans URL with `history.replaceState`

### Decisions Made
- Cloudflare Pages Functions over Vercel (site is already on CF Pages — no separate deployment)
- Reuse Bill Split Upstash DB with `po_` key prefix to avoid collisions
- Upstash REST JSON array format: `['SET', key, value, 'EX', ttl]` (NOT URL path segment — that was the Bug in Bill Split fixed in Session 9)
- No CORS handler — frontend and API are same-origin

### External Changes Required (not in repo)
**Cloudflare Pages → loan_repayment_calculator → Settings → Environment Variables:**
- `UPSTASH_REDIS_REST_URL` — from Upstash console → your DB → REST API tab
- `UPSTASH_REDIS_REST_TOKEN` — from same location
- Add for both Production and Preview environments

### Open Items
- [ ] Add Upstash env vars to Cloudflare Pages dashboard (above)
- [ ] Push to main and test short link end-to-end
- [ ] Validate FAQ at https://search.google.com/test/rich-results

---

## Session: 2026-02-26 (Session 12) — FAQ Schema Validation

### What Was Done
- Validated the FAQPage JSON-LD schema against Google's Rich Results requirements
- Confirmed the schema is live and deployed at payoff.saltnfork.com (both JSON-LD blocks present)
- Discovered a real issue: FAQ Q&As are only in JSON-LD, not visible in HTML — Google requires on-page visibility
- Documented fix needed for next session: add visible `<details>`/`<summary>` FAQ accordion

### Files Modified
- None (investigation only — no code changes)

### Decisions Made
- FAQ JSON-LD structure is fully valid (correct `@type`, `mainEntity` array, all 5 Q&A objects)
- The fix is adding visible HTML only — no changes to the JSON-LD needed
- Rich Results Test tool (search.google.com/test/rich-results) requires interactive JS — can't run headlessly; will need to validate manually after the HTML section is added

### Open Items
- [x] Add visible FAQ accordion to `index.html` ✅ Done in Session 13
- [ ] Validate at https://search.google.com/test/rich-results after deploying

---

## Session: 2026-02-27 (Session 15) — Short Link Research

### What Was Done
- Identified that the "Copy results link" button produces a long `#b=...&r=...` URL that looks scary when pasted into WhatsApp etc.
- Researched the short link implementation from Bill Split (Session 9) to understand the approach
- Determined recommended implementation: Cloudflare Pages Functions + Upstash Redis (same REST API pattern as Bill Split)

### Files Modified
- None — research/planning session only

### Decisions Made
- Use Cloudflare Pages Functions instead of Vercel (site is already on Cloudflare Pages — simpler)
- Reuse Upstash Redis free account from Bill Split (or create a second DB — keys won't collide if prefixed)
- Payload keys already compact in this project — no compression step needed
- Must use Upstash REST JSON array format (`["SET", code, payload, "EX", ttl]`) — NOT URL path segment (that was the bug hit in Bill Split)

### Open Items
- [ ] Implement short link feature for "Copy results link" button (Cloudflare Pages Functions + Upstash Redis)

---

## Session: 2026-02-27 (Session 14) — FAQ Section & Ad Slot Layout Fixes

### What Was Done
- Converted FAQ from `<details>`/`<summary>` accordion to plain always-visible text in a single container
- Fixed FAQ section being stuck in the left grid column — added `grid-column: 1 / -1` to span full width
- Fixed ad slot (`#adSlot`) with same `grid-column: 1 / -1` so it's full-width when activated
- Moved FAQ section inside `<main>` (after amortization table, before `</main>`) so it's contained in the page layout
- Established Playwright visual verification workflow — use element screenshot before reporting done
- Used Playwright to verify both FAQ and ad slot render correctly at full width

### Files Modified
- `index.html` — CSS updated (`.faq-section` gets card styles + `grid-column: 1 / -1`, `.faq-item` stripped to plain div); HTML converted from `<details>`/`<summary>` to `<div>`+`<h3>`+`<p>`; ad slot inline style updated

### Decisions Made
- Plain visible text preferred over accordion — simpler, no alignment quirks, Google can read it fine
- `grid-column: 1 / -1` is the correct fix for any full-width element inside a CSS grid `<main>`
- Playwright node module path: `/home/ub-rissa/.npm/_npx/e41f203b7505f1fb/node_modules/playwright`

### Open Items
- [ ] Validate at https://search.google.com/test/rich-results after deploying

---

## Session: 2026-02-26 (Session 13) — Visible FAQ Accordion

### What Was Done
- Added visible FAQ accordion section to `index.html` between `</main>` and scroll buttons
- 5 `<details>`/`<summary>` items using verbatim Q&A text from JSON-LD schema
- Added `.faq-section`, `.faq-item`, `.faq-answer` CSS (main, responsive, print)

### Files Modified
- `index.html` — 4 targeted edits: CSS main styles, CSS responsive (`≤780px`), CSS print, HTML section

### Decisions Made
- Used `<details>`/`<summary>` — Google can read closed `<details>` content as it's always in the DOM
- Placed section between `</main>` and `.scroll-btns` so it's outside the grid layout
- No changes to JSON-LD needed

### Open Items
- [x] Validate at https://search.google.com/test/rich-results after deploying — carried forward

---

## Session: 2026-02-26 (Session 11) — CSV Export Overhaul

### What Was Done
- Updated CSV export to match the amortization table exactly (same columns, same logic)
- Added site metadata to the top 3 rows of every CSV (URL, loan params, generation date)
- Updated download filename to `payoff.saltnfork.com-loan-amortization.csv`

### Files Modified
- `index.html` — CSV export section (~line 2560)

### Decisions Made

**Column matching:** CSV now uses the same conditional logic as `buildTable`:
- Base 5 columns always: Month, Payment, Principal, Interest, Balance
- Extra columns added when `hasExtras`: Extra Pmt, Balance (w/ Extra)
- Pinned columns added when `savedScenario` exists: Pinned Extra, Balance (Pinned)
- Extra Pmt / Pinned Extra both show extra-over-base amount (consistent with table)
- Post-payoff rows show empty + "Paid off" (same as table)

**Metadata rows:** 3 rows at top of file before a blank row, then the column header:
```
"Loan Payoff Calculator","https://payoff.saltnfork.com"
"Balance","$207,811","Rate","10.51%","Term","60 mo","Payment","$4,467.70"
"Generated","February 26, 2026"
(blank)
Month,Payment,...
```
Opens cleanly in Excel/Google Sheets — URL is visible at row 1.

**Filename:** `payoff.saltnfork.com-loan-amortization.csv` — site name prefix for brand recall.

### Key Code (full replacement of CSV export handler)

```javascript
document.getElementById('csvBtn').addEventListener('click', function() {
    const auto = S.calcPayment;
    const currentBasePmt = S.biweekly ? auto : (S.paymentOverridden ? S.manualPayment : auto);
    const effectivePmt   = S.biweekly ? auto * 13 / 12 : currentBasePmt;
    const hasExtras = S.extra > 0 || S.biweekly || S.lumpSum > 0;
    const current   = amortize(S.balance, S.rate, currentBasePmt, 0, 0, 0);
    const withExtra = hasExtras
      ? amortize(S.balance, S.rate, effectivePmt, extraMonthly(), S.lumpSum, S.lumpMonth)
      : null;
    const savedRows = savedScenario ? savedScenario.rows : null;

    const siteUrl = 'https://payoff.saltnfork.com';
    const today = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

    const lines = [
      `"Loan Payoff Calculator","${siteUrl}"`,
      `"Balance","${fmtI(S.balance)}","Rate","${S.rate.toFixed(2)}%","Term","${S.term} mo","Payment","${fmtN(currentBasePmt)}"`,
      `"Generated","${today}"`,
      ``
    ];

    let header = 'Month,Payment,Principal,Interest,Balance';
    if (withExtra) header += ',Extra Pmt,Balance (w/ Extra)';
    if (savedRows)  header += ',Pinned Extra,Balance (Pinned)';
    lines.push(header);

    current.rows.forEach(function(r, i) {
      const row = [
        r.month,
        r.payment.toFixed(2),
        r.principal.toFixed(2),
        r.interest.toFixed(2),
        r.balance.toFixed(2)
      ];
      if (withExtra) {
        if (withExtra.rows[i]) {
          const extraAmt = withExtra.rows[i].payment - r.payment;
          row.push(extraAmt > 0.005 ? extraAmt.toFixed(2) : '0.00');
          row.push(withExtra.rows[i].balance.toFixed(2));
        } else {
          row.push('', 'Paid off');
        }
      }
      if (savedRows) {
        if (savedRows[i]) {
          const pinnedAmt = savedRows[i].payment - r.payment;
          row.push(pinnedAmt > 0.005 ? pinnedAmt.toFixed(2) : '0.00');
          row.push(savedRows[i].balance.toFixed(2));
        } else {
          row.push('', 'Paid off');
        }
      }
      lines.push(row.join(','));
    });

    const blob = new Blob([lines.join('\n')], { type: 'text/csv' });
    const a = Object.assign(document.createElement('a'), {
      href: URL.createObjectURL(blob),
      download: 'payoff.saltnfork.com-loan-amortization.csv'
    });
    a.click();
    URL.revokeObjectURL(a.href);
  });
```

### Open Items
- [ ] Validate FAQ schema: https://search.google.com/test/rich-results

---

## Session: 2026-02-26 (Session 10) — UX Bug Fixes + Amortization Table Overhaul

### What Was Done
- Fixed balance slider sensitivity (logarithmic scale — was jumping $50k+ per pixel)
- Fixed monthly payment input: added `$` prefix, comma+decimal formatting, fixed `parseFloat` comma bug
- Overhauled amortization table: now shows extra payment columns (green) and pinned scenario columns (purple)
- Made amortization table full-width (no more horizontal scroll)
- Fixed hash URL restoration for balance slider (was clamping to max)
- Renamed and fixed pinned scenario column data (was showing full payment, now shows extra-only for consistency)
- Ran full 51-test Playwright suite — all passed

### Files Modified
- `index.html` — all changes below

### Decisions Made

**Balance slider logarithmic scale:**
- Old: `min="500" max="2000000" step="1000"` → 1px ≈ $6,600 drag
- New: `min="0" max="1000" step="1"` with log mapping: `balFromSlider(v) = Math.round(500 * Math.pow(4000, v / 1000))` and `sliderFromBal(b) = Math.round(1000 * Math.log(b / 500) / Math.log(4000))`
- Default $20k → slider position 445 (44.5% of width)
- Custom IIFE replaces `linkPairText()` for balance (log mapping incompatible with linear `linkPairText`)
- Hash restoration: changed `set('b', 'balance', 'balanceSlider', ...)` to `set('b', 'balance', null, ...)` then manually set slider with `sliderFromBal()`

**Payment input formatting:**
- Changed `type="number"` → `type="text" inputmode="decimal"`
- Wrapped in `.input-prefix-wrap` div with `<span class="input-prefix">$</span>`
- Added `formatCommaDec(n)` helper (2 decimal places, locale commas) — separate from `formatComma` which rounds to whole numbers
- Old `parseFloat(this.value)` → `parseComma(this.value)` (fixes silent truncation at comma: "1,500" → 1)
- Focus handler strips commas; blur reformats

**Amortization table — extra + saved columns:**
- `buildTable(currentRows, extraLength)` → `buildTable(currentRows, extraRows, savedRows)` (pass full arrays, not lengths)
- Dynamic thead rebuilt on every call
- Green class `extra-col`: `--success` palette (matches summary table green)
- Purple class `saved-col`: `#7c3aed` / `#f5f3ff` (matches Pin button purple)
- "Pinned Extra" column shows extra-over-base (not full payment) — consistent with green "Extra Pmt"
- `grid-column: 1 / -1` on `.table-actions` and `.table-wrap` → full-width, no horizontal scroll

### Key Code Added

**New helpers (after `parseComma`):**
```javascript
function formatCommaDec(n) { return (+n).toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2}); }
function balFromSlider(v) { return Math.round(500 * Math.pow(4000, v / 1000)); }
function sliderFromBal(b) { return Math.round(1000 * Math.log(b / 500) / Math.log(4000)); }
```

**Balance IIFE (replaces `linkPairText('balance', ...)`):**
```javascript
(function setupBalanceInput() {
  const inp = document.getElementById('balance');
  const sld = document.getElementById('balanceSlider');
  inp.addEventListener('input', () => {
    const v = parseComma(inp.value);
    if (!v) return;
    S.balance = v;
    sld.value = sliderFromBal(Math.min(Math.max(v, 500), 2000000));
    setFill(sld); recalc();
  });
  inp.addEventListener('focus', () => { inp.value = S.balance; });
  inp.addEventListener('blur',  () => { inp.value = formatComma(S.balance); });
  sld.addEventListener('input', () => {
    const b = balFromSlider(parseFloat(sld.value));
    inp.value = formatComma(b); setFill(sld);
    S.balance = b; recalc();
  });
  inp.value = formatComma(S.balance);
  sld.value = sliderFromBal(S.balance);
  setFill(sld);
})();
```

**Payment IIFE (replaces old `addEventListener('input', ...)`):**
```javascript
(function setupPaymentInput() {
  const paymentEl = document.getElementById('payment');
  paymentEl.addEventListener('input', function () {
    const v = parseComma(this.value);
    if (isNaN(v) || v <= 0) return;
    const diff = Math.abs(v - S.calcPayment);
    if (diff > 0.01) {
      S.paymentOverridden = true;
      S.manualPayment = v;
    } else {
      S.paymentOverridden = false;
    }
    recalc();
  });
  paymentEl.addEventListener('focus', function () {
    const raw = parseComma(this.value);
    if (raw) this.value = raw.toFixed(2);
  });
  paymentEl.addEventListener('blur', function () {
    const raw = parseComma(this.value);
    if (raw) this.value = formatCommaDec(raw);
  });
})();
```

### Open Items
- [ ] Push to origin/main: `git push origin main`
- [ ] Validate FAQ schema: https://search.google.com/test/rich-results

### Key Files to Reference
- `index.html` — full app (~2800+ lines), all CSS + JS inline
- `PROJECT_STATE.md` — all features ✅

### Key Files to Reference
- `index.html` — full app (~2650 lines), all CSS + JS inline
- `PROJECT_STATE.md` — all features ✅

### Notes for Continuation
- **No git repo yet** — `git init` is a deploy step, not done yet
- **Bi-weekly model:** "Current Plan" = standard auto payment; "With Extra" = auto × 13/12
- **Lump sum:** applies to "With Extra" column only
- **Balance input:** `type="text"` with comma formatting via `linkPairText` — not `type="number"`
- **refiRows:** module-level var; set in `recalc()` when refinance `<details>` is open; read by `drawChart()`
- **savedScenario:** `{ label, payment, totalInterest, payoffDate, months, extraPaid, rows }` — now encoded in URL hash (`pp/pi/pm/pe/pl/pd`) and stored in named scenario hashes
- **Named scenarios:** stored in `localStorage` key `payoff_scenarios` as `[{name, hash}]` — capped at 5
- **"With Extra" column header:** dynamic — shows `scenarioLabel()` output (e.g. "+$600/mo") when extras active; resets to "With Extra" when cleared
- **Copy results link:** lives in `.copy-results-bar` div above the comparison table (inside `#summaryCard`), not in the header

---

## Session: 2026-02-25 (Session 9) - FAQ Schema + Pay Off By Date

### What Was Done
- **FAQ structured data** — Added second `<script type="application/ld+json">` block with `FAQPage` schema (5 Q&As targeting real search queries). Eligible for Google rich results / featured snippets.
- **Pay Off By Date (reverse calculator)** — New field at bottom of inputs card: two dropdowns (Month/Year), live result message, Apply button. User picks a target payoff date and instantly sees the extra monthly payment required. Apply populates the Extra Payment field and triggers recalc.

### Files Modified
- `index.html`:
  - Head: Added `FAQPage` JSON-LD block after existing `WebApplication` schema (5 Q&As)
  - CSS: Added `.target-date-row`, `.target-result`, `.target-extra`, `.target-on-track`, `#targetApplyBtn`, `#targetApplyBtn:hover` rules
  - HTML: Added `#targetDateField` div with `#targetMonth`, `#targetYear` selects and `#targetResult` with `aria-live="polite"`, `#targetMsg`, `#targetApplyBtn`
  - JS: Added `var computeTargetDate = null` module-level var; added `if (computeTargetDate) computeTargetDate()` at end of `recalc()`; added Pay Off By Date IIFE after start date IIFE

### Decisions Made
- `computeTargetDate` is module-scoped so `recalc()` can call it without coupling the IIFE to `recalc`'s internals
- Apply button is always in DOM (no innerHTML re-injection) so listener never needs re-attachment
- `pendingExtra` is a closure var so Apply always uses the most recently computed value
- Year range: `curYear-1` to `curYear+40` — wide enough for any loan start date

### Open Items
- [ ] Validate FAQ schema at https://search.google.com/test/rich-results

---

## Session: 2026-02-25 (Session 8) - UI Polish + Pin for Comparison Wiring

### What Was Done
- **Pin for Comparison** — renamed "Save Scenario" → "Pin for Comparison", "Saved:" → "Pinned:" in callout label, tooltip updated to match
- **Comparison column header** — now dynamic: saved column shows `savedScenario.label` (e.g. "+$600/mo") instead of static "Saved"; "With Extra" column header also dynamic via `scenarioLabel()`, resets to "With Extra" when no extras active
- **URL hash encodes pinned scenario** — `encodeHash()` now spreads `pp/pi/pm/pe/pl/pd` when `savedScenario` is set; `loadHash()` restores `savedScenario` from those params
- **Named scenarios cap at 5** — `saveNamedBtn` handler guards against pushing when `list.length >= 5`; new `updateNamedSaveCap()` function disables input + button and changes placeholder to "Delete a scenario to save a new one" when at limit; called at end of `renderScenarioList()`
- **"Your Loan" header ⓘ button** — explanation paragraph removed from bottom of results; text moved into ⓘ tooltip on "YOUR LOAN" card-head (right-aligned). `.card-head` made flex with `justify-content: space-between`. Tooltip text rewritten as 3 bulleted lines.
- **Tooltip bullets** — added `white-space: pre-line` to `#tipBox` CSS; tooltip text uses `&#10;` newlines for bullet lines. Widened `max-width` to 240px.
- **Copy results link** — removed bare chain icon from header; new `.copy-results-bar` div above comparison table with `#copyLinkBtn` showing chain icon + "Copy results link" label. Label swaps to "Copied!" for 2s on click. Print CSS updated (`header #copyLinkBtn` → `#copyLinkBtn`).
- **Bi-weekly gap fix** — removed `min-height: 1.1em` from `.biweekly-sub`; dead space below toggle when off is now gone

### Files Modified
- `index.html` — all changes (single-file app):
  - `.card-head`: added `display: flex; align-items: center; justify-content: space-between`
  - `#tipBox`: added `white-space: pre-line`, widened `max-width` to 240px
  - `.biweekly-sub`: removed `min-height: 1.1em`
  - Added `.copy-results-bar`, `#copyLinkBtn` CSS rules
  - HTML: "Your Loan" card-head now has `<span>` + `.tip` button
  - HTML: removed `<p class="how-it-works-text">` paragraph
  - HTML: removed `copyLinkBtn` from `<header>`; added `.copy-results-bar` + new `#copyLinkBtn` above `<table>` in `#summaryCard`
  - HTML: `#extraHead` given `id`; `#savedHead` text set dynamically in `recalc()`
  - JS `renderSummary()`: sets `extraHead.textContent = scenarioLabel()` or `'With Extra'`
  - JS `recalc()`: sets `savedHead.textContent = savedScenario.label`
  - JS `encodeHash()`: spreads `pp/pi/pm/pe/pl/pd` when `savedScenario` exists
  - JS `loadHash()`: restores `savedScenario` from `pp` params
  - JS `saveNamedBtn` handler: guards `list.length >= 5` before push
  - JS: new `updateNamedSaveCap()` function; called at end of `renderScenarioList()`
  - JS copy link handler: also swaps `copyLabel.textContent` ("Copy results link" ↔ "Copied!")
  - Print CSS: `header #copyLinkBtn` → `#copyLinkBtn`

### Decisions Made
- Used `&#10;` newlines in `data-tip` attribute (not HTML) + `white-space: pre-line` on tipBox — keeps the tooltip system consistent (all plain text) while enabling line breaks
- Removed copy link from header entirely (not duplicated) — the header was getting crowded and the new location is contextually better
- `min-height` removal on `.biweekly-sub` accepted the minor layout reflow on toggle as the right tradeoff — the gap was more distracting than the shift

### Open Items
- [ ] Deploy: `git init` → push GitHub → connect Cloudflare Pages → DNS CNAME `payoff`
- [ ] Create `og-image.png` (screenshot `og-image.html` at 1200×630)

---

## Session: 2026-02-25 (Session 7) - Bug Fixes + Currency Formatting

### What Was Done
- Removed loan type preset selector — it only set default values with no calculation difference between types; confirmed math is identical regardless of type
- Fixed missing "paying" in callout sentence: "By an extra $200/mo..." → "By paying an extra $200/mo..." — also correctly handles lump-sum-only and biweekly+extra combinations without doubling the word
- Fixed chart legends being cut off — root cause was `canvas.parentElement.clientWidth` returning content area + padding, so the canvas was wider than visible space and clipped by the card's `overflow: hidden`. Fixed by subtracting computed `paddingLeft + paddingRight` from the measurement
- Added currency formatting throughout:
  - Locale detection via `navigator.language` with a locale→currency map (40+ entries), defaulting to USD for unrecognised locales
  - `fmtN(n)` and `fmtI(n)` now use `Intl.NumberFormat` with `style: 'currency'`
  - Added `fmtChart(n)` with compact notation (`$100K`, `$25K`) for chart y-axis labels to avoid overflow in the 54px left padding
  - Removed hardcoded `$` from chart tooltip (lines 1964–1969) and `scenarioLabel()` since `fmtN`/`fmtI` now include the symbol

### Files Modified
- `index.html` — all CSS-only (no new files):
  - Removed `.preset-row` and `.preset-row select` CSS blocks
  - Removed `<div class="preset-row">` HTML
  - Removed `PRESETS` object, `resetPreset()` function, loanType event listener, and all `resetPreset()` call sites
  - Added `LOCALE` / `CURRENCY` detection block before formatters
  - Replaced `fmtN` and `fmtI` with `Intl.NumberFormat`-based implementations
  - Added `fmtChart` for compact axis labels
  - Swapped `fmtI` → `fmtChart` in both chart y-axis `fillText` calls
  - Removed hardcoded `$` from chart tooltip and `scenarioLabel()`
  - Fixed canvas width computation: `clientWidth - paddingLeft - paddingRight`
  - Added "paying" prefix logic to callout sentence

### Decisions Made
- Used `navigator.language` (not geolocation) for currency detection — locale is a reasonable proxy, not a guarantee. Documented this in a code comment. Default is USD for unrecognised locales.
- Used `notation: 'compact'` for chart axis only — full currency on table/callout values, compact only where space is constrained
- Let `Intl.NumberFormat` use the currency's default fraction digits (e.g. JPY gets 0 decimals automatically)
- Kept `formatComma()` unchanged — it formats the balance text INPUT field where the user types, so no `$` symbol wanted there

### Open Items
- [ ] Deploy: `git init` → push GitHub → connect Cloudflare Pages → DNS CNAME `payoff`
- [ ] Create `og-image.png` (screenshot `og-image.html` at 1200×630)

---

## Session: 2026-02-25 (Session 6) - Playwright QA + Mobile Bug Fixes

### What Was Done
- Ran full Playwright visual review of the app across all features and viewport sizes
- Identified 3 real bugs and 2 minor issues from screenshots
- Fixed all bugs:
  1. **Mobile WITH EXTRA column values clipped** — `min-width: 0` on `.results` + smaller font/padding on `cmp-table` at ≤420px
  2. **Mobile CSV button clipped** — same root fix (`min-width: 0` on `.results`)
  3. **Refi table labels wrapping on mobile** — `table-layout: fixed` with 55/45 column split + `font-size: 0.75rem` on label column at ≤420px
- Verified all fixes with follow-up Playwright screenshots
- Skipped dark mode card-head "reddish tint" (confirmed CSS variable `--text-3: #94a3b8` is correct blue-gray — AI reviewer false positive)
- Skipped chart legend size on mobile (canvas-rendered, borderline readable, acceptable)

### Files Modified
- `index.html` — CSS changes only (3 edits to the `<style>` block):
  1. Added `min-width: 0` to `.results` rule
  2. Expanded `@media (max-width: 420px)` block with reduced table font/padding
  3. Added refi table mobile layout fixes

### Decisions Made
- Used `min-width: 0` on `.results` (the grid cell) as the root fix for overflow — this is the correct CSS Grid pattern
- Chose font/padding reduction over `overflow-x: auto` for the cmp-table — keeps the table static, no horizontal scroll needed
- Used `table-layout: fixed` with explicit column widths for the refi table instead of just reducing font size — more robust

### Open Items
- [ ] Deploy: `git init` → push GitHub → connect Cloudflare Pages → DNS CNAME `payoff`
- [ ] Create `og-image.png` (screenshot `og-image.html` at 1200×630)

---

## Session: 2026-02-25 (Session 5) - Batches 3, 4 & 5 — All 15 Features Complete

### What Was Done
- Implemented Batch 3: chart hover tooltips (balance mode, rAF-throttled) + Balance/Breakdown stacked area chart toggle
- Implemented Batch 4: loan type presets dropdown + scenario comparison (3rd column + purple dashed chart line) + comma formatting on balance input
- Implemented Batch 5: refinance calculator (`<details>` section) + save/load named scenarios (localStorage) + print stylesheet

### Files Modified
- `index.html` — grew from ~1780 to ~2607 lines with all new features
- `SESSION.md` — updated
- `PROJECT_STATE.md` — all Batch 3–5 features marked ✅

### Decisions Made

**Batch 3 — Chart hover tooltips:**
- Module-level `lastChartData` cache stores all draw params at end of `drawChart()`
- `mousemove` uses `requestAnimationFrame` to throttle redraws
- `drawTooltipOverlay()` draws on top of already-drawn chart (no double-scale — `drawChart` resets canvas, so dpr scale is applied once before overlay runs)
- Tooltips disabled in breakdown mode (breakdown has different geometry)

**Batch 3 — Breakdown chart:**
- Stacked area: cumulative principal (blue, bottom) + cumulative interest (orange, top)
- Y-axis re-labeled to show total cumulative amounts (max = balance + total interest)
- Tab buttons in chart card header use `role="tablist"` + `aria-selected`

**Batch 4 — Presets:**
- `PRESETS` object with `balMin/balMax`, `rateMin/rateMax`, `termMin/termMax` per loan type
- On preset select: updates slider `min`/`max`/`value` attributes, then state, then `recalc()`
- Manual input change calls `resetPreset()` → sets `#loanType` back to `'custom'`
- `linkPair` calls for rate/term/extra pass `resetPreset` as `onChangeExtra` callback

**Batch 4 — Scenario comparison:**
- `savedScenario` module-level var (session-only, not persisted)
- Save button disabled when no extras active (checked via `updateSaveBtn()` called from `recalc()`)
- 3rd table column (`<th id="savedHead">`) + 5 `<td>` cells hidden by default, shown when saved
- Purple dashed line drawn in `drawChart()` balance mode when `savedScenario` exists

**Batch 4 — Comma formatting:**
- Balance `<input>` changed to `type="text" inputmode="numeric"`
- `linkPairText()` replaces `linkPair()` for balance — formats on blur, raw on focus
- `loadHash()` calls `formatComma(S.balance)` after parsing `b=` param

**Batch 5 — Refinance:**
- `S.refiRate`, `S.refiTerm`, `S.closingCosts` added to state
- Module-level `refiRows = null` — set in `recalc()` when `<details>` is open and inputs provided
- Break-even guards: "Immediate" / "Never (refi costs more per month)" / N months
- `<details>` `toggle` event triggers `recalc()` so teal line appears/disappears on chart

**Batch 5 — Named scenarios:**
- `localStorage` key `payoff_scenarios` → `[{name, hash}]`
- Save: `encodeHash()` → grab `location.hash` → push to array (overwrite if same name)
- Load: set `location.hash` + call `loadHash()` + `recalc()`
- List renders on section `toggle` open event

**Batch 5 — Print:**
- `@media print` hides sliders, chart, header buttons, preset row, table toggle, scenario bar, refi inputs, saved scenarios section, footer
- Forces `.table-wrap` visible
- Single-column layout, black text, `page-break-inside: avoid` on rows and cards

---

## Session: 2026-02-25 - Full Initial Build (via Claude Inbox - Remote)

### What Was Done
- Greenfield build: wrote complete `index.html` single-file app from scratch
- No prior code existed — project was just a `project-status.json` placeholder
- Built planning phase first (plan approved by user), then full implementation

### Files Created
- `index.html` — full app (~430 lines HTML + CSS + JS, zero dependencies)
- `SESSION.md` — this file
- `PROJECT_STATE.md` — project snapshot

### Files Modified
- `project-status.json` — updated status from "idea" to "active"

---

### App Architecture

**Single-file HTML** — all CSS and JS inline. No frameworks, no build tools, no npm.

**File:** `index.html`

**Structure:**
```
<head> — SEO meta, OG tags, canonical, Google Fonts (Inter)
<header> — app title
<main> — 2-column grid (inputs left, results right)
  <div.card.inputs-card>
    - Loan Balance (input + range slider)
    - Annual Interest Rate (input + range slider)
    - Loan Term months (input + range slider)
    - Monthly Payment (input only, auto-calc, override + reset)
    - Extra Monthly Payment (input + range slider)
  <div.results>
    - Comparison table card (Current Plan vs With Extra)
    - Callout sentence card (live-updating, copy-pasteable)
    - Balance chart card (Canvas API, two lines)
    - Toggle button → Amortization table
<footer> — full Salt n' Fork ecosystem links
```

**Key JS functions:**
- `stdPayment(P, rate, n)` — standard amortization formula
- `amortize(P, rate, basePayment, extraPayment)` — builds full schedule
- `recalc()` — master update function, called on every input change
- `drawChart(currentRows, extraRows)` — Canvas API line chart
- `buildTable(currentRows, extraLength)` — amortization table DOM builder
- `linkPair(inputId, sliderId, stateKey)` — binds input↔slider bidirectionally
- `encodeHash()` / `loadHash()` — URL hash state persistence

**Slider fill technique:**
- CSS custom property `--pct` set per-element via JS
- `background: linear-gradient(to right, var(--primary) var(--pct), var(--border) var(--pct))`

**Monthly payment override:**
- Auto-calculates from balance + rate + term
- User can type to override; field turns amber
- "↺ reset" button restores auto-calc value
- Extra payment is additive on top of this

**Amortization table features:**
- Hidden by default, revealed by toggle button
- Row at `extraLength` index gets `.early-payoff` class (yellow bg, ★ in month col)
- Rows beyond `extraLength` get `.dimmed` class (opacity 0.3)
- Auto-scrolls highlighted row into view when opened

**URL hash state:**
- Encodes: balance (`b`), rate (`r`), term (`t`), extra (`e`), manual payment (`p`)
- Debounced 350ms after input
- Loaded on page init — shareable/bookmarkable URLs

### Design Decisions
- **App name:** "Loan Payoff Calculator" (per user spec — not my earlier "Loan Calculator" plan)
- **Deploy URL:** `https://payoff.saltnfork.com` (per user spec)
- **Color scheme:** Blue primary (#3b82f6), Emerald success (#10b981), slate backgrounds
- **No currency symbols** — plain numbers with comma formatting only
- **Rate displayed as X.XX%** — two decimal places
- **Mobile:** single-column stacked layout at ≤780px
- **Touch targets:** sliders use `padding: 14px 0` for tall touch area, 20px thumb

### Known Verification Steps (do manually in browser)
1. $100,000 at 5% for 30 years (360 months) → monthly payment should be ~277.99
2. $20,000 at 6.5% for 60 months → monthly payment should be ~391.32
3. Add extra payment, confirm callout sentence updates live
4. Check amortization table: early-payoff row highlighted, subsequent rows dimmed
5. Copy URL hash, open fresh tab → values should restore
6. Resize to mobile width → single column layout, no overflow
7. Print preview → table should be clean

### Open Items
- [ ] Deploy to `payoff.saltnfork.com` (user handles DNS/hosting)
- [ ] Add this URL to the Salt n' Fork ecosystem list in CLAUDE.md once live
- [ ] Consider: variable rate support (v2)
- [ ] Consider: export/print button for amortization table
- [ ] Verify actual monthly payment calculation values against a known calculator

---

## Session: 2026-02-25 — Site-Launch Checklist

### What Was Done
- Ran `/site-launch` skill (Cloudflare Pages platform)
- Audited all phases 1–6, applied all fixes

### index.html Changes
- Added flash-prevention dark mode script (first in `<head>`)
- Added `<meta name="theme-color">`
- Added `<noscript>` fallback after `<body>`
- Added `[data-theme="dark"]` CSS vars block (14 properties)
- Fixed `--text-3` contrast: `#94a3b8` → `#64748b` (4.6:1 ratio, passes WCAG AA)
- Changed `.n-input:focus` → `.n-input:focus-visible`
- Added `prefers-reduced-motion` media query
- Added dark mode toggle button in header
- Added dark mode JS (applyTheme function, persists to localStorage)
- Added: `og:site_name`, `og:image` (+width/height/type), all Twitter Card tags, `meta robots`, `meta author`
- Added: `<link rel="icon">`, `<link rel="manifest">`
- Added JSON-LD `WebApplication` structured data
- Added "How it works" `<details>` section (grid-column: 1/-1 to span full width)

### Files Created
- `favicon.svg` — path-based dollar sign icon on blue bg (no font dependency)
- `og-image.html` — screenshottable 1200×630 template for og-image.png
- `sitemap.xml`
- `robots.txt`
- `manifest.json`
- `.gitignore` — Cloudflare-specific (.wrangler/, .cloudflare/)
- `_headers` — Cloudflare Pages security headers (CSP, X-Frame-Options, etc.)
- `404.html` — branded 404 with dark mode support

### Ecosystem Registration
- Added `- Loan Payoff: https://payoff.saltnfork.com` to `~/.claude/CLAUDE.md`
- Added `"Loan_repayment_calculator": "https://payoff.saltnfork.com"` to `~/.claude/scripts/update-footers.py`

### Open Items
- [ ] User must create `og-image.png` — open `og-image.html` in browser, screenshot at 1200×630
- [ ] Initialize git: `git init` → commit → push to GitHub
- [ ] Connect GitHub repo to Cloudflare Pages (no build command, output: `/`)
- [ ] DNS: Add CNAME `payoff` → Cloudflare Pages domain (proxied)
- [ ] After deploy: run `update-footers` to add payoff link to all other S&F app footers
- [ ] Verify security headers in DevTools after deploy
- [ ] Submit sitemap to Google Search Console

---

## Session: 2026-02-25 — Playwright Audit + Bug Fixes

### What Was Done
- Ran Playwright screenshot audit across light/dark/mobile/desktop
- Found and fixed 9 issues from post-implementation review + visual audit

### Bugs Fixed

1. **Slider track invisible** — Root cause: `background`+`background-clip:content-box` doesn't reliably paint tracks in Chrome. Switched to `::-webkit-slider-runnable-track` with explicit gradient. Light unfilled: `#94a3b8`, dark unfilled: `#3a4a60`. Also added `::-moz-range-track` / `::-moz-range-progress` for Firefox.

2. **Chart not redrawn on theme toggle** — Added `recalc()` call inside `applyTheme()`.

3. **Chart colors hardcoded** — `drawChart()` now reads `data-theme` attribute and picks `gridCol`, `labelCol`, `lineCol` per theme.

4. **`.n-input.overridden` hardcoded cream background in dark mode** — Added `[data-theme="dark"] .n-input.overridden { background: #1c1208; border-color: #b45309 }`.

5. **`.toggle-btn:hover` nearly-white in dark mode** — Added `[data-theme="dark"] .toggle-btn:hover { background: var(--bg) }`.

6. **`.error-msg` hardcoded light colors** — Added dark override.

7. **`align-items: baseline` misaligned toggle button** — Changed `.header-inner` to `align-items: center`.

8. **`<details>` clipped by `.card { overflow: hidden }`** — Removed `.card` class from `.how-it-works` element; moved card-like styling (bg, border, shadow, radius) into dedicated `.how-it-works` CSS rule without `overflow: hidden`.

9. **Emoji toggle icons inconsistent across OS** — Replaced 🌙/☀️ emoji with SVG moon/sun icons (`#iconMoon`, `#iconSun`). Updated JS to toggle `display` on each SVG instead of setting `textContent`.

---

## Session: 2026-02-25 — Batch 1 + Batch 2 Feature Additions

### What Was Done

**Batch 1 (5 features):**
- Added "Total Extra Paid" row to summary table (correctly uses `(effectivePmt + S.extra) - basePmt × eLen`)
- Added copy link button in header (chain icon → checkmark for 2s after click)
- Added CSV export button beside amortization toggle (downloads `loan-amortization.csv`)
- Added field tooltip ⓘ buttons on Rate, Term, Monthly Payment, Extra Monthly Payment labels (fixed-position JS-managed `#tipBox`)
- Verified with Playwright: all 5 features working; Total Extra Paid shows correctly with $200/mo extra

**Batch 2 (3 features):**
- Added Loan Start Date field (two `<select>` dropdowns: month + year, between Monthly Payment and Extra Monthly Payment)
- Added Pay bi-weekly toggle (toggle switch button, `role="switch"`, applies `auto × 13/12` multiplier)
- Added One-time Lump Sum Payment field (shows "Apply in month" row when amount > 0)
- Verified with Playwright: all 3 features working correctly in light + dark mode

### Files Modified

- `index.html` — all changes (single-file app)

### Architecture Changes (index.html)

**New state keys added to `S`:**
```js
S.startMonth  // 1–12, defaults to current month
S.startYear   // YYYY, defaults to current year
S.biweekly    // bool, false by default
S.lumpSum     // number, 0 by default
S.lumpMonth   // number, 1 by default (which month to apply lump sum)
```

**`payoffDate(months)` updated:**
```js
// Was: new Date(), setMonth(+months)
// Now: uses S.startYear and S.startMonth for real calendar dates
function payoffDate(months) {
  const d = new Date(S.startYear, S.startMonth - 1 + months, 1);
  return d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
}
```

**`amortize()` extended with lump sum params:**
```js
function amortize(P, annualRate, basePayment, extraPayment, lumpSum, lumpMonth) {
  // lumpSum applied before payment on month lumpMonth (reduces principal)
  // if lump sum fully pays off loan → special row added + break
}
```

**`recalc()` updated payment model:**
- `currentBasePmt` = auto (when biweekly) or overridden/auto
- `effectivePmt` = `auto × 13/12` (when biweekly) or `currentBasePmt`
- `hasExtras = S.extra > 0 || S.biweekly || S.lumpSum > 0`
- `current = amortize(balance, rate, currentBasePmt, 0, 0, 0)` — no extras
- `withExtra = amortize(balance, rate, effectivePmt, S.extra, S.lumpSum, S.lumpMonth)`
- `renderSummary(currentBasePmt, effectivePmt, current, withExtra)` — new signature

**New URL hash keys:**
| Key | Feature | Example |
|-----|---------|---------|
| `sd` | Start date | `sd=2026-02` |
| `bw` | Bi-weekly | `bw=1` |
| `ls` | Lump sum amount | `ls=5000` |
| `lm` | Lump sum month | `lm=6` |

**Resize handler simplified** — now calls `recalc()` directly instead of duplicating amortize logic.

**`renderCallout()` updated** — dynamically builds description from active extras (bi-weekly, extra monthly, lump sum).

### Decisions Made

- **Bi-weekly "current" baseline = auto payment (not override)** — when bi-weekly is on, the comparison is always standard-monthly vs bi-weekly, regardless of manual override. Override is suspended while bi-weekly is active.
- **Lump sum is an "extra" (shows in With Extra column only)** — current plan has no lump sum; comparison shows savings from lump sum.
- **Two `<select>` for start date (not `<input type="month">`)** — `type="month"` is broken/unstyled on older Safari/iOS.
- **Year options generated by JS** — populated `curYear - 30` to `curYear + 5` in an IIFE before `loadHash()`.

### Open Items

- [ ] Batch 3: Chart hover tooltips (balance mode only, `lastChartData` module-level cache), Balance/Breakdown toggle (stacked area chart)
- [ ] Batch 4: Loan type presets, Scenario comparison (1 saved slot), Comma formatting (balance input only)
- [ ] Batch 5: Refinance calculator, Save/load localStorage, Print stylesheet
- [ ] Deploy: `git init` → push GitHub → connect Cloudflare Pages → DNS CNAME
- [ ] Create `og-image.png` (screenshot `og-image.html` at 1200×630)
