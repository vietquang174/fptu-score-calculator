/**
 * Modular Test Suite: Specialized Business Rules
 * Verifies Semester 6 (OJT) and Semesters 8-9 (Capstone) academic rules.
 */

const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const {
    loadAppSandbox,
    createSubjectFixture,
    createComponentFixture
} = require('./test_helper.js');

describe('Specialized Business Rules (test_semesters_special.js)', () => {
    const ctx = loadAppSandbox();

    describe('Semester 6 (OJT) Business Rules', () => {
        it('OJT202 (10 credits) is excluded from TBM arithmetic mean GPA', () => {
            const ojt = createSubjectFixture({
                code: 'OJT202',
                credits: 10,
                isScored: false,
                isPassFailOnly: true,
                passStatus: 'pass'
            });
            const enw = createSubjectFixture({
                code: 'ENW493c',
                credits: 3,
                isScored: true,
                components: [createComponentFixture({ score: 8.8 })]
            });

            const res = ctx.calculateSemesterResults([ojt, enw]);
            assert.strictEqual(res.tbm, 8.80);
            assert.strictEqual(res.completedScoredCount, 1);
            assert.strictEqual(res.totalScoredCount, 1);
        });

        it('Passing OJT202 with high ENW493c score awards Sinh viên Xuất Sắc', () => {
            const ojt = createSubjectFixture({ code: 'OJT202', isScored: false, isPassFailOnly: true, passStatus: 'pass' });
            const enw = createSubjectFixture({ code: 'ENW493c', isScored: true, components: [createComponentFixture({ score: 9.5 })] });

            const res = ctx.calculateSemesterResults([ojt, enw]);
            assert.strictEqual(res.tbm, 9.50);
            assert.strictEqual(res.honor.title, 'Sinh viên Xuất Sắc');
        });

        it('Failing OJT202 immediately blocks honors and forces Not Pass status', () => {
            const ojt = createSubjectFixture({ code: 'OJT202', isScored: false, isPassFailOnly: true, passStatus: 'fail' });
            const enw = createSubjectFixture({ code: 'ENW493c', isScored: true, components: [createComponentFixture({ score: 10.0 })] });

            const res = ctx.calculateSemesterResults([ojt, enw]);
            assert.strictEqual(res.hasFailedNonScored, true);
            assert.strictEqual(res.honor.title, 'Chưa đạt (Not Pass)');
            assert.strictEqual(res.honor.isCocVang, false);
            assert.strictEqual(res.honor.isTop100, false);
        });
    });

    describe('Semesters 8 and 9 (Capstone) Business Rules', () => {
        it('Semester 8 computes unweighted TBM arithmetic mean from all completed scored courses', () => {
            const s1 = createSubjectFixture({ code: 'PRM393', components: [createComponentFixture({ score: 8.2 })] });
            const s2 = createSubjectFixture({ code: 'ITE302c', components: [createComponentFixture({ score: 8.8 })] });
            const s3 = createSubjectFixture({ code: 'EXE201', components: [createComponentFixture({ score: 8.5 })] });
            const s4 = createSubjectFixture({ code: 'MLN111', components: [createComponentFixture({ score: 8.5 })] });

            const res = ctx.calculateSemesterResults([s1, s2, s3, s4]);
            // (8.2 + 8.8 + 8.5 + 8.5) / 4 = 34.0 / 4 = 8.50
            assert.strictEqual(res.tbm, 8.50);
            assert.strictEqual(res.honor.title, 'Sinh viên Giỏi');
        });

        it('Semester 9 Capstone project SEP490 failure blocks graduation honors', () => {
            const capstoneFail = createSubjectFixture({
                code: 'SEP490',
                components: [
                    createComponentFixture({ name: 'On-going', weight: 50, score: 8.0, minScore: 0, isFE: false }),
                    createComponentFixture({ name: 'Defense', weight: 50, score: 3.8, minScore: 4.0, isFE: true })
                ]
            });
            const pol = createSubjectFixture({ code: 'HCM202', components: [createComponentFixture({ score: 9.0 })] });

            const res = ctx.calculateSemesterResults([capstoneFail, pol]);
            assert.strictEqual(res.hasFailedScored, true);
            assert.strictEqual(res.honor.title, 'Chưa đạt (Not Pass)');
        });

        it('Semester 9 with successful defense and high scores awards Xuất Sắc', () => {
            const capstone = createSubjectFixture({
                code: 'SEP490',
                components: [
                    createComponentFixture({ name: 'On-going', weight: 50, score: 9.2, minScore: 0, isFE: false }),
                    createComponentFixture({ name: 'Defense', weight: 50, score: 9.2, minScore: 4.0, isFE: true })
                ]
            });
            const pol1 = createSubjectFixture({ code: 'HCM202', components: [createComponentFixture({ score: 9.0 })] });
            const pol2 = createSubjectFixture({ code: 'MLN131', components: [createComponentFixture({ score: 9.4 })] });
            const pol3 = createSubjectFixture({ code: 'VNR202', components: [createComponentFixture({ score: 9.2 })] });

            const res = ctx.calculateSemesterResults([capstone, pol1, pol2, pol3]);
            // (9.2 + 9.0 + 9.4 + 9.2) / 4 = 36.8 / 4 = 9.20
            assert.strictEqual(res.tbm, 9.20);
            assert.strictEqual(res.honor.title, 'Sinh viên Xuất Sắc');
        });
    });
});
