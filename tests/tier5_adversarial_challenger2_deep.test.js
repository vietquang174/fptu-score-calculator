/**
 * Tier 5 Adversarial Deep Challenge Suite: Challenger 2
 * Milestone 1 Deep Stress Testing:
 * 1. Standard A4 Proportions & Dimensions (1:1.414 aspect ratio, 794px x 1123px, print & sandbox)
 * 2. Export Sandbox Lifecycle & Memory/DOM Cleanup Under Adversarial Pressure
 * 3. Component Breakdown with % Weights Across All 10 Semesters (0 - 9)
 */

const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const fs = require('node:fs');
const vm = require('node:vm');

const ROOT_DIR = path.resolve(__dirname, '..');
const APP_DIR = path.join(ROOT_DIR, 'ScoreCalculator');
const DATA_PATH = path.join(APP_DIR, 'data.js');
const APP_PATH = path.join(APP_DIR, 'app.js');
const CSS_PATH = path.join(APP_DIR, 'styles.css');
const HTML_PATH = path.join(APP_DIR, 'index.html');

/**
 * High-fidelity DOM simulation node
 */
function createMockNode(tagName = 'DIV', initialId = '') {
    return {
        tagName: tagName.toUpperCase(),
        id: initialId,
        className: '',
        innerHTML: '',
        innerText: '',
        textContent: '',
        style: {},
        parentNode: null,
        children: [],
        disabled: false,
        download: '',
        href: '',
        classList: {
            _classes: new Set(),
            add(...cls) { cls.forEach(c => c && this._classes.add(c)); },
            remove(...cls) { cls.forEach(c => this._classes.delete(c)); },
            contains(c) { return this._classes.has(c); },
            toggle(c) {
                if (this._classes.has(c)) { this._classes.delete(c); return false; }
                this._classes.add(c); return true;
            }
        },
        appendChild(child) {
            if (!child) return child;
            if (child.parentNode) child.parentNode.removeChild(child);
            child.parentNode = this;
            this.children.push(child);
            return child;
        },
        removeChild(child) {
            const idx = this.children.indexOf(child);
            if (idx > -1) {
                this.children.splice(idx, 1);
                child.parentNode = null;
            }
            return child;
        },
        remove() {
            if (this.parentNode) this.parentNode.removeChild(this);
        },
        cloneNode(deep = true) {
            const clone = createMockNode(this.tagName, this.id ? `${this.id}_clone` : '');
            clone.className = this.className;
            clone.innerHTML = this.innerHTML;
            clone.innerText = this.innerText;
            clone.textContent = this.textContent;
            clone.style = { ...this.style };
            this.classList._classes.forEach(c => clone.classList.add(c));
            if (deep && this.children.length > 0) {
                this.children.forEach(ch => clone.appendChild(ch.cloneNode(true)));
            }
            return clone;
        }
    };
}

function findNodeById(root, id) {
    if (!root) return null;
    if (root.id === id) return root;
    for (const child of root.children) {
        const found = findNodeById(child, id);
        if (found) return found;
    }
    return null;
}

function makeComp(name, weight, score, isFE = false) {
    const valStr = (score !== null && score !== undefined) ? String(score) : "";
    return {
        id: 'comp_' + Math.random().toString(36).substr(2, 6),
        name,
        weight,
        minScore: isFE ? 4.0 : 0,
        parts: 1,
        isSubParts: false,
        mode: "average",
        isFE: !!isFE,
        avgValue: valStr,
        subValues: [valStr]
    };
}

