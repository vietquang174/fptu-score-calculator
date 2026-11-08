/**
 * FPT University Score Calculator & Honors Prediction (BIT_SE_K20B)
 * Pure Stateless Client-Side Logic & UI Controller
 */

// Global Application State (Stateless - In-memory only)
const AppState = {
    currentSemester: 2, // Mặc định mở Kỳ 2 (có môn MAD101 mẫu)
    selectedComboTrack: "dotnet", // Track chuyên ngành hẹp mặc định (.NET)
    selectedCapstoneElective: "SEP490", // Đồ án tốt nghiệp mặc định (SEP490)
    _scoresCache: {},   // Cache lưu tạm điểm khi người dùng chuyển đổi track / capstone
    semesterData: {},   // Dữ liệu môn học theo kỳ
    hasCelebratedCocVang: false
};

// ================================================================
// COMBO TRACK & CAPSTONE ELECTIVE ENGINE
// ================================================================

/**
 * Tạo cache key cho môn học, kết hợp comboSlot để tránh collision khi có môn cùng mã hoặc cùng track
 */
function getSubjectCacheKey(subject) {
    if (!subject || !subject.code) return null;
    const slotPart = (subject.comboSlot !== undefined && subject.comboSlot !== null) ? `_slot_${subject.comboSlot}` : '';
    return `${subject.code}${slotPart}`;
}

/**
 * Lưu tạm điểm số người dùng đã nhập cho các môn học để không bị mất khi chuyển đổi track
 */
function cacheSubjectScores(subject) {
    if (!subject || !subject.code) return;
    if (!AppState._scoresCache) AppState._scoresCache = {};
    const key = getSubjectCacheKey(subject);
    const scoreData = {
        passStatus: subject.passStatus,
        components: (subject.components || []).map(c => ({
            id: c.id,
            name: c.name,
            mode: c.mode,
            avgValue: c.avgValue,
            subValues: Array.isArray(c.subValues) ? [...c.subValues] : []
        }))
    };
    if (key) {
        AppState._scoresCache[key] = scoreData;
    }
    AppState._scoresCache[subject.code] = scoreData;
}

/**
 * Phục hồi điểm số đã lưu trong cache vào môn học mới
 */
function restoreSubjectScores(subject) {
    if (!subject || !subject.code || !AppState._scoresCache) return;
    const key = getSubjectCacheKey(subject);
    const cached = (key && AppState._scoresCache[key]) || AppState._scoresCache[subject.code];
    if (!cached) return;

    if (cached.passStatus !== undefined) {
        subject.passStatus = cached.passStatus;
    }

    if (Array.isArray(cached.components) && Array.isArray(subject.components)) {
        cached.components.forEach((cComp, idx) => {
            const targetComp = subject.components.find(sc => sc.name === cComp.name || sc.id === cComp.id) || subject.components[idx];
            if (targetComp) {
                if (cComp.mode) targetComp.mode = cComp.mode;
                if (cComp.avgValue !== undefined) targetComp.avgValue = cComp.avgValue;
                if (Array.isArray(cComp.subValues)) {
                    cComp.subValues.forEach((val, pIdx) => {
                        if (pIdx < targetComp.subValues.length) {
                            targetComp.subValues[pIdx] = val;
                        }
                    });
                }
            }
        });
    }
}

/**
 * Áp dụng một Combo Track cụ thể vào một học kỳ combo (5, 7, 8)
 * Thay thế các vị trí combo slot bằng môn học thực tế của track đó
 * Đồng thời bảo toàn nguyên vẹn các môn cốt lõi (SWP391, SWT301, SWD392, PMG201c, EXE101, PRM393, ITE302c, EXE201, MLN111, MLN122)
 */
function applyComboTrackToSemester(semesterNum, trackId) {
    if (typeof CURRICULUM_SEMESTERS === 'undefined') return;
    const semDef = CURRICULUM_SEMESTERS.find(s => s.semester === semesterNum);
    if (!semDef || !semDef.isComboSemester) return;

    const track = typeof getComboTrack === 'function' ? getComboTrack(trackId) : (typeof COMBO_TRACKS !== 'undefined' ? (COMBO_TRACKS[trackId] || COMBO_TRACKS.dotnet) : null);
    if (!track || !track.courses || !track.courses[semesterNum]) return;

    const trackCourses = track.courses[semesterNum];

    if (!AppState.semesterData[semesterNum]) {
        AppState.semesterData[semesterNum] = semDef.subjects.map(s => createSubjectState(s));
    }

    const currentSubjects = AppState.semesterData[semesterNum];
    currentSubjects.forEach(s => cacheSubjectScores(s));

    let comboSlotIndex = 0;
    const newSubjectsList = semDef.subjects.map((subDef) => {
        const isComboSlot = !!subDef.isCombo || (subDef.code && subDef.code.includes("COM"));
        if (isComboSlot) {
            const currentSlot = subDef.comboSlot !== undefined ? subDef.comboSlot : comboSlotIndex;
            const assignedCode = trackCourses[comboSlotIndex] || subDef.code;
            comboSlotIndex++;

            const schema = (typeof SAMPLE_SUBJECTS_SCHEMA !== 'undefined' && SAMPLE_SUBJECTS_SCHEMA[assignedCode]) || (typeof SUBJECT_SCHEMAS !== 'undefined' && SUBJECT_SCHEMAS[assignedCode]);
            let newSub;
            if (schema) {
                newSub = createSubjectState({
                    ...schema,
                    code: assignedCode,
                    isCombo: true,
                    comboTrackId: track.id,
                    comboSlot: currentSlot
                });
            } else {
                newSub = createSubjectState({
                    ...subDef,
                    code: assignedCode,
                    isCombo: true,
                    comboTrackId: track.id,
                    comboSlot: currentSlot
                });
            }
            restoreSubjectScores(newSub);
            return newSub;
        } else {
            const existingSub = currentSubjects.find(s => s.code === subDef.code);
            return existingSub || createSubjectState(subDef);
        }
    });

    AppState.semesterData[semesterNum] = newSubjectsList;
}

/**
 * Áp dụng môn tốt nghiệp Capstone tự chọn vào Học kỳ 9
 * Thay thế môn SE_GRA_ELE bằng mã môn được chọn (SEP490, SET490, EXE402, PIT490, GRC490)
 * Bảo toàn các môn chính trị (HCM202, MLN131, VNR202)
 */
function applyCapstoneElectiveToSemester(capstoneCode) {
    if (typeof CURRICULUM_SEMESTERS === 'undefined') return;
    const semDef = CURRICULUM_SEMESTERS.find(s => s.semester === 9);
    if (!semDef) return;

    if (!capstoneCode) capstoneCode = "SEP490";

    if (!AppState.semesterData[9]) {
        AppState.semesterData[9] = semDef.subjects.map(s => createSubjectState(s));
    }

    const currentSubjects = AppState.semesterData[9];
    currentSubjects.forEach(s => cacheSubjectScores(s));

    const newSubjectsList = semDef.subjects.map(subDef => {
        const isCapstoneSlot = !!subDef.isCapstone || subDef.code === "SE_GRA_ELE" || (subDef.code && subDef.code.includes("GRA"));
        if (isCapstoneSlot) {
            const schema = (typeof SAMPLE_SUBJECTS_SCHEMA !== 'undefined' && SAMPLE_SUBJECTS_SCHEMA[capstoneCode]) || (typeof SUBJECT_SCHEMAS !== 'undefined' && SUBJECT_SCHEMAS[capstoneCode]);
            let newSub;
            if (schema) {
                newSub = createSubjectState({
                    ...schema,
                    code: capstoneCode,
                    isCapstone: true
                });
            } else {
                newSub = createSubjectState({
                    ...subDef,
                    code: capstoneCode,
                    isCapstone: true
                });
            }
            restoreSubjectScores(newSub);
            return newSub;
        } else {
            const existingSub = currentSubjects.find(s => s.code === subDef.code);
            return existingSub || createSubjectState(subDef);
        }
    });

    AppState.semesterData[9] = newSubjectsList;
}

/**
 * Đổi Combo Track trên toàn hệ thống (Kỳ 5, 7, 8)
 */
function setComboTrack(trackId) {
    if (!trackId) return;
    AppState.selectedComboTrack = trackId;

    [5, 7, 8].forEach(semNum => {
        applyComboTrackToSemester(semNum, trackId);
    });

    try {
        if (typeof localStorage !== 'undefined' && localStorage.setItem) {
            localStorage.setItem('fptu_selected_combo_track', trackId);
        }
    } catch (e) {}

    if (typeof renderApp === 'function') {
        renderApp();
    }
}

/**
 * Đổi môn tốt nghiệp Capstone cho Kỳ 9
 */
function setCapstoneElective(capstoneCode) {
    if (!capstoneCode) return;
    AppState.selectedCapstoneElective = capstoneCode;

    applyCapstoneElectiveToSemester(capstoneCode);

    try {
        if (typeof localStorage !== 'undefined' && localStorage.setItem) {
            localStorage.setItem('fptu_selected_capstone_elective', capstoneCode);
        }
    } catch (e) {}

    if (typeof renderApp === 'function') {
        renderApp();
    }
}

// Khởi tạo dữ liệu môn học từ cấu hình gốc
function initializeAppState() {
    try {
        if (typeof localStorage !== 'undefined' && localStorage.getItem) {
            const savedTrack = localStorage.getItem('fptu_selected_combo_track');
            if (savedTrack && typeof COMBO_TRACKS !== 'undefined' && (COMBO_TRACKS[savedTrack] || COMBO_TRACKS[savedTrack.toLowerCase()])) {
                AppState.selectedComboTrack = savedTrack;
            }
            const savedCapstone = localStorage.getItem('fptu_selected_capstone_elective');
            if (savedCapstone) {
                AppState.selectedCapstoneElective = savedCapstone;
            }
        }
    } catch (e) {}

    if (typeof CURRICULUM_SEMESTERS !== 'undefined') {
        CURRICULUM_SEMESTERS.forEach(sem => {
            AppState.semesterData[sem.semester] = sem.subjects.map(sub => createSubjectState(sub));
        });

        [5, 7, 8].forEach(semNum => {
            applyComboTrackToSemester(semNum, AppState.selectedComboTrack || "dotnet");
        });

        applyCapstoneElectiveToSemester(AppState.selectedCapstoneElective || "SEP490");
    }
}

// Tạo state cho một môn học cụ thể
function createSubjectState(subjectDef) {
    const code = subjectDef.code;
    const alias = subjectDef.aliasSyllabus || code;
    
    // Nếu môn có trong danh sách Syllabus chi tiết đã bóc tách (MAD101, DBI202, VOV114, LAB211)
    if (SAMPLE_SUBJECTS_SCHEMA[alias]) {
        const schema = SAMPLE_SUBJECTS_SCHEMA[alias];
        return {
            id: 'sub_' + Math.random().toString(36).substr(2, 9),
            code: subjectDef.code,
            nameVi: schema.nameVi || subjectDef.nameVi,
            nameEn: schema.nameEn || subjectDef.nameEn,
            credits: subjectDef.credits !== undefined ? subjectDef.credits : schema.credits,
            isScored: schema.isScored !== undefined ? schema.isScored : subjectDef.isScored,
            isPassFailOnly: !!schema.isPassFailOnly,
            isPhysicalEducation: !!schema.isPhysicalEducation,
            hasDetailedSyllabus: true,
            minAvgToPass: schema.minAvgToPass || 5.0,
            note: schema.note || subjectDef.note || "",
            passStatus: schema.isPassFailOnly ? "pass" : null, // Mặc định Pass cho môn điều kiện
            isCombo: !!subjectDef.isCombo,
            comboTrackId: subjectDef.comboTrackId || null,
            comboSlot: subjectDef.comboSlot !== undefined ? subjectDef.comboSlot : null,
            isCapstone: !!subjectDef.isCapstone,
            components: schema.components ? schema.components.map(c => initComponentState(c)) : []
        };
    }

    // Nếu là môn Pass/Fail đơn thuần (như PEN, OTP101)
    if (subjectDef.isPassFailOnly) {
        return {
            id: 'sub_' + Math.random().toString(36).substr(2, 9),
            code: subjectDef.code,
            nameVi: subjectDef.nameVi,
            nameEn: subjectDef.nameEn,
            credits: subjectDef.credits,
            isScored: false,
            isPassFailOnly: true,
            hasDetailedSyllabus: false,
            passStatus: "pass",
            note: subjectDef.note || "",
            isCombo: !!subjectDef.isCombo,
            comboTrackId: subjectDef.comboTrackId || null,
            comboSlot: subjectDef.comboSlot !== undefined ? subjectDef.comboSlot : null,
            isCapstone: !!subjectDef.isCapstone,
            components: []
        };
    }

    // Nếu môn dùng Template mặc định
    const templateKey = subjectDef.template || "theory_standard";
    const template = COURSE_TEMPLATES[templateKey] || COURSE_TEMPLATES.theory_standard;
    return {
        id: 'sub_' + Math.random().toString(36).substr(2, 9),
        code: subjectDef.code,
        nameVi: subjectDef.nameVi,
        nameEn: subjectDef.nameEn,
        credits: subjectDef.credits,
        isScored: subjectDef.isScored !== undefined ? subjectDef.isScored : true,
        isPassFailOnly: false,
        isPhysicalEducation: !!subjectDef.isPhysicalEducation,
        hasDetailedSyllabus: false,
        templateId: templateKey,
        minAvgToPass: template.minAvgToPass || 5.0,
        note: subjectDef.note || "",
        isCombo: !!subjectDef.isCombo,
        comboTrackId: subjectDef.comboTrackId || null,
        comboSlot: subjectDef.comboSlot !== undefined ? subjectDef.comboSlot : null,
        isCapstone: !!subjectDef.isCapstone,
        components: template.components.map(c => initComponentState(c))
    };
}

// Khởi tạo state cho một đầu điểm thành phần
function initComponentState(compDef) {
    const partsCount = compDef.parts || 1;
    return {
        id: compDef.id || 'comp_' + Math.random().toString(36).substr(2, 9),
        name: compDef.name,
        weight: compDef.weight,
        minScore: compDef.minScore !== undefined ? compDef.minScore : 0,
        parts: partsCount,
        isSubParts: partsCount > 1,
        mode: partsCount > 1 ? "detailed" : "average", // "detailed" hoặc "average"
        isFE: !!compDef.isFE,
        note: compDef.note || "",
        // Giá trị nhập: mảng subValues cho từng part hoặc avgValue khi nhập gộp
        subValues: Array(partsCount).fill(""),
        avgValue: ""
    };
}

// ================================================================
// LOGIC TÍNH TOÁN (Calculation Engine)
// ================================================================

/**
 * Tính điểm của 1 thành phần
 * Trả về: { value: number|null, isFilled: boolean, isMissing: boolean, isFailed: boolean, message: string }
 */
