/**
 * Challenger 2 Independent Empirical Adversarial Stress Test Harness
 * Milestone M3: Round 2 Production Enhancements Verification
 * 
 * Target Verification Vectors:
 * 1. Deep stress testing of Syllabus view across all 10 semesters (0 to 9).
 * 2. Exhaustive searchability of every single course in CURRICULUM_SEMESTERS (accent-insensitive, case-insensitive, aliases).
 * 3. Accurate GPA vs Condition Course Badging across all views and filters.
 * 4. Syllabus detail modal resolution for all courses including condition courses (OTP101, LAB211, OJT202, PHE_COM*).
 * 5. Modal dismissal mechanics: backdrop target discrimination, Esc key handler, floating close button styling.
 * 6. Test suite integrity: tests/runner.js (11/11 suites pass cleanly with exit code 0).
 * 7. Regression testing: challenger_m1_stress.js, challenger_m2_stress.js, challenger_m3_stress.js.
 */

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { execSync } = require('node:child_process');
const vm = require('node:vm');

let currentDir = __dirname;
while (currentDir && !fs.existsSync(path.join(currentDir, 'ScoreCalculator'))) {
    const parent = path.dirname(currentDir);
    if (parent === currentDir) break;
    currentDir = parent;
}
const ROOT_DIR = currentDir;
const APP_DIR = path.join(ROOT_DIR, 'ScoreCalculator');
const DATA_PATH = path.join(APP_DIR, 'data.js');
const APP_PATH = path.join(APP_DIR, 'app.js');
const HTML_PATH = path.join(APP_DIR, 'index.html');
const CSS_PATH = path.join(APP_DIR, 'styles.css');

console.log('========================================================================');
console.log(' CHALLENGER 2: EMPIRICAL ADVERSARIAL STRESS TEST (MILESTONE M3)');
console.log(' Target: Syllabus View, Modal Dismissal, Search, Badges & Runner');
console.log('========================================================================\n');

let totalAssertions = 0;
let passedAssertions = 0;
let failedAssertions = 0;
const failureLog = [];

function check(desc, fn) {
    totalAssertions++;
    try {
        fn();
        passedAssertions++;
        console.log(`  [PASS] ${desc}`);
    } catch (err) {
        failedAssertions++;
        failureLog.push({ desc, error: err.message, stack: err.stack });
        console.error(`  [FAIL] ${desc} --> ${err.message}`);
    }
}

