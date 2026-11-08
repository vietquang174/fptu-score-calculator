/**
 * Modular Test Suite: Core Grading Logic
 * Covers calculateComponentScore, calculateSubjectScore, and calculateSemesterResults
 */

const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const {
    loadAppSandbox,
    createSubjectFixture,
    createComponentFixture
} = require('./test_helper.js');

describe('Core Grading Logic & Evaluation Engine (test_grading.js)', () => {
    const ctx = loadAppSandbox();

    describe('Component Level Calculations (calculateComponentScore)', () => {
        it('calculates average mode correctly from avgValue', () => {
            const comp = {
                mode: 'average',
                parts: 3,
                minScore: 0,
                isFE: false,
                avgValue: '7.5',
                subValues: ['7.5']
            };
            const res = ctx.calculateComponentScore(comp);
            assert.strictEqual(res.value, 7.5);
            assert.strictEqual(res.isFilled, true);
            assert.strictEqual(res.isFailed, false);
        });

        it('calculates detailed mode correctly from subValues array', () => {
            const comp = {
                mode: 'detailed',
                parts: 3,
                minScore: 0,
                isFE: false,
                subValues: ['8.0', '9.0', '10.0']
            };
            const res = ctx.calculateComponentScore(comp);
            assert.strictEqual(res.value, 9.0);
            assert.strictEqual(res.isFilled, true);
            assert.strictEqual(res.isMissing, false);
            assert.strictEqual(res.isFailed, false);
        });

        it('detects missing subValues and identifies missing parts indices', () => {
            const comp = {
                mode: 'detailed',
                parts: 4,
                minScore: 0,
                isFE: false,
                subValues: ['8.0', '', '9.0', '']
            };
            const res = ctx.calculateComponentScore(comp);
            assert.strictEqual(res.isFilled, false);
            assert.strictEqual(res.isMissing, true);
            assert.strictEqual(JSON.stringify(res.missingParts), JSON.stringify([2, 4]));
            assert.ok(res.message.includes('Thiếu 2/4'));
        });
    });

    describe('Subject Final Score & Rounding (calculateSubjectScore)', () => {
        it('calculates weighted sum accurately across diverse weights', () => {
            const sub = createSubjectFixture({
                components: [
                    createComponentFixture({ name: 'PT', weight: 15, score: 8.0, isFE: false }),
                    createComponentFixture({ name: 'Lab', weight: 15, score: 9.0, isFE: false }),
                    createComponentFixture({ name: 'Assignment', weight: 30, score: 8.5, isFE: false }),
                    createComponentFixture({ name: 'FE', weight: 40, score: 7.5, minScore: 4.0, isFE: true })
                ]
            });
            // 8.0*0.15 + 9.0*0.15 + 8.5*0.30 + 7.5*0.40 = 1.2 + 1.35 + 2.55 + 3.0 = 8.1
            const res = ctx.calculateSubjectScore(sub);
            assert.strictEqual(res.finalScore, 8.1);
            assert.strictEqual(res.isPass, true);
        });

        it('handles Pass/Fail condition courses (isPassFailOnly: true)', () => {
            const passCourse = createSubjectFixture({ isPassFailOnly: true, passStatus: 'pass' });
            const failCourse = createSubjectFixture({ isPassFailOnly: true, passStatus: 'fail' });

            const passRes = ctx.calculateSubjectScore(passCourse);
            const failRes = ctx.calculateSubjectScore(failCourse);

            assert.strictEqual(passRes.isPass, true);
            assert.strictEqual(passRes.roundedScore, 'PASS');
            assert.strictEqual(failRes.isPass, false);
            assert.strictEqual(failRes.roundedScore, 'NOT PASS');
        });
    });

    describe('Semester Level Results & Honors (calculateSemesterResults)', () => {
        it('excludes non-scored courses from TBM computation', () => {
            const scored1 = createSubjectFixture({ code: 'S1', components: [createComponentFixture({ score: 8.0 })] });
            const scored2 = createSubjectFixture({ code: 'S2', components: [createComponentFixture({ score: 9.0 })] });
            const nonScored = createSubjectFixture({ code: 'VOV114', isScored: false, isPassFailOnly: true, passStatus: 'pass' });

            const res = ctx.calculateSemesterResults([scored1, scored2, nonScored]);
            assert.strictEqual(res.tbm, 8.50);
            assert.strictEqual(res.completedScoredCount, 2);
            assert.strictEqual(res.totalScoredCount, 2);
        });

        it('awards honors strictly according to TBM scale thresholds', () => {
            const makeSingle = (sc) => [createSubjectFixture({ components: [createComponentFixture({ score: sc })] })];

            assert.strictEqual(ctx.calculateSemesterResults(makeSingle(4.5)).honor.level, 'fail');
            assert.strictEqual(ctx.calculateSemesterResults(makeSingle(6.0)).honor.level, 'pass');
            assert.strictEqual(ctx.calculateSemesterResults(makeSingle(7.5)).honor.level, 'kha');
            assert.strictEqual(ctx.calculateSemesterResults(makeSingle(8.5)).honor.level, 'gioi');
            assert.strictEqual(ctx.calculateSemesterResults(makeSingle(9.1)).honor.level, 'xuatsac');
            assert.strictEqual(ctx.calculateSemesterResults(makeSingle(9.3)).honor.level, 'top100');
            assert.strictEqual(ctx.calculateSemesterResults(makeSingle(9.7)).honor.level, 'cocvang');
        });
    });
});
