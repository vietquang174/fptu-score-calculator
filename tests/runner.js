/**
 * Central Test Runner for FPTU BIT_SE_K20B Score Calculator
 * Executes all test files across Tiers 1-4 and modular suites using Node.js native test runner.
 * Exits with code 0 on all pass, or code 1 on any failure.
 */

const { spawnSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const ROOT_DIR = path.resolve(__dirname, '..');

const TEST_SUITES = [
    { name: 'Tier 1: Feature Coverage (F01 - F13)', file: 'tests/tier1_features.test.js' },
    { name: 'Tier 2: Boundary & Corner Cases', file: 'tests/tier2_boundaries.test.js' },
    { name: 'Tier 3: Cross-Feature Combinations', file: 'tests/tier3_combinations.test.js' },
    { name: 'Tier 4: Real-World Student Transcripts', file: 'tests/tier4_transcripts.test.js' },
    { name: 'Modular: Core Grading Logic', file: 'tests/test_grading.js' },
    { name: 'Modular: Syllabus & Curriculum Validation', file: 'tests/test_syllabus.js' },
    { name: 'Modular: Dynamic Combo Track Engine', file: 'tests/test_combos.js' },
    { name: 'Modular: Specialized Semester Business Rules', file: 'tests/test_semesters_special.js' }
];

if (fs.existsSync(path.join(ROOT_DIR, 'tests/m1_empirical_stress.test.js'))) {
    TEST_SUITES.push({ name: 'Milestone 1: Empirical UI & Asset Stress', file: 'tests/m1_empirical_stress.test.js' });
}

if (fs.existsSync(path.join(ROOT_DIR, 'tests/tier5_adversarial_challenger1.test.js'))) {
    TEST_SUITES.push({ name: 'Tier 5: Adversarial Hardening (Challenger 1)', file: 'tests/tier5_adversarial_challenger1.test.js' });
}

if (fs.existsSync(path.join(ROOT_DIR, 'tests/tier5_adversarial_challenger2.test.js'))) {
    TEST_SUITES.push({ name: 'Tier 5: Adversarial Hardening (Challenger 2)', file: 'tests/tier5_adversarial_challenger2.test.js' });
}


console.log('================================================================');
console.log('  FPTU BIT_SE_K20B SCORE CALCULATOR — AUTOMATED TEST SUITE');
console.log('================================================================');
console.log(`Node.js Version: ${process.version}`);
console.log(`Working Directory: ${ROOT_DIR}\n`);

let totalPassed = 0;
let totalFailed = 0;
let failedSuites = [];

const startTime = Date.now();

for (const suite of TEST_SUITES) {
    const fullPath = path.join(ROOT_DIR, suite.file);
    if (!fs.existsSync(fullPath)) {
        console.error(`[ERROR] Test file not found: ${suite.file}`);
        totalFailed++;
        failedSuites.push(suite.name);
        continue;
    }

    process.stdout.write(`RUNNING: ${suite.name} ... `);
    const runStart = Date.now();

    const result = spawnSync(process.execPath, ['--test', suite.file], {
        cwd: ROOT_DIR,
        encoding: 'utf8',
        stdio: ['ignore', 'pipe', 'pipe']
    });

    const elapsed = Date.now() - runStart;

    if (result.status === 0) {
        console.log(`PASS (${elapsed}ms)`);
        totalPassed++;
    } else {
        console.log(`FAIL (${elapsed}ms)`);
        console.error(`\n--- Error Details for ${suite.name} ---`);
        if (result.stdout) console.log(result.stdout);
        if (result.stderr) console.error(result.stderr);
        console.error('-------------------------------------------\n');
        totalFailed++;
        failedSuites.push(suite.name);
    }
}

const totalDuration = Date.now() - startTime;

console.log('\n================================================================');
console.log('                    TEST EXECUTION SUMMARY');
console.log('================================================================');
console.log(`Total Suites Executed: ${TEST_SUITES.length}`);
console.log(`Passed Suites:         ${totalPassed}`);
console.log(`Failed Suites:         ${totalFailed}`);
console.log(`Total Duration:        ${totalDuration}ms`);
console.log('================================================================');

if (totalFailed > 0) {
    console.error(`\n❌ FAILED SUITES (${failedSuites.length}):`);
    failedSuites.forEach(s => console.error(`  - ${s}`));
    console.error('\nTest run completed with failures.');
    process.exit(1);
} else {
    console.log('\n✅ ALL TEST SUITES PASSED CLEANLY (Exit Code 0).');
    process.exit(0);
}
