# PROJECT_STATE — Loan Payoff Calculator

**Status:** Active — deployed, pending push to origin
**URL:** https://payoff.saltnfork.com
**Last Updated:** 2026-02-26 (Session 10)

---

## Feature Status

| Feature | Status |
|---|---|
| Loan Balance input + slider | ✅ Done |
| Annual Interest Rate input + slider | ✅ Done |
| Loan Term input + slider | ✅ Done |
| Monthly Payment (auto-calc, override, reset) | ✅ Done |
| Extra Monthly Payment input + slider | ✅ Done |
| Live recalculation (no submit button) | ✅ Done |
| Comparison summary table | ✅ Done |
| Savings sub-labels (save X, X mo sooner) | ✅ Done |
| Live callout sentence | ✅ Done |
| Canvas line chart (two balance lines) | ✅ Done |
| Amortization table (hidden by default) | ✅ Done |
| Early payoff row highlight | ✅ Done |
| Post-payoff row dimming | ✅ Done |
| URL hash state (shareable links) | ✅ Done |
| Responsive mobile layout | ✅ Done |
| Salt n' Fork footer | ✅ Done |
| SEO + OG meta tags | ✅ Done |
| Accessibility (labels, aria, thead) | ✅ Done |
| Dark mode (toggle, CSS vars, flash-prevention) | ✅ Done |
| `prefers-reduced-motion` | ✅ Done |
| WCAG AA contrast fix | ✅ Done |
| Security headers (`_headers` for Cloudflare) | ✅ Done |
| JSON-LD structured data | ✅ Done |
| Twitter Card meta tags | ✅ Done |
| PWA manifest | ✅ Done |
| favicon.svg | ✅ Done |
| sitemap.xml + robots.txt | ✅ Done |
| Custom 404 page | ✅ Done |
| Ecosystem registration (CLAUDE.md + update-footers) | ✅ Done |
| **Batch 1 — Total Extra Paid summary row** | ✅ Done |
| **Batch 1 — Copy link button** | ✅ Done |
| **Batch 1 — CSV export** | ✅ Done |
| **Batch 1 — Field tooltips (ⓘ buttons)** | ✅ Done |
| **Batch 2 — Loan Start Date (month + year selects)** | ✅ Done |
| **Batch 2 — Bi-weekly payment toggle** | ✅ Done |
| **Batch 2 — One-time Lump Sum Payment** | ✅ Done |
| **Batch 3 — Chart hover tooltips** | ✅ Done |
| **Batch 3 — Balance / Breakdown chart toggle** | ✅ Done |
| **Batch 4 — Loan type presets** | ✅ Done |
| **Batch 4 — Scenario comparison (1 saved slot)** | ✅ Done |
| **Batch 4 — Comma formatting on balance input** | ✅ Done |
| **Batch 5 — Refinance calculator** | ✅ Done |
| **Batch 5 — Save/load named scenarios (localStorage)** | ✅ Done |
| **Batch 5 — Print stylesheet** | ✅ Done |
| **Session 8 — Pin for Comparison (hash encode/decode + named scenario persistence)** | ✅ Done |
| **Session 8 — Dynamic column headers (With Extra + Saved)** | ✅ Done |
| **Session 8 — Named scenario cap (5 max)** | ✅ Done |
| **Session 8 — Copy results link (moved to comparison card)** | ✅ Done |
| **Session 8 — Your Loan ⓘ tooltip (replaced explanation paragraph)** | ✅ Done |
| **Session 8 — Bi-weekly gap fix** | ✅ Done |
| **Session 9 — FAQ structured data (FAQPage JSON-LD, 5 Q&As)** | ✅ Done |
| **Session 9 — Pay Off By Date (reverse calculator)** | ✅ Done |
| **Session 10 — Balance slider logarithmic scale (no more $50k jumps)** | ✅ Done |
| **Session 10 — Monthly payment $ prefix + comma/decimal formatting** | ✅ Done |
| **Session 10 — Amortization table extra payment columns (green)** | ✅ Done |
| **Session 10 — Amortization table pinned scenario columns (purple)** | ✅ Done |
| **Session 10 — Amortization table full-width (grid-column: 1/-1)** | ✅ Done |

---

## File Structure

```
Loan_repayment_calculator/
├── index.html          ← Full app (single file, ~2800+ lines)
├── favicon.svg         ← Path-based dollar sign icon
├── og-image.html       ← Screenshot template for og-image.png
├── og-image.png        ← Generated from og-image.html
├── sitemap.xml
├── robots.txt
├── manifest.json       ← PWA manifest
├── _headers            ← Cloudflare Pages security headers
├── 404.html            ← Custom 404 with dark mode
├── .gitignore
├── SESSION.md          ← Session log
├── PROJECT_STATE.md    ← This file
└── project-status.json ← Project metadata
```

---

## Architecture

- **Stack:** Pure HTML/CSS/JS — zero dependencies, no build tools
- **External:** Google Fonts (Inter) — async, non-blocking
- **Math:** Standard amortization formula + month-by-month loop for extra payments
- **Lump sum:** Applied to principal before regular payment on specified month
- **Bi-weekly:** `auto × 13/12` multiplier; "current" baseline = standard auto payment
- **Chart:** Canvas API (no library)
- **State persistence:** URL hash (`b`, `r`, `t`, `e`, `sd`, `bw`, `ls`, `lm`, `p`, `pp`, `pi`, `pm`, `pe`, `pl`, `pd`)
- **Pin for Comparison:** `savedScenario` encoded in hash as `pp/pi/pm/pe/pl/pd`; named scenarios store full hash including pin params
- **Named scenario cap:** 5 max; `updateNamedSaveCap()` disables UI when full

---

## Pending Batches (approved plan)

Plan file: `~/.claude/plans/compressed-sleeping-pancake.md`

- **Batch 3:** Chart hover tooltips (balance mode, `lastChartData` cache) + Balance/Breakdown stacked area toggle
- **Batch 4:** Loan type presets (PRESETS object + select) + Scenario comparison (3rd column) + Comma formatting (balance only, `linkPairText`)
- **Batch 5:** Refinance calculator (`<details>` section) + Save/load localStorage + Print stylesheet

## Backlog (v2 ideas)

- Variable rate support
- Multiple loan comparison