function setupVMEnvironment(options = {}) {
    const documentBody = createMockNode('BODY');
    const documentHead = createMockNode('HEAD');
    const documentElement = createMockNode('HTML');
    documentElement.appendChild(documentHead);
    documentElement.appendChild(documentBody);

    const certCard = createMockNode('DIV', 'certificate-card');
    documentBody.appendChild(certCard);

    const exportModal = createMockNode('DIV', 'export-modal');
    exportModal.classList.add('hidden');
    documentBody.appendChild(exportModal);

    const btnPng = createMockNode('BUTTON', 'btn-download-png');
    documentBody.appendChild(btnPng);
    const btnPdf = createMockNode('BUTTON', 'btn-download-pdf');
    documentBody.appendChild(btnPdf);
    const btnCopy = createMockNode('BUTTON', 'btn-copy-clipboard');
    documentBody.appendChild(btnCopy);

    const html2canvasInvocations = [];
    let html2canvasFn = async (el, opts) => {
        html2canvasInvocations.push({ el, opts });
        if (options.html2canvasThrowsSync) throw new Error('html2canvas Sync Crash');
        if (options.html2canvasRejects) return Promise.reject(new Error('html2canvas Async Rejection'));
        return {
            toDataURL: (type) => `data:${type || 'image/png'};base64,FAKEIMAGE`,
            toBlob: (cb) => cb({ size: 1000 })
        };
    };

    if (options.html2canvasMissing) html2canvasFn = undefined;

    const docMock = {
        body: documentBody,
        head: documentHead,
        documentElement: documentElement,
        createElement: (tag) => createMockNode(tag),
        getElementById: (id) => findNodeById(documentBody, id) || findNodeById(documentHead, id) || null,
        addEventListener: () => {}
    };

    const winMock = {
        document: docMock,
        innerWidth: options.innerWidth || 1024,
        innerHeight: options.innerHeight || 768,
        location: { href: 'http://localhost/' },
        print: () => { winMock.printed = true; },
        printed: false,
        jspdf: options.jspdf ? { jsPDF: options.jspdf } : undefined,
        requestAnimationFrame: (fn) => setTimeout(fn, 0)
    };

    const sandbox = {
        console: { ...console, error: () => {}, warn: () => {} },
        document: docMock,
        window: winMock,
        html2canvas: html2canvasFn,
        confetti: () => {},
        showToast: () => {},
        requestAnimationFrame: (fn) => setTimeout(fn, 0),
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
        JSON
    };

    const ctx = vm.createContext(sandbox);
    const dataCode = fs.readFileSync(DATA_PATH, 'utf8');
    vm.runInContext(dataCode, ctx, { filename: 'data.js' });
    const appCode = fs.readFileSync(APP_PATH, 'utf8');
    vm.runInContext(appCode, ctx, { filename: 'app.js' });

    const exposed = vm.runInContext(`
        ({
            evalInContext: (code) => eval(code),
            captureCertificateCardSandbox: typeof captureCertificateCardSandbox !== 'undefined' ? captureCertificateCardSandbox : undefined,
            downloadCertificatePdf: typeof downloadCertificatePdf !== 'undefined' ? downloadCertificatePdf : undefined,
            downloadCertificatePng: typeof downloadCertificatePng !== 'undefined' ? downloadCertificatePng : undefined,
            renderExportCard: typeof renderExportCard !== 'undefined' ? renderExportCard : undefined,
            AppState: typeof AppState !== 'undefined' ? AppState : undefined,
            calculateSemesterResults: typeof calculateSemesterResults !== 'undefined' ? calculateSemesterResults : undefined,
            calculateSubjectScore: typeof calculateSubjectScore !== 'undefined' ? calculateSubjectScore : undefined,
            createSubjectState: typeof createSubjectState !== 'undefined' ? createSubjectState : undefined,
            CURRICULUM_SEMESTERS: typeof CURRICULUM_SEMESTERS !== 'undefined' ? CURRICULUM_SEMESTERS : undefined,
            COMBO_TRACKS: typeof COMBO_TRACKS !== 'undefined' ? COMBO_TRACKS : undefined
        })
    `, ctx);
    Object.assign(ctx, exposed);

    return {
        ctx,
        doc: docMock,
        win: winMock,
        certCard,
        exportModal,
        btnPng,
        btnPdf,
        btnCopy,
        html2canvasInvocations
    };
}

