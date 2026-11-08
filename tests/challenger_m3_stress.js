/**
 * Challenger 1 Independent Empirical Adversarial Stress Test Harness
 * Milestone 3: Specialized Business Rules & Export Sandbox Integrity
 * 
 * Verifies:
 * 1. Rounding boundary cases (4.94 vs 4.95, 8.994 vs 8.995).
 * 2. Hurdles (process=0 vs 0.1, FE=3.9 vs 4.0, Vovinam FE=4.9 vs 5.0).
 * 3. Condition course failure blocking honors despite high GPA (VOV, LAB211, PEN, OTP101, OJT202).
 * 4. Semester 6 OJT rules and omission of Cóc Vàng / Top 100.
 * 5. Semesters 8 & 9 Capstone honors calculation and suppression of Cóc Vàng / Top 100.
 * 6. Export sandbox DOM isolation and cleanup integrity.
 */

const assert = require('node:assert/strict');
const {
    loadAppSandbox,
    createSubjectFixture,
    createComponentFixture
} = require('./test_helper.js');

console.log('========================================================================');
console.log(' CHALLENGER 1: EMPIRICAL ADVERSARIAL STRESS TEST (MILESTONE 3)');
console.log(' Target: Rounding, Hurdles, Condition Blocking, Sem 6/8/9 Rules');
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

async function checkAsync(desc, fn) {
    totalAssertions++;
    try {
        await fn();
        passedAssertions++;
        console.log(`  [PASS] ${desc}`);
    } catch (err) {
        failedAssertions++;
        failureLog.push({ desc, error: err.message, stack: err.stack });
        console.error(`  [FAIL] ${desc} --> ${err.message}`);
    }
}