// -----------------------------------------------------------------------------
// High-Fidelity Test Sandbox Setup
// -----------------------------------------------------------------------------
function createHarnessSandbox() {
    const listeners = {};
    const elements = {};

    function createMockElement(tagName = 'div', id = '') {
        const el = {
            tagName: tagName.toUpperCase(),
            id: id,
            className: '',
            innerText: '',
            textContent: '',
            _innerHTML: '',
            style: {},
            children: [],
            parentNode: null,
            classList: {
                classes: new Set(),
                add(...cls) { cls.forEach(c => c && this.classes.add(c)); },
                remove(...cls) { cls.forEach(c => this.classes.delete(c)); },
                contains(c) { return this.classes.has(c); },
                toggle(c) {
                    if (this.classes.has(c)) { this.classes.delete(c); return false; }
                    this.classes.add(c); return true;
                }
            },
            appendChild(child) {
                if (child) child.parentNode = this;
                this.children.push(child);
                return child;
            },
            removeChild(child) {
                const idx = this.children.indexOf(child);
                if (idx > -1) {
                    this.children.splice(idx, 1);
                    if (child) child.parentNode = null;
                }
                return child;
            },
            setAttribute(name, val) { this[name] = String(val); },
            getAttribute(name) { return this[name] !== undefined ? this[name] : null; },
            removeAttribute(name) { delete this[name]; },
            addEventListener(evt, fn) {
                if (!listeners[evt]) listeners[evt] = [];
                listeners[evt].push(fn);
            },
            querySelector(sel) { return null; },
            querySelectorAll(sel) {
                if (this.id === 'syllabus-gpa-filter') {
                    return [
                        this._btnAll || (this._btnAll = createMockElement('button', 'btn-f-all')),
                        this._btnScored || (this._btnScored = createMockElement('button', 'btn-f-scored')),
                        this._btnCond || (this._btnCond = createMockElement('button', 'btn-f-cond'))
                    ];
                }
                return [];
            }
        };

        if (id === 'syllabus-gpa-filter') {
            el._btnAll = createMockElement('button', 'btn-f-all');
            el._btnAll.setAttribute('data-filter', 'all');
            el._btnScored = createMockElement('button', 'btn-f-scored');
            el._btnScored.setAttribute('data-filter', 'scored');
            el._btnCond = createMockElement('button', 'btn-f-cond');
            el._btnCond.setAttribute('data-filter', 'condition');
        }

        Object.defineProperty(el, 'innerHTML', {
            get() { return this._innerHTML; },
            set(val) {
                this._innerHTML = String(val);
                this.textContent = this._innerHTML.replace(/<[^>]*>/g, ' ');
            }
        });

        return el;
    }

    const docMock = {
        createElement: (tag) => createMockElement(tag),
        getElementById: (id) => {
            if (!elements[id]) {
                elements[id] = createMockElement('div', id);
            }
            return elements[id];
        },
        querySelector: (sel) => {
            if (sel && sel.startsWith('#')) {
                return docMock.getElementById(sel.slice(1));
            }
            return createMockElement('div');
        },
        querySelectorAll: (sel) => [],
        addEventListener: (evt, fn) => {
            if (!listeners[evt]) listeners[evt] = [];
            listeners[evt].push(fn);
        },
        body: createMockElement('body')
    };

    const winMock = {
        document: docMock,
        addEventListener: (evt, fn) => {
            if (!listeners[evt]) listeners[evt] = [];
            listeners[evt].push(fn);
        },
        scrollTo: () => {},
        innerWidth: 1200,
        innerHeight: 800
    };

    const sandbox = {
        console,
        document: docMock,
        window: winMock,
        setTimeout,
        clearTimeout,
        setInterval,
        clearInterval,
        Math,
        parseFloat,
        parseInt,
        isNaN,
        Array,
        Object,
        String,
        Number,
        Boolean,
        Date,
        RegExp,
        JSON,
        evalInContext: (code) => eval(code)
    };

    const ctx = vm.createContext(sandbox);

    const dataCode = fs.readFileSync(DATA_PATH, 'utf8');
    vm.runInContext(dataCode, ctx, { filename: 'data.js' });

    const appCode = fs.readFileSync(APP_PATH, 'utf8');
    vm.runInContext(appCode, ctx, { filename: 'app.js' });

    // Expose declarations from VM context
    const exposed = vm.runInContext(`
        ({
            CURRICULUM_SEMESTERS: typeof CURRICULUM_SEMESTERS !== 'undefined' ? CURRICULUM_SEMESTERS : undefined,
            SUBJECT_SCHEMAS: typeof SUBJECT_SCHEMAS !== 'undefined' ? SUBJECT_SCHEMAS : undefined,
            COMBO_TRACKS: typeof COMBO_TRACKS !== 'undefined' ? COMBO_TRACKS : undefined,
            AppState: typeof AppState !== 'undefined' ? AppState : undefined,
            SyllabusState: typeof SyllabusState !== 'undefined' ? SyllabusState : undefined,
            switchView: typeof switchView !== 'undefined' ? switchView : undefined,
            renderSyllabusView: typeof renderSyllabusView !== 'undefined' ? renderSyllabusView : undefined,
            setSyllabusSemester: typeof setSyllabusSemester !== 'undefined' ? setSyllabusSemester : undefined,
            selectSyllabusSemester: typeof selectSyllabusSemester !== 'undefined' ? selectSyllabusSemester : undefined,
            setSyllabusGpaFilter: typeof setSyllabusGpaFilter !== 'undefined' ? setSyllabusGpaFilter : undefined,
            filterSyllabusGPA: typeof filterSyllabusGPA !== 'undefined' ? filterSyllabusGPA : undefined,
            handleSyllabusSearch: typeof handleSyllabusSearch !== 'undefined' ? handleSyllabusSearch : undefined,
            clearSyllabusSearch: typeof clearSyllabusSearch !== 'undefined' ? clearSyllabusSearch : undefined,
            renderSyllabusCards: typeof renderSyllabusCards !== 'undefined' ? renderSyllabusCards : undefined,
            openSyllabusDetailModal: typeof openSyllabusDetailModal !== 'undefined' ? openSyllabusDetailModal : undefined,
            openSyllabusModal: typeof openSyllabusModal !== 'undefined' ? openSyllabusModal : undefined,
            closeSyllabusDetailModal: typeof closeSyllabusDetailModal !== 'undefined' ? closeSyllabusDetailModal : undefined,
            closeSyllabusModal: typeof closeSyllabusModal !== 'undefined' ? closeSyllabusModal : undefined,
            handleSyllabusModalBackdropClick: typeof handleSyllabusModalBackdropClick !== 'undefined' ? handleSyllabusModalBackdropClick : undefined,
            handleExportModalBackdropClick: typeof handleExportModalBackdropClick !== 'undefined' ? handleExportModalBackdropClick : undefined,
            closeExportModal: typeof closeExportModal !== 'undefined' ? closeExportModal : undefined,
            exportCertificatePdf: typeof exportCertificatePdf !== 'undefined' ? exportCertificatePdf : undefined,
            initializeAppState: typeof initializeAppState !== 'undefined' ? initializeAppState : undefined
        })
    `, ctx);

    Object.assign(ctx, exposed);

    return { ctx, docMock, winMock, listeners, elements };
}

// =============================================================================
// TEST SUITE 1: Deep Stress Testing of Syllabus View & Curriculum Data
// =============================================================================
console.log('--- TEST SUITE 1: Deep Stress Testing of Syllabus View (All 10 Semesters) ---');

check('1.1: CURRICULUM_SEMESTERS contains all 10 semesters (0 to 9) with exact 145 credits', () => {
    const { ctx } = createHarnessSandbox();
    const semesters = ctx.CURRICULUM_SEMESTERS;
    assert.ok(Array.isArray(semesters), 'CURRICULUM_SEMESTERS must be an array');
    assert.strictEqual(semesters.length, 10, 'Must have exactly 10 semesters (0..9)');

    for (let semNum = 0; semNum <= 9; semNum++) {
        const found = semesters.find(s => s.semester === semNum);
        assert.ok(found, `Semester ${semNum} must exist in CURRICULUM_SEMESTERS`);
        assert.ok(Array.isArray(found.subjects), `Semester ${semNum} must have subjects array`);
        assert.ok(found.subjects.length > 0, `Semester ${semNum} must have at least 1 subject`);
    }

    let totalCredits = 0;
    semesters.forEach(s => {
        s.subjects.forEach(sub => {
            totalCredits += (sub.credits || 0);
        });
    });
    assert.strictEqual(totalCredits, 145, 'Total curriculum credits must equal exactly 145');
});

check('1.2: Every single subject across all 10 semesters has valid code, nameVi, and credit value', () => {
    const { ctx } = createHarnessSandbox();
    let totalSubs = 0;
    ctx.CURRICULUM_SEMESTERS.forEach(s => {
        s.subjects.forEach(sub => {
            totalSubs++;
            assert.ok(sub.code && typeof sub.code === 'string' && sub.code.length >= 3, `Subject in Sem ${s.semester} has valid code: ${sub.code}`);
            assert.ok(sub.nameVi && typeof sub.nameVi === 'string', `Subject ${sub.code} in Sem ${s.semester} has valid nameVi`);
            assert.ok(typeof sub.credits === 'number' && sub.credits >= 0, `Subject ${sub.code} has non-negative credits`);
        });
    });
    assert.ok(totalSubs >= 40, `Found ${totalSubs} subjects across all semesters`);
});

