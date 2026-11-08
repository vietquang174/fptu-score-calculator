/**
 * Tier 4: Real-World Student Transcripts Test Suite
 * Simulates complete semester transcripts for Semesters 0 through 9
 * reflecting authentic FPTU student grade profiles.
 */

const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const {
    loadAppSandbox,
    createSubjectFixture,
    createComponentFixture
} = require('./test_helper.js');

describe('Tier 4: Real-World Student Transcripts (Semesters 0 to 9)', () => {
    const ctx = loadAppSandbox();

    // =========================================================================
    // Semester 0: Preparatory Term
    // =========================================================================
    it('T4-S0: Semester 0 Preparatory Student Transcript (OTP101, PEN, VOV114, DTR103)', () => {
        const otp = createSubjectFixture({ code: 'OTP101', isScored: false, isPassFailOnly: true, passStatus: 'pass' });
        const pen = createSubjectFixture({ code: 'PEN', isScored: false, isPassFailOnly: true, passStatus: 'pass' });
        const vov114 = createSubjectFixture({ code: 'VOV114', isScored: false, isPassFailOnly: true, passStatus: 'pass' });
        const dtr103 = createSubjectFixture({
            code: 'DTR103',
            nameVi: 'Nhạc cụ truyền thống (Đàn tranh)',
            credits: 3,
            isScored: true,
            components: [
                createComponentFixture({ name: 'Assignment', weight: 15, score: 8.5, minScore: 0, isFE: false }),
                createComponentFixture({ name: 'Participation', weight: 15, score: 9.0, minScore: 0, isFE: false }),
                createComponentFixture({ name: 'FE Practical', weight: 70, score: 8.4, minScore: 4.0, isFE: true })
            ]
        });

        const dtrRes = ctx.calculateSubjectScore(dtr103);
        // 8.5*0.15 + 9.0*0.15 + 8.4*0.70 = 1.275 + 1.35 + 5.88 = 8.505 -> rounds to 8.5
        assert.strictEqual(dtrRes.finalScore, 8.5);
        assert.strictEqual(dtrRes.isPass, true);

        const semRes = ctx.calculateSemesterResults([otp, pen, vov114, dtr103]);
        assert.strictEqual(semRes.tbm, 8.50);
        assert.strictEqual(semRes.honor.title, 'Sinh viên Giỏi');
    });

    // =========================================================================
    // Semester 1: Freshmen Engineering Term
    // =========================================================================
    it('T4-S1: Semester 1 High Achiever Engineering Freshmen Transcript', () => {
        const transcript = [
            createSubjectFixture({ code: 'PRF192', credits: 3, components: [createComponentFixture({ score: 9.0 })] }),
            createSubjectFixture({ code: 'MAE101', credits: 3, components: [createComponentFixture({ score: 8.8 })] }),
            createSubjectFixture({ code: 'CEA201', credits: 3, components: [createComponentFixture({ score: 9.2 })] }),
            createSubjectFixture({ code: 'CSI106', credits: 3, components: [createComponentFixture({ score: 9.0 })] }),
            createSubjectFixture({ code: 'SSL101c', credits: 3, components: [createComponentFixture({ score: 9.4 })] }),
            createSubjectFixture({ code: 'VOV124', credits: 2, isScored: false, isPassFailOnly: true, passStatus: 'pass' })
        ];

        const res = ctx.calculateSemesterResults(transcript);
        // Scored: (9.0 + 8.8 + 9.2 + 9.0 + 9.4) / 5 = 45.4 / 5 = 9.08
        assert.strictEqual(res.tbm, 9.08);
        assert.strictEqual(res.completedScoredCount, 5);
        assert.strictEqual(res.hasFailedNonScored, false);
        assert.strictEqual(res.honor.title, 'Sinh viên Xuất Sắc');
    });

    // =========================================================================
    // Semester 2: Foundation Computer Science Term
    // =========================================================================
    it('T4-S2: Semester 2 Solid Foundation Term Transcript', () => {
        const transcript = [
            createSubjectFixture({ code: 'MAD101', credits: 3, components: [createComponentFixture({ score: 7.8 })] }),
            createSubjectFixture({ code: 'PRO192', credits: 3, components: [createComponentFixture({ score: 8.2 })] }),
            createSubjectFixture({ code: 'OSG202', credits: 3, components: [createComponentFixture({ score: 7.5 })] }),
            createSubjectFixture({ code: 'NWC204', credits: 3, components: [createComponentFixture({ score: 8.0 })] }),
            createSubjectFixture({ code: 'WED201c', credits: 3, components: [createComponentFixture({ score: 8.5 })] }),
            createSubjectFixture({ code: 'VOV134', credits: 2, isScored: false, isPassFailOnly: true, passStatus: 'pass' })
        ];

        const res = ctx.calculateSemesterResults(transcript);
        // (7.8 + 8.2 + 7.5 + 8.0 + 8.5) / 5 = 40.0 / 5 = 8.00
        assert.strictEqual(res.tbm, 8.00);
        assert.strictEqual(res.honor.title, 'Sinh viên Giỏi');
    });

    // =========================================================================
    // Semester 3: Core Software Term (LAB211 Guard)
    // =========================================================================
    it('T4-S3a: Semester 3 Successful Pass with LAB211 Condition Cleared', () => {
        const transcript = [
            createSubjectFixture({ code: 'DBI202', credits: 3, components: [createComponentFixture({ score: 8.5 })] }),
            createSubjectFixture({ code: 'MAS291', credits: 3, components: [createComponentFixture({ score: 8.0 })] }),
            createSubjectFixture({ code: 'SWE202c', credits: 3, components: [createComponentFixture({ score: 8.5 })] }),
            createSubjectFixture({ code: 'JPD113', credits: 3, components: [createComponentFixture({ score: 8.2 })] }),
            createSubjectFixture({ code: 'LAB211', credits: 3, isScored: false, isPassFailOnly: true, passStatus: 'pass' })
        ];

        const res = ctx.calculateSemesterResults(transcript);
        // (8.5 + 8.0 + 8.5 + 8.2) / 4 = 33.2 / 4 = 8.30
        assert.strictEqual(res.tbm, 8.30);
        assert.strictEqual(res.honor.title, 'Sinh viên Giỏi');
    });

    it('T4-S3b: Semester 3 LAB211 Failure Blocks Honors Despite 9.5 Average', () => {
        const transcript = [
            createSubjectFixture({ code: 'DBI202', credits: 3, components: [createComponentFixture({ score: 9.5 })] }),
            createSubjectFixture({ code: 'MAS291', credits: 3, components: [createComponentFixture({ score: 9.6 })] }),
            createSubjectFixture({ code: 'SWE202c', credits: 3, components: [createComponentFixture({ score: 9.4 })] }),
            createSubjectFixture({ code: 'JPD113', credits: 3, components: [createComponentFixture({ score: 9.5 })] }),
            createSubjectFixture({ code: 'LAB211', credits: 3, isScored: false, isPassFailOnly: true, passStatus: 'fail' })
        ];

        const res = ctx.calculateSemesterResults(transcript);
        assert.strictEqual(res.tbm, 9.50);
        assert.strictEqual(res.hasFailedNonScored, true);
        assert.strictEqual(res.honor.title, 'Chưa đạt (Not Pass)');
        assert.strictEqual(res.honor.isCocVang, false);
    });

    // =========================================================================
    // Semester 4: Intermediate Engineering Term (Cóc Vàng Candidate)
    // =========================================================================
    it('T4-S4: Semester 4 Top Honors / Cóc Vàng Candidate Transcript', () => {
        const transcript = [
            createSubjectFixture({ code: 'CSD201', credits: 3, components: [createComponentFixture({ score: 9.8 })] }),
            createSubjectFixture({ code: 'PRJ301', credits: 3, components: [createComponentFixture({ score: 9.7 })] }),
            createSubjectFixture({ code: 'SWR302', credits: 3, components: [createComponentFixture({ score: 9.6 })] }),
            createSubjectFixture({ code: 'IOT102', credits: 3, components: [createComponentFixture({ score: 9.5 })] }),
            createSubjectFixture({ code: 'JPD123', credits: 3, components: [createComponentFixture({ score: 9.9 })] })
        ];

        const res = ctx.calculateSemesterResults(transcript);
        // (9.8 + 9.7 + 9.6 + 9.5 + 9.9) / 5 = 48.5 / 5 = 9.70
        assert.strictEqual(res.tbm, 9.70);
        assert.strictEqual(res.honor.level, 'cocvang');
        assert.strictEqual(res.honor.isCocVang, true);
        assert.strictEqual(res.honor.isTop100, true);
    });

    // =========================================================================
    // Semester 5: First Combo Track Term (SWP391 Project)
    // =========================================================================
    it('T4-S5: Semester 5 Software Project & Elective Combo Term Transcript', () => {
        const transcript = [
            createSubjectFixture({ code: 'SWP391', credits: 3, components: [createComponentFixture({ score: 8.8 })] }),
            createSubjectFixture({ code: 'SWT301', credits: 3, components: [createComponentFixture({ score: 8.4 })] }),
            createSubjectFixture({ code: 'WDU203c', credits: 3, components: [createComponentFixture({ score: 8.6 })] }),
            createSubjectFixture({ code: 'SSG105', credits: 3, components: [createComponentFixture({ score: 9.0 })] }),
            createSubjectFixture({ code: 'PRN212', credits: 3, components: [createComponentFixture({ score: 8.7 })] })
        ];

        const res = ctx.calculateSemesterResults(transcript);
        // (8.8 + 8.4 + 8.6 + 9.0 + 8.7) / 5 = 43.5 / 5 = 8.70
        assert.strictEqual(res.tbm, 8.70);
        assert.strictEqual(res.honor.title, 'Sinh viên Giỏi');
    });

    // =========================================================================
    // Semester 6: Enterprise OJT Term
    // =========================================================================
    it('T4-S6: Semester 6 Enterprise Placement (OJT) Transcript', () => {
        const ojt = createSubjectFixture({
            code: 'OJT202',
            nameVi: 'Thực tập doanh nghiệp (OJT)',
            credits: 10,
            isScored: false,
            isPassFailOnly: true,
            passStatus: 'pass'
        });
        const enw = createSubjectFixture({
            code: 'ENW493c',
            nameVi: 'Phương pháp nghiên cứu & Viết học thuật',
            credits: 3,
            isScored: true,
            components: [createComponentFixture({ score: 9.2 })]
        });

        const res = ctx.calculateSemesterResults([ojt, enw]);
        assert.strictEqual(res.tbm, 9.20);
        assert.strictEqual(res.completedScoredCount, 1);
        assert.strictEqual(res.honor.title, 'Sinh viên Xuất Sắc');
    });

    // =========================================================================
    // Semester 7: Advanced Architecture & Combos
    // =========================================================================
    it('T4-S7: Semester 7 Advanced Combo Courses Transcript', () => {
        const transcript = [
            createSubjectFixture({ code: 'SWD392', credits: 3, components: [createComponentFixture({ score: 8.6 })] }),
            createSubjectFixture({ code: 'PMG201c', credits: 3, components: [createComponentFixture({ score: 9.0 })] }),
            createSubjectFixture({ code: 'EXE101', credits: 3, components: [createComponentFixture({ score: 8.8 })] }),
            createSubjectFixture({ code: 'PRN222', credits: 3, components: [createComponentFixture({ score: 9.2 })] }),
            createSubjectFixture({ code: 'PRU213', credits: 3, components: [createComponentFixture({ score: 8.9 })] })
        ];

        const res = ctx.calculateSemesterResults(transcript);
        // (8.6 + 9.0 + 8.8 + 9.2 + 8.9) / 5 = 44.5 / 5 = 8.90
        assert.strictEqual(res.tbm, 8.90);
        assert.strictEqual(res.honor.title, 'Sinh viên Giỏi');
    });

    // =========================================================================
    // Semester 8: Pre-Capstone & Mobile Term
    // =========================================================================
    it('T4-S8: Semester 8 Pre-Capstone & Political Foundations Transcript', () => {
        const transcript = [
            createSubjectFixture({ code: 'PRM393', credits: 3, components: [createComponentFixture({ score: 8.8 })] }),
            createSubjectFixture({ code: 'ITE302c', credits: 3, components: [createComponentFixture({ score: 9.0 })] }),
            createSubjectFixture({ code: 'EXE201', credits: 3, components: [createComponentFixture({ score: 8.5 })] }),
            createSubjectFixture({ code: 'MLN111', credits: 3, components: [createComponentFixture({ score: 8.0 })] }),
            createSubjectFixture({ code: 'MLN122', credits: 2, components: [createComponentFixture({ score: 8.2 })] }),
            createSubjectFixture({ code: 'SE_COM4_ELE', credits: 3, components: [createComponentFixture({ score: 9.1 })] })
        ];

        const res = ctx.calculateSemesterResults(transcript);
        // (8.8 + 9.0 + 8.5 + 8.0 + 8.2 + 9.1) / 6 = 51.6 / 6 = 8.60
        assert.strictEqual(res.tbm, 8.60);
        assert.strictEqual(res.honor.title, 'Sinh viên Giỏi');
    });

    // =========================================================================
    // Semester 9: Capstone Graduation Term
    // =========================================================================
    it('T4-S9: Semester 9 Graduation Capstone & Political Philosophy Transcript', () => {
        const transcript = [
            createSubjectFixture({
                code: 'SEP490',
                nameVi: 'Đồ án tốt nghiệp KTPM',
                credits: 10,
                isScored: true,
                components: [
                    createComponentFixture({ name: 'On-going Assessment', weight: 50, score: 9.0, minScore: 0, isFE: false }),
                    createComponentFixture({ name: 'Final Defense', weight: 50, score: 9.4, minScore: 4.0, isFE: true })
                ]
            }),
            createSubjectFixture({ code: 'HCM202', credits: 2, components: [createComponentFixture({ score: 8.5 })] }),
            createSubjectFixture({ code: 'MLN131', credits: 2, components: [createComponentFixture({ score: 8.8 })] }),
            createSubjectFixture({ code: 'VNR202', credits: 2, components: [createComponentFixture({ score: 8.7 })] })
        ];

        // SEP490 = 9.0*0.5 + 9.4*0.5 = 9.20
        const sepRes = ctx.calculateSubjectScore(transcript[0]);
        assert.strictEqual(sepRes.finalScore, 9.2);
        assert.strictEqual(sepRes.isPass, true);

        const res = ctx.calculateSemesterResults(transcript);
        // (9.2 + 8.5 + 8.8 + 8.7) / 4 = 35.2 / 4 = 8.80
        assert.strictEqual(res.tbm, 8.80);
        assert.strictEqual(res.honor.title, 'Sinh viên Giỏi');
    });
});
