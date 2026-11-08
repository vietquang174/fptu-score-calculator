/**
 * Milestone 2 Empirical Stress Test Suite
 * Independent Verification Script for Challenger 1
 * 
 * Verifies:
 * 1. Every subject schema in ScoreCalculator/data.js has weights summing to 100%.
 * 2. All 8 combo tracks in COMBO_TRACKS and 5 graduation electives resolve to valid schemas in SUBJECT_SCHEMAS.
 * 3. Dynamic switching across all 8 tracks in Semesters 5, 7, 8 swaps courses correctly without dropping core subjects (SWP391, SWD392, PRM393).
 * 4. Score caching preserves scores across track swaps.
 * 5. Adversarial stress-testing (rapid random swaps, invalid inputs, calculation oracles, hurdle enforcement).
 */

const assert = require('node:assert/strict');
const { describe, it } = require('node:test');
const path = require('node:path');
const { loadAppSandbox } = require('./test_helper.js');
const dataModule = require('../ScoreCalculator/data.js');

describe('Milestone 2: Empirical Stress Test Suite (Challenger 1)', () => {
    const ctx = loadAppSandbox();
    const SUBJECT_SCHEMAS = ctx.evalInContext('typeof SUBJECT_SCHEMAS !== "undefined" ? SUBJECT_SCHEMAS : SAMPLE_SUBJECTS_SCHEMA') || dataModule.SUBJECT_SCHEMAS;
    const COMBO_TRACKS = ctx.COMBO_TRACKS || dataModule.COMBO_TRACKS;
    const GRADUATION_ELECTIVES = ctx.evalInContext('typeof GRADUATION_ELECTIVES !== "undefined" ? GRADUATION_ELECTIVES : []') || dataModule.GRADUATION_ELECTIVES;

    // =========================================================================
    // SECTION 1: Subject Schema Assessment Weights Validation (100% Sum)
    // =========================================================================
    describe('1. Subject Schema Weights & Component Integrity', () => {
        it('SUBJECT_SCHEMAS and SAMPLE_SUBJECTS_SCHEMA contain full audited K20B course catalog', () => {
            assert.ok(SUBJECT_SCHEMAS, 'SUBJECT_SCHEMAS must be defined');
            const subjectKeys = Object.keys(SUBJECT_SCHEMAS);
            assert.ok(subjectKeys.length >= 80, `Expected at least 80 subject schemas, found ${subjectKeys.length}`);
        });

        it('Every scored subject in SUBJECT_SCHEMAS has component weights summing to exactly 100%', () => {
            const schemas = SUBJECT_SCHEMAS;
            const errors = [];

            for (const [code, subject] of Object.entries(schemas)) {
                if (subject.isScored !== false) {
                    assert.ok(Array.isArray(subject.components), `Subject ${code} must have components array`);
                    assert.ok(subject.components.length > 0, `Scored subject ${code} must have at least 1 component`);

                    const totalWeight = subject.components.reduce((sum, c) => sum + (Number(c.weight) || 0), 0);
                    if (Math.abs(totalWeight - 100) > 1e-4) {
                        errors.push(`Subject ${code}: components sum to ${totalWeight}%, expected 100%`);
                    }

                    // Check every component has valid non-negative weight and minScore
                    subject.components.forEach((c, idx) => {
                        if (typeof c.weight !== 'number' || c.weight <= 0 || c.weight > 100) {
                            errors.push(`Subject ${code} component [${idx}] (${c.name}): invalid weight ${c.weight}`);
                        }
                        if (typeof c.minScore !== 'number' || c.minScore < 0) {
                            errors.push(`Subject ${code} component [${idx}] (${c.name}): invalid minScore ${c.minScore}`);
                        }
                    });

                    // If assessments alias exists, assert its sum is also 100%
                    if (Array.isArray(subject.assessments) && subject.assessments.length > 0) {
                        const assessWeight = subject.assessments.reduce((sum, a) => sum + (Number(a.weight) || 0), 0);
                        if (Math.abs(assessWeight - 100) > 1e-4) {
                            errors.push(`Subject ${code}: assessments sum to ${assessWeight}%, expected 100%`);
                        }
                    }
                }
            }

            assert.strictEqual(errors.length, 0, `Schema weight violations found:\n${errors.join('\n')}`);
        });

        it('Every unscored condition course has valid schema and 100% weights if components are defined', () => {
            const schemas = SUBJECT_SCHEMAS;
            const errors = [];

            for (const [code, subject] of Object.entries(schemas)) {
                if (subject.isScored === false) {
                    assert.ok(subject.isConditionCourse || subject.isPassFailOnly, 
                        `Unscored subject ${code} must be marked as isConditionCourse or isPassFailOnly`);
                    
                    if (Array.isArray(subject.components) && subject.components.length > 0) {
                        const totalWeight = subject.components.reduce((sum, c) => sum + (Number(c.weight) || 0), 0);
                        if (Math.abs(totalWeight - 100) > 1e-4) {
                            errors.push(`Unscored subject ${code}: components sum to ${totalWeight}%, expected 100%`);
                        }
                    }
                }
            }

            assert.strictEqual(errors.length, 0, `Unscored course weight violations:\n${errors.join('\n')}`);
        });

        it('Every course schema defines required metadata (code, nameVi, credits, passingCriteria)', () => {
            const schemas = SUBJECT_SCHEMAS;
            for (const [code, sub] of Object.entries(schemas)) {
                assert.ok(sub.code && typeof sub.code === 'string', `Subject ${code} missing string code`);
                assert.ok(sub.nameVi && typeof sub.nameVi === 'string', `Subject ${code} missing nameVi`);
                assert.ok(typeof sub.credits === 'number' && sub.credits >= 0, `Subject ${code} invalid credits: ${sub.credits}`);
                assert.ok(sub.passingCriteria && typeof sub.passingCriteria.minTotal === 'number', 
                    `Subject ${code} missing passingCriteria.minTotal`);
            }
        });
    });

    // =========================================================================
    // SECTION 2: Combo Tracks and Graduation Electives Schema Resolution
    // =========================================================================
    describe('2. Combo Tracks & Graduation Electives Schema Resolution', () => {
        const expectedTracks = ['dotnet', 'react', 'ai', 'java', 'game', 'datascience', 'icdesign', 'japanese'];

        it('All 8 COMBO_TRACKS exist with metadata and mappings for Semesters 5, 7, 8', () => {
            assert.ok(COMBO_TRACKS, 'COMBO_TRACKS must be defined');
            expectedTracks.forEach(trackId => {
                const track = COMBO_TRACKS[trackId];
                assert.ok(track, `Track ${trackId} must be defined`);
                assert.ok(track.id && track.name && track.nameVi, `Track ${trackId} missing id/name/nameVi`);
                assert.ok(track.courses, `Track ${trackId} missing courses map`);
                assert.ok(Array.isArray(track.courses[5]) && track.courses[5].length > 0, `Track ${trackId} missing Sem 5 courses`);
                assert.ok(Array.isArray(track.courses[7]) && track.courses[7].length > 0, `Track ${trackId} missing Sem 7 courses`);
                assert.ok(Array.isArray(track.courses[8]) && track.courses[8].length > 0, `Track ${trackId} missing Sem 8 courses`);
            });
        });

        it('All 8 uppercase aliases map to their respective track objects', () => {
            const aliasMap = {
                COM_NET: 'dotnet',
                COM_REACT: 'react',
                COM_AI: 'ai',
                COM_JAVA: 'java',
                COM_GAME: 'game',
                COM_DS: 'datascience',
                COM_IC: 'icdesign',
                COM_JS: 'japanese'
            };

            for (const [alias, targetId] of Object.entries(aliasMap)) {
                assert.strictEqual(COMBO_TRACKS[alias], COMBO_TRACKS[targetId], 
                    `Alias ${alias} must reference track ${targetId}`);
            }
        });

        it('Every course code in every COMBO_TRACK resolves to a valid existing schema in SUBJECT_SCHEMAS', () => {
            const unresolved = [];
            expectedTracks.forEach(trackId => {
                const track = COMBO_TRACKS[trackId];
                [5, 7, 8].forEach(sem => {
                    (track.courses[sem] || []).forEach(courseCode => {
                        const schema = SUBJECT_SCHEMAS[courseCode];
                        if (!schema) {
                            unresolved.push({ track: trackId, semester: sem, courseCode });
                        } else {
                            assert.ok(schema.credits > 0, `Course ${courseCode} in ${trackId} must have credits > 0`);
                            assert.ok(schema.nameVi, `Course ${courseCode} in ${trackId} must have nameVi`);
                        }
                    });
                });
            });

            assert.strictEqual(unresolved.length, 0, 
                `Unresolved track courses:\n${JSON.stringify(unresolved, null, 2)}`);
        });

        it('All 5 GRADUATION_ELECTIVES exist, have 10 credits, and resolve to valid schemas in SUBJECT_SCHEMAS', () => {
            assert.strictEqual(GRADUATION_ELECTIVES.length, 5, 'Must define exactly 5 graduation capstone electives');

            const expectedElectives = ['SEP490', 'SET490', 'EXE402', 'PIT490', 'GRC490'];
            expectedElectives.forEach(code => {
                const item = GRADUATION_ELECTIVES.find(e => e.code === code);
                assert.ok(item, `Graduation elective ${code} must exist in GRADUATION_ELECTIVES`);
                assert.strictEqual(item.credits, 10, `Elective ${code} must have 10 credits`);

                const schema = SUBJECT_SCHEMAS[code];
                assert.ok(schema, `Schema for capstone elective ${code} must exist in SUBJECT_SCHEMAS`);
                assert.strictEqual(schema.credits, 10, `Schema for ${code} must have 10 credits`);
                assert.ok(Array.isArray(schema.components), `Schema for ${code} must have components`);
                
                const weightSum = schema.components.reduce((sum, c) => sum + c.weight, 0);
                assert.strictEqual(weightSum, 100, `Capstone ${code} component weights must sum to 100%`);
            });
        });
    });

    // =========================================================================
    // SECTION 3: Dynamic Switching & Core Subject Preservation
    // =========================================================================
    describe('3. Dynamic Switching & Core Course Preservation', () => {
        const expectedTracks = ['dotnet', 'react', 'ai', 'java', 'game', 'datascience', 'icdesign', 'japanese'];

        it('Dynamic track switching across all 8 tracks swaps courses correctly without dropping core subjects', () => {
            ctx.initializeAppState();

            // Core courses that must NEVER be dropped or altered in combo semesters
            const coreSem5 = ['SWP391', 'SWT301', 'WDU203c', 'SSG105'];
            const coreSem7 = ['SWD392', 'PMG201c', 'EXE101'];
            const coreSem8 = ['PRM393', 'ITE302c', 'EXE201', 'MLN111', 'MLN122'];

            expectedTracks.forEach(trackId => {
                ctx.setComboTrack(trackId);
                assert.strictEqual(ctx.AppState.selectedComboTrack, trackId, `Active track must be ${trackId}`);

                // Check Semester 5
                const s5Codes = ctx.AppState.semesterData[5].map(s => s.code);
                coreSem5.forEach(core => {
                    assert.ok(s5Codes.includes(core), `Semester 5 lost core course ${core} during switch to ${trackId}`);
                });
                const expectedS5Course = COMBO_TRACKS[trackId].courses[5][0];
                assert.ok(s5Codes.includes(expectedS5Course), 
                    `Semester 5 missing track course ${expectedS5Course} for track ${trackId}`);
                assert.strictEqual(s5Codes.length, 5, `Semester 5 must have exactly 5 subjects under ${trackId}`);

                // Check Semester 7
                const s7Codes = ctx.AppState.semesterData[7].map(s => s.code);
                coreSem7.forEach(core => {
                    assert.ok(s7Codes.includes(core), `Semester 7 lost core course ${core} during switch to ${trackId}`);
                });
                const expectedS7Courses = COMBO_TRACKS[trackId].courses[7];
                expectedS7Courses.forEach(tc => {
                    assert.ok(s7Codes.includes(tc), `Semester 7 missing track course ${tc} for track ${trackId}`);
                });
                assert.strictEqual(s7Codes.length, 5, `Semester 7 must have exactly 5 subjects under ${trackId}`);

                // Check Semester 8
                const s8Codes = ctx.AppState.semesterData[8].map(s => s.code);
                coreSem8.forEach(core => {
                    assert.ok(s8Codes.includes(core), `Semester 8 lost core course ${core} during switch to ${trackId}`);
                });
                const expectedS8Course = COMBO_TRACKS[trackId].courses[8][0];
                assert.ok(s8Codes.includes(expectedS8Course), 
                    `Semester 8 missing track course ${expectedS8Course} for track ${trackId}`);
                assert.strictEqual(s8Codes.length, 6, `Semester 8 must have exactly 6 subjects under ${trackId}`);
            });
        });

        it('Dynamic Capstone switching in Semester 9 preserves political core subjects', () => {
            ctx.initializeAppState();
            const coreSem9 = ['HCM202', 'MLN131', 'VNR202'];
            const electives = ['SEP490', 'SET490', 'EXE402', 'PIT490', 'GRC490'];

            electives.forEach(capCode => {
                ctx.setCapstoneElective(capCode);
                assert.strictEqual(ctx.AppState.selectedCapstoneElective, capCode);

                const s9Codes = ctx.AppState.semesterData[9].map(s => s.code);
                assert.ok(s9Codes.includes(capCode), `Semester 9 missing active capstone ${capCode}`);
                assert.strictEqual(s9Codes.length, 4, 'Semester 9 must have exactly 4 subjects');

                coreSem9.forEach(core => {
                    assert.ok(s9Codes.includes(core), `Semester 9 lost political core course ${core} on ${capCode}`);
                });
            });
        });
    });

    // =========================================================================
    // SECTION 4: Score Caching & Multi-Swap Persistence
    // =========================================================================
    describe('4. Score Caching & Multi-Swap Persistence', () => {
        it('Preserves student entered scores across multi-track round trips', () => {
            ctx.initializeAppState();

            // 1. Start with .NET track
            ctx.setComboTrack('dotnet');
            const netSub5 = ctx.AppState.semesterData[5].find(s => s.code === 'PRN212');
            assert.ok(netSub5, 'PRN212 must exist in .NET Sem 5');
            netSub5.components[0].subValues[0] = '7.5';
            netSub5.components[1].subValues[0] = '8.0';

            // Also score core subject SWP391 in Sem 5
            const swp5 = ctx.AppState.semesterData[5].find(s => s.code === 'SWP391');
            swp5.components[0].subValues[0] = '9.5';

            // Score .NET Sem 7 course PRN222
            const netSub7 = ctx.AppState.semesterData[7].find(s => s.code === 'PRN222');
            assert.ok(netSub7, 'PRN222 must exist in .NET Sem 7');
            netSub7.components[0].subValues[0] = '6.5';

            // Score core subject SWD392 in Sem 7
            const swd7 = ctx.AppState.semesterData[7].find(s => s.code === 'SWD392');
            swd7.components[0].subValues[0] = '8.8';

            // 2. Switch to React track and enter React scores
            ctx.setComboTrack('react');
            const reactSub5 = ctx.AppState.semesterData[5].find(s => s.code === 'FER202');
            assert.ok(reactSub5, 'FER202 must exist in React Sem 5');
            reactSub5.components[0].subValues[0] = '8.7';

            // 3. Switch to AI track and enter AI scores
            ctx.setComboTrack('ai');
            const aiSub5 = ctx.AppState.semesterData[5].find(s => s.code === 'PRP201c');
            assert.ok(aiSub5, 'PRP201c must exist in AI Sem 5');
            aiSub5.components[0].subValues[0] = '9.1';

            // 4. Switch back to React track and verify React scores
            ctx.setComboTrack('react');
            const reactSub5Restored = ctx.AppState.semesterData[5].find(s => s.code === 'FER202');
            assert.strictEqual(reactSub5Restored.components[0].subValues[0], '8.7', 
                'FER202 score must be preserved after returning to React');

            // 5. Switch back to .NET track and verify all .NET scores and core scores
            ctx.setComboTrack('dotnet');
            const netSub5Restored = ctx.AppState.semesterData[5].find(s => s.code === 'PRN212');
            assert.strictEqual(netSub5Restored.components[0].subValues[0], '7.5', 
                'PRN212 comp[0] score must be restored from cache');
            assert.strictEqual(netSub5Restored.components[1].subValues[0], '8.0', 
                'PRN212 comp[1] score must be restored from cache');

            const netSub7Restored = ctx.AppState.semesterData[7].find(s => s.code === 'PRN222');
            assert.strictEqual(netSub7Restored.components[0].subValues[0], '6.5', 
                'PRN222 score must be restored from cache');

            // Core courses must never have lost their scores
            const swp5Restored = ctx.AppState.semesterData[5].find(s => s.code === 'SWP391');
            assert.strictEqual(swp5Restored.components[0].subValues[0], '9.5', 
                'Core SWP391 score must remain intact throughout all switches');

            const swd7Restored = ctx.AppState.semesterData[7].find(s => s.code === 'SWD392');
            assert.strictEqual(swd7Restored.components[0].subValues[0], '8.8', 
                'Core SWD392 score must remain intact throughout all switches');
        });

        it('Preserves student entered scores across capstone elective round trips in Semester 9', () => {
            ctx.initializeAppState();

            // 1. Enter score for SEP490
            ctx.setCapstoneElective('SEP490');
            const sep = ctx.AppState.semesterData[9].find(s => s.code === 'SEP490');
            sep.components[0].subValues[0] = '8.5';

            // Enter score for political core HCM202
            const hcm = ctx.AppState.semesterData[9].find(s => s.code === 'HCM202');
            hcm.components[0].subValues[0] = '9.0';

            // 2. Switch to SET490
            ctx.setCapstoneElective('SET490');
            const set = ctx.AppState.semesterData[9].find(s => s.code === 'SET490');
            set.components[0].subValues[0] = '7.8';

            // 3. Switch back to SEP490
            ctx.setCapstoneElective('SEP490');
            const sepRestored = ctx.AppState.semesterData[9].find(s => s.code === 'SEP490');
            assert.strictEqual(sepRestored.components[0].subValues[0], '8.5', 
                'SEP490 score must be restored from cache');

            // 4. Switch back to SET490
            ctx.setCapstoneElective('SET490');
            const setRestored = ctx.AppState.semesterData[9].find(s => s.code === 'SET490');
            assert.strictEqual(setRestored.components[0].subValues[0], '7.8', 
                'SET490 score must be restored from cache');

            // Political course intact
            const hcmRestored = ctx.AppState.semesterData[9].find(s => s.code === 'HCM202');
            assert.strictEqual(hcmRestored.components[0].subValues[0], '9.0', 
                'HCM202 score must remain intact');
        });

        it('Preserves multiple subpart scores in multi-part components across swaps', () => {
            ctx.initializeAppState();
            ctx.setComboTrack('dotnet');

            // Course 1: PRN212 in Sem 5 has Progress Test with 2 parts
            const prn = ctx.AppState.semesterData[5].find(s => s.code === 'PRN212');
            assert.ok(prn, 'PRN212 must exist');
            const ptComp = prn.components.find(c => c.parts === 2);
            assert.ok(ptComp, 'PRN212 must have 2-part Progress test component');
            ptComp.mode = 'detailed';
            ptComp.subValues[0] = '7.5';
            ptComp.subValues[1] = '8.5';

            // Course 2: PRU213 in Sem 7 has Labs with 4 parts
            const pru = ctx.AppState.semesterData[7].find(s => s.code === 'PRU213');
            assert.ok(pru, 'PRU213 must exist in .NET Sem 7');
            const labComp = pru.components.find(c => c.parts === 4);
            assert.ok(labComp, 'PRU213 must have 4-part Lab component');
            labComp.mode = 'detailed';
            labComp.subValues = ['7.0', '8.0', '8.5', '9.5'];

            // Switch track to react and then back to dotnet
            ctx.setComboTrack('react');
            ctx.setComboTrack('dotnet');

            // Verify PRN212 Progress test 2 parts restored
            const prnRestored = ctx.AppState.semesterData[5].find(s => s.code === 'PRN212');
            const ptRestored = prnRestored.components.find(c => c.id === ptComp.id || c.name === ptComp.name);
            assert.strictEqual(ptRestored.mode, 'detailed');
            assert.deepStrictEqual(ptRestored.subValues.slice(0, 2), ['7.5', '8.5'], 
                'PRN212 2-part Progress test must be perfectly preserved');

            // Verify PRU213 Lab 4 parts restored
            const pruRestored = ctx.AppState.semesterData[7].find(s => s.code === 'PRU213');
            const labRestored = pruRestored.components.find(c => c.id === labComp.id || c.name === labComp.name);
            assert.strictEqual(labRestored.mode, 'detailed');
            assert.deepStrictEqual(labRestored.subValues.slice(0, 4), ['7.0', '8.0', '8.5', '9.5'], 
                'PRU213 4-part Lab must be perfectly preserved');
        });

        it('Concurrent multi-track caching: simultaneously populates and preserves all 8 tracks', () => {
            ctx.initializeAppState();
            const trackScores = {
                dotnet: '8.1',
                react: '8.2',
                ai: '8.3',
                java: '8.4',
                game: '8.5',
                datascience: '8.6',
                icdesign: '8.7',
                japanese: '8.8'
            };

            // Enter a unique score on the Semester 5 track course for each track
            for (const [trackId, scoreVal] of Object.entries(trackScores)) {
                ctx.setComboTrack(trackId);
                const s5Course = COMBO_TRACKS[trackId].courses[5][0];
                const sub = ctx.AppState.semesterData[5].find(s => s.code === s5Course);
                assert.ok(sub, `Course ${s5Course} must exist in Semester 5 for track ${trackId}`);
                sub.components[0].subValues[0] = scoreVal;
            }

            // Verify all 8 tracks retained their individual unique scores
            for (const [trackId, scoreVal] of Object.entries(trackScores)) {
                ctx.setComboTrack(trackId);
                const s5Course = COMBO_TRACKS[trackId].courses[5][0];
                const sub = ctx.AppState.semesterData[5].find(s => s.code === s5Course);
                assert.strictEqual(sub.components[0].subValues[0], scoreVal, 
                    `Track ${trackId} course ${s5Course} must retain its entered score ${scoreVal}`);
            }
        });
    });

    // =========================================================================
    // SECTION 5: Adversarial Stress, Boundary Cases & Calculation Oracles
    // =========================================================================
    describe('5. Adversarial Stress, Boundary Cases & Oracles', () => {
        const expectedTracks = ['dotnet', 'react', 'ai', 'java', 'game', 'datascience', 'icdesign', 'japanese'];

        it('Survives 100 rapid cyclic and randomized track switches without corruption or exception', () => {
            ctx.initializeAppState();

            for (let i = 0; i < 100; i++) {
                const randomTrack = expectedTracks[Math.floor(Math.random() * expectedTracks.length)];
                assert.doesNotThrow(() => {
                    ctx.setComboTrack(randomTrack);
                }, `Exception thrown during rapid switch to ${randomTrack} on iteration ${i}`);

                // Verify invariant: Semesters 5, 7, 8 subject counts remain 5, 5, 6
                assert.strictEqual(ctx.AppState.semesterData[5].length, 5);
                assert.strictEqual(ctx.AppState.semesterData[7].length, 5);
                assert.strictEqual(ctx.AppState.semesterData[8].length, 6);
            }
        });

        it('Gracefully falls back to default track when invalid or null trackId is passed', () => {
            ctx.initializeAppState();
            ctx.setComboTrack('dotnet');

            // Passing null/undefined/empty string
            assert.doesNotThrow(() => ctx.setComboTrack(null));
            assert.doesNotThrow(() => ctx.setComboTrack(undefined));
            assert.doesNotThrow(() => ctx.setComboTrack(''));

            // Passing nonexistent track ID
            assert.doesNotThrow(() => ctx.setComboTrack('nonexistent_track_xyz'));
            
            // Should still maintain valid semester data
            assert.ok(ctx.AppState.semesterData[5].length === 5);
            assert.ok(ctx.AppState.semesterData[7].length === 5);
            assert.ok(ctx.AppState.semesterData[8].length === 6);
        });

        it('Authentic calculation oracle: calculates correct weighted scores and enforces hurdles on swapped track subjects', () => {
            ctx.initializeAppState();
            ctx.setComboTrack('react');

            const fer = ctx.AppState.semesterData[5].find(s => s.code === 'FER202');
            assert.ok(fer, 'FER202 must be loaded');

            // Scenario A: Perfect 10.0 across all components -> Result 10.0 PASS
            fer.components.forEach(c => {
                c.mode = 'average';
                c.avgValue = '10.0';
                c.subValues[0] = '10.0';
            });
            let res = ctx.calculateSubjectScore(fer);
            assert.strictEqual(res.finalScore, 10.0);
            assert.strictEqual(res.isPass, true);

            // Scenario B: Process components high (8.0), but FE fails (< 4.0, e.g. 3.5)
            fer.components.forEach(c => {
                if (c.isFE) {
                    c.avgValue = '3.5';
                    c.subValues[0] = '3.5';
                } else {
                    c.avgValue = '8.0';
                    c.subValues[0] = '8.0';
                }
            });
            res = ctx.calculateSubjectScore(fer);
            assert.strictEqual(res.isPass, false, 'Subject must fail when FE < 4.0 even if total >= 5.0');
            assert.strictEqual(res.statusText, 'NOT PASS');

            // Scenario C: Process component is 0.0 -> Must fail hurdle
            fer.components.forEach((c, idx) => {
                if (idx === 0) {
                    c.avgValue = '0.0';
                    c.subValues[0] = '0.0';
                } else {
                    c.avgValue = '8.0';
                    c.subValues[0] = '8.0';
                }
            });
            res = ctx.calculateSubjectScore(fer);
            assert.strictEqual(res.isPass, false, 'Subject must fail when any component is 0.0');
        });

        it('Vovinam Physical Education hurdle oracle: requires FE >= 5.0 to pass', () => {
            ctx.initializeAppState();
            const vov = SUBJECT_SCHEMAS['VOV114'];
            assert.ok(vov, 'VOV114 must exist');
            const vovState = ctx.createSubjectState(vov);

            // Set FE = 4.5 (passes normal hurdle of 4.0, but must fail Vovinam hurdle of 5.0)
            vovState.components[0].mode = 'average';
            vovState.components[0].avgValue = '4.5';
            vovState.components[0].subValues[0] = '4.5';

            const resFail = ctx.calculateSubjectScore(vovState);
            assert.strictEqual(resFail.isPass, false, 'Vovinam must fail with FE = 4.5 (requires >= 5.0)');

            // Set FE = 5.0 -> Pass
            vovState.components[0].avgValue = '5.0';
            vovState.components[0].subValues[0] = '5.0';
            const resPass = ctx.calculateSubjectScore(vovState);
            assert.strictEqual(resPass.isPass, true, 'Vovinam must pass with FE = 5.0');
        });

        it('Rounding oracle: enforces 1-decimal subject rounding and 2-decimal arithmetic mean semester TBM', () => {
            ctx.initializeAppState();
            ctx.setComboTrack('dotnet');

            // Set up 2 subjects in Semester 5
            const sem5Subjects = ctx.AppState.semesterData[5];
            const sub1 = sem5Subjects[0]; // SWP391
            const sub2 = sem5Subjects[1]; // SWT301

            // Configure sub1 to produce exactly 4.94 -> rounded to 4.9 (Not pass)
            // SWP391 components: M1(15), M2(20), M3(25), Pres(40)
            // 4.94 = 0.15*x + 0.20*x + ... or direct values
            sub1.components.forEach(c => {
                c.mode = 'average';
                c.avgValue = '4.94';
                c.subValues[0] = '4.94';
            });
            const res1 = ctx.calculateSubjectScore(sub1);
            assert.strictEqual(res1.finalScore, 4.9, '4.94 must round to 4.9');
            assert.strictEqual(res1.isPass, false, '4.9 must not pass');

            // Configure sub2 to produce 4.95 -> rounded to 5.0 (Pass)
            sub2.components.forEach(c => {
                c.mode = 'average';
                c.avgValue = '4.95';
                c.subValues[0] = '4.95';
            });
            const res2 = ctx.calculateSubjectScore(sub2);
            assert.strictEqual(res2.finalScore, 5.0, '4.95 must round to 5.0');
            assert.strictEqual(res2.isPass, true, '5.0 must pass');

            // TBM arithmetic mean rounding test:
            // 3 subjects with scores 8.5, 8.6, 8.8 -> (8.5 + 8.6 + 8.8)/3 = 25.9/3 = 8.6333... -> 8.63
            const testSubs = [
                { isScored: true, components: [{ weight: 100, isFE: true, minScore: 4.0, subValues: ['8.5'], mode: 'average' }] },
                { isScored: true, components: [{ weight: 100, isFE: true, minScore: 4.0, subValues: ['8.6'], mode: 'average' }] },
                { isScored: true, components: [{ weight: 100, isFE: true, minScore: 4.0, subValues: ['8.8'], mode: 'average' }] }
            ];
            const semRes = ctx.calculateSemesterResults(testSubs);
            assert.strictEqual(semRes.tbm, 8.63, 'TBM must round 8.6333... to 8.63');
            assert.strictEqual(semRes.tbmStr, '8.63');
        });

        it('Condition course honor guard oracle: failing condition course blocks honors in swapped semester', () => {
            ctx.initializeAppState();
            ctx.setComboTrack('dotnet');

            // Create semester with 1 scored subject (score 9.5) and 1 condition subject (LAB211 with passStatus: 'fail')
            const scoredSub = {
                code: 'PRN212',
                isScored: true,
                minAvgToPass: 5.0,
                components: [{ weight: 100, isFE: true, minScore: 4.0, subValues: ['9.5'], mode: 'average' }]
            };
            const failedConditionSub = {
                code: 'LAB211',
                isScored: false,
                isPassFailOnly: true,
                isConditionCourse: true,
                passStatus: 'fail',
                components: []
            };

            const semRes = ctx.calculateSemesterResults([scoredSub, failedConditionSub]);
            assert.strictEqual(semRes.tbm, 9.5);
            assert.strictEqual(semRes.honor.title, 'Chưa đạt (Not Pass)', 
                'Failed condition course must force semester honor to Chưa đạt (Not Pass)');
            assert.strictEqual(semRes.honor.level, 'fail');
            assert.strictEqual(semRes.honor.isCocVang, false);
            assert.strictEqual(semRes.honor.isTop100, false);
        });
    });
});