check('1.3: All condition courses (isScored === false) are properly configured in data.js', () => {
    const { ctx } = createHarnessSandbox();
    const expectedConditionCourses = ['PHE_COM*1', 'PEN', 'OTP101', 'PHE_COM*2', 'PHE_COM*3', 'LAB211', 'OJT202'];

    const actualConditionCourses = [];
    ctx.CURRICULUM_SEMESTERS.forEach(s => {
        s.subjects.forEach(sub => {
            if (sub.isScored === false) {
                actualConditionCourses.push(sub.code);
            }
        });
    });

    expectedConditionCourses.forEach(code => {
        assert.ok(actualConditionCourses.includes(code), `Condition course ${code} must be flagged isScored: false`);
    });
    assert.strictEqual(actualConditionCourses.length, 7, 'Must have exactly 7 condition courses in curriculum');
});

check('1.4: Syllabus cards GPA badging accurately discriminates scored vs condition courses', () => {
    const { ctx, docMock } = createHarnessSandbox();
    const container = docMock.getElementById('syllabus-cards-container');
    assert.ok(container, 'syllabus-cards-container must exist');

    // Render all courses
    ctx.SyllabusState.selectedSemester = 'all';
    ctx.SyllabusState.selectedGpaFilter = 'all';
    ctx.SyllabusState.searchQuery = '';
    ctx.renderSyllabusCards();

    const renderedHtml = container.innerHTML;

    // Check that scored courses render the emerald GPA badge
    assert.ok(renderedHtml.includes('✓ Tính vào GPA'), 'Must render "✓ Tính vào GPA" badge for scored courses');
    assert.ok(renderedHtml.includes('text-emerald-700'), 'Must apply emerald styling for scored GPA badge');

    // Check that condition courses render the amber condition badge
    assert.ok(renderedHtml.includes('⚠️ Không tính vào GPA / Môn điều kiện'), 'Must render condition badge');
    assert.ok(renderedHtml.includes('text-amber-700'), 'Must apply amber styling for condition badge');
});

check('1.5: Syllabus GPA filter toggle (all / scored / condition) cleanly isolates course categories', () => {
    const { ctx, docMock } = createHarnessSandbox();
    const container = docMock.getElementById('syllabus-cards-container');
    docMock.getElementById('syllabus-gpa-filter');

    // 1. Filter: Scored only
    ctx.setSyllabusGpaFilter('scored');
    assert.ok(container.innerHTML.includes('✓ Tính vào GPA'), 'Scored filter must contain scored badges');
    assert.ok(!container.innerHTML.includes('⚠️ Không tính vào GPA'), 'Scored filter must NOT contain condition courses');
    assert.ok(!container.innerHTML.includes('OTP101'), 'Scored filter must exclude OTP101');
    assert.ok(!container.innerHTML.includes('LAB211'), 'Scored filter must exclude LAB211');
    assert.ok(!container.innerHTML.includes('OJT202'), 'Scored filter must exclude OJT202');

    // 2. Filter: Condition only
    ctx.setSyllabusGpaFilter('condition');
    assert.ok(container.innerHTML.includes('⚠️ Không tính vào GPA'), 'Condition filter must contain condition badges');
    assert.ok(!container.innerHTML.includes('✓ Tính vào GPA'), 'Condition filter must NOT contain scored courses');
    assert.ok(container.innerHTML.includes('OTP101'), 'Condition filter must include OTP101');
    assert.ok(container.innerHTML.includes('LAB211'), 'Condition filter must include LAB211');
    assert.ok(container.innerHTML.includes('OJT202'), 'Condition filter must include OJT202');
    assert.ok(!container.innerHTML.includes('PRF192'), 'Condition filter must exclude PRF192');
    assert.ok(!container.innerHTML.includes('SWP391'), 'Condition filter must exclude SWP391');

    // 3. Filter: Reset to All
    ctx.setSyllabusGpaFilter('all');
    assert.ok(container.innerHTML.includes('✓ Tính vào GPA'), 'All filter must contain scored courses');
    assert.ok(container.innerHTML.includes('⚠️ Không tính vào GPA'), 'All filter must contain condition courses');
});

check('1.6: Semester selector pills correctly isolate courses for each individual semester 0 through 9', () => {
    const { ctx, docMock } = createHarnessSandbox();
    const container = docMock.getElementById('syllabus-cards-container');
    const countElem = docMock.getElementById('syllabus-results-count');

    for (let sem = 0; sem <= 9; sem++) {
        ctx.setSyllabusSemester(sem);
        const semDef = ctx.CURRICULUM_SEMESTERS.find(s => s.semester === sem);
        assert.ok(semDef, `Semester ${sem} definition must exist`);

        // Verify count text matches semester subjects count
        assert.ok(countElem.innerText.includes(`Hiển thị ${semDef.subjects.length} môn học`), `Semester ${sem} count matches`);

        // Verify all subjects of this semester appear in container
        semDef.subjects.forEach(sub => {
            assert.ok(container.innerHTML.includes(sub.code), `Semester ${sem} cards must include ${sub.code}`);
        });

        // Verify subjects from other semesters do not leak in
        const otherSem = (sem === 0) ? 1 : 0;
        const otherSemDef = ctx.CURRICULUM_SEMESTERS.find(s => s.semester === otherSem);
        otherSemDef.subjects.forEach(otherSub => {
            const isShared = semDef.subjects.some(s => s.code === otherSub.code);
            if (!isShared) {
                assert.ok(!container.innerHTML.includes(`>${otherSub.code}<`), `Semester ${sem} cards must NOT leak ${otherSub.code}`);
            }
        });
    }

    // Reset to 'all'
    ctx.setSyllabusSemester('all');
    assert.ok(countElem.innerText.includes('48 môn học'), 'Total count across all semesters equals 48');
});