describe('Tier 5 Deep Adversarial Stress: Challenger 2', () => {

    // =========================================================================
    // 1. STANDARD A4 PROPORTIONS & DIMENSIONS
    // =========================================================================
    describe('1. Standard A4 Proportions & Dimensions (1:1.414 aspect ratio, 794px x 1123px)', () => {
        const cssContent = fs.readFileSync(CSS_PATH, 'utf8');
        const appContent = fs.readFileSync(APP_PATH, 'utf8');

        it('1.1: styles.css enforces #certificate-card with 794px width, 1123px min-height, aspect-ratio 210/297', () => {
            assert.ok(cssContent.includes('width: 794px'), 'Missing width: 794px in styles.css');
            assert.ok(cssContent.includes('min-height: 1123px'), 'Missing min-height: 1123px in styles.css');
            assert.ok(cssContent.includes('aspect-ratio: 210 / 297'), 'Missing aspect-ratio: 210 / 297 in styles.css');

            // Mathematical verification: 1123 / 794 vs sqrt(2)
            const ratio = 1123 / 794;
            const sqrt2 = Math.SQRT2;
            const diff = Math.abs(ratio - sqrt2);
            assert.ok(diff < 0.001, `Aspect ratio discrepancy too large: ${diff}`);
        });

        it('1.2: captureCertificateCardSandbox in app.js configures sandbox with 800px width and 1131px A4 height', () => {
            assert.ok(appContent.includes('sandbox.style.width = "800px"'), 'Sandbox must enforce 800px width');
            assert.ok(appContent.includes('sandbox.style.minHeight = "1131px"'), 'Sandbox must enforce 1131px min-height');
            assert.ok(appContent.includes('sandbox.style.height = "1131px"'), 'Sandbox must enforce 1131px height');

            // Mathematical verification: 800 * sqrt(2) = 1131.37 -> 1131px
            const calcHeight = Math.round(800 * Math.SQRT2);
            assert.strictEqual(calcHeight, 1131, '800 * sqrt(2) must round to 1131px');
        });

        it('1.3: renderExportCard inner container explicitly sets min-height: 1123px', () => {
            assert.ok(
                appContent.includes('style="min-height: 1123px;"') || appContent.includes('min-height: 1123px'),
                'renderExportCard must contain min-height: 1123px container'
            );
        });

        it('1.4: downloadCertificatePdf creates jsPDF document with format a4, unit mm, dimensions 210x297', async () => {
            let pdfParams = null;
            let addedImages = [];
            let savedFile = null;

            class MockJsPDF {
                constructor(opts) {
                    pdfParams = opts;
                }
                addImage(img, type, x, y, w, h) {
                    addedImages.push({ img, type, x, y, w, h });
                }
                save(filename) {
                    savedFile = filename;
                }
            }

            const env = setupVMEnvironment({ jspdf: MockJsPDF });
            const { ctx, certCard } = env;

            certCard.innerHTML = '<div>Card for PDF export</div>';
            await ctx.downloadCertificatePdf();

            assert.ok(pdfParams, 'jsPDF constructor must be called');
            assert.strictEqual(pdfParams.orientation, 'portrait');
            assert.strictEqual(pdfParams.unit, 'mm');
            assert.strictEqual(pdfParams.format, 'a4');

            assert.strictEqual(addedImages.length, 1);
            assert.strictEqual(addedImages[0].w, 210, 'PDF width must be 210mm');
            assert.strictEqual(addedImages[0].h, 297, 'PDF height must be 297mm');
            assert.strictEqual(addedImages[0].type, 'PNG');
            assert.ok(savedFile.startsWith('BangDiem_FPTU_Ky'), `PDF filename unexpected: ${savedFile}`);
        });

        it('1.5: @media print stylesheet formats page as A4 portrait with 10mm margin', () => {
            assert.ok(cssContent.includes('@media print'), 'Missing @media print in styles.css');
            assert.ok(cssContent.includes('size: A4 portrait'), 'Missing size: A4 portrait in @page');
            assert.ok(cssContent.includes('margin: 10mm'), 'Missing margin: 10mm in @page');
        });

        it('1.6: Vertical cell alignment is enforced via middle vertical-align and cell-wrapper flex centering', () => {
            assert.ok(cssContent.includes('vertical-align: middle !important'), 'Missing vertical-align: middle !important');
            assert.ok(cssContent.includes('.cell-wrapper'), 'Missing .cell-wrapper rule in styles.css');
            assert.ok(cssContent.includes('.cell-wrapper-center'), 'Missing .cell-wrapper-center rule in styles.css');
            assert.ok(appContent.includes('class="cell-wrapper"'), 'app.js must use cell-wrapper in table rows');
            assert.ok(appContent.includes('class="cell-wrapper-center"'), 'app.js must use cell-wrapper-center in table rows');
        });
    });

    // =========================================================================
    // 2. EXPORT SANDBOX LIFECYCLE & DOM CLEANUP
    // =========================================================================
    describe('2. Export Sandbox Lifecycle & DOM Cleanup Under Adversarial Pressure', () => {

        it('2.1: Normal execution creates sandbox, renders at 2x scale, and removes sandbox from body', async () => {
            const env = setupVMEnvironment();
            const { ctx, certCard, doc, html2canvasInvocations } = env;

            const canvas = await ctx.captureCertificateCardSandbox(certCard);
            assert.ok(canvas, 'captureCertificateCardSandbox must return canvas');
            assert.strictEqual(html2canvasInvocations.length, 1);
            assert.strictEqual(html2canvasInvocations[0].opts.scale, 2);
            assert.strictEqual(html2canvasInvocations[0].opts.width, 800);
            assert.strictEqual(html2canvasInvocations[0].opts.windowWidth, 800);

            // Verify no residual sandbox in DOM
            const residual = findNodeById(doc.body, 'certificate-export-sandbox');
            assert.strictEqual(residual, null, 'Residual sandbox element must be removed from document.body');
        });

        it('2.2: html2canvas synchronous exception still cleans up sandbox via finally block', async () => {
            const env = setupVMEnvironment({ html2canvasThrowsSync: true });
            const { ctx, certCard, doc } = env;

            await assert.rejects(
                async () => { await ctx.captureCertificateCardSandbox(certCard); },
                /html2canvas Sync Crash/
            );

            const residual = findNodeById(doc.body, 'certificate-export-sandbox');
            assert.strictEqual(residual, null, 'Sandbox must be cleaned up even if html2canvas throws synchronously');
        });

        it('2.3: html2canvas asynchronous rejection still cleans up sandbox via finally block', async () => {
            const env = setupVMEnvironment({ html2canvasRejects: true });
            const { ctx, certCard, doc } = env;

            await assert.rejects(
                async () => { await ctx.captureCertificateCardSandbox(certCard); },
                /html2canvas Async Rejection/
            );

            const residual = findNodeById(doc.body, 'certificate-export-sandbox');
            assert.strictEqual(residual, null, 'Sandbox must be cleaned up even if html2canvas rejects asynchronously');
        });

        it('2.4: 100 consecutive captures leave zero residual elements and zero DOM memory leaks', async () => {
            const env = setupVMEnvironment();
            const { ctx, certCard, doc } = env;

            for (let i = 0; i < 100; i++) {
                await ctx.captureCertificateCardSandbox(certCard);
            }

            const leftover = doc.body.children.filter(c => c.id === 'certificate-export-sandbox');
            assert.strictEqual(leftover.length, 0, '100 serial captures must leave 0 residual sandbox divs in body');
        });

        it('2.5: Concurrent 30 parallel captures clean up without race conditions', async () => {
            const env = setupVMEnvironment();
            const { ctx, certCard, doc } = env;

            const promises = [];
            for (let i = 0; i < 30; i++) {
                promises.push(ctx.captureCertificateCardSandbox(certCard));
            }
            await Promise.all(promises);

            const leftover = doc.body.children.filter(c => c.id === 'certificate-export-sandbox');
            assert.strictEqual(leftover.length, 0, '30 concurrent captures must leave 0 residual sandbox divs in body');
        });

        it('2.6: Defensive null and undefined input guards', async () => {
            const env = setupVMEnvironment();
            const { ctx, doc } = env;

            const res1 = await ctx.captureCertificateCardSandbox(null);
            assert.strictEqual(res1, null);

            const res2 = await ctx.captureCertificateCardSandbox(undefined);
            assert.strictEqual(res2, null);

            assert.strictEqual(doc.body.children.filter(c => c.id === 'certificate-export-sandbox').length, 0);
        });

        it('2.7: Missing html2canvas library throws error immediately without DOM pollution', async () => {
            const env = setupVMEnvironment({ html2canvasMissing: true });
            const { ctx, certCard, doc } = env;

            await assert.rejects(
                async () => { await ctx.captureCertificateCardSandbox(certCard); },
                /Thư viện html2canvas chưa được tải/
            );

            assert.strictEqual(doc.body.children.filter(c => c.id === 'certificate-export-sandbox').length, 0);
        });

        it('2.8: Sandbox deep clone isolation: modifying cloned card does not taint original live DOM', async () => {
            const env = setupVMEnvironment();
            const { ctx, certCard } = env;

            certCard.innerHTML = '<div id="test-inner">Original Untainted Content</div>';
            await ctx.captureCertificateCardSandbox(certCard);

            assert.strictEqual(certCard.innerHTML, '<div id="test-inner">Original Untainted Content</div>');
        });
    });

    // =========================================================================
    // 3. COMPONENT BREAKDOWN WITH % WEIGHTS ACROSS MULTIPLE SEMESTERS
    // =========================================================================
    describe('3. Component Breakdown with % Weights Across All 10 Semesters (0 - 9)', () => {

        it('3.1: Semester 0 (Prep): Scored courses show % breakdown; condition courses show Pass/Fail note', () => {
            const env = setupVMEnvironment();
            const { ctx, certCard } = env;

            const subjects = [
                {
                    code: 'TMI_ELE',
                    nameVi: 'Nhạc cụ truyền thống',
                    credits: 3,
                    isScored: true,
                    components: [
                        makeComp('Progress Test', 30, '8.5'),
                        makeComp('Assignment', 30, '9.0'),
                        makeComp('Final Exam', 40, '8.8', true)
                    ]
                },
                {
                    code: 'PHE_COM*1',
                    nameVi: 'Vovinam 1',
                    credits: 2,
                    isScored: false,
                    isPassFailOnly: true,
                    passStatus: 'pass'
                },
                {
                    code: 'PEN',
                    nameVi: 'Tiếng Anh chuẩn bị',
                    credits: 0,
                    isScored: false,
                    isPassFailOnly: true,
                    passStatus: 'pass'
                }
            ];

            ctx.renderExportCard(certCard, 0, { subjects });
            const html = certCard.innerHTML;

            // Check scored course component breakdown
            assert.ok(html.includes('Progress Test (30%): <strong class="text-slate-900">8.5</strong>'));
            assert.ok(html.includes('Assignment (30%): <strong class="text-slate-900">9.0</strong>'));
            assert.ok(html.includes('Final Exam (40%): <strong class="text-slate-900">8.8</strong>'));

            // Check condition course note
            assert.ok(html.includes('Môn điều kiện (Đánh giá hoàn thành Pass/Fail)'));
        });

        it('3.2: Semester 1 (Standard): All 5 scored courses show component breakdowns with % weights', () => {
            const env = setupVMEnvironment();
            const { ctx, certCard } = env;

            const subjects = [
                {
                    code: 'PRF192',
                    nameVi: 'Cơ sở lập trình (C)',
                    credits: 3,
                    isScored: true,
                    components: [
                        makeComp('Lab', 10, '10.0'),
                        makeComp('PT', 20, '9.0'),
                        makeComp('FE', 70, '8.5', true)
                    ]
                },
                {
                    code: 'MAE101',
                    nameVi: 'Toán cho ngành kỹ thuật',
                    credits: 3,
                    isScored: true,
                    components: [
                        makeComp('Progress Test', 30, '9.5'),
                        makeComp('Assignment', 30, '9.0'),
                        makeComp('FE', 40, '9.0', true)
                    ]
                }
            ];

            ctx.renderExportCard(certCard, 1, { subjects });
            const html = certCard.innerHTML;

            assert.ok(html.includes('Lab (10%): <strong class="text-slate-900">10.0</strong>'));
            assert.ok(html.includes('PT (20%): <strong class="text-slate-900">9.0</strong>'));
            assert.ok(html.includes('FE (70%): <strong class="text-slate-900">8.5</strong>'));
            assert.ok(html.includes('Progress Test (30%): <strong class="text-slate-900">9.5</strong>'));
        });

        it('3.3: Semester 6 (OJT): OJT Pass/Fail rendered with condition note; ENW493c has component breakdown; Cóc Vàng strictly suppressed', () => {
            const env = setupVMEnvironment();
            const { ctx, certCard } = env;

            const subjects = [
                {
                    code: 'OJT202',
                    nameVi: 'Thực tập tại doanh nghiệp (OJT)',
                    credits: 10,
                    isScored: false,
                    isPassFailOnly: true,
                    passStatus: 'pass'
                },
                {
                    code: 'ENW493c',
                    nameVi: 'Phương pháp nghiên cứu & Viết học thuật',
                    credits: 3,
                    isScored: true,
                    components: [
                        makeComp('Progress Test', 20, '10.0'),
                        makeComp('Research Paper', 40, '9.5'),
                        makeComp('Final Defense', 40, '9.8', true)
                    ]
                }
            ];

            ctx.renderExportCard(certCard, 6, { subjects });
            const html = certCard.innerHTML;

            // OJT202 check
            assert.ok(html.includes('OJT202'));
            assert.ok(html.includes('Môn điều kiện (Đánh giá hoàn thành Pass/Fail)'));
            assert.ok(html.includes('PASS'));

            // ENW493c component breakdown check
            assert.ok(html.includes('Progress Test (20%): <strong class="text-slate-900">10.0</strong>'));
            assert.ok(html.includes('Research Paper (40%): <strong class="text-slate-900">9.5</strong>'));
            assert.ok(html.includes('Final Defense (40%): <strong class="text-slate-900">9.8</strong>'));

            // Academic honor check: TBM is 9.70 from ENW493c, but Cóc Vàng and Top 100 must NEVER appear!
            assert.ok(html.includes('9.70'), 'TBM should be 9.70 from ENW493c');
            assert.ok(html.includes('Sinh viên Xuất Sắc'));
            assert.ok(!html.includes('CÓC VÀNG'), 'Semester 6 must NEVER show Cóc Vàng');
            assert.ok(!html.includes('Top 100'), 'Semester 6 must NEVER show Top 100');
        });

        it('3.4: Semester 8: Scored combo course & political courses show component breakdown; Cóc Vàng strictly suppressed', () => {
            const env = setupVMEnvironment();
            const { ctx, certCard } = env;

            const subjects = [
                {
                    code: 'PRM393',
                    nameVi: 'Lập trình di động',
                    credits: 3,
                    isScored: true,
                    components: [
                        makeComp('Lab', 20, '10.0'),
                        makeComp('PE', 40, '10.0'),
                        makeComp('FE', 40, '10.0', true)
                    ]
                },
                {
                    code: 'MLN122',
                    nameVi: 'Kinh tế chính trị Mác - Lênin',
                    credits: 2,
                    isScored: true,
                    components: [
                        makeComp('Progress Test', 50, '10.0'),
                        makeComp('FE', 50, '10.0', true)
                    ]
                }
            ];

            ctx.renderExportCard(certCard, 8, { subjects });
            const html = certCard.innerHTML;

            assert.ok(html.includes('Lab (20%): <strong class="text-slate-900">10.0</strong>'));
            assert.ok(html.includes('PE (40%): <strong class="text-slate-900">10.0</strong>'));
            assert.ok(html.includes('Progress Test (50%): <strong class="text-slate-900">10.0</strong>'));
            assert.ok(html.includes('10.00'), 'TBM is 10.00');

            // Capstone prep semester 8: perfect 10.00 caps at Xuất Sắc, NEVER Cóc Vàng or Top 100
            assert.ok(html.includes('Sinh viên Xuất Sắc'));
            assert.ok(!html.includes('CÓC VÀNG'), 'Semester 8 must NEVER show Cóc Vàng');
            assert.ok(!html.includes('Top 100'), 'Semester 8 must NEVER show Top 100');
        });

        it('3.5: Semester 9 (Capstone Graduation): Capstone 10 credits & Political courses show % breakdowns; Cóc Vàng suppressed', () => {
            const env = setupVMEnvironment();
            const { ctx, certCard } = env;

            const subjects = [
                {
                    code: 'SEP490',
                    nameVi: 'Đồ án tốt nghiệp KTPM (CapStone Project)',
                    credits: 10,
                    isScored: true,
                    isCapstone: true,
                    components: [
                        makeComp('Iterations Quá trình', 50, '9.5'),
                        makeComp('Bảo vệ Đồ án (Defense)', 50, '9.8', true)
                    ]
                },
                {
                    code: 'HCM202',
                    nameVi: 'Tư tưởng Hồ Chí Minh',
                    credits: 2,
                    isScored: true,
                    components: [
                        makeComp('Progress Test', 40, '9.0'),
                        makeComp('FE', 60, '9.2', true)
                    ]
                }
            ];

            ctx.renderExportCard(certCard, 9, { subjects });
            const html = certCard.innerHTML;

            assert.ok(html.includes('Iterations Quá trình (50%): <strong class="text-slate-900">9.5</strong>'));
            assert.ok(html.includes('Bảo vệ Đồ án (Defense) (50%): <strong class="text-slate-900">9.8</strong>'));
            assert.ok(html.includes('Progress Test (40%): <strong class="text-slate-900">9.0</strong>'));
            assert.ok(html.includes('FE (60%): <strong class="text-slate-900">9.2</strong>'));

            // Capstone semester 9 honors suppression
            assert.ok(!html.includes('CÓC VÀNG'), 'Semester 9 must NEVER show Cóc Vàng');
            assert.ok(!html.includes('Top 100'), 'Semester 9 must NEVER show Top 100');
        });

        it('3.6: Adversarial zero score formatting: component score = 0.0 renders as "0.0", not empty or "-"', () => {
            const env = setupVMEnvironment();
            const { ctx, certCard } = env;

            const subjects = [
                {
                    code: 'TEST01',
                    nameVi: 'Môn thử nghiệm điểm 0',
                    credits: 3,
                    isScored: true,
                    components: [
                        makeComp('PT', 50, '0.0'),
                        makeComp('FE', 50, '0.0', true)
                    ]
                }
            ];

            ctx.renderExportCard(certCard, 1, { subjects });
            const html = certCard.innerHTML;

            assert.ok(html.includes('PT (50%): <strong class="text-slate-900">0.0</strong>'));
            assert.ok(html.includes('FE (50%): <strong class="text-slate-900">0.0</strong>'));
        });

        it('3.7: Unentered component displays "-" gracefully', () => {
            const env = setupVMEnvironment();
            const { ctx, certCard } = env;

            const subjects = [
                {
                    code: 'TEST02',
                    nameVi: 'Môn chưa nhập điểm',
                    credits: 3,
                    isScored: true,
                    components: [
                        makeComp('PT', 50, null),
                        makeComp('FE', 50, null, true)
                    ]
                }
            ];

            ctx.renderExportCard(certCard, 1, { subjects });
            const html = certCard.innerHTML;

            assert.ok(html.includes('PT (50%): <strong class="text-slate-900">-</strong>'));
            assert.ok(html.includes('FE (50%): <strong class="text-slate-900">-</strong>'));
        });

        it('3.8: Empty subjects array renders card cleanly without runtime error', () => {
            const env = setupVMEnvironment();
            const { ctx, certCard } = env;

            assert.doesNotThrow(() => {
                ctx.renderExportCard(certCard, 2, { subjects: [] });
            });
            assert.ok(certCard.innerHTML.includes('PHIẾU BÁO ĐIỂM DỰ ĐOÁN HỌC KỲ'));
        });

        it('3.9: Condition course failure blocks honors and renders NOT PASS badge', () => {
            const env = setupVMEnvironment();
            const { ctx, certCard } = env;

            const subjects = [
                {
                    code: 'MAD101',
                    nameVi: 'Toán rời rạc',
                    credits: 3,
                    isScored: true,
                    components: [makeComp('FE', 100, '10.0', true)]
                },
                {
                    code: 'VOV134',
                    nameVi: 'Vovinam 3',
                    credits: 2,
                    isScored: false,
                    isPassFailOnly: true,
                    passStatus: 'fail'
                }
            ];

            ctx.renderExportCard(certCard, 2, { subjects });
            const html = certCard.innerHTML;

            assert.ok(html.includes('NOT PASS'));
            assert.ok(html.includes('Chưa đạt (Not Pass)'));
            assert.ok(!html.includes('Sinh viên Xuất Sắc'));
            assert.ok(!html.includes('CÓC VÀNG'));
        });
    });
});