function calculateComponentScore(comp) {
    if (comp.mode === "average" || comp.parts <= 1) {
        const valStr = (comp.mode === "average" && comp.parts > 1) ? comp.avgValue : comp.subValues[0];
        if (valStr === "" || valStr === null || valStr === undefined) {
            return { value: null, isFilled: false, isMissing: true, isFailed: false, message: "Chưa nhập" };
        }
        const num = parseFloat(valStr);
        if (isNaN(num)) {
            return { value: null, isFilled: false, isMissing: true, isFailed: false, message: "Không hợp lệ" };
        }
        const isFailed = comp.isFE ? (num < comp.minScore) : (num <= comp.minScore);
        return {
            value: num,
            isFilled: true,
            isMissing: false,
            isFailed: isFailed,
            message: isFailed ? (comp.isFE ? `FE < ${comp.minScore}` : `Điểm <= ${comp.minScore}`) : "Đạt"
        };
    } else {
        // Chế độ nhập chi tiết từng bài con (Option A1 + A3 được chọn)
        let filledCount = 0;
        let sum = 0;
        const missingParts = [];
        
        comp.subValues.forEach((valStr, idx) => {
            if (valStr === "" || valStr === null || valStr === undefined) {
                missingParts.push(idx + 1);
            } else {
                const num = parseFloat(valStr);
                if (!isNaN(num)) {
                    filledCount++;
                    sum += num;
                } else {
                    missingParts.push(idx + 1);
                }
            }
        });

        if (filledCount < comp.parts) {
            // Còn thiếu bài con
            return {
                value: filledCount > 0 ? (sum / filledCount) : null,
                isFilled: false,
                isMissing: true,
                missingParts: missingParts,
                isFailed: false,
                message: `Thiếu ${comp.parts - filledCount}/${comp.parts} bài con`
            };
        }

        const avg = sum / comp.parts;
        // Option A3: Xét trên điểm trung bình của nhóm thành phần đó > 0
        const isFailed = comp.isFE ? (avg < comp.minScore) : (avg <= comp.minScore);
        return {
            value: avg,
            isFilled: true,
            isMissing: false,
            missingParts: [],
            isFailed: isFailed,
            message: isFailed ? (comp.isFE ? `FE < ${comp.minScore}` : `Điểm TB <= ${comp.minScore}`) : "Đạt"
        };
    }
}

/**
 * Tính điểm tổng kết của một môn học
 * Trả về: {
 *   finalScore: number|null,
 *   roundedScore: string,
 *   isComplete: boolean,
 *   missingComponents: string[],
 *   isPass: boolean,
 *   statusText: string,
 *   failReason: string
 * }
 */
function calculateSubjectScore(subject) {
    // Môn điều kiện chỉ xét Pass/Fail (LAB211, PEN, OTP101...)
    if (subject.isPassFailOnly) {
        const isPass = subject.passStatus === "pass";
        return {
            finalScore: null,
            roundedScore: isPass ? "PASS" : "NOT PASS",
            isComplete: true,
            missingComponents: [],
            isPass: isPass,
            statusText: isPass ? "ĐẠT (PASS)" : "CHƯA ĐẠT (NOT PASS)",
            failReason: isPass ? "" : "Môn điều kiện chưa hoàn thành"
        };
    }

    // Môn có các đầu điểm thành phần
    const compResults = subject.components.map(comp => ({
        comp: comp,
        result: calculateComponentScore(comp)
    }));

    const missingComps = compResults.filter(cr => cr.result.isMissing);
    const failedCriteriaComps = compResults.filter(cr => cr.result.isFilled && cr.result.isFailed);

    let weightedSum = 0;
    let totalWeight = 0;
    let filledWeight = 0;

    compResults.forEach(cr => {
        totalWeight += cr.comp.weight;
        if (cr.result.value !== null) {
            weightedSum += cr.result.value * (cr.comp.weight / 100);
            filledWeight += cr.comp.weight;
        }
    });

    const isComplete = missingComps.length === 0;
    
    // Nếu chưa điền đủ điểm
    if (!isComplete) {
        // Điểm tạm thời (nếu có)
        const tempScore = filledWeight > 0 ? (weightedSum * (100 / filledWeight)) : null;
        return {
            finalScore: weightedSum,
            roundedScore: weightedSum > 0 ? weightedSum.toFixed(1) : "-",
            isComplete: false,
            missingComponents: missingComps.map(mc => mc.comp.name),
            isPass: false,
            statusText: "Đang nhập dở",
            failReason: `Còn thiếu: ${missingComps.map(mc => mc.comp.name).join(", ")}`
        };
    }

    // Đã điền đầy đủ điểm:
    // Option A2: Điểm tổng kết môn làm tròn 1 chữ số thập phân
    const roundedScoreNum = Math.round(weightedSum * 10) / 10;
    const roundedScoreStr = roundedScoreNum.toFixed(1);

    // Kiểm tra điều kiện Qua môn:
    // 1. Không bị liệt điểm thành phần (Quá trình > 0, FE >= 4.0 hoặc >= 5.0 đối với Vovinam)
    // 2. Điểm tổng kết môn >= minAvgToPass (5.0)
    if (failedCriteriaComps.length > 0) {
        const reasons = failedCriteriaComps.map(fc => {
            if (fc.comp.isFE) {
                return `Liệt ${fc.comp.name} (< ${fc.comp.minScore})`;
            }
            return `Liệt ${fc.comp.name} (<= ${fc.comp.minScore})`;
        });
        return {
            finalScore: roundedScoreNum,
            roundedScore: roundedScoreStr,
            isComplete: true,
            missingComponents: [],
            isPass: false,
            statusText: "NOT PASS",
            failReason: reasons.join("; ")
        };
    }

    if (roundedScoreNum < (subject.minAvgToPass || 5.0)) {
        return {
            finalScore: roundedScoreNum,
            roundedScore: roundedScoreStr,
            isComplete: true,
            missingComponents: [],
            isPass: false,
            statusText: "NOT PASS",
            failReason: `Điểm tổng kết < ${subject.minAvgToPass || 5.0}`
        };
    }

    return {
        finalScore: roundedScoreNum,
        roundedScore: roundedScoreStr,
        isComplete: true,
        missingComponents: [],
        isPass: true,
        statusText: "PASS",
        failReason: ""
    };
}

/**
 * Tự động phát hiện số thứ tự học kỳ (0-9) dựa trên môn học hoặc tham số truyền vào
 */
function detectSemesterNum(subjects, explicitSemester) {
    if (explicitSemester !== undefined && explicitSemester !== null) {
        return Number(explicitSemester);
    }
    if (Array.isArray(subjects) && subjects.length > 0) {
        if (subjects.some(s => s && s.code === 'OJT202')) return 6;
        if (subjects.some(s => s && (s.code === 'SEP490' || s.code === 'SET490' || s.code === 'EXE402' || s.code === 'PIT490' || s.code === 'GRC490' || s.code === 'SE_GRA_ELE' || s.code === 'HCM202' || s.code === 'VNR202'))) return 9;
        if (subjects.some(s => s && (s.code === 'PRM393' || s.code === 'ITE302c' || s.code === 'EXE201' || s.code === 'MLN122'))) return 8;
    }
    if (typeof AppState !== 'undefined' && AppState.currentSemester !== undefined && AppState.currentSemester !== null) {
        return Number(AppState.currentSemester);
    }
    return 1;
}

/**
 * Tính Điểm Trung Bình Môn Học Kỳ (TBM Kỳ) & Dự đoán danh hiệu
 * F08: Kỳ 6 (OJT) loại bỏ OJT202 khỏi TBM, tính từ môn có điểm (ENW493c), ẩn Cóc Vàng & Top 100
 * F09: Kỳ 8 & 9 tính TBM unweighted bình thường, ẩn Cóc Vàng & Top 100
 * F10: TBM unweighted arithmetic mean làm tròn đúng 2 chữ số thập phân
 * F12: Trượt bất kỳ môn điều kiện nào (VOV, LAB211, PEN, OTP101, OJT202) -> Chưa Đạt, khóa toàn bộ danh hiệu
 */
function calculateSemesterResults(subjects, semesterNum) {
    if (!Array.isArray(subjects)) {
        subjects = [];
    }

    const semNum = detectSemesterNum(subjects, semesterNum);
    const isSpecialSemester = (semNum === 6 || semNum === 8 || semNum === 9);

    const scoredSubs = subjects.filter(s => s && s.isScored);
    const nonScoredSubs = subjects.filter(s => s && !s.isScored);

    let completedScoredCount = 0;
    let sumScored = 0;
    let hasFailedScored = false;
    let hasFailedNonScored = false;
    let failedSubjectCodes = [];
    let incompleteSubjectCodes = [];

    scoredSubs.forEach(s => {
        const res = calculateSubjectScore(s);
        if (res.isComplete) {
            completedScoredCount++;
            sumScored += res.finalScore;
            if (!res.isPass) {
                hasFailedScored = true;
                failedSubjectCodes.push(s.code);
            }
        } else {
            incompleteSubjectCodes.push(s.code);
        }
    });

    nonScoredSubs.forEach(s => {
        const res = calculateSubjectScore(s);
        if (res.isComplete && !res.isPass) {
            hasFailedNonScored = true;
            failedSubjectCodes.push(s.code);
        }
    });

    const isAllScoredComplete = scoredSubs.length === 0 ? true : (completedScoredCount === scoredSubs.length);
    
    // TBM Kỳ = Trung bình cộng đơn thuần của các môn có tính điểm (unweighted arithmetic mean)
    let tbm = null;
    let tbmStr = "-";
    if (scoredSubs.length === 0) {
        // F08: Nếu không có môn tính điểm nào (chỉ có OJT hoặc toàn môn điều kiện)
        tbm = "N/A";
        tbmStr = "N/A";
    } else if (completedScoredCount > 0) {
        const rawTbm = sumScored / completedScoredCount;
        // F10: TBM kỳ làm tròn 2 chữ số thập phân
        const roundedTbm = Math.round(rawTbm * 100) / 100;
        tbm = roundedTbm;
        tbmStr = roundedTbm.toFixed(2);
    }

    // Xếp loại danh hiệu
    let honor = {
        title: "Chưa đủ dữ liệu",
        badgeClass: "bg-slate-100 text-slate-700 border-slate-300",
        description: "Hãy nhập đủ điểm các môn để dự đoán xếp loại danh hiệu.",
        level: "none",
        isCocVang: false,
        isTop100: false
    };

    const isFailedAny = hasFailedScored || hasFailedNonScored;

    // F12: Nếu Not Pass môn điều kiện (Vovinam, Lab, OJT202, PEN, OTP) hoặc môn tính điểm -> Khóa toàn bộ danh hiệu
    if (isFailedAny) {
        honor = {
            title: "Chưa đạt (Not Pass)",
            badgeClass: "bg-red-50 text-red-700 border-red-300",
            description: `Có môn không đạt (${failedSubjectCodes.join(", ")}). Quy chế FPTU yêu cầu Pass toàn bộ môn trong kỳ mới được xét danh hiệu.`,
            level: "fail",
            isCocVang: false,
            isTop100: false
        };
    } else if (scoredSubs.length === 0 && nonScoredSubs.length > 0) {
        // Chỉ có môn điều kiện (như chỉ học OJT202) và đã Đạt toàn bộ
        honor = {
            title: "Đạt (Pass)",
            badgeClass: "bg-emerald-50 text-emerald-700 border-emerald-300",
            description: "Hoàn thành học kỳ ở mức Đạt chuẩn.",
            level: "pass",
            isCocVang: false,
            isTop100: false
        };
    } else if (typeof tbm === 'number') {
        if (tbm < 5.0) {
            honor = {
                title: "Chưa đạt (TBM < 5.0)",
                badgeClass: "bg-red-50 text-red-700 border-red-300",
                description: "Điểm trung bình kỳ chưa đạt chuẩn tối thiểu 5.0.",
                level: "fail",
                isCocVang: false,
                isTop100: false
            };
        } else if (tbm < 7.0) {
            honor = {
                title: "Đạt (Pass)",
                badgeClass: "bg-emerald-50 text-emerald-700 border-emerald-300",
                description: "Hoàn thành học kỳ ở mức Đạt chuẩn.",
                level: "pass",
                isCocVang: false,
                isTop100: false
            };
        } else if (tbm < 8.0) {
            honor = {
                title: "Sinh viên Khá",
                badgeClass: "bg-blue-50 text-blue-700 border-blue-300",
                description: "Học lực Khá trong học kỳ.",
                level: "kha",
                isCocVang: false,
                isTop100: false
            };
        } else if (tbm < 9.0) {
            honor = {
                title: "Sinh viên Giỏi",
                badgeClass: "bg-orange-50 text-orange-700 border-orange-300 font-bold",
                description: "Thành tích học tập Giỏi! Rất đáng khen ngợi.",
                level: "gioi",
                isCocVang: false,
                isTop100: false
            };
        } else if (tbm < 9.2 || isSpecialSemester) {
            // F08 & F09: Kỳ 6, 8, 9 tối đa dừng ở Sinh viên Xuất Sắc, ẩn tuyệt đối Cóc Vàng & Top 100
            honor = {
                title: "Sinh viên Xuất Sắc",
                badgeClass: "bg-amber-50 text-amber-700 border-amber-400 font-bold",
                description: "Danh hiệu Sinh viên Xuất sắc FPTU!",
                level: "xuatsac",
                isCocVang: false,
                isTop100: false
            };
        } else if (tbm < 9.6) {
            // Chỉ áp dụng cho các kỳ chuẩn 0-5, 7
            honor = {
                title: "Sinh viên Xuất Sắc",
                badgeClass: "bg-amber-100 text-amber-800 border-amber-500 font-extrabold",
                highlightBadge: "🌟 Có khả năng lọt Top 100 Sinh viên Xuất sắc!",
                description: "Điểm TBM rất cao! Có tiềm năng lớn nằm trong Top 100 SV tiêu biểu toàn trường.",
                level: "top100",
                isCocVang: false,
                isTop100: true
            };
        } else {
            // >= 9.6: Cóc Vàng (Chỉ áp dụng cho các kỳ chuẩn 0-5, 7)
            honor = {
                title: "Sinh viên Xuất Sắc",
                badgeClass: "shimmer-badge text-amber-950 border-amber-500 font-extrabold shadow-md",
                highlightBadge: "🐸🏆 Có khả năng đạt CÓC VÀNG!",
                description: "Điểm số kỷ lục! Bạn đang là ứng cử viên sáng giá cho danh hiệu Thủ khoa Học kỳ (Cóc Vàng FPTU)!",
                level: "cocvang",
                isCocVang: true,
                isTop100: true
            };
        }
    }

    const isFailStatus = isFailedAny || (typeof tbm === 'number' && tbm < 5.0);
    const statusText = isFailStatus ? "Chưa Đạt (Not Pass)" : ((isAllScoredComplete || scoredSubs.length === 0) ? "Đạt (Pass)" : "Đang học");

    return {
        tbm: tbm,
        tbmStr: tbmStr,
        status: statusText,
        isPassed: !isFailStatus,
        completedScoredCount: completedScoredCount,
        totalScoredCount: scoredSubs.length,
        isAllScoredComplete: isAllScoredComplete,
        hasFailedScored: hasFailedScored,
        hasFailedNonScored: hasFailedNonScored,
        failedSubjectCodes: failedSubjectCodes,
        incompleteSubjectCodes: incompleteSubjectCodes,
        honor: honor
    };
}

// ================================================================
// RENDERING & UI CONTROLLER
// ================================================================

function renderApp() {
    renderSemesterTabs();
    renderSubjectsList();
    updateSummaryDashboard();
}

