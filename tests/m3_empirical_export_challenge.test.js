/**
 * Milestone 3: Adversarial Verification Test Suite
 * Empirical Challenger 2: Export Sandbox Integrity & Browser Verification
 * 
 * Verifies:
 * 1. Off-screen fixed-width (800px) sandbox: DOM isolation, width enforcement,
 *    deep cloning, and DOM element cleanup on both success and error paths.
 * 2. PNG export and clipboard copy execution under mobile vs desktop viewports.
 * 3. Clipboard fallback handling (permission rejection, missing ClipboardItem, insecure context).
 * 4. Academic business rules integrity on the rendered Certificate Card.
 */

const { describe, it, beforeEach } = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const fs = require('node:fs');
const vm = require('node:vm');

const ROOT_DIR = path.resolve(__dirname, '..');
const DATA_PATH = path.join(ROOT_DIR, 'ScoreCalculator', 'data.js');
const APP_PATH = path.join(ROOT_DIR, 'ScoreCalculator', 'app.js');

/**
 * Creates a high-fidelity DOM tree node simulator
 */
function createRealisticDOMNode(tagName = 'DIV', initialId = '') {
    const node = {
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
        clickCount: 0,
        click() {
            this.clickCount++;
            if (typeof this.onclick === 'function') {
                this.onclick();
            }
        },
        classList: {
            _classes: new Set(),
            add(...cls) {
                cls.forEach(c => {
                    if (c) this._classes.add(c);
                });
            },
            remove(...cls) {
                cls.forEach(c => {
                    if (c) this._classes.delete(c);
                });
            },
            contains(c) {
                return this._classes.has(c);
            },
            toggle(c) {
                if (this._classes.has(c)) {
                    this._classes.delete(c);
                    return false;
                }
                this._classes.add(c);
                return true;
            }
        },
        appendChild(child) {
            if (!child) return child;
            if (child.parentNode) {
                child.parentNode.removeChild(child);
            }
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
            if (this.parentNode) {
                this.parentNode.removeChild(this);
            }
        },
        cloneNode(deep = true) {
            const clone = createRealisticDOMNode(this.tagName, this.id ? `${this.id}_clone` : '');
            clone.className = this.className;
            clone.innerHTML = this.innerHTML;
            clone.innerText = this.innerText;
            clone.textContent = this.textContent;
            clone.style = { ...this.style };
            this.classList._classes.forEach(c => clone.classList.add(c));
            if (deep && this.children.length > 0) {
                this.children.forEach(child => {
                    clone.appendChild(child.cloneNode(true));
                });
            }
            return clone;
        },
        querySelector(selector) {
            // Basic tag/id selector
            if (selector.startsWith('#')) {
                const searchId = selector.slice(1);
                return findById(this, searchId);
            }
            for (const child of this.children) {
                if (child.tagName.toLowerCase() === selector.toLowerCase()) return child;
                const found = child.querySelector(selector);
                if (found) return found;
            }
            return null;
        },
        querySelectorAll(selector) {
            const results = [];
            function traverse(current) {
                for (const child of current.children) {
                    if (selector.startsWith('#') && child.id === selector.slice(1)) {
                        results.push(child);
                    } else if (child.tagName.toLowerCase() === selector.toLowerCase()) {
                        results.push(child);
                    }
                    traverse(child);
                }
            }
            traverse(this);
            return results;
        }
    };
    return node;
}

function findById(root, id) {
    if (!root) return null;
    if (root.id === id) return root;
    for (const child of root.children) {
        const found = findById(child, id);
        if (found) return found;
    }
    return null;
}

/**
 * Creates an empirical test environment for app.js with mock DOM, Canvas, and Clipboard APIs
 */
