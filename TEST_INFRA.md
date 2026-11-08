# Test Infrastructure & Test Philosophy Documentation
## FPTU BIT_SE_K20B Score Calculator Web Application

---

## 1. Overview & Testing Philosophy

The test infrastructure for the **FPTU BIT_SE_K20B Score Calculator** is architected to guarantee academic precision, calculation integrity, and interface reliability across all 10 semesters (Semester 0 through 9) and 8 elective combo tracks under FPT University Decision 1140/QĐ-ĐHFPT.

### Core Testing Tenets

1. **Opaque-Box (Black-Box) Requirement-Driven Verification**:
   - Tests treat the application as a black box with defined input and output interfaces.
   - Assertions are derived strictly from authoritative sources:
     - `ORIGINAL_REQUEST.md` (User requirements R1 - R4 and follow-up mascot criteria).
     - `PROJECT.md` (System architecture, feature inventory F01 - F14, interface contracts).
     - Official Syllabus Specifications in `Syllabus Full` and `BIT_SE_K20B_MAPPING.pdf`.
     - FPT University Academic Regulations (Grading rules, unweighted arithmetic mean, passing hurdles, honors eligibility).
   - Test expectations are never reverse-engineered from flawed code; tests define the standard of truth.

2. **Progressive Testability**:
   - Tests verify features progressively as milestones are developed.
   - When dependencies from planned milestones (e.g. M2 data schemas or M3 honors guards) are in flight, tests dynamically inspect feature availability, asserting compliance when active and documenting progressive readiness without brittle hard-crashes.

3. **Zero-Dependency Native Execution**:
   - Built exclusively on Node.js native test runner (`node:test`) and strict assertions (`node:assert/strict`).
   - Requires zero third-party npm packages, guaranteeing 100% reproducibility across all platforms and CI environments.

4. **Headless Browser & DOM Sandboxing**:
   - Client-side static scripts (`data.js`, `app.js`, `styles.css`, `index.html`) execute inside a secure Node.js `node:vm` sandbox with lightweight mock DOM and browser API implementations (e.g., `document`, `window`, `localStorage`, `html2canvas`, `navigator.clipboard`).

---

## 2. Testing Architecture & Directory Structure

```
D:\WORKING - IMPORTANT\SCORE CALCULATOR WEB\
├── TEST_INFRA.md                      # Test infrastructure & architecture specification (Exclusively owned)
├── TEST_READY.md                      # Test suite readiness & coverage report (Exclusively owned)
├── ScoreCalculator/                   # Implementation files (Read-only for test writer)
│   ├── index.html                     # UI markup, DOM elements, responsive layout
│   ├── styles.css                     # Design tokens, color system, CSS rules
│   ├── data.js                        # Course schemas, templates, curriculum definition
│   ├── app.js                         # Calculation engine, reactive state, DOM renderer
│   └── assets/                        # SVG mascot, logo, achievement badges
└── tests/                             # Comprehensive automated test suite (Exclusively owned)
    ├── test_helper.js                 # Shared test sandbox, DOM mocks, environment loaders
    ├── tier1_features.test.js         # Tier 1: Feature Coverage (>=5 tests per feature F01 - F13)
    ├── tier2_boundaries.test.js       # Tier 2: Boundary & Corner Cases (>=5 tests per boundary)
    ├── tier3_combinations.test.js     # Tier 3: Pairwise interactions & cross-feature combos
    ├── tier4_transcripts.test.js      # Tier 4: Real-world student transcripts (Semesters 1 - 9)
    ├── test_grading.js                # Core grading, hurdles, rounding, condition courses
    ├── test_syllabus.js               # Syllabus schema & component weights validation
    ├── test_combos.js                 # Dynamic combo track selector & course swapping
    ├── test_semesters_special.js      # Semester 6 (OJT) and Semesters 8-9 capstone rules
    └── runner.js                      # Central test runner executing all suites
```

---

## 3. Four-Tier Testing Hierarchy