// Render thanh Tab chọn học kỳ (Kỳ 0 -> Kỳ 9)
function renderSemesterTabs() {
    const tabsContainer = document.getElementById("semester-tabs");
    if (!tabsContainer) return;

    tabsContainer.innerHTML = "";
    CURRICULUM_SEMESTERS.forEach(sem => {
        const isActive = sem.semester === AppState.currentSemester;
        const subjects = AppState.semesterData[sem.semester] || [];
        const res = calculateSemesterResults(subjects, sem.semester);

        const tabBtn = document.createElement("button");
        tabBtn.type = "button";
        tabBtn.className = `flex-shrink-0 px-4 py-2.5 rounded-xl font-medium text-sm transition-all flex items-center gap-2 border ${
            isActive
                ? "sem-tab-active border-blue-600 shadow-md scale-105"
                : "bg-white text-slate-600 border-slate-200 hover:border-blue-300 hover:text-fptBlue hover:bg-blue-50/50"
        }`;
        
        let statusDot = "";
        if (res.completedScoredCount > 0 || res.tbm === "N/A") {
            statusDot = res.isAllScoredComplete
                ? `<span class="w-2 h-2 rounded-full bg-emerald-400"></span>`
                : `<span class="w-2 h-2 rounded-full bg-amber-400 animate-pulse"></span>`;
        }

        tabBtn.innerHTML = `
            <span>Kỳ ${sem.semester}</span>
            ${statusDot}
        `;
        tabBtn.onclick = () => {
            AppState.currentSemester = sem.semester;
            AppState.hasCelebratedCocVang = false;
            renderApp();
        };
        tabsContainer.appendChild(tabBtn);
    });
}

// Render danh sách các môn học trong học kỳ đang chọn
function renderSubjectsList() {
    const container = document.getElementById("subjects-container");
    const semInfoElem = document.getElementById("semester-info");
    if (!container) return;

    const currentSemDef = CURRICULUM_SEMESTERS.find(s => s.semester === AppState.currentSemester);
    if (semInfoElem && currentSemDef) {
        let comboBannerHtml = "";
        if (currentSemDef.isComboSemester && typeof COMBO_TRACKS !== 'undefined') {
            const activeTrack = typeof getComboTrack === 'function' ? getComboTrack(AppState.selectedComboTrack) : (COMBO_TRACKS[AppState.selectedComboTrack] || COMBO_TRACKS.dotnet);
            const activeTrackCourses = (activeTrack && activeTrack.courses && activeTrack.courses[currentSemDef.semester]) ? activeTrack.courses[currentSemDef.semester].join(", ") : "";
            
            const trackOptions = [
                { id: "dotnet", label: ".NET (Cross-Platform .NET)" },
                { id: "react", label: "Web Fullstack (React / NodeJS)" },
                { id: "ai", label: "Trí tuệ nhân tạo (AI)" },
                { id: "java", label: "Java chuyên sâu (Intensive Java)" },
                { id: "game", label: "Phát triển Game (Game Dev)" },
                { id: "datascience", label: "Khoa học dữ liệu ứng dụng (Data Science)" },
                { id: "icdesign", label: "Thiết kế vi mạch (IC Design)" },
                { id: "japanese", label: "Kỹ sư cầu nối Nhật Bản (JS / BrSE)" }
            ].map(t => `<option value="${t.id}" ${t.id === AppState.selectedComboTrack ? "selected" : ""}>${t.label}</option>`).join("");

            comboBannerHtml = `
                <div class="mt-4 p-4 rounded-xl bg-gradient-to-r from-blue-50 via-sky-50 to-indigo-50 border border-blue-200/90 shadow-xs">
                    <div class="flex flex-col md:flex-row md:items-center justify-between gap-3">
                        <div class="flex items-center gap-3">
                            <div class="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center font-black flex-shrink-0 shadow-sm">
                                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"/></svg>
                            </div>
                            <div>
                                <div class="flex items-center gap-2">
                                    <span class="text-xs font-black uppercase tracking-wider text-blue-900">CHUYÊN NGÀNH HẸP (COMBO TRACK)</span>
                                    <span class="px-2 py-0.5 text-[10px] font-bold rounded-full bg-blue-200/80 text-blue-900">Môn học kỳ ${currentSemDef.semester}: ${activeTrackCourses}</span>
                                </div>
                                <p class="text-xs text-blue-700 mt-0.5 font-medium">${activeTrack ? (activeTrack.nameVi + ' — ' + activeTrack.description) : ''}</p>
                            </div>
                        </div>
                        <div class="flex items-center gap-2">
                            <label for="combo-track-select" class="text-xs font-bold text-slate-700 whitespace-nowrap hidden sm:inline">Chọn Track:</label>
                            <select 
                                id="combo-track-select" 
                                onchange="setComboTrack(this.value)" 
                                class="px-3.5 py-2 text-xs font-bold text-blue-900 bg-white border border-blue-300 rounded-xl shadow-xs focus:ring-2 focus:ring-blue-400 focus:border-blue-500 cursor-pointer min-w-[220px]"
                            >
                                ${trackOptions}
                            </select>
                        </div>
                    </div>
                </div>
            `;
        } else if (currentSemDef.isGraduationSemester && typeof GRADUATION_ELECTIVES !== 'undefined') {
            const activeCapstone = GRADUATION_ELECTIVES.find(g => g.code === AppState.selectedCapstoneElective) || GRADUATION_ELECTIVES[0];
            const capstoneOptions = GRADUATION_ELECTIVES.map(g => 
                `<option value="${g.code}" ${g.code === AppState.selectedCapstoneElective ? "selected" : ""}>${g.code} - ${g.nameVi}</option>`
            ).join("");

            comboBannerHtml = `
                <div class="mt-4 p-4 rounded-xl bg-gradient-to-r from-amber-50 via-orange-50 to-yellow-50 border border-amber-300 shadow-xs">
                    <div class="flex flex-col md:flex-row md:items-center justify-between gap-3">
                        <div class="flex items-center gap-3">
                            <div class="w-10 h-10 rounded-xl bg-amber-600 text-white flex items-center justify-center font-black flex-shrink-0 shadow-sm">
                                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 14l9-5-9-5-9 5 9 5z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z"/></svg>
                            </div>
                            <div>
                                <div class="flex items-center gap-2">
                                    <span class="text-xs font-black uppercase tracking-wider text-amber-900">ĐỒ ÁN / KHÓA LUẬN TỐT NGHIỆP</span>
                                    <span class="px-2 py-0.5 text-[10px] font-bold rounded-full bg-amber-200/80 text-amber-900">${activeCapstone.credits} Tín chỉ</span>
                                </div>
                                <p class="text-xs text-amber-800 mt-0.5 font-medium">${activeCapstone.description || activeCapstone.nameVi}</p>
                            </div>
                        </div>
                        <div class="flex items-center gap-2">
                            <label for="capstone-elective-select" class="text-xs font-bold text-slate-700 whitespace-nowrap hidden sm:inline">Chọn đồ án:</label>
                            <select 
                                id="capstone-elective-select" 
                                onchange="setCapstoneElective(this.value)" 
                                class="px-3.5 py-2 text-xs font-bold text-amber-950 bg-white border border-amber-300 rounded-xl shadow-xs focus:ring-2 focus:ring-amber-400 focus:border-amber-500 cursor-pointer min-w-[220px]"
                            >
                                ${capstoneOptions}
                            </select>
                        </div>
                    </div>
                </div>
            `;
        }

        semInfoElem.innerHTML = `
            <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                    <h2 class="text-xl sm:text-2xl font-bold text-slate-800 flex items-center gap-2">
                        <span class="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-blue-50 text-fptBlue border border-blue-200 font-black text-sm">
                            ${currentSemDef.semester}
                        </span>
                        ${currentSemDef.title}
                    </h2>
                    <p class="text-xs sm:text-sm text-slate-500 mt-1">${currentSemDef.description}</p>
                </div>
                <div class="flex items-center gap-2">
                    <button type="button" onclick="fillSampleScoresForCurrentSemester()" class="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 transition-colors">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>
                        Điền điểm mẫu thử
                    </button>
                    <button type="button" onclick="clearCurrentSemesterScores()" class="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200 border border-slate-200 transition-colors">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg>
                        Xóa trắng kỳ này
                    </button>
                </div>
            </div>
            ${comboBannerHtml}
        `;
    }

    const subjects = AppState.semesterData[AppState.currentSemester] || [];
    container.innerHTML = "";

    if (subjects.length === 0) {
        container.innerHTML = `
            <div class="text-center py-12 bg-white rounded-2xl border border-dashed border-slate-300 p-8">
                <p class="text-slate-500">Chưa có môn học nào trong kỳ này.</p>
                <button onclick="openAddCustomSubjectModal()" class="mt-4 px-4 py-2 bg-fptBlue text-white text-sm font-semibold rounded-xl hover:bg-blue-700 transition">
                    + Thêm môn học
                </button>
            </div>
        `;
        return;
    }

    subjects.forEach((subject, subIndex) => {
        const subCard = renderSubjectCard(subject, subIndex);
        container.appendChild(subCard);
    });

    // Nút thêm môn học vượt / tự chọn ở cuối danh sách
    const addSubjectBtnCard = document.createElement("div");
    addSubjectBtnCard.className = "mt-6 p-4 rounded-2xl border-2 border-dashed border-slate-300 hover:border-blue-400 bg-white/60 hover:bg-blue-50/30 transition-all text-center";
    addSubjectBtnCard.innerHTML = `
        <button type="button" onclick="openAddCustomSubjectModal()" class="inline-flex items-center gap-2 text-sm font-bold text-fptBlue hover:text-blue-700 py-1 px-4">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"/></svg>
            Thêm môn tự chọn / Môn học vượt vào kỳ ${AppState.currentSemester}
        </button>
    `;
    container.appendChild(addSubjectBtnCard);
}

// Render Card của từng môn học
function renderSubjectCard(subject, subIndex) {
    const card = document.createElement("div");
    card.className = "bg-white rounded-2xl p-5 sm:p-6 border border-slate-200/90 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden mb-5";
    
    const subResult = calculateSubjectScore(subject);

    // Header của môn: Mã môn, Tên tiếng Việt, Tín chỉ, Badge loại môn
    let typeBadge = "";
    if (subject.isScored) {
        typeBadge = `<span class="px-2.5 py-1 text-xs font-semibold rounded-full bg-blue-50 text-blue-700 border border-blue-200">Tính vào TBM kỳ</span>`;
    } else if (subject.isPhysicalEducation) {
        typeBadge = `<span class="px-2.5 py-1 text-xs font-semibold rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">Giáo dục thể chất (Không tính TBM)</span>`;
    } else {
        typeBadge = `<span class="px-2.5 py-1 text-xs font-semibold rounded-full bg-slate-100 text-slate-600 border border-slate-200">Môn điều kiện (Không tính TBM)</span>`;
    }

    let syllabusBadge = "";
    if (subject.hasDetailedSyllabus) {
        syllabusBadge = `<span class="inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-bold rounded-md bg-amber-50 text-amber-700 border border-amber-300" title="Cấu trúc điểm chuẩn 100% từ file Syllabus">
            <svg class="w-3 h-3 text-amber-500" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/></svg>
            Syllabus chuẩn
        </span>`;
    }

    // Badge trạng thái môn (Pass, Not Pass, Đang điền dở)
    let statusBadge = "";
    if (subject.isPassFailOnly) {
        const isPass = subject.passStatus === "pass";
        statusBadge = `
            <div class="flex items-center gap-2">
                <button type="button" onclick="togglePassFailSubject('${subject.id}', 'pass')" class="px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                    isPass ? "bg-emerald-600 text-white shadow-sm" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }">PASS (Đạt)</button>
                <button type="button" onclick="togglePassFailSubject('${subject.id}', 'not_pass')" class="px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                    !isPass ? "bg-red-600 text-white shadow-sm" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }">NOT PASS</button>
            </div>
        `;
    } else {
        if (!subResult.isComplete) {
            statusBadge = `
                <span class="px-3 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-600 border border-slate-200">
                    Đang nhập
                </span>
            `;
        } else if (subResult.isPass) {
            statusBadge = `
                <span class="px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1.5">
                    <span class="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                    Đạt • ${subResult.roundedScore}
                </span>
            `;
        } else {
            statusBadge = `
                <span class="px-3 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200 flex items-center gap-1.5" title="${subResult.failReason}">
                    <span class="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
                    Chưa đạt • ${subResult.roundedScore}
                </span>
            `;
        }
    }

    // Build phần Components nhập điểm
    let componentsHtml = "";
    if (subject.isPassFailOnly) {
        componentsHtml = `
            <div class="mt-4 p-4 rounded-xl bg-slate-50 border border-slate-200 text-sm text-slate-600">
                <p class="font-medium text-slate-700">${subject.note || "Môn học điều kiện thực hành/dự bị, chỉ đánh giá kết quả Pass hoặc Not Pass theo quy chế giảng viên."}</p>
                <p class="text-xs text-slate-500 mt-1">💡 Môn này không lấy điểm trung bình, nhưng nếu Not Pass sẽ không được xét danh hiệu sinh viên Khá/Giỏi/Xuất sắc trong kỳ.</p>
            </div>
        `;
    } else {
        componentsHtml = `
            <div class="mt-4 space-y-3">
                <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    ${subject.components.map((comp, compIndex) => renderComponentField(subject, comp, compIndex)).join("")}
                </div>
            </div>
        `;
    }

    card.innerHTML = `
        <div class="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 gap-3">
            <div class="flex items-start gap-3">
                <div class="w-10 h-10 rounded-xl bg-blue-50 text-fptBlue flex items-center justify-center border border-blue-200/80 flex-shrink-0 shadow-xs">
                    <svg class="w-5 h-5 text-fptBlue" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"/>
                    </svg>
                </div>
                <div>
                    <div class="flex flex-wrap items-center gap-2">
                        <h3 class="text-base sm:text-lg font-bold text-slate-900">${subject.code}</h3>
                        ${syllabusBadge}
                        ${typeBadge}
                        
                    </div>
                    <p class="text-xs sm:text-sm font-medium text-slate-600 mt-0.5">${subject.nameVi} <span class="text-slate-400 font-normal italic">(${subject.nameEn})</span></p>
                </div>
            </div>
            <div class="flex items-center gap-3 self-end sm:self-center">
                ${statusBadge}
                <div class="relative dropdown-sub-menu">
                    <button type="button" onclick="toggleSubjectActionMenu('${subject.id}')" class="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition" title="Tùy chọn môn">
                        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z"/></svg>
                    </button>
                    <div id="action-menu-${subject.id}" class="hidden absolute right-0 mt-1 w-48 bg-white rounded-xl shadow-lg border border-slate-200 py-1.5 z-20 text-xs">
                        ${!subject.isPassFailOnly ? `
                            <button type="button" onclick="openEditSubjectSchemaModal('${subject.id}')" class="w-full text-left px-3 py-2 text-blue-700 font-semibold hover:bg-blue-50 flex items-center gap-2">
                                <svg class="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
                                Sửa cấu trúc điểm & số cột
                            </button>
                            <button type="button" onclick="openEditTemplateModal('${subject.id}')" class="w-full text-left px-3 py-2 text-slate-700 hover:bg-slate-50 flex items-center gap-2">
                                <svg class="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>
                                Đổi cấu trúc điểm (Template)
                            </button>
                            <button type="button" onclick="addComponentToSubject('${subject.id}')" class="w-full text-left px-3 py-2 text-slate-700 hover:bg-slate-50 flex items-center gap-2">
                                <svg class="w-4 h-4 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"/></svg>
                                Thêm cột điểm mới
                            </button>
                        ` : ''}
                        <button type="button" onclick="deleteSubject('${subject.id}')" class="w-full text-left px-3 py-2 text-red-600 hover:bg-red-50 flex items-center gap-2 border-t border-slate-100">
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                            Ẩn / Xóa môn này khỏi kỳ
                        </button>
                    </div>
                </div>
            </div>
        </div>
        ${componentsHtml}
    `;
    return card;
}

