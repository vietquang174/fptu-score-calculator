/**
 * Test Helper for FPTU BIT_SE_K20B Score Calculator Test Suite
 * Provides execution sandbox, DOM mocking, asset inspection,
 * and test fixtures without modifying ScoreCalculator source files.
 */

const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT_DIR = path.resolve(__dirname, '..');
const APP_DIR = path.join(ROOT_DIR, 'ScoreCalculator');
const ASSETS_DIR = path.join(APP_DIR, 'assets');
const DATA_PATH = path.join(APP_DIR, 'data.js');
const APP_PATH = path.join(APP_DIR, 'app.js');
const HTML_PATH = path.join(APP_DIR, 'index.html');
const CSS_PATH = path.join(APP_DIR, 'styles.css');

/**
 * Creates a lightweight mock DOM environment for browser-dependent code
 */
function createMockDOM() {
    const listeners = {};
    const elements = {};

    function createElementMock(tagName) {
        return {
            tagName: (tagName || 'div').toUpperCase(),
            className: '',
            style: {},
            innerHTML: '',
            innerText: '',
            textContent: '',
            children: [],
            parentNode: null,
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
            remove() {
                if (this.parentNode && typeof this.parentNode.removeChild === 'function') {
                    this.parentNode.removeChild(this);
                }
            },
            classList: {
                classes: new Set(),
                add(...cls) { cls.forEach(c => this.classes.add(c)); },
                remove(...cls) { cls.forEach(c => this.classes.delete(c)); },
                contains(c) { return this.classes.has(c); },
                toggle(c) {
                    if (this.classes.has(c)) { this.classes.delete(c); return false; }
                    this.classes.add(c); return true;
                }
            },
            setAttribute(name, val) { this[name] = val; },
            getAttribute(name) { return this[name] || null; },
            removeAttribute(name) { delete this[name]; },
            addEventListener(evt, fn) {
                if (!listeners[evt]) listeners[evt] = [];
                listeners[evt].push(fn);
            },
            querySelector() { return null; },
            querySelectorAll() { return []; }
        };
    }

    const docMock = {
        createElement: createElementMock,
        getElementById(id) {
            if (!elements[id]) {
                elements[id] = createElementMock('div');
                elements[id].id = id;
            }
            return elements[id];
        },
        querySelector(selector) {
            return createElementMock('div');
        },
        querySelectorAll(selector) {
            return [];
        },
        addEventListener(evt, fn) {
            if (!listeners[evt]) listeners[evt] = [];
            listeners[evt].push(fn);
        },
        body: createElementMock('body')
    };

    const winMock = {
        document: docMock,
        addEventListener(evt, fn) {
            if (!listeners[evt]) listeners[evt] = [];
            listeners[evt].push(fn);
        },
        innerWidth: 1024,
        innerHeight: 768,
        localStorage: {
            _store: {},
            getItem(k) { return this._store[k] || null; },
            setItem(k, v) { this._store[k] = String(v); },
            removeItem(k) { delete this._store[k]; },
            clear() { this._store = {}; }
        },
        requestAnimationFrame(fn) { return setTimeout(fn, 16); }
    };

    return { document: docMock, window: winMock, listeners, elements };
}

/**
 * Loads ScoreCalculator environment in a sandboxed VM context
 */