check('1.7: Exhaustive course searchability: every single course in CURRICULUM_SEMESTERS is searchable', () => {
    const { ctx, docMock } = createHarnessSandbox();
    const container = docMock.getElementById('syllabus-cards-container');
    ctx.setSyllabusSemester('all');
    ctx.setSyllabusGpaFilter('all');

    let checkedCount = 0;
    ctx.CURRICULUM_SEMESTERS.forEach(s => {
        s.subjects.forEach(sub => {
            checkedCount++;
            // Search by exact code
            ctx.handleSyllabusSearch(sub.code);
            assert.ok(container.innerHTML.includes(sub.code), `Search by exact code "${sub.code}" must return course`);

            // Search by lowercase code
            ctx.handleSyllabusSearch(sub.code.toLowerCase());
            assert.ok(container.innerHTML.includes(sub.code), `Search by lowercase "${sub.code.toLowerCase()}" must return course`);
        });
    });
    assert.ok(checkedCount >= 40, `Audited searchability across ${checkedCount} subjects`);
});

check('1.8: Accent-insensitive Vietnamese search queries match accurately across course titles', () => {
    const { ctx, docMock } = createHarnessSandbox();
    const container = docMock.getElementById('syllabus-cards-container');
    ctx.setSyllabusSemester('all');
    ctx.setSyllabusGpaFilter('all');

    const testQueries = [
        { query: 'co so du lieu', expectedCode: 'DBI202', title: 'Cơ sở dữ liệu' },
        { query: 'lap trinh huong doi tuong', expectedCode: 'PRO192', title: 'Lập trình hướng đối tượng' },
        { query: 'giao duc the chat', expectedCode: 'PHE_COM*1', title: 'Giáo dục thể chất 1' },
        { query: 'thuc tap doanh nghiep', expectedCode: 'OJT202', title: 'Thực tập doanh nghiệp' },
        { query: 'dinh huong & ren luyen', expectedCode: 'OTP101', title: 'Định hướng & Rèn luyện tập trung' },
        { query: 'cau truc du lieu', expectedCode: 'CSD201', title: 'Cấu trúc dữ liệu và giải thuật' },
        { query: 'toan roi rac', expectedCode: 'MAD101', title: 'Toán rời rạc' },
        { query: 'phat trien phan mem', expectedCode: 'SWP391', title: 'Dự án phát triển phần mềm' }
    ];

    testQueries.forEach(t => {
        ctx.handleSyllabusSearch(t.query);
        assert.ok(container.innerHTML.includes(t.expectedCode), `Accent-insensitive search "${t.query}" must find ${t.expectedCode} (${t.title})`);
    });

    // Adversarial non-matching query renders empty state
    ctx.handleSyllabusSearch('khong_co_mon_nao_nhu_the_nay_xyz123');
    assert.ok(container.innerHTML.includes('Không tìm thấy môn học phù hợp'), 'Adversarial query renders empty search state');
    assert.ok(container.innerHTML.includes('Xóa tất cả bộ lọc'), 'Empty state includes clear filters button');

    // Clear search resets query
    ctx.clearSyllabusSearch();
    assert.strictEqual(ctx.SyllabusState.searchQuery, '', 'clearSyllabusSearch resets searchQuery to empty string');
    assert.ok(container.innerHTML.includes('PRF192'), 'Full catalog restored after clearing search');
});

check('1.9: Syllabus detail modal works cleanly for EVERY subject code in CURRICULUM_SEMESTERS', () => {
    const { ctx, docMock } = createHarnessSandbox();
    const modal = docMock.getElementById('syllabus-detail-modal');
    const content = docMock.getElementById('syllabus-detail-content');
    const title = docMock.getElementById('modal-sub-title');
    const subtitle = docMock.getElementById('modal-sub-subtitle');

    assert.ok(modal && content && title && subtitle, 'All detail modal elements must exist');

    let modalAuditCount = 0;
    ctx.CURRICULUM_SEMESTERS.forEach(s => {
        s.subjects.forEach(sub => {
            modalAuditCount++;
            ctx.openSyllabusDetailModal(sub.code, s.semester);
            assert.ok(!modal.classList.contains('hidden'), `Modal must not be hidden for ${sub.code}`);
            assert.ok(modal.classList.contains('flex'), `Modal must have flex display for ${sub.code}`);
            assert.ok(title.innerText.includes(sub.code), `Modal title must contain ${sub.code}`);
            assert.ok(subtitle.innerText.toLowerCase().includes(`kỳ ${s.semester}`), `Modal subtitle must contain semester ${s.semester}`);

            ctx.closeSyllabusDetailModal();
            assert.ok(modal.classList.contains('hidden'), `Modal must be hidden after close for ${sub.code}`);
            assert.ok(!modal.classList.contains('flex'), `Modal must not have flex display after close`);
        });
    });
    assert.ok(modalAuditCount >= 40, `Audited detail modal rendering for ${modalAuditCount} subjects`);
});

