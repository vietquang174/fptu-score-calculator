# Project: Score Calculator Web Enhancement

## Architecture
Single-page application (SPA) providing FPT University Software Engineering (K20B) grade calculation, hurdle checking, honors prediction, and official A4 transcript export.
- **Frontend Presentation Layer**: `index.html` hosting two view panels:
  - `#view-home`: Dedicated marketing landing experience inspired by PrepEdu (radial royal blue background, concentric rings, glowing CTA, rich mascot visual showcase).
  - `#view-calculator`: Pro192-inspired clean modern engineering calculation workspace (semester tabs, course score inputs, real-time TBM summary, honors badge).
- **Style & Animation Layer**: `styles.css` containing academic blue tokens (`--fpt-blue`, `--fpt-blue-dark`, `--fpt-blue-light`), continuous CSS text gradient keyframes (`textGradientContinuous`), glowing CTA button styles, responsive A4 certificate layout (`min-height: 1123px`, `aspect-ratio: 210/297`), table cell flex centering, and `@media print` rules.
- **State & Logic Controller**: `app.js` maintaining in-memory state (`AppState`), SPA view toggling (`switchView`), dynamic subject rendering, hurdle validations, TBM arithmetic calculations, and export card generation (`renderExportCard`, `captureCertificateCardSandbox`, `downloadCertificatePng`, `downloadCertificatePdf`, `exportCertificatePdf`).
- **Data & Schema**: `data.js` containing curriculum semester definitions (`CURRICULUM_SEMESTERS`), course templates, and syllabus component schemas with percentage weights (% weight).
- **Test Infrastructure**: `tests/runner.js` executing 11 test suites covering features, boundaries, combinations, transcripts, empirical stress, and adversarial challenges.

---

## Feature Inventory
| # | Feature | Description | Milestone | Source |
|---|---------|-------------|-----------|--------|
| 1 | F1.1 SPA View Switching | Single-page view toggle between `#view-home` and `#view-calculator` without page reload | M1 | R1, Survey E1 |
| 2 | F1.2 In-Memory State Persistence | Complete preservation of user inputs, course selections, and calculated scores across view toggles | M1 | R1, Survey E1 |
| 3 | F1.3 PrepEdu Landing Hero | Royal blue radial background (`#00266B` to `#0B63E5`), concentric radial rings, bold headline with mascot badge | M1 | R1, Survey E1 |
| 4 | F1.4 Glowing CTA Button | Luminous CTA button ("BẮT ĐẦU TÍNH ĐIỂM NGAY") transitioning smoothly to calculator view | M1 | R1, Survey E1 |
| 5 | F1.5 Mascot Visual Enrichment | Center-stage celebratory card (`mascot_celebrate.svg` with trophy and wreath) and feature pillar badges | M1 | R1, Survey E1 |
| 6 | F2.1 Calculator Header Decluttering | Streamlined top section, removal of clashing orange gradients, Pro192 clean engineering aesthetic | M1 | R2, Survey E2 |
| 7 | F2.2 Continuous Text Gradient Animation | Seamless CSS text gradient shifting smoothly through deep blue, sky blue, and soft silver/white | M1 | R2, Survey E2 |
| 8 | F3.1 Standard Vertical A4 Proportions | Export card modal (`#certificate-card`) and sandbox conforming to vertical A4 (aspect ratio ~1:1.414, 794px x 1123px) | M1 | R3, Survey E3 |
| 9 | F3.2 Table Cell Vertical Centering | Fix sagging text in course table rows by enforcing flex vertical centering (`vertical-align: middle`) | M1 | R3, Survey E3 |
| 10 | F3.3 Component Score Breakdown (% Weight) | Display detailed component scores with percentage weights for each course in the report card | M1 | R3, Survey E3 |
| 11 | F3.4 Direct Download & Print Styling | Direct client-side download button (PDF / PNG) alongside standard browser print formatted for A4 | M1 | R3, Survey E3 |
| 12 | F4.1 Automated Test Preservation | 100% pass rate across all 11 suites in `tests/runner.js` with zero regressions and exit code 0 | M2 | R4, Survey E2/E3 |
| 13 | F4.2 Strict DOM ID Integrity | Preservation of 22 core M1 IDs, zero missing IDs from `app.js`, zero duplicate IDs in `index.html` | M2 | R4, Survey E2 |