function createAdversarialEnvironment(options = {}) {
    const documentBody = createRealisticDOMNode('BODY');
    const documentHead = createRealisticDOMNode('HEAD');
    const documentElement = createRealisticDOMNode('HTML');
    documentElement.appendChild(documentHead);
    documentElement.appendChild(documentBody);

    // Create certificate-card and required modal elements
    const certCard = createRealisticDOMNode('DIV', 'certificate-card');
    certCard.className = 'bg-white rounded-3xl shadow-xl';
    certCard.innerHTML = '<div class="p-4">Original Certificate Content</div>';
    documentBody.appendChild(certCard);

    const exportModal = createRealisticDOMNode('DIV', 'export-modal');
    exportModal.classList.add('hidden');
    documentBody.appendChild(exportModal);

    const downloadBtn = createRealisticDOMNode('BUTTON', 'btn-download-png');
    documentBody.appendChild(downloadBtn);

    const copyBtn = createRealisticDOMNode('BUTTON', 'btn-copy-clipboard');
    documentBody.appendChild(copyBtn);

    const toastContainer = createRealisticDOMNode('DIV', 'toast-container');
    documentBody.appendChild(toastContainer);

    const toastsShown = [];
    const clipboardWrittenItems = [];
    const clipboardWrittenTexts = [];
    const html2canvasCalls = [];

    const docMock = {
        body: documentBody,
        head: documentHead,
        documentElement: documentElement,
        createElement(tag) {
            return createRealisticDOMNode(tag);
        },
        getElementById(id) {
            return findById(documentBody, id) || findById(documentHead, id) || null;
        },
        querySelector(selector) {
            return documentBody.querySelector(selector);
        },
        querySelectorAll(selector) {
            return documentBody.querySelectorAll(selector);
        },
        addEventListener() {}
    };

    const winMock = {
        document: docMock,
        innerWidth: options.innerWidth !== undefined ? options.innerWidth : 1024,
        innerHeight: options.innerHeight !== undefined ? options.innerHeight : 768,
        location: { href: 'http://localhost:3000/score-calculator' },
        localStorage: {
            _data: {},
            getItem(k) { return this._data[k] || null; },
            setItem(k, v) { this._data[k] = String(v); },
            removeItem(k) { delete this._data[k]; },
            clear() { this._data = {}; }
        },
        requestAnimationFrame(fn) { return setTimeout(fn, 16); }
    };

    // Configurable html2canvas mock
    let html2canvasMock = async (element, opts) => {
        html2canvasCalls.push({ element, opts });
        if (options.html2canvasThrowsSync) {
            throw new Error('Synchronous html2canvas render exception!');
        }
        if (options.html2canvasRejects) {
            return Promise.reject(new Error('html2canvas promise rejection: WebGL or memory error!'));
        }
        return {
            toDataURL: (type) => {
                if (options.canvasToDataURLNull) return null;
                return `data:${type || 'image/png'};base64,iVBORw0KGgoAAAANSUhEUgAA...`;
            },
            toBlob: (callback, type) => {
                if (options.canvasToBlobFails) {
                    callback(null);
                    return;
                }
                const fakeBlob = { size: 12345, type: type || 'image/png' };
                callback(fakeBlob);
            }
        };
    };

    if (options.html2canvasMissing) {
        html2canvasMock = undefined;
    }

    // Configurable Clipboard API mock
    let clipboardMock = {
        write: async (items) => {
            if (options.clipboardWriteRejects) {
                const err = new Error('NotAllowedError: Document is not focused or clipboard permission denied');
                err.name = 'NotAllowedError';
                throw err;
            }
            clipboardWrittenItems.push(items);
        },
        writeText: async (text) => {
            clipboardWrittenTexts.push(text);
        }
    };

    if (options.clipboardMissing) {
        clipboardMock = undefined;
    }

    // Configurable ClipboardItem mock
    let clipboardItemMock = class ClipboardItem {
        constructor(data) {
            this.data = data;
        }
    };

    if (options.clipboardItemMissing) {
        clipboardItemMock = undefined;
    }

    const sandbox = {
        console: {
            ...console,
            error: () => {},
            warn: () => {}
        },
        document: docMock,
        window: winMock,
        navigator: {
            clipboard: clipboardMock
        },
        ClipboardItem: clipboardItemMock,
        html2canvas: html2canvasMock,
        confetti: () => {},
        showToast: (msg, isErr) => {
            toastsShown.push({ msg, isErr: !!isErr });
        },
        setTimeout,
        clearTimeout,
        setInterval,
        clearInterval,
        requestAnimationFrame: (fn) => setTimeout(fn, 16),
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

    sandbox.__recordToast = (msg, isErr) => {
        toastsShown.push({ msg, isErr: !!isErr });
    };

    const ctx = vm.createContext(sandbox);

    const dataCode = fs.readFileSync(DATA_PATH, 'utf8');
    vm.runInContext(dataCode, ctx, { filename: 'data.js' });

    const appCode = fs.readFileSync(APP_PATH, 'utf8');
    vm.runInContext(appCode, ctx, { filename: 'app.js' });

    // Wrap showToast inside VM so toastsShown records all messages
    vm.runInContext(`
        if (typeof showToast === 'function') {
            const _actualToast = showToast;
            showToast = function(msg, isError) {
                if (typeof __recordToast === 'function') {
                    __recordToast(msg, isError);
                }
                return _actualToast(msg, isError);
            };
        }
    `, ctx);

    const exposed = vm.runInContext(`
        ({
            evalInContext: (code) => eval(code),
            captureCertificateCardSandbox: typeof captureCertificateCardSandbox !== 'undefined' ? captureCertificateCardSandbox : undefined,
            downloadCertificatePng: typeof downloadCertificatePng !== 'undefined' ? downloadCertificatePng : undefined,
            copyCertificateToClipboard: typeof copyCertificateToClipboard !== 'undefined' ? copyCertificateToClipboard : undefined,
            renderExportCard: typeof renderExportCard !== 'undefined' ? renderExportCard : undefined,
            AppState: typeof AppState !== 'undefined' ? AppState : undefined,
            calculateSemesterResults: typeof calculateSemesterResults !== 'undefined' ? calculateSemesterResults : undefined,
            calculateSubjectScore: typeof calculateSubjectScore !== 'undefined' ? calculateSubjectScore : undefined
        })
    `, ctx);
    Object.assign(ctx, exposed);

    return {
        ctx,
        doc: docMock,
        win: winMock,
        certCard,
        downloadBtn,
        copyBtn,
        exportModal,
        html2canvasCalls,
        toastsShown,
        clipboardWrittenItems,
        clipboardWrittenTexts
    };
}

describe('Milestone 3 Empirical Challenge: Export Sandbox & Browser Verification', () => {

    // =========================================================================
    // SECTION 1: Off-Screen Fixed-Width (800px) Sandbox & DOM Cleanup
    // =========================================================================
    describe('1. Off-screen Fixed-Width (800px) Sandbox Integrity', () => {

        it('1.1: Sandbox is created off-screen with strict 800px width and isolated styles', async () => {
            let capturedSandbox = null;
            let capturedClonedCard = null;

            const env = createAdversarialEnvironment();
            const { ctx, certCard, doc } = env;

            // Intercept html2canvas to inspect DOM while sandbox is mounted
            ctx.html2canvas = async (clonedCard, opts) => {
                capturedClonedCard = clonedCard;
                capturedSandbox = clonedCard.parentNode;

                assert.ok(capturedSandbox, 'Cloned card must be child of sandbox');
                assert.strictEqual(capturedSandbox.id, 'certificate-export-sandbox');
                assert.strictEqual(capturedSandbox.style.position, 'fixed');
                assert.strictEqual(capturedSandbox.style.left, '-9999px');
                assert.strictEqual(capturedSandbox.style.top, '0');
                assert.strictEqual(capturedSandbox.style.width, '800px');
                assert.strictEqual(capturedSandbox.style.minWidth, '800px');
                assert.strictEqual(capturedSandbox.style.maxWidth, '800px');
                assert.strictEqual(capturedSandbox.style.boxSizing, 'border-box');
                assert.strictEqual(capturedSandbox.style.zIndex, '-9999');
                assert.strictEqual(capturedSandbox.style.backgroundColor, '#FFFFFF');
                assert.strictEqual(capturedSandbox.style.pointerEvents, 'none');

                assert.strictEqual(clonedCard.style.width, '800px');
                assert.strictEqual(clonedCard.style.minWidth, '800px');
                assert.strictEqual(clonedCard.style.maxWidth, '800px');
                assert.strictEqual(clonedCard.style.backgroundColor, '#FFFFFF');

                return {
                    toDataURL: () => 'data:image/png;base64,mock',
                    toBlob: (cb) => cb({ size: 100 })
                };
            };

            const captureFunc = ctx.evalInContext('captureCertificateCardSandbox');
            const resultCanvas = await captureFunc(certCard);

            assert.ok(resultCanvas, 'Should resolve valid canvas');
            assert.ok(capturedSandbox, 'Sandbox was inspected during capture');
        });

        it('1.2: Deep cloning isolation: mutating cloned card does not taint live DOM', async () => {
            const env = createAdversarialEnvironment();
            const { ctx, certCard } = env;

            certCard.innerHTML = '<div id="live-content">LIVE DATA BEFORE EXPORT</div>';
            certCard.style.width = '375px'; // Simulating mobile layout

            ctx.html2canvas = async (clonedCard) => {
                // Adversarial mutation inside html2canvas
                clonedCard.innerHTML = '<div id="live-content">TAMPERED CLONE DATA</div>';
                clonedCard.style.width = '800px';
                return {
                    toDataURL: () => 'data:image/png;base64,ok',
                    toBlob: (cb) => cb({})
                };
            };

            const captureFunc = ctx.evalInContext('captureCertificateCardSandbox');
            await captureFunc(certCard);

            // Verify live DOM element remains untouched
            assert.strictEqual(certCard.innerHTML, '<div id="live-content">LIVE DATA BEFORE EXPORT</div>');
            assert.strictEqual(certCard.style.width, '375px', 'Original card style must not be modified');
        });

        it('1.3: html2canvas receives 2x retina scale, 800px fixed width and CORS settings', async () => {
            const env = createAdversarialEnvironment();
            const { ctx, certCard, html2canvasCalls } = env;

            const captureFunc = ctx.evalInContext('captureCertificateCardSandbox');
            await captureFunc(certCard);

            assert.strictEqual(html2canvasCalls.length, 1);
            const call = html2canvasCalls[0];
            assert.strictEqual(call.opts.width, 800);
            assert.strictEqual(call.opts.windowWidth, 800);
            assert.strictEqual(call.opts.scale, 2, 'Must use 2x retina scale for high-DPI export');
            assert.strictEqual(call.opts.useCORS, true);
            assert.strictEqual(call.opts.backgroundColor, '#FFFFFF');
        });

        it('1.4: DOM element cleanup on SUCCESS path: sandbox is completely removed', async () => {
            const env = createAdversarialEnvironment();
            const { ctx, certCard, doc } = env;

            const initialChildCount = doc.body.children.length;

            const captureFunc = ctx.evalInContext('captureCertificateCardSandbox');
            await captureFunc(certCard);

            const lingeringSandbox = doc.getElementById('certificate-export-sandbox');
            assert.strictEqual(lingeringSandbox, null, 'Sandbox element must not exist in DOM after capture');
            assert.strictEqual(doc.body.children.length, initialChildCount, 'Body children count must be restored');
        });

        it('1.5: DOM element cleanup on ERROR path (html2canvas promise rejection)', async () => {
            const env = createAdversarialEnvironment({ html2canvasRejects: true });
            const { ctx, certCard, doc } = env;

            const initialChildCount = doc.body.children.length;
            const captureFunc = ctx.evalInContext('captureCertificateCardSandbox');

            await assert.rejects(
                async () => {
                    await captureFunc(certCard);
                },
                /html2canvas promise rejection/
            );

            // Verify finally cleanup ran
            const lingeringSandbox = doc.getElementById('certificate-export-sandbox');
            assert.strictEqual(lingeringSandbox, null, 'Sandbox must be removed even when html2canvas rejects');
            assert.strictEqual(doc.body.children.length, initialChildCount);
        });

        it('1.6: DOM element cleanup on ERROR path (html2canvas synchronous exception)', async () => {
            const env = createAdversarialEnvironment({ html2canvasThrowsSync: true });
            const { ctx, certCard, doc } = env;

            const initialChildCount = doc.body.children.length;
            const captureFunc = ctx.evalInContext('captureCertificateCardSandbox');

            await assert.rejects(
                async () => {
                    await captureFunc(certCard);
                },
                /Synchronous html2canvas render exception/
            );

            const lingeringSandbox = doc.getElementById('certificate-export-sandbox');
            assert.strictEqual(lingeringSandbox, null, 'Sandbox must be removed even when html2canvas throws synchronously');
            assert.strictEqual(doc.body.children.length, initialChildCount);
        });

        it('1.7: Missing html2canvas guard: throws immediately without DOM pollution', async () => {
            const env = createAdversarialEnvironment({ html2canvasMissing: true });
            const { ctx, certCard, doc } = env;

            const initialChildCount = doc.body.children.length;
            const captureFunc = ctx.evalInContext('captureCertificateCardSandbox');

            await assert.rejects(
                async () => {
                    await captureFunc(certCard);
                },
                /Thư viện html2canvas chưa được tải/
            );

            assert.strictEqual(doc.getElementById('certificate-export-sandbox'), null);
            assert.strictEqual(doc.body.children.length, initialChildCount);
        });

        it('1.8: Null or undefined sourceCard guard: returns null safely', async () => {
            const env = createAdversarialEnvironment();
            const { ctx, doc } = env;

            const captureFunc = ctx.evalInContext('captureCertificateCardSandbox');
            const res1 = await captureFunc(null);
            const res2 = await captureFunc(undefined);

            assert.strictEqual(res1, null);
            assert.strictEqual(res2, null);
            assert.strictEqual(doc.getElementById('certificate-export-sandbox'), null);
        });

        it('1.9: Fallback cloning when cloneNode is not supported', async () => {
            const env = createAdversarialEnvironment();
            const { ctx, doc } = env;

            // Element without cloneNode method
            const weirdCard = {
                tagName: 'DIV',
                className: 'custom-card-class',
                innerHTML: '<span>Inner Fallback Content</span>',
                cloneNode: undefined // Not a function
            };

            const captureFunc = ctx.evalInContext('captureCertificateCardSandbox');
            const resultCanvas = await captureFunc(weirdCard);

            assert.ok(resultCanvas);
            assert.strictEqual(doc.getElementById('certificate-export-sandbox'), null);
        });

        it('1.10: High-load stress & memory leak test (100 rapid executions)', async () => {
            const env = createAdversarialEnvironment();
            const { ctx, certCard, doc } = env;

            const captureFunc = ctx.evalInContext('captureCertificateCardSandbox');
            const initialChildCount = doc.body.children.length;

            for (let i = 0; i < 100; i++) {
                if (i % 3 === 0) {
                    // Simulate intermittent rejection
                    ctx.html2canvas = async () => Promise.reject(new Error(`Test error ${i}`));
                    await assert.rejects(() => captureFunc(certCard));
                } else {
                    // Simulate success
                    ctx.html2canvas = async () => ({
                        toDataURL: () => 'data:image/png;base64,ok',
                        toBlob: (cb) => cb({})
                    });
                    const res = await captureFunc(certCard);
                    assert.ok(res);
                }
            }

            assert.strictEqual(
                doc.getElementById('certificate-export-sandbox'),
                null,
                'Zero lingering sandboxes after 100 rapid stress cycles'
            );
            assert.strictEqual(doc.body.children.length, initialChildCount, 'Body children count strictly conserved');
        });
    });

    // =========================================================================
    // SECTION 2: PNG Export & Download Lifecycle (Desktop vs Mobile)
    // =========================================================================
    describe('2. PNG Export & Viewport Independence', () => {

        it('2.1: Desktop viewport (1440px): button state transitions and download anchor trigger', async () => {
            const env = createAdversarialEnvironment({ innerWidth: 1440, innerHeight: 900 });
            const { ctx, downloadBtn, toastsShown, doc } = env;

            ctx.AppState.currentSemester = 2;

            let anchorClicked = false;
            let anchorDownloadedName = '';

            // Spy on doc.createElement to intercept link creation
            const origCreate = doc.createElement;
            doc.createElement = (tag) => {
                const elem = origCreate(tag);
                if (tag.toLowerCase() === 'a') {
                    const origClick = elem.click.bind(elem);
                    elem.click = () => {
                        anchorClicked = true;
                        anchorDownloadedName = elem.download;
                        origClick();
                    };
                }
                return elem;
            };

            const downloadFunc = ctx.evalInContext('downloadCertificatePng');
            await downloadFunc();

            assert.strictEqual(anchorClicked, true, 'Download link must be clicked');
            assert.strictEqual(anchorDownloadedName, 'BangDiem_FPTU_Ky2_K20.png');
            assert.strictEqual(downloadBtn.disabled, false, 'Button must be re-enabled after completion');
            assert.ok(toastsShown.some(t => t.msg.includes('Đã tải ảnh bảng điểm thành công')));
        });

        it('2.2: Mobile viewport (375px iPhone SE): sandbox enforces 800px capture without clipping', async () => {
            const env = createAdversarialEnvironment({ innerWidth: 375, innerHeight: 667 });
            const { ctx, html2canvasCalls } = env;

            ctx.AppState.currentSemester = 1;

            const downloadFunc = ctx.evalInContext('downloadCertificatePng');
            await downloadFunc();

            assert.strictEqual(html2canvasCalls.length, 1);
            const call = html2canvasCalls[0];
            assert.strictEqual(call.opts.width, 800, 'Capture width must remain 800px on 375px mobile');
            assert.strictEqual(call.opts.windowWidth, 800, 'windowWidth must remain 800px on mobile');
        });

        it('2.3: Mobile viewports across various devices (390px, 414px, 430px) execute cleanly', async () => {
            const mobileWidths = [390, 414, 430];

            for (const width of mobileWidths) {
                const env = createAdversarialEnvironment({ innerWidth: width, innerHeight: 844 });
                const { ctx, html2canvasCalls } = env;

                const downloadFunc = ctx.evalInContext('downloadCertificatePng');
                await downloadFunc();

                assert.strictEqual(html2canvasCalls.length, 1);
                assert.strictEqual(html2canvasCalls[0].opts.width, 800);
            }
        });

        it('2.4: Correct semester-aware filename for all semesters (0, 1, 5, 6, 8, 9)', async () => {
            const testSemesters = [0, 1, 5, 6, 8, 9];

            for (const sem of testSemesters) {
                const env = createAdversarialEnvironment();
                const { ctx, doc } = env;

                ctx.AppState.currentSemester = sem;
                let downloadedFilename = '';

                const origCreate = doc.createElement;
                doc.createElement = (tag) => {
                    const el = origCreate(tag);
                    if (tag.toLowerCase() === 'a') {
                        const origClick = el.click.bind(el);
                        el.click = () => {
                            downloadedFilename = el.download;
                            origClick();
                        };
                    }
                    return el;
                };

                const downloadFunc = ctx.evalInContext('downloadCertificatePng');
                await downloadFunc();

                assert.strictEqual(downloadedFilename, `BangDiem_FPTU_Ky${sem}_K20.png`);
            }
        });

        it('2.5: Error handling when canvas.toDataURL fails or returns null', async () => {
            const env = createAdversarialEnvironment({ canvasToDataURLNull: true });
            const { ctx, downloadBtn, toastsShown } = env;

            const downloadFunc = ctx.evalInContext('downloadCertificatePng');
            await downloadFunc();

            assert.strictEqual(downloadBtn.disabled, false, 'Button must be re-enabled on toDataURL failure');
            assert.ok(toastsShown.some(t => t.isErr && t.msg.includes('Không thể xuất ảnh')));
        });

        it('2.6: Recovery when captureCertificateCardSandbox throws in download flow', async () => {
            const env = createAdversarialEnvironment({ html2canvasRejects: true });
            const { ctx, downloadBtn, toastsShown } = env;

            const downloadFunc = ctx.evalInContext('downloadCertificatePng');
            await downloadFunc();

            assert.strictEqual(downloadBtn.disabled, false, 'Button must be re-enabled in finally block');
            assert.ok(toastsShown.some(t => t.isErr && t.msg.includes('Không thể xuất ảnh')));
        });
    });

    // =========================================================================
    // SECTION 3: Clipboard Copy & Resilient Fallback Handling
    // =========================================================================
    describe('3. Clipboard Copy & Graceful Fallbacks', () => {

        it('3.1: Happy path: ClipboardItem and navigator.clipboard.write succeed', async () => {
            const env = createAdversarialEnvironment();
            const { ctx, copyBtn, toastsShown, clipboardWrittenItems } = env;

            const copyFunc = ctx.evalInContext('copyCertificateToClipboard');
            await copyFunc();

            // Allow async blob callback to complete
            await new Promise(r => setTimeout(r, 20));

            assert.strictEqual(clipboardWrittenItems.length, 1);
            assert.strictEqual(copyBtn.disabled, false);
            assert.ok(toastsShown.some(t => !t.isErr && t.msg.includes('Đã sao chép ảnh vào Clipboard')));
        });

        it('3.2: Fallback 1: navigator.clipboard.write rejects (permission denied / NotAllowedError)', async () => {
            const env = createAdversarialEnvironment({ clipboardWriteRejects: true });
            const { ctx, copyBtn, toastsShown } = env;

            const copyFunc = ctx.evalInContext('copyCertificateToClipboard');
            await copyFunc();

            await new Promise(r => setTimeout(r, 20));

            assert.strictEqual(copyBtn.disabled, false);
            assert.ok(toastsShown.some(t => t.isErr && t.msg.includes('Trình duyệt chặn sao chép ảnh trực tiếp')));
        });

        it('3.3: Fallback 2: ClipboardItem is undefined, falls back to URL text copy', async () => {
            const env = createAdversarialEnvironment({ clipboardItemMissing: true });
            const { ctx, copyBtn, toastsShown, clipboardWrittenTexts } = env;

            const copyFunc = ctx.evalInContext('copyCertificateToClipboard');
            await copyFunc();

            await new Promise(r => setTimeout(r, 20));

            assert.strictEqual(clipboardWrittenTexts.length, 1);
            assert.strictEqual(clipboardWrittenTexts[0], 'http://localhost:3000/score-calculator');
            assert.strictEqual(copyBtn.disabled, false);
            assert.ok(toastsShown.some(t => t.isErr && t.msg.includes('Trình duyệt không hỗ trợ dán ảnh trực tiếp')));
        });

        it('3.4: Fallback 3: Insecure context where navigator.clipboard is undefined', async () => {
            const env = createAdversarialEnvironment({ clipboardMissing: true });
            const { ctx, copyBtn, toastsShown } = env;

            const copyFunc = ctx.evalInContext('copyCertificateToClipboard');
            await copyFunc();

            await new Promise(r => setTimeout(r, 20));

            assert.strictEqual(copyBtn.disabled, false);
            assert.ok(toastsShown.some(t => t.isErr && t.msg.includes('Trình duyệt chặn sao chép ảnh trực tiếp')));
        });

        it('3.5: Fallback 4: canvas.toBlob returns null blob', async () => {
            const env = createAdversarialEnvironment({ canvasToBlobFails: true });
            const { ctx, copyBtn, toastsShown } = env;

            const copyFunc = ctx.evalInContext('copyCertificateToClipboard');
            await copyFunc();

            await new Promise(r => setTimeout(r, 20));

            assert.strictEqual(copyBtn.disabled, false);
            assert.ok(toastsShown.some(t => t.isErr && t.msg.includes('Không thể tạo dữ liệu ảnh')));
        });
    });

    // =========================================================================
    // SECTION 4: Certificate Card Content & Semester Business Rules Integrity
    // =========================================================================
    describe('4. Rendered Certificate Academic Rules Integrity', () => {

        it('4.1: Semester 6 (OJT) Certificate card: OJT Pass/Fail rendered, TBM excludes OJT, Cóc Vàng strictly hidden', () => {
            const env = createAdversarialEnvironment();
            const { ctx, certCard } = env;

            const ojt = {
                code: 'OJT202',
                nameVi: 'Thực tập tại doanh nghiệp (OJT)',
                credits: 10,
                isScored: false,
                isPassFailOnly: true,
                passStatus: 'pass',
                components: []
            };
            const enw = {
                code: 'ENW493c',
                nameVi: 'Tiếng Anh chuyên ngành',
                credits: 3,
                isScored: true,
                components: [{
                    id: 'c1',
                    name: 'FE',
                    weight: 100,
                    minScore: 4.0,
                    isFE: true,
                    parts: 1,
                    avgValue: '9.8',
                    subValues: ['9.8']
                }]
            };

            const renderCard = ctx.evalInContext('renderExportCard');
            renderCard(certCard, 6, { subjects: [ojt, enw] });

            const html = certCard.innerHTML;
            assert.ok(html.includes('OJT202'));
            assert.ok(html.includes('PASS'));
            assert.ok(html.includes('ENW493c'));
            assert.ok(html.includes('9.80'), 'TBM should be 9.80 from ENW493c');
            assert.ok(html.includes('Sinh viên Xuất Sắc'));

            // ADVERSARIAL ASSERTION: Cóc Vàng and Top 100 must NEVER appear in Semester 6 export card!
            assert.ok(!html.includes('CÓC VÀNG'), 'Semester 6 Certificate must NEVER display Cóc Vàng!');
            assert.ok(!html.includes('Top 100'), 'Semester 6 Certificate must NEVER display Top 100!');
        });

        it('4.2: Standalone Semester 6 OJT Certificate: TBM displays "N/A" and Honor is "Đạt (Pass)"', () => {
            const env = createAdversarialEnvironment();
            const { ctx, certCard } = env;

            const ojtOnly = [{
                code: 'OJT202',
                nameVi: 'Thực tập tại doanh nghiệp (OJT)',
                credits: 10,
                isScored: false,
                isPassFailOnly: true,
                passStatus: 'pass',
                components: []
            }];

            const renderCard = ctx.evalInContext('renderExportCard');
            renderCard(certCard, 6, { subjects: ojtOnly });

            const html = certCard.innerHTML;
            assert.ok(html.includes('OJT202'));
            assert.ok(html.includes('N/A'), 'TBM must display N/A for OJT-only semester');
            assert.ok(html.includes('Đạt (Pass)'), 'Honor title must display Đạt (Pass)');
            assert.ok(!html.includes('CÓC VÀNG'));
            assert.ok(!html.includes('Top 100'));
        });

        it('4.3: Semesters 8 & 9 Capstone Certificate: Perfect scores strictly capped at Xuất Sắc without Cóc Vàng/Top 100', () => {
            const env = createAdversarialEnvironment();
            const { ctx, certCard } = env;

            const sem9Courses = [
                {
                    code: 'SEP490',
                    nameVi: 'Đồ án tốt nghiệp SE',
                    credits: 10,
                    isScored: true,
                    components: [{ id: 'c1', name: 'FE', weight: 100, minScore: 4.0, isFE: true, parts: 1, avgValue: '10.0', subValues: ['10.0'] }]
                },
                {
                    code: 'HCM202',
                    nameVi: 'Tư tưởng Hồ Chí Minh',
                    credits: 2,
                    isScored: true,
                    components: [{ id: 'c2', name: 'FE', weight: 100, minScore: 4.0, isFE: true, parts: 1, avgValue: '9.8', subValues: ['9.8'] }]
                }
            ];

            const renderCard = ctx.evalInContext('renderExportCard');
            renderCard(certCard, 9, { subjects: sem9Courses });

            const html = certCard.innerHTML;
            assert.ok(html.includes('SEP490'));
            assert.ok(html.includes('9.90'), 'TBM arithmetic mean (10.0 + 9.8)/2 = 9.90');
            assert.ok(html.includes('Sinh viên Xuất Sắc'));

            // ADVERSARIAL ASSERTION: Capstone semester must NOT show Cóc Vàng or Top 100 predictions!
            assert.ok(!html.includes('CÓC VÀNG'), 'Semester 9 must NEVER show Cóc Vàng!');
            assert.ok(!html.includes('Top 100'), 'Semester 9 must NEVER show Top 100!');
        });

        it('4.4: Condition course failure guard on export card: Blocks all honors and flags Not Pass', () => {
            const env = createAdversarialEnvironment();
            const { ctx, certCard } = env;

            const sem1WithFailedVov = [
                {
                    code: 'PRF192',
                    nameVi: 'Lập trình C cơ bản',
                    credits: 3,
                    isScored: true,
                    components: [{ id: 'c1', name: 'FE', weight: 100, minScore: 4.0, isFE: true, parts: 1, avgValue: '10.0', subValues: ['10.0'] }]
                },
                {
                    code: 'VOV114',
                    nameVi: 'Vovinam 1',
                    credits: 2,
                    isScored: false,
                    isPassFailOnly: true,
                    passStatus: 'fail',
                    components: []
                }
            ];

            const renderCard = ctx.evalInContext('renderExportCard');
            renderCard(certCard, 1, { subjects: sem1WithFailedVov });

            const html = certCard.innerHTML;
            assert.ok(html.includes('VOV114'));
            assert.ok(html.includes('Chưa đạt (Not Pass)'), 'Failed condition course must display Chưa đạt (Not Pass)');
            assert.ok(!html.includes('CÓC VÀNG'));
            assert.ok(!html.includes('Sinh viên Xuất Sắc'));
        });
    });

    // =========================================================================
    // SECTION 5: Adversarial Stress & Edge Cases
    // =========================================================================
    describe('5. Adversarial Stress & Concurrency Edge Cases', () => {

        it('5.1: Concurrent sandbox invocations: multiple parallel captures clean up without race condition', async () => {
            const env = createAdversarialEnvironment();
            const { ctx, certCard, doc } = env;

            const initialChildCount = doc.body.children.length;
            const captureFunc = ctx.evalInContext('captureCertificateCardSandbox');

            // Trigger 3 concurrent captures
            const [c1, c2, c3] = await Promise.all([
                captureFunc(certCard),
                captureFunc(certCard),
                captureFunc(certCard)
            ]);

            assert.ok(c1 && c2 && c3);
            assert.strictEqual(
                doc.getElementById('certificate-export-sandbox'),
                null,
                'All parallel sandboxes must be removed from DOM'
            );
            assert.strictEqual(doc.body.children.length, initialChildCount);
        });

        it('5.2: renderExportCard handles empty subject array gracefully', () => {
            const env = createAdversarialEnvironment();
            const { ctx, certCard } = env;

            const renderCard = ctx.evalInContext('renderExportCard');
            assert.doesNotThrow(() => {
                renderCard(certCard, 1, { subjects: [] });
            });

            assert.ok(certCard.innerHTML.includes('Phiếu Dự Đoán Điểm'));
            assert.ok(certCard.innerHTML.includes('Chưa đủ dữ liệu') || certCard.innerHTML.includes('-'));
        });

        it('5.3: Fallback when navigator.clipboard.writeText rejects', async () => {
            const env = createAdversarialEnvironment({
                clipboardItemMissing: true,
                clipboardWriteRejects: false
            });
            const { ctx, copyBtn, toastsShown } = env;

            // Make writeText reject
            ctx.navigator.clipboard.writeText = async () => {
                throw new Error('writeText permission denied');
            };

            const copyFunc = ctx.evalInContext('copyCertificateToClipboard');
            await copyFunc();

            await new Promise(r => setTimeout(r, 20));

            assert.strictEqual(copyBtn.disabled, false);
            assert.ok(toastsShown.some(t => t.isErr && t.msg.includes('Trình duyệt chặn sao chép ảnh trực tiếp')));
        });

        it('5.4: Modal lifecycle: openExportModal and closeExportModal properly manage DOM classes', () => {
            const env = createAdversarialEnvironment();
            const { ctx, exportModal, certCard } = env;

            const openModal = ctx.evalInContext('openExportModal');
            const closeModal = ctx.evalInContext('closeExportModal');

            assert.strictEqual(exportModal.classList.contains('hidden'), true);

            openModal();
            assert.strictEqual(exportModal.classList.contains('hidden'), false);
            assert.strictEqual(exportModal.classList.contains('flex'), true);
            assert.ok(certCard.innerHTML.length > 0, 'Card rendered upon modal open');

            closeModal();
            assert.strictEqual(exportModal.classList.contains('hidden'), true);
            assert.strictEqual(exportModal.classList.contains('flex'), false);
        });
    });
});