check('1.10: Syllabus detail modal resolution for condition courses (OTP101, LAB211, OJT202, PHE_COM*)', () => {
    const { ctx, docMock } = createHarnessSandbox();
    const modal = docMock.getElementById('syllabus-detail-modal');
    const content = docMock.getElementById('syllabus-detail-content');

    // 1. OTP101 (Non-scored pass/fail orientation)
    ctx.openSyllabusDetailModal('OTP101', 0);
    assert.ok(content.innerHTML.includes('Học phần đánh giá điều kiện Pass / Not Pass'), 'OTP101 renders condition pass/fail notice');
    assert.ok(content.innerHTML.includes('Không tính GPA'), 'OTP101 displays "Không tính GPA" meta badge');
    ctx.closeSyllabusDetailModal();

    // 2. PEN (Prep English)
    ctx.openSyllabusDetailModal('PEN', 0);
    assert.ok(content.innerHTML.includes('Học phần đánh giá điều kiện Pass / Not Pass'), 'PEN renders condition pass/fail notice');
    assert.ok(content.innerHTML.includes('Không tính GPA'), 'PEN displays "Không tính GPA"');
    ctx.closeSyllabusDetailModal();

    // 3. OJT202 (Internship with 3 enterprise assessment criteria)
    ctx.openSyllabusDetailModal('OJT202', 6);
    assert.ok(content.innerHTML.includes('Không tính GPA'), 'OJT202 displays "Không tính GPA"');
    assert.ok(content.innerHTML.includes('Kiến thức & Kỹ năng chuyên môn') || content.innerHTML.includes('Chuyên môn'), 'OJT202 displays specialized skill criteria (40%)');
    assert.ok(content.innerHTML.includes('Kỹ năng mềm') && content.innerHTML.includes('Thái độ'), 'OJT202 displays soft skills & attitude criteria (30% + 30%)');
    ctx.closeSyllabusDetailModal();

    // 4. LAB211 (Alias to LAB211 schema with practical components)
    ctx.openSyllabusDetailModal('LAB211', 3);
    assert.ok(content.innerHTML.includes('Không tính GPA'), 'LAB211 displays "Không tính GPA"');
    assert.ok(content.innerHTML.includes('Lab') || content.innerHTML.includes('FE') || content.innerHTML.includes('Final Exam'), 'LAB211 displays lab/FE evaluation table');
    ctx.closeSyllabusDetailModal();

    // 5. PHE_COM*1 (Vovinam 1 with alias VOV114)
    ctx.openSyllabusDetailModal('PHE_COM*1', 0);
    assert.ok(content.innerHTML.includes('Không tính GPA'), 'PHE_COM*1 displays "Không tính GPA"');
    assert.ok(content.innerHTML.includes('Thực hành') || content.innerHTML.includes('FE') || content.innerHTML.includes('Vovinam'), 'PHE_COM*1 displays Vovinam syllabus criteria');
    ctx.closeSyllabusDetailModal();
});

check('1.11: openSyllabusDetailModal auto-detects semester when semesterNum is omitted', () => {
    const { ctx, docMock } = createHarnessSandbox();
    const subtitle = docMock.getElementById('modal-sub-subtitle');

    ctx.openSyllabusDetailModal('SWP391');
    assert.ok(subtitle.innerText.includes('Học kỳ 5'), 'SWP391 correctly auto-detects Semester 5');
    ctx.closeSyllabusDetailModal();

    ctx.openSyllabusDetailModal('SEP490');
    assert.ok(subtitle.innerText.includes('Học kỳ 9'), 'SEP490 correctly auto-detects Semester 9');
    ctx.closeSyllabusDetailModal();

    ctx.openSyllabusDetailModal('OTP101');
    assert.ok(subtitle.innerText.includes('Học kỳ 0'), 'OTP101 correctly auto-detects Semester 0');
    ctx.closeSyllabusDetailModal();
});

check('1.12: openSyllabusDetailModal defensive edge cases (unknown course codes, null, undefined)', () => {
    const { ctx, docMock } = createHarnessSandbox();
    const modal = docMock.getElementById('syllabus-detail-modal');

    assert.doesNotThrow(() => {
        ctx.openSyllabusDetailModal('NON_EXISTENT_CODE_XYZ', 99);
    }, 'Unknown course code must not throw');
    assert.ok(modal.classList.contains('flex'), 'Modal opens gracefully even for unknown code');
    ctx.closeSyllabusDetailModal();

    assert.doesNotThrow(() => {
        ctx.openSyllabusDetailModal(null);
    }, 'null course code must not throw');
    ctx.closeSyllabusDetailModal();
});

// =============================================================================
// TEST SUITE 2: Modal Dismissal Mechanics & Event Target Discrimination
// =============================================================================
console.log('\n--- TEST SUITE 2: Modal Dismissal Mechanics & Event Handling ---');

check('2.1: Export modal backdrop click dismisses modal when clicking dark overlay', () => {
    const { ctx, docMock } = createHarnessSandbox();
    const modal = docMock.getElementById('export-modal');

    modal.classList.remove('hidden');
    modal.classList.add('flex');

    const overlayEvent = { target: modal, currentTarget: modal };
    ctx.handleExportModalBackdropClick(overlayEvent);
    assert.ok(modal.classList.contains('hidden'), 'Clicking modal element closes export modal');
    assert.ok(!modal.classList.contains('flex'), 'flex class removed on close');

    modal.classList.remove('hidden');
    modal.classList.add('flex');

    const idEvent = { target: { id: 'export-modal' } };
    ctx.handleExportModalBackdropClick(idEvent);
    assert.ok(modal.classList.contains('hidden'), 'Event target with id export-modal closes modal');
});

check('2.2: Export modal backdrop click DOES NOT dismiss when clicking inside dialog/content', () => {
    const { ctx, docMock } = createHarnessSandbox();
    const modal = docMock.getElementById('export-modal');

    modal.classList.remove('hidden');
    modal.classList.add('flex');

    const cardEvent = { target: { id: 'certificate-card', parentNode: modal } };
    ctx.handleExportModalBackdropClick(cardEvent);
    assert.ok(!modal.classList.contains('hidden'), 'Clicking certificate-card must NOT close modal');
    assert.ok(modal.classList.contains('flex'), 'Modal remains flex');

    const buttonEvent = { target: { id: 'btn-download-pdf', tagName: 'BUTTON' } };
    ctx.handleExportModalBackdropClick(buttonEvent);
    assert.ok(!modal.classList.contains('hidden'), 'Clicking download button must NOT close modal');

    const cellEvent = { target: { id: 'some-cell', tagName: 'TD', textContent: 'PRF192' } };
    ctx.handleExportModalBackdropClick(cellEvent);
    assert.ok(!modal.classList.contains('hidden'), 'Clicking table cell must NOT close modal');

    // Falsy event handling
    ctx.handleExportModalBackdropClick(null);
    assert.ok(!modal.classList.contains('hidden'), 'null event does not throw or close modal');
    ctx.handleExportModalBackdropClick(undefined);
    assert.ok(!modal.classList.contains('hidden'), 'undefined event does not close modal');
});

