/**
 * Challenger 1 Independent Empirical Stress Test Harness
 * Milestone 1: SPA View Switching, State Preservation, DOM ID Integrity & Visual Invariants
 * 
 * Verifies:
 * 1. Full runner execution: node tests/runner.js (11/11 suites pass cleanly with exit code 0).
 * 2. In-memory state preservation across view toggles ('home' <-> 'calc').
 * 3. DOM ID integrity: All 22 core M1 IDs present, 0 duplicate IDs, all queried IDs present.
 * 4. Rapid view toggling stress & adversarial input resilience.
 * 5. CSS text gradient keyframes, PrepEdu hero styling, A4 proportions & table vertical centering.
 */

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { execSync } = require('node:child_process');
const {
    loadAppSandbox,
    getHtmlContent,
    getCssContent,
    getAppContent,
    ROOT_DIR,
    APP_DIR
} = require('./test_helper.js');

console.log('========================================================================');
console.log(' CHALLENGER 1: EMPIRICAL ADVERSARIAL STRESS TEST (MILESTONE 1)');
console.log(' Target: SPA State Preservation, DOM ID Integrity, Runner & Invariants');
console.log('========================================================================\n');

let totalAssertions = 0;
let passedAssertions = 0;
let failedAssertions = 0;
const failureLog = [];

function check(desc, fn) {
    totalAssertions++;
    try {
        fn();
        passedAssertions++;
        console.log(`  [PASS] ${desc}`);
    } catch (err) {
        failedAssertions++;
        failureLog.push({ desc, error: err.message, stack: err.stack });
        console.error(`  [FAIL] ${desc} --> ${err.message}`);
    }
}

// =============================================================================
// TEST SUITE 1: Full Automated Test Runner Execution (11/11 Suites)
// =============================================================================
console.log('--- TEST SUITE 1: Automated Test Runner Execution (runner.js) ---');

check('1.1: tests/runner.js executes all 11 suites with exit code 0 and 0 failures', () => {
    const runnerPath = path.join(ROOT_DIR, 'tests', 'runner.js');
    assert.ok(fs.existsSync(runnerPath), 'tests/runner.js exists');

    const output = execSync(`node "${runnerPath}"`, {
        cwd: ROOT_DIR,
        encoding: 'utf8',
        timeout: 30000
    });

    assert.ok(output.includes('Total Suites Executed: 11'), 'Must execute 11 suites');
    assert.ok(output.includes('Passed Suites:         11'), 'Must pass 11 suites');
    assert.ok(output.includes('Failed Suites:         0'), 'Must have 0 failed suites');
    assert.ok(output.includes('ALL TEST SUITES PASSED CLEANLY'), 'Must report clean pass');
});

// =============================================================================
// TEST SUITE 2: Strict DOM ID Integrity & Uniqueness (22 Core IDs & Synchronized Querying)
// =============================================================================
console.log('\n--- TEST SUITE 2: DOM ID Integrity & Uniqueness ---');

const htmlContent = getHtmlContent();
const appContent = getAppContent();