function loadAppSandbox(customOverrides = {}) {
    const { document: docMock, window: winMock } = createMockDOM();

    const sandbox = {
        console,
        document: docMock,
        window: winMock,
        navigator: {
            clipboard: {
                write: async () => {},
                writeText: async () => {}
            }
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
        JSON,
        html2canvas: async () => ({
            toBlob: (cb) => cb(new Uint8Array([1, 2, 3])),
            toDataURL: () => 'data:image/png;base64,fake'
        }),
        confetti: () => {},
        ...customOverrides
    };

    const ctx = vm.createContext(sandbox);

    // Read and execute data.js
    const dataCode = fs.readFileSync(DATA_PATH, 'utf8');
    vm.runInContext(dataCode, ctx, { filename: 'data.js' });

    // Read and execute app.js
    const appCode = fs.readFileSync(APP_PATH, 'utf8');
    vm.runInContext(appCode, ctx, { filename: 'app.js' });

    // Expose top-level declarations
    const exposed = vm.runInContext(`
        ({
            CURRICULUM_SEMESTERS: typeof CURRICULUM_SEMESTERS !== 'undefined' ? CURRICULUM_SEMESTERS : undefined,
            COURSE_TEMPLATES: typeof COURSE_TEMPLATES !== 'undefined' ? COURSE_TEMPLATES : undefined,
            SAMPLE_SUBJECTS_SCHEMA: typeof SAMPLE_SUBJECTS_SCHEMA !== 'undefined' ? SAMPLE_SUBJECTS_SCHEMA : undefined,
            SUBJECT_SCHEMAS: typeof SUBJECT_SCHEMAS !== 'undefined' ? SUBJECT_SCHEMAS : undefined,
            COMBO_TRACKS: typeof COMBO_TRACKS !== 'undefined' ? COMBO_TRACKS : undefined,
            MOTIVATIONAL_QUOTES: typeof MOTIVATIONAL_QUOTES !== 'undefined' ? MOTIVATIONAL_QUOTES : undefined,
            AppState: typeof AppState !== 'undefined' ? AppState : undefined,
            calculateComponentScore: typeof calculateComponentScore !== 'undefined' ? calculateComponentScore : undefined,
            calculateSubjectScore: typeof calculateSubjectScore !== 'undefined' ? calculateSubjectScore : undefined,
            calculateSemesterResults: typeof calculateSemesterResults !== 'undefined' ? calculateSemesterResults : undefined,
            createSubjectState: typeof createSubjectState !== 'undefined' ? createSubjectState : undefined,
            initComponentState: typeof initComponentState !== 'undefined' ? initComponentState : undefined,
            initializeAppState: typeof initializeAppState !== 'undefined' ? initializeAppState : undefined,
            renderExportCard: typeof renderExportCard !== 'undefined' ? renderExportCard : undefined,
            evalInContext: (code) => eval(code)
        })
    `, ctx);

    Object.assign(ctx, exposed);
    return ctx;
}

/**
 * Fixture creators for test cases
 */
function createSubjectFixture({
    code = 'SUB101',
    nameVi = 'Môn kiểm thử',
    credits = 3,
    isScored = true,
    isPassFailOnly = false,
    isPhysicalEducation = false,
    minAvgToPass = 5.0,
    passStatus = 'pass',
    components = []
}) {
    return {
        id: 'sub_' + Math.random().toString(36).substr(2, 9),
        code,
        nameVi,
        credits,
        isScored,
        isPassFailOnly,
        isPhysicalEducation,
        minAvgToPass,
        passStatus,
        components
    };
}

function createComponentFixture({
    name = 'Final Exam (FE)',
    weight = 100,
    minScore = 4.0,
    isFE = true,
    score = 8.0,
    parts = 1,
    subScores = null
}) {
    const partsCount = subScores ? subScores.length : (parts || 1);
    const subValues = subScores ? subScores.map(String) : Array(partsCount).fill(String(score));
    return {
        id: 'comp_' + Math.random().toString(36).substr(2, 9),
        name,
        weight,
        minScore,
        parts: partsCount,
        isSubParts: partsCount > 1,
        mode: partsCount > 1 ? 'detailed' : 'average',
        isFE,
        avgValue: String(score),
        subValues
    };
}

function getHtmlContent() {
    return fs.readFileSync(HTML_PATH, 'utf8');
}

function getCssContent() {
    return fs.readFileSync(CSS_PATH, 'utf8');
}

function getDataContent() {
    return fs.readFileSync(DATA_PATH, 'utf8');
}

function getAppContent() {
    return fs.readFileSync(APP_PATH, 'utf8');
}

function getAssetsList() {
    if (!fs.existsSync(ASSETS_DIR)) return [];
    return fs.readdirSync(ASSETS_DIR);
}

module.exports = {
    ROOT_DIR,
    APP_DIR,
    ASSETS_DIR,
    DATA_PATH,
    APP_PATH,
    HTML_PATH,
    CSS_PATH,
    createMockDOM,
    loadAppSandbox,
    createSubjectFixture,
    createComponentFixture,
    getHtmlContent,
    getCssContent,
    getDataContent,
    getAppContent,
    getAssetsList
};
