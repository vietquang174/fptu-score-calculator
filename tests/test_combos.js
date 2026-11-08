/**
 * Modular Test Suite: Dynamic Combo Track Engine
 * Verifies combo track mapping, course swapping, and semester consistency.
 */

const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const { loadAppSandbox } = require('./test_helper.js');

describe('Dynamic Combo Track Engine (test_combos.js)', () => {
    const ctx = loadAppSandbox();

    it('Identifies combo semesters in curriculum (Semesters 5, 7, 8)', () => {
        const sem5 = ctx.CURRICULUM_SEMESTERS.find(s => s.semester === 5);
        const sem7 = ctx.CURRICULUM_SEMESTERS.find(s => s.semester === 7);
        const sem8 = ctx.CURRICULUM_SEMESTERS.find(s => s.semester === 8);

        assert.ok(sem5, 'Semester 5 must exist');
        assert.ok(sem7, 'Semester 7 must exist');
        assert.ok(sem8, 'Semester 8 must exist');

        const s5Combo = sem5.subjects.some(s => s.code.includes('COM') || s.isCombo);
        const s7Combo = sem7.subjects.some(s => s.code.includes('COM') || s.isCombo);
        const s8Combo = sem8.subjects.some(s => s.code.includes('COM') || s.isCombo);

        assert.ok(s5Combo, 'Semester 5 must contain combo course');
        assert.ok(s7Combo, 'Semester 7 must contain combo course');
        assert.ok(s8Combo, 'Semester 8 must contain combo course');
    });

    it('Mandatory core courses exist alongside combo tracks in Semester 5 (SWP391, SWT301)', () => {
        const sem5 = ctx.CURRICULUM_SEMESTERS.find(s => s.semester === 5);
        const codes = sem5.subjects.map(s => s.code);
        assert.ok(codes.includes('SWP391'), 'Semester 5 must contain SWP391');
        assert.ok(codes.includes('SWT301'), 'Semester 5 must contain SWT301');
    });

    it('Mandatory core courses exist alongside combo tracks in Semester 7 (SWD392, PMG201c, EXE101)', () => {
        const sem7 = ctx.CURRICULUM_SEMESTERS.find(s => s.semester === 7);
        const codes = sem7.subjects.map(s => s.code);
        assert.ok(codes.includes('SWD392'), 'Semester 7 must contain SWD392');
        assert.ok(codes.includes('PMG201c'), 'Semester 7 must contain PMG201c');
        assert.ok(codes.includes('EXE101'), 'Semester 7 must contain EXE101');
    });

    it('Mandatory core courses exist alongside combo tracks in Semester 8 (PRM393, ITE302c, EXE201, MLN)', () => {
        const sem8 = ctx.CURRICULUM_SEMESTERS.find(s => s.semester === 8);
        const codes = sem8.subjects.map(s => s.code);
        assert.ok(codes.includes('PRM393'), 'Semester 8 must contain PRM393');
        assert.ok(codes.includes('ITE302c'), 'Semester 8 must contain ITE302c');
        assert.ok(codes.includes('EXE201'), 'Semester 8 must contain EXE201');
    });

    it('Non-combo semesters maintain strict core course lists without alteration', () => {
        const sem1 = ctx.CURRICULUM_SEMESTERS.find(s => s.semester === 1);
        const sem2 = ctx.CURRICULUM_SEMESTERS.find(s => s.semester === 2);
        assert.ok(sem1.subjects.some(s => s.code === 'PRF192'), 'Sem 1 must have PRF192');
        assert.ok(sem2.subjects.some(s => s.code === 'MAD101'), 'Sem 2 must have MAD101');
    });

    it('All 8 COMBO_TRACKS are defined with course mappings and uppercase aliases', () => {
        const tracks = ctx.COMBO_TRACKS || {};
        const requiredTrackIds = ['dotnet', 'react', 'ai', 'java', 'game', 'datascience', 'icdesign', 'japanese'];
        
        requiredTrackIds.forEach(id => {
            const track = tracks[id];
            assert.ok(track, `Track ${id} must exist in COMBO_TRACKS`);
            assert.ok(track.name && track.nameVi, `Track ${id} must have English and Vietnamese names`);
            assert.ok(track.courses && track.courses[5] && track.courses[7], `Track ${id} must map Semesters 5 and 7`);
        });

        // Uppercase aliases
        assert.strictEqual(tracks.COM_NET, tracks.dotnet);
        assert.strictEqual(tracks.COM_REACT, tracks.react);
        assert.strictEqual(tracks.COM_AI, tracks.ai);
        assert.strictEqual(tracks.COM_JAVA, tracks.java);
        assert.strictEqual(tracks.COM_GAME, tracks.game);
        assert.strictEqual(tracks.COM_DS, tracks.datascience);
        assert.strictEqual(tracks.COM_IC, tracks.icdesign);
        assert.strictEqual(tracks.COM_JS, tracks.japanese);
    });

    it('All 5 GRADUATION_ELECTIVES are defined for Semester 9 Capstone', () => {
        const electives = ctx.evalInContext('typeof GRADUATION_ELECTIVES !== "undefined" ? GRADUATION_ELECTIVES : []');
        assert.ok(Array.isArray(electives), 'GRADUATION_ELECTIVES must be an array');
        assert.strictEqual(electives.length, 5, 'Must contain 5 graduation electives');

        const codes = electives.map(e => e.code);
        ['SEP490', 'SET490', 'EXE402', 'PIT490', 'GRC490'].forEach(expectedCode => {
            assert.ok(codes.includes(expectedCode), `GRADUATION_ELECTIVES must include ${expectedCode}`);
            const schema = ctx.SAMPLE_SUBJECTS_SCHEMA[expectedCode];
            assert.ok(schema, `Schema for capstone elective ${expectedCode} must exist`);
            const totalWeight = schema.components.reduce((sum, c) => sum + c.weight, 0);
            assert.strictEqual(totalWeight, 100, `Capstone ${expectedCode} weights must sum to 100%`);
        });
    });

    it('Dynamic combo swapping in Semester 5 reactively replaces track subject', () => {
        ctx.initializeAppState();
        
        // Default .NET track has PRN212
        assert.ok(ctx.AppState.semesterData[5].some(s => s.code === 'PRN212'), 'Default track should have PRN212');

        // Swap to React track
        ctx.setComboTrack('react');
        assert.ok(ctx.AppState.semesterData[5].some(s => s.code === 'FER202'), 'React track should have FER202');
        assert.ok(!ctx.AppState.semesterData[5].some(s => s.code === 'PRN212'), 'PRN212 should be swapped out');

        // Swap to AI track
        ctx.setComboTrack('ai');
        assert.ok(ctx.AppState.semesterData[5].some(s => s.code === 'PRP201c'), 'AI track should have PRP201c');

        // Swap to Game Development track
        ctx.setComboTrack('game');
        assert.ok(ctx.AppState.semesterData[5].some(s => s.code === 'FGU301'), 'Game track should have FGU301');

        // Core courses SWP391 and SWT301 remain intact throughout
        assert.ok(ctx.AppState.semesterData[5].some(s => s.code === 'SWP391'), 'SWP391 must remain in Sem 5');
        assert.ok(ctx.AppState.semesterData[5].some(s => s.code === 'SWT301'), 'SWT301 must remain in Sem 5');
    });

    it('Dynamic combo swapping in Semester 7 reactively replaces both combo slots for all 8 tracks', () => {
        ctx.initializeAppState();

        // 1. .NET: PRN222 and PRU213
        ctx.setComboTrack('dotnet');
        const s7Net = ctx.AppState.semesterData[7].map(s => s.code);
        assert.ok(s7Net.includes('PRN222') && s7Net.includes('PRU213'), '.NET should map PRN222 and PRU213');

        // 2. React: SDN302 and MMA301
        ctx.setComboTrack('react');
        const s7React = ctx.AppState.semesterData[7].map(s => s.code);
        assert.ok(s7React.includes('SDN302') && s7React.includes('MMA301'), 'React should map SDN302 and MMA301');

        // 3. AI: AIL304m and DBM301
        ctx.setComboTrack('ai');
        const s7Ai = ctx.AppState.semesterData[7].map(s => s.code);
        assert.ok(s7Ai.includes('AIL304m') && s7Ai.includes('DBM301'), 'AI should map AIL304m and DBM301');

        // 4. Java: SBA301 and MSS301
        ctx.setComboTrack('java');
        const s7Java = ctx.AppState.semesterData[7].map(s => s.code);
        assert.ok(s7Java.includes('SBA301') && s7Java.includes('MSS301'), 'Java should map SBA301 and MSS301');
        assert.strictEqual(s7Java.filter(c => c === 'SBA301').length, 1, 'Java Semester 7 must not duplicate SBA301');

        // 5. Game Development: GDC301 and AGU301
        ctx.setComboTrack('game');
        const s7Game = ctx.AppState.semesterData[7].map(s => s.code);
        assert.ok(s7Game.includes('GDC301') && s7Game.includes('AGU301'), 'Game should map GDC301 and AGU301');

        // 6. Data Science: DHV301 and MDS301
        ctx.setComboTrack('datascience');
        const s7Ds = ctx.AppState.semesterData[7].map(s => s.code);
        assert.ok(s7Ds.includes('DHV301') && s7Ds.includes('MDS301'), 'Data Science should map DHV301 and MDS301');

        // 7. IC Design: MIP201 and DCD301
        ctx.setComboTrack('icdesign');
        const s7Ic = ctx.AppState.semesterData[7].map(s => s.code);
        assert.ok(s7Ic.includes('MIP201') && s7Ic.includes('DCD301'), 'IC Design should map MIP201 and DCD301');

        // 8. Japanese: JPD316 and JIT401
        ctx.setComboTrack('japanese');
        const s7Js = ctx.AppState.semesterData[7].map(s => s.code);
        assert.ok(s7Js.includes('JPD316') && s7Js.includes('JIT401'), 'Japanese should map JPD316 and JIT401');
        assert.strictEqual(s7Js.filter(c => c === 'JPD316').length, 1, 'Japanese Semester 7 must not duplicate JPD316');

        // Core courses SWD392, PMG201c, EXE101 are preserved across tracks
        assert.ok(s7Js.includes('SWD392'), 'SWD392 must remain in Sem 7');
        assert.ok(s7Js.includes('PMG201c'), 'PMG201c must remain in Sem 7');
        assert.ok(s7Js.includes('EXE101'), 'EXE101 must remain in Sem 7');
    });

    it('All 8 combo tracks in Semesters 5, 7, and 8 verify zero duplicate course codes', () => {
        ctx.initializeAppState();
        const allTracks = ['dotnet', 'react', 'ai', 'java', 'game', 'datascience', 'icdesign', 'japanese'];
        const comboSemesters = [5, 7, 8];

        allTracks.forEach(trackId => {
            ctx.setComboTrack(trackId);

            comboSemesters.forEach(semNum => {
                const subs = ctx.AppState.semesterData[semNum];
                assert.ok(Array.isArray(subs) && subs.length > 0, `Semester ${semNum} subjects must exist for track ${trackId}`);
                const codes = subs.map(s => s.code);
                const uniqueCodes = new Set(codes);
                assert.strictEqual(
                    uniqueCodes.size,
                    codes.length,
                    `Duplicate course code detected in track "${trackId}" semester ${semNum}: [${codes.join(', ')}]`
                );
            });
        });

        // Explicit assertion for Java Semester 7 and Japanese Semesters 7 & 8
        ctx.setComboTrack('java');
        const javaS7 = ctx.AppState.semesterData[7].map(s => s.code);
        assert.deepStrictEqual([...javaS7], ['SWD392', 'PMG201c', 'EXE101', 'SBA301', 'MSS301'], 'Java Sem 7 exact sequence');

        ctx.setComboTrack('japanese');
        const jpS7 = ctx.AppState.semesterData[7].map(s => s.code);
        assert.deepStrictEqual([...jpS7], ['SWD392', 'PMG201c', 'EXE101', 'JPD316', 'JIT401'], 'Japanese Sem 7 exact sequence');
        const jpS8 = ctx.AppState.semesterData[8].map(s => s.code);
        assert.ok(jpS8.includes('JIS401'), 'Japanese Sem 8 must include JIS401');
    });

    it('Fallback for incomplete track course list preserves curriculum code without duplicating earlier slot', () => {
        ctx.initializeAppState();
        ctx.COMBO_TRACKS.test_incomplete = {
            id: 'test_incomplete',
            name: 'Incomplete Test Track',
            nameVi: 'Track thử nghiệm thiếu môn',
            courses: {
                7: ['SBA301'] // only 1 course for 2 slots
            }
        };

        ctx.setComboTrack('test_incomplete');
        const codes = ctx.AppState.semesterData[7].map(s => s.code);
        assert.strictEqual(codes[3], 'SBA301', 'Slot 1 mapped course');
        assert.strictEqual(codes[4], 'SE_COM*3', 'Slot 2 falls back to curriculum code rather than duplicating slot 1');
        assert.strictEqual(new Set(codes).size, codes.length, 'Zero duplicates with incomplete course list');

        delete ctx.COMBO_TRACKS.test_incomplete;
    });

    it('Preserves distinct scores across multi-slot track courses without cache collision', () => {
        ctx.initializeAppState();
        ctx.setComboTrack('java');

        // Enter different scores on SBA301 (index 3) and MSS301 (index 4)
        const sba = ctx.AppState.semesterData[7][3];
        const mss = ctx.AppState.semesterData[7][4];
        assert.strictEqual(sba.code, 'SBA301');
        assert.strictEqual(mss.code, 'MSS301');

        sba.components[0].subValues[0] = '9.0';
        mss.components[0].subValues[0] = '4.0';

        // Switch to React track
        ctx.setComboTrack('react');
        assert.ok(ctx.AppState.semesterData[7].some(s => s.code === 'SDN302'));

        // Switch back to Java track
        ctx.setComboTrack('java');
        const sbaRestored = ctx.AppState.semesterData[7][3];
        const mssRestored = ctx.AppState.semesterData[7][4];

        assert.strictEqual(sbaRestored.components[0].subValues[0], '9.0', 'SBA301 score must be preserved');
        assert.strictEqual(mssRestored.components[0].subValues[0], '4.0', 'MSS301 score must be preserved');
    });

    it('Dynamic combo swapping in Semester 8 reactively maps track course (e.g. Japanese JIS401)', () => {
        ctx.initializeAppState();

        ctx.setComboTrack('japanese');
        const s8Js = ctx.AppState.semesterData[8].map(s => s.code);
        assert.ok(s8Js.includes('JIS401'), 'Japanese track should map JIS401 in Sem 8');

        ctx.setComboTrack('dotnet');
        const s8Net = ctx.AppState.semesterData[8].map(s => s.code);
        assert.ok(s8Net.includes('SE_COM4_ELE'), '.NET track should map SE_COM4_ELE in Sem 8');

        // Core courses PRM393, ITE302c, EXE201, MLN111, MLN122 are preserved
        assert.ok(s8Net.includes('PRM393') && s8Net.includes('EXE201'), 'Core courses must remain in Sem 8');
    });

    it('Dynamic Capstone elective swapping in Semester 9 updates graduation course', () => {
        ctx.initializeAppState();

        // Default capstone is SEP490
        assert.ok(ctx.AppState.semesterData[9].some(s => s.code === 'SEP490'), 'Default capstone should be SEP490');

        // Swap to SET490
        ctx.setCapstoneElective('SET490');
        assert.ok(ctx.AppState.semesterData[9].some(s => s.code === 'SET490'), 'Should swap to SET490');
        assert.ok(!ctx.AppState.semesterData[9].some(s => s.code === 'SEP490'), 'SEP490 should be swapped out');

        // Swap to EXE402
        ctx.setCapstoneElective('EXE402');
        assert.ok(ctx.AppState.semesterData[9].some(s => s.code === 'EXE402'), 'Should swap to EXE402');

        // Political courses HCM202, MLN131, VNR202 are preserved
        const s9Codes = ctx.AppState.semesterData[9].map(s => s.code);
        assert.ok(s9Codes.includes('HCM202'), 'HCM202 must remain in Sem 9');
        assert.ok(s9Codes.includes('MLN131'), 'MLN131 must remain in Sem 9');
        assert.ok(s9Codes.includes('VNR202'), 'VNR202 must remain in Sem 9');
    });

    it('Preserves student entered scores across track swapping via scores cache', () => {
        ctx.initializeAppState();
        ctx.setComboTrack('dotnet');

        // Enter score for PRN212 in Semester 5
        const prn = ctx.AppState.semesterData[5].find(s => s.code === 'PRN212');
        assert.ok(prn, 'PRN212 must exist');
        prn.components[0].subValues[0] = '8.5';

        // Enter score for core course SWP391
        const swp = ctx.AppState.semesterData[5].find(s => s.code === 'SWP391');
        assert.ok(swp, 'SWP391 must exist');
        swp.components[0].subValues[0] = '9.2';

        // Switch track to React
        ctx.setComboTrack('react');
        assert.ok(ctx.AppState.semesterData[5].some(s => s.code === 'FER202'));

        // Core course score remains intact
        const swpAfter = ctx.AppState.semesterData[5].find(s => s.code === 'SWP391');
        assert.strictEqual(swpAfter.components[0].subValues[0], '9.2', 'SWP391 score must be preserved');

        // Switch back to .NET track
        ctx.setComboTrack('dotnet');
        const prnRestored = ctx.AppState.semesterData[5].find(s => s.code === 'PRN212');
        assert.strictEqual(prnRestored.components[0].subValues[0], '8.5', 'PRN212 score must be restored from cache');
    });

    it('Swapped track courses execute authentic grading formulas with full component schemas', () => {
        ctx.initializeAppState();
        ctx.setComboTrack('dotnet');

        const prn = ctx.AppState.semesterData[5].find(s => s.code === 'PRN212');
        assert.ok(prn.components.length >= 5, 'PRN212 must have authentic 5 components');

        // Set authentic scores: Lab(8.0), Ass(8.0), PE(8.0), PT(8.0), FE(8.0)
        prn.components.forEach(comp => {
            comp.mode = 'average';
            comp.avgValue = '8.0';
            comp.subValues[0] = '8.0';
        });

        const res = ctx.calculateSubjectScore(prn);
        assert.strictEqual(res.finalScore, 8.0);
        assert.strictEqual(res.isPass, true);
        assert.strictEqual(res.statusText, 'PASS');
    });
});