async function main() {
    const ctx = loadAppSandbox();
    ctx.initializeAppState();


// -----------------------------------------------------------------------------
// TEST SUITE 1: Precision Rounding Boundary Cases (4.94 vs 4.95, 8.994 vs 8.995)
// -----------------------------------------------------------------------------
console.log('--- TEST SUITE 1: Precision Rounding Boundary Cases ---');

// 1.1 Subject Final Score: 4.94 vs 4.95
check('1.1.1: Single component exact 4.94 rounds down to 4.9 and fails minAvgToPass (5.0)', () => {
    const sub = createSubjectFixture({
        components: [createComponentFixture({ weight: 100, score: 4.94, minScore: 4.0, isFE: true })]
    });
    const res = ctx.calculateSubjectScore(sub);
    assert.strictEqual(res.finalScore, 4.9);
    assert.strictEqual(res.roundedScore, '4.9');
    assert.strictEqual(res.isPass, false);
    assert.strictEqual(res.statusText, 'NOT PASS');
    assert.ok(res.failReason.includes('5'));
});

check('1.1.2: Single component exact 4.95 rounds up to 5.0 and passes minAvgToPass (5.0)', () => {
    const sub = createSubjectFixture({
        components: [createComponentFixture({ weight: 100, score: 4.95, minScore: 4.0, isFE: true })]
    });
    const res = ctx.calculateSubjectScore(sub);
    assert.strictEqual(res.finalScore, 5.0);
    assert.strictEqual(res.roundedScore, '5.0');
    assert.strictEqual(res.isPass, true);
    assert.strictEqual(res.statusText, 'PASS');
});

check('1.1.3: Asymmetric two-component weighted sum producing 4.94 (50%*5.0 + 50%*4.88) fails', () => {
    const sub = createSubjectFixture({
        components: [
            createComponentFixture({ name: 'PT', weight: 50, score: 5.0, minScore: 0, isFE: false }),
            createComponentFixture({ name: 'FE', weight: 50, score: 4.88, minScore: 4.0, isFE: true })
        ]
    });
    // 2.50 + 2.44 = 4.94 -> 4.9
    const res = ctx.calculateSubjectScore(sub);
    assert.strictEqual(res.finalScore, 4.9);
    assert.strictEqual(res.isPass, false);
});

check('1.1.4: Asymmetric two-component weighted sum producing 4.95 (50%*5.0 + 50%*4.90) passes', () => {
    const sub = createSubjectFixture({
        components: [
            createComponentFixture({ name: 'PT', weight: 50, score: 5.0, minScore: 0, isFE: false }),
            createComponentFixture({ name: 'FE', weight: 50, score: 4.90, minScore: 4.0, isFE: true })
        ]
    });
    // 2.50 + 2.45 = 4.95 -> 5.0
    const res = ctx.calculateSubjectScore(sub);
    assert.strictEqual(res.finalScore, 5.0);
    assert.strictEqual(res.isPass, true);
});

check('1.1.5: Infinitesimal boundary 4.949 rounds down to 4.9, 4.951 rounds up to 5.0', () => {
    const subDown = createSubjectFixture({
        components: [createComponentFixture({ weight: 100, score: 4.949, minScore: 4.0, isFE: true })]
    });
    const subUp = createSubjectFixture({
        components: [createComponentFixture({ weight: 100, score: 4.951, minScore: 4.0, isFE: true })]
    });
    assert.strictEqual(ctx.calculateSubjectScore(subDown).finalScore, 4.9);
    assert.strictEqual(ctx.calculateSubjectScore(subDown).isPass, false);
    assert.strictEqual(ctx.calculateSubjectScore(subUp).finalScore, 5.0);
    assert.strictEqual(ctx.calculateSubjectScore(subUp).isPass, true);
});

// 1.2 Semester TBM Arithmetic Mean: 8.994 vs 8.995
check('1.2.1: 50 subjects with unweighted sum 449.7 (mean 8.994) rounds to TBM 8.99 (Giỏi)', () => {
    // 449.7 / 50 = 8.994 exactly
    const subs = [];
    for (let i = 0; i < 50; i++) {
        // 47 subjects at 9.0 (423.0) + 3 subjects at 8.9 (26.7) = 449.7
        const score = (i < 47) ? 9.0 : 8.9;
        subs.push(createSubjectFixture({
            code: `S_${i}`,
            components: [createComponentFixture({ score })]
        }));
    }
    const res = ctx.calculateSemesterResults(subs, 1);
    assert.strictEqual(res.completedScoredCount, 50);
    assert.strictEqual(res.tbm, 8.99);
    assert.strictEqual(res.tbmStr, '8.99');
    assert.strictEqual(res.honor.title, 'Sinh viên Giỏi');
    assert.strictEqual(res.honor.level, 'gioi');
});

check('1.2.2: 20 subjects with unweighted sum 179.9 (mean 8.995) rounds to TBM 9.00 (Xuất Sắc)', () => {
    // 179.9 / 20 = 8.995 exactly
    const subs = [];
    for (let i = 0; i < 20; i++) {
        // 19 subjects at 9.0 (171.0) + 1 subject at 8.9 (8.9) = 179.9
        const score = (i < 19) ? 9.0 : 8.9;
        subs.push(createSubjectFixture({
            code: `S_${i}`,
            components: [createComponentFixture({ score })]
        }));
    }
    const res = ctx.calculateSemesterResults(subs, 1);
    assert.strictEqual(res.completedScoredCount, 20);
    assert.strictEqual(res.tbm, 9.00);
    assert.strictEqual(res.tbmStr, '9.00');
    assert.strictEqual(res.honor.title, 'Sinh viên Xuất Sắc');
    assert.strictEqual(res.honor.level, 'xuatsac');
});

check('1.2.3: Real-world 3-subject boundary around 9.0 (26.9/3 = 8.97 vs 27.0/3 = 9.00)', () => {
    const sDown = [9.0, 9.0, 8.9].map((score, i) => createSubjectFixture({
        code: `SD_${i}`,
        components: [createComponentFixture({ score })]
    }));
    const sUp = [9.0, 9.0, 9.0].map((score, i) => createSubjectFixture({
        code: `SU_${i}`,
        components: [createComponentFixture({ score })]
    }));
    const resDown = ctx.calculateSemesterResults(sDown, 1);
    const resUp = ctx.calculateSemesterResults(sUp, 1);
    assert.strictEqual(resDown.tbm, 8.97);
    assert.strictEqual(resDown.honor.title, 'Sinh viên Giỏi');
    assert.strictEqual(resUp.tbm, 10.0 ? 9.00 : 9.00);
    assert.strictEqual(resUp.tbm, 9.00);
    assert.strictEqual(resUp.honor.title, 'Sinh viên Xuất Sắc');
});

check('1.2.4: Real-world 6-subject boundary around 9.0 (53.9/6 = 8.98 vs 54.0/6 = 9.00)', () => {
    const sDown = [9.0, 9.0, 9.0, 9.0, 9.0, 8.9].map((score, i) => createSubjectFixture({
        code: `S6D_${i}`,
        components: [createComponentFixture({ score })]
    }));
    const sUp = [9.0, 9.0, 9.0, 9.0, 9.0, 9.0].map((score, i) => createSubjectFixture({
        code: `S6U_${i}`,
        components: [createComponentFixture({ score })]
    }));
    const resDown = ctx.calculateSemesterResults(sDown, 1);
    const resUp = ctx.calculateSemesterResults(sUp, 1);
    assert.strictEqual(resDown.tbm, 8.98);
    assert.strictEqual(resDown.honor.title, 'Sinh viên Giỏi');
    assert.strictEqual(resUp.tbm, 9.00);
    assert.strictEqual(resUp.honor.title, 'Sinh viên Xuất Sắc');
});

check('1.2.5: Unweighted property invariance across credit disparities (10 credits vs 2 credits)', () => {
    const sub10Cred = createSubjectFixture({ code: 'SUB_10C', credits: 10, components: [createComponentFixture({ score: 10.0 })] });
    const sub2Cred = createSubjectFixture({ code: 'SUB_2C', credits: 2, components: [createComponentFixture({ score: 5.0 })] });
    const res = ctx.calculateSemesterResults([sub10Cred, sub2Cred], 1);
    // Unweighted arithmetic mean: (10.0 + 5.0) / 2 = 7.50
    // Credit-weighted would have been (10*10 + 2*5)/12 = 9.17
    assert.strictEqual(res.tbm, 7.50);
    assert.strictEqual(res.honor.title, 'Sinh viên Khá');
});

// -----------------------------------------------------------------------------
// TEST SUITE 2: Component Hurdle Boundaries
// -----------------------------------------------------------------------------
console.log('\n--- TEST SUITE 2: Component Hurdle Boundaries ---');

// 2.1 Process component = 0.0 vs 0.1
check('2.1.1: Process component = 0.0 fails hurdle (<= 0) even with FE = 10.0', () => {
    const sub = createSubjectFixture({
        components: [
            createComponentFixture({ name: 'Progress Test', weight: 40, score: 0.0, minScore: 0, isFE: false }),
            createComponentFixture({ name: 'Final Exam', weight: 60, score: 10.0, minScore: 4.0, isFE: true })
        ]
    });
    // Total weighted sum = 0.0*0.4 + 10.0*0.6 = 6.0 >= 5.0
    const res = ctx.calculateSubjectScore(sub);
    assert.strictEqual(res.isPass, false);
    assert.strictEqual(res.statusText, 'NOT PASS');
    assert.ok(res.failReason.includes('Liệt Progress Test') && res.failReason.includes('<= 0'));
});

check('2.1.2: Process component = 0.1 passes hurdle (> 0) with FE = 10.0', () => {
    const sub = createSubjectFixture({
        components: [
            createComponentFixture({ name: 'Progress Test', weight: 40, score: 0.1, minScore: 0, isFE: false }),
            createComponentFixture({ name: 'Final Exam', weight: 60, score: 10.0, minScore: 4.0, isFE: true })
        ]
    });
    // Total weighted sum = 0.04 + 6.0 = 6.04 -> 6.0
    const res = ctx.calculateSubjectScore(sub);
    assert.strictEqual(res.isPass, true);
    assert.strictEqual(res.statusText, 'PASS');
});

check('2.1.3: Process component = 0.05 passes hurdle (> 0)', () => {
    const sub = createSubjectFixture({
        components: [
            createComponentFixture({ name: 'Progress Test', weight: 50, score: 0.05, minScore: 0, isFE: false }),
            createComponentFixture({ name: 'Final Exam', weight: 50, score: 10.0, minScore: 4.0, isFE: true })
        ]
    });
    const res = ctx.calculateSubjectScore(sub);
    assert.strictEqual(res.isPass, true);
});

check('2.1.4: Detailed mode process component with subparts all 0.0 fails hurdle', () => {
    const sub = createSubjectFixture({
        components: [
            createComponentFixture({ name: 'Lab Subparts', weight: 40, subScores: [0.0, 0.0, 0.0], minScore: 0, isFE: false }),
            createComponentFixture({ name: 'FE', weight: 60, score: 10.0, minScore: 4.0, isFE: true })
        ]
    });
    const res = ctx.calculateSubjectScore(sub);
    assert.strictEqual(res.isPass, false);
    assert.ok(res.failReason.includes('Lab Subparts'));
});

check('2.1.5: Detailed mode process component with average > 0 [0.0, 6.0, 6.0] passes hurdle', () => {
    const sub = createSubjectFixture({
        components: [
            createComponentFixture({ name: 'Lab Subparts', weight: 40, subScores: [0.0, 6.0, 6.0], minScore: 0, isFE: false }),
            createComponentFixture({ name: 'FE', weight: 60, score: 10.0, minScore: 4.0, isFE: true })
        ]
    });
    // avg = 12 / 3 = 4.0 > 0
    const res = ctx.calculateSubjectScore(sub);
    assert.strictEqual(res.isPass, true);
});

// 2.2 Standard Final Exam: FE = 3.9 vs 4.0
check('2.2.1: FE = 3.9 fails hurdle (< 4.0) despite perfect 10.0 process (weighted sum = 7.6)', () => {
    const sub = createSubjectFixture({
        components: [
            createComponentFixture({ name: 'PT', weight: 60, score: 10.0, minScore: 0, isFE: false }),
            createComponentFixture({ name: 'Final Exam (FE)', weight: 40, score: 3.9, minScore: 4.0, isFE: true })
        ]
    });
    // 6.0 + 1.56 = 7.56 -> 7.6 (High score, but failed hurdle!)
    const res = ctx.calculateSubjectScore(sub);
    assert.strictEqual(res.isPass, false);
    assert.strictEqual(res.statusText, 'NOT PASS');
    assert.ok(res.failReason.includes('Liệt Final Exam (FE)') && res.failReason.includes('< 4'));
});

check('2.2.2: FE = 3.99 fails hurdle (< 4.0)', () => {
    const sub = createSubjectFixture({
        components: [
            createComponentFixture({ name: 'PT', weight: 50, score: 10.0, minScore: 0, isFE: false }),
            createComponentFixture({ name: 'FE', weight: 50, score: 3.99, minScore: 4.0, isFE: true })
        ]
    });
    const res = ctx.calculateSubjectScore(sub);
    assert.strictEqual(res.isPass, false);
});

check('2.2.3: FE = 4.0 with sufficient process score passes hurdle and course', () => {
    const sub = createSubjectFixture({
        components: [
            createComponentFixture({ name: 'PT', weight: 50, score: 6.0, minScore: 0, isFE: false }),
            createComponentFixture({ name: 'FE', weight: 50, score: 4.0, minScore: 4.0, isFE: true })
        ]
    });
    // 3.0 + 2.0 = 5.0
    const res = ctx.calculateSubjectScore(sub);
    assert.strictEqual(res.isPass, true);
    assert.strictEqual(res.finalScore, 5.0);
});

check('2.2.4: FE = 4.0 with insufficient process score fails due to total < 5.0, not FE hurdle', () => {
    const sub = createSubjectFixture({
        components: [
            createComponentFixture({ name: 'PT', weight: 50, score: 3.0, minScore: 0, isFE: false }),
            createComponentFixture({ name: 'FE', weight: 50, score: 4.0, minScore: 4.0, isFE: true })
        ]
    });
    // 1.5 + 2.0 = 3.5 < 5.0
    const res = ctx.calculateSubjectScore(sub);
    assert.strictEqual(res.isPass, false);
    assert.ok(res.failReason.includes('Điểm tổng kết < 5'));
});

// 2.3 Vovinam FE: 4.9 vs 5.0
check('2.3.1: Vovinam FE = 4.9 fails hurdle (minScore 5.0)', () => {
    const sub = createSubjectFixture({
        code: 'VOV114',
        nameVi: 'Vovinam 1',
        isScored: false,
        isPhysicalEducation: true,
        components: [
            createComponentFixture({ name: 'Thi thực hành Vovinam', weight: 100, score: 4.9, minScore: 5.0, isFE: true })
        ]
    });
    const res = ctx.calculateSubjectScore(sub);
    assert.strictEqual(res.isPass, false);
    assert.strictEqual(res.statusText, 'NOT PASS');
    assert.ok(res.failReason.includes('Liệt Thi thực hành Vovinam') && res.failReason.includes('< 5'));
});

check('2.3.2: Vovinam FE = 4.99 fails hurdle (< 5.0)', () => {
    const sub = createSubjectFixture({
        code: 'VOV124',
        nameVi: 'Vovinam 2',
        isScored: false,
        isPhysicalEducation: true,
        components: [
            createComponentFixture({ name: 'Thi thực hành Vovinam', weight: 100, score: 4.99, minScore: 5.0, isFE: true })
        ]
    });
    const res = ctx.calculateSubjectScore(sub);
    assert.strictEqual(res.isPass, false);
});

check('2.3.3: Vovinam FE = 5.0 passes hurdle (>= 5.0)', () => {
    const sub = createSubjectFixture({
        code: 'VOV114',
        nameVi: 'Vovinam 1',
        isScored: false,
        isPhysicalEducation: true,
        components: [
            createComponentFixture({ name: 'Thi thực hành Vovinam', weight: 100, score: 5.0, minScore: 5.0, isFE: true })
        ]
    });
    const res = ctx.calculateSubjectScore(sub);
    assert.strictEqual(res.isPass, true);
    assert.strictEqual(res.finalScore, 5.0);
    assert.strictEqual(res.statusText, 'PASS');
});

check('2.3.4: Comparison check: FE = 4.5 passes regular course, but fails Vovinam course', () => {
    const regularSub = createSubjectFixture({
        code: 'PRF192',
        components: [
            createComponentFixture({ name: 'PT', weight: 50, score: 8.0, minScore: 0, isFE: false }),
            createComponentFixture({ name: 'FE', weight: 50, score: 4.5, minScore: 4.0, isFE: true })
        ]
    });
    const vovinamSub = createSubjectFixture({
        code: 'VOV134',
        components: [
            createComponentFixture({ name: 'FE Vovinam', weight: 100, score: 4.5, minScore: 5.0, isFE: true })
        ]
    });
    assert.strictEqual(ctx.calculateSubjectScore(regularSub).isPass, true);
    assert.strictEqual(ctx.calculateSubjectScore(vovinamSub).isPass, false);
});

// -----------------------------------------------------------------------------
// TEST SUITE 3: Condition Course Failure Blocking Honors Despite High GPA
// -----------------------------------------------------------------------------
console.log('\n--- TEST SUITE 3: Condition Course Failure Blocking Honors ---');

function createHighAchievingSemester(conditionSub, semNum = 1) {
    const scoredSubs = [
        createSubjectFixture({ code: 'SUB1', components: [createComponentFixture({ score: 9.8 })] }),
        createSubjectFixture({ code: 'SUB2', components: [createComponentFixture({ score: 9.8 })] }),
        createSubjectFixture({ code: 'SUB3', components: [createComponentFixture({ score: 9.8 })] }),
        createSubjectFixture({ code: 'SUB4', components: [createComponentFixture({ score: 9.8 })] })
    ];
    return ctx.calculateSemesterResults([...scoredSubs, conditionSub], semNum);
}

check('3.1: VOV114 failed (FE = 4.9) blocks honors for student with 9.80 TBM', () => {
    const vovFail = createSubjectFixture({
        code: 'VOV114',
        isScored: false,
        isPhysicalEducation: true,
        components: [createComponentFixture({ name: 'FE Vovinam', weight: 100, score: 4.9, minScore: 5.0, isFE: true })]
    });
    const res = createHighAchievingSemester(vovFail, 1);
    assert.strictEqual(res.tbm, 9.80);
    assert.strictEqual(res.hasFailedNonScored, true);
    assert.strictEqual(res.isPassed, false);
    assert.strictEqual(res.status, 'Chưa Đạt (Not Pass)');
    assert.strictEqual(res.honor.title, 'Chưa đạt (Not Pass)');
    assert.strictEqual(res.honor.level, 'fail');
    assert.strictEqual(res.honor.isCocVang, false);
    assert.strictEqual(res.honor.isTop100, false);
    assert.ok(res.failedSubjectCodes.includes('VOV114'));
});

check('3.2: LAB211 failed (passStatus = "fail") blocks honors for student with 9.80 TBM', () => {
    const labFail = createSubjectFixture({
        code: 'LAB211',
        isScored: false,
        isPassFailOnly: true,
        passStatus: 'fail'
    });
    const res = createHighAchievingSemester(labFail, 3);
    assert.strictEqual(res.tbm, 9.80);
    assert.strictEqual(res.hasFailedNonScored, true);
    assert.strictEqual(res.isPassed, false);
    assert.strictEqual(res.honor.title, 'Chưa đạt (Not Pass)');
    assert.strictEqual(res.honor.isCocVang, false);
    assert.strictEqual(res.honor.isTop100, false);
    assert.ok(res.failedSubjectCodes.includes('LAB211'));
});

check('3.3: PEN failed (passStatus = "fail") blocks honors for student with 9.80 TBM', () => {
    const penFail = createSubjectFixture({
        code: 'PEN',
        isScored: false,
        isPassFailOnly: true,
        passStatus: 'fail'
    });
    const res = createHighAchievingSemester(penFail, 1);
    assert.strictEqual(res.tbm, 9.80);
    assert.strictEqual(res.hasFailedNonScored, true);
    assert.strictEqual(res.honor.title, 'Chưa đạt (Not Pass)');
    assert.strictEqual(res.honor.isCocVang, false);
    assert.strictEqual(res.honor.isTop100, false);
});

check('3.4: OTP101 failed (passStatus = "fail") blocks honors for student with 9.80 TBM', () => {
    const otpFail = createSubjectFixture({
        code: 'OTP101',
        isScored: false,
        isPassFailOnly: true,
        passStatus: 'fail'
    });
    const res = createHighAchievingSemester(otpFail, 1);
    assert.strictEqual(res.tbm, 9.80);
    assert.strictEqual(res.hasFailedNonScored, true);
    assert.strictEqual(res.honor.title, 'Chưa đạt (Not Pass)');
    assert.strictEqual(res.honor.isCocVang, false);
    assert.strictEqual(res.honor.isTop100, false);
});

check('3.5: OJT202 failed (passStatus = "fail") blocks honors despite 10.0 scored courses', () => {
    const ojtFail = createSubjectFixture({
        code: 'OJT202',
        credits: 10,
        isScored: false,
        isPassFailOnly: true,
        passStatus: 'fail'
    });
    const enwPass = createSubjectFixture({
        code: 'ENW493c',
        credits: 3,
        isScored: true,
        components: [createComponentFixture({ score: 10.0 })]
    });
    const res = ctx.calculateSemesterResults([ojtFail, enwPass], 6);
    assert.strictEqual(res.tbm, 10.00);
    assert.strictEqual(res.hasFailedNonScored, true);
    assert.strictEqual(res.isPassed, false);
    assert.strictEqual(res.honor.title, 'Chưa đạt (Not Pass)');
    assert.strictEqual(res.honor.isCocVang, false);
    assert.strictEqual(res.honor.isTop100, false);
});

check('3.6: Counter-test: VOV114 passed (FE = 5.0) unblocks honors and awards Cóc Vàng (9.80 TBM)', () => {
    const vovPass = createSubjectFixture({
        code: 'VOV114',
        isScored: false,
        isPhysicalEducation: true,
        components: [createComponentFixture({ name: 'FE Vovinam', weight: 100, score: 5.0, minScore: 5.0, isFE: true })]
    });
    const res = createHighAchievingSemester(vovPass, 1);
    assert.strictEqual(res.tbm, 9.80);
    assert.strictEqual(res.hasFailedNonScored, false);
    assert.strictEqual(res.isPassed, true);
    assert.strictEqual(res.status, 'Đạt (Pass)');
    assert.strictEqual(res.honor.title, 'Sinh viên Xuất Sắc');
    assert.strictEqual(res.honor.level, 'cocvang');
    assert.strictEqual(res.honor.isCocVang, true);
    assert.strictEqual(res.honor.isTop100, true);
});

// -----------------------------------------------------------------------------
// TEST SUITE 4: Semester 6 (OJT) Rules & Omission of Cóc Vàng / Top 100
// -----------------------------------------------------------------------------
console.log('\n--- TEST SUITE 4: Semester 6 (OJT) Rules ---');

check('4.1: OJT202 alone in Semester 6 returns TBM "N/A", status "Đạt (Pass)", and suppresses predictions', () => {
    const ojtPass = createSubjectFixture({
        code: 'OJT202',
        credits: 10,
        isScored: false,
        isPassFailOnly: true,
        passStatus: 'pass'
    });
    const res = ctx.calculateSemesterResults([ojtPass], 6);
    assert.strictEqual(res.tbm, 'N/A');
    assert.strictEqual(res.tbmStr, 'N/A');
    assert.strictEqual(res.completedScoredCount, 0);
    assert.strictEqual(res.totalScoredCount, 0);
    assert.strictEqual(res.isPassed, true);
    assert.strictEqual(res.status, 'Đạt (Pass)');
    assert.strictEqual(res.honor.title, 'Đạt (Pass)');
    assert.strictEqual(res.honor.isCocVang, false);
    assert.strictEqual(res.honor.isTop100, false);
    assert.strictEqual(res.honor.highlightBadge, undefined);
});

check('4.2: OJT202 alone with passStatus = "fail" returns status "Chưa Đạt (Not Pass)"', () => {
    const ojtFail = createSubjectFixture({
        code: 'OJT202',
        credits: 10,
        isScored: false,
        isPassFailOnly: true,
        passStatus: 'fail'
    });
    const res = ctx.calculateSemesterResults([ojtFail], 6);
    assert.strictEqual(res.tbm, 'N/A');
    assert.strictEqual(res.isPassed, false);
    assert.strictEqual(res.status, 'Chưa Đạt (Not Pass)');
    assert.strictEqual(res.honor.title, 'Chưa đạt (Not Pass)');
    assert.strictEqual(res.honor.isCocVang, false);
    assert.strictEqual(res.honor.isTop100, false);
});

check('4.3: OJT202 + ENW493c (10.0 score): TBM is 10.00, awards Xuất Sắc, strictly hides Cóc Vàng / Top 100', () => {
    const ojt = createSubjectFixture({ code: 'OJT202', credits: 10, isScored: false, isPassFailOnly: true, passStatus: 'pass' });
    const enw = createSubjectFixture({ code: 'ENW493c', credits: 3, isScored: true, components: [createComponentFixture({ score: 10.0 })] });
    const res = ctx.calculateSemesterResults([ojt, enw]); // Auto-detects Semester 6 via OJT202
    assert.strictEqual(res.tbm, 10.00);
    assert.strictEqual(res.completedScoredCount, 1);
    assert.strictEqual(res.totalScoredCount, 1);
    assert.strictEqual(res.honor.title, 'Sinh viên Xuất Sắc');
    assert.strictEqual(res.honor.level, 'xuatsac');
    assert.strictEqual(res.honor.isCocVang, false);
    assert.strictEqual(res.honor.isTop100, false);
    assert.strictEqual(res.honor.highlightBadge, undefined);
});

check('4.4: OJT202 + ENW493c (9.4 score): TBM is 9.40, awards Xuất Sắc, hides Top 100 predictions', () => {
    const ojt = createSubjectFixture({ code: 'OJT202', credits: 10, isScored: false, isPassFailOnly: true, passStatus: 'pass' });
    const enw = createSubjectFixture({ code: 'ENW493c', credits: 3, isScored: true, components: [createComponentFixture({ score: 9.4 })] });
    const res = ctx.calculateSemesterResults([ojt, enw], 6);
    assert.strictEqual(res.tbm, 9.40);
    assert.strictEqual(res.honor.title, 'Sinh viên Xuất Sắc');
    assert.strictEqual(res.honor.level, 'xuatsac');
    assert.strictEqual(res.honor.isCocVang, false);
    assert.strictEqual(res.honor.isTop100, false);
    assert.strictEqual(res.honor.highlightBadge, undefined);
});

check('4.5: OJT202 + ENW493c (8.5 score): TBM is 8.50, awards Sinh viên Giỏi', () => {
    const ojt = createSubjectFixture({ code: 'OJT202', isScored: false, isPassFailOnly: true, passStatus: 'pass' });
    const enw = createSubjectFixture({ code: 'ENW493c', isScored: true, components: [createComponentFixture({ score: 8.5 })] });
    const res = ctx.calculateSemesterResults([ojt, enw], 6);
    assert.strictEqual(res.tbm, 8.50);
    assert.strictEqual(res.honor.title, 'Sinh viên Giỏi');
    assert.strictEqual(res.honor.level, 'gioi');
});

check('4.6: OJT202 + ENW493c (7.5 score): TBM is 7.50, awards Sinh viên Khá', () => {
    const ojt = createSubjectFixture({ code: 'OJT202', isScored: false, isPassFailOnly: true, passStatus: 'pass' });
    const enw = createSubjectFixture({ code: 'ENW493c', isScored: true, components: [createComponentFixture({ score: 7.5 })] });
    const res = ctx.calculateSemesterResults([ojt, enw], 6);
    assert.strictEqual(res.tbm, 7.50);
    assert.strictEqual(res.honor.title, 'Sinh viên Khá');
    assert.strictEqual(res.honor.level, 'kha');
});

// -----------------------------------------------------------------------------
// TEST SUITE 5: Semesters 8 & 9 Capstone Honors & Suppression of Cóc Vàng / Top 100
// -----------------------------------------------------------------------------
console.log('\n--- TEST SUITE 5: Semesters 8 & 9 Capstone Honors & Suppression ---');

// 5.1 Semester 8
check('5.1.1: Semester 8 with 10.0 TBM awards Xuất Sắc, strictly hides Cóc Vàng & Top 100', () => {
    const s1 = createSubjectFixture({ code: 'PRM393', credits: 3, components: [createComponentFixture({ score: 10.0 })] });
    const s2 = createSubjectFixture({ code: 'ITE302c', credits: 3, components: [createComponentFixture({ score: 10.0 })] });
    const s3 = createSubjectFixture({ code: 'EXE201', credits: 3, components: [createComponentFixture({ score: 10.0 })] });
    const s4 = createSubjectFixture({ code: 'MLN111', credits: 3, components: [createComponentFixture({ score: 10.0 })] });
    const s5 = createSubjectFixture({ code: 'MLN122', credits: 2, components: [createComponentFixture({ score: 10.0 })] });

    const res = ctx.calculateSemesterResults([s1, s2, s3, s4, s5], 8);
    assert.strictEqual(res.tbm, 10.00);
    assert.strictEqual(res.honor.title, 'Sinh viên Xuất Sắc');
    assert.strictEqual(res.honor.level, 'xuatsac');
    assert.strictEqual(res.honor.isCocVang, false);
    assert.strictEqual(res.honor.isTop100, false);
    assert.strictEqual(res.honor.highlightBadge, undefined);
});

check('5.1.2: Semester 8 auto-detection via PRM393/ITE302c suppresses Cóc Vàng without explicit param', () => {
    const s1 = createSubjectFixture({ code: 'PRM393', components: [createComponentFixture({ score: 9.8 })] });
    const s2 = createSubjectFixture({ code: 'ITE302c', components: [createComponentFixture({ score: 9.8 })] });
    const res = ctx.calculateSemesterResults([s1, s2]); // No explicit semester passed
    assert.strictEqual(res.tbm, 9.80);
    assert.strictEqual(res.honor.title, 'Sinh viên Xuất Sắc');
    assert.strictEqual(res.honor.isCocVang, false);
    assert.strictEqual(res.honor.isTop100, false);
    assert.strictEqual(res.honor.highlightBadge, undefined);
});

check('5.1.3: Semester 8 with 8.50 TBM awards Sinh viên Giỏi', () => {
    const s1 = createSubjectFixture({ code: 'PRM393', components: [createComponentFixture({ score: 8.5 })] });
    const s2 = createSubjectFixture({ code: 'ITE302c', components: [createComponentFixture({ score: 8.5 })] });
    const res = ctx.calculateSemesterResults([s1, s2], 8);
    assert.strictEqual(res.tbm, 8.50);
    assert.strictEqual(res.honor.title, 'Sinh viên Giỏi');
});

// 5.2 Semester 9 (Capstone)
check('5.2.1: Semester 9 with perfect 10.0 TBM awards Xuất Sắc, strictly hides Cóc Vàng & Top 100', () => {
    const capstone = createSubjectFixture({ code: 'SEP490', credits: 10, components: [createComponentFixture({ score: 10.0 })] });
    const pol1 = createSubjectFixture({ code: 'HCM202', credits: 2, components: [createComponentFixture({ score: 10.0 })] });
    const pol2 = createSubjectFixture({ code: 'MLN131', credits: 2, components: [createComponentFixture({ score: 10.0 })] });
    const pol3 = createSubjectFixture({ code: 'VNR202', credits: 2, components: [createComponentFixture({ score: 10.0 })] });

    const res = ctx.calculateSemesterResults([capstone, pol1, pol2, pol3], 9);
    assert.strictEqual(res.tbm, 10.00);
    assert.strictEqual(res.honor.title, 'Sinh viên Xuất Sắc');
    assert.strictEqual(res.honor.level, 'xuatsac');
    assert.strictEqual(res.honor.isCocVang, false);
    assert.strictEqual(res.honor.isTop100, false);
    assert.strictEqual(res.honor.highlightBadge, undefined);
});

check('5.2.2: Semester 9 auto-detection via SEP490/HCM202/VNR202 suppresses Cóc Vàng without explicit param', () => {
    const capstone = createSubjectFixture({ code: 'SEP490', components: [createComponentFixture({ score: 9.9 })] });
    const pol1 = createSubjectFixture({ code: 'HCM202', components: [createComponentFixture({ score: 9.7 })] });
    const res = ctx.calculateSemesterResults([capstone, pol1]); // (9.9 + 9.7)/2 = 9.80
    assert.strictEqual(res.tbm, 9.80);
    assert.strictEqual(res.honor.title, 'Sinh viên Xuất Sắc');
    assert.strictEqual(res.honor.isCocVang, false);
    assert.strictEqual(res.honor.isTop100, false);
    assert.strictEqual(res.honor.highlightBadge, undefined);
});

check('5.2.3: Semester 9 with SE_GRA_ELE placeholder alias triggers Capstone semester rules', () => {
    const capstone = createSubjectFixture({ code: 'SE_GRA_ELE', components: [createComponentFixture({ score: 10.0 })] });
    const pol1 = createSubjectFixture({ code: 'HCM202', components: [createComponentFixture({ score: 10.0 })] });
    const res = ctx.calculateSemesterResults([capstone, pol1]);
    assert.strictEqual(res.tbm, 10.00);
    assert.strictEqual(res.honor.title, 'Sinh viên Xuất Sắc');
    assert.strictEqual(res.honor.isCocVang, false);
    assert.strictEqual(res.honor.isTop100, false);
});

check('5.2.4: Semester 9 Capstone failure (defense < 4.0) blocks graduation honors entirely', () => {
    const capstoneFail = createSubjectFixture({
        code: 'SEP490',
        components: [
            createComponentFixture({ name: 'Progress', weight: 50, score: 9.0, minScore: 0, isFE: false }),
            createComponentFixture({ name: 'Defense', weight: 50, score: 3.5, minScore: 4.0, isFE: true })
        ]
    });
    const pol1 = createSubjectFixture({ code: 'HCM202', components: [createComponentFixture({ score: 10.0 })] });
    const res = ctx.calculateSemesterResults([capstoneFail, pol1], 9);
    assert.strictEqual(res.hasFailedScored, true);
    assert.strictEqual(res.isPassed, false);
    assert.strictEqual(res.honor.title, 'Chưa đạt (Not Pass)');
    assert.strictEqual(res.honor.isCocVang, false);
    assert.strictEqual(res.honor.isTop100, false);
});

// 5.3 Contrast Control: Standard Semesters (1-5, 7) MUST award Cóc Vàng / Top 100
check('5.3.1: Contrast Control: Semester 3 with 9.80 TBM awards Cóc Vàng + Top 100 (unsuppressed)', () => {
    const s1 = createSubjectFixture({ code: 'CSD201', components: [createComponentFixture({ score: 9.8 })] });
    const s2 = createSubjectFixture({ code: 'MAS291', components: [createComponentFixture({ score: 9.8 })] });
    const res = ctx.calculateSemesterResults([s1, s2], 3);
    assert.strictEqual(res.tbm, 9.80);
    assert.strictEqual(res.honor.title, 'Sinh viên Xuất Sắc');
    assert.strictEqual(res.honor.level, 'cocvang');
    assert.strictEqual(res.honor.isCocVang, true);
    assert.strictEqual(res.honor.isTop100, true);
    assert.ok(res.honor.highlightBadge && res.honor.highlightBadge.includes('CÓC VÀNG'));
});

check('5.3.2: Contrast Control: Semester 3 with 9.30 TBM awards Top 100 (unsuppressed)', () => {
    const s1 = createSubjectFixture({ code: 'CSD201', components: [createComponentFixture({ score: 9.3 })] });
    const s2 = createSubjectFixture({ code: 'MAS291', components: [createComponentFixture({ score: 9.3 })] });
    const res = ctx.calculateSemesterResults([s1, s2], 3);
    assert.strictEqual(res.tbm, 9.30);
    assert.strictEqual(res.honor.title, 'Sinh viên Xuất Sắc');
    assert.strictEqual(res.honor.level, 'top100');
    assert.strictEqual(res.honor.isCocVang, false);
    assert.strictEqual(res.honor.isTop100, true);
    assert.ok(res.honor.highlightBadge && res.honor.highlightBadge.includes('Top 100'));
});

// -----------------------------------------------------------------------------
// TEST SUITE 6: Export Sandbox & DOM Integrity (F13)
// -----------------------------------------------------------------------------
console.log('\n--- TEST SUITE 6: Export Sandbox & DOM Integrity ---');

    await checkAsync('6.1: captureCertificateCardSandbox cleans up sandbox div from DOM in finally block (W3C DOM compliant)', async () => {
        // Ensure mock document.body conforms to W3C Node.appendChild specification by setting parentNode
        const origAppend = ctx.document.body.appendChild;
        ctx.document.body.appendChild = function(child) {
            child.parentNode = this;
            return origAppend.call(this, child);
        };

        const mockCard = ctx.document.createElement('div');
        mockCard.innerHTML = '<h1>Certificate Test</h1>';
        
        // Capture
        await ctx.captureCertificateCardSandbox(mockCard);
        
        // Check if sandbox is removed from body children
        const sandboxInBody = ctx.document.body.children.find(c => c && c.id === 'certificate-export-sandbox');
        assert.strictEqual(sandboxInBody, undefined, 'Sandbox element must be removed from document.body');
        assert.strictEqual(ctx.document.body.children.length, 0, 'No DOM leak in document.body');

        // Restore
        ctx.document.body.appendChild = origAppend;
    });

    await checkAsync('6.2: captureCertificateCardSandbox gracefully completes without exception when parentNode is missing', async () => {
        const mockCard = ctx.document.createElement('div');
        mockCard.innerHTML = '<h1>Certificate Fallback Test</h1>';
        
        // In incomplete mock DOM where parentNode is null/undefined, finally block must not throw
        await assert.doesNotReject(async () => {
            await ctx.captureCertificateCardSandbox(mockCard);
        });
    });


    check('6.3: renderExportCard executes cleanly across all special semesters (0, 6, 8, 9)', () => {
        const container = ctx.document.createElement('div');
        [0, 6, 8, 9].forEach(sem => {
            assert.doesNotThrow(() => {
                ctx.renderExportCard(container, sem);
            }, `renderExportCard must not throw for Semester ${sem}`);
            assert.ok(container.innerHTML.length > 50, `Rendered content for Semester ${sem} must not be empty`);
        });
    });

    // -----------------------------------------------------------------------------
    // SUMMARY & VERDICT
    // -----------------------------------------------------------------------------
    console.log('\n========================================================================');
    console.log(' EMPIRICAL ADVERSARIAL STRESS TEST SUMMARY');
    console.log('========================================================================');
    console.log(`Total Assertions Evaluated: ${totalAssertions}`);
    console.log(`Passed:                    ${passedAssertions}`);
    console.log(`Failed:                    ${failedAssertions}`);
    console.log('========================================================================');

    if (failedAssertions > 0) {
        console.error(`\n❌ VERDICT: REJECT (${failedAssertions} failure(s) detected)`);
        failureLog.forEach((f, idx) => {
            console.error(`\n[${idx + 1}] ${f.desc}`);
            console.error(f.error);
        });
        process.exit(1);
    } else {
        console.log('\n✅ VERDICT: APPROVE (100% empirical pass rate across all challenge vectors)');
        process.exit(0);
    }
}

main().catch(err => {
    console.error('Fatal stress test runner error:', err);
    process.exit(1);
});

