/**
 * Tier 5: Adversarial Coverage Hardening Test Suite (Challenger 1)
 * Milestone 4 Phase 2 — Adversarial Verification
 * 
 * Probe Areas:
 * 1. Malformed & Extreme User Inputs (NaN, negative, huge, string numbers, null, symbols, empty).
 * 2. Dynamic Combo Track Switching with Concurrent / Interrupted State & Cross-Slot Isolation.
 * 3. Semester 6 (OJT) Permutations Alone vs Companion Scored Courses & Failure Cascades.
 * 4. Semesters 8 & 9 Capstone Honors Hardening (10.0 TBM, Capping, Political Courses Guard).
 * 5. Component Hurdles & Floating Point Arithmetic (FE 3.999999 vs 4.0, Process 0 vs 0.00001, Vovinam).
 * 6. Export Sandbox Memory Leak Resilience, Error Recovery & Mobile Viewport Rigidity.
 * 7. Curriculum Invariants & Schema Completeness.
 */

const { describe, it, beforeEach } = require('node:test');
const assert = require('node:assert/strict');
const {
    loadAppSandbox,
    createSubjectFixture,
    createComponentFixture
} = require('./test_helper.js');
const { SUBJECT_SCHEMAS, COMBO_TRACKS, CURRICULUM_SEMESTERS } = require('../ScoreCalculator/data.js');