---

## Milestones
| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|--------|
| M1 | Core UI, SPA & A4 Export Enhancement | R1, R2, R3 (F1.1 - F3.4): Dedicated Home view, SPA view switch, PrepEdu hero, glowing CTA, mascot showcase, header decluttering, CSS gradient animation, A4 export card proportions, table vertical centering, component % weight breakdowns, direct download | Survey E1, E2, E3 | DONE (Verified by reviewer_1, reviewer_2, challenger_1, challenger_2, auditor_1) |
| M2 | Final Milestone: E2E Test Suite & Adversarial Hardening | R4 (F4.1 - F4.2): 100% pass across all 11 test suites (Tiers 1-4), strict DOM ID & CSS token invariants, adversarial stress hardening (Tier 5) | M1 | DONE (Verified: 11/11 runner suites pass, 50/50 M1 stress, 29/29 M3 challenge, 67/67 Tier 5, 24/24 challenger 1 stress, 23/23 challenger 2 deep stress; exit code 0) |

---

## Interface Contracts

### 1. View Switching Controller (`app.js` ↔ `index.html`)
- Function: `switchView(viewName: 'home' | 'calc' | 'calculator')`
- Behavior:
  - Toggles CSS class `hidden` vs `block` on `#view-home` and `#view-calculator`.
  - Updates active state classes on top navigation buttons `#tab-nav-home` and `#tab-nav-calc`.
  - Does NOT clear, reinitialize, or destroy `AppState` or DOM input values.
- Global Exposure: `window.switchView = switchView;` and exported in `module.exports`.

### 2. Export Card Generation & Download (`app.js` ↔ `index.html`)
- Function: `renderExportCard(targetContainer, semesterNum, options)`
  - Renders subject rows with component score breakdowns formatted as `${comp.name} (${comp.weight}%): ${score}`.
  - Table cells use `.cell-wrapper` with `display: flex; align-items: center; justify-content: center; min-height: 40px;`.
- Function: `downloadCertificatePdf()`
  - Uses `captureCertificateCardSandbox(card)` and jsPDF (or print fallback) to trigger direct PDF download.
- Function: `downloadCertificatePng()`
  - Uses `html2canvas` at 2x scale to trigger direct PNG download.
- Function: `exportCertificatePdf()`
  - Invokes `window.print()` with `@media print` A4 formatting.

### 3. DOM ID Preservation Invariants
- All 22 core IDs MUST remain present in `index.html`:
  `semester-tabs`, `semester-info`, `subjects-container`, `summary-progress`, `summary-progress-bar`, `summary-tbm`, `summary-honor-badge`, `summary-honor-desc`, `summary-highlight-container`, `export-modal`, `certificate-card`, `btn-copy-clipboard`, `btn-download-png`, `template-modal`, `add-subject-modal`, `new-sub-code`, `new-sub-namevi`, `new-sub-credits`, `new-sub-template`, `new-sub-isscored`, `mascot-widget`, `mobile-summary-bar`.
- Any ID queried in `app.js` must exist in `index.html`.
- Zero duplicate IDs across `index.html`.

---

## Code Layout
- `ScoreCalculator/index.html`: Main SPA document (owns `#view-home`, `#view-calculator`, `#export-modal`).
- `ScoreCalculator/styles.css`: Stylesheet (owns color variables, animations, radial hero, modal A4 styling, print CSS).
- `ScoreCalculator/app.js`: Application logic (owns state management, calculation, view switching, modal rendering, export).
- `ScoreCalculator/assets/`: Mascot and badge SVG assets (read-only references).
- `tests/`: Automated test runner and suites (read-only verification targets).