// Render từng ô nhập điểm thành phần
function renderComponentField(subject, comp, compIndex) {
    const compRes = calculateComponentScore(comp);
    const isFE = comp.isFE;
    const isMultiPart = comp.parts > 1;
    const isDetailedMode = comp.mode === "detailed" && isMultiPart;

    let criteriaText = comp.isFE ? `≥ ${comp.minScore}` : `> ${comp.minScore}`;
    let criteriaClass = compRes.isFilled && compRes.isFailed ? "text-red-600 font-bold" : "text-slate-400";

    // Mode Switch Button (Chuyển giữa Nhập chi tiết và Nhập gộp)
    let modeToggleBtn = "";
    if (isMultiPart) {
        modeToggleBtn = `
            <button type="button" onclick="toggleComponentMode('${subject.id}', '${comp.id}')" class="text-[10px] font-semibold text-blue-600 hover:text-blue-800 underline ml-auto" title="Chuyển chế độ nhập">
                ${isDetailedMode ? "Nhập gộp 1 điểm TB" : "Chia nhỏ từng bài"}
            </button>
        `;
    }

    let inputFieldsHtml = "";
    if (isDetailedMode) {
        // Nhập từng bài con: PT 1, PT 2, Lab 1, Lab 2...
        inputFieldsHtml = `
            <div class="grid grid-cols-${Math.min(comp.parts, 5)} gap-1.5 mt-2">
                ${comp.subValues.map((val, partIdx) => {
                    const isBlank = val === "" || val === null || val === undefined;
                    return `
                        <div class="text-center">
                            <input 
                                type="text" 
                                inputmode="decimal" 
                                placeholder="${partIdx + 1}"
                                value="${val !== null && val !== undefined ? val : ""}"
                                oninput="handleSubPartInput('${subject.id}', '${comp.id}', ${partIdx}, this.value)"
                                class="score-input w-full text-center py-1.5 px-1 text-xs font-bold rounded-lg border ${
                                    isBlank ? "input-missing" : "border-slate-300 bg-white"
                                } focus:ring-2 focus:ring-blue-100"
                                title="${comp.name} - Bài ${partIdx + 1}"
                            />
                            <span class="text-[9px] text-slate-400 font-medium block mt-0.5">B.${partIdx + 1}</span>
                        </div>
                    `;
                }).join("")}
            </div>
            <div id="comp-avg-${subject.id}-${comp.id}" class="flex items-center justify-between text-[11px] mt-1 pt-1 border-t border-slate-100">
                <span class="text-slate-500">Điểm TB nhóm:</span>
                <span class="font-bold ${compRes.isFilled ? (compRes.isFailed ? "text-red-600" : "text-slate-800") : "text-amber-600"}">
                    ${compRes.value !== null ? compRes.value.toFixed(1) : (compRes.isMissing ? "Chưa xong" : "-")}
                </span>
            </div>
        `;
    } else {
        // Nhập 1 điểm gộp duy nhất
        const curVal = isMultiPart ? comp.avgValue : comp.subValues[0];
        const isBlank = curVal === "" || curVal === null || curVal === undefined;
        inputFieldsHtml = `
            <div class="mt-2 flex items-center gap-2">
                <div class="relative flex-1">
                    <input 
                        type="number" 
                        step="0.1" 
                        min="0" 
                        max="10" 
                        placeholder="Điểm (0 - 10)"
                        value="${curVal !== null && curVal !== undefined ? curVal : ""}"
                        oninput="handleSingleCompInput('${subject.id}', '${comp.id}', this.value)"
                        class="score-input w-full text-sm font-bold text-slate-800 py-1.5 px-3 rounded-lg border ${
                            isBlank ? "input-missing" : "border-slate-300 bg-white"
                        } focus:ring-2 focus:ring-blue-100"
                    />
                </div>
            </div>
        `;
    }

    return `
        <div class="p-3 rounded-xl border ${
            compRes.isMissing ? "border-slate-200 bg-white" : (compRes.isFailed ? "border-red-200 bg-red-50/20" : "border-slate-200 bg-slate-50/50")
        } transition-all">
            <div class="flex items-center justify-between gap-1 text-xs">
                <span class="font-bold text-slate-800 truncate" title="${comp.name}">${comp.name}</span>
                <span class="font-black px-1.5 py-0.5 rounded text-[11px] ${
                    isFE ? "bg-orange-100 text-orange-700" : "bg-blue-100 text-blue-700"
                }">${comp.weight}%</span>
            </div>
            <div class="flex items-center justify-between text-[11px] mt-0.5">
                <span class="${criteriaClass}">Đ/kiện: ${criteriaText}</span>
                ${modeToggleBtn}
            </div>
            ${inputFieldsHtml}
        </div>
    `;
}

// Cập nhật bảng tổng kết học kỳ (Summary Dashboard)
function updateSummaryDashboard() {
    const subjects = AppState.semesterData[AppState.currentSemester] || [];
    const res = calculateSemesterResults(subjects, AppState.currentSemester);

    const tbmElem = document.getElementById("summary-tbm");
    const progressElem = document.getElementById("summary-progress");
    const honorBadgeElem = document.getElementById("summary-honor-badge");
    const honorDescElem = document.getElementById("summary-honor-desc");
    const highlightContainer = document.getElementById("summary-highlight-container");
    const progressBarElem = document.getElementById("summary-progress-bar");

    if (tbmElem) {
        tbmElem.innerText = res.tbmStr;
        if (typeof res.tbm === 'number') {
            if (res.tbm >= 9.0) tbmElem.className = "text-4xl sm:text-5xl font-black text-amber-500 tracking-tight";
            else if (res.tbm >= 8.0) tbmElem.className = "text-4xl sm:text-5xl font-black text-orange-500 tracking-tight";
            else if (res.tbm >= 7.0) tbmElem.className = "text-4xl sm:text-5xl font-black text-blue-600 tracking-tight";
            else if (res.tbm >= 5.0) tbmElem.className = "text-4xl sm:text-5xl font-black text-emerald-600 tracking-tight";
            else tbmElem.className = "text-4xl sm:text-5xl font-black text-red-500 tracking-tight";
        } else if (res.tbm === "N/A") {
            tbmElem.className = "text-4xl sm:text-5xl font-black text-emerald-600 tracking-tight";
        } else {
            tbmElem.className = "text-4xl sm:text-5xl font-black text-slate-400 tracking-tight";
        }
    }

    if (progressElem) {
        if (res.totalScoredCount === 0) {
            progressElem.innerText = `Môn điều kiện`;
        } else {
            progressElem.innerText = `${res.completedScoredCount}/${res.totalScoredCount} môn`;
        }
    }

    if (progressBarElem) {
        const percent = res.totalScoredCount > 0 
            ? (res.completedScoredCount / res.totalScoredCount) * 100 
            : 100;
        progressBarElem.style.width = `${percent}%`;
    }

    if (honorBadgeElem) {
        honorBadgeElem.innerText = res.honor.title;
        honorBadgeElem.className = `inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs sm:text-sm font-extrabold border ${res.honor.badgeClass}`;
    }

    if (honorDescElem) {
        honorDescElem.innerText = res.honor.description;
    }

    if (highlightContainer) {
        if (res.honor.highlightBadge) {
            highlightContainer.innerHTML = `
                <div class="mt-3 p-3 rounded-xl bg-gradient-to-r from-amber-400/20 via-yellow-400/30 to-amber-400/20 border border-amber-300 text-amber-900 text-xs sm:text-sm font-bold flex items-center gap-2 shadow-sm">
                    <span>${res.honor.highlightBadge}</span>
                </div>
            `;
            // Kích hoạt pháo hoa chúc mừng nếu đạt Cóc Vàng hoặc Top 100 và chưa nổ lần này
            if (res.honor.isCocVang && !AppState.hasCelebratedCocVang) {
                triggerFireworks();
                AppState.hasCelebratedCocVang = true;
            }
        } else {
            highlightContainer.innerHTML = "";
        }
    }

    // Cập nhật cảnh báo điền thiếu nếu còn môn dở
    const warningContainer = document.getElementById("semester-missing-warning");
    if (warningContainer) {
        warningContainer.classList.add("hidden");
        warningContainer.innerHTML = "";
    }
}

// ================================================================
// EVENT HANDLERS
// ================================================================

function sanitizeScore(val) {
    if (val === null || val === undefined) return "";
    let s = String(val).trim().replace(',', '.');
    if (s === "") return "";
    if (s.toLowerCase().includes('nan') || s.toLowerCase().includes('undefined') || s.toLowerCase().includes('null')) {
        return "";
    }
    let num = parseFloat(s);
    if (isNaN(num)) return "";
    if (num < 0) return "0";
    if (num > 10) return "10";
    if (s.endsWith('.') && s.indexOf('.') === s.lastIndexOf('.')) {
        return s;
    }
    return s;
}

function updateSubjectCardDOM(subjectId) {
    if (typeof document === 'undefined') return;
    const subjects = AppState.semesterData[AppState.currentSemester] || [];
    const sub = subjects.find(s => s.id === subjectId);
    if (!sub) return;

    const subResult = calculateSubjectScore(sub);
    const statusElem = document.getElementById(`sub-status-${subjectId}`);
    if (statusElem) {
        if (!subResult.isComplete) {
            statusElem.innerHTML = `<span class="px-3 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-600 border border-slate-200">Đang nhập</span>`;
        } else if (subResult.isPass) {
            statusElem.innerHTML = `<span class="px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1.5"><span class="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>Đạt • ${subResult.roundedScore}</span>`;
        } else {
            statusElem.innerHTML = `<span class="px-3 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200 flex items-center gap-1.5" title="${subResult.failReason}"><span class="w-1.5 h-1.5 rounded-full bg-rose-500"></span>Chưa đạt • ${subResult.roundedScore}</span>`;
        }
    }

    if (sub.components) {
        sub.components.forEach(comp => {
            const compAvgElem = document.getElementById(`comp-avg-${subjectId}-${comp.id}`);
            if (compAvgElem && comp.parts > 1 && comp.mode === "detailed") {
                const compRes = calculateComponentScore(comp);
                if (compRes.isFilled) {
                    compAvgElem.innerHTML = `<span class="text-slate-500">Điểm TB nhóm:</span> <span class="font-bold ${compRes.isFailed ? "text-red-600" : "text-slate-800"}">${compRes.value !== null ? compRes.value.toFixed(1) : "-"}</span>`;
                } else {
                    compAvgElem.innerHTML = `<span class="text-slate-500">Điểm TB nhóm:</span> <span class="font-bold text-amber-600">Chưa xong</span>`;
                }
            }
        });
    }
}

function handleSubPartInput(subjectId, compId, partIdx, val) {
    const subjects = AppState.semesterData[AppState.currentSemester] || [];
    const sub = subjects.find(s => s.id === subjectId);
    if (!sub) return;
    const comp = sub.components.find(c => c.id === compId);
    if (!comp) return;

    let cleanVal = sanitizeScore(val);
    comp.subValues[partIdx] = cleanVal;
    
    updateSubjectCardDOM(subjectId);
    updateSummaryDashboard();
}

function handleSingleCompInput(subjectId, compId, val) {
    const subjects = AppState.semesterData[AppState.currentSemester] || [];
    const sub = subjects.find(s => s.id === subjectId);
    if (!sub) return;
    const comp = sub.components.find(c => c.id === compId);
    if (!comp) return;

    let cleanVal = sanitizeScore(val);
    if (comp.parts > 1) {
        comp.avgValue = cleanVal;
    } else {
        comp.subValues[0] = cleanVal;
    }

    updateSubjectCardDOM(subjectId);
    updateSummaryDashboard();
}

function toggleComponentMode(subjectId, compId) {
    const subjects = AppState.semesterData[AppState.currentSemester] || [];
    const sub = subjects.find(s => s.id === subjectId);
    if (!sub) return;
    const comp = sub.components.find(c => c.id === compId);
    if (!comp) return;

    if (comp.mode === "detailed") {
        // Chuyển sang gộp: tính trước điểm TB hiện tại nạp vào avgValue
        let sum = 0, count = 0;
        comp.subValues.forEach(v => {
            if (v !== "" && !isNaN(parseFloat(v))) {
                sum += parseFloat(v);
                count++;
            }
        });
        comp.avgValue = count > 0 ? (sum / count).toFixed(1) : "";
        comp.mode = "average";
    } else {
        // Chuyển sang chi tiết
        comp.mode = "detailed";
    }
    renderApp();
}

function togglePassFailSubject(subjectId, status) {
    const subjects = AppState.semesterData[AppState.currentSemester] || [];
    const sub = subjects.find(s => s.id === subjectId);
    if (!sub) return;
    sub.passStatus = status;
    renderApp();
}

function toggleSubjectActionMenu(subjectId) {
    const menu = document.getElementById(`action-menu-${subjectId}`);
    if (menu) {
        menu.classList.toggle("hidden");
    }
}

// Đóng menu khi click ra ngoài
document.addEventListener("click", (e) => {
    if (!e.target.closest(".dropdown-sub-menu")) {
        document.querySelectorAll("[id^='action-menu-']").forEach(m => m.classList.add("hidden"));
    }
});

function deleteSubject(subjectId) {
    const sem = AppState.currentSemester;
    AppState.semesterData[sem] = AppState.semesterData[sem].filter(s => s.id !== subjectId);
    renderApp();
}

// Điền điểm mẫu thử nghiệm nhanh (Fill Sample)
function fillSampleScoresForCurrentSemester() {
    const subjects = AppState.semesterData[AppState.currentSemester] || [];
    subjects.forEach(sub => {
        if (sub.isPassFailOnly) {
            sub.passStatus = "pass";
            return;
        }
        sub.components.forEach(comp => {
            if (comp.mode === "detailed" && comp.parts > 1) {
                comp.subValues = comp.subValues.map(() => (Math.random() * 2 + 7.5).toFixed(1));
            } else if (comp.parts > 1) {
                comp.avgValue = (Math.random() * 2 + 8.0).toFixed(1);
            } else {
                comp.subValues[0] = (Math.random() * 2 + 7.8).toFixed(1);
            }
        });
    });
    AppState.hasCelebratedCocVang = false;
    renderApp();
}

// Xóa trắng điểm học kỳ hiện tại
function clearCurrentSemesterScores() {
    const subjects = AppState.semesterData[AppState.currentSemester] || [];
    subjects.forEach(sub => {
        if (sub.isPassFailOnly) {
            sub.passStatus = "pass";
            return;
        }
        sub.components.forEach(comp => {
            comp.subValues = Array(comp.parts).fill("");
            comp.avgValue = "";
        });
    });
    AppState.hasCelebratedCocVang = false;
    renderApp();
}

// ================================================================
// TÙY BIẾN MÔN & TEMPLATE
// ================================================================

let currentEditingSubjectId = null;

function openEditTemplateModal(subjectId) {
    currentEditingSubjectId = subjectId;
    const modal = document.getElementById("template-modal");
    if (!modal) return;
    modal.classList.remove("hidden");
    modal.classList.add("flex");
}

function closeEditTemplateModal() {
    const modal = document.getElementById("template-modal");
    if (!modal) return;
    modal.classList.add("hidden");
    modal.classList.remove("flex");
    currentEditingSubjectId = null;
}

function applyTemplateToCurrentSubject(templateKey) {
    if (!currentEditingSubjectId) return;
    const template = COURSE_TEMPLATES[templateKey];
    if (!template) return;

    const subjects = AppState.semesterData[AppState.currentSemester] || [];
    const sub = subjects.find(s => s.id === currentEditingSubjectId);
    if (!sub) return;

    sub.templateId = templateKey;
    sub.minAvgToPass = template.minAvgToPass || 5.0;
    sub.components = template.components.map(c => initComponentState(c));
    
    closeEditTemplateModal();
    renderApp();
}

