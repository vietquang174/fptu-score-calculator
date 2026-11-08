/**
 * Challenger 1 Independent Empirical Stress Test Harness
 * Milestone 2 Remediation: Syllabus Data & Dynamic Combo Bugfix
 * 
 * Verifies:
 * 1. Zero duplicate course codes across all 8 tracks in Semesters 5, 7, 8.
 * 2. Rapid track cycling (100+ swaps) across all 8 tracks with distinct grades
 *    entered in every course slot of Semester 7, asserting zero corruption/drift.
 * 3. All 90+ course schemas in data.js have component and assessment weights summing to 100%.
 * 4. Boundary & adversarial tests on combo cache keys, fallback logic, and syllabus audits.
 */

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { loadAppSandbox } = require('./test_helper.js');
const { SUBJECT_SCHEMAS, COMBO_TRACKS, GRADUATION_ELECTIVES } = require('../ScoreCalculator/data.js');

console.log('========================================================================');
console.log(' CHALLENGER 1: INDEPENDENT EMPIRICAL STRESS TEST (MILESTONE 2 REMEDIATION)');
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

// -----------------------------------------------------------------------------
// TEST SUITE 1: Zero Duplicate Course Codes Across All 8 Tracks in Sem 5, 7, 8
// -----------------------------------------------------------------------------
console.log('--- TEST SUITE 1: Track Course Code Uniqueness (Semesters 5, 7, 8) ---');

const ALL_8_TRACKS = ['dotnet', 'react', 'ai', 'java', 'game', 'datascience', 'icdesign', 'japanese'];
const UPPERCASE_ALIASES = ['COM_NET', 'COM_REACT', 'COM_AI', 'COM_JAVA', 'COM_GAME', 'COM_DS', 'COM_IC', 'COM_JS'];

const ctx = loadAppSandbox();
ctx.initializeAppState();

ALL_8_TRACKS.forEach(trackId => {
    check(`Track "${trackId}" produces zero duplicates in Semesters 5, 7, 8`, () => {
        ctx.setComboTrack(trackId);
        [5, 7, 8].forEach(sem => {
            const subjects = ctx.AppState.semesterData[sem];
            assert.ok(Array.isArray(subjects) && subjects.length > 0, `Semester ${sem} has subjects`);
            const codes = subjects.map(s => s.code);
            const unique = new Set(codes);
            assert.strictEqual(
                unique.size,
                codes.length,
                `Duplicate course code detected in track ${trackId} sem ${sem}: [${codes.join(', ')}]`
            );
        });
    });
});

UPPERCASE_ALIASES.forEach(alias => {
    check(`Uppercase alias "${alias}" produces zero duplicates in Semesters 5, 7, 8`, () => {
        ctx.setComboTrack(alias);
        [5, 7, 8].forEach(sem => {
            const subjects = ctx.AppState.semesterData[sem];
            const codes = subjects.map(s => s.code);
            assert.strictEqual(new Set(codes).size, codes.length, `Duplicate in alias ${alias} sem ${sem}`);
        });
    });
});

check('Java Semester 7 contains exactly ["SWD392", "PMG201c", "EXE101", "SBA301", "MSS301"]', () => {
    ctx.setComboTrack('java');
    const sem7Codes = ctx.AppState.semesterData[7].map(s => s.code);
    assert.deepStrictEqual([...sem7Codes], ['SWD392', 'PMG201c', 'EXE101', 'SBA301', 'MSS301']);
    assert.strictEqual(sem7Codes.filter(c => c === 'SBA301').length, 1, 'SBA301 must appear exactly once');
    assert.strictEqual(sem7Codes.filter(c => c === 'MSS301').length, 1, 'MSS301 must appear exactly once');
});