The test suite enforces a comprehensive 4-Tier verification hierarchy:

```
+--------------------------------------------------------------------------+
|                  TIER 4: REAL-WORLD STUDENT TRANSCRIPTS                  |
|    Realistic multi-course student term simulations for Semesters 1 - 9    |
+--------------------------------------------------------------------------+
|                TIER 3: CROSS-FEATURE COMBINATIONS                        |
|  Pairwise interactions: Combos + Condition fails + Honors + OJT + Capstone|
+--------------------------------------------------------------------------+
|                 TIER 2: BOUNDARY & CORNER CASES                          |
|   Rounding (8.44/8.45), TBM (8.466/8.47), Hurdles (FE 3.9/4.0, VOV 4.9), |
|        Process (0/0.1), Total (4.9/5.0), Zero scores, Perfect 10.0       |
+--------------------------------------------------------------------------+
|                  TIER 1: FEATURE COVERAGE (F01 - F13)                    |
|   >=5 isolated unit & integration tests per feature for all 13 features  |
+--------------------------------------------------------------------------+
```

### Tier 1: Feature Coverage (F01 – F13)
Guarantees at least 5 isolated test cases for each cataloged feature:
- **F01 (Elegant Blue Theme)**: Color tokens (`#0066B2`, `#1E40AF`), clean background (`#FFFFFF`, `#F8FAFC`), rounded corners (`16px-24px`), secondary accents (`#F27024`, `#10B981`, `#FFB800`), elimination of harsh dominant orange cards.
- **F02 (Mobile Responsiveness)**: Viewport meta tag, horizontal scroll tabs, 1-column responsive card layout, touch target >= 44px, no page-level overflow.
- **F03 (Cute Cóc Vàng Mascot)**: Mascot vector assets, header logo integration, floating widget, celebration modal, export certificate stamp.
- **F04 (Achievement Badges)**: Cóc Vàng (gold shimmer), Top 100 (amber star), Xuất Sắc, Giỏi, Khá, Đạt, Chưa Đạt.
- **F05 (Full Syllabus Audit)**: Semester course mappings, credit counts (145 credits), 100% component weight totals, hurdle definitions, scored vs non-scored flags.
- **F06 (Dynamic Combo Track Selector)**: Track selection in Semesters 5, 7, 8; 8 combo tracks (.NET, React, AI, Java, Game, DS, IC, JS); dynamic subject updating; persistence.
- **F07 (Correct PE & Non-Standard Weights)**: Coursera 100% TE, Coursera 50/50 PE/TE, Political courses (40/10/20/30), Engineering PE courses (30% PE, 30% FE), Physical Education Vovinam.
- **F08 (Semester 6 OJT Rules)**: OJT202 Pass/Fail evaluation, exclusion from TBM GPA, TBM computed solely from scored courses (ENW493c), strict omission of Cóc Vàng & Top 100.
- **F09 (Semesters 8-9 Capstone Rules)**: Unweighted TBM arithmetic mean, HSG/XS honors ranking, strict suppression of Cóc Vàng & Top 100 predictions, capstone failure guard.
- **F10 (Core Grading & Rounding)**: 1-decimal rounding for subject final score (`Math.round(val * 10) / 10`), unweighted arithmetic mean for semester TBM, 2-decimal rounding for TBM (`Math.round(val * 100) / 100`).
- **F11 (Component Passing Hurdles)**: Process component > 0, Final Exam >= 4.0, Vovinam FE >= 5.0, Subject total >= 5.0.
- **F12 (Condition Courses Honor Guard)**: Non-scored courses (`VOV114/124/134`, `LAB211`, `OTP101`, `PEN`), failing any condition course converts semester to Not Pass and blocks all honors.
- **F13 (Stateless Export Sandbox)**: Off-screen fixed-width rendering sandbox (800px width), PNG download data conversion, clipboard copying with fallback handling.

