# Project: FPTU BIT_SE_K20B Score Calculator

## Architecture
- **Architecture Type**: Pure client-side static web application (HTML5, Tailwind CSS, Vanilla JavaScript ES6+, html2canvas, canvas-confetti).
- **Runtime & Testing**: Node.js v24.18.0 native test runner (`node --test`) for automated regression and unit verification.
- **UI & Design System**: Elegant blue-tone minimalist portal design (`#0066B2`, `#1E40AF`, `#0284C7`), clean light/white background (`#FFFFFF`, `#F8FAFC`), subtle orange (`#F27024`), gold (`#FFB800`), and green (`#10B981`) accents. Fully responsive layout optimized for mobile viewports (375px - 430px) and desktop screens.
- **Mascot & Visual Branding**: Cute cartoon "Cóc FPT" golden toad mascot (chibi style, energetic, round eyes with white highlights, cheerful smile, wearing orange FPT polo shirt with white collar trim), integrated across header logo, floating helper widget, celebration modal, and certificate export stamp. Graphic achievement badges for Cóc Vàng, Top 100, Xuất Sắc, Giỏi, Khá, Đạt, and Chưa Đạt.
- **Data Layer (`data.js`)**: Comprehensive, audited course schemas for all K20B semesters (0 through 9, 145 credits under Decision 1140/QĐ-ĐHFPT), 8 elective combo tracks (.NET, React/NodeJS, AI, Java Intensive, Game Development, Applied Data Science, IC Design, Japanese Bridge Engineer), and 5 graduation capstone options.
- **Grading & Business Logic (`app.js`)**:
  - Subject final score rounded to 1 decimal place (`Math.round(val * 10) / 10`).
  - Semester TBM calculated as unweighted arithmetic mean, rounded to 2 decimal places (`Math.round(val * 100) / 100`).
  - Passing hurdles: in-progress process components $> 0$, Final Exam (FE) $\ge 4.0$ (Vovinam $\text{FE} \ge 5.0$), subject total $\ge 5.0$.
  - Non-scored condition courses (`VOV114/124/134`, `LAB211`, `OTP101`, `PEN`): `isScored: false`. Failing any condition course marks semester Not Pass and blocks all honors eligibility.
  - Semester 6 (OJT): `OJT202` (10 credits) is Pass/Fail, excluded from semester TBM GPA. TBM reflects only scored courses (e.g. `ENW493c`). Cóc Vàng and Top 100 predictions are strictly omitted.
  - Semesters 8 & 9 (Capstone): Semester TBM and HSG/XS honors are calculated normally, but Cóc Vàng and Top 100 predictions are strictly hidden.
- **Stateless Export Layer**: Client-side PNG download and clipboard copying utilizing an off-screen fixed-width rendering sandbox to eliminate mobile viewport table squishing and visual clipping.

---

## Feature Inventory
Every feature identified during Survey is cataloged below with its designated milestone.

| # | Feature | Description | Milestone | Source |
|---|---------|-------------|-----------|--------|
| F01 | Elegant Blue Theme | Replace intense orange with primary blue (`#0066B2`, `#1E40AF`), clean white background, refined rounded cards | M1 | ORIGINAL_REQUEST R1 |
| F02 | Mobile Responsiveness | Optimize viewports (375px–430px): 1-column subject cards, unclipped tables, horizontal scroll tabs, 44px touch targets | M1 | ORIGINAL_REQUEST R1 |
| F03 | Cute Cóc Vàng Mascot | Create & integrate cute cartoon golden toad mascot (header logo, floating widget, celebration modal, export stamp) based on user reference images | M1 | ORIGINAL_REQUEST R1 & Follow-up |
| F04 | Achievement Badges | Visual graphic badges for Cóc Vàng (gold shimmer), Top 100 (amber star), Xuất Sắc, Giỏi, Khá, Đạt, Chưa Đạt | M1 | ORIGINAL_REQUEST R1 |
| F05 | Full Syllabus Audit | Audit and map all 75+ K20B courses in `data.js` with exact components, weights, hurdles, and credit counts from `Syllabus Full` | M2 | ORIGINAL_REQUEST R2 |
| F06 | Dynamic Combo Track Selector | Semester-level dropdown for Semesters 5, 7, 8 supporting 8 tracks (.NET, React, AI, Java, Game, DS, IC, JS) dynamically swapping subjects | M2 | ORIGINAL_REQUEST R2 |
| F07 | Correct PE & Non-Standard Weights | Fix Coursera subjects (100% TE or 50/50), Political (40/10/20/30), Engineering (PRF192, PRJ301, SWP391), and Physical Education | M2 | Survey findings |
| F08 | Semester 6 (OJT) Rules | Evaluate OJT202 as Pass/Fail (exclude from TBM GPA), omit Cóc Vàng & Top 100 predictions, apply strict honors | M3 | ORIGINAL_REQUEST R3 |
| F09 | Semesters 8-9 (Capstone) Rules | Calculate unweighted TBM & HSG/XS honors, strictly hide Cóc Vàng and Top 100 predictions | M3 | ORIGINAL_REQUEST R3 |
| F10 | Core Grading & Rounding | Subject final rounded to 1 decimal place; semester unweighted arithmetic mean rounded to 2 decimal places | M3 | ORIGINAL_REQUEST R4 |
| F11 | Component Passing Hurdles | Enforce process $>0$, $\text{FE} \ge 4.0$ (Vovinam $\ge 5.0$), subject total $\ge 5.0$ | M3 | ORIGINAL_REQUEST R4 |
| F12 | Condition Courses Honor Guard | Non-scored condition courses (`VOV`, `LAB211`, `OTP101`, `PEN`): failing any condition course blocks all honors | M3 | ORIGINAL_REQUEST R4 |
| F13 | Stateless Export Sandbox | Off-screen fixed-width rendering sandbox for PNG export and clipboard copy without mobile truncation | M3 | ORIGINAL_REQUEST R4 |
| F14 | Automated Test Suite (Tiers 1-5) | Node.js automated test suite verifying feature coverage, boundaries, combos, honors, semester rules, and adversarial edge cases | M4 | Acceptance Criteria |