check('Japanese Semester 7 contains exactly ["SWD392", "PMG201c", "EXE101", "JPD316", "JIT401"] and Sem 8 includes JIS401', () => {
    ctx.setComboTrack('japanese');
    const sem7Codes = ctx.AppState.semesterData[7].map(s => s.code);
    assert.deepStrictEqual([...sem7Codes], ['SWD392', 'PMG201c', 'EXE101', 'JPD316', 'JIT401']);
    assert.strictEqual(sem7Codes.filter(c => c === 'JPD316').length, 1, 'JPD316 must appear exactly once');
    assert.strictEqual(sem7Codes.filter(c => c === 'JIT401').length, 1, 'JIT401 must appear exactly once');

    const sem8Codes = ctx.AppState.semesterData[8].map(s => s.code);
    assert.ok(sem8Codes.includes('JIS401'), 'Japanese Sem 8 must map JIS401');
    assert.strictEqual(new Set([...sem8Codes]).size, sem8Codes.length, 'No duplicate in Japanese Sem 8');
});

check('Fallback for incomplete track courses does not duplicate earlier slot', () => {
    ctx.COMBO_TRACKS.challenger_incomplete = {
        id: 'challenger_incomplete',
        name: 'Incomplete Test Track',
        nameVi: 'Thử nghiệm thiếu môn',
        courses: { 7: ['SBA301'] } // only 1 course for 2 slots
    };
    ctx.setComboTrack('challenger_incomplete');
    const sem7Codes = ctx.AppState.semesterData[7].map(s => s.code);
    assert.strictEqual(sem7Codes[3], 'SBA301');
    assert.strictEqual(sem7Codes[4], 'SE_COM*3', 'Slot 4 must fall back to curriculum placeholder, not SBA301');
    assert.strictEqual(new Set([...sem7Codes]).size, sem7Codes.length);
    delete ctx.COMBO_TRACKS.challenger_incomplete;
});

// -----------------------------------------------------------------------------
// TEST SUITE 2: Rapid Track Cycling with Distinct Grades in Semester 7
// -----------------------------------------------------------------------------
console.log('\n--- TEST SUITE 2: Rapid Track Cycling & Grade Preservation in Semester 7 ---');