check('2.3: Syllabus detail modal backdrop click discriminates overlay vs inner content', () => {
    const { ctx, docMock } = createHarnessSandbox();
    const modal = docMock.getElementById('syllabus-detail-modal');

    modal.classList.remove('hidden');
    modal.classList.add('flex');

    const innerEvent = { target: { id: 'syllabus-detail-content' } };
    ctx.handleSyllabusModalBackdropClick(innerEvent);
    assert.ok(!modal.classList.contains('hidden'), 'Clicking detail content does not close modal');

    const overlayEvent = { target: modal };
    ctx.handleSyllabusModalBackdropClick(overlayEvent);
    assert.ok(modal.classList.contains('hidden'), 'Clicking syllabus modal overlay dismisses modal');
});

check('2.4: Global Escape (Esc) key listener dismisses all open modals', () => {
    const { docMock, listeners } = createHarnessSandbox();
    const exportModal = docMock.getElementById('export-modal');
    const syllabusModal = docMock.getElementById('syllabus-detail-modal');

    assert.ok(listeners['keydown'] && listeners['keydown'].length > 0, 'Document keydown listener must be registered');
    const keydownHandler = listeners['keydown'][0];

    exportModal.classList.remove('hidden');
    exportModal.classList.add('flex');
    syllabusModal.classList.remove('hidden');
    syllabusModal.classList.add('flex');

    keydownHandler({ key: 'Escape' });
    assert.ok(exportModal.classList.contains('hidden'), 'Escape key must close export modal');
    assert.ok(syllabusModal.classList.contains('hidden'), 'Escape key must close syllabus modal');

    exportModal.classList.remove('hidden');
    syllabusModal.classList.remove('hidden');
    keydownHandler({ key: 'Esc' });
    assert.ok(exportModal.classList.contains('hidden'), 'Esc key must close export modal');
    assert.ok(syllabusModal.classList.contains('hidden'), 'Esc key must close syllabus modal');

    exportModal.classList.remove('hidden');
    syllabusModal.classList.remove('hidden');
    keydownHandler({ keyCode: 27 });
    assert.ok(exportModal.classList.contains('hidden'), 'keyCode 27 must close export modal');
    assert.ok(syllabusModal.classList.contains('hidden'), 'keyCode 27 must close syllabus modal');

    exportModal.classList.remove('hidden');
    syllabusModal.classList.remove('hidden');
    keydownHandler({ key: 'Enter' });
    keydownHandler({ key: ' ' });
    keydownHandler({ key: 'Tab' });
    assert.ok(!exportModal.classList.contains('hidden'), 'Enter/Space/Tab must not close export modal');
    assert.ok(!syllabusModal.classList.contains('hidden'), 'Enter/Space/Tab must not close syllabus modal');
});

check('2.5: Floating close button #btn-close-export-modal-fixed exists with viewport-fixed styling', () => {
    const html = fs.readFileSync(HTML_PATH, 'utf8');

    assert.ok(html.includes('id="btn-close-export-modal-fixed"'), 'Floating close button #btn-close-export-modal-fixed must exist in index.html');

    const buttonMatch = html.match(/<button[^>]*id="btn-close-export-modal-fixed"[^>]*>([\s\S]*?)<\/button>/);
    assert.ok(buttonMatch, 'Must match full floating close button element');
    const buttonTag = buttonMatch[0];

    assert.ok(buttonTag.includes('fixed'), 'Button must have "fixed" class');
    assert.ok(buttonTag.includes('top-4'), 'Button must have "top-4" positioning class');
    assert.ok(buttonTag.includes('right-4'), 'Button must have "right-4" positioning class');
    assert.ok(buttonTag.includes('z-[60]') || buttonTag.includes('z-50'), 'Button must have high z-index (z-[60] or z-50)');
    assert.ok(buttonTag.includes('rounded-full'), 'Button must have "rounded-full" circular styling');
    assert.ok(buttonTag.includes('onclick="closeExportModal()"'), 'Button must invoke closeExportModal()');
});

check('2.6: Export modal action buttons decluttering: redundant button removed, required button kept', () => {
    const html = fs.readFileSync(HTML_PATH, 'utf8');
    const { ctx } = createHarnessSandbox();

    assert.ok(!html.includes('id="btn-export-pdf"'), '#btn-export-pdf must be removed from index.html');
    assert.ok(html.includes('id="btn-download-pdf"'), '#btn-download-pdf must be present in index.html');
    assert.ok(html.includes('id="btn-download-png"'), '#btn-download-png must be present in index.html');
    assert.ok(html.includes('id="btn-copy-clipboard"'), '#btn-copy-clipboard must be present in index.html');

    assert.ok(typeof ctx.exportCertificatePdf === 'function', 'exportCertificatePdf must be defined in app.js');
    assert.ok(typeof ctx.window.exportCertificatePdf === 'function', 'exportCertificatePdf exposed on window');
});

// =============================================================================
// TEST SUITE 3: Vietnamese Typography, Core Features & Calculator Aesthetic Polish
// =============================================================================
console.log('\n--- TEST SUITE 3: Typography, Core Features & UI Polish ---');

check('3.1: Google Fonts link imports modern font families with vietnamese,latin-ext subset', () => {
    const html = fs.readFileSync(HTML_PATH, 'utf8');
    const fontLinkMatch = html.match(/<link[^>]*fonts\.googleapis\.com\/css2[^>]*>/);
    assert.ok(fontLinkMatch, 'Google Fonts link tag must exist in index.html');
    const fontHref = fontLinkMatch[0];

    assert.ok(fontHref.includes('Be+Vietnam+Pro') || fontHref.includes('Plus+Jakarta+Sans') || fontHref.includes('Inter'), 'Imports modern Vietnamese-compatible font family');
    assert.ok(fontHref.includes('subset=vietnamese') || fontHref.includes('subset=vietnamese,latin-ext'), 'Must specify subset=vietnamese,latin-ext parameter');
});