function addComponentToSubject(subjectId) {
    const subjects = AppState.semesterData[AppState.currentSemester] || [];
    const sub = subjects.find(s => s.id === subjectId);
    if (!sub) return;

    const newCompName = prompt("Nhập tên cột điểm mới (VD: Quiz, Workshop, Assignment 2):", "Cột điểm mới");
    if (!newCompName) return;

    const newCompWeight = parseFloat(prompt("Nhập trọng số % (VD: 10, 20):", "10")) || 10;

    sub.components.push(initComponentState({
        id: 'comp_' + Math.random().toString(36).substr(2, 9),
        name: newCompName,
        weight: newCompWeight,
        minScore: 0,
        parts: 1,
        isSubParts: false,
        isFE: false
    }));

    renderApp();
}

// Modal Thêm Môn Tự Chọn / Môn Học Vượt
function openAddCustomSubjectModal() {
    const modal = document.getElementById("add-subject-modal");
    if (!modal) return;
    modal.classList.remove("hidden");
    modal.classList.add("flex");
}

function closeAddCustomSubjectModal() {
    const modal = document.getElementById("add-subject-modal");
    if (!modal) return;
    modal.classList.add("hidden");
    modal.classList.remove("flex");
}


// ================================================================
// TRÌNH TÙY CHỈNH CẤU TRÚC ĐIỂM & THÊM MÔN HỌC (Component Schema Editor)
// ================================================================
let editingSubjectId = null;
let currentModalComponents = [];

function openAddCustomSubjectModal() {
    editingSubjectId = null;
    const editIdElem = document.getElementById("edit-subject-id");
    if (editIdElem) editIdElem.value = "";
    
    const titleElem = document.getElementById("custom-modal-title");
    if (titleElem) titleElem.innerText = "Thêm Môn Học Mới";
    
    const btnElem = document.getElementById("btn-save-custom-subject");
    if (btnElem) btnElem.innerText = "Lưu Môn Học";

    const codeElem = document.getElementById("new-sub-code");
    if (codeElem) codeElem.value = "";
    
    const nameElem = document.getElementById("new-sub-namevi");
    if (nameElem) nameElem.value = "";
    
    const credElem = document.getElementById("new-sub-credits");
    if (credElem) credElem.value = "3";
    
    const scoreElem = document.getElementById("new-sub-isscored");
    if (scoreElem) scoreElem.checked = true;

    // Load default preset (Lý thuyết)
    loadPresetComponents("theory");

    const modal = document.getElementById("add-subject-modal");
    if (modal) {
        modal.classList.remove("hidden");
        modal.classList.add("flex");
    }
}

function openEditSubjectSchemaModal(subjectId) {
    const subjects = AppState.semesterData[AppState.currentSemester] || [];
    const sub = subjects.find(s => s.id === subjectId);
    if (!sub) return;

    editingSubjectId = subjectId;
    const editIdElem = document.getElementById("edit-subject-id");
    if (editIdElem) editIdElem.value = subjectId;

    const titleElem = document.getElementById("custom-modal-title");
    if (titleElem) titleElem.innerText = `Chỉnh Sửa Cấu Trúc Điểm (${sub.code})`;

    const btnElem = document.getElementById("btn-save-custom-subject");
    if (btnElem) btnElem.innerText = "Cập Nhật Cấu Trúc";

    const codeElem = document.getElementById("new-sub-code");
    if (codeElem) codeElem.value = sub.code;

    const nameElem = document.getElementById("new-sub-namevi");
    if (nameElem) nameElem.value = sub.nameVi;

    const credElem = document.getElementById("new-sub-credits");
    if (credElem) credElem.value = sub.credits;

    const scoreElem = document.getElementById("new-sub-isscored");
    if (scoreElem) scoreElem.checked = sub.isScored;

    currentModalComponents = (sub.components || []).map(c => ({
        id: c.id,
        name: c.name,
        weight: c.weight,
        parts: c.parts || 1,
        isFE: !!c.isFE
    }));

    if (currentModalComponents.length === 0) {
        loadPresetComponents("theory");
    } else {
        renderModalComponents();
    }

    const modal = document.getElementById("add-subject-modal");
    if (modal) {
        modal.classList.remove("hidden");
        modal.classList.add("flex");
    }
}

function closeAddCustomSubjectModal() {
    const modal = document.getElementById("add-subject-modal");
    if (modal) {
        modal.classList.add("hidden");
        modal.classList.remove("flex");
    }
    editingSubjectId = null;
}

function loadPresetComponents(type) {
    if (type === "theory" || type === "theory_standard") {
        currentModalComponents = [
            { name: "Progress Test", weight: 30, parts: 2, isFE: false },
            { name: "Assignment", weight: 30, parts: 2, isFE: false },
            { name: "Final Exam (FE)", weight: 40, parts: 1, isFE: true }
        ];
    } else if (type === "practical" || type === "practical_pe") {
        currentModalComponents = [
            { name: "Lab Exercises", weight: 10, parts: 4, isFE: false },
            { name: "Progress Test", weight: 10, parts: 2, isFE: false },
            { name: "Assignment", weight: 20, parts: 1, isFE: false },
            { name: "Practical Exam (PE)", weight: 30, parts: 1, isFE: false },
            { name: "Final Exam (FE)", weight: 30, parts: 1, isFE: true }
        ];
    } else if (type === "coursera" || type === "online_coursera") {
        currentModalComponents = [
            { name: "Quizzes", weight: 30, parts: 3, isFE: false },
            { name: "Assignment / Capstone", weight: 30, parts: 1, isFE: false },
            { name: "Final Exam (FE)", weight: 40, parts: 1, isFE: true }
        ];
    } else if (type === "project" || type === "project_swp") {
        currentModalComponents = [
            { name: "Tiến độ Iterations", weight: 50, parts: 3, isFE: false },
            { name: "Bảo vệ đồ án (Final Defense)", weight: 50, parts: 1, isFE: true }
        ];
    }
    renderModalComponents();
}

function renderModalComponents() {
    const container = document.getElementById("custom-components-list");
    if (!container) return;

    container.innerHTML = "";
    let totalWeight = 0;

    currentModalComponents.forEach((comp, idx) => {
        const w = parseFloat(comp.weight) || 0;
        totalWeight += w;
        const row = document.createElement("div");
        row.className = "flex items-center gap-2 p-2.5 rounded-xl border border-slate-200 bg-slate-50/70";
        row.innerHTML = `
            <div class="flex-1">
                <input type="text" value="${comp.name}" placeholder="Tên cột điểm" 
                    oninput="updateModalCompField(${idx}, 'name', this.value)"
                    class="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs font-bold text-slate-800 bg-white focus:outline-none focus:border-blue-500">
            </div>
            <div class="w-20">
                <div class="flex items-center gap-1">
                    <input type="number" min="0" max="100" value="${comp.weight}" placeholder="%" 
                        oninput="updateModalCompField(${idx}, 'weight', parseFloat(this.value) || 0)"
                        class="w-full px-2 py-1.5 rounded-lg border border-slate-200 text-xs font-bold text-center bg-white focus:outline-none focus:border-blue-500">
                    <span class="text-xs font-bold text-slate-500">%</span>
                </div>
            </div>
            <div class="w-24">
                <div class="flex items-center gap-1" title="Số bài con / số cột điểm cần nhập">
                    <input type="number" min="1" max="10" value="${comp.parts || 1}" 
                        oninput="updateModalCompField(${idx}, 'parts', parseInt(this.value) || 1)"
                        class="w-12 px-2 py-1.5 rounded-lg border border-slate-200 text-xs font-bold text-center bg-white focus:outline-none focus:border-blue-500">
                    <span class="text-[11px] text-slate-500 font-medium">cột</span>
                </div>
            </div>
            <div class="flex items-center gap-1 px-1" title="Đánh dấu bài thi cuối kỳ (Điều kiện liệt FE >= 4.0)">
                <input type="checkbox" ${comp.isFE ? "checked" : ""} 
                    onchange="updateModalCompField(${idx}, 'isFE', this.checked)"
                    class="w-4 h-4 text-blue-600 rounded">
                <span class="text-[10px] font-bold text-slate-600 whitespace-nowrap">FE</span>
            </div>
            <button type="button" onclick="removeModalCompRow(${idx})" class="p-1 text-slate-400 hover:text-rose-500 transition" title="Xóa cột này">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
            </button>
        `;
        container.appendChild(row);
    });

    const weightElem = document.getElementById("modal-total-weight");
    if (weightElem) {
        if (Math.round(totalWeight) === 100) {
            weightElem.className = "text-xs font-extrabold px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 whitespace-nowrap inline-flex items-center gap-1 flex-shrink-0";
            weightElem.innerText = `Tổng trọng số: 100% (Chuẩn)`;
        } else {
            weightElem.className = "text-xs font-extrabold px-2.5 py-1 rounded-full bg-amber-100 text-amber-800 whitespace-nowrap inline-flex items-center gap-1 flex-shrink-0";
            weightElem.innerText = `Tổng trọng số: ${totalWeight}% (Nên là 100%)`;
        }
    }
}

function updateModalCompField(idx, field, value) {
    if (!currentModalComponents[idx]) return;
    currentModalComponents[idx][field] = value;
    if (field === 'weight') {
        const weightElem = document.getElementById("modal-total-weight");
        if (weightElem) {
            let total = currentModalComponents.reduce((s, c) => s + (parseFloat(c.weight) || 0), 0);
            if (Math.round(total) === 100) {
                weightElem.className = "text-xs font-extrabold px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 whitespace-nowrap inline-flex items-center gap-1 flex-shrink-0";
                weightElem.innerText = `Tổng trọng số: 100% (Chuẩn)`;
            } else {
                weightElem.className = "text-xs font-extrabold px-2.5 py-1 rounded-full bg-amber-100 text-amber-800 whitespace-nowrap inline-flex items-center gap-1 flex-shrink-0";
                weightElem.innerText = `Tổng trọng số: ${total}% (Nên là 100%)`;
            }
        }
    }
}

function addCustomComponentRow() {
    currentModalComponents.push({
        name: "Cột điểm mới",
        weight: 10,
        parts: 1,
        isFE: false
    });
    renderModalComponents();
}

function removeModalCompRow(idx) {
    currentModalComponents.splice(idx, 1);
    renderModalComponents();
}

function saveNewCustomSubject(e) {
    e.preventDefault();
    const code = document.getElementById("new-sub-code").value.trim().toUpperCase();
    const nameVi = document.getElementById("new-sub-namevi").value.trim();
    const credits = parseInt(document.getElementById("new-sub-credits").value) || 3;
    const isScored = document.getElementById("new-sub-isscored") ? document.getElementById("new-sub-isscored").checked : true;

    if (!code || !nameVi) {
        showToast("Vui lòng nhập Mã môn và Tên môn!", true);
        return;
    }
    if (!currentModalComponents || currentModalComponents.length === 0) {
        showToast("Vui lòng thêm ít nhất 1 cột điểm thành phần!", true);
        return;
    }

    const currentSem = AppState.currentSemester;
    const subjects = AppState.semesterData[currentSem] || [];

    if (editingSubjectId) {
        // Cập nhật môn học đã có
        const sub = subjects.find(s => s.id === editingSubjectId);
        if (sub) {
            sub.code = code;
            sub.nameVi = nameVi;
            sub.credits = credits;
            sub.isScored = isScored;

            const oldComps = sub.components || [];
            sub.components = currentModalComponents.map(mc => {
                const partsCount = Math.max(1, parseInt(mc.parts) || 1);
                const oldMatch = oldComps.find(oc => oc.id === mc.id || oc.name === mc.name);
                let subValues = Array(partsCount).fill("");
                let avgValue = "";
                let mode = partsCount > 1 ? "detailed" : "average";

                if (oldMatch) {
                    if (oldMatch.subValues && Array.isArray(oldMatch.subValues)) {
                        for (let i = 0; i < partsCount; i++) {
                            subValues[i] = (i < oldMatch.subValues.length && oldMatch.subValues[i] !== undefined)
                                ? oldMatch.subValues[i] : "";
                        }
                    }
                    avgValue = oldMatch.avgValue || "";
                    mode = oldMatch.mode || (partsCount > 1 ? "detailed" : "average");
                }

                return {
                    id: mc.id || ('comp_' + Math.random().toString(36).substr(2, 9)),
                    name: mc.name,
                    weight: parseFloat(mc.weight) || 0,
                    minScore: mc.isFE ? 4.0 : 0,
                    parts: partsCount,
                    isSubParts: partsCount > 1,
                    mode: mode,
                    isFE: !!mc.isFE,
                    subValues: subValues,
                    avgValue: avgValue
                };
            });
            showToast(`Đã cập nhật cấu trúc điểm môn ${code}! 🎉`);
        }
    } else {
        // Thêm môn mới
        const newSubject = {
            id: 'sub_' + Math.random().toString(36).substr(2, 9),
            code: code,
            nameVi: nameVi,
            nameEn: code,
            credits: credits,
            isScored: isScored,
            isPassFailOnly: false,
            hasDetailedSyllabus: false,
            minAvgToPass: 5.0,
            components: currentModalComponents.map(mc => {
                const partsCount = Math.max(1, parseInt(mc.parts) || 1);
                return {
                    id: 'comp_' + Math.random().toString(36).substr(2, 9),
                    name: mc.name,
                    weight: parseFloat(mc.weight) || 0,
                    minScore: mc.isFE ? 4.0 : 0,
                    parts: partsCount,
                    isSubParts: partsCount > 1,
                    mode: partsCount > 1 ? "detailed" : "average",
                    isFE: !!mc.isFE,
                    subValues: Array(partsCount).fill(""),
                    avgValue: ""
                };
            })
        };
        subjects.push(newSubject);
        showToast(`Đã thêm môn ${code} vào kỳ ${currentSem}! 🎉`);
    }

    closeAddCustomSubjectModal();
    renderApp();
}


// ================================================================
// HIỆU ỨNG PHÁO HOA CHÚC MỪNG (Confetti)
// ================================================================

function triggerFireworks() {
    // F08 & F09: Tuyệt đối không kích hoạt pháo hoa vinh danh ở Kỳ 6, 8, 9
    if (AppState.currentSemester === 6 || AppState.currentSemester === 8 || AppState.currentSemester === 9) {
        return;
    }
    if (typeof confetti !== "function") return;
    const duration = 3 * 1000;
    const animationEnd = Date.now() + duration;
    const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 99999 };

    function randomInRange(min, max) {
        return Math.random() * (max - min) + min;
    }

    const interval = setInterval(function() {
        const timeLeft = animationEnd - Date.now();
        if (timeLeft <= 0) {
            return clearInterval(interval);
        }
        const particleCount = 50 * (timeLeft / duration);
        confetti(Object.assign({}, defaults, { particleCount, origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 } }));
        confetti(Object.assign({}, defaults, { particleCount, origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 } }));
    }, 250);
}

// ================================================================
// XUẤT PHIẾU BẢNG ĐIỂM DỰ ĐOÁN (Export & Share Card)
// ================================================================

// ================================================================
// MOBILE NAVIGATION & RESPONSIVE CERTIFICATE FIT CONTROLLERS
// ================================================================