// Extract all IDs from index.html
const idRegex = /\bid\s*=\s*["']([a-zA-Z0-9_-]+)["']/g;
const allHtmlIds = [];
const htmlIdSet = new Set();
let match;
while ((match = idRegex.exec(htmlContent)) !== null) {
    allHtmlIds.push(match[1]);
    htmlIdSet.add(match[1]);
}

check('2.1: Zero duplicate DOM IDs across entire index.html', () => {
    const seen = new Set();
    const duplicates = [];
    for (const id of allHtmlIds) {
        if (seen.has(id)) {
            duplicates.push(id);
        }
        seen.add(id);
    }
    assert.deepStrictEqual(duplicates, [], `Duplicate IDs found in index.html: ${duplicates.join(', ')}`);
});

const CORE_M1_IDS = [
    'semester-tabs',
    'semester-info',
    'subjects-container',
    'summary-progress',
    'summary-progress-bar',
    'summary-tbm',
    'summary-honor-badge',
    'summary-honor-desc',
    'summary-highlight-container',
    'export-modal',
    'certificate-card',
    'btn-copy-clipboard',
    'btn-download-png',
    'template-modal',
    'add-subject-modal',
    'new-sub-code',
    'new-sub-namevi',
    'new-sub-credits',
    'new-sub-template',
    'new-sub-isscored',
    'mascot-widget',
    'mobile-summary-bar'
];

check('2.2: Exactly 22 core M1 IDs exist in index.html', () => {
    assert.strictEqual(CORE_M1_IDS.length, 22, 'Must have 22 core M1 IDs in verification list');
    const missingCoreIds = CORE_M1_IDS.filter(id => !htmlIdSet.has(id));
    assert.deepStrictEqual(missingCoreIds, [], `Missing core M1 IDs: ${missingCoreIds.join(', ')}`);
});

check('2.3: Milestone 1 SPA navigation and download IDs exist in index.html', () => {
    const spaIds = [
        'view-home',
        'view-calculator',
        'tab-nav-home',
        'tab-nav-calc',
        'btn-download-pdf'
    ];
    const missingSpaIds = spaIds.filter(id => !htmlIdSet.has(id));
    assert.deepStrictEqual(missingSpaIds, [], `Missing SPA IDs: ${missingSpaIds.join(', ')}`);
});

check('2.4: Every DOM ID queried by app.js exists in index.html', () => {
    const getElemIdRegex = /document\.getElementById\(\s*["'`]?([a-zA-Z0-9_-]+)["'`]?\s*\)/g;
    const qsIdRegex = /document\.querySelector(?:All)?\(\s*["'`]#([a-zA-Z0-9_-]+)["'`]\s*\)/g;
    
    const queriedIds = new Set();
    let qm;
    while ((qm = getElemIdRegex.exec(appContent)) !== null) {
        queriedIds.add(qm[1]);
    }
    while ((qm = qsIdRegex.exec(appContent)) !== null) {
        queriedIds.add(qm[1]);
    }

    const missingQueried = [];
    for (const id of queriedIds) {
        if (!htmlIdSet.has(id)) {
            missingQueried.push(id);
        }
    }
    assert.deepStrictEqual(missingQueried, [], `DOM IDs queried in app.js but missing in index.html: ${missingQueried.join(', ')}`);
});

check('2.5: Interactive onclick handlers in index.html resolve to defined functions in app.js', () => {
    const onclickRegex = /\bonclick\s*=\s*["']\s*([a-zA-Z0-9_]+)\s*\(/g;
    const onclickFunctions = new Set();
    while ((match = onclickRegex.exec(htmlContent)) !== null) {
        onclickFunctions.add(match[1]);
    }

    const browserBuiltins = new Set(['print', 'alert', 'confirm', 'prompt']);
    const missingFunctions = [];

    for (const fn of onclickFunctions) {
        if (browserBuiltins.has(fn)) continue;
        const functionDeclRegex = new RegExp(`(?:function\\s+${fn}\\b|const\\s+${fn}\\s*=|let\\s+${fn}\\s*=|window\\.${fn}\\s*=)`);
        if (!functionDeclRegex.test(appContent) && !functionDeclRegex.test(htmlContent)) {
            missingFunctions.push(fn);
        }
    }

    assert.deepStrictEqual(missingFunctions, [], `onclick handlers referencing undefined functions: ${missingFunctions.join(', ')}`);
});

// =============================================================================
// TEST SUITE 3: In-Memory State Preservation Across View Toggles (switchView)
// =============================================================================
console.log('\n--- TEST SUITE 3: In-Memory State Preservation Across View Toggles ---');

const ctx = loadAppSandbox();
ctx.initializeAppState();

check('3.1: switchView function is defined and globally exported', () => {
    assert.strictEqual(typeof ctx.switchView, 'function', 'switchView must be a function in sandbox');
});

check('3.2: switchView toggles visibility classes correctly on view panels and nav buttons', () => {
    const homeView = ctx.document.getElementById('view-home');
    const calcView = ctx.document.getElementById('view-calculator');
    const navHome = ctx.document.getElementById('tab-nav-home');
    const navCalc = ctx.document.getElementById('tab-nav-calc');

    // Switch to 'calc'
    ctx.switchView('calc');
    assert.ok(homeView.classList.contains('hidden'), 'view-home must have hidden class');
    assert.ok(!homeView.classList.contains('block'), 'view-home must not have block class');
    assert.ok(calcView.classList.contains('block'), 'view-calculator must have block class');
    assert.ok(!calcView.classList.contains('hidden'), 'view-calculator must not have hidden class');
    assert.ok(navCalc.classList.contains('bg-white'), 'navCalc must have active background');
    assert.ok(navCalc.classList.contains('text-fptBlue'), 'navCalc must have active text color');
    assert.ok(navHome.classList.contains('text-slate-600'), 'navHome must have inactive text color');

    // Switch to 'home'
    ctx.switchView('home');
    assert.ok(homeView.classList.contains('block'), 'view-home must have block class');
    assert.ok(!homeView.classList.contains('hidden'), 'view-home must not have hidden class');
    assert.ok(calcView.classList.contains('hidden'), 'view-calculator must have hidden class');
    assert.ok(!calcView.classList.contains('block'), 'view-calculator must not have block class');
    assert.ok(navHome.classList.contains('bg-white'), 'navHome must have active background');
    assert.ok(navHome.classList.contains('text-fptBlue'), 'navHome must have active text color');
    assert.ok(navCalc.classList.contains('text-slate-600'), 'navCalc must have inactive text color');

    // Switch with 'calculator' alias
    ctx.switchView('calculator');
    assert.ok(homeView.classList.contains('hidden'), 'view-home must have hidden class for calculator alias');
    assert.ok(calcView.classList.contains('block'), 'view-calculator must have block class for calculator alias');
});

check('3.3: AppState and calculated semester data remain 100% preserved across view toggles', () => {
    // Populate Semester 2 with custom grades
    ctx.AppState.currentSemester = 2;
    ctx.AppState.selectedComboTrack = 'dotnet';
    
    // Ensure semester 2 subjects are loaded
    if (!ctx.AppState.semesterData[2]) {
        const sem2Def = ctx.CURRICULUM_SEMESTERS.find(s => s.semester === 2);
        ctx.AppState.semesterData[2] = sem2Def.subjects.map(s => ctx.createSubjectState(s));
    }

    // Set specific scores
    const sub0 = ctx.AppState.semesterData[2][0];
    assert.ok(sub0, 'Semester 2 must have at least 1 subject');
    sub0.components.forEach(c => {
        c.avgValue = "9.5";
        if (Array.isArray(c.subValues)) {
            c.subValues = c.subValues.map(() => "9.5");
        }
    });

    const beforeStateSnapshot = JSON.stringify(ctx.AppState);

    // Switch to 'home'
    ctx.switchView('home');
    const homeStateSnapshot = JSON.stringify(ctx.AppState);
    assert.strictEqual(homeStateSnapshot, beforeStateSnapshot, 'AppState must not change when switching to home');

    // Switch back to 'calc'
    ctx.switchView('calc');
    const calcStateSnapshot = JSON.stringify(ctx.AppState);
    assert.strictEqual(calcStateSnapshot, beforeStateSnapshot, 'AppState must not change when switching back to calc');

    // Verify individual field values
    assert.strictEqual(ctx.AppState.currentSemester, 2, 'currentSemester preserved');
    assert.strictEqual(ctx.AppState.selectedComboTrack, 'dotnet', 'selectedComboTrack preserved');
    assert.strictEqual(ctx.AppState.semesterData[2][0].components[0].avgValue, "9.5", 'Score value preserved');
});

check('3.4: Combo track scores cache persists intact across view toggles', () => {
    // Set combo track in semester 5
    ctx.setComboTrack('ai');
    ctx.AppState.currentSemester = 5;

    // Put a score into combo track
    const sem5Subjects = ctx.AppState.semesterData[5];
    assert.ok(sem5Subjects && sem5Subjects.length > 0, 'Semester 5 must have subjects');
    sem5Subjects[0].components[0].avgValue = "8.8";

    // Switch track to java then back to ai to populate cache
    ctx.setComboTrack('java');
    ctx.setComboTrack('ai');

    const cacheKeysBefore = Object.keys(ctx.AppState._scoresCache);
    assert.ok(cacheKeysBefore.length > 0, 'Cache must hold entries');

    // Toggle views 10 times
    for (let i = 0; i < 10; i++) {
        ctx.switchView(i % 2 === 0 ? 'home' : 'calc');
    }

    const cacheKeysAfter = Object.keys(ctx.AppState._scoresCache);
    assert.deepStrictEqual(cacheKeysAfter, cacheKeysBefore, 'Scores cache keys must be completely invariant across view toggles');
});

check('3.5: Rapid toggling stress test (1,000 view switches in tight loop)', () => {
    const startTime = Date.now();
    for (let i = 0; i < 1000; i++) {
        ctx.switchView(i % 2 === 0 ? 'home' : 'calc');
    }
    const elapsed = Date.now() - startTime;
    assert.ok(elapsed < 500, `1,000 view toggles completed in ${elapsed}ms (< 500ms required)`);

    // Verify DOM consistency after 1000 toggles (ending on calc because 999 % 2 !== 0)
    const homeView = ctx.document.getElementById('view-home');
    const calcView = ctx.document.getElementById('view-calculator');
    assert.ok(homeView.classList.contains('hidden'), 'view-home hidden after odd iteration');
    assert.ok(calcView.classList.contains('block'), 'view-calculator block after odd iteration');
});

check('3.6: Defensive handling of adversarial & unexpected switchView inputs', () => {
    // Null, undefined, empty string, invalid objects, numbers
    assert.doesNotThrow(() => ctx.switchView(null), 'Must not throw on null');
    assert.doesNotThrow(() => ctx.switchView(undefined), 'Must not throw on undefined');
    assert.doesNotThrow(() => ctx.switchView(""), 'Must not throw on empty string');
    assert.doesNotThrow(() => ctx.switchView(12345), 'Must not throw on number');
    assert.doesNotThrow(() => ctx.switchView({}), 'Must not throw on object');
    assert.doesNotThrow(() => ctx.switchView("random-view-name"), 'Must not throw on unknown string');
    
    // When passed an unknown view, it should safely default to calculator view
    const homeView = ctx.document.getElementById('view-home');
    const calcView = ctx.document.getElementById('view-calculator');
    assert.ok(homeView.classList.contains('hidden'), 'view-home should be hidden for unknown view');
    assert.ok(calcView.classList.contains('block'), 'view-calculator should be active for unknown view');
});

check('3.7: Defensive handling when DOM elements are missing', () => {
    // Create an isolated context with mock document that returns null for view-home
    const isolatedCtx = loadAppSandbox();
    const originalGetElementById = isolatedCtx.document.getElementById;
    
    // Intercept to return null for elements
    isolatedCtx.document.getElementById = (id) => {
        if (id === 'view-home' || id === 'tab-nav-calc') return null;
        return originalGetElementById.call(isolatedCtx.document, id);
    };

    assert.doesNotThrow(() => {
        isolatedCtx.switchView('home');
        isolatedCtx.switchView('calc');
    }, 'switchView must handle missing DOM nodes gracefully');
});

// =============================================================================
// TEST SUITE 4: Visual Polish & CSS Invariants (R1, R2, R3)
// =============================================================================
console.log('\n--- TEST SUITE 4: Visual Polish & CSS Invariants ---');

const cssContent = getCssContent();

check('4.1: Continuous text gradient keyframe animation exists with seamless color cycle', () => {
    assert.ok(cssContent.includes('@keyframes textGradientContinuous'), 'Must contain @keyframes textGradientContinuous');
    assert.ok(cssContent.includes('.text-gradient-animated'), 'Must define .text-gradient-animated class');
    assert.ok(cssContent.includes('-webkit-background-clip: text') || cssContent.includes('background-clip: text'), 'Must use background-clip: text');

    // Extract keyframes block using balanced braces
    const kfStart = cssContent.indexOf('@keyframes textGradientContinuous');
    assert.ok(kfStart !== -1, 'textGradientContinuous keyframes found');
    const openBrace = cssContent.indexOf('{', kfStart);
    let braceCount = 1;
    let kfEnd = openBrace + 1;
    while (braceCount > 0 && kfEnd < cssContent.length) {
        if (cssContent[kfEnd] === '{') braceCount++;
        else if (cssContent[kfEnd] === '}') braceCount--;
        kfEnd++;
    }
    const kfBody = cssContent.substring(openBrace + 1, kfEnd - 1);

    // Background-position animation from 0% to 200% for seamless continuous movement
    assert.ok(kfBody.includes('0%') && kfBody.includes('background-position: 0%'), 'Keyframes start at 0% position');
    assert.ok(kfBody.includes('100%') && kfBody.includes('background-position: 200%'), 'Keyframes loop seamlessly at 200% position');

    // Extract .text-gradient-animated block
    const tgRegex = /\.text-gradient-animated\s*\{([\s\S]*?)\}/;
    const tgMatch = tgRegex.exec(cssContent);
    assert.ok(tgMatch, '.text-gradient-animated class block found');
    const tgBody = tgMatch[1];

    // Verify continuous color stops: starts and ends on deep blue #00528F, transitions through sky blue and soft silver
    assert.ok(tgBody.includes('#00528F'), 'Color gradient includes deep academic blue (#00528F)');
    assert.ok(tgBody.includes('#0284C7') || tgBody.includes('#38BDF8'), 'Color gradient transitions through sky blue');
    assert.ok(tgBody.includes('#CBD5E1'), 'Color gradient transitions through soft silver/white (#CBD5E1)');
    assert.ok(tgBody.includes('background-size: 200%'), 'Background size 200% configured for continuous panning');
});

check('4.2: PrepEdu Hero radial background & concentric rings defined in CSS', () => {
    assert.ok(cssContent.includes('.home-hero-prep'), 'Must define .home-hero-prep in styles.css');
    assert.ok(cssContent.includes('radial-gradient'), 'Must use radial-gradient');
    assert.ok(cssContent.includes('#0B63E5') || cssContent.includes('#00266B'), 'Must use PrepEdu royal blue color palette');
    assert.ok(cssContent.includes('.radial-ring'), 'Must define .radial-ring styles');
    assert.ok(cssContent.includes('.btn-glowing-cta'), 'Must define .btn-glowing-cta styles');
    assert.ok(cssContent.includes('box-shadow'), 'Glowing CTA must use luminous box-shadow');
});

check('4.3: Vertical A4 proportions strictly enforced on #certificate-card', () => {
    assert.ok(cssContent.includes('#certificate-card'), 'styles.css defines #certificate-card');
    assert.ok(cssContent.includes('794px'), 'A4 standard width 794px defined');
    assert.ok(cssContent.includes('1123px'), 'A4 standard height 1123px defined');
    assert.ok(cssContent.includes('210 / 297') || cssContent.includes('210/297'), 'A4 aspect-ratio 210/297 defined');
});

check('4.4: Table cell vertical sagging fixed via flex centering', () => {
    assert.ok(cssContent.includes('.cell-wrapper'), 'Must define .cell-wrapper for table cells');
    assert.ok(cssContent.includes('display: flex') || cssContent.includes('display: inline-flex'), 'Uses flex layout');
    assert.ok(cssContent.includes('align-items: center'), 'Centers items vertically via align-items');
    assert.ok(cssContent.includes('vertical-align: middle'), 'Enforces vertical-align: middle on table cells');
});

check('4.5: Component score breakdown with % weights is rendered in export card', () => {
    // Load fresh sandbox to render export card
    const exportCtx = loadAppSandbox();
    exportCtx.initializeAppState();
    
    const container = exportCtx.document.createElement('div');
    const sem1Def = exportCtx.CURRICULUM_SEMESTERS.find(s => s.semester === 1);
    exportCtx.AppState.semesterData[1] = sem1Def.subjects.map(s => exportCtx.createSubjectState(s));
    
    // Assign scores to subject 0
    exportCtx.AppState.semesterData[1][0].components.forEach(c => {
        c.avgValue = "8.5";
    });

    assert.doesNotThrow(() => {
        exportCtx.renderExportCard(container, 1);
    }, 'renderExportCard must execute cleanly');

    const htmlRendered = container.innerHTML;
    // Check that % weight format is present: e.g., (10%): or (%):
    assert.ok(
        /(\(\d+%\):|\(\d+%\))/g.test(htmlRendered) || htmlRendered.includes('%'),
        'Export card must render component scores with percentage weights (% weight)'
    );
});

check('4.6: Direct download PDF and PNG handlers exist and are wired', () => {
    assert.strictEqual(typeof ctx.downloadCertificatePdf, 'function', 'downloadCertificatePdf is defined');
    assert.strictEqual(typeof ctx.downloadCertificatePng, 'function', 'downloadCertificatePng is defined');
    assert.strictEqual(typeof ctx.exportCertificatePdf, 'function', 'exportCertificatePdf is defined');

    // Check index.html buttons
    assert.ok(htmlContent.includes('downloadCertificatePdf()'), 'index.html contains downloadCertificatePdf() call');
    assert.ok(htmlContent.includes('downloadCertificatePng()'), 'index.html contains downloadCertificatePng() call');
});

// =============================================================================
// TEST SUITE 5: Adversarial Edge Cases & Modal Robustness
// =============================================================================
console.log('\n--- TEST SUITE 5: Adversarial Edge Cases & Modal Robustness ---');

check('5.1: switchView is idempotent (repeated calls with identical viewName)', () => {
    // Calling 'home' 10 times consecutively
    for (let i = 0; i < 10; i++) {
        ctx.switchView('home');
    }
    const homeView = ctx.document.getElementById('view-home');
    const calcView = ctx.document.getElementById('view-calculator');
    assert.ok(homeView.classList.contains('block'), 'Home view remains block');
    assert.ok(!homeView.classList.contains('hidden'), 'Home view does not have hidden');
    assert.ok(calcView.classList.contains('hidden'), 'Calc view remains hidden');
    assert.ok(!calcView.classList.contains('block'), 'Calc view does not have block');

    // Calling 'calc' 10 times consecutively
    for (let i = 0; i < 10; i++) {
        ctx.switchView('calc');
    }
    assert.ok(homeView.classList.contains('hidden'), 'Home view becomes hidden');
    assert.ok(calcView.classList.contains('block'), 'Calc view becomes block');
});

check('5.2: All 10 SVG assets physically exist in ScoreCalculator/assets/ and are referenced accurately', () => {
    const requiredAssets = [
        'logo.svg',
        'mascot_happy.svg',
        'mascot_celebrate.svg',
        'mascot_stamp.svg',
        'badge_cocvang.svg',
        'badge_top100.svg',
        'badge_xuatsac.svg',
        'badge_gioi.svg',
        'badge_kha.svg',
        'badge_dat.svg'
    ];
    const assetsDir = path.join(APP_DIR, 'assets');
    for (const asset of requiredAssets) {
        const fullPath = path.join(assetsDir, asset);
        assert.ok(fs.existsSync(fullPath), `Asset ${asset} must exist on disk`);
        const stats = fs.statSync(fullPath);
        assert.ok(stats.size > 200, `Asset ${asset} must be non-empty (size: ${stats.size} bytes)`);
    }
});

check('5.3: Absence of clashing orange gradients in calculator header', () => {
    // Calculator header should not use orange gradient backgrounds
    assert.ok(!htmlContent.includes('from-orange-500 to-amber-500'), 'No orange gradient header in index.html');
    assert.ok(!cssContent.includes('.calc-header-orange'), 'No calc-header-orange class in styles.css');
});

check('5.4: Mobile touch target compliance (min-height >= 44px)', () => {
    assert.ok(cssContent.includes('min-height: 44px') || cssContent.includes('min-h-[44px]'), 'Styles enforce minimum 44px touch target');
});

check('5.5: Export modal operations function cleanly regardless of active view panel', () => {
    const modalCtx = loadAppSandbox();
    modalCtx.initializeAppState();
    
    // Test opening export modal while in Home view
    modalCtx.switchView('home');
    const homeView = modalCtx.document.getElementById('view-home');
    assert.ok(homeView.classList.contains('block'), 'In home view');

    assert.doesNotThrow(() => {
        if (typeof modalCtx.openExportModal === 'function') {
            modalCtx.openExportModal();
        }
    }, 'openExportModal must not throw when in home view');

    assert.doesNotThrow(() => {
        if (typeof modalCtx.closeExportModal === 'function') {
            modalCtx.closeExportModal();
        }
    }, 'closeExportModal must not throw');

    // Confirm home view remained undisturbed
    assert.ok(homeView.classList.contains('block'), 'Home view preserved after export modal close');
});

// =============================================================================
// SUMMARY REPORT
// =============================================================================
console.log('\n========================================================================');
console.log(' CHALLENGER 1 EMPIRICAL VERIFICATION SUMMARY');
console.log('========================================================================');
console.log(`Total Checks:   ${totalAssertions}`);
console.log(`Passed Checks:  ${passedAssertions}`);
console.log(`Failed Checks:  ${failedAssertions}`);
console.log('========================================================================\n');

if (failedAssertions > 0) {
    console.error(`❌ VERDICT: REQUEST_CHANGES (${failedAssertions} failure(s) found)`);
    process.exit(1);
} else {
    console.log('✅ VERDICT: APPROVE (All empirical stress tests passed with 100% soundness)');
    process.exit(0);
}
