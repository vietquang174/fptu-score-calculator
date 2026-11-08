/**
 * Tier 5: Adversarial Coverage Hardening Test Suite (Challenger 2)
 * Milestone 4 Phase 2: White-box Combinatorial Stress Analysis
 * 
 * Target Probing Areas:
 * 1. Combinatorial swapping between all 8 elective combo tracks across Semesters 5, 7, 8 (all 56 directed pairs + multi-track loops).
 * 2. Score cache persistence engine across combo swaps (getSubjectCacheKey, slot tracking, detailed sub-values, zero scores).
 * 3. Non-scored condition courses (VOV114/124/134, LAB211, OTP101, PEN, OJT202) blocking honors across all semester configurations.
 * 4. Unweighted arithmetic mean vs credit-weighted mean contrasts across varied credit distribution subjects.
 * 5. Off-screen 800px export sandbox lifecycle, DOM leak prevention, and error resilience.
 */

const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const fs = require('node:fs');
const {
    loadAppSandbox,
    createSubjectFixture,
    createComponentFixture
} = require('./test_helper.js');

describe('Tier 5 Adversarial Hardening (Challenger 2)', () => {

    // =========================================================================
    // SECTION 1: ALL 8 ELECTIVE COMBO TRACKS & COMBINATORIAL SWAPPING
    // =========================================================================
    describe('1. Combinatorial Swapping Across All 8 Tracks (56 Directed Pairs)', () => {
        const ALL_TRACKS = ['dotnet', 'react', 'ai', 'java', 'game', 'datascience', 'icdesign', 'japanese'];

        it('T5-1-1: All 8 tracks exist in COMBO_TRACKS with proper definitions for Semesters 5, 7, 8', () => {
            const ctx = loadAppSandbox();
            assert.ok(ctx.COMBO_TRACKS, 'COMBO_TRACKS must be defined');

            ALL_TRACKS.forEach(trackId => {
                const track = ctx.COMBO_TRACKS[trackId];
                assert.ok(track, `Track "${trackId}" must exist`);
                assert.ok(track.courses[5] && track.courses[5].length > 0, `Track "${trackId}" must define Sem 5 courses`);
                assert.ok(track.courses[7] && track.courses[7].length === 2, `Track "${trackId}" must define exactly 2 Sem 7 courses`);
                assert.ok(track.courses[8] && track.courses[8].length === 1, `Track "${trackId}" must define 1 Sem 8 course`);
            });
        });

        it('T5-1-2: Exhaustive 56 directed pairwise transitions preserve independent score states', () => {
            const ctx = loadAppSandbox();
            ctx.initializeAppState();

            // Populate unique score signatures for each track in Semester 7
            ALL_TRACKS.forEach((trackId, tIdx) => {
                ctx.setComboTrack(trackId);
                const sem7Subs = ctx.AppState.semesterData[7];
                assert.ok(sem7Subs && sem7Subs.length === 5, `Sem 7 must have 5 subjects for track ${trackId}`);

                // The last two subjects are the combo courses (slots 2 & 3)
                const comboSub1 = sem7Subs[3];
                const comboSub2 = sem7Subs[4];
                assert.ok(comboSub1.isCombo, `Subject 3 in Sem 7 must be combo for track ${trackId}`);
                assert.ok(comboSub2.isCombo, `Subject 4 in Sem 7 must be combo for track ${trackId}`);

                // Assign unique distinguishable score: base = 5.0 + tIdx * 0.5
                const score1 = Math.min(10.0, 5.0 + tIdx * 0.5);
                const score2 = Math.min(10.0, 5.5 + tIdx * 0.5);

                if (comboSub1.components && comboSub1.components.length > 0) {
                    comboSub1.components[0].avgValue = String(score1);
                }
                if (comboSub2.components && comboSub2.components.length > 0) {
                    comboSub2.components[0].avgValue = String(score2);
                }

                // Explicitly cache
                ctx.evalInContext(`cacheSubjectScores(AppState.semesterData[7][3])`);
                ctx.evalInContext(`cacheSubjectScores(AppState.semesterData[7][4])`);
            });

            // Now test all 56 directed pairs (trackA -> trackB -> trackA)
            let transitionsTested = 0;
            for (let i = 0; i < ALL_TRACKS.length; i++) {
                for (let j = 0; j < ALL_TRACKS.length; j++) {
                    if (i === j) continue;
                    const trackA = ALL_TRACKS[i];
                    const trackB = ALL_TRACKS[j];

                    // Transition to trackB
                    ctx.setComboTrack(trackB);
                    const bExpectedScore1 = Math.min(10.0, 5.0 + j * 0.5);
                    const bActual1 = parseFloat(ctx.AppState.semesterData[7][3].components[0].avgValue);
                    assert.strictEqual(bActual1, bExpectedScore1, `Track ${trackB} score must match its signature on swap from ${trackA}`);

                    // Transition back to trackA
                    ctx.setComboTrack(trackA);
                    const aExpectedScore1 = Math.min(10.0, 5.0 + i * 0.5);
                    const aActual1 = parseFloat(ctx.AppState.semesterData[7][3].components[0].avgValue);
                    assert.strictEqual(aActual1, aExpectedScore1, `Track ${trackA} score must be restored after visiting ${trackB}`);

                    transitionsTested++;
                }
            }
            assert.strictEqual(transitionsTested, 56, 'Must test exactly 56 directed transitions');
        });

        it('T5-1-3: Multi-track circular daisy-chain cycling (10 full cycles = 80 swaps) shows zero degradation', () => {
            const ctx = loadAppSandbox();
            ctx.initializeAppState();

            // Set up initial state with unique data in Sem 5
            ALL_TRACKS.forEach((trackId, idx) => {
                ctx.setComboTrack(trackId);
                const sem5Combo = ctx.AppState.semesterData[5].find(s => s.isCombo);
                assert.ok(sem5Combo, `Sem 5 combo subject must exist for ${trackId}`);
                if (sem5Combo.components && sem5Combo.components.length > 0) {
                    sem5Combo.components[0].avgValue = String(6.0 + idx * 0.4);
                    ctx.evalInContext(`cacheSubjectScores(AppState.semesterData[5].find(s => s.isCombo))`);
                }
            });

            // Cycle 10 times through all 8 tracks
            for (let cycle = 0; cycle < 10; cycle++) {
                for (let idx = 0; idx < ALL_TRACKS.length; idx++) {
                    const trackId = ALL_TRACKS[idx];
                    ctx.setComboTrack(trackId);
                    const sem5Combo = ctx.AppState.semesterData[5].find(s => s.isCombo);
                    const expectedScore = 6.0 + idx * 0.4;
                    const actualScore = parseFloat(sem5Combo.components[0].avgValue);
                    assert.strictEqual(actualScore, expectedScore, `Cycle ${cycle}: Track ${trackId} score must remain exact`);
                }
            }
        });

        it('T5-1-4: Non-combo core subjects in Semesters 5, 7, 8 remain invariant across combo track changes', () => {
            const ctx = loadAppSandbox();
            ctx.initializeAppState();

            // Enter scores for core subjects in Sem 5, 7, 8
            ctx.setComboTrack('dotnet');
            const swp391 = ctx.AppState.semesterData[5].find(s => s.code === 'SWP391');
            const swd392 = ctx.AppState.semesterData[7].find(s => s.code === 'SWD392');
            const prm393 = ctx.AppState.semesterData[8].find(s => s.code === 'PRM393');

            assert.ok(swp391, 'SWP391 must exist');
            assert.ok(swd392, 'SWD392 must exist');
            assert.ok(prm393, 'PRM393 must exist');

            swp391.components[0].avgValue = '8.5';
            swd392.components[0].avgValue = '9.0';
            prm393.components[0].avgValue = '9.5';

            // Swap through all other 7 tracks
            ALL_TRACKS.forEach(otherTrack => {
                ctx.setComboTrack(otherTrack);

                const s5Core = ctx.AppState.semesterData[5].find(s => s.code === 'SWP391');
                const s7Core = ctx.AppState.semesterData[7].find(s => s.code === 'SWD392');
                const s8Core = ctx.AppState.semesterData[8].find(s => s.code === 'PRM393');

                assert.strictEqual(s5Core.components[0].avgValue, '8.5', `SWP391 preserved under ${otherTrack}`);
                assert.strictEqual(s7Core.components[0].avgValue, '9.0', `SWD392 preserved under ${otherTrack}`);
                assert.strictEqual(s8Core.components[0].avgValue, '9.5', `PRM393 preserved under ${otherTrack}`);
            });
        });
    });

    // =========================================================================
    // SECTION 2: SCORE CACHE PERSISTENCE ENGINE (`getSubjectCacheKey`)
    // =========================================================================
    describe('2. Score Cache Persistence Engine Stress', () => {

        it('T5-2-1: getSubjectCacheKey handles comboSlot, unslotted subjects, and defensive null inputs', () => {
            const ctx = loadAppSandbox();

            // Slotted subject
            const keyWithSlot = ctx.evalInContext(`getSubjectCacheKey({ code: 'PRN222', comboSlot: 2 })`);
            assert.strictEqual(keyWithSlot, 'PRN222_slot_2');

            // Unslotted subject
            const keyWithoutSlot = ctx.evalInContext(`getSubjectCacheKey({ code: 'PRF192' })`);
            assert.strictEqual(keyWithoutSlot, 'PRF192');

            // Defensive invalid inputs
            assert.strictEqual(ctx.evalInContext(`getSubjectCacheKey(null)`), null);
            assert.strictEqual(ctx.evalInContext(`getSubjectCacheKey({})`), null);
            assert.strictEqual(ctx.evalInContext(`getSubjectCacheKey({ code: '' })`), null);
        });

        it('T5-2-2: Sub-values array and component mode ("detailed" vs "average") preserved across caching', () => {
            const ctx = loadAppSandbox();
            ctx.initializeAppState();

            // PRN212 has component "pt" with parts: 2 (Progress test)
            ctx.setComboTrack('dotnet');
            const sub = ctx.AppState.semesterData[5].find(s => s.isCombo); // PRN212
            assert.ok(sub);

            const ptComp = sub.components.find(c => c.id === 'pt');
            assert.ok(ptComp, 'Progress test component must exist on PRN212');
            assert.strictEqual(ptComp.parts, 2, 'PRN212 PT has 2 parts');

            ptComp.mode = 'detailed';
            ptComp.subValues = ['8.5', '9.5'];

            // Cache
            ctx.evalInContext(`cacheSubjectScores(AppState.semesterData[5].find(s => s.isCombo))`);

            // Switch to react track and verify PRN212 is not displayed
            ctx.setComboTrack('react');
            const reactCombo = ctx.AppState.semesterData[5].find(s => s.isCombo);
            assert.strictEqual(reactCombo.code, 'FER202');

            // Switch back to dotnet track
            ctx.setComboTrack('dotnet');
            const restoredSub = ctx.AppState.semesterData[5].find(s => s.isCombo);
            assert.strictEqual(restoredSub.code, 'PRN212');

            const restoredPt = restoredSub.components.find(c => c.id === 'pt');
            assert.strictEqual(restoredPt.mode, 'detailed', 'Mode must be detailed');
            assert.deepStrictEqual(restoredPt.subValues, ['8.5', '9.5'], 'Sub-values must match');
        });

        it('T5-2-3: Distinct handling of numeric zero ("0") vs empty string ("") in cache', () => {
            const ctx = loadAppSandbox();
            ctx.initializeAppState();

            ctx.setComboTrack('ai');
            const aiSub = ctx.AppState.semesterData[5].find(s => s.isCombo); // PRP201c
            assert.ok(aiSub);

            // Component 0: score = "0" (deliberate zero)
            // Component 1: score = "" (empty / unentered)
            if (aiSub.components.length >= 2) {
                aiSub.components[0].avgValue = '0';
                aiSub.components[1].avgValue = '';
            } else if (aiSub.components.length === 1) {
                aiSub.components[0].avgValue = '0';
            }

            ctx.evalInContext(`cacheSubjectScores(AppState.semesterData[5].find(s => s.isCombo))`);

            // Switch away and back
            ctx.setComboTrack('dotnet');
            ctx.setComboTrack('ai');

            const restoredAi = ctx.AppState.semesterData[5].find(s => s.isCombo);
            assert.strictEqual(restoredAi.components[0].avgValue, '0', '"0" must be preserved as zero, not converted to empty');
            if (restoredAi.components.length >= 2) {
                assert.strictEqual(restoredAi.components[1].avgValue, '', 'Empty string must remain empty string');
            }
        });

        it('T5-2-4: Condition course passStatus toggle survives subject-level cache persistence', () => {
            const ctx = loadAppSandbox();
            ctx.initializeAppState();

            const lab211 = ctx.AppState.semesterData[3].find(s => s.code === 'LAB211');
            assert.ok(lab211, 'LAB211 must exist in Sem 3');
            assert.strictEqual(lab211.passStatus, 'pass', 'Default is pass');

            // Change to fail and cache
            lab211.passStatus = 'fail';
            ctx.evalInContext(`cacheSubjectScores(AppState.semesterData[3].find(s => s.code === 'LAB211'))`);

            // Restore into a fresh object
            const freshLab = ctx.createSubjectState({ code: 'LAB211', isPassFailOnly: true });
            ctx.evalInContext('restoreSubjectScores')(freshLab);

            assert.strictEqual(freshLab.passStatus, 'fail', 'passStatus "fail" must be restored from cache');
        });

        it('T5-2-5: Capstone elective swapping in Semester 9 preserves independent cache keys', () => {
            const ctx = loadAppSandbox();
            ctx.initializeAppState();

            // Set SEP490 score
            ctx.setCapstoneElective('SEP490');
            const sep = ctx.AppState.semesterData[9].find(s => s.isCapstone);
            assert.strictEqual(sep.code, 'SEP490');
            sep.components[0].avgValue = '8.8';
            ctx.evalInContext(`cacheSubjectScores(AppState.semesterData[9].find(s => s.isCapstone))`);

            // Set SET490 score
            ctx.setCapstoneElective('SET490');
            const set = ctx.AppState.semesterData[9].find(s => s.isCapstone);
            assert.strictEqual(set.code, 'SET490');
            set.components[0].avgValue = '9.4';
            ctx.evalInContext(`cacheSubjectScores(AppState.semesterData[9].find(s => s.isCapstone))`);

            // Switch back to SEP490
            ctx.setCapstoneElective('SEP490');
            const restoredSep = ctx.AppState.semesterData[9].find(s => s.isCapstone);
            assert.strictEqual(restoredSep.code, 'SEP490');
            assert.strictEqual(restoredSep.components[0].avgValue, '8.8', 'SEP490 score restored');

            // Switch back to SET490
            ctx.setCapstoneElective('SET490');
            const restoredSet = ctx.AppState.semesterData[9].find(s => s.isCapstone);
            assert.strictEqual(restoredSet.code, 'SET490');
            assert.strictEqual(restoredSet.components[0].avgValue, '9.4', 'SET490 score restored');
        });
    });

    // =========================================================================
    // SECTION 3: NON-SCORED CONDITION COURSES HONORS BLOCKING MATRIX
    // =========================================================================
    describe('3. Condition Courses Honors Blocking Matrix Across Semesters', () => {

        it('T5-3-1: Semester 0: Failure in any condition course (VOV114, PEN, OTP101) blocks honors despite perfect 10 in DTR103', () => {
            const ctx = loadAppSandbox();

            // Helper to build Sem 0 subjects
            const buildSem0 = ({ vovPass = true, penPass = true, otpPass = true, dtrScore = 10.0 } = {}) => [
                createSubjectFixture({
                    code: 'TMI_ELE',
                    nameVi: 'Nhạc cụ truyền thống',
                    credits: 3,
                    isScored: true,
                    components: [createComponentFixture({ weight: 100, score: dtrScore, minScore: 4.0, isFE: true })]
                }),
                createSubjectFixture({
                    code: 'PHE_COM*1',
                    nameVi: 'Vovinam 1',
                    credits: 2,
                    isScored: false,
                    isPhysicalEducation: true,
                    components: [createComponentFixture({ weight: 100, score: vovPass ? 8.0 : 4.5, minScore: 5.0, isFE: true })]
                }),
                createSubjectFixture({
                    code: 'PEN',
                    nameVi: 'Tiếng Anh chuẩn bị',
                    credits: 0,
                    isScored: false,
                    isPassFailOnly: true,
                    passStatus: penPass ? 'pass' : 'fail'
                }),
                createSubjectFixture({
                    code: 'OTP101',
                    nameVi: 'Định hướng & Rèn luyện',
                    credits: 0,
                    isScored: false,
                    isPassFailOnly: true,
                    passStatus: otpPass ? 'pass' : 'fail'
                })
            ];

            // 1. VOV114 fails (FE = 4.5 < 5.0)
            const resVovFail = ctx.calculateSemesterResults(buildSem0({ vovPass: false }), 0);
            assert.strictEqual(resVovFail.isPassed, false, 'VOV fail must make isPassed false');
            assert.strictEqual(resVovFail.honor.level, 'fail', 'VOV fail must force honor to fail');
            assert.strictEqual(resVovFail.honor.isCocVang, false, 'No Cóc Vàng if VOV fails');
            assert.ok(resVovFail.failedSubjectCodes.includes('PHE_COM*1'), 'PHE_COM*1 in failedSubjectCodes');

            // 2. PEN fails
            const resPenFail = ctx.calculateSemesterResults(buildSem0({ penPass: false }), 0);
            assert.strictEqual(resPenFail.isPassed, false);
            assert.strictEqual(resPenFail.honor.level, 'fail');
            assert.ok(resPenFail.failedSubjectCodes.includes('PEN'));

            // 3. OTP101 fails
            const resOtpFail = ctx.calculateSemesterResults(buildSem0({ otpPass: false }), 0);
            assert.strictEqual(resOtpFail.isPassed, false);
            assert.strictEqual(resOtpFail.honor.level, 'fail');
            assert.ok(resOtpFail.failedSubjectCodes.includes('OTP101'));

            // 4. All pass
            const resAllPass = ctx.calculateSemesterResults(buildSem0({}), 0);
            assert.strictEqual(resAllPass.isPassed, true);
            assert.strictEqual(resAllPass.tbm, 10.00);
            assert.strictEqual(resAllPass.honor.level, 'cocvang');
            assert.strictEqual(resAllPass.honor.isCocVang, true);
        });

        it('T5-3-2: Semester 1: Failure in VOV124 (PHE_COM*2) blocks honors despite all 5 scored courses having 9.8', () => {
            const ctx = loadAppSandbox();

            const subjects = [
                createSubjectFixture({ code: 'PRF192', isScored: true, components: [createComponentFixture({ score: 9.8 })] }),
                createSubjectFixture({ code: 'MAE101', isScored: true, components: [createComponentFixture({ score: 9.8 })] }),
                createSubjectFixture({ code: 'CEA201', isScored: true, components: [createComponentFixture({ score: 9.8 })] }),
                createSubjectFixture({ code: 'CSI106', isScored: true, components: [createComponentFixture({ score: 9.8 })] }),
                createSubjectFixture({ code: 'SSL101c', isScored: true, components: [createComponentFixture({ score: 9.8 })] }),
                createSubjectFixture({
                    code: 'PHE_COM*2',
                    isScored: false,
                    isPhysicalEducation: true,
                    components: [createComponentFixture({ weight: 100, score: 4.8, minScore: 5.0, isFE: true })] // FAIL (< 5.0)
                })
            ];

            const res = ctx.calculateSemesterResults(subjects, 1);
            assert.strictEqual(res.tbm, 9.80, 'TBM is computed from scored courses');
            assert.strictEqual(res.isPassed, false, 'Semester is NOT PASSED');
            assert.strictEqual(res.honor.level, 'fail', 'Honor level must be fail');
            assert.strictEqual(res.honor.isCocVang, false);
            assert.strictEqual(res.honor.isTop100, false);
            assert.ok(res.failedSubjectCodes.includes('PHE_COM*2'));
        });

        it('T5-3-3: Semester 2: Failure in VOV134 (PHE_COM*3) blocks honors despite all 5 scored courses having 9.5', () => {
            const ctx = loadAppSandbox();

            const subjects = [
                createSubjectFixture({ code: 'MAD101', isScored: true, components: [createComponentFixture({ score: 9.5 })] }),
                createSubjectFixture({ code: 'PRO192', isScored: true, components: [createComponentFixture({ score: 9.5 })] }),
                createSubjectFixture({ code: 'OSG202', isScored: true, components: [createComponentFixture({ score: 9.5 })] }),
                createSubjectFixture({ code: 'NWC204', isScored: true, components: [createComponentFixture({ score: 9.5 })] }),
                createSubjectFixture({ code: 'WED201c', isScored: true, components: [createComponentFixture({ score: 9.5 })] }),
                createSubjectFixture({
                    code: 'PHE_COM*3',
                    isScored: false,
                    isPhysicalEducation: true,
                    components: [createComponentFixture({ weight: 100, score: 4.0, minScore: 5.0, isFE: true })] // FAIL
                })
            ];

            const res = ctx.calculateSemesterResults(subjects, 2);
            assert.strictEqual(res.tbm, 9.50);
            assert.strictEqual(res.isPassed, false);
            assert.strictEqual(res.honor.level, 'fail');
            assert.strictEqual(res.honor.isTop100, false);
            assert.ok(res.failedSubjectCodes.includes('PHE_COM*3'));
        });

        it('T5-3-4: Semester 3: Failure in LAB211 blocks honors despite all 4 scored courses having 9.2', () => {
            const ctx = loadAppSandbox();

            const subjects = [
                createSubjectFixture({ code: 'DBI202', isScored: true, components: [createComponentFixture({ score: 9.2 })] }),
                createSubjectFixture({ code: 'MAS291', isScored: true, components: [createComponentFixture({ score: 9.2 })] }),
                createSubjectFixture({ code: 'SWE202c', isScored: true, components: [createComponentFixture({ score: 9.2 })] }),
                createSubjectFixture({ code: 'JPD113', isScored: true, components: [createComponentFixture({ score: 9.2 })] }),
                createSubjectFixture({
                    code: 'LAB211',
                    isScored: false,
                    isPassFailOnly: true,
                    passStatus: 'fail' // FAIL
                })
            ];

            const res = ctx.calculateSemesterResults(subjects, 3);
            assert.strictEqual(res.tbm, 9.20);
            assert.strictEqual(res.isPassed, false);
            assert.strictEqual(res.honor.level, 'fail');
            assert.ok(res.failedSubjectCodes.includes('LAB211'));
        });

        it('T5-3-5: Semester 6: Failure in OJT202 blocks honors despite 10.0 in ENW493c', () => {
            const ctx = loadAppSandbox();

            const subjects = [
                createSubjectFixture({
                    code: 'OJT202',
                    credits: 10,
                    isScored: false,
                    isPassFailOnly: true,
                    passStatus: 'fail' // FAIL
                }),
                createSubjectFixture({
                    code: 'ENW493c',
                    credits: 3,
                    isScored: true,
                    components: [createComponentFixture({ score: 10.0 })]
                })
            ];

            const res = ctx.calculateSemesterResults(subjects, 6);
            assert.strictEqual(res.tbm, 10.00);
            assert.strictEqual(res.isPassed, false);
            assert.strictEqual(res.honor.level, 'fail');
            assert.strictEqual(res.honor.isCocVang, false);
            assert.strictEqual(res.honor.isTop100, false);
            assert.ok(res.failedSubjectCodes.includes('OJT202'));
        });

        it('T5-3-6: Multiple condition failures catalog every failing course code simultaneously', () => {
            const ctx = loadAppSandbox();

            const sem0Subs = [
                createSubjectFixture({ code: 'TMI_ELE', isScored: true, components: [createComponentFixture({ score: 9.0 })] }),
                createSubjectFixture({
                    code: 'PHE_COM*1',
                    isScored: false,
                    isPhysicalEducation: true,
                    components: [createComponentFixture({ weight: 100, score: 3.5, minScore: 5.0, isFE: true })]
                }),
                createSubjectFixture({ code: 'PEN', isScored: false, isPassFailOnly: true, passStatus: 'fail' }),
                createSubjectFixture({ code: 'OTP101', isScored: false, isPassFailOnly: true, passStatus: 'fail' })
            ];

            const res = ctx.calculateSemesterResults(sem0Subs, 0);
            assert.strictEqual(res.isPassed, false);
            assert.strictEqual(res.failedSubjectCodes.length, 3);
            assert.ok(res.failedSubjectCodes.includes('PHE_COM*1'));
            assert.ok(res.failedSubjectCodes.includes('PEN'));
            assert.ok(res.failedSubjectCodes.includes('OTP101'));
        });
    });

    // =========================================================================
    // SECTION 4: UNWEIGHTED ARITHMETIC MEAN VS CREDIT-WEIGHTED CONTRASTS
    // =========================================================================
    describe('4. Unweighted Arithmetic Mean vs Credit-Weighted Contrasts', () => {

        it('T5-4-1: Semester 9 Disparity: Capstone (10 credits)=6.0, Political (3x2 credits)=10.0 yields unweighted 9.00 vs credit-weighted 7.50', () => {
            const ctx = loadAppSandbox();

            const subjects = [
                createSubjectFixture({
                    code: 'SEP490',
                    credits: 10,
                    isScored: true,
                    isCapstone: true,
                    components: [createComponentFixture({ score: 6.0 })]
                }),
                createSubjectFixture({
                    code: 'HCM202',
                    credits: 2,
                    isScored: true,
                    components: [createComponentFixture({ score: 10.0 })]
                }),
                createSubjectFixture({
                    code: 'MLN131',
                    credits: 2,
                    isScored: true,
                    components: [createComponentFixture({ score: 10.0 })]
                }),
                createSubjectFixture({
                    code: 'VNR202',
                    credits: 2,
                    isScored: true,
                    components: [createComponentFixture({ score: 10.0 })]
                })
            ];

            const res = ctx.calculateSemesterResults(subjects, 9);

            // Calculation contrast:
            // Unweighted arithmetic mean: (6.0 + 10.0 + 10.0 + 10.0) / 4 = 36.0 / 4 = 9.00
            // Credit-weighted mean: (6*10 + 10*2 + 10*2 + 10*2) / (10+2+2+2) = 120 / 16 = 7.50
            assert.strictEqual(res.tbm, 9.00, 'Must be exact unweighted arithmetic mean 9.00, NOT credit-weighted 7.50');
            assert.strictEqual(res.tbmStr, '9.00');
            assert.strictEqual(res.honor.level, 'xuatsac', '9.00 in Sem 9 qualifies for Sinh viên Xuất Sắc');
            assert.strictEqual(res.honor.isCocVang, false, 'Cóc Vàng strictly suppressed in Sem 9');
            assert.strictEqual(res.honor.isTop100, false, 'Top 100 strictly suppressed in Sem 9');
        });

        it('T5-4-2: Semester 9 Inverse Disparity: Capstone (10 credits)=10.0, Political (3x2 credits)=5.0 yields unweighted 6.25 vs credit-weighted 8.13', () => {
            const ctx = loadAppSandbox();

            const subjects = [
                createSubjectFixture({
                    code: 'SEP490',
                    credits: 10,
                    isScored: true,
                    isCapstone: true,
                    components: [createComponentFixture({ score: 10.0 })]
                }),
                createSubjectFixture({
                    code: 'HCM202',
                    credits: 2,
                    isScored: true,
                    components: [createComponentFixture({ score: 5.0 })]
                }),
                createSubjectFixture({
                    code: 'MLN131',
                    credits: 2,
                    isScored: true,
                    components: [createComponentFixture({ score: 5.0 })]
                }),
                createSubjectFixture({
                    code: 'VNR202',
                    credits: 2,
                    isScored: true,
                    components: [createComponentFixture({ score: 5.0 })]
                })
            ];

            const res = ctx.calculateSemesterResults(subjects, 9);

            // Calculation contrast:
            // Unweighted arithmetic mean: (10.0 + 5.0 + 5.0 + 5.0) / 4 = 25.0 / 4 = 6.25
            // Credit-weighted mean: (10*10 + 5*2 + 5*2 + 5*2) / 16 = 130 / 16 = 8.125 -> 8.13
            assert.strictEqual(res.tbm, 6.25, 'Must be exact unweighted arithmetic mean 6.25, NOT credit-weighted 8.13');
            assert.strictEqual(res.tbmStr, '6.25');
            assert.strictEqual(res.honor.level, 'pass', '6.25 qualifies for Đạt (Pass)');
        });

        it('T5-4-3: Semester 8 Mixed Credit Disparity: 5 subjects x 3 credits @ 9.0, 1 subject x 2 credits (MLN122) @ 6.0 yields unweighted 8.50 vs credit-weighted 8.65', () => {
            const ctx = loadAppSandbox();

            const subjects = [
                createSubjectFixture({ code: 'PRM393', credits: 3, isScored: true, components: [createComponentFixture({ score: 9.0 })] }),
                createSubjectFixture({ code: 'ITE302c', credits: 3, isScored: true, components: [createComponentFixture({ score: 9.0 })] }),
                createSubjectFixture({ code: 'EXE201', credits: 3, isScored: true, components: [createComponentFixture({ score: 9.0 })] }),
                createSubjectFixture({ code: 'MLN111', credits: 3, isScored: true, components: [createComponentFixture({ score: 9.0 })] }),
                createSubjectFixture({ code: 'SE_COM4', credits: 3, isScored: true, components: [createComponentFixture({ score: 9.0 })] }),
                createSubjectFixture({ code: 'MLN122', credits: 2, isScored: true, components: [createComponentFixture({ score: 6.0 })] })
            ];

            const res = ctx.calculateSemesterResults(subjects, 8);

            // Calculation contrast:
            // Unweighted arithmetic mean: (9*5 + 6) / 6 = 51 / 6 = 8.50
            // Credit-weighted mean: (9*15 + 6*2) / 17 = 147 / 17 = 8.647 -> 8.65
            assert.strictEqual(res.tbm, 8.50, 'Must be exact unweighted arithmetic mean 8.50, NOT credit-weighted 8.65');
            assert.strictEqual(res.tbmStr, '8.50');
            assert.strictEqual(res.honor.level, 'gioi');
            assert.strictEqual(res.honor.isCocVang, false);
            assert.strictEqual(res.honor.isTop100, false);
        });

        it('T5-4-4: Semester 6: OJT202 (10 credits) is completely excluded from TBM calculation', () => {
            const ctx = loadAppSandbox();

            const subjects = [
                createSubjectFixture({
                    code: 'OJT202',
                    credits: 10,
                    isScored: false,
                    isPassFailOnly: true,
                    passStatus: 'pass'
                }),
                createSubjectFixture({
                    code: 'ENW493c',
                    credits: 3,
                    isScored: true,
                    components: [createComponentFixture({ score: 8.6 })]
                })
            ];

            const res = ctx.calculateSemesterResults(subjects, 6);
            assert.strictEqual(res.tbm, 8.60, 'TBM reflects solely ENW493c (8.60)');
            assert.strictEqual(res.tbmStr, '8.60');
            assert.strictEqual(res.completedScoredCount, 1);
            assert.strictEqual(res.totalScoredCount, 1);
        });

        it('T5-4-5: Multi-subject unweighted arithmetic mean rounding with 1-decimal subject scores', () => {
            const ctx = loadAppSandbox();

            // Test 1: 4 subjects with 1-decimal final scores [8.4, 8.4, 8.5, 8.5]
            // Sum = 33.8 -> mean = 33.8 / 4 = 8.450 -> rounds to 8.45 (Sinh viên Giỏi: 8.0 - 8.99)
            const subSetA = [
                createSubjectFixture({ isScored: true, components: [createComponentFixture({ score: 8.4 })] }),
                createSubjectFixture({ isScored: true, components: [createComponentFixture({ score: 8.4 })] }),
                createSubjectFixture({ isScored: true, components: [createComponentFixture({ score: 8.5 })] }),
                createSubjectFixture({ isScored: true, components: [createComponentFixture({ score: 8.5 })] })
            ];
            const resA = ctx.calculateSemesterResults(subSetA, 1);
            assert.strictEqual(resA.tbm, 8.45);
            assert.strictEqual(resA.tbmStr, '8.45');
            assert.strictEqual(resA.honor.level, 'gioi');

            // Test 2: 4 subjects with scores [7.4, 7.4, 7.4, 7.5]
            // Sum = 29.7 -> mean = 29.7 / 4 = 7.425 -> rounds to 7.43 (Sinh viên Khá: 7.0 - 7.99)
            const subSetB = [
                createSubjectFixture({ isScored: true, components: [createComponentFixture({ score: 7.4 })] }),
                createSubjectFixture({ isScored: true, components: [createComponentFixture({ score: 7.4 })] }),
                createSubjectFixture({ isScored: true, components: [createComponentFixture({ score: 7.4 })] }),
                createSubjectFixture({ isScored: true, components: [createComponentFixture({ score: 7.5 })] })
            ];
            const resB = ctx.calculateSemesterResults(subSetB, 1);
            assert.strictEqual(resB.tbm, 7.43);
            assert.strictEqual(resB.tbmStr, '7.43');
            assert.strictEqual(resB.honor.level, 'kha');

            // Test 3: Top 100 boundary at 9.20: 4 subjects [9.2, 9.2, 9.1, 9.3] -> mean = 36.8 / 4 = 9.20
            const subSetC = [
                createSubjectFixture({ isScored: true, components: [createComponentFixture({ score: 9.2 })] }),
                createSubjectFixture({ isScored: true, components: [createComponentFixture({ score: 9.2 })] }),
                createSubjectFixture({ isScored: true, components: [createComponentFixture({ score: 9.1 })] }),
                createSubjectFixture({ isScored: true, components: [createComponentFixture({ score: 9.3 })] })
            ];
            const resC = ctx.calculateSemesterResults(subSetC, 1);
            assert.strictEqual(resC.tbm, 9.20);
            assert.strictEqual(resC.honor.level, 'top100');
            assert.strictEqual(resC.honor.isTop100, true);

            // Test 4: Cóc Vàng boundary at 9.60: 5 subjects [9.6, 9.6, 9.6, 9.6, 9.6] -> mean = 9.60
            const subSetD = [
                createSubjectFixture({ isScored: true, components: [createComponentFixture({ score: 9.6 })] }),
                createSubjectFixture({ isScored: true, components: [createComponentFixture({ score: 9.6 })] }),
                createSubjectFixture({ isScored: true, components: [createComponentFixture({ score: 9.6 })] }),
                createSubjectFixture({ isScored: true, components: [createComponentFixture({ score: 9.6 })] }),
                createSubjectFixture({ isScored: true, components: [createComponentFixture({ score: 9.6 })] })
            ];
            const resD = ctx.calculateSemesterResults(subSetD, 1);
            assert.strictEqual(resD.tbm, 9.60);
            assert.strictEqual(resD.honor.level, 'cocvang');
            assert.strictEqual(resD.honor.isCocVang, true);
        });
    });

    // =========================================================================
    // SECTION 5: OFF-SCREEN 800PX EXPORT SANDBOX LIFECYCLE & STRESS
    // =========================================================================
    describe('5. Off-screen 800px Export Sandbox Lifecycle Stress', () => {

        it('T5-5-1: 50 consecutive capture cycles leave ZERO leftover sandbox elements in DOM', async () => {
            const ctx = loadAppSandbox();
            const sourceCard = ctx.document.createElement('div');
            sourceCard.id = 'certificate-card';
            sourceCard.innerHTML = '<p>Test Card Content</p>';
            ctx.document.body.appendChild(sourceCard);

            const captureFn = ctx.evalInContext('captureCertificateCardSandbox');

            for (let i = 0; i < 50; i++) {
                const canvas = await captureFn(sourceCard);
                assert.ok(canvas, `Cycle ${i} must return canvas object`);

                // Assert no sandbox element remains attached to document.body
                const isAttached = ctx.document.body.children.some(c => c && c.id === 'certificate-export-sandbox');
                assert.strictEqual(isAttached, false, `Cycle ${i}: Zero leftover sandbox elements in document.body`);
                assert.strictEqual(ctx.document.body.children.length, 1, 'Body children count must remain 1');
            }
        });

        it('T5-5-2: Error thrown inside html2canvas is cleanly caught and sandbox removed in finally block', async () => {
            const ctx = loadAppSandbox({
                html2canvas: async () => {
                    throw new Error('Adversarial canvas rendering crash simulation');
                }
            });

            const sourceCard = ctx.document.createElement('div');
            sourceCard.id = 'certificate-card';
            ctx.document.body.appendChild(sourceCard);

            const captureFn = ctx.evalInContext('captureCertificateCardSandbox');

            let threwError = false;
            try {
                await captureFn(sourceCard);
            } catch (err) {
                threwError = true;
                assert.ok(err.message.includes('Adversarial canvas rendering crash simulation'));
            }

            assert.strictEqual(threwError, true, 'Error must propagate to caller');

            // Assert sandbox element was still cleaned up by finally block
            const isAttached = ctx.document.body.children.some(c => c && c.id === 'certificate-export-sandbox');
            assert.strictEqual(isAttached, false, 'Sandbox must be cleaned up from document.body even after crash');
            assert.strictEqual(ctx.document.body.children.length, 1, 'Body children count must remain 1');
        });

        it('T5-5-3: Cloned sandbox element enforces exact fixed 800px width and styles', async () => {
            let capturedSandboxProps = null;

            const ctx = loadAppSandbox({
                html2canvas: async (element, options) => {
                    capturedSandboxProps = {
                        width: element.style.width,
                        minWidth: element.style.minWidth,
                        maxWidth: element.style.maxWidth,
                        backgroundColor: element.style.backgroundColor,
                        optionsWidth: options.width,
                        optionsWindowWidth: options.windowWidth,
                        optionsScale: options.scale
                    };
                    return { toDataURL: () => 'data:image/png;base64,mock' };
                }
            });

            const sourceCard = ctx.document.createElement('div');
            sourceCard.id = 'certificate-card';
            sourceCard.style.width = '375px'; // mobile width on source
            ctx.document.body.appendChild(sourceCard);

            const captureFn = ctx.evalInContext('captureCertificateCardSandbox');
            await captureFn(sourceCard);

            assert.ok(capturedSandboxProps, 'Sandbox props must be captured');
            assert.strictEqual(capturedSandboxProps.width, '800px', 'Clone must be enforced to 800px width');
            assert.strictEqual(capturedSandboxProps.minWidth, '800px', 'Clone minWidth must be 800px');
            assert.strictEqual(capturedSandboxProps.maxWidth, '800px', 'Clone maxWidth must be 800px');
            assert.strictEqual(capturedSandboxProps.optionsWidth, 800, 'html2canvas options.width must be 800');
            assert.strictEqual(capturedSandboxProps.optionsWindowWidth, 800, 'html2canvas options.windowWidth must be 800');
            assert.strictEqual(capturedSandboxProps.optionsScale, 2, 'html2canvas options.scale must be 2 (retina sharpness)');
        });

        it('T5-5-4: renderExportCard generates correct content and badge suppression for Semester 6, 8, 9', () => {
            const ctx = loadAppSandbox();
            ctx.initializeAppState();

            const card = ctx.document.createElement('div');
            card.id = 'certificate-card';
            ctx.document.body.appendChild(card);

            // 1. Render Sem 6
            ctx.renderExportCard(card, 6);
            assert.ok(card.innerHTML.includes('OJT202'), 'Sem 6 export card must contain OJT202');
            assert.ok(card.innerHTML.includes('ENW493c'), 'Sem 6 export card must contain ENW493c');
            assert.ok(!card.innerHTML.includes('CÓC VÀNG'), 'Sem 6 export card must not contain Cóc Vàng');

            // 2. Render Sem 8 with high scores
            const sem8Subs = [
                createSubjectFixture({ code: 'PRM393', isScored: true, components: [createComponentFixture({ score: 9.8 })] }),
                createSubjectFixture({ code: 'ITE302c', isScored: true, components: [createComponentFixture({ score: 9.8 })] }),
                createSubjectFixture({ code: 'EXE201', isScored: true, components: [createComponentFixture({ score: 9.8 })] }),
                createSubjectFixture({ code: 'MLN111', isScored: true, components: [createComponentFixture({ score: 9.8 })] }),
                createSubjectFixture({ code: 'MLN122', isScored: true, components: [createComponentFixture({ score: 9.8 })] }),
                createSubjectFixture({ code: 'SE_COM4_ELE', isScored: true, components: [createComponentFixture({ score: 9.8 })] })
            ];
            ctx.renderExportCard(card, 8, { subjects: sem8Subs });
            assert.ok(card.innerHTML.includes('9.80'), 'Sem 8 export card displays 9.80 TBM');
            assert.ok(card.innerHTML.includes('Sinh viên Xuất Sắc'), 'Sem 8 export card displays Xuất Sắc');
            assert.ok(!card.innerHTML.includes('CÓC VÀNG'), 'Sem 8 export card strictly hides Cóc Vàng');
            assert.ok(!card.innerHTML.includes('Top 100'), 'Sem 8 export card strictly hides Top 100');

            // 3. Render Sem 9 with high scores
            const sem9Subs = [
                createSubjectFixture({ code: 'SEP490', isScored: true, components: [createComponentFixture({ score: 9.8 })] }),
                createSubjectFixture({ code: 'HCM202', isScored: true, components: [createComponentFixture({ score: 9.8 })] }),
                createSubjectFixture({ code: 'MLN131', isScored: true, components: [createComponentFixture({ score: 9.8 })] }),
                createSubjectFixture({ code: 'VNR202', isScored: true, components: [createComponentFixture({ score: 9.8 })] })
            ];
            ctx.renderExportCard(card, 9, { subjects: sem9Subs });
            assert.ok(card.innerHTML.includes('9.80'), 'Sem 9 export card displays 9.80 TBM');
            assert.ok(card.innerHTML.includes('Sinh viên Xuất Sắc'), 'Sem 9 export card displays Xuất Sắc');
            assert.ok(!card.innerHTML.includes('CÓC VÀNG'), 'Sem 9 export card strictly hides Cóc Vàng');
            assert.ok(!card.innerHTML.includes('Top 100'), 'Sem 9 export card strictly hides Top 100');
        });
    });
});