function toggleMobileNavMenu(forceState) {
    const drawer = document.getElementById("mobile-nav-drawer");
    const iconBars = document.getElementById("mobile-menu-icon-bars");
    const iconClose = document.getElementById("mobile-menu-icon-close");
    const btn = document.getElementById("mobile-menu-btn");
    if (!drawer) return;

    const willOpen = (typeof forceState === "boolean") ? forceState : drawer.classList.contains("hidden");

    if (willOpen) {
        drawer.classList.remove("hidden");
        if (iconBars) iconBars.classList.add("hidden");
        if (iconClose) iconClose.classList.remove("hidden");
        if (btn) btn.setAttribute("aria-expanded", "true");
    } else {
        drawer.classList.add("hidden");
        if (iconBars) iconBars.classList.remove("hidden");
        if (iconClose) iconClose.classList.add("hidden");
        if (btn) btn.setAttribute("aria-expanded", "false");
    }
}

let isCardFitMode = false;

function toggleCertificateFitMode() {
    isCardFitMode = !isCardFitMode;
    applyCertificateFitMode();
}

function applyCertificateFitMode() {
    const card = document.getElementById("certificate-card");
    const container = document.getElementById("certificate-card-scroll-container");
    const lbl = document.getElementById("lbl-fit-mode");
    if (!card) return;

    if (isCardFitMode) {
        const containerWidth = (container && container.clientWidth) ? container.clientWidth : (typeof window !== "undefined" ? window.innerWidth - 24 : 360);
        const cardWidth = 794;
        const scale = Math.min(1, Math.max(0.35, (containerWidth - 8) / cardWidth));
        
        card.style.transform = "scale(" + scale + ")";
        card.style.transformOrigin = "top left";
        const scaledHeight = 1123 * scale;
        card.style.marginBottom = "-" + (1123 - scaledHeight) + "px";
        card.style.marginRight = "-" + (cardWidth - (cardWidth * scale)) + "px";
        if (lbl) lbl.innerText = "Kích thước 100%";
        if (container) container.style.overflowX = "hidden";
    } else {
        card.style.transform = "none";
        card.style.transformOrigin = "top left";
        card.style.marginBottom = "0px";
        card.style.marginRight = "0px";
        if (lbl) lbl.innerText = "Vừa màn hình";
        if (container) container.style.overflowX = "auto";
    }
}

function openExportModal() {
    const modal = document.getElementById("export-modal");
    if (!modal) return;

    // Render nội dung Phiếu Kết quả
    renderExportCard();

    // Reset fit mode & scroll to top
    isCardFitMode = false;
    applyCertificateFitMode();

    modal.classList.remove("hidden");
    modal.classList.add("flex");
    modal.scrollTop = 0;
}

function closeExportModal() {
    const modal = document.getElementById("export-modal");
    if (!modal) return;
    isCardFitMode = false;
    applyCertificateFitMode();
    modal.classList.add("hidden");
    modal.classList.remove("flex");
}

function handleExportModalBackdropClick(event) {
    const modal = document.getElementById("export-modal");
    if (event && (event.target === modal || event.target.id === "export-modal")) {
        closeExportModal();
    }
}

function renderExportCard(targetContainer, semesterNum, options) {
    const card = targetContainer || document.getElementById("certificate-card");
    if (!card) return;

    const sem = (semesterNum !== undefined && semesterNum !== null) ? Number(semesterNum) : AppState.currentSemester;
    const subjects = (options && options.subjects) || AppState.semesterData[sem] || [];
    const res = calculateSemesterResults(subjects, sem);
    const semDef = (typeof CURRICULUM_SEMESTERS !== 'undefined') ? CURRICULUM_SEMESTERS.find(s => s.semester === sem) : null;
    const quotes = (typeof MOTIVATIONAL_QUOTES !== 'undefined' && Array.isArray(MOTIVATIONAL_QUOTES) && MOTIVATIONAL_QUOTES.length > 0)
        ? MOTIVATIONAL_QUOTES
        : ["Bảng dự đoán điểm môn & TBM học kỳ dựa theo Syllabus K20 (BIT_SE_K20B)."];
    const randomQuote = quotes[Math.floor(Math.random() * quotes.length)];

    const now = new Date();
    const dateStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')} - ${now.getDate()}/${now.getMonth() + 1}/${now.getFullYear()}`;

    let rowsHtml = subjects.map((sub, idx) => {
        const subRes = calculateSubjectScore(sub);
        let badge = "";
        if (sub.isPassFailOnly) {
            badge = subRes.isPass ? `<span class="badge-pass inline-flex items-center justify-center align-middle px-2.5 py-1 rounded text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">PASS</span>` : `<span class="badge-fail inline-flex items-center justify-center align-middle px-2.5 py-1 rounded text-xs font-bold bg-rose-50 text-rose-600 border border-rose-200">NOT PASS</span>`;
        } else if (subRes.isComplete) {
            badge = subRes.isPass ? `<span class="badge-pass inline-flex items-center justify-center align-middle px-2.5 py-1 rounded text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">PASS</span>` : `<span class="badge-fail inline-flex items-center justify-center align-middle px-2.5 py-1 rounded text-xs font-bold bg-rose-50 text-rose-600 border border-rose-200">NOT PASS</span>`;
        } else {
            badge = `<span class="badge-pending inline-flex items-center justify-center align-middle px-2.5 py-1 rounded text-xs font-medium bg-slate-100 text-slate-500">Đang nhập</span>`;
        }

        let compBreakdownHtml = "";
        if (sub.isPassFailOnly) {
            compBreakdownHtml = `<div class="mt-1 text-[11px] text-slate-500 italic">Môn điều kiện (Đánh giá hoàn thành Pass/Fail)</div>`;
        } else if (sub.components && sub.components.length > 0) {
            const compParts = sub.components.map(comp => {
                const compRes = calculateComponentScore(comp);
                const scoreStr = (compRes && compRes.value !== null)
                    ? compRes.value.toFixed(1)
                    : (comp.avgValue || '-');
                return `<span class="cert-chip inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200 text-[10.5px] font-medium">${comp.name} (${comp.weight}%): <strong class="text-slate-900">${scoreStr}</strong></span>`;
            });
            compBreakdownHtml = `<div class="mt-1.5 flex flex-wrap items-center gap-1.5">${compParts.join("")}</div>`;
        }

        return `
            <div class="${idx % 2 === 0 ? "bg-white" : "bg-slate-50/70"} cert-data-row border-b border-slate-200 flex items-stretch">
                <div class="cert-col-code w-28 flex-shrink-0 p-3 sm:px-4 font-bold text-slate-800 border-r border-slate-200 text-sm flex items-center box-border" style="vertical-align: middle !important;">
                    <div class="cell-wrapper flex items-center">
                        ${sub.code}
                    </div>
                </div>
                <div class="cert-col-name flex-1 min-w-0 p-3 sm:px-4 text-slate-700 font-medium border-r border-slate-200 text-sm flex flex-col justify-center box-border" style="vertical-align: middle !important;">
                    <div style="line-height: 1.4;">
                        <span class="font-bold text-slate-800 text-sm">${sub.nameVi}</span>
                        ${compBreakdownHtml}
                    </div>
                </div>
                <div class="cert-col-score w-28 flex-shrink-0 p-3 sm:px-4 text-center font-bold font-mono ${subRes.isPass ? "text-slate-900" : "text-rose-600"} border-r border-slate-200 text-base flex items-center justify-center box-border" style="vertical-align: middle !important; text-align: center !important;">
                    <div class="cell-wrapper-center flex items-center justify-center">
                        ${subRes.roundedScore}
                    </div>
                </div>
                <div class="cert-col-status w-32 flex-shrink-0 p-3 sm:px-4 text-center flex items-center justify-center box-border" style="vertical-align: middle !important; text-align: center !important;">
                    <div class="cell-wrapper-center flex items-center justify-center">
                        ${badge}
                    </div>
                </div>
            </div>
        `;
    }).join("");

    const mascotSvg = (typeof MASCOT_HAPPY_SVG !== 'undefined')
        ? MASCOT_HAPPY_SVG
        : '<img src="assets/mascot_happy.svg" alt="Mascot Logo" class="w-full h-full object-contain filter drop-shadow">';

    card.innerHTML = `
        <div class="card-watermark">FPTU</div>

        <div class="relative z-10 text-slate-800 flex flex-col justify-between" style="min-height: 1123px;">
            <div>
                <!-- Vibrant Royal FPT Blue Gradient Header -->
                <div class="p-5 sm:p-6 text-white relative overflow-hidden" 
                     style="background: linear-gradient(135deg, #004D99 0%, #0066B2 55%, #0284C7 100%);">
                    
                    <div class="absolute -right-12 -top-12 w-52 h-52 bg-white/10 rounded-full blur-3xl pointer-events-none"></div>
                    <!-- Hidden Institutional Tag for Verification -->
                    <div class="hidden" aria-hidden="true">TRƯỜNG ĐẠI HỌC FPT • FPT UNIVERSITY BIT_SE_K20B</div>

                    <!-- Top Row: Big Mascot Logo & Web Brand -->
                    <div class="flex items-center justify-between pb-3.5 border-b border-white/20 relative z-10">
                        <div class="flex items-center gap-3.5">
                            <div class="w-12 h-12 flex-shrink-0">
                                ${mascotSvg}
                            </div>
                            <span class="text-xl sm:text-2xl font-black text-white tracking-tight" style="font-family: 'Plus Jakarta Sans', 'Inter', 'Be Vietnam Pro', sans-serif;">
                                FPTU&nbsp;<span class="text-sky-300">SCORE</span><span class="text-white/40 font-light mx-0.5">.</span><span class="text-amber-300">CALC</span>
                            </span>
                        </div>

                        <div class="flex-shrink-0">
                            <span class="inline-block px-4 py-1.5 rounded-lg bg-white/20 text-white border border-white/30 text-xs font-black uppercase tracking-wider shadow-xs">
                                ${semDef ? semDef.title : `HỌC KỲ ${sem}`}
                            </span>
                        </div>
                    </div>

                    <!-- Document Title Section (Clean, Fresh, No FPT University subheader) -->
                    <div class="pt-4 relative z-10">
                        <h2 class="text-2xl sm:text-3xl font-black text-white tracking-tight uppercase" style="font-family: 'Plus Jakarta Sans', 'Inter', 'Be Vietnam Pro', sans-serif;">
                            PHIẾU BÁO ĐIỂM DỰ ĐOÁN HỌC KỲ
                        </h2>
                        <p class="text-xs sm:text-sm text-sky-100 font-medium mt-1">
                            Phiếu Dự Đoán Điểm • Chương trình Cử nhân Kỹ thuật Phần mềm (Khóa K20)
                        </p>
                    </div>
                </div>

                <!-- Bảng điểm chi tiết & tổng kết -->
                <div class="px-6 py-4 bg-white">
                    <div class="cert-table overflow-hidden shadow-xs rounded-lg border border-slate-200">
                        <div class="cert-header-row bg-slate-900 text-white font-bold flex items-stretch">
                            <div class="cert-h-code w-28 flex-shrink-0 py-3.5 px-4 text-left text-xs uppercase tracking-wider flex items-center" style="vertical-align: middle !important;">MÃ MÔN</div>
                            <div class="cert-h-name flex-1 min-w-0 py-3.5 px-4 text-left text-xs uppercase tracking-wider flex items-center" style="vertical-align: middle !important;">TÊN MÔN HỌC &amp; THÀNH PHẦN (% TRỌNG SỐ)</div>
                            <div class="cert-h-score w-28 flex-shrink-0 py-3.5 px-4 text-center text-xs uppercase tracking-wider flex items-center justify-center" style="vertical-align: middle !important;">ĐIỂM TỔNG</div>
                            <div class="cert-h-status w-32 flex-shrink-0 py-3.5 px-4 text-center text-xs uppercase tracking-wider flex items-center justify-center" style="vertical-align: middle !important;">TRẠNG THÁI</div>
                        </div>
                        <div class="cert-body">
                            ${rowsHtml}
                        </div>
                    </div>
                </div>
            </div>

            <!-- Tổng kết TBM & Danh hiệu & Footer (Ghim dưới đáy trang A4) -->
            <div class="cert-summary-container px-6 py-4 bg-white border-t border-slate-200">
                <div class="cert-summary-box p-4 bg-slate-50 border border-slate-300 grid grid-cols-1 sm:grid-cols-2 gap-3 items-center">
                    <div>
                        <span class="text-xs font-bold uppercase tracking-wider text-slate-500 block" style="font-size: 11px; font-weight: 700; color: #64748B; text-transform: uppercase;">ĐIỂM TRUNG BÌNH HỌC KỲ (TBM)</span>
                        <div class="flex items-baseline gap-2 mt-1">
                            <span class="text-4xl font-black text-fptBlue font-mono" style="font-size: 36px; font-weight: 900; color: #0066B2; font-family: monospace;">${res.tbmStr}</span>
                            <span class="text-xs text-slate-500 font-medium" style="font-size: 12px; color: #64748B; font-weight: 500;">/ 10.0 (Trung bình cộng)</span>
                        </div>
                    </div>
                    <div class="sm:text-right text-right">
                        <span class="text-xs font-bold uppercase tracking-wider text-slate-500 block" style="font-size: 11px; font-weight: 700; color: #64748B; text-transform: uppercase;">DỰ ĐOÁN XẾP LOẠI HỌC KỲ</span>
                        <div class="mt-1">
                            <span class="cert-honor-badge honor-${res.honor.level} inline-block px-4 py-1.5 rounded-lg text-sm font-extrabold border ${res.honor.badgeClass}">
                                ${res.honor.highlightBadge ? res.honor.highlightBadge : res.honor.title}
                            </span>
                        </div>
                    </div>
                </div>

                <!-- Footer & Ghi chú quy chế -->
                <div class="cert-footer mt-6 pt-4 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-500 relative z-10">
                    <p class="italic text-xs text-slate-500 leading-normal flex-1 pr-4 whitespace-normal" style="font-style: italic; font-size: 11px; color: #64748B; margin: 0;">${randomQuote}</p>
                    <div class="text-[11px] text-slate-400 font-mono" style="font-size: 11px; color: #94A3B8; font-family: monospace; white-space: nowrap;">
                        Xuất lúc: ${dateStr} • FPTU SE K20 Tool
                    </div>
                </div>
            </div>
        </div>
    `;
}

async function captureCertificateCardSandbox(sourceCard) {
    if (!sourceCard) return null;

    if (typeof html2canvas !== "function") {
        throw new Error("Thư viện html2canvas chưa được tải!");
    }

    // Tạo sandbox rendering ngoài màn hình với kích thước cố định 800px và chiều cao chuẩn A4 1131px
    const sandbox = document.createElement("div");
    sandbox.id = "certificate-export-sandbox";
    sandbox.style.position = "fixed";
    sandbox.style.left = "-9999px";
    sandbox.style.top = "0";
    sandbox.style.width = "800px";
    sandbox.style.minWidth = "800px";
    sandbox.style.maxWidth = "800px";
    sandbox.style.minHeight = "1131px";
    sandbox.style.height = "1131px";
    sandbox.style.boxSizing = "border-box";
    sandbox.style.zIndex = "-9999";
    sandbox.style.opacity = "1";
    sandbox.style.backgroundColor = "#FFFFFF";
    sandbox.style.transform = "none";
    sandbox.style.pointerEvents = "none";

    let clonedCard;
    if (typeof sourceCard.cloneNode === "function") {
        clonedCard = sourceCard.cloneNode(true);
    } else {
        clonedCard = document.createElement("div");
        clonedCard.innerHTML = sourceCard.innerHTML;
        clonedCard.className = sourceCard.className;
    }

    clonedCard.style.width = "800px";
    clonedCard.style.minWidth = "800px";
    clonedCard.style.maxWidth = "800px";
    clonedCard.style.minHeight = "1131px";
    clonedCard.style.transform = "none";
    clonedCard.style.boxSizing = "border-box";
    clonedCard.style.border = "2px solid #0066B2";
    clonedCard.style.backgroundColor = "#FFFFFF";

    sandbox.appendChild(clonedCard);
    document.body.appendChild(sandbox);

    try {
        const canvas = await html2canvas(clonedCard, {
            scale: 2, // Độ phân giải 2x retina sắc nét
            useCORS: true,
            width: 800,
            windowWidth: 800,
            backgroundColor: "#FFFFFF",
            logging: false
        });
        return canvas;
    } finally {
        if (sandbox && sandbox.parentNode) {
            sandbox.parentNode.removeChild(sandbox);
        }
    }
}