check('Rapid track cycling across all 8 tracks restores distinct grades without corruption', () => {
    ctx.initializeAppState();

    // 1. Enter distinct scores into core courses in Semester 7 (SWD392, PMG201c, EXE101)
    const sem7Init = ctx.AppState.semesterData[7];
    const coreScores = {
        SWD392: '8.4',
        PMG201c: '7.8',
        EXE101: '9.2'
    };
    sem7Init.slice(0, 3).forEach(sub => {
        const val = coreScores[sub.code];
        sub.components.forEach(c => {
            c.avgValue = val;
            if (Array.isArray(c.subValues)) {
                c.subValues = c.subValues.map(() => val);
            }
        });
    });

    // 2. For each of the 8 tracks, switch to track and enter unique distinct scores into combo slots (3 & 4)
    const expectedComboScores = {};
    ALL_8_TRACKS.forEach((trackId, tIdx) => {
        ctx.setComboTrack(trackId);
        const sem7 = ctx.AppState.semesterData[7];
        assert.strictEqual(sem7.length, 5, `Semester 7 must have 5 subjects for track ${trackId}`);

        expectedComboScores[trackId] = [];

        // Slots 3 and 4 are combo courses
        [3, 4].forEach(slotIdx => {
            const sub = sem7[slotIdx];
            const compSnapshots = [];

            sub.components.forEach((comp, cIdx) => {
                // Unique score per track, slot, and component
                const scoreVal = Number((5.5 + (tIdx * 0.5) + ((slotIdx - 3) * 0.4) + (cIdx * 0.1)).toFixed(1));
                const scoreStr = String(scoreVal);
                comp.avgValue = scoreStr;
                if (Array.isArray(comp.subValues)) {
                    comp.subValues = comp.subValues.map((_, pIdx) => {
                        const partVal = Number((scoreVal + (pIdx * 0.05)).toFixed(2));
                        return String(partVal);
                    });
                }
                compSnapshots.push({
                    compId: comp.id,
                    name: comp.name,
                    avgValue: comp.avgValue,
                    subValues: [...comp.subValues]
                });
            });

            const calculated = ctx.calculateSubjectScore(sub);
            expectedComboScores[trackId].push({
                slotIdx,
                code: sub.code,
                comboSlot: sub.comboSlot,
                components: compSnapshots,
                calculated: {
                    finalScore: calculated.finalScore,
                    isPass: calculated.isPass,
                    statusText: calculated.statusText
                }
            });
        });
    });

    // 3. Adversarial rapid cycling: 200 rapid track switches
    const cycleOrder = [];
    for (let i = 0; i < 10; i++) {
        cycleOrder.push(...ALL_8_TRACKS);
        cycleOrder.push(...[...ALL_8_TRACKS].reverse());
    }
    // High-risk collision pairs: Java <-> Japanese, .NET <-> React, AI <-> DS, Game <-> IC
    for (let i = 0; i < 10; i++) {
        cycleOrder.push('java', 'japanese', 'java', 'japanese');
        cycleOrder.push('dotnet', 'react', 'dotnet', 'react');
        cycleOrder.push('ai', 'datascience', 'game', 'icdesign');
    }

    console.log(`    * Executing ${cycleOrder.length} rapid track switches across all 8 tracks...`);
    cycleOrder.forEach((tId) => {
        ctx.setComboTrack(tId);
    });

    // 4. Assert all core courses and all 8 tracks' combo courses are preserved with 0 corruption
    ALL_8_TRACKS.forEach((trackId) => {
        ctx.setComboTrack(trackId);
        const currentSem7 = ctx.AppState.semesterData[7];

        // Verify Core Courses (Slots 0, 1, 2)
        currentSem7.slice(0, 3).forEach(sub => {
            const expectedVal = coreScores[sub.code];
            sub.components.forEach(c => {
                assert.strictEqual(
                    c.avgValue,
                    expectedVal,
                    `Core course ${sub.code} avgValue corrupted after cycling: expected ${expectedVal}, got ${c.avgValue}`
                );
            });
        });

        // Verify Combo Courses (Slots 3, 4)
        const expectedCombos = expectedComboScores[trackId];
        expectedCombos.forEach((exp) => {
            const actual = currentSem7[exp.slotIdx];
            assert.strictEqual(actual.code, exp.code, `Track ${trackId} slot ${exp.slotIdx} code mismatch`);
            assert.strictEqual(actual.comboSlot, exp.comboSlot, `Track ${trackId} slot ${exp.slotIdx} comboSlot mismatch`);

            exp.components.forEach((expComp, cIdx) => {
                const actualComp = actual.components[cIdx];
                assert.ok(actualComp, `Component ${cIdx} exists on ${actual.code}`);
                assert.strictEqual(
                    actualComp.avgValue,
                    expComp.avgValue,
                    `Score drift on track "${trackId}", subject "${actual.code}", component "${expComp.name}": expected ${expComp.avgValue}, got ${actualComp.avgValue}`
                );
                assert.deepStrictEqual(
                    [...actualComp.subValues],
                    [...expComp.subValues],
                    `SubValues corrupted on track "${trackId}", subject "${actual.code}", component "${expComp.name}"`
                );
            });

            // Recalculate score and assert identity
            const recalc = ctx.calculateSubjectScore(actual);
            assert.strictEqual(recalc.finalScore, exp.calculated.finalScore, `Recalculated finalScore drift on ${actual.code} (${trackId})`);
            assert.strictEqual(recalc.isPass, exp.calculated.isPass, `Pass status drift on ${actual.code} (${trackId})`);
        });
    });
});