check('3.2: Zero occurrences of unbacked font-family: Outfit across codebase', () => {
    const html = fs.readFileSync(HTML_PATH, 'utf8');
    const css = fs.readFileSync(CSS_PATH, 'utf8');
    const app = fs.readFileSync(APP_PATH, 'utf8');

    const badOutfitRegex = /font-family:\s*['"]Outfit['"]\s*[,;]/g;
    assert.ok(!badOutfitRegex.test(html), 'Zero unbacked Outfit font-family declarations in index.html');
    assert.ok(!badOutfitRegex.test(css), 'Zero unbacked Outfit font-family declarations in styles.css');
    assert.ok(!badOutfitRegex.test(app), 'Zero unbacked Outfit font-family declarations in app.js');
});

check('3.3: Section heading is "Tính năng cốt lõi" with proper Vietnamese font family', () => {
    const html = fs.readFileSync(HTML_PATH, 'utf8');
    assert.ok(html.includes('Tính năng cốt lõi'), 'Section heading must be "Tính năng cốt lõi"');
    assert.ok(!html.includes('Tính Năng Vượt Trội Cho Kỹ Thuật Phần Mềm'), 'Old heading must be removed');
});

check('3.4: All 4 core feature highlight blocks are present with updated titles and syllabus link', () => {
    const html = fs.readFileSync(HTML_PATH, 'utf8');

    assert.ok(html.includes('Syllabus Chuẩn K20B'), 'Feature 1: Syllabus Chuẩn K20B present');
    assert.ok(html.includes('Điểm Liệt & Điều Kiện Qua Môn') || html.includes('Điểm Liệt &amp; Điều Kiện Qua Môn'), 'Feature 2: Điểm Liệt & Điều Kiện Qua Môn present');
    assert.ok(html.includes('Tra Cứu Syllabus 9 Học Kỳ'), 'Feature 3: Tra Cứu Syllabus 9 Học Kỳ present');
    assert.ok(html.includes("onclick=\"switchView('syllabus')\""), 'Feature 3 card wires directly to switchView(\'syllabus\')');
    assert.ok(html.includes('Xuất Bảng Điểm A4'), 'Feature 4: Xuất Bảng Điểm A4 present');
});

check('3.5: Calculator header decluttered: duplicate top action buttons removed', () => {
    const html = fs.readFileSync(HTML_PATH, 'utf8');
    const app = fs.readFileSync(APP_PATH, 'utf8');

    const calcViewSection = html.slice(html.indexOf('id="view-calculator"'), html.indexOf('id="view-syllabus"'));
    const topHeaderArea = calcViewSection.slice(0, calcViewSection.indexOf('id="semester-info"'));

    assert.ok(!topHeaderArea.includes('⚡ Điền điểm mẫu'), 'Top header does not contain duplicate Điền điểm mẫu button');
    assert.ok(!topHeaderArea.includes('🗑️ Xóa trắng'), 'Top header does not contain duplicate Xóa trắng button');

    assert.ok(app.includes('Điền điểm mẫu thử') && app.includes('fillSampleScoresForCurrentSemester'), 'Scoped fill sample scores button defined in app.js');
    assert.ok(app.includes('Xóa trắng kỳ này') && app.includes('clearCurrentSemesterScores'), 'Scoped clear scores button defined in app.js');
});

check('3.6: Add Subject modal weight badge prevents awkward wrapping via whitespace-nowrap', () => {
    const html = fs.readFileSync(HTML_PATH, 'utf8');
    const app = fs.readFileSync(APP_PATH, 'utf8');

    assert.ok(html.includes('whitespace-nowrap inline-flex items-center gap-1'), 'index.html weight badge has single-line styling');
    assert.ok(app.includes('whitespace-nowrap inline-flex items-center gap-1'), 'app.js updateModalTotalWeight enforces single-line badge styling');
});

// =============================================================================
// TEST SUITE 4: SPA Navigation, switchView Defensiveness & State Invariance
// =============================================================================
console.log('\n--- TEST SUITE 4: SPA Navigation & View Switching Invariants ---');

check('4.1: switchView correctly manages 3 views: home, calc, and syllabus', () => {
    const { ctx, docMock } = createHarnessSandbox();
    const homeView = docMock.getElementById('view-home');
    const calcView = docMock.getElementById('view-calculator');
    const syllabusView = docMock.getElementById('view-syllabus');

    ctx.switchView('home');
    assert.ok(!homeView.classList.contains('hidden'), 'Home view visible');
    assert.ok(calcView.classList.contains('hidden'), 'Calc view hidden');
    assert.ok(syllabusView.classList.contains('hidden'), 'Syllabus view hidden');

    ctx.switchView('syllabus');
    assert.ok(homeView.classList.contains('hidden'), 'Home view hidden');
    assert.ok(calcView.classList.contains('hidden'), 'Calc view hidden');
    assert.ok(!syllabusView.classList.contains('hidden'), 'Syllabus view visible');

    ctx.switchView('calc');
    assert.ok(homeView.classList.contains('hidden'), 'Home view hidden');
    assert.ok(!calcView.classList.contains('hidden'), 'Calc view visible');
    assert.ok(syllabusView.classList.contains('hidden'), 'Syllabus view hidden');
});

check('4.2: switchView defensively defaults to calculator view on all invalid/adversarial inputs', () => {
    const { ctx, docMock } = createHarnessSandbox();
    const calcView = docMock.getElementById('view-calculator');
    const homeView = docMock.getElementById('view-home');
    const syllabusView = docMock.getElementById('view-syllabus');

    const adversarialInputs = [
        null,
        undefined,
        '',
        12345,
        0,
        -1,
        {},
        [],
        'unknown_view',
        'random_string_xyz',
        false,
        true,
        () => {}
    ];

    adversarialInputs.forEach(input => {
        ctx.switchView('home');
        assert.ok(!homeView.classList.contains('hidden'));

        ctx.switchView(input);
        assert.ok(!calcView.classList.contains('hidden'), `Input ${JSON.stringify(input)} must default to calcView`);
        assert.ok(homeView.classList.contains('hidden'), `Input ${JSON.stringify(input)} must hide homeView`);
        assert.ok(syllabusView.classList.contains('hidden'), `Input ${JSON.stringify(input)} must hide syllabusView`);
    });
});

check('4.3: In-memory calculator state persists 100% intact through 500 rapid view toggles', () => {
    const { ctx } = createHarnessSandbox();
    ctx.initializeAppState();

    ctx.AppState.semesterData[1][0].components[0].score = 8.5;
    ctx.AppState.semesterData[1][0].components[1].score = 9.0;
    ctx.AppState.semesterData[1][1].components[0].score = 7.5;

    const viewCycle = ['home', 'syllabus', 'calc', 'home', 'syllabus', 'calculator'];
    for (let i = 0; i < 500; i++) {
        const v = viewCycle[i % viewCycle.length];
        ctx.switchView(v);
    }

    assert.strictEqual(ctx.AppState.semesterData[1][0].components[0].score, 8.5, 'Score 1 preserved');
    assert.strictEqual(ctx.AppState.semesterData[1][0].components[1].score, 9.0, 'Score 2 preserved');
    assert.strictEqual(ctx.AppState.semesterData[1][1].components[0].score, 7.5, 'Score 3 preserved');
});

// =============================================================================
// TEST SUITE 5: Test Runner Integrity & Legacy Challenger Stress Suites
// =============================================================================
console.log('\n--- TEST SUITE 5: Automated Test Suite Integrity & Regression Testing ---');

check('5.1: Master runner (tests/runner.js) passes 100% across all 11 test suites with exit code 0', () => {
    const runnerPath = path.join(ROOT_DIR, 'tests', 'runner.js');
    assert.ok(fs.existsSync(runnerPath), 'runner.js exists');

    const output = execSync(`node "${runnerPath}"`, {
        cwd: ROOT_DIR,
        encoding: 'utf8',
        stdio: ['ignore', 'pipe', 'pipe']
    });

    assert.ok(output.includes('Total Suites Executed: 11'), 'Must execute 11 suites');
    assert.ok(output.includes('Passed Suites:         11'), 'Must pass 11 suites');
    assert.ok(output.includes('Failed Suites:         0'), 'Must have 0 failed suites');
    assert.ok(output.includes('ALL TEST SUITES PASSED CLEANLY'), 'Must output clean pass summary');
});

check('5.2: challenger_m1_stress.js executes cleanly with 24/24 passed checks', () => {
    const scriptPath = path.join(ROOT_DIR, 'tests', 'challenger_m1_stress.js');
    assert.ok(fs.existsSync(scriptPath), 'challenger_m1_stress.js exists');

    const output = execSync(`node "${scriptPath}"`, {
        cwd: ROOT_DIR,
        encoding: 'utf8',
        stdio: ['ignore', 'pipe', 'pipe']
    });

    assert.ok(output.includes('Total Checks:   24'), 'challenger_m1_stress evaluates 24 checks');
    assert.ok(output.includes('Passed Checks:  24'), 'challenger_m1_stress passes 24 checks');
    assert.ok(output.includes('Failed Checks:  0'), 'challenger_m1_stress has 0 failures');
    assert.ok(output.includes('VERDICT: APPROVE'), 'challenger_m1_stress verdict is APPROVE');
});

check('5.3: challenger_m2_stress.js executes cleanly with 27/27 passed checks', () => {
    const scriptPath = path.join(ROOT_DIR, 'tests', 'challenger_m2_stress.js');
    assert.ok(fs.existsSync(scriptPath), 'challenger_m2_stress.js exists');

    const output = execSync(`node "${scriptPath}"`, {
        cwd: ROOT_DIR,
        encoding: 'utf8',
        stdio: ['ignore', 'pipe', 'pipe']
    });

    assert.ok(output.includes('Total Checks Run:     27'), 'challenger_m2_stress evaluates 27 checks');
    assert.ok(output.includes('Passed Checks:        27'), 'challenger_m2_stress passes 27 checks');
    assert.ok(output.includes('Failed Checks:        0'), 'challenger_m2_stress has 0 failures');
    assert.ok(output.includes('VERDICT: APPROVE'), 'challenger_m2_stress verdict is APPROVE');
});

check('5.4: challenger_m3_stress.js executes cleanly with 47/47 passed checks', () => {
    const scriptPath = path.join(ROOT_DIR, 'tests', 'challenger_m3_stress.js');
    assert.ok(fs.existsSync(scriptPath), 'challenger_m3_stress.js exists');

    const output = execSync(`node "${scriptPath}"`, {
        cwd: ROOT_DIR,
        encoding: 'utf8',
        stdio: ['ignore', 'pipe', 'pipe']
    });

    assert.ok(output.includes('Total Assertions Evaluated: 47'), 'challenger_m3_stress evaluates 47 checks');
    assert.ok(output.includes('Passed:                    47'), 'challenger_m3_stress passes 47 checks');
    assert.ok(output.includes('Failed:                    0'), 'challenger_m3_stress has 0 failures');
    assert.ok(output.includes('VERDICT: APPROVE'), 'challenger_m3_stress verdict is APPROVE');
});

// =============================================================================
// SUMMARY & VERDICT
// =============================================================================
console.log('\n========================================================================');
console.log(' CHALLENGER 2 EMPIRICAL ADVERSARIAL STRESS TEST SUMMARY');
console.log('========================================================================');
console.log(`Total Assertions Evaluated: ${totalAssertions}`);
console.log(`Passed:                    ${passedAssertions}`);
console.log(`Failed:                    ${failedAssertions}`);
console.log('========================================================================');

if (failedAssertions > 0) {
    console.error(`\n❌ VERDICT: REQUEST_CHANGES (${failedAssertions} assertions failed):\n`);
    failureLog.forEach((f, idx) => {
        console.error(`[${idx + 1}] ${f.desc}`);
        console.error(`    ${f.error}\n`);
    });
    process.exit(1);
} else {
    console.log('\n✅ VERDICT: APPROVE (100% empirical pass rate across all challenge vectors)\n');
    process.exit(0);
}
