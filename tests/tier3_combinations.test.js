/**
 * Tier 3: Cross-Feature Combinations & Pairwise Interactions Test Suite
 * Verifies multi-subsystem integrations and complex condition chains.
 */

const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const {
    loadAppSandbox,
    createSubjectFixture,
    createComponentFixture
} = require('./test_helper.js');

describe('Tier 3: Cross-Feature Combinations', () => {
    const ctx = loadAppSandbox();

    // =========================================================================
    // Interaction 1: Combo Track + Condition Course Failing + Honors
    // =========================================================================
    describe('Interaction 1: Combo Track Course Selection + Condition Course Failing + Honors', () => {
        it('T3-1-1: .NET track student with 9.8 in PRN212 fails LAB211 -> all honors blocked', () => {
            const netSub = createSubjectFixture({
                code: 'PRN212',
                nameVi: 'Lập trình .NET',
                components: [createComponentFixture({ score: 9.8 })]
            });
            const otherScored = createSubjectFixture({
                code: 'SWP391',
                components: [createComponentFixture({ score: 9.5 })]
            });
            const lab211 = createSubjectFixture({
                code: 'LAB211',
                isScored: false,
                isPassFailOnly: true,
                passStatus: 'fail'
            });

            const res = ctx.calculateSemesterResults([netSub, otherScored, lab211]);
            assert.strictEqual(res.hasFailedNonScored, true);
            assert.strictEqual(res.honor.title, 'Chưa đạt (Not Pass)');
            assert.strictEqual(res.honor.isCocVang, false);
            assert.strictEqual(res.honor.isTop100, false);
            assert.ok(res.failedSubjectCodes.includes('LAB211'));
        });

        it('T3-1-2: React track student with 9.5 in FER202 passes condition courses -> Xuất Sắc awarded', () => {
            const reactSub = createSubjectFixture({
                code: 'FER202',
                components: [createComponentFixture({ score: 9.5 })]
            });
            const swp = createSubjectFixture({
                code: 'SWP391',
                components: [createComponentFixture({ score: 9.3 })]
            });
            const condPass = createSubjectFixture({
                code: 'LAB211',
                isScored: false,
                isPassFailOnly: true,
                passStatus: 'pass'
            });

            const res = ctx.calculateSemesterResults([reactSub, swp, condPass]);
            assert.strictEqual(res.hasFailedNonScored, false);
            assert.strictEqual(res.tbm, 9.40);
            assert.strictEqual(res.honor.title, 'Sinh viên Xuất Sắc');
        });

        it('T3-1-3: AI track student with 9.8 in PRP201c fails VOV114 -> all honors blocked', () => {
            const aiSub = createSubjectFixture({
                code: 'PRP201c',
                components: [createComponentFixture({ score: 9.8 })]
            });
            const vovFail = createSubjectFixture({
                code: 'VOV114',
                isScored: false,
                isPassFailOnly: true,
                passStatus: 'fail'
            });

            const res = ctx.calculateSemesterResults([aiSub, vovFail]);
            assert.strictEqual(res.honor.title, 'Chưa đạt (Not Pass)');
            assert.strictEqual(res.honor.isCocVang, false);
        });

        it('T3-1-4: Java track student with 8.4 in HSF302 and condition pass -> Giỏi awarded', () => {
            const javaSub = createSubjectFixture({
                code: 'HSF302',
                components: [createComponentFixture({ score: 8.4 })]
            });
            const other = createSubjectFixture({
                code: 'SWT301',
                components: [createComponentFixture({ score: 8.6 })]
            });
            const condPass = createSubjectFixture({
                code: 'LAB211',
                isScored: false,
                isPassFailOnly: true,
                passStatus: 'pass'
            });

            const res = ctx.calculateSemesterResults([javaSub, other, condPass]);
            assert.strictEqual(res.tbm, 8.50);
            assert.strictEqual(res.honor.title, 'Sinh viên Giỏi');
        });

        it('T3-1-5: Japanese Bridge Engineer track with 7.5 and condition pass -> Khá awarded', () => {
            const jsSub = createSubjectFixture({
                code: 'JPD133',
                components: [createComponentFixture({ score: 7.5 })]
            });
            const condPass = createSubjectFixture({
                code: 'LAB211',
                isScored: false,
                isPassFailOnly: true,
                passStatus: 'pass'
            });

            const res = ctx.calculateSemesterResults([jsSub, condPass]);
            assert.strictEqual(res.tbm, 7.50);
            assert.strictEqual(res.honor.title, 'Sinh viên Khá');
        });
    });

    // =========================================================================
    // Interaction 2: Semester 6 OJT + ENW493c + Honors
    // =========================================================================
    describe('Interaction 2: Semester 6 OJT + ENW493c Scored Course + Honors', () => {
        it('T3-2-1: OJT202 = Pass, ENW493c = 9.8 -> TBM = 9.80, Xuất Sắc awarded', () => {
            const ojt = createSubjectFixture({ code: 'OJT202', isScored: false, isPassFailOnly: true, passStatus: 'pass' });
            const enw = createSubjectFixture({ code: 'ENW493c', isScored: true, components: [createComponentFixture({ score: 9.8 })] });
            const res = ctx.calculateSemesterResults([ojt, enw]);
            assert.strictEqual(res.tbm, 9.80);
            assert.strictEqual(res.honor.title, 'Sinh viên Xuất Sắc');
        });

        it('T3-2-2: OJT202 = Pass, ENW493c = 8.5 -> TBM = 8.50, Giỏi awarded', () => {
            const ojt = createSubjectFixture({ code: 'OJT202', isScored: false, isPassFailOnly: true, passStatus: 'pass' });
            const enw = createSubjectFixture({ code: 'ENW493c', isScored: true, components: [createComponentFixture({ score: 8.5 })] });
            const res = ctx.calculateSemesterResults([ojt, enw]);
            assert.strictEqual(res.tbm, 8.50);
            assert.strictEqual(res.honor.title, 'Sinh viên Giỏi');
        });

        it('T3-2-3: OJT202 = Not Pass, ENW493c = 10.0 -> Chưa Đạt, all honors blocked', () => {
            const ojt = createSubjectFixture({ code: 'OJT202', isScored: false, isPassFailOnly: true, passStatus: 'fail' });
            const enw = createSubjectFixture({ code: 'ENW493c', isScored: true, components: [createComponentFixture({ score: 10.0 })] });
            const res = ctx.calculateSemesterResults([ojt, enw]);
            assert.strictEqual(res.hasFailedNonScored, true);
            assert.strictEqual(res.honor.title, 'Chưa đạt (Not Pass)');
            assert.strictEqual(res.honor.isCocVang, false);
            assert.strictEqual(res.honor.isTop100, false);
        });

        it('T3-2-4: OJT202 = Pass, ENW493c = 6.2 -> TBM = 6.20, Đạt (Pass) awarded', () => {
            const ojt = createSubjectFixture({ code: 'OJT202', isScored: false, isPassFailOnly: true, passStatus: 'pass' });
            const enw = createSubjectFixture({ code: 'ENW493c', isScored: true, components: [createComponentFixture({ score: 6.2 })] });
            const res = ctx.calculateSemesterResults([ojt, enw]);
            assert.strictEqual(res.tbm, 6.20);
            assert.strictEqual(res.honor.title, 'Đạt (Pass)');
        });

        it('T3-2-5: OJT202 = Pass, ENW493c Incomplete -> TBM = "-", honors pending', () => {
            const ojt = createSubjectFixture({ code: 'OJT202', isScored: false, isPassFailOnly: true, passStatus: 'pass' });
            const enw = createSubjectFixture({
                code: 'ENW493c',
                isScored: true,
                components: [
                    { mode: 'average', parts: 1, minScore: 4.0, isFE: true, avgValue: '', subValues: [''] }
                ]
            });
            const res = ctx.calculateSemesterResults([ojt, enw]);
            assert.strictEqual(res.isAllScoredComplete, false);
            assert.strictEqual(res.tbmStr, '-');
            assert.strictEqual(res.honor.title, 'Chưa đủ dữ liệu');
        });
    });

    // =========================================================================
    // Interaction 3: Semester 8-9 Capstone + Political Subjects + Honors
    // =========================================================================
    describe('Interaction 3: Semester 8-9 Capstone + Political Subjects + Honors', () => {
        it('T3-3-1: Semester 9 all subjects passed with 9.6 yields TBM 9.60 and Xuất Sắc', () => {
            const sep = createSubjectFixture({ code: 'SEP490', components: [createComponentFixture({ score: 9.6 })] });
            const hcm = createSubjectFixture({ code: 'HCM202', components: [createComponentFixture({ score: 9.6 })] });
            const mln = createSubjectFixture({ code: 'MLN131', components: [createComponentFixture({ score: 9.6 })] });
            const vnr = createSubjectFixture({ code: 'VNR202', components: [createComponentFixture({ score: 9.6 })] });
            const res = ctx.calculateSemesterResults([sep, hcm, mln, vnr]);
            assert.strictEqual(res.tbm, 9.60);
            assert.strictEqual(res.honor.title, 'Sinh viên Xuất Sắc');
        });

        it('T3-3-2: Capstone defense failed (score < 4.0) blocks graduation honors', () => {
            const sepFail = createSubjectFixture({
                code: 'SEP490',
                components: [
                    createComponentFixture({ name: 'On-going', weight: 50, score: 9.0, minScore: 0, isFE: false }),
                    createComponentFixture({ name: 'Final Defense', weight: 50, score: 3.5, minScore: 4.0, isFE: true })
                ]
            });
            const hcm = createSubjectFixture({ code: 'HCM202', components: [createComponentFixture({ score: 9.5 })] });
            const res = ctx.calculateSemesterResults([sepFail, hcm]);
            assert.strictEqual(res.hasFailedScored, true);
            assert.strictEqual(res.honor.title, 'Chưa đạt (Not Pass)');
        });

        it('T3-3-3: Political subject failure in Semester 8 blocks honors', () => {
            const prm = createSubjectFixture({ code: 'PRM393', components: [createComponentFixture({ score: 9.0 })] });
            const mlnFail = createSubjectFixture({
                code: 'MLN111',
                components: [
                    createComponentFixture({ name: 'PT', weight: 50, score: 8.0, minScore: 0, isFE: false }),
                    createComponentFixture({ name: 'FE', weight: 50, score: 3.0, minScore: 4.0, isFE: true })
                ]
            });
            const res = ctx.calculateSemesterResults([prm, mlnFail]);
            assert.strictEqual(res.hasFailedScored, true);
            assert.strictEqual(res.honor.title, 'Chưa đạt (Not Pass)');
        });

        it('T3-3-4: Semester 8 with unweighted subjects [8.0, 9.0, 8.5, 8.5] yields exact 8.50 Giỏi', () => {
            const s1 = createSubjectFixture({ code: 'PRM393', components: [createComponentFixture({ score: 8.0 })] });
            const s2 = createSubjectFixture({ code: 'ITE302c', components: [createComponentFixture({ score: 9.0 })] });
            const s3 = createSubjectFixture({ code: 'EXE201', components: [createComponentFixture({ score: 8.5 })] });
            const s4 = createSubjectFixture({ code: 'MLN111', components: [createComponentFixture({ score: 8.5 })] });
            const res = ctx.calculateSemesterResults([s1, s2, s3, s4]);
            assert.strictEqual(res.tbm, 8.50);
            assert.strictEqual(res.honor.title, 'Sinh viên Giỏi');
        });

        it('T3-3-5: Multiple failures in Capstone semester accurately catalog all failed course codes', () => {
            const sepFail = createSubjectFixture({
                code: 'SEP490',
                components: [createComponentFixture({ score: 3.0, minScore: 4.0, isFE: true })]
            });
            const vnrFail = createSubjectFixture({
                code: 'VNR202',
                components: [createComponentFixture({ score: 2.0, minScore: 4.0, isFE: true })]
            });
            const res = ctx.calculateSemesterResults([sepFail, vnrFail]);
            assert.ok(res.failedSubjectCodes.includes('SEP490'));
            assert.ok(res.failedSubjectCodes.includes('VNR202'));
        });
    });

    // =========================================================================
    // Interaction 4: Process Hurdle + Rounding Transitions
    // =========================================================================
    describe('Interaction 4: Process Hurdle + Rounding Transitions', () => {
        it('T3-4-1: Subject with process = 0.1, FE = 4.0, weighted sum = 4.95 rounds to 5.0 and passes', () => {
            // Process weight 1%: 0.1 * 0.01 = 0.001
            // FE weight 99%: 4.999 * 0.99 ~ 4.949
            // Total = 4.95 -> rounds to 5.0
            const sub = createSubjectFixture({
                components: [
                    createComponentFixture({ name: 'PT', weight: 50, score: 5.0, minScore: 0, isFE: false }),
                    createComponentFixture({ name: 'FE', weight: 50, score: 4.9, minScore: 4.0, isFE: true })
                ]
            });
            const res = ctx.calculateSubjectScore(sub);
            assert.strictEqual(res.finalScore, 5.0);
            assert.strictEqual(res.isPass, true);
        });

        it('T3-4-2: Process = 0 with FE = 10.0 fails due to hurdle despite weighted sum = 8.0', () => {
            const sub = createSubjectFixture({
                components: [
                    createComponentFixture({ name: 'PT', weight: 20, score: 0.0, minScore: 0, isFE: false }),
                    createComponentFixture({ name: 'FE', weight: 80, score: 10.0, minScore: 4.0, isFE: true })
                ]
            });
            const res = ctx.calculateSubjectScore(sub);
            // 0 + 8.0 = 8.0, but process is 0!
            assert.strictEqual(res.isPass, false);
            assert.ok(res.failReason.includes('PT') || res.failReason.includes('0'));
        });

        it('T3-4-3: Multi-subpart process where average = 0.1 and FE = 4.0 passes', () => {
            const sub = createSubjectFixture({
                components: [
                    createComponentFixture({ name: 'Labs', weight: 50, subScores: [0.1, 0.1], minScore: 0, isFE: false }),
                    createComponentFixture({ name: 'FE', weight: 50, score: 10.0, minScore: 4.0, isFE: true })
                ]
            });
            const res = ctx.calculateSubjectScore(sub);
            assert.strictEqual(res.isPass, true);
        });
    });

    // =========================================================================
    // Interaction 5: Incomplete Input + State Persistence
    // =========================================================================
    describe('Interaction 5: Incomplete Input + State Handling', () => {
        it('T3-5-1: Partially filled semester computes TBM from completed courses and flags missing', () => {
            const sComplete = createSubjectFixture({ code: 'PRF192', components: [createComponentFixture({ score: 8.0 })] });
            const sIncomplete = createSubjectFixture({
                code: 'MAE101',
                components: [{ mode: 'average', parts: 1, minScore: 4.0, isFE: true, avgValue: '', subValues: [''] }]
            });
            const res = ctx.calculateSemesterResults([sComplete, sIncomplete]);
            assert.strictEqual(res.completedScoredCount, 1);
            assert.strictEqual(res.totalScoredCount, 2);
            assert.ok(res.incompleteSubjectCodes.includes('MAE101'));
        });

        it('T3-5-2: Fully completed semester flags isAllScoredComplete as true', () => {
            const s1 = createSubjectFixture({ code: 'PRF192', components: [createComponentFixture({ score: 8.0 })] });
            const s2 = createSubjectFixture({ code: 'MAE101', components: [createComponentFixture({ score: 8.0 })] });
            const res = ctx.calculateSemesterResults([s1, s2]);
            assert.strictEqual(res.isAllScoredComplete, true);
            assert.strictEqual(res.incompleteSubjectCodes.length, 0);
        });

        it('T3-5-3: Switching AppState currentSemester preserves independent semester datasets', () => {
            ctx.initializeAppState();
            ctx.AppState.currentSemester = 1;
            const sem1Subjects = ctx.AppState.semesterData[1];
            ctx.AppState.currentSemester = 2;
            const sem2Subjects = ctx.AppState.semesterData[2];
            assert.ok(sem1Subjects && sem2Subjects, 'Both semesters must hold isolated arrays');
            assert.notStrictEqual(sem1Subjects, sem2Subjects, 'Semester arrays must be distinct references');
        });
    });
});