// Tải ảnh về máy (.PNG)
async function downloadCertificatePng() {
    const card = document.getElementById("certificate-card");
    const downloadBtn = document.getElementById("btn-download-png");
    if (!card) return;

    try {
        if (downloadBtn) {
            downloadBtn.disabled = true;
            downloadBtn.innerHTML = `Đang xử lý ảnh...`;
        }

        const canvas = await captureCertificateCardSandbox(card);
        if (!canvas) {
            showToast("Không thể tạo dữ liệu ảnh để tải về!", true);
            return;
        }

        const image = typeof canvas.toDataURL === "function" ? canvas.toDataURL("image/png") : null;
        if (!image) {
            showToast("Không thể xuất ảnh, vui lòng thử lại!", true);
            return;
        }

        const link = document.createElement("a");
        link.download = `BangDiem_FPTU_Ky${AppState.currentSemester}_K20.png`;
        link.href = image;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        showToast("Đã tải ảnh bảng điểm thành công! 🎉");
    } catch (err) {
        console.error("Lỗi khi tải ảnh:", err);
        showToast("Không thể xuất ảnh, vui lòng thử lại!", true);
    } finally {
        if (downloadBtn) {
            downloadBtn.disabled = false;
            downloadBtn.innerHTML = `
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/></svg>
                Tải ảnh PNG
            `;
        }
    }
}

const downloadCertificateImage = downloadCertificatePng;

// Tải file PDF trực tiếp về máy (.PDF - R3)
async function downloadCertificatePdf() {
    const card = document.getElementById("certificate-card");
    const downloadBtn = document.getElementById("btn-download-pdf");
    if (!card) return;

    try {
        if (downloadBtn) {
            downloadBtn.disabled = true;
            downloadBtn.innerHTML = `Đang xử lý PDF...`;
        }

        const canvas = await captureCertificateCardSandbox(card);
        if (!canvas) {
            showToast("Không thể tạo dữ liệu xuất PDF!", true);
            return;
        }

        const imgData = typeof canvas.toDataURL === "function" ? canvas.toDataURL("image/png") : null;
        if (!imgData) {
            showToast("Không thể tạo hình ảnh cho PDF!", true);
            return;
        }

        const jsPdfConstructor = (typeof window !== "undefined" && window.jspdf && window.jspdf.jsPDF)
            ? window.jspdf.jsPDF
            : (typeof jsPDF !== "undefined" ? jsPDF : null);

        if (jsPdfConstructor) {
            const pdf = new jsPdfConstructor({
                orientation: "portrait",
                unit: "mm",
                format: "a4"
            });
            pdf.addImage(imgData, "PNG", 0, 0, 210, 297);
            pdf.save(`BangDiem_FPTU_Ky${AppState.currentSemester}_K20.pdf`);
            showToast("Đã tải file PDF bảng điểm thành công! 🎉");
        } else {
            window.print();
        }
    } catch (err) {
        console.error("Lỗi khi tải PDF:", err);
        showToast("Không thể tải PDF, đang mở chế độ in...", true);
        window.print();
    } finally {
        if (downloadBtn) {
            downloadBtn.disabled = false;
            downloadBtn.innerHTML = `
                <svg class="w-4 h-4 text-fptBlue" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
                Tải file PDF (A4)
            `;
        }
    }
}

// Sao chép ảnh vào Clipboard
async function copyCertificateToClipboard() {
    const card = document.getElementById("certificate-card");
    const copyBtn = document.getElementById("btn-copy-clipboard");
    if (!card) return;

    try {
        if (copyBtn) {
            copyBtn.disabled = true;
            copyBtn.innerHTML = `Đang sao chép...`;
        }

        const canvas = await captureCertificateCardSandbox(card);
        if (!canvas) {
            showToast("Không thể tạo dữ liệu ảnh để sao chép!", true);
            return;
        }

        if (typeof canvas.toBlob === "function") {
            canvas.toBlob(async (blob) => {
                if (!blob) {
                    showToast("Không thể tạo dữ liệu ảnh!", true);
                    return;
                }
                try {
                    if (typeof ClipboardItem !== "undefined" && navigator.clipboard && typeof navigator.clipboard.write === "function") {
                        const item = new ClipboardItem({ "image/png": blob });
                        await navigator.clipboard.write([item]);
                        showToast("Đã sao chép ảnh vào Clipboard! Bạn có thể Ctrl+V để dán ngay 📋");
                    } else if (navigator.clipboard && typeof navigator.clipboard.writeText === "function") {
                        await navigator.clipboard.writeText(window.location.href);
                        showToast("Trình duyệt không hỗ trợ dán ảnh trực tiếp. Vui lòng bấm 'Tải ảnh PNG'!", true);
                    } else {
                        showToast("Trình duyệt chặn sao chép ảnh trực tiếp, hãy dùng nút Tải ảnh PNG!", true);
                    }
                } catch (clipErr) {
                    console.warn("ClipboardItem không hỗ trợ:", clipErr);
                    showToast("Trình duyệt chặn sao chép ảnh trực tiếp, hãy dùng nút Tải ảnh PNG!", true);
                }
            }, "image/png");
        } else {
            showToast("Trình duyệt không hỗ trợ xuất blob ảnh, hãy dùng nút Tải ảnh PNG!", true);
        }
    } catch (err) {
        console.error("Lỗi khi sao chép:", err);
        showToast("Không thể sao chép, vui lòng thử lại!", true);
    } finally {
        if (copyBtn) {
            copyBtn.disabled = false;
            copyBtn.innerHTML = `
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3"/></svg>
                Sao chép vào Clipboard
            `;
        }
    }
}

// Thông báo Toast đơn giản

function exportCertificatePdf() {
    window.print();
}

function scrollToCalculator() {
    const el = document.getElementById("calculator-section");
    if (el) {
        el.scrollIntoView({ behavior: "smooth" });
    }
}

function showToast(msg, isError = false) {
    const toast = document.createElement("div");
    toast.className = `fixed bottom-6 right-6 z-50 px-4 py-3 rounded-xl shadow-xl text-sm font-bold flex items-center gap-2 transform transition-all duration-300 translate-y-4 opacity-0 ${
        isError ? "bg-red-600 text-white" : "bg-slate-900 text-white"
    }`;
    toast.innerHTML = `
        <span>${msg}</span>
    `;
    document.body.appendChild(toast);

    requestAnimationFrame(() => {
        toast.classList.remove("translate-y-4", "opacity-0");
    });

    setTimeout(() => {
        toast.classList.add("translate-y-4", "opacity-0");
        setTimeout(() => toast.remove(), 300);
    }, 3500);
}

// ================================================================
// SPA VIEW SWITCHING CONTROLLER (R1)
// ================================================================
function switchView(viewName) {
    const homeView = document.getElementById("view-home");
    const calcView = document.getElementById("view-calculator");
    const syllabusView = document.getElementById("view-syllabus");
    const navHome = document.getElementById("tab-nav-home");
    const navCalc = document.getElementById("tab-nav-calc");
    const navSyllabus = document.getElementById("tab-nav-syllabus");

    const isHome = (viewName === 'home');
    const isSyllabus = (viewName === 'syllabus');
    // Any other input (including 'calc', 'calculator', null, undefined, number, object, unknown strings) defaults to calculator view
    const isCalc = !isHome && !isSyllabus;

    if (homeView) {
        if (isHome) {
            homeView.classList.remove("hidden");
            homeView.classList.add("block");
        } else {
            homeView.classList.remove("block");
            homeView.classList.add("hidden");
        }
    }

    if (calcView) {
        if (isCalc) {
            calcView.classList.remove("hidden");
            calcView.classList.add("block");
        } else {
            calcView.classList.remove("block");
            calcView.classList.add("hidden");
        }
    }

    if (syllabusView) {
        if (isSyllabus) {
            syllabusView.classList.remove("hidden");
            syllabusView.classList.add("block");
            if (typeof renderSyllabusView === 'function') {
                renderSyllabusView();
            }
        } else {
            syllabusView.classList.remove("block");
            syllabusView.classList.add("hidden");
        }
    }

    const activeClasses = ["bg-white", "text-fptBlue", "shadow-xs"];
    const inactiveClass = "text-slate-600";

    if (navHome) {
        if (isHome) {
            navHome.classList.add(...activeClasses);
            navHome.classList.remove(inactiveClass);
        } else {
            navHome.classList.remove(...activeClasses);
            navHome.classList.add(inactiveClass);
        }
    }

    if (navCalc) {
        if (isCalc) {
            navCalc.classList.add(...activeClasses);
            navCalc.classList.remove(inactiveClass);
        } else {
            navCalc.classList.remove(...activeClasses);
            navCalc.classList.add(inactiveClass);
        }
    }

    if (navSyllabus) {
        if (isSyllabus) {
            navSyllabus.classList.add(...activeClasses);
            navSyllabus.classList.remove(inactiveClass);
        } else {
            navSyllabus.classList.remove(...activeClasses);
            navSyllabus.classList.add(inactiveClass);
        }
    }

    // Sync mobile navigation drawer active states
    const mobHome = document.getElementById("mob-nav-home");
    const mobCalc = document.getElementById("mob-nav-calc");
    const mobSyllabus = document.getElementById("mob-nav-syllabus");
    const mobActive = ["bg-blue-50", "text-fptBlue", "font-bold"];
    const mobInactive = ["text-slate-700", "font-semibold"];

    if (mobHome) {
        if (isHome) {
            mobHome.classList.add(...mobActive);
            mobHome.classList.remove(...mobInactive);
        } else {
            mobHome.classList.remove(...mobActive);
            mobHome.classList.add(...mobInactive);
        }
    }
    if (mobCalc) {
        if (isCalc) {
            mobCalc.classList.add(...mobActive);
            mobCalc.classList.remove(...mobInactive);
        } else {
            mobCalc.classList.remove(...mobActive);
            mobCalc.classList.add(...mobInactive);
        }
    }
    if (mobSyllabus) {
        if (isSyllabus) {
            mobSyllabus.classList.add(...mobActive);
            mobSyllabus.classList.remove(...mobInactive);
        } else {
            mobSyllabus.classList.remove(...mobActive);
            mobSyllabus.classList.add(...mobInactive);
        }
    }

    if (typeof window !== "undefined" && typeof window.scrollTo === "function") {
        window.scrollTo({ top: 0, behavior: "smooth" });
    }
}

// ================================================================
// DEDICATED 9-SEMESTER SYLLABUS LOOKUP CONTROLLER (R4)
// ================================================================

const SyllabusState = {
    selectedSemester: 'all', // 'all' or 0..9
    selectedGpaFilter: 'all', // 'all' | 'scored' | 'condition'
    searchQuery: ''
};

function renderSyllabusView() {
    renderSyllabusSemesterFilters();
    renderSyllabusCards();
}

function renderSyllabusSemesterFilters() {
    const container = document.getElementById("syllabus-semester-filters");
    if (!container) return;

    const semesters = [
        { id: 'all', label: 'Tất cả (Kỳ 0 - 9)' },
        ...Array.from({ length: 10 }, (_, i) => ({ id: i, label: `Kỳ ${i}` }))
    ];

    container.innerHTML = semesters.map(s => {
        const isActive = (SyllabusState.selectedSemester === s.id) || (s.id !== 'all' && Number(SyllabusState.selectedSemester) === s.id);
        return `
            <button type="button" onclick="setSyllabusSemester('${s.id}')" class="flex-shrink-0 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all border ${
                isActive
                    ? 'bg-fptBlue text-white border-fptBlue shadow-xs'
                    : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100 hover:text-slate-900'
            }">
                ${s.label}
            </button>
        `;
    }).join("");
}

function setSyllabusSemester(sem) {
    SyllabusState.selectedSemester = (sem === 'all') ? 'all' : Number(sem);
    renderSyllabusSemesterFilters();
    renderSyllabusCards();
}
const selectSyllabusSemester = setSyllabusSemester;

function setSyllabusGpaFilter(filter) {
    SyllabusState.selectedGpaFilter = filter;
    const filterContainer = document.getElementById("syllabus-gpa-filter");
    if (filterContainer) {
        const buttons = filterContainer.querySelectorAll(".syllabus-filter-btn");
        buttons.forEach(btn => {
            if (btn.getAttribute("data-filter") === filter) {
                btn.classList.add("bg-white", "text-fptBlue", "shadow-xs");
                btn.classList.remove("text-slate-600");
            } else {
                btn.classList.remove("bg-white", "text-fptBlue", "shadow-xs");
                btn.classList.add("text-slate-600");
            }
        });
    }
    renderSyllabusCards();
}
const filterSyllabusGPA = setSyllabusGpaFilter;

function handleSyllabusSearch(query) {
    SyllabusState.searchQuery = (query || "").trim().toLowerCase();
    const clearBtn = document.getElementById("syllabus-search-clear");
    if (clearBtn) {
        if (SyllabusState.searchQuery.length > 0) {
            clearBtn.classList.remove("hidden");
        } else {
            clearBtn.classList.add("hidden");
        }
    }
    renderSyllabusCards();
}

function clearSyllabusSearch() {
    const input = document.getElementById("syllabus-search-input");
    if (input) input.value = "";
    handleSyllabusSearch("");
}

function removeVietnameseDiacritics(str) {
    if (!str) return "";
    return str.normalize("NFD")
              .replace(/[\u0300-\u036f]/g, "")
              .replace(/đ/g, "d")
              .replace(/Đ/g, "D")
              .toLowerCase();
}

