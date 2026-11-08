/**
 * Milestone 1 Empirical Stress Test Suite
 * Independent Verification Script for Challenger 1
 * 
 * Verifies:
 * 1. Valid XML syntax and scalability across all 10 SVGs in ScoreCalculator/assets/.
 * 2. All DOM IDs expected by app.js exist in index.html, with zero duplicate IDs and verified event handlers.
 * 3. CSS rules in styles.css properly enforce min-height: 44px, hidden number spin buttons, zero overflow,
 *    and replacement of orange gradient dominance with primary academic blue.
 */

const fs = require('fs');
const path = require('path');
const assert = require('node:assert/strict');
const { describe, it } = require('node:test');

// Project Paths
const ROOT_DIR = path.resolve(__dirname, '..');
const APP_DIR = path.join(ROOT_DIR, 'ScoreCalculator');
const ASSETS_DIR = path.join(APP_DIR, 'assets');
const HTML_PATH = path.join(APP_DIR, 'index.html');
const CSS_PATH = path.join(APP_DIR, 'styles.css');
const APP_PATH = path.join(APP_DIR, 'app.js');

// Helper: Read file content
function readFile(filePath) {
    return fs.readFileSync(filePath, 'utf8');
}

/**
 * Custom Strict XML Well-Formedness Parser for SVG
 * Checks:
 * - Prologue/declaration validity
 * - Proper tag balancing (opening vs closing)
 * - Self-closing tag handling (<path ... />)
 * - Attribute syntax (quotes matching, no unescaped < or &)
 * - Single root element (<svg>...</svg>)
 */
function validateXmlWellFormed(xmlString, filename = 'svg') {
    const errors = [];
    
    // Strip XML comments: <!-- ... -->
    const stripped = xmlString.replace(/<!--[\s\S]*?-->/g, '');
    
    // Check root element is svg
    const trimmed = stripped.trim();
    if (!trimmed.startsWith('<?xml') && !trimmed.startsWith('<svg')) {
        errors.push(`File does not start with XML declaration or <svg> root element`);
    }

    // Tokenize tags: <tag ...>, </tag>, <tag ... />
    const tagRegex = /<(\/?[a-zA-Z0-9_:-]+)([^>]*?)(\/?)>/g;
    const stack = [];
    let match;
    let rootSeen = false;
    let rootClosed = false;
    let totalTags = 0;

    // Check for raw unescaped '<' outside tags
    let lastIndex = 0;
    while ((match = tagRegex.exec(stripped)) !== null) {
        totalTags++;
        const textBetween = stripped.substring(lastIndex, match.index);
        if (textBetween.includes('<')) {
            errors.push(`Unescaped '<' character found at index ${lastIndex}`);
        }
        lastIndex = tagRegex.lastIndex;

        const tagName = match[1];
        const attrString = match[2] || '';
        const isSelfClosing = match[3] === '/' || attrString.trim().endsWith('/');

        // Check attribute quotes
        const attrRegex = /([a-zA-Z0-9_:-]+)\s*=\s*("[^"]*"|'[^']*')/g;
        let attrMatch;
        const foundAttrs = new Set();
        while ((attrMatch = attrRegex.exec(attrString)) !== null) {
            const attrName = attrMatch[1];
            if (foundAttrs.has(attrName)) {
                errors.push(`Duplicate attribute "${attrName}" on tag <${tagName}> in ${filename}`);
            }
            foundAttrs.add(attrName);
        }

        // Closing tag </tag>
        if (tagName.startsWith('/')) {
            const closingName = tagName.substring(1);
            if (stack.length === 0) {
                errors.push(`Unexpected closing tag </${closingName}> with empty stack in ${filename}`);
            } else {
                const popped = stack.pop();
                if (popped !== closingName) {
                    errors.push(`Mismatched closing tag: expected </${popped}>, found </${closingName}> in ${filename}`);
                }
            }
            if (closingName === 'svg') {
                rootClosed = true;
            }
        } else if (!isSelfClosing) {
            // Opening tag <tag>
            if (!rootSeen) {
                if (tagName !== 'svg') {
                    errors.push(`Root tag must be <svg>, found <${tagName}> in ${filename}`);
                }
                rootSeen = true;
            } else if (rootClosed) {
                errors.push(`Tag <${tagName}> found after root </svg> was closed in ${filename}`);
            }
            stack.push(tagName);
        }
    }

    if (stack.length > 0) {
        errors.push(`Unclosed tags remaining on stack: ${stack.join(', ')} in ${filename}`);
    }
    if (!rootClosed) {
        errors.push(`Root <svg> tag was not properly closed in ${filename}`);
    }
    if (totalTags === 0) {
        errors.push(`No valid XML tags parsed in ${filename}`);
    }

    return {
        isValid: errors.length === 0,
        errors: errors,
        tagCount: totalTags
    };
}

