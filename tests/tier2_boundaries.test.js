/**
 * Tier 2: Boundary & Corner Cases Test Suite
 * Covers 8 specific boundary conditions with >= 5 test cases per boundary.
 */

const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const {
    loadAppSandbox,
    createSubjectFixture,
    createComponentFixture
} = require('./test_helper.js');

describe('Tier 2: Boundary & Corner Cases', () => {
    const ctx = loadAppSandbox();

    // =========================================================================
    // Boundary 1: Rounding 8.44 vs 8.45
    // =========================================================================
    describe('Boundary 1: Subject score rounding 8.44 vs 8.45', () => {
        it('B1-1: Exact 8.44 rounds down to 8.4', () => {
            const sub = createSubjectFixture({
                components: [createComponentFixture({ weight: 100, score: 8.44 })]
            });
            const res = ctx.calculateSubjectScore(sub);
            assert.strictEqual(res.finalScore, 8.4);
            assert.strictEqual(res.roundedScore, '8.4');
        });

        it('B1-2: 8.449 rounds down to 8.4', () => {
            const sub = createSubjectFixture({
                components: [createComponentFixture({ weight: 100, score: 8.449 })]
            });
            const res = ctx.calculateSubjectScore(sub);
            assert.strictEqual(res.finalScore, 8.4);
        });

        it('B1-3: Exact 8.45 rounds up to 8.5', () => {
            const sub = createSubjectFixture({
                components: [createComponentFixture({ weight: 100, score: 8.45 })]
            });
            const res = ctx.calculateSubjectScore(sub);
            assert.strictEqual(res.finalScore, 8.5);
            assert.strictEqual(res.roundedScore, '8.5');
        });

        it('B1-4: 8.451 rounds up to 8.5', () => {
            const sub = createSubjectFixture({
                components: [createComponentFixture({ weight: 100, score: 8.451 })]
            });
            const res = ctx.calculateSubjectScore(sub);
            assert.strictEqual(res.finalScore, 8.5);
        });

        it('B1-5: Recurring 8.4444... rounds down to 8.4', () => {
            const sub = createSubjectFixture({
                components: [createComponentFixture({ weight: 100, score: 8 + 4/9 })] // ~8.4444444
            });
            const res = ctx.calculateSubjectScore(sub);
            assert.strictEqual(res.finalScore, 8.4);
        });

        it('B1-6: Honor threshold rounding boundary 7.94 -> 7.9 vs 7.95 -> 8.0', () => {
            const subDown = createSubjectFixture({ components: [createComponentFixture({ weight: 100, score: 7.94 })] });
            const subUp = createSubjectFixture({ components: [createComponentFixture({ weight: 100, score: 7.95 })] });
            assert.strictEqual(ctx.calculateSubjectScore(subDown).finalScore, 7.9);
            assert.strictEqual(ctx.calculateSubjectScore(subUp).finalScore, 8.0);
        });
    });

    // =========================================================================
    // Boundary 2: Unweighted TBM 8.466 vs 8.47
    // =========================================================================
    describe('Boundary 2: Unweighted TBM arithmetic mean 8.466... vs 8.47', () => {
        it('B2-1: Three subjects [8.4, 8.5, 8.5] produces TBM 8.47 (unweighted mean 25.4/3)', () => {
            const s1 = createSubjectFixture({ code: 'S1', components: [createComponentFixture({ score: 8.4 })] });
            const s2 = createSubjectFixture({ code: 'S2', components: [createComponentFixture({ score: 8.5 })] });
            const s3 = createSubjectFixture({ code: 'S3', components: [createComponentFixture({ score: 8.5 })] });
            const res = ctx.calculateSemesterResults([s1, s2, s3]);
            // 25.4 / 3 = 8.466666... -> rounds to 8.47
            assert.strictEqual(res.tbm, 8.47);
            assert.strictEqual(res.tbmStr, '8.47');
        });

        it('B2-2: Three subjects [8.4, 8.5, 8.4] produces TBM 8.43 (unweighted mean 25.3/3)', () => {
            const s1 = createSubjectFixture({ code: 'S1', components: [createComponentFixture({ score: 8.4 })] });
            const s2 = createSubjectFixture({ code: 'S2', components: [createComponentFixture({ score: 8.5 })] });
            const s3 = createSubjectFixture({ code: 'S3', components: [createComponentFixture({ score: 8.4 })] });
            const res = ctx.calculateSemesterResults([s1, s2, s3]);
            // 25.3 / 3 = 8.433333... -> rounds to 8.43
            assert.strictEqual(res.tbm, 8.43);
            assert.strictEqual(res.tbmStr, '8.43');
        });

        it('B2-3: Multi-subject unweighted TBM average transition (4 subjects [8.4, 8.5, 8.5, 8.4] = 8.45 vs 3 subjects [8.4, 8.5, 8.5] = 8.47)', () => {
            const s4 = [8.4, 8.5, 8.5, 8.4].map((sc, i) => createSubjectFixture({
                code: `S${i}`,
                components: [createComponentFixture({ score: sc })]
            }));
            const s3 = [8.4, 8.5, 8.5].map((sc, i) => createSubjectFixture({
                code: `S${i}`,
                components: [createComponentFixture({ score: sc })]
            }));
            assert.strictEqual(ctx.calculateSemesterResults(s4).tbm, 8.45);
            assert.strictEqual(ctx.calculateSemesterResults(s3).tbm, 8.47);
        });

        it('B2-4: Six subjects [8.2, 8.3, 8.5, 8.8, 8.5, 8.5] produces TBM 8.47', () => {
            const scores = [8.2, 8.3, 8.5, 8.8, 8.5, 8.5]; // sum = 50.8 / 6 = 8.4666...
            const subs = scores.map((sc, i) => createSubjectFixture({
                code: `S${i}`,
                components: [createComponentFixture({ score: sc })]
            }));
            const res = ctx.calculateSemesterResults(subs);
            assert.strictEqual(res.tbm, 8.47);
        });

        it('B2-5: Unweighted property: 10-credit course and 2-credit course have equal 1:1 weight', () => {
            const sHighCred = createSubjectFixture({ code: 'C10', credits: 10, components: [createComponentFixture({ score: 8.0 })] });
            const sLowCred = createSubjectFixture({ code: 'C2', credits: 2, components: [createComponentFixture({ score: 9.0 })] });
            const res = ctx.calculateSemesterResults([sHighCred, sLowCred]);
            // (8.0 + 9.0) / 2 = 8.50
            assert.strictEqual(res.tbm, 8.50, 'Must be unweighted arithmetic mean (8.50), not credit-weighted (8.17)');
        });
    });

    // =========================================================================
    // Boundary 3: Component hurdle FE = 3.9 vs 4.0
    // =========================================================================
    describe('Boundary 3: Component hurdle FE = 3.9 (fail) vs 4.0 (pass)', () => {
        it('B3-1: FE = 3.9 with perfect 10.0 process fails due to FE hurdle', () => {
            const sub = createSubjectFixture({
                components: [
                    createComponentFixture({ name: 'PT', weight: 60, score: 10.0, minScore: 0, isFE: false }),
                    createComponentFixture({ name: 'FE', weight: 40, score: 3.9, minScore: 4.0, isFE: true })
                ]
            });
            // Total weighted = 6.0 + 1.56 = 7.56 -> 7.6 (High score, but failed hurdle!)
            const res = ctx.calculateSubjectScore(sub);
            assert.strictEqual(res.isPass, false);
            assert.strictEqual(res.statusText, 'NOT PASS');
            assert.ok(res.failReason.includes('FE < 4') || res.failReason.includes('Liệt'));
        });

        it('B3-2: FE = 3.99 fails hurdle', () => {
            const sub = createSubjectFixture({
                components: [
                    createComponentFixture({ name: 'PT', weight: 50, score: 10.0, minScore: 0, isFE: false }),
                    createComponentFixture({ name: 'FE', weight: 50, score: 3.99, minScore: 4.0, isFE: true })
                ]
            });
            const res = ctx.calculateSubjectScore(sub);
            assert.strictEqual(res.isPass, false);
        });

        it('B3-3: FE = 4.0 with passing total passes', () => {
            const sub = createSubjectFixture({
                components: [
                    createComponentFixture({ name: 'PT', weight: 50, score: 6.0, minScore: 0, isFE: false }),
                    createComponentFixture({ name: 'FE', weight: 50, score: 4.0, minScore: 4.0, isFE: true })
                ]
            });
            // 3.0 + 2.0 = 5.0 -> exactly meets FE hurdle and total hurdle
            const res = ctx.calculateSubjectScore(sub);
            assert.strictEqual(res.isPass, true);
            assert.strictEqual(res.finalScore, 5.0);
        });

        it('B3-4: FE = 4.0 with low process fails on total < 5.0, not FE hurdle', () => {
            const sub = createSubjectFixture({
                components: [
                    createComponentFixture({ name: 'PT', weight: 50, score: 2.0, minScore: 0, isFE: false }),
                    createComponentFixture({ name: 'FE', weight: 50, score: 4.0, minScore: 4.0, isFE: true })
                ]
            });
            // Total = 1.0 + 2.0 = 3.0 < 5.0
            const res = ctx.calculateSubjectScore(sub);
            assert.strictEqual(res.isPass, false);
            assert.ok(res.failReason.includes('5.0') || res.failReason.includes('tổng kết'));
        });

        it('B3-5: Multi-part subValues where FE is 3.9 triggers exact failure message', () => {
            const comp = ctx.calculateComponentScore({
                mode: 'average',
                parts: 1,
                minScore: 4.0,
                isFE: true,
                avgValue: '3.9',
                subValues: ['3.9']
            });
            assert.strictEqual(comp.isFailed, true);
            assert.ok(comp.message.includes('4'));
        });
    });

    // =========================================================================
    // Boundary 4: Vovinam FE 4.9 vs 5.0
    // =========================================================================
    describe('Boundary 4: Vovinam FE 4.9 (fail) vs 5.0 (pass)', () => {
        it('B4-1: Vovinam FE = 4.9 fails (minScore is 5.0)', () => {
            const sub = createSubjectFixture({
                code: 'VOV114',
                components: [createComponentFixture({ name: 'FE Vovinam', weight: 100, score: 4.9, minScore: 5.0, isFE: true })]
            });
            const res = ctx.calculateSubjectScore(sub);
            assert.strictEqual(res.isPass, false);
            assert.ok(res.failReason.includes('5'));
        });

        it('B4-2: Vovinam FE = 4.99 fails', () => {
            const sub = createSubjectFixture({
                code: 'VOV124',
                components: [createComponentFixture({ name: 'FE Vovinam', weight: 100, score: 4.99, minScore: 5.0, isFE: true })]
            });
            const res = ctx.calculateSubjectScore(sub);
            assert.strictEqual(res.isPass, false);
        });

        it('B4-3: Vovinam FE = 5.0 passes', () => {
            const sub = createSubjectFixture({
                code: 'VOV114',
                components: [createComponentFixture({ name: 'FE Vovinam', weight: 100, score: 5.0, minScore: 5.0, isFE: true })]
            });
            const res = ctx.calculateSubjectScore(sub);
            assert.strictEqual(res.isPass, true);
        });

        it('B4-4: Vovinam FE = 5.1 passes', () => {
            const sub = createSubjectFixture({
                code: 'VOV134',
                components: [createComponentFixture({ name: 'FE Vovinam', weight: 100, score: 5.1, minScore: 5.0, isFE: true })]
            });
            const res = ctx.calculateSubjectScore(sub);
            assert.strictEqual(res.isPass, true);
        });

        it('B4-5: Standard course with FE = 4.5 passes, while Vovinam with FE = 4.5 fails', () => {
            const stdSub = createSubjectFixture({
                code: 'MAE101',
                components: [
                    createComponentFixture({ name: 'PT', weight: 50, score: 8.0, minScore: 0, isFE: false }),
                    createComponentFixture({ name: 'FE', weight: 50, score: 4.5, minScore: 4.0, isFE: true })
                ]
            });
            const vovSub = createSubjectFixture({
                code: 'VOV114',
                components: [createComponentFixture({ name: 'FE', weight: 100, score: 4.5, minScore: 5.0, isFE: true })]
            });
            assert.strictEqual(ctx.calculateSubjectScore(stdSub).isPass, true, 'MAE101 FE=4.5 must pass');
            assert.strictEqual(ctx.calculateSubjectScore(vovSub).isPass, false, 'VOV114 FE=4.5 must fail');
        });
    });

    // =========================================================================
    // Boundary 5: Process component hurdle 0 vs 0.1
    // =========================================================================
    describe('Boundary 5: Process component hurdle 0 (fail) vs 0.1 (pass)', () => {
        it('B5-1: Process component = 0.0 fails with hurdle violation', () => {
            const sub = createSubjectFixture({
                components: [
                    createComponentFixture({ name: 'PT', weight: 50, score: 0.0, minScore: 0, isFE: false }),
                    createComponentFixture({ name: 'FE', weight: 50, score: 10.0, minScore: 4.0, isFE: true })
                ]
            });
            const res = ctx.calculateSubjectScore(sub);
            assert.strictEqual(res.isPass, false);
            assert.ok(res.failReason.includes('PT') && res.failReason.includes('0'));
        });

        it('B5-2: Multi-part process component with all 0s fails', () => {
            const sub = createSubjectFixture({
                components: [
                    createComponentFixture({ name: 'Lab', weight: 50, subScores: [0, 0, 0], minScore: 0, isFE: false }),
                    createComponentFixture({ name: 'FE', weight: 50, score: 8.0, minScore: 4.0, isFE: true })
                ]
            });
            const res = ctx.calculateSubjectScore(sub);
            assert.strictEqual(res.isPass, false);
        });

        it('B5-3: Process component = 0.05 passes hurdle (> 0)', () => {
            const sub = createSubjectFixture({
                components: [
                    createComponentFixture({ name: 'PT', weight: 50, score: 0.05, minScore: 0, isFE: false }),
                    createComponentFixture({ name: 'FE', weight: 50, score: 10.0, minScore: 4.0, isFE: true })
                ]
            });
            const res = ctx.calculateSubjectScore(sub);
            assert.strictEqual(res.isPass, true);
        });

        it('B5-4: Process component = 0.10 passes hurdle (> 0)', () => {
            const sub = createSubjectFixture({
                components: [
                    createComponentFixture({ name: 'PT', weight: 50, score: 0.1, minScore: 0, isFE: false }),
                    createComponentFixture({ name: 'FE', weight: 50, score: 10.0, minScore: 4.0, isFE: true })
                ]
            });
            const res = ctx.calculateSubjectScore(sub);
            assert.strictEqual(res.isPass, true);
        });

        it('B5-5: Multiple process components where one is 0 and another is 10 fails', () => {
            const sub = createSubjectFixture({
                components: [
                    createComponentFixture({ name: 'PT', weight: 30, score: 0.0, minScore: 0, isFE: false }),
                    createComponentFixture({ name: 'Assignment', weight: 30, score: 10.0, minScore: 0, isFE: false }),
                    createComponentFixture({ name: 'FE', weight: 40, score: 8.0, minScore: 4.0, isFE: true })
                ]
            });
            const res = ctx.calculateSubjectScore(sub);
            assert.strictEqual(res.isPass, false);
            assert.ok(res.failReason.includes('PT'));
        });
    });

    // =========================================================================
    // Boundary 6: Total score hurdle 4.9 vs 5.0
    // =========================================================================
    describe('Boundary 6: Total score hurdle 4.9 (fail) vs 5.0 (pass)', () => {
        it('B6-1: Subject weighted sum 4.94 rounds to 4.9 and fails', () => {
            const sub = createSubjectFixture({
                components: [
                    createComponentFixture({ weight: 50, score: 5.0, minScore: 0, isFE: false }),
                    createComponentFixture({ weight: 50, score: 4.88, minScore: 4.0, isFE: true })
                ]
            });
            // 2.5 + 2.44 = 4.94 -> rounds to 4.9
            const res = ctx.calculateSubjectScore(sub);
            assert.strictEqual(res.finalScore, 4.9);
            assert.strictEqual(res.isPass, false);
            assert.ok(res.failReason.includes('5.0') || res.failReason.includes('tổng kết'));
        });

        it('B6-2: Subject weighted sum 4.95 rounds to 5.0 and passes', () => {
            const sub = createSubjectFixture({
                components: [
                    createComponentFixture({ weight: 50, score: 5.0, minScore: 0, isFE: false }),
                    createComponentFixture({ weight: 50, score: 4.9, minScore: 4.0, isFE: true })
                ]
            });
            // 2.5 + 2.45 = 4.95 -> rounds to 5.0
            const res = ctx.calculateSubjectScore(sub);
            assert.strictEqual(res.finalScore, 5.0);
            assert.strictEqual(res.isPass, true);
        });

        it('B6-3: Exact 4.89 rounds to 4.9 and fails', () => {
            const sub = createSubjectFixture({
                components: [createComponentFixture({ weight: 100, score: 4.89, minScore: 4.0, isFE: true })]
            });
            const res = ctx.calculateSubjectScore(sub);
            assert.strictEqual(res.finalScore, 4.9);
            assert.strictEqual(res.isPass, false);
        });

        it('B6-4: Exact 5.00 passes', () => {
            const sub = createSubjectFixture({
                components: [createComponentFixture({ weight: 100, score: 5.00, minScore: 4.0, isFE: true })]
            });
            const res = ctx.calculateSubjectScore(sub);
            assert.strictEqual(res.finalScore, 5.0);
            assert.strictEqual(res.isPass, true);
        });

        it('B6-5: Semester TBM < 5.0 yields Chưa đạt vs TBM = 5.00 yields Đạt (Pass)', () => {
            const sFail1 = createSubjectFixture({ code: 'S1', minAvgToPass: 4.0, components: [createComponentFixture({ score: 4.8, minScore: 4.0 })] });
            const sFail2 = createSubjectFixture({ code: 'S2', minAvgToPass: 4.0, components: [createComponentFixture({ score: 4.8, minScore: 4.0 })] });
            const sPass = createSubjectFixture({ code: 'S3', minAvgToPass: 5.0, components: [createComponentFixture({ score: 5.00, minScore: 4.0 })] });
            const resFail = ctx.calculateSemesterResults([sFail1, sFail2]);
            const resPass = ctx.calculateSemesterResults([sPass]);
            assert.strictEqual(resFail.tbm, 4.80);
            assert.strictEqual(resFail.honor.title, 'Chưa đạt (TBM < 5.0)');
            assert.strictEqual(resPass.tbm, 5.00);
            assert.strictEqual(resPass.honor.title, 'Đạt (Pass)');
        });
    });

    // =========================================================================
    // Boundary 7: Zero scores across all components
    // =========================================================================
    describe('Boundary 7: Zero scores across all components', () => {
        it('B7-1: All components set to 0.0 results in finalScore 0.0 and NOT PASS', () => {
            const sub = createSubjectFixture({
                components: [
                    createComponentFixture({ name: 'PT', weight: 50, score: 0, minScore: 0, isFE: false }),
                    createComponentFixture({ name: 'FE', weight: 50, score: 0, minScore: 4.0, isFE: true })
                ]
            });
            const res = ctx.calculateSubjectScore(sub);
            assert.strictEqual(res.finalScore, 0.0);
            assert.strictEqual(res.roundedScore, '0.0');
            assert.strictEqual(res.isPass, false);
        });

        it('B7-2: Semester with all 0.0 scores yields TBM 0.00 without NaN', () => {
            const s1 = createSubjectFixture({ code: 'S1', components: [createComponentFixture({ score: 0.0 })] });
            const s2 = createSubjectFixture({ code: 'S2', components: [createComponentFixture({ score: 0.0 })] });
            const res = ctx.calculateSemesterResults([s1, s2]);
            assert.strictEqual(res.tbm, 0.00);
            assert.strictEqual(res.tbmStr, '0.00');
            assert.strictEqual(res.hasFailedScored, true);
            assert.strictEqual(res.honor.title, 'Chưa đạt (Not Pass)');
        });

        it('B7-3: String "0" is parsed as number 0, not treated as missing', () => {
            const comp = ctx.calculateComponentScore({
                mode: 'average',
                parts: 1,
                minScore: 0,
                isFE: false,
                avgValue: '0',
                subValues: ['0']
            });
            assert.strictEqual(comp.isFilled, true);
            assert.strictEqual(comp.isMissing, false);
            assert.strictEqual(comp.value, 0);
        });

        it('B7-4: Empty string is properly distinguished from 0 (empty is missing)', () => {
            const compEmpty = ctx.calculateComponentScore({
                mode: 'average',
                parts: 1,
                minScore: 0,
                isFE: false,
                avgValue: '',
                subValues: ['']
            });
            const compZero = ctx.calculateComponentScore({
                mode: 'average',
                parts: 1,
                minScore: 0,
                isFE: false,
                avgValue: '0',
                subValues: ['0']
            });
            assert.strictEqual(compEmpty.isMissing, true);
            assert.strictEqual(compZero.isMissing, false);
        });

        it('B7-5: Zero scores do not trigger uncaught exceptions in calculation engine', () => {
            assert.doesNotThrow(() => {
                const sub = createSubjectFixture({
                    components: [
                        createComponentFixture({ weight: 50, score: 0 }),
                        createComponentFixture({ weight: 50, score: 0, isFE: false })
                    ]
                });
                ctx.calculateSubjectScore(sub);
            });
        });
    });

    // =========================================================================
    // Boundary 8: Perfect 10.0 scores across all components
    // =========================================================================
    describe('Boundary 8: Perfect 10.0 scores across all components', () => {
        it('B8-1: Single subject all components = 10.0 yields finalScore 10.0 and PASS', () => {
            const sub = createSubjectFixture({
                components: [
                    createComponentFixture({ weight: 40, score: 10.0, isFE: false }),
                    createComponentFixture({ weight: 60, score: 10.0, isFE: true })
                ]
            });
            const res = ctx.calculateSubjectScore(sub);
            assert.strictEqual(res.finalScore, 10.0);
            assert.strictEqual(res.roundedScore, '10.0');
            assert.strictEqual(res.isPass, true);
        });

        it('B8-2: Semester all subjects = 10.0 yields TBM 10.00 and Xuất Sắc', () => {
            const s1 = createSubjectFixture({ code: 'S1', components: [createComponentFixture({ score: 10.0 })] });
            const s2 = createSubjectFixture({ code: 'S2', components: [createComponentFixture({ score: 10.0 })] });
            const res = ctx.calculateSemesterResults([s1, s2]);
            assert.strictEqual(res.tbm, 10.00);
            assert.strictEqual(res.tbmStr, '10.00');
            assert.strictEqual(res.honor.title, 'Sinh viên Xuất Sắc');
        });

        it('B8-3: String representations "10", "10.0", "10.00" all evaluate to 10.0', () => {
            ['10', '10.0', '10.00'].forEach(strVal => {
                const comp = ctx.calculateComponentScore({
                    mode: 'average',
                    parts: 1,
                    minScore: 4.0,
                    isFE: true,
                    avgValue: strVal,
                    subValues: [strVal]
                });
                assert.strictEqual(comp.value, 10.0);
                assert.strictEqual(comp.isFailed, false);
            });
        });

        it('B8-4: Perfect scores trigger top honors level in standard semester', () => {
            const subs = [1, 2, 3, 4, 5].map(i => createSubjectFixture({
                code: `SUB${i}`,
                components: [createComponentFixture({ score: 10.0 })]
            }));
            const res = ctx.calculateSemesterResults(subs);
            assert.strictEqual(res.honor.level, 'cocvang');
            assert.strictEqual(res.honor.isCocVang, true);
            assert.strictEqual(res.honor.isTop100, true);
        });

        it('B8-5: Floating point precision remains exact without drift (10.00)', () => {
            const s1 = createSubjectFixture({ code: 'S1', components: [createComponentFixture({ score: 10.0 })] });
            const s2 = createSubjectFixture({ code: 'S2', components: [createComponentFixture({ score: 10.0 })] });
            const s3 = createSubjectFixture({ code: 'S3', components: [createComponentFixture({ score: 10.0 })] });
            const res = ctx.calculateSemesterResults([s1, s2, s3]);
            assert.strictEqual(res.tbm, 10.00);
            assert.strictEqual(res.tbmStr, '10.00');
        });
    });
});