function renderSyllabusCards() {
    const container = document.getElementById("syllabus-cards-container");
    const countElem = document.getElementById("syllabus-results-count");
    if (!container) return;

    if (typeof CURRICULUM_SEMESTERS === 'undefined' || !Array.isArray(CURRICULUM_SEMESTERS)) return;

    // Collect all subjects matching semester filter
    let subjectsList = [];
    CURRICULUM_SEMESTERS.forEach(semDef => {
        if (SyllabusState.selectedSemester !== 'all' && semDef.semester !== Number(SyllabusState.selectedSemester)) {
            return;
        }
        (semDef.subjects || []).forEach(sub => {
            subjectsList.push({
                ...sub,
                semester: semDef.semester,
                semesterTitle: semDef.title
            });
        });
    });

    // Filter by GPA contribution
    if (SyllabusState.selectedGpaFilter === 'scored') {
        subjectsList = subjectsList.filter(s => s.isScored !== false);
    } else if (SyllabusState.selectedGpaFilter === 'condition') {
        subjectsList = subjectsList.filter(s => s.isScored === false);
    }

    // Filter by search query
    if (SyllabusState.searchQuery.length > 0) {
        const queryNorm = removeVietnameseDiacritics(SyllabusState.searchQuery);
        subjectsList = subjectsList.filter(s => {
            const codeMatch = (s.code || "").toLowerCase().includes(SyllabusState.searchQuery);
            const nameViNorm = removeVietnameseDiacritics(s.nameVi || "");
            const nameEnMatch = (s.nameEn || "").toLowerCase().includes(SyllabusState.searchQuery);
            const aliasMatch = (s.aliasSyllabus || "").toLowerCase().includes(SyllabusState.searchQuery);
            return codeMatch || nameViNorm.includes(queryNorm) || nameEnMatch || aliasMatch;
        });
    }

    // Update count
    const totalCredits = subjectsList.reduce((acc, s) => acc + (s.credits || 0), 0);
    if (countElem) {
        countElem.innerText = `Hiển thị ${subjectsList.length} môn học (${totalCredits} tín chỉ)`;
    }

    if (subjectsList.length === 0) {
        container.innerHTML = `
            <div class="col-span-full py-12 text-center bg-white rounded-2xl border border-dashed border-slate-300 p-8">
                <svg class="w-12 h-12 text-slate-300 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                <p class="text-sm font-bold text-slate-700">Không tìm thấy môn học phù hợp</p>
                <p class="text-xs text-slate-400 mt-1">Thử thay đổi từ khóa tìm kiếm hoặc bỏ chọn bộ lọc học kỳ.</p>
                <button type="button" onclick="clearSyllabusSearch(); setSyllabusSemester('all');" class="mt-4 px-4 py-2 bg-blue-50 text-fptBlue text-xs font-bold rounded-xl hover:bg-blue-100 transition">
                    Xóa tất cả bộ lọc
                </button>
            </div>
        `;
        return;
    }

    container.innerHTML = subjectsList.map(sub => {
        const isScored = sub.isScored !== false;
        let schema = (typeof SUBJECT_SCHEMAS !== 'undefined') ? SUBJECT_SCHEMAS[sub.code] : null;
        if (!schema && sub.aliasSyllabus && typeof SUBJECT_SCHEMAS !== 'undefined') {
            schema = SUBJECT_SCHEMAS[sub.aliasSyllabus];
        }
        const comps = (schema && schema.components) || [];
        const compCount = comps.length;

        const gpaBadge = isScored
            ? `<span class="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">✓ Tính vào GPA</span>`
            : `<span class="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">⚠️ Không tính vào GPA / Môn điều kiện</span>`;

        return `
            <div onclick="openSyllabusDetailModal('${sub.code}', ${sub.semester})" class="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-card hover:shadow-elevated hover:border-blue-300 transition-all cursor-pointer flex flex-col justify-between group">
                <div>
                    <div class="flex items-center justify-between gap-2 mb-2.5">
                        <span class="px-2.5 py-1 rounded-lg bg-slate-100 font-mono font-black text-xs text-slate-800 tracking-wider group-hover:text-fptBlue group-hover:bg-blue-50 transition-colors">
                            ${sub.code}
                        </span>
                        <div class="flex items-center gap-1.5">
                            <span class="text-[11px] font-bold px-2 py-0.5 rounded-md bg-blue-50 text-fptBlue border border-blue-200/60">
                                ${sub.credits} TC
                            </span>
                            <span class="text-[11px] font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-600">
                                Kỳ ${sub.semester}
                            </span>
                        </div>
                    </div>
                    <h3 class="font-extrabold text-slate-800 text-sm group-hover:text-fptBlue transition-colors line-clamp-1">
                        ${sub.nameVi || sub.code}
                    </h3>
                    <p class="text-xs text-slate-400 font-medium italic mt-0.5 line-clamp-1">
                        ${sub.nameEn || ''}
                    </p>
                    <div class="mt-3">
                        ${gpaBadge}
                    </div>
                </div>

                <div class="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                    <span class="text-slate-500 font-medium">
                        ${compCount > 0 ? `${compCount} đầu điểm thành phần` : 'Đánh giá Pass/Fail'}
                    </span>
                    <span class="font-bold text-fptBlue inline-flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                        Xem chi tiết
                        <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/></svg>
                    </span>
                </div>
            </div>
        `;
    }).join("");
}

function openSyllabusDetailModal(code, semesterNum) {
    const modal = document.getElementById("syllabus-detail-modal");
    const content = document.getElementById("syllabus-detail-content");
    const title = document.getElementById("modal-sub-title");
    const subtitle = document.getElementById("modal-sub-subtitle");
    if (!modal || !content) return;

    if (semesterNum === undefined && typeof CURRICULUM_SEMESTERS !== 'undefined') {
        const foundSem = CURRICULUM_SEMESTERS.find(s => (s.subjects || []).some(sub => sub.code === code || sub.aliasSyllabus === code));
        semesterNum = foundSem ? foundSem.semester : "-";
    }

    let schema = (typeof SUBJECT_SCHEMAS !== 'undefined') ? SUBJECT_SCHEMAS[code] : null;
    const semDef = (typeof CURRICULUM_SEMESTERS !== 'undefined') ? CURRICULUM_SEMESTERS.find(s => s.semester === semesterNum) : null;
    const subInSem = semDef ? semDef.subjects.find(s => s.code === code) : null;

    if (!schema && subInSem && subInSem.aliasSyllabus && typeof SUBJECT_SCHEMAS !== 'undefined') {
        schema = SUBJECT_SCHEMAS[subInSem.aliasSyllabus];
    }

    const nameVi = (schema && schema.nameVi) || (subInSem && subInSem.nameVi) || code;
    const nameEn = (schema && schema.nameEn) || (subInSem && subInSem.nameEn) || "";
    const credits = (schema && schema.credits !== undefined) ? schema.credits : (subInSem ? subInSem.credits : 3);
    const isScored = (schema && schema.isScored !== undefined) ? schema.isScored : (subInSem ? subInSem.isScored : true);
    const note = (schema && schema.note) || (subInSem && subInSem.note) || "";
    const components = (schema && schema.components) || [];

    if (title) title.innerText = `[${code}] ${nameVi}`;
    if (subtitle) subtitle.innerText = `${nameEn ? `${nameEn} • ` : ''}Học kỳ ${semesterNum} • ${credits} Tín chỉ`;

    let compsTableHtml = "";
    if (components.length > 0) {
        const rows = components.map(c => `
            <tr class="border-b border-slate-100 hover:bg-slate-50/50">
                <td class="py-2.5 px-3 font-bold text-slate-800 text-xs">${c.name}</td>
                <td class="py-2.5 px-3 text-center font-extrabold text-fptBlue text-xs">${c.weight}%</td>
                <td class="py-2.5 px-3 text-center text-xs text-slate-600">${c.parts || 1} ${c.isSubParts ? 'cột con' : 'bài'}</td>
                <td class="py-2.5 px-3 text-center text-xs">
                    ${c.isFE ? '<span class="font-extrabold text-rose-600">&ge; 4.0</span>' : '<span class="text-emerald-600">&gt; 0</span>'}
                </td>
                <td class="py-2.5 px-3 text-xs text-slate-500">${c.note || '-'}</td>
            </tr>
        `).join("");

        compsTableHtml = `
            <div class="overflow-x-auto rounded-xl border border-slate-200">
                <table class="w-full text-left border-collapse">
                    <thead class="bg-slate-100 text-[11px] font-black uppercase text-slate-600">
                        <tr>
                            <th class="py-2.5 px-3">Thành phần đánh giá</th>
                            <th class="py-2.5 px-3 text-center">Trọng số</th>
                            <th class="py-2.5 px-3 text-center">Số lượng</th>
                            <th class="py-2.5 px-3 text-center">Điểm tối thiểu</th>
                            <th class="py-2.5 px-3">Ghi chú</th>
                        </tr>
                    </thead>
                    <tbody class="divide-y divide-slate-100">
                        ${rows}
                    </tbody>
                    <tfoot class="bg-slate-50 font-bold text-xs text-slate-700">
                        <tr>
                            <td class="py-2 px-3">Tổng cộng</td>
                            <td class="py-2 px-3 text-center text-emerald-600 font-black">100%</td>
                            <td colspan="3" class="py-2 px-3 text-slate-400 text-right">Chuẩn khảo thí FPTU</td>
                        </tr>
                    </tfoot>
                </table>
            </div>
        `;
    } else {
        compsTableHtml = `
            <div class="p-4 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-800 leading-relaxed">
                <strong>Học phần đánh giá điều kiện Pass / Not Pass:</strong> Hoàn thành tất cả các bài tập/tiêu chí thực hành theo yêu cầu của giảng viên và quy chế khảo thí. Học phần không tính điểm vào TBM học kỳ.
            </div>
        `;
    }

    content.innerHTML = `
        <!-- Meta info -->
        <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
            <div class="p-3 rounded-xl bg-slate-50 border border-slate-200">
                <span class="text-[11px] text-slate-500 block">Mã học phần</span>
                <span class="font-mono font-black text-sm text-slate-900">${code}</span>
            </div>
            <div class="p-3 rounded-xl bg-slate-50 border border-slate-200">
                <span class="text-[11px] text-slate-500 block">Số tín chỉ</span>
                <span class="font-black text-sm text-fptBlue">${credits} TC</span>
            </div>
            <div class="p-3 rounded-xl bg-slate-50 border border-slate-200">
                <span class="text-[11px] text-slate-500 block">Học kỳ đào tạo</span>
                <span class="font-black text-sm text-slate-900">Kỳ ${semesterNum}</span>
            </div>
            <div class="p-3 rounded-xl bg-slate-50 border border-slate-200">
                <span class="text-[11px] text-slate-500 block">Đóng góp GPA</span>
                <span class="font-bold text-xs ${isScored ? 'text-emerald-600' : 'text-amber-600'}">
                    ${isScored ? 'Có tính GPA' : 'Không tính GPA'}
                </span>
            </div>
        </div>

        ${note ? `
            <div class="p-3 rounded-xl bg-blue-50/70 border border-blue-200/60 text-xs text-slate-700 leading-relaxed">
                <span class="font-bold text-fptBlue">📌 Ghi chú đề cương:</span> ${note}
            </div>
        ` : ''}

        <!-- Components Breakdown -->
        <div>
            <h4 class="font-extrabold text-sm text-slate-800 mb-2.5 flex items-center gap-2">
                <span>Cấu trúc tỷ trọng điểm thành phần</span>
                <span class="text-[11px] font-semibold text-slate-500">(Grading Structure)</span>
            </h4>
            ${compsTableHtml}
        </div>

        <!-- Completion Criteria -->
        <div class="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200">
            <h4 class="font-extrabold text-xs uppercase tracking-wider text-emerald-900 mb-2 flex items-center gap-1.5">
                <svg class="w-4 h-4 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                Điều kiện qua môn (Completion Criteria)
            </h4>
            <ul class="text-xs text-emerald-950 space-y-1.5 font-medium pl-1">
                <li class="flex items-center gap-2">
                    <span class="w-1.5 h-1.5 rounded-full bg-emerald-600"></span>
                    <span><strong>Điểm tổng kết môn (TBM môn)</strong>: &ge; 5.0 / 10.0</span>
                </li>
                <li class="flex items-center gap-2">
                    <span class="w-1.5 h-1.5 rounded-full bg-emerald-600"></span>
                    <span><strong>Điểm thi cuối kỳ (Final Exam - FE)</strong>: &ge; 4.0 / 10.0 (Không bị điểm liệt)</span>
                </li>
                <li class="flex items-center gap-2">
                    <span class="w-1.5 h-1.5 rounded-full bg-emerald-600"></span>
                    <span><strong>Điểm quá trình (PT, Assignment, Lab, PE)</strong>: &gt; 0 (Đã hoàn thành và nộp đầy đủ)</span>
                </li>
            </ul>
        </div>
    `;

    modal.classList.remove("hidden");
    modal.classList.add("flex");
}
const openSyllabusModal = openSyllabusDetailModal;

function closeSyllabusDetailModal() {
    const modal = document.getElementById("syllabus-detail-modal");
    if (!modal) return;
    modal.classList.add("hidden");
    modal.classList.remove("flex");
}
const closeSyllabusModal = closeSyllabusDetailModal;

function handleSyllabusModalBackdropClick(event) {
    const modal = document.getElementById("syllabus-detail-modal");
    if (event && (event.target === modal || event.target.id === 'syllabus-detail-modal')) {
        closeSyllabusDetailModal();
    }
}

// Global keyboard dismissal (Escape key) for all modals
if (typeof document !== 'undefined') {
    document.addEventListener("keydown", (e) => {
        if (e.key === "Escape" || e.key === "Esc" || e.keyCode === 27) {
            closeExportModal();
            closeEditTemplateModal();
            closeAddCustomSubjectModal();
            closeSyllabusDetailModal();
        }
    });
}

const fillSampleScores = fillSampleScoresForCurrentSemester;

if (typeof window !== "undefined") {
    window.switchView = switchView;
    window.downloadCertificatePdf = downloadCertificatePdf;
    window.fillSampleScores = fillSampleScores;
    window.exportCertificatePdf = exportCertificatePdf;
    window.handleExportModalBackdropClick = handleExportModalBackdropClick;
    window.renderSyllabusView = renderSyllabusView;
    window.setSyllabusSemester = setSyllabusSemester;
    window.selectSyllabusSemester = selectSyllabusSemester;
    window.setSyllabusGpaFilter = setSyllabusGpaFilter;
    window.filterSyllabusGPA = filterSyllabusGPA;
    window.handleSyllabusSearch = handleSyllabusSearch;
    window.clearSyllabusSearch = clearSyllabusSearch;
    window.openSyllabusDetailModal = openSyllabusDetailModal;
    window.openSyllabusModal = openSyllabusModal;
    window.closeSyllabusDetailModal = closeSyllabusDetailModal;
    window.closeSyllabusModal = closeSyllabusModal;
    window.handleSyllabusModalBackdropClick = handleSyllabusModalBackdropClick;
    window.toggleMobileNavMenu = toggleMobileNavMenu;
    window.toggleCertificateFitMode = toggleCertificateFitMode;
    window.applyCertificateFitMode = applyCertificateFitMode;
}

// ================================================================
// KHỞI ĐỘNG ỨNG DỤNG
// ================================================================
document.addEventListener("DOMContentLoaded", () => {
    initializeAppState();
    renderApp();
});

// Xuất module cho môi trường Node.js testing
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        AppState,
        initializeAppState,
        createSubjectState,
        initComponentState,
        calculateComponentScore,
        calculateSubjectScore,
        calculateSemesterResults,
        detectSemesterNum,
        applyComboTrackToSemester,
        applyCapstoneElectiveToSemester,
        setComboTrack,
        setCapstoneElective,
        renderApp,
        renderExportCard,
        downloadCertificatePng,
        downloadCertificatePdf,
        exportCertificatePdf,
        scrollToCalculator,
        downloadCertificateImage,
        copyCertificateToClipboard,
        captureCertificateCardSandbox,
        switchView,
        fillSampleScores,
        handleExportModalBackdropClick,
        SyllabusState,
        renderSyllabusView,
        setSyllabusSemester,
        selectSyllabusSemester,
        setSyllabusGpaFilter,
        filterSyllabusGPA,
        handleSyllabusSearch,
        clearSyllabusSearch,
        openSyllabusDetailModal,
        openSyllabusModal,
        closeSyllabusDetailModal,
        closeSyllabusModal,
        handleSyllabusModalBackdropClick,
        toggleMobileNavMenu,
        toggleCertificateFitMode,
        applyCertificateFitMode
    };
}