check('Score cache keys use compound slot-specific IDs preventing collisions', () => {
    ctx.initializeAppState();
    const mockSub1 = { code: 'SBA301', comboSlot: 0 };
    const mockSub2 = { code: 'SBA301', comboSlot: 1 };
    const mockSubNoSlot = { code: 'SWD392' };

    const key1 = ctx.evalInContext('getSubjectCacheKey')(mockSub1);
    const key2 = ctx.evalInContext('getSubjectCacheKey')(mockSub2);
    const keyNoSlot = ctx.evalInContext('getSubjectCacheKey')(mockSubNoSlot);

    assert.strictEqual(key1, 'SBA301_slot_0', 'Slot 0 key must include comboSlot');
    assert.strictEqual(key2, 'SBA301_slot_1', 'Slot 1 key must include comboSlot');
    assert.strictEqual(keyNoSlot, 'SWD392', 'Non-combo subject defaults to subject.code');
    assert.notStrictEqual(key1, key2, 'Slot 0 and Slot 1 keys must never collide');
});

// -----------------------------------------------------------------------------
// TEST SUITE 3: Assert All 90+ Course Schemas Have Weights Summing to 100%
// -----------------------------------------------------------------------------
console.log('\n--- TEST SUITE 3: Course Schema Weight Integrity (100% Sum) ---');

const schemaKeys = Object.keys(SUBJECT_SCHEMAS);
check(`Catalog contains at least 90 course schemas (found ${schemaKeys.length})`, () => {
    assert.ok(schemaKeys.length >= 90, `Expected >= 90 schemas, found ${schemaKeys.length}`);
});

let scoredCount = 0;
let unscoredCount = 0;
let auditedWeightViolations = [];

schemaKeys.forEach(code => {
    const schema = SUBJECT_SCHEMAS[code];
    if (schema.isScored !== false) {
        scoredCount++;
        // Check components
        assert.ok(Array.isArray(schema.components) && schema.components.length > 0, `Scored subject ${code} must have components`);
        const compSum = schema.components.reduce((sum, c) => sum + Number(c.weight), 0);
        if (Math.abs(compSum - 100) > 1e-4) {
            auditedWeightViolations.push(`${code}: components sum to ${compSum}%`);
        }
        // Check assessments if present
        if (Array.isArray(schema.assessments) && schema.assessments.length > 0) {
            const assessSum = schema.assessments.reduce((sum, a) => sum + Number(a.weight), 0);
            if (Math.abs(assessSum - 100) > 1e-4) {
                auditedWeightViolations.push(`${code}: assessments sum to ${assessSum}%`);
            }
        }
    } else {
        unscoredCount++;
        if (Array.isArray(schema.components) && schema.components.length > 0) {
            const compSum = schema.components.reduce((sum, c) => sum + Number(c.weight), 0);
            if (Math.abs(compSum - 100) > 1e-4) {
                auditedWeightViolations.push(`Unscored ${code}: components sum to ${compSum}%`);
            }
        }
    }
});

check(`All ${scoredCount} scored course schemas have components and assessments summing to exactly 100%`, () => {
    assert.strictEqual(auditedWeightViolations.length, 0, `Weight violations found:\n${auditedWeightViolations.join('\n')}`);
});

check('Audited Remediation Course: MSS301 schema is fully defined with 100% weights', () => {
    const mss = SUBJECT_SCHEMAS['MSS301'];
    assert.ok(mss, 'MSS301 must exist in SUBJECT_SCHEMAS');
    assert.strictEqual(mss.credits, 3, 'MSS301 credits must be 3');
    assert.strictEqual(mss.isScored, true, 'MSS301 must be scored');
    const sum = mss.components.reduce((acc, c) => acc + c.weight, 0);
    assert.strictEqual(sum, 100, 'MSS301 components must sum to 100%');
    const fe = mss.components.find(c => c.isFE || c.name.includes('FE'));
    assert.ok(fe, 'MSS301 must have FE component');
    assert.strictEqual(fe.minScore, 4.0, 'MSS301 FE hurdle must be 4.0');
});