describe('Tier 5: Adversarial Coverage Hardening (Challenger 1)', () => {
    let ctx;

    beforeEach(() => {
        ctx = loadAppSandbox();
        ctx.initializeAppState();
    });

    // =========================================================================
    // SUITE 1: Malformed, Extreme & Hostile User Inputs
    // =========================================================================
    describe('1. Malformed & Extreme User Inputs', () => {
        it('1.1: handleSubPartInput clamps extreme negative numbers to "0"', () => {
            const sem = ctx.AppState.currentSemester;
            const sub = ctx.AppState.semesterData[sem][0];
            const comp = sub.components[0];
            
            ctx.handleSubPartInput(sub.id, comp.id, 0, '-999999');
            assert.strictEqual(comp.subValues[0], '0');

            ctx.handleSubPartInput(sub.id, comp.id, 0, '-0.000001');
            assert.strictEqual(comp.subValues[0], '0');
        });

        it('1.2: handleSubPartInput clamps extreme positive numbers to "10"', () => {
            const sem = ctx.AppState.currentSemester;
            const sub = ctx.AppState.semesterData[sem][0];
            const comp = sub.components[0];

            ctx.handleSubPartInput(sub.id, comp.id, 0, '999999');
            assert.strictEqual(comp.subValues[0], '10');

            ctx.handleSubPartInput(sub.id, comp.id, 0, '10.00001');
            assert.strictEqual(comp.subValues[0], '10');

            ctx.handleSubPartInput(sub.id, comp.id, 0, '1e5');
            assert.strictEqual(comp.subValues[0], '10');
        });

        it('1.3: handleSubPartInput sanitizes hostile strings and symbols to empty string ""', () => {
            const sem = ctx.AppState.currentSemester;
            const sub = ctx.AppState.semesterData[sem][0];
            const comp = sub.components[0];

            const hostileInputs = ['NaN', 'undefined', 'null', '<script>alert(1)</script>', 'DROP TABLE', '[object Object]', 'abc', '---', '$%#@'];
            for (const hostile of hostileInputs) {
                ctx.handleSubPartInput(sub.id, comp.id, 0, hostile);
                assert.strictEqual(comp.subValues[0], '', `Failed to sanitize: ${hostile}`);
            }
        });

        it('1.4: handleSubPartInput handles surrounding whitespace gracefully', () => {
            const sem = ctx.AppState.currentSemester;
            const sub = ctx.AppState.semesterData[sem][0];
            const comp = sub.components[0];

            ctx.handleSubPartInput(sub.id, comp.id, 0, '   8.75   \n');
            assert.strictEqual(comp.subValues[0], '8.75');

            ctx.handleSubPartInput(sub.id, comp.id, 0, '\t 10 \t');
            assert.strictEqual(comp.subValues[0], '10');
        });

        it('1.5: handleSingleCompInput clamps negative and oversize inputs', () => {
            const sem = ctx.AppState.currentSemester;
            const sub = ctx.AppState.semesterData[sem][0];
            const comp = sub.components[0];

            ctx.handleSingleCompInput(sub.id, comp.id, '-5');
            const targetVal = comp.parts > 1 ? comp.avgValue : comp.subValues[0];
            assert.strictEqual(targetVal, '0');

            ctx.handleSingleCompInput(sub.id, comp.id, '15.5');
            const targetVal2 = comp.parts > 1 ? comp.avgValue : comp.subValues[0];
            assert.strictEqual(targetVal2, '10');
        });

        it('1.6: calculateComponentScore handles null, undefined, and non-numeric avgValue safely', () => {
            const comp1 = createComponentFixture({ score: null });
            comp1.avgValue = null;
            comp1.mode = 'average';
            comp1.parts = 2;
            const res1 = ctx.calculateComponentScore(comp1);
            assert.strictEqual(res1.isMissing, true);
            assert.strictEqual(res1.value, null);

            const comp2 = createComponentFixture({ score: undefined });
            comp2.avgValue = undefined;
            comp2.mode = 'average';
            comp2.parts = 2;
            const res2 = ctx.calculateComponentScore(comp2);
            assert.strictEqual(res2.isMissing, true);
            assert.strictEqual(res2.value, null);

            const comp3 = createComponentFixture({ score: 'not_a_number' });
            comp3.avgValue = 'not_a_number';
            comp3.mode = 'average';
            comp3.parts = 2;
            const res3 = ctx.calculateComponentScore(comp3);
            assert.strictEqual(res3.isMissing, true);
            assert.strictEqual(res3.value, null);
        });

        it('1.7: calculateSemesterResults handles malformed non-array and null items gracefully', () => {
            assert.doesNotThrow(() => {
                const resNull = ctx.calculateSemesterResults(null);
                assert.strictEqual(resNull.totalScoredCount, 0);
                assert.strictEqual(resNull.tbm, 'N/A');

                const resUndef = ctx.calculateSemesterResults(undefined);
                assert.strictEqual(resUndef.totalScoredCount, 0);

                const resNumber = ctx.calculateSemesterResults(12345);
                assert.strictEqual(resNumber.totalScoredCount, 0);

                const resString = ctx.calculateSemesterResults("malformed");
                assert.strictEqual(resString.totalScoredCount, 0);

                const resArrayNulls = ctx.calculateSemesterResults([null, undefined, null]);
                assert.strictEqual(resArrayNulls.totalScoredCount, 0);
            });

            // Boundary verification: calculateSubjectScore throws on malformed subject missing components
            assert.throws(() => {
                ctx.calculateSubjectScore({});
            }, /Cannot read properties of undefined/);
        });

        it('1.8: detectSemesterNum handles varied argument types and falsy zero', () => {
            // Explicit zero must return 0, not fall through to currentSemester
            assert.strictEqual(ctx.detectSemesterNum([], 0), 0);
            assert.strictEqual(ctx.detectSemesterNum([], '0'), 0);
            assert.strictEqual(ctx.detectSemesterNum([], 6), 6);
            assert.strictEqual(ctx.detectSemesterNum([], '9'), 9);

            // Auto-detection by course codes
            assert.strictEqual(ctx.detectSemesterNum([{ code: 'OJT202' }]), 6);
            assert.strictEqual(ctx.detectSemesterNum([{ code: 'SEP490' }]), 9);
            assert.strictEqual(ctx.detectSemesterNum([{ code: 'SET490' }]), 9);
            assert.strictEqual(ctx.detectSemesterNum([{ code: 'EXE402' }]), 9);
            assert.strictEqual(ctx.detectSemesterNum([{ code: 'PIT490' }]), 9);
            assert.strictEqual(ctx.detectSemesterNum([{ code: 'GRC490' }]), 9);
            assert.strictEqual(ctx.detectSemesterNum([{ code: 'SE_GRA_ELE' }]), 9);
            assert.strictEqual(ctx.detectSemesterNum([{ code: 'HCM202' }]), 9);
            assert.strictEqual(ctx.detectSemesterNum([{ code: 'VNR202' }]), 9);
            assert.strictEqual(ctx.detectSemesterNum([{ code: 'PRM393' }]), 8);
            assert.strictEqual(ctx.detectSemesterNum([{ code: 'ITE302c' }]), 8);
            assert.strictEqual(ctx.detectSemesterNum([{ code: 'EXE201' }]), 8);
            assert.strictEqual(ctx.detectSemesterNum([{ code: 'MLN122' }]), 8);
        });
    });

    // =========================================================================
    // SUITE 2: Dynamic Combo Track Switching & Concurrency Stress
    // =========================================================================
    describe('2. Dynamic Combo Track Switching & Concurrency Stress', () => {
        const ALL_TRACKS = ['dotnet', 'react', 'ai', 'java', 'game', 'datascience', 'icdesign', 'japanese'];

        it('2.1: Rapid track cycling (120 switches) maintains clean state and non-empty subject arrays', () => {
            for (let i = 0; i < 120; i++) {
                const track = ALL_TRACKS[i % ALL_TRACKS.length];
                ctx.setComboTrack(track);
                assert.strictEqual(ctx.AppState.selectedComboTrack, track);
            }

            [5, 7, 8].forEach(sem => {
                const subs = ctx.AppState.semesterData[sem];
                assert.ok(Array.isArray(subs) && subs.length >= 4, `Semester ${sem} corrupted after rapid switching`);
            });
        });

        it('2.2: Unknown trackId safely falls back to dotnet track without throwing', () => {
            assert.doesNotThrow(() => {
                ctx.setComboTrack('non_existent_track_xyz');
                ctx.setComboTrack('');
                ctx.setComboTrack(null);
                ctx.setComboTrack(undefined);
            });

            // Semester 5, 7, 8 must still be intact
            [5, 7, 8].forEach(sem => {
                const subs = ctx.AppState.semesterData[sem];
                assert.ok(Array.isArray(subs) && subs.length > 0);
            });
        });

        it('2.3: Case-insensitive track switching (DOTNET, React, AI, jAvA)', () => {
            ctx.setComboTrack('DOTNET');
            assert.ok(ctx.AppState.semesterData[5].some(s => s.code === 'PRN212'));

            ctx.setComboTrack('React');
            assert.ok(ctx.AppState.semesterData[5].some(s => s.code === 'FER202'));

            ctx.setComboTrack('AI');
            assert.ok(ctx.AppState.semesterData[5].some(s => s.code === 'PRP201c'));

            ctx.setComboTrack('jAvA');
            assert.ok(ctx.AppState.semesterData[5].some(s => s.code === 'HSF302'));
        });

        it('2.4: Cross-track score isolation: entering scores in Track A does not overwrite Track B', () => {
            // Step 1: Switch to dotnet and enter 8.5 for PRN212
            ctx.setComboTrack('dotnet');
            const sem5Dotnet = ctx.AppState.semesterData[5];
            const prn212 = sem5Dotnet.find(s => s.code === 'PRN212');
            assert.ok(prn212, 'PRN212 not found in Semester 5');
            prn212.components.forEach(c => {
                c.avgValue = '8.5';
                c.subValues = c.subValues.map(() => '8.5');
            });

            // Step 2: Switch to react and enter 9.5 for FER202
            ctx.setComboTrack('react');
            const sem5React = ctx.AppState.semesterData[5];
            const fer202 = sem5React.find(s => s.code === 'FER202');
            assert.ok(fer202, 'FER202 not found in Semester 5');
            fer202.components.forEach(c => {
                c.avgValue = '9.5';
                c.subValues = c.subValues.map(() => '9.5');
            });

            // Step 3: Switch back to dotnet -> PRN212 must still be 8.5, not 9.5
            ctx.setComboTrack('dotnet');
            const sem5DotnetAgain = ctx.AppState.semesterData[5];
            const prn212Restored = sem5DotnetAgain.find(s => s.code === 'PRN212');
            assert.strictEqual(prn212Restored.components[0].subValues[0], '8.5');

            // Step 4: Switch back to react -> FER202 must still be 9.5
            ctx.setComboTrack('react');
            const sem5ReactAgain = ctx.AppState.semesterData[5];
            const fer202Restored = sem5ReactAgain.find(s => s.code === 'FER202');
            assert.strictEqual(fer202Restored.components[0].subValues[0], '9.5');
        });

        it('2.5: Semester 7 two-combo-slot cross-slot isolation', () => {
            ctx.setComboTrack('dotnet');
            const sem7 = ctx.AppState.semesterData[7];
            const prn222 = sem7.find(s => s.code === 'PRN222'); // slot 0
            const pru213 = sem7.find(s => s.code === 'PRU213'); // slot 1
            assert.ok(prn222 && pru213, 'Dotnet Sem 7 courses missing');

            prn222.components.forEach(c => { c.subValues = c.subValues.map(() => '7.0'); });
            pru213.components.forEach(c => { c.subValues = c.subValues.map(() => '9.0'); });

            // Switch to Java then back
            ctx.setComboTrack('java');
            ctx.setComboTrack('dotnet');

            const sem7Restored = ctx.AppState.semesterData[7];
            const prn222Restored = sem7Restored.find(s => s.code === 'PRN222');
            const pru213Restored = sem7Restored.find(s => s.code === 'PRU213');

            assert.strictEqual(prn222Restored.components[0].subValues[0], '7.0');
            assert.strictEqual(pru213Restored.components[0].subValues[0], '9.0');
        });

        it('2.6: Capstone elective switching in Semester 9 preserves core political courses', () => {
            const CAPSTONE_CODES = ['SEP490', 'SET490', 'EXE402', 'PIT490', 'GRC490'];
            
            CAPSTONE_CODES.forEach(code => {
                ctx.setCapstoneElective(code);
                const sem9 = ctx.AppState.semesterData[9];
                assert.ok(sem9.some(s => s.code === code), `Semester 9 missing elective ${code}`);
                
                // Assert core political courses remain present
                assert.ok(sem9.some(s => s.code === 'HCM202'), `HCM202 missing with elective ${code}`);
                assert.ok(sem9.some(s => s.code === 'VNR202'), `VNR202 missing with elective ${code}`);
                assert.ok(sem9.some(s => s.code === 'MLN131'), `MLN131 missing with elective ${code}`);
            });
        });
    });

    // =========================================================================
    // SUITE 3: Semester 6 (OJT) Permutations & Failure Cascades
    // =========================================================================
    describe('3. Semester 6 (OJT) Permutations & Failure Cascades', () => {
        it('3.1: OJT202 alone with Pass produces TBM "N/A" and Đạt (Pass) honor', () => {
            const ojt = createSubjectFixture({
                code: 'OJT202',
                isScored: false,
                isPassFailOnly: true,
                passStatus: 'pass'
            });

            const res = ctx.calculateSemesterResults([ojt], 6);
            assert.strictEqual(res.tbm, 'N/A');
            assert.strictEqual(res.tbmStr, 'N/A');
            assert.strictEqual(res.status, 'Đạt (Pass)');
            assert.strictEqual(res.honor.title, 'Đạt (Pass)');
            assert.strictEqual(res.honor.isCocVang, false);
            assert.strictEqual(res.honor.isTop100, false);
        });

        it('3.2: OJT202 alone with Not Pass produces TBM "N/A" and Chưa đạt (Not Pass) honor', () => {
            const ojt = createSubjectFixture({
                code: 'OJT202',
                isScored: false,
                isPassFailOnly: true,
                passStatus: 'fail'
            });

            const res = ctx.calculateSemesterResults([ojt], 6);
            assert.strictEqual(res.tbm, 'N/A');
            assert.strictEqual(res.status, 'Chưa Đạt (Not Pass)');
            assert.strictEqual(res.honor.title, 'Chưa đạt (Not Pass)');
            assert.strictEqual(res.isPassed, false);
            assert.strictEqual(res.honor.isCocVang, false);
            assert.strictEqual(res.honor.isTop100, false);
        });

        it('3.3: OJT202 (Pass) + ENW493c (10.0) -> TBM 10.00, caps honor at Xuất Sắc, strictly hides Cóc Vàng & Top 100', () => {
            const ojt = createSubjectFixture({
                code: 'OJT202',
                isScored: false,
                isPassFailOnly: true,
                passStatus: 'pass'
            });
            const enw = createSubjectFixture({
                code: 'ENW493c',
                isScored: true,
                components: [createComponentFixture({ weight: 100, score: 10.0 })]
            });

            const res = ctx.calculateSemesterResults([ojt, enw], 6);
            assert.strictEqual(res.tbm, 10.00);
            assert.strictEqual(res.tbmStr, '10.00');
            assert.strictEqual(res.status, 'Đạt (Pass)');
            assert.strictEqual(res.honor.title, 'Sinh viên Xuất Sắc');
            assert.strictEqual(res.honor.isCocVang, false);
            assert.strictEqual(res.honor.isTop100, false);
        });

        it('3.4: OJT202 (Not Pass) + ENW493c (10.0) -> Failure cascade blocks all honors despite perfect 10.0 GPA', () => {
            const ojt = createSubjectFixture({
                code: 'OJT202',
                isScored: false,
                isPassFailOnly: true,
                passStatus: 'fail'
            });
            const enw = createSubjectFixture({
                code: 'ENW493c',
                isScored: true,
                components: [createComponentFixture({ weight: 100, score: 10.0 })]
            });

            const res = ctx.calculateSemesterResults([ojt, enw], 6);
            assert.strictEqual(res.status, 'Chưa Đạt (Not Pass)');
            assert.strictEqual(res.honor.title, 'Chưa đạt (Not Pass)');
            assert.strictEqual(res.isPassed, false);
            assert.strictEqual(res.honor.isCocVang, false);
            assert.strictEqual(res.honor.isTop100, false);
            assert.ok(res.failedSubjectCodes.includes('OJT202'));
        });

        it('3.5: OJT202 (Pass) + Incomplete companion course -> TBM null, flags incomplete, pending honor', () => {
            const ojt = createSubjectFixture({
                code: 'OJT202',
                isScored: false,
                isPassFailOnly: true,
                passStatus: 'pass'
            });
            const enw = createSubjectFixture({
                code: 'ENW493c',
                isScored: true,
                components: [
                    createComponentFixture({ name: 'PT', weight: 50, score: 8.0 }),
                    createComponentFixture({ name: 'FE', weight: 50, score: '' }) // missing FE
                ]
            });

            const res = ctx.calculateSemesterResults([ojt, enw], 6);
            assert.strictEqual(res.tbm, null);
            assert.strictEqual(res.tbmStr, '-');
            assert.strictEqual(res.status, 'Đang học');
            assert.strictEqual(res.honor.title, 'Chưa đủ dữ liệu');
            assert.ok(res.incompleteSubjectCodes.includes('ENW493c'));
        });

        it('3.6: OJT202 (Not Pass) + Incomplete companion course -> Immediately flags Chưa Đạt (Not Pass)', () => {
            const ojt = createSubjectFixture({
                code: 'OJT202',
                isScored: false,
                isPassFailOnly: true,
                passStatus: 'fail'
            });
            const enw = createSubjectFixture({
                code: 'ENW493c',
                isScored: true,
                components: [createComponentFixture({ name: 'FE', weight: 100, score: '' })]
            });

            const res = ctx.calculateSemesterResults([ojt, enw], 6);
            assert.strictEqual(res.status, 'Chưa Đạt (Not Pass)');
            assert.strictEqual(res.honor.title, 'Chưa đạt (Not Pass)');
            assert.strictEqual(res.isPassed, false);
        });

        it('3.7: Multiple companion scored courses in Semester 6: arithmetic mean excludes OJT credits', () => {
            const ojt = createSubjectFixture({ code: 'OJT202', credits: 10, isScored: false, isPassFailOnly: true, passStatus: 'pass' });
            const sub1 = createSubjectFixture({ code: 'ENW493c', credits: 3, isScored: true, components: [createComponentFixture({ weight: 100, score: 8.0 })] });
            const sub2 = createSubjectFixture({ code: 'CUSTOM1', credits: 3, isScored: true, components: [createComponentFixture({ weight: 100, score: 9.0 })] });

            const res = ctx.calculateSemesterResults([ojt, sub1, sub2], 6);
            // Mean = (8.0 + 9.0) / 2 = 8.50
            assert.strictEqual(res.tbm, 8.50);
            assert.strictEqual(res.tbmStr, '8.50');
            assert.strictEqual(res.honor.title, 'Sinh viên Giỏi');
        });
    });

    // =========================================================================
    // SUITE 4: Semesters 8 & 9 Capstone Honors Hardening & Omission Verification
    // =========================================================================
    describe('4. Semesters 8 & 9 Capstone Honors Hardening & Omission', () => {
        it('4.1: Semester 8 with perfect 10.00 TBM caps honor at Xuất Sắc and suppresses Cóc Vàng / Top 100', () => {
            const subjects = [
                createSubjectFixture({ code: 'PRM393', components: [createComponentFixture({ weight: 100, score: 10.0 })] }),
                createSubjectFixture({ code: 'ITE302c', components: [createComponentFixture({ weight: 100, score: 10.0 })] }),
                createSubjectFixture({ code: 'EXE201', components: [createComponentFixture({ weight: 100, score: 10.0 })] }),
                createSubjectFixture({ code: 'MLN122', components: [createComponentFixture({ weight: 100, score: 10.0 })] })
            ];

            const res = ctx.calculateSemesterResults(subjects, 8);
            assert.strictEqual(res.tbm, 10.00);
            assert.strictEqual(res.honor.title, 'Sinh viên Xuất Sắc');
            assert.strictEqual(res.honor.isCocVang, false);
            assert.strictEqual(res.honor.isTop100, false);
            assert.strictEqual(res.honor.highlightBadge, undefined);
        });

        it('4.2: Semester 8 political subject MLN122 failure blocks all honors', () => {
            const subjects = [
                createSubjectFixture({ code: 'PRM393', components: [createComponentFixture({ weight: 100, score: 10.0 })] }),
                createSubjectFixture({ code: 'ITE302c', components: [createComponentFixture({ weight: 100, score: 9.5 })] }),
                createSubjectFixture({ code: 'EXE201', components: [createComponentFixture({ weight: 100, score: 9.0 })] }),
                createSubjectFixture({ code: 'MLN122', components: [createComponentFixture({ weight: 100, score: 4.5 })] }) // Failed MLN122
            ];

            const res = ctx.calculateSemesterResults(subjects, 8);
            assert.strictEqual(res.status, 'Chưa Đạt (Not Pass)');
            assert.strictEqual(res.honor.title, 'Chưa đạt (Not Pass)');
            assert.strictEqual(res.isPassed, false);
            assert.ok(res.failedSubjectCodes.includes('MLN122'));
        });

        it('4.3: Semester 9 with perfect 10.00 TBM across Capstone and political courses caps at Xuất Sắc', () => {
            const subjects = [
                createSubjectFixture({ code: 'SEP490', components: [createComponentFixture({ weight: 100, score: 10.0 })] }),
                createSubjectFixture({ code: 'HCM202', components: [createComponentFixture({ weight: 100, score: 10.0 })] }),
                createSubjectFixture({ code: 'VNR202', components: [createComponentFixture({ weight: 100, score: 10.0 })] }),
                createSubjectFixture({ code: 'MLN131', components: [createComponentFixture({ weight: 100, score: 10.0 })] })
            ];

            const res = ctx.calculateSemesterResults(subjects, 9);
            assert.strictEqual(res.tbm, 10.00);
            assert.strictEqual(res.honor.title, 'Sinh viên Xuất Sắc');
            assert.strictEqual(res.honor.isCocVang, false);
            assert.strictEqual(res.honor.isTop100, false);
            assert.strictEqual(res.honor.highlightBadge, undefined);
        });

        it('4.4: Semester 9 Capstone defense failure (FE < 4.0) blocks graduation honors', () => {
            const subjects = [
                createSubjectFixture({
                    code: 'SEP490',
                    components: [
                        createComponentFixture({ name: 'Process', weight: 50, score: 8.0, isFE: false }),
                        createComponentFixture({ name: 'Defense', weight: 50, score: 3.9, isFE: true, minScore: 4.0 }) // Liệt defense
                    ]
                }),
                createSubjectFixture({ code: 'HCM202', components: [createComponentFixture({ weight: 100, score: 9.0 })] }),
                createSubjectFixture({ code: 'VNR202', components: [createComponentFixture({ weight: 100, score: 9.0 })] }),
                createSubjectFixture({ code: 'MLN131', components: [createComponentFixture({ weight: 100, score: 9.0 })] })
            ];

            const res = ctx.calculateSemesterResults(subjects, 9);
            assert.strictEqual(res.status, 'Chưa Đạt (Not Pass)');
            assert.strictEqual(res.honor.title, 'Chưa đạt (Not Pass)');
            assert.strictEqual(res.isPassed, false);
            assert.ok(res.failedSubjectCodes.includes('SEP490'));
        });

        it('4.5: Contrast test: Standard semester (e.g. Semester 4) DOES award Cóc Vàng and Top 100', () => {
            const subjects = [
                createSubjectFixture({ code: 'S4_A', components: [createComponentFixture({ weight: 100, score: 9.8 })] }),
                createSubjectFixture({ code: 'S4_B', components: [createComponentFixture({ weight: 100, score: 9.6 })] })
            ];

            // 9.70 TBM in Semester 4 -> Cóc Vàng
            const resCocVang = ctx.calculateSemesterResults(subjects, 4);
            assert.strictEqual(resCocVang.tbm, 9.70);
            assert.strictEqual(resCocVang.honor.isCocVang, true);
            assert.strictEqual(resCocVang.honor.isTop100, true);
            assert.ok(resCocVang.honor.highlightBadge.includes('CÓC VÀNG'));

            // 9.30 TBM in Semester 4 -> Top 100
            const subjectsTop100 = [
                createSubjectFixture({ code: 'S4_A', components: [createComponentFixture({ weight: 100, score: 9.3 })] })
            ];
            const resTop100 = ctx.calculateSemesterResults(subjectsTop100, 4);
            assert.strictEqual(resTop100.tbm, 9.30);
            assert.strictEqual(resTop100.honor.isCocVang, false);
            assert.strictEqual(resTop100.honor.isTop100, true);
            assert.ok(resTop100.honor.highlightBadge.includes('Top 100'));
        });

        it('4.6: Fireworks trigger strictly suppressed in Semesters 6, 8, 9', () => {
            let confettiCalls = 0;
            let setIntervalCalls = 0;
            const customCtx = loadAppSandbox({
                confetti: () => { confettiCalls++; },
                setInterval: (fn, ms) => { setIntervalCalls++; fn(); return 1; }
            });
            customCtx.initializeAppState();

            // Semester 6
            customCtx.AppState.currentSemester = 6;
            customCtx.triggerFireworks();
            assert.strictEqual(confettiCalls, 0, 'Fireworks triggered in Semester 6!');
            assert.strictEqual(setIntervalCalls, 0);

            // Semester 8
            customCtx.AppState.currentSemester = 8;
            customCtx.triggerFireworks();
            assert.strictEqual(confettiCalls, 0, 'Fireworks triggered in Semester 8!');
            assert.strictEqual(setIntervalCalls, 0);

            // Semester 9
            customCtx.AppState.currentSemester = 9;
            customCtx.triggerFireworks();
            assert.strictEqual(confettiCalls, 0, 'Fireworks triggered in Semester 9!');
            assert.strictEqual(setIntervalCalls, 0);

            // Standard Semester (e.g. 2) CAN trigger confetti
            customCtx.AppState.currentSemester = 2;
            customCtx.triggerFireworks();
            assert.strictEqual(setIntervalCalls, 1, 'Fireworks failed to schedule in standard semester');
            assert.ok(confettiCalls >= 1, 'Confetti was not invoked');
        });
    });

    // =========================================================================
    // SUITE 5: Precision Floating-Point Arithmetic & Hurdle Boundaries
    // =========================================================================
    describe('5. Precision Floating-Point Arithmetic & Hurdle Boundaries', () => {
        it('5.1: Final Exam hurdle infinitesimal boundary: 3.999999 FAILS, 4.000000 PASSES, 4.000001 PASSES', () => {
            const failComp = createComponentFixture({ weight: 100, isFE: true, minScore: 4.0, score: 3.999999 });
            const passComp1 = createComponentFixture({ weight: 100, isFE: true, minScore: 4.0, score: 4.000000 });
            const passComp2 = createComponentFixture({ weight: 100, isFE: true, minScore: 4.0, score: 4.000001 });

            const resFail = ctx.calculateComponentScore(failComp);
            assert.strictEqual(resFail.isFailed, true);

            const resPass1 = ctx.calculateComponentScore(passComp1);
            assert.strictEqual(resPass1.isFailed, false);

            const resPass2 = ctx.calculateComponentScore(passComp2);
            assert.strictEqual(resPass2.isFailed, false);
        });

        it('5.2: Vovinam FE hurdle boundary: 4.999999 FAILS, 5.000000 PASSES, 5.000001 PASSES', () => {
            const vovFail = createComponentFixture({ weight: 100, isFE: true, minScore: 5.0, score: 4.999999 });
            const vovPass = createComponentFixture({ weight: 100, isFE: true, minScore: 5.0, score: 5.000000 });

            assert.strictEqual(ctx.calculateComponentScore(vovFail).isFailed, true);
            assert.strictEqual(ctx.calculateComponentScore(vovPass).isFailed, false);
        });

        it('5.3: Process component hurdle boundary: 0.000000 FAILS, 0.000001 PASSES, -0.000001 FAILS', () => {
            const procZero = createComponentFixture({ weight: 100, isFE: false, minScore: 0, score: 0.000000 });
            const procTiny = createComponentFixture({ weight: 100, isFE: false, minScore: 0, score: 0.000001 });
            const procNeg = createComponentFixture({ weight: 100, isFE: false, minScore: 0, score: -0.000001 });

            assert.strictEqual(ctx.calculateComponentScore(procZero).isFailed, true);
            assert.strictEqual(ctx.calculateComponentScore(procTiny).isFailed, false);
            assert.strictEqual(ctx.calculateComponentScore(procNeg).isFailed, true);
        });

        it('5.4: Detailed mode multi-part process hurdle: all zeros fails, positive average passes', () => {
            const compAllZero = createComponentFixture({
                weight: 50,
                isFE: false,
                minScore: 0,
                parts: 4,
                subScores: [0.0, 0.0, 0.0, 0.0]
            });
            assert.strictEqual(ctx.calculateComponentScore(compAllZero).isFailed, true);

            const compPartial = createComponentFixture({
                weight: 50,
                isFE: false,
                minScore: 0,
                parts: 4,
                subScores: [0.0, 0.0, 0.0, 0.1]
            });
            assert.strictEqual(ctx.calculateComponentScore(compPartial).isFailed, false);
        });

        it('5.5: Subject 1-decimal rounding transitions across 4.94 vs 4.95 vs 4.951', () => {
            // 4.9499999 rounds down to 4.9 -> Not Pass
            const subDown = createSubjectFixture({
                components: [createComponentFixture({ weight: 100, score: 4.9499999 })]
            });
            const resDown = ctx.calculateSubjectScore(subDown);
            assert.strictEqual(resDown.finalScore, 4.9);
            assert.strictEqual(resDown.isPass, false);

            // 4.9500000 rounds up to 5.0 -> Pass
            const subUp = createSubjectFixture({
                components: [createComponentFixture({ weight: 100, score: 4.9500000 })]
            });
            const resUp = ctx.calculateSubjectScore(subUp);
            assert.strictEqual(resUp.finalScore, 5.0);
            assert.strictEqual(resUp.isPass, true);
        });

        it('5.6: Semester TBM 2-decimal rounding transitions across 8.994 vs 8.995 and 7.994 vs 7.995', () => {
            // Mean = 8.994 -> 8.99 (Giỏi)
            // 47 subjects with 9.0 + 3 subjects with 8.9 -> sum = 449.7, count = 50 -> rawTbm = 8.994
            const subs8994 = [
                ...Array.from({ length: 47 }, (_, i) => createSubjectFixture({ code: 'S_A_' + i, components: [createComponentFixture({ weight: 100, score: 9.0 })] })),
                ...Array.from({ length: 3 }, (_, i) => createSubjectFixture({ code: 'S_B_' + i, components: [createComponentFixture({ weight: 100, score: 8.9 })] }))
            ];
            const res8994 = ctx.calculateSemesterResults(subs8994, 2);
            assert.strictEqual(res8994.tbm, 8.99);
            assert.strictEqual(res8994.tbmStr, '8.99');
            assert.strictEqual(res8994.honor.title, 'Sinh viên Giỏi');

            // Mean = 8.995 -> 9.00 (Xuất Sắc)
            // 19 subjects with 9.0 + 1 subject with 8.9 -> sum = 179.9, count = 20 -> rawTbm = 8.995
            const subs8995 = [
                ...Array.from({ length: 19 }, (_, i) => createSubjectFixture({ code: 'S_A_' + i, components: [createComponentFixture({ weight: 100, score: 9.0 })] })),
                ...Array.from({ length: 1 }, (_, i) => createSubjectFixture({ code: 'S_B_' + i, components: [createComponentFixture({ weight: 100, score: 8.9 })] }))
            ];
            const res8995 = ctx.calculateSemesterResults(subs8995, 2);
            assert.strictEqual(res8995.tbm, 9.00);
            assert.strictEqual(res8995.tbmStr, '9.00');
            assert.strictEqual(res8995.honor.title, 'Sinh viên Xuất Sắc');

            // Mean = 7.994 -> 7.99 (Khá)
            // 47 subjects with 8.0 + 3 subjects with 7.9 -> sum = 399.7, count = 50 -> rawTbm = 7.994
            const subs7994 = [
                ...Array.from({ length: 47 }, (_, i) => createSubjectFixture({ code: 'S_A_' + i, components: [createComponentFixture({ weight: 100, score: 8.0 })] })),
                ...Array.from({ length: 3 }, (_, i) => createSubjectFixture({ code: 'S_B_' + i, components: [createComponentFixture({ weight: 100, score: 7.9 })] }))
            ];
            const res7994 = ctx.calculateSemesterResults(subs7994, 2);
            assert.strictEqual(res7994.tbm, 7.99);
            assert.strictEqual(res7994.tbmStr, '7.99');
            assert.strictEqual(res7994.honor.title, 'Sinh viên Khá');

            // Mean = 7.995 -> 8.00 (Giỏi)
            // 19 subjects with 8.0 + 1 subject with 7.9 -> sum = 159.9, count = 20 -> rawTbm = 7.995
            const subs7995 = [
                ...Array.from({ length: 19 }, (_, i) => createSubjectFixture({ code: 'S_A_' + i, components: [createComponentFixture({ weight: 100, score: 8.0 })] })),
                ...Array.from({ length: 1 }, (_, i) => createSubjectFixture({ code: 'S_B_' + i, components: [createComponentFixture({ weight: 100, score: 7.9 })] }))
            ];
            const res7995 = ctx.calculateSemesterResults(subs7995, 2);
            assert.strictEqual(res7995.tbm, 8.00);
            assert.strictEqual(res7995.tbmStr, '8.00');
            assert.strictEqual(res7995.honor.title, 'Sinh viên Giỏi');
        });

        it('5.7: Floating point unweighted mean invariance across multi-subject transcripts', () => {
            // 7 subjects with recurring values 8.3333333...
            const subs = Array.from({ length: 7 }, (_, i) => 
                createSubjectFixture({
                    code: `S_${i}`,
                    components: [createComponentFixture({ weight: 100, score: 8.0 + 1/3 })]
                })
            );
            const res = ctx.calculateSemesterResults(subs, 1);
            // Each subject rounds to 8.3. Mean of seven 8.3 is 8.30.
            assert.strictEqual(res.tbm, 8.30);
            assert.strictEqual(res.tbmStr, '8.30');
            assert.strictEqual(res.honor.title, 'Sinh viên Giỏi');
        });
    });

    // =========================================================================
    // SUITE 6: Export Sandbox Memory Leak Resilience & Error Recovery
    // =========================================================================
    describe('6. Export Sandbox Memory Leak Resilience & Viewport Rigidity', () => {
        it('6.1: High-stress 50 serial captures leave zero residual sandbox elements in document.body', async () => {
            const card = ctx.document.createElement('div');
            card.id = 'certificate-card';
            card.innerHTML = '<div>Certificate Content</div>';
            ctx.document.body.appendChild(card);

            for (let i = 0; i < 50; i++) {
                const canvas = await ctx.captureCertificateCardSandbox(card);
                assert.ok(canvas, `Capture ${i} failed to produce canvas`);
            }

            const residualInBody = ctx.document.body.children.some(c => c && c.id === 'certificate-export-sandbox');
            assert.strictEqual(residualInBody, false, 'Memory leak: sandbox div remained in document.body after captures');
        });

        it('6.2: Sandbox cleanup on html2canvas rejection (error recovery)', async () => {
            const card = ctx.document.createElement('div');
            card.id = 'certificate-card';
            ctx.document.body.appendChild(card);

            const failingCtx = loadAppSandbox({
                html2canvas: async () => {
                    throw new Error('Adversarial html2canvas crash');
                }
            });

            await assert.rejects(
                async () => {
                    await failingCtx.captureCertificateCardSandbox(card);
                },
                /Adversarial html2canvas crash/
            );

            const residualInBody = failingCtx.document.body.children.some(c => c && c.id === 'certificate-export-sandbox');
            assert.strictEqual(residualInBody, false, 'Sandbox leaked into DOM after rejection');
        });

        it('6.3: Sandbox enforces strict 800px fixed width regardless of viewport', async () => {
            let capturedSandboxWidth = null;
            const inspectingCtx = loadAppSandbox({
                html2canvas: async (element, options) => {
                    capturedSandboxWidth = element.style.width;
                    return { toBlob: (cb) => cb(new Uint8Array([1, 2, 3])), toDataURL: () => 'data:image/png;base64,ok' };
                }
            });

            const card = inspectingCtx.document.createElement('div');
            card.id = 'certificate-card';
            inspectingCtx.document.body.appendChild(card);

            await inspectingCtx.captureCertificateCardSandbox(card);
            assert.strictEqual(capturedSandboxWidth, '800px');
        });

        it('6.4: renderExportCard executes cleanly with empty subjects array without throwing', () => {
            const container = ctx.document.createElement('div');
            assert.doesNotThrow(() => {
                ctx.renderExportCard(container, 1, { subjects: [] });
            });
            assert.ok(container.innerHTML.includes('FPT UNIVERSITY'));
            assert.ok(container.innerHTML.includes('N/A'));
        });

        it('6.5: renderExportCard renders correct data across all edge semesters (0, 6, 8, 9)', () => {
            [0, 6, 8, 9].forEach(sem => {
                const container = ctx.document.createElement('div');
                assert.doesNotThrow(() => {
                    ctx.renderExportCard(container, sem);
                });
                assert.ok(container.innerHTML.includes('FPT UNIVERSITY'), `Header missing in semester ${sem}`);
                assert.ok(!container.innerHTML.includes('NaN'), `NaN leaked in semester ${sem} export card`);
            });
        });
    });

    // =========================================================================
    // SUITE 7: Curriculum Invariants & Schema Completeness
    // =========================================================================
    describe('7. Curriculum Invariants & Schema Completeness', () => {
        it('7.1: All 10 Curriculum Semesters (0 through 9) are sequentially defined with valid credits', () => {
            const semesters = CURRICULUM_SEMESTERS;
            assert.strictEqual(semesters.length, 10);

            semesters.forEach((sem, idx) => {
                assert.strictEqual(sem.semester, idx);
                assert.ok(sem.title || sem.name, `Semester ${idx} missing title`);
                assert.ok(Array.isArray(sem.subjects) && sem.subjects.length > 0, `Semester ${idx} has no subjects`);
            });
        });

        it('7.2: All 8 Combo Tracks define valid course arrays for semesters 5, 7, 8', () => {
            const tracks = COMBO_TRACKS;
            const requiredTracks = ['dotnet', 'react', 'ai', 'java', 'game', 'datascience', 'icdesign', 'japanese'];

            requiredTracks.forEach(trackKey => {
                const track = tracks[trackKey];
                assert.ok(track, `Track ${trackKey} missing`);
                assert.ok(track.courses[5] && track.courses[5].length >= 1, `Track ${trackKey} missing sem 5 courses`);
                assert.ok(track.courses[7] && track.courses[7].length >= 2, `Track ${trackKey} missing sem 7 courses`);
                assert.ok(track.courses[8] && track.courses[8].length >= 1, `Track ${trackKey} missing sem 8 courses`);
            });
        });

        it('7.3: Every course in all 8 combo tracks resolves to a schema with 100% assessment weights', () => {
            const tracks = COMBO_TRACKS;
            const schemas = SUBJECT_SCHEMAS;

            Object.entries(tracks).forEach(([trackId, track]) => {
                [5, 7, 8].forEach(sem => {
                    const courses = track.courses[sem];
                    courses.forEach(code => {
                        if (code === 'SE_COM4_ELE') return; // Slot placeholder in Sem 8
                        const schema = schemas[code];
                        assert.ok(schema, `Course ${code} in track ${trackId} sem ${sem} has no schema in data.js`);
                        if (schema.isScored) {
                            const totalWeight = schema.assessments.reduce((sum, a) => sum + a.weight, 0);
                            assert.strictEqual(totalWeight, 100, `Course ${code} assessments sum to ${totalWeight}%, expected 100%`);
                        }
                    });
                });
            });
        });

        it('7.4: All 5 Capstone Elective options have valid schemas with 100% weights and 10 credits', () => {
            const CAPSTONE_CODES = ['SEP490', 'SET490', 'EXE402', 'PIT490', 'GRC490'];
            const schemas = SUBJECT_SCHEMAS;

            CAPSTONE_CODES.forEach(code => {
                const schema = schemas[code];
                assert.ok(schema, `Capstone ${code} schema missing`);
                assert.strictEqual(schema.credits, 10, `Capstone ${code} credits expected 10, got ${schema.credits}`);
                assert.strictEqual(schema.isScored, true);
                const totalWeight = schema.assessments.reduce((sum, a) => sum + a.weight, 0);
                assert.strictEqual(totalWeight, 100, `Capstone ${code} weights sum to ${totalWeight}%, expected 100%`);
            });
        });
    });
});