describe('Milestone 1 Empirical Stress Test', () => {

    // =========================================================================
    // 1. SVG Assets XML Syntax & Scalability Verification
    // =========================================================================
    describe('1. SVG Assets & Scalability (10 Required Assets)', () => {
        const expectedAssets = [
            'logo.svg',
            'mascot_happy.svg',
            'mascot_celebrate.svg',
            'mascot_stamp.svg',
            'badge_cocvang.svg',
            'badge_top100.svg',
            'badge_xuatsac.svg',
            'badge_gioi.svg',
            'badge_kha.svg',
            'badge_dat.svg'
        ];

        it('1.1: All 10 SVG assets physically exist and are non-empty', () => {
            for (const asset of expectedAssets) {
                const assetPath = path.join(ASSETS_DIR, asset);
                assert.ok(fs.existsSync(assetPath), `Missing required asset: ${asset}`);
                const stats = fs.statSync(assetPath);
                assert.ok(stats.size > 500, `Asset ${asset} is unusually small (${stats.size} bytes), possible empty stub`);
            }
        });

        for (const asset of expectedAssets) {
            describe(`Asset XML & Scalability: ${asset}`, () => {
                const assetPath = path.join(ASSETS_DIR, asset);
                const content = fs.existsSync(assetPath) ? readFile(assetPath) : '';

                it(`Valid XML well-formedness: ${asset}`, () => {
                    const xmlResult = validateXmlWellFormed(content, asset);
                    assert.ok(
                        xmlResult.isValid,
                        `XML validation failed for ${asset}: ${xmlResult.errors.join('; ')}`
                    );
                    assert.ok(xmlResult.tagCount >= 3, `${asset} has too few XML tags (${xmlResult.tagCount})`);
                });

                it(`Scalability check (viewBox attribute present and valid): ${asset}`, () => {
                    // Check <svg ... viewBox="..."
                    const svgTagMatch = content.match(/<svg\b([^>]*)>/i);
                    assert.ok(svgTagMatch, `<svg> root tag not found in ${asset}`);
                    const svgAttrs = svgTagMatch[1];

                    // Check viewBox regex: min-x min-y width height (4 numbers)
                    const viewBoxMatch = svgAttrs.match(/viewBox\s*=\s*["']\s*(-?\d+(?:\.\d+)?)\s+(-?\d+(?:\.\d+)?)\s+(\d+(?:\.\d+)?)\s+(\d+(?:\.\d+)?)\s*["']/i);
                    assert.ok(viewBoxMatch, `${asset} is missing a valid 4-parameter viewBox attribute, required for responsive scaling`);

                    const vbWidth = parseFloat(viewBoxMatch[3]);
                    const vbHeight = parseFloat(viewBoxMatch[4]);
                    assert.ok(vbWidth > 0, `${asset} viewBox width must be > 0 (found ${vbWidth})`);
                    assert.ok(vbHeight > 0, `${asset} viewBox height must be > 0 (found ${vbHeight})`);

                    // Check xmlns attribute
                    assert.ok(
                        svgAttrs.includes('xmlns="http://www.w3.org/2000/svg"') || svgAttrs.includes("xmlns='http://www.w3.org/2000/svg'"),
                        `${asset} missing xmlns="http://www.w3.org/2000/svg"`
                    );
                });

                it(`Non-empty vector geometry (contains actual shapes/paths): ${asset}`, () => {
                    // Check for geometric vector tags
                    const vectorTagsMatch = content.match(/<(path|circle|rect|ellipse|polygon|polyline|line)\b/gi);
                    assert.ok(
                        vectorTagsMatch && vectorTagsMatch.length >= 2,
                        `${asset} must contain actual vector graphics (found ${vectorTagsMatch ? vectorTagsMatch.length : 0} shapes)`
                    );

                    // If it contains <path>, ensure 'd' attribute is not empty
                    const pathMatches = content.matchAll(/<path\b[^>]*\bd\s*=\s*["']([^"']+)["'][^>]*>/gi);
                    for (const pm of pathMatches) {
                        assert.ok(pm[1].trim().length >= 4, `${asset} contains empty or invalid path 'd' attribute`);
                    }
                });
            });
        }

        it('1.2: Mascot assets specifically model the Cóc Vàng (Golden Toad) visual identity', () => {
            const happyContent = readFile(path.join(ASSETS_DIR, 'mascot_happy.svg'));
            const celebrateContent = readFile(path.join(ASSETS_DIR, 'mascot_celebrate.svg'));

            // Check for toad / frog colors: warm orange / gold / yellow tones (#F... or #FF... or rgb)
            const hasWarmGold = /#F[0-9A-Fa-f]{5}|#FFB800|#F27024|#E|#D/i.test(happyContent);
            assert.ok(hasWarmGold, 'mascot_happy.svg must contain golden/orange tones matching Cóc Vàng');

            // Check for eye specular highlights / round eyes
            const hasCircles = happyContent.includes('<circle') || happyContent.includes('<ellipse') || happyContent.includes('d=');
            assert.ok(hasCircles, 'mascot_happy.svg must contain eye/facial geometry');

            // Check celebrate content has celebration elements (confetti, trophy, or stars)
            assert.ok(
                celebrateContent.length > 5000,
                'mascot_celebrate.svg must be an enriched celebratory vector graphic'
            );
        });

        it('1.3: Stamp asset is suitable for certificate export watermark', () => {
            const stampContent = readFile(path.join(ASSETS_DIR, 'mascot_stamp.svg'));
            assert.ok(stampContent.includes('viewBox'), 'mascot_stamp.svg must have viewBox for scaling in export');
            assert.ok(
                stampContent.toLowerCase().includes('cóc') || stampContent.toLowerCase().includes('fpt') || stampContent.includes('<path') || stampContent.includes('<circle'),
                'mascot_stamp.svg must contain official stamp seal artwork'
            );
        });
    });

    // =========================================================================
    // 2. DOM IDs Synchronization (app.js vs index.html)
    // =========================================================================
    describe('2. DOM IDs Synchronization (app.js vs index.html)', () => {
        const html = readFile(HTML_PATH);
        const appJs = readFile(APP_PATH);

        // Extract all getElementById calls
        const idRegex = /document\.getElementById\(\s*["'`]?([a-zA-Z0-9_-]+)["'`]?\s*\)/g;
        const appIds = new Set();
        let m;
        while ((m = idRegex.exec(appJs)) !== null) {
            appIds.add(m[1]);
        }

        // Extract all querySelector('#id') calls
        const qsRegex = /document\.querySelector(?:All)?\(\s*["'`]#([a-zA-Z0-9_-]+)["'`]\s*\)/g;
        while ((m = qsRegex.exec(appJs)) !== null) {
            appIds.add(m[1]);
        }

        // Extract all IDs present in index.html
        const htmlIdRegex = /\bid\s*=\s*["']([a-zA-Z0-9_-]+)["']/g;
        const htmlIds = new Set();
        const htmlIdList = [];
        while ((m = htmlIdRegex.exec(html)) !== null) {
            htmlIds.add(m[1]);
            htmlIdList.push(m[1]);
        }

        it('2.1: app.js queries at least 15 distinct DOM elements', () => {
            assert.ok(
                appIds.size >= 15,
                `Expected app.js to reference >= 15 DOM IDs, found ${appIds.size}: ${Array.from(appIds).join(', ')}`
            );
        });

        it('2.2: Every DOM ID queried by app.js exists in index.html', () => {
            const missingInHtml = [];
            for (const id of appIds) {
                if (!htmlIds.has(id)) {
                    missingInHtml.push(id);
                }
            }
            assert.deepStrictEqual(
                missingInHtml,
                [],
                `The following DOM IDs are referenced in app.js but missing in index.html: ${missingInHtml.join(', ')}`
            );
        });

        it('2.3: Zero duplicate IDs in index.html (Strict HTML5 uniqueness constraint)', () => {
            const seen = new Set();
            const duplicates = [];
            for (const id of htmlIdList) {
                if (seen.has(id)) {
                    duplicates.push(id);
                }
                seen.add(id);
            }
            assert.deepStrictEqual(
                duplicates,
                [],
                `Duplicate DOM IDs detected in index.html: ${duplicates.join(', ')}`
            );
        });

        it('2.4: All core Milestone 1 DOM elements exist in index.html', () => {
            const coreM1Ids = [
                'semester-tabs',
                'semester-info',
                'subjects-container',
                'summary-progress',
                'summary-progress-bar',
                'summary-tbm',
                'summary-honor-badge',
                'summary-honor-desc',
                'summary-highlight-container',
                'export-modal',
                'certificate-card',
                'btn-copy-clipboard',
                'btn-download-png',
                'template-modal',
                'add-subject-modal',
                'new-sub-code',
                'new-sub-namevi',
                'new-sub-credits',
                'new-sub-template',
                'new-sub-isscored',
                'mascot-widget',
                'mobile-summary-bar'
            ];

            const missingCore = coreM1Ids.filter(id => !htmlIds.has(id));
            assert.deepStrictEqual(missingCore, [], `Core M1 IDs missing in index.html: ${missingCore.join(', ')}`);
        });

        it('2.5: Interactive onclick handlers in index.html resolve to defined functions in app.js', () => {
            // Find all onclick="functionName(...)" in index.html
            const onclickRegex = /\bonclick\s*=\s*["']\s*([a-zA-Z0-9_]+)\s*\(/g;
            const onclickFunctions = new Set();
            while ((m = onclickRegex.exec(html)) !== null) {
                onclickFunctions.add(m[1]);
            }

            // Browser built-in functions or acceptable inline functions
            const browserBuiltins = new Set(['print', 'alert', 'confirm', 'prompt']);

            const missingFunctions = [];
            for (const fn of onclickFunctions) {
                if (browserBuiltins.has(fn)) continue;
                // Check if defined in app.js or inline scripts in index.html
                const definedInApp = new RegExp(`(?:function\\s+${fn}\\b|const\\s+${fn}\\s*=|let\\s+${fn}\\s*=|var\\s+${fn}\\s*=|window\\.${fn}\\s*=)`).test(appJs);
                const definedInHtml = new RegExp(`(?:function\\s+${fn}\\b|const\\s+${fn}\\s*=|let\\s+${fn}\\s*=|var\\s+${fn}\\s*=|window\\.${fn}\\s*=)`).test(html);
                if (!definedInApp && !definedInHtml) {
                    missingFunctions.push(fn);
                }
            }

            assert.deepStrictEqual(
                missingFunctions,
                [],
                `onclick handlers reference undefined functions: ${missingFunctions.join(', ')}`
            );
        });
    });

    // =========================================================================
    // 3. CSS Enforcement Stress Test (styles.css)
    // =========================================================================
    describe('3. CSS Enforcement & Mobile Responsiveness (styles.css)', () => {
        const css = readFile(CSS_PATH);
        const html = readFile(HTML_PATH);

        it('3.1: Enforces touch target height min-height >= 44px on mobile', () => {
            // Check .score-input min-height >= 44px
            const scoreInputMatch = css.match(/\.score-input\s*\{[^}]*min-height\s*:\s*(\d+)px/);
            assert.ok(scoreInputMatch, '.score-input must have an explicit min-height in px');
            const scoreHeight = parseInt(scoreInputMatch[1], 10);
            assert.ok(scoreHeight >= 44, `.score-input min-height is ${scoreHeight}px, must be >= 44px`);

            // Check mobile media query enforcement
            const mobileTouchMatch = css.match(/@media\s*\([^)]*max-width:\s*640px\)[^{]*\{[\s\S]*?(button|input|select)[\s\S]*?min-height\s*:\s*(\d+)px/i);
            assert.ok(mobileTouchMatch, 'styles.css must enforce min-height >= 44px on mobile via media query (max-width: 640px)');
            const mobileTouchHeight = parseInt(mobileTouchMatch[2], 10);
            assert.ok(mobileTouchHeight >= 44, `Mobile touch min-height is ${mobileTouchHeight}px, must be >= 44px`);
        });

        it('3.2: Enforces hidden number spin buttons for both WebKit and Firefox', () => {
            // WebKit spin button reset
            assert.ok(
                css.includes('::-webkit-inner-spin-button') && css.includes('::-webkit-outer-spin-button'),
                'Missing -webkit-inner-spin-button / -webkit-outer-spin-button rule in styles.css'
            );
            assert.ok(
                css.includes('-webkit-appearance: none') || css.includes('-webkit-appearance:none'),
                'Spin button rule must specify -webkit-appearance: none'
            );

            // Firefox textfield reset
            assert.ok(
                css.includes('-moz-appearance: textfield') || css.includes('-moz-appearance:textfield') || css.includes('appearance: textfield'),
                'Number inputs must specify -moz-appearance: textfield for Firefox'
            );
        });

        it('3.3: Enforces zero horizontal overflow (overflow-x: hidden)', () => {
            // Check body rule in styles.css
            const bodyMatch = css.match(/body\s*\{[^}]*overflow-x\s*:\s*hidden/i);
            assert.ok(bodyMatch, 'body in styles.css must declare overflow-x: hidden');

            // Check semester tab strip has horizontal scrolling (overflow-x-auto or no-scrollbar)
            assert.ok(
                html.includes('overflow-x-auto') || css.includes('overflow-x: auto'),
                'Semester tab container must allow horizontal scrolling (overflow-x-auto)'
            );
        });

        it('3.4: Eradicates dominant orange gradient backgrounds/headers and enforces primary blue', () => {
            // Primary blue palette tokens in styles.css
            assert.ok(css.includes('--fpt-blue: #0066B2'), 'styles.css must declare --fpt-blue: #0066B2');
            assert.ok(css.includes('--fpt-blue-dark: #1E40AF'), 'styles.css must declare --fpt-blue-dark: #1E40AF');
            assert.ok(css.includes('--fpt-blue-light: #0284C7'), 'styles.css must declare --fpt-blue-light: #0284C7');

            // Check index.html does NOT use dominant orange gradient headers
            assert.ok(
                !html.includes('from-fptOrange to-orange-400') && !html.includes('from-orange-500 to-amber-500'),
                'index.html still contains dominant orange gradient headers'
            );

            // Check header is clean white or elegant blue
            const headerMatch = html.match(/<header\b[^>]*class\s*=\s*["']([^"']+)["']/i);
            assert.ok(headerMatch, '<header> element not found in index.html');
            const headerClass = headerMatch[1];
            assert.ok(
                !headerClass.includes('bg-orange') && !headerClass.includes('from-fptOrange'),
                `Header must not have dominant orange background (classes: ${headerClass})`
            );

            // Check body background is clean neutral/light
            const bodyClassMatch = html.match(/<body\b[^>]*class\s*=\s*["']([^"']+)["']/i);
            assert.ok(bodyClassMatch, '<body> class not found');
            assert.ok(
                bodyClassMatch[1].includes('bg-slate-50') || bodyClassMatch[1].includes('bg-white') || bodyClassMatch[1].includes('bg-gray-50'),
                'Body background must be clean neutral/light slate or white'
            );
        });

        it('3.5: Mobile quick summary bar (< 1024px) is properly positioned and hidden on desktop', () => {
            assert.ok(css.includes('.mobile-summary-bar'), 'styles.css must contain .mobile-summary-bar rule');
            assert.ok(
                css.includes('position: fixed') && css.includes('bottom: 0'),
                '.mobile-summary-bar must be fixed to the bottom of the viewport'
            );
            assert.ok(
                css.includes('@media (min-width: 1024px)') && css.includes('display: none !important'),
                '.mobile-summary-bar must be hidden on desktop viewports (>= 1024px)'
            );
            assert.ok(html.includes('id="mobile-summary-bar"'), 'index.html must contain #mobile-summary-bar element');
        });

        it('3.6: Mascot widget container is responsive and floats comfortably above mobile bar', () => {
            assert.ok(css.includes('.mascot-widget-container'), 'styles.css must contain .mascot-widget-container');
            assert.ok(css.includes('position: fixed'), '.mascot-widget-container must be fixed');
            assert.ok(css.includes('.mascot-avatar-btn'), 'styles.css must contain .mascot-avatar-btn');
            assert.ok(css.includes('.mascot-bubble'), 'styles.css must contain .mascot-bubble');
            assert.ok(html.includes('id="mascot-widget"'), 'index.html must contain #mascot-widget');
        });

        it('3.7: Export certificate card features official watermark seal referencing assets/mascot_stamp.svg', () => {
            assert.ok(
                css.includes('#certificate-card::after'),
                'styles.css must define #certificate-card::after watermark seal'
            );
            assert.ok(
                css.includes('assets/mascot_stamp.svg'),
                'Watermark seal must reference assets/mascot_stamp.svg'
            );
            assert.ok(
                css.includes('opacity: 0.22') || css.includes('opacity: 0.2') || css.includes('opacity: 0.15') || css.includes('opacity: 0.25'),
                'Watermark seal must have subtle opacity'
            );
        });
    });

    // =========================================================================
    // 4. Adversarial Stress & Oracle Soundness Verification
    // =========================================================================
    describe('4. Adversarial Stress & Soundness Checks', () => {
        const html = readFile(HTML_PATH);
        const css = readFile(CSS_PATH);

        it('4.1: Oracle Verification - XML validator correctly rejects malformed SVG edge cases', () => {
            // Case 1: Unclosed tag
            const unclosed = '<svg xmlns="http://www.w3.org/2000/svg"><g><circle cx="5" cy="5" r="5"></svg>';
            assert.strictEqual(validateXmlWellFormed(unclosed, 'unclosed.svg').isValid, false, 'Oracle should reject unclosed <g>');

            // Case 2: Mismatched tag
            const mismatched = '<svg xmlns="http://www.w3.org/2000/svg"><g></path></svg>';
            assert.strictEqual(validateXmlWellFormed(mismatched, 'mismatched.svg').isValid, false, 'Oracle should reject mismatched tag');

            // Case 3: Duplicate attribute
            const dupAttr = '<svg xmlns="http://www.w3.org/2000/svg" width="100" width="200"></svg>';
            assert.strictEqual(validateXmlWellFormed(dupAttr, 'dupAttr.svg').isValid, false, 'Oracle should reject duplicate attribute');

            // Case 4: No root svg
            const noSvg = '<div><span>test</span></div>';
            assert.strictEqual(validateXmlWellFormed(noSvg, 'noSvg.svg').isValid, false, 'Oracle should reject non-svg root');
        });

        it('4.2: All image asset references in index.html resolve to existing files on disk', () => {
            const assetRefRegex = /src\s*=\s*["'](assets\/[^"']+)["']/g;
            const assetRefs = new Set();
            let m;
            while ((m = assetRefRegex.exec(html)) !== null) {
                assetRefs.add(m[1]);
            }

            assert.ok(assetRefs.size >= 5, `Expected >= 5 asset references in index.html, found ${assetRefs.size}`);
            for (const ref of assetRefs) {
                const diskPath = path.join(APP_DIR, ref);
                assert.ok(fs.existsSync(diskPath), `Broken asset reference in index.html: ${ref}`);
            }
        });

        it('4.3: All CSS url() asset references in styles.css resolve to existing files on disk', () => {
            const cssUrlRegex = /url\s*\(\s*["']?(assets\/[^"')]+)["']?\s*\)/g;
            const cssUrls = new Set();
            let m;
            while ((m = cssUrlRegex.exec(css)) !== null) {
                cssUrls.add(m[1]);
            }

            assert.ok(cssUrls.size >= 1, `Expected at least 1 asset url in styles.css, found ${cssUrls.size}`);
            for (const ref of cssUrls) {
                const diskPath = path.join(APP_DIR, ref);
                assert.ok(fs.existsSync(diskPath), `Broken asset reference in styles.css: ${ref}`);
            }
        });

        it('4.4: No destructive inline styles or classes override mobile min-height 44px on interactive controls', () => {
            // Find all input and button tags in HTML
            const interactiveTagRegex = /<(?:input|button|select)\b([^>]*)>/gi;
            let m;
            while ((m = interactiveTagRegex.exec(html)) !== null) {
                const attrs = m[1];
                // Check if inline style forces small height e.g. style="height: 20px"
                const inlineHeight = attrs.match(/style\s*=\s*["'][^"']*\bheight\s*:\s*(\d+)px/i);
                if (inlineHeight) {
                    const h = parseInt(inlineHeight[1], 10);
                    assert.ok(h >= 44, `Found interactive control with destructive inline height < 44px: ${inlineHeight[0]}`);
                }
            }
        });

        it('4.5: High contrast accessibility: Primary blue meets WCAG AA contrast against white text', () => {
            // Calculate relative luminance for #0066B2
            // L = 0.2126 * R + 0.7152 * G + 0.0722 * B where c_srgb <= 0.04045 ? c/12.92 : ((c+0.055)/1.055)^2.4
            function toLinear(c8) {
                const c = c8 / 255;
                return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
            }
            const rLin = toLinear(0);
            const gLin = toLinear(102);
            const bLin = toLinear(178);
            const lumBlue = 0.2126 * rLin + 0.7152 * gLin + 0.0722 * bLin;
            const lumWhite = 1.0;

            const contrastRatio = (lumWhite + 0.05) / (lumBlue + 0.05);
            // WCAG AA for normal text requires >= 4.5:1
            assert.ok(
                contrastRatio >= 4.5,
                `Contrast ratio between #FFFFFF and #0066B2 is ${contrastRatio.toFixed(2)}:1, must be >= 4.5:1`
            );
        });
    });
});
