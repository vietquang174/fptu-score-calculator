/**
 * Modular Test Suite: Syllabus Schema & Curriculum Data Validation
 * Asserts all subjects and templates have component weights totaling 100%,
 * valid credit assignments, and correct hurdles.
 */

const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const { loadAppSandbox } = require('./test_helper.js');

describe('Syllabus Data & Curriculum Validation (test_syllabus.js)', () => {
    const ctx = loadAppSandbox();

    it('CURRICULUM_SEMESTERS defines 10 semesters with valid sequential numbering (0 to 9)', () => {
        assert.ok(Array.isArray(ctx.CURRICULUM_SEMESTERS), 'CURRICULUM_SEMESTERS must be an array');
        assert.strictEqual(ctx.CURRICULUM_SEMESTERS.length, 10, 'Must have 10 semesters');
        ctx.CURRICULUM_SEMESTERS.forEach((sem, idx) => {
            assert.strictEqual(sem.semester, idx, `Semester at index ${idx} must have semester=${idx}`);
            assert.ok(sem.title, `Semester ${idx} must have title`);
            assert.ok(Array.isArray(sem.subjects), `Semester ${idx} subjects must be array`);
        });
    });

    it('All templates in COURSE_TEMPLATES have component weights totaling exactly 100%', () => {
        const templates = ctx.COURSE_TEMPLATES || {};
        const templateKeys = Object.keys(templates);
        assert.ok(templateKeys.length >= 4, 'Must have at least 4 standard templates');

        templateKeys.forEach(key => {
            const tpl = templates[key];
            assert.ok(Array.isArray(tpl.components), `Template ${key} must have components array`);
            const totalWeight = tpl.components.reduce((sum, c) => sum + c.weight, 0);
            assert.strictEqual(totalWeight, 100, `Template ${key} weights must sum to 100% (got ${totalWeight})`);
            assert.ok(tpl.minAvgToPass >= 5.0, `Template ${key} minAvgToPass must be >= 5.0`);
        });
    });

    it('All detailed course schemas in SAMPLE_SUBJECTS_SCHEMA have component weights totaling 100%', () => {
        const schemas = ctx.SAMPLE_SUBJECTS_SCHEMA || {};
        const schemaKeys = Object.keys(schemas);
        assert.ok(schemaKeys.length > 0, 'SAMPLE_SUBJECTS_SCHEMA must contain course definitions');

        schemaKeys.forEach(code => {
            const sub = schemas[code];
            if (sub.components && sub.components.length > 0) {
                const totalWeight = sub.components.reduce((sum, c) => sum + c.weight, 0);
                assert.strictEqual(totalWeight, 100, `Subject ${code} weights must sum to 100%`);
            }
        });
    });

    it('Every subject in curriculum has valid non-empty code, name, and credit count', () => {
        ctx.CURRICULUM_SEMESTERS.forEach(sem => {
            sem.subjects.forEach(sub => {
                assert.ok(sub.code && typeof sub.code === 'string', `Subject in semester ${sem.semester} must have string code`);
                assert.ok(sub.nameVi && typeof sub.nameVi === 'string', `Subject ${sub.code} must have Vietnamese name`);
                assert.ok(typeof sub.credits === 'number' && sub.credits >= 0, `Subject ${sub.code} must have non-negative credits`);
            });
        });
    });

    it('Every template component has valid non-negative weights and valid minScores', () => {
        Object.values(ctx.COURSE_TEMPLATES).forEach(tpl => {
            tpl.components.forEach(comp => {
                assert.ok(comp.weight > 0 && comp.weight <= 100, `Component ${comp.name} in ${tpl.id} must have weight in (0, 100]`);
                assert.ok(comp.minScore >= 0, `Component ${comp.name} must have non-negative minScore`);
            });
        });
    });
});