check('Audited Remediation Course: AIL304m schema matches official syllabus (Lab 20%, PT 20%, Project 30%, FE 30%)', () => {
    const ail = SUBJECT_SCHEMAS['AIL304m'];
    assert.ok(ail, 'AIL304m must exist in SUBJECT_SCHEMAS');
    assert.strictEqual(ail.credits, 3, 'AIL304m credits must be 3');
    const sum = ail.components.reduce((acc, c) => acc + c.weight, 0);
    assert.strictEqual(sum, 100, 'AIL304m components must sum to 100%');

    const lab = ail.components.find(c => c.name.toLowerCase().includes('lab'));
    const pt = ail.components.find(c => c.name.toLowerCase().includes('progress'));
    const proj = ail.components.find(c => c.name.toLowerCase().includes('project'));
    const fe = ail.components.find(c => c.isFE || c.name.includes('FE') || c.name.includes('Final'));

    assert.ok(lab && lab.weight === 20, `AIL304m Lab must be 20% (got ${lab ? lab.weight : 'none'})`);
    assert.ok(pt && pt.weight === 20, `AIL304m Progress test must be 20% (got ${pt ? pt.weight : 'none'})`);
    assert.ok(proj && proj.weight === 30, `AIL304m Project must be 30% (got ${proj ? proj.weight : 'none'})`);
    assert.ok(fe && fe.weight === 30, `AIL304m Final Exam must be 30% (got ${fe ? fe.weight : 'none'})`);
    assert.strictEqual(fe.minScore, 4.0, 'AIL304m FE minScore must be 4.0');
});

check('Audited Japanese Combo Courses: JIT401 and JIS401 exist with 100% weights and 3 credits', () => {
    const jit = SUBJECT_SCHEMAS['JIT401'];
    const jis = SUBJECT_SCHEMAS['JIS401'];
    assert.ok(jit, 'JIT401 must exist');
    assert.ok(jis, 'JIS401 must exist');
    assert.strictEqual(jit.credits, 3, 'JIT401 must be 3 credits');
    assert.strictEqual(jis.credits, 3, 'JIS401 must be 3 credits');
    assert.strictEqual(jit.components.reduce((s, c) => s + c.weight, 0), 100, 'JIT401 components sum to 100');
    assert.strictEqual(jis.components.reduce((s, c) => s + c.weight, 0), 100, 'JIS401 components sum to 100');
});

check('All 5 Graduation Capstone Electives have schemas with 100% weights', () => {
    ['SEP490', 'SET490', 'EXE402', 'PIT490', 'GRC490'].forEach(capCode => {
        const schema = SUBJECT_SCHEMAS[capCode];
        assert.ok(schema, `Schema for ${capCode} must exist`);
        const sum = schema.components.reduce((s, c) => s + c.weight, 0);
        assert.strictEqual(sum, 100, `${capCode} components must sum to 100%`);
    });
});

// -----------------------------------------------------------------------------
// SUMMARY & EXIT
// -----------------------------------------------------------------------------
console.log('\n========================================================================');
console.log('                   CHALLENGER 1 EXECUTION SUMMARY');
console.log('========================================================================');
console.log(`Total Checks Run:     ${totalAssertions}`);
console.log(`Passed Checks:        ${passedAssertions}`);
console.log(`Failed Checks:        ${failedAssertions}`);
console.log(`Audited Scored Schemas: ${scoredCount}`);
console.log(`Audited Unscored Schemas: ${unscoredCount}`);
console.log(`Audited Total Schemas:  ${schemaKeys.length}`);
console.log('========================================================================\n');

if (failedAssertions > 0) {
    console.error(`VERDICT: REJECT (${failedAssertions} failures detected)`);
    process.exit(1);
} else {
    console.log('VERDICT: APPROVE (100% checks passed cleanly)');
    process.exit(0);
}