### Tier 2: Boundary & Corner Cases
>= 5 test cases per boundary condition:
1. **Subject Score Rounding**: `8.44` rounds to `8.4` vs `8.45` rounds to `8.5`.
2. **Semester TBM Arithmetic Mean**: `8.466...` rounds to `8.47` vs `8.433...` rounds to `8.43`.
3. **Component Hurdle**: Final Exam `3.9` (Fail) vs `4.0` (Pass).
4. **Vovinam FE Hurdle**: Practical FE `4.9` (Fail) vs `5.0` (Pass).
5. **Process Hurdle**: Process component `0.0` (Fail) vs `0.1` (Pass).
6. **Total Passing Hurdle**: Subject total `4.9` (Fail) vs `5.0` (Pass).
7. **Zero Scores**: Zero scores across all components and semesters (graceful handling, no NaN, proper failure reasons).
8. **Perfect Scores**: Perfect 10.0 scores across all components (clean representation, honors assignment).

### Tier 3: Cross-Feature Combinations
Pairwise interactions between subsystems:
- Combo track course selection + condition courses failing + honors evaluation.
- Semester 6 OJT (Pass/Fail) + ENW493c scored course + honors evaluation.
- Semester 8 & 9 Capstone + Political courses + Cóc Vàng suppression.
- Process hurdle failure + high overall score interaction.
- Incomplete course entry + semester status + export rendering.

### Tier 4: Real-World Student Transcripts
Full term simulations for Semesters 1 through 9:
- Semester 0: Preparatory student (OTP101, PEN, VOV114, DTR103).
- Semester 1: Freshmen engineering term (PRF192, MAE101, CEA201, CSI106, SSL101c, VOV124).
- Semester 2: Foundation computer science term (MAD101, PRO192, OSG202, NWC204, WED201c, VOV134).
- Semester 3: Core software engineering term (DBI202, MAS291, SWE202c, JPD113, LAB211).
- Semester 4: Intermediate engineering term (CSD201, PRJ301, SWR302, IOT102, JPD123).
- Semester 5: First combo track term (SWP391, SWT301, WDU203c, SSG105, SE_COM1).
- Semester 6: Enterprise OJT term (OJT202 + ENW493c).
- Semester 7: Advanced combo term (SWD392, PMG201c, EXE101, SE_COM2, SE_COM3).
- Semester 8: Pre-capstone term (PRM393, ITE302c, EXE201, MLN111, MLN122, SE_COM4).
- Semester 9: Capstone graduation term (SEP490 + HCM202, MLN131, VNR202).

---

## 4. Coverage Thresholds & Quality Gates

| Metric | Target Threshold | Enforcement Mechanism |
|---|:---:|---|
| **Feature Coverage (Tier 1)** | 100% of F01 - F13 (>=5 tests/feat) | `tests/tier1_features.test.js` |
| **Boundary Coverage (Tier 2)** | 100% of 8 boundaries (>=5 tests/bnd) | `tests/tier2_boundaries.test.js` |
| **Cross-Feature Combos (Tier 3)** | 100% of planned pairwise interactions | `tests/tier3_combinations.test.js` |
| **Transcript Coverage (Tier 4)** | Semesters 0 through 9 full term simulations | `tests/tier4_transcripts.test.js` |
| **External Dependencies** | 0 external npm packages | Native `node:test` & `node:assert` |
| **Exit Code Guarantee** | Code 0 on all tests pass | `tests/runner.js` |

---

## 5. Execution Guide

### Run Full Test Suite via Runner
```bash
node tests/runner.js
```

### Run Full Test Suite via Native Node.js Test Runner
```bash
node --test tests/*.test.js tests/test_*.js
```

### Run Individual Tiers
```bash
# Tier 1: Feature Coverage
node --test tests/tier1_features.test.js

# Tier 2: Boundaries & Corner Cases
node --test tests/tier2_boundaries.test.js

# Tier 3: Cross-Feature Combinations
node --test tests/tier3_combinations.test.js

# Tier 4: Real-World Transcripts
node --test tests/tier4_transcripts.test.js
```