---

## Milestones

| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|--------|
| M1 | UI Design System, Mascot Assets & Mobile Responsiveness | F01, F02, F03, F04 | none | DONE |
| M2 | Syllabus Data Audit & Dynamic Combo Track Engine | F05, F06, F07 | none | DONE |
| M3 | Specialized Business Rules & Export Sandbox Integrity | F08, F09, F10, F11, F12, F13 | M1, M2 | IN_PROGRESS |
| M4 | Comprehensive E2E Automated Test Suite & Adversarial Verification | F14 (Tiers 1-5) | M2, M3 | PLANNED |

---

## Interface Contracts

### Data Layer (`data.js`) ↔ Application Engine (`app.js`)
- `CURRICULUM_SEMESTERS`: Array of Semester objects (0 through 9). Each contains `id`, `name`, `code`, `credits`, `subjects` (array of subject codes), and optional `isComboSemester: true`, `comboSemesterKey: "SE_COM1"` / `"SE_COM2_3"` / `"SE_COM4"`.
- `COMBO_TRACKS`: Dictionary mapping track IDs (`dotnet`, `react`, `ai`, `java`, `game`, `datascience`, `icdesign`, `japanese`) to their specific course codes per semester.
- `SUBJECT_SCHEMAS`: Dictionary keyed by course code (e.g. `PRF192`, `MAD101`, `OJT202`, `SEP490`).
  - Structure: `{ code, name, credits, isScored, isPhysicalEducation?, isConditionCourse?, assessments: [{ name, weight, minScore, isFinalExam? }], passingCriteria: { minTotal, minFE?, minProcess? } }`.
- `AppState.selectedComboTrack`: Tracks currently active combo track across Semesters 5, 7, and 8.

### Calculation Engine ↔ UI Summary & Export
- `calculateSubjectScore(subject, userScores)`:
  - Returns `{ finalScore: number, isPassed: boolean, status: string, failureReasons: string[], componentBreakdown: array }`.
  - Enforces 1-decimal rounding (`Math.round(val * 10) / 10`).
- `calculateSemesterResults(semesterId, semesterSubjectScores, selectedComboTrack)`:
  - Returns `{ tbm: number | "N/A", status: "Pass" | "Not Pass", honor: "Xuất Sắc" | "Giỏi" | "Khá" | "Đạt" | "Chưa Đạt", isCocVang: boolean, isTop100: boolean, failedSubjects: string[], scoredSubjectsCount: number }`.
  - For Semester 6: `isCocVang = false`, `isTop100 = false`, `OJT202` excluded from `tbm`.
  - For Semesters 8 & 9: `isCocVang = false`, `isTop100 = false`, `tbm` calculated from scored subjects.
  - If any condition course (`VOV`, `LAB211`, `OTP101`, `PEN`) is not passed, `honor` is forced to `"Chưa Đạt (Not Pass)"`.
- `renderExportCard(container, semesterData, options)`:
  - Renders to a dedicated sandbox element with fixed styling (800px width), ensuring desktop and mobile capture produces identical crisp, unclipped layout.

---

## Code Layout
- `ScoreCalculator/`
  - `index.html` — Main UI markup, head styles, SVG sprite/icons, responsive container, modal dialogs, mascot elements. (Owned by M1)
  - `styles.css` — Custom color tokens, scrollbars, responsive rules, mascot animations, print/export styles. (Owned by M1)
  - `data.js` — Audited K20B subject schemas, combo tracks, semester mappings, motivational quotes. (Owned by M2)
  - `app.js` — Reactive state, calculation engine, semester guards, dynamic combo handling, DOM rendering, off-screen export sandbox. (Owned by M3)
  - `assets/` — Cute cartoon Cóc Vàng mascot SVGs, logo, achievement badges. (Owned by M1)
- `tests/`
  - `test_grading.js` — Core grading logic, hurdles, rounding, condition courses tests. (Owned by M4)
  - `test_syllabus.js` — Subject schema validation and weights total 100% assertions. (Owned by M4)
  - `test_combos.js` — Combo track swapping and course population tests. (Owned by M4)
  - `test_semesters_special.js` — Semester 6 (OJT) and Semesters 8-9 business rules tests. (Owned by M4)
  - `runner.js` — Test runner executing full test suite with exit code 0 on pass. (Owned by M4)
