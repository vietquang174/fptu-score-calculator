/**
 * Dữ liệu chương trình đào tạo ngành Kỹ thuật Phần mềm (BIT_SE_K20B) - FPT University
 * Căn cứ: Quyết định 1140/QĐ-ĐHFPT ngày 09/11/2026 (SYLLABUS_SE20.pdf, 145 tín chỉ)
 * và toàn bộ 75+ đề cương chi tiết môn học trong Syllabus Full.
 */

// =========================================================================
// 1. CÁC TEMPLATE MÔN HỌC MẶC ĐỊNH (Dành cho môn dự phòng hoặc tùy biến)
// =========================================================================
const COURSE_TEMPLATES = {
    theory_standard: {
        id: "theory_standard",
        name: "Lý thuyết chuẩn (PT + Assignment + FE)",
        components: [
            { id: "pt", name: "Progress Test", weight: 30, minScore: 0, parts: 2, isSubParts: true },
            { id: "ass", name: "Assignment", weight: 30, minScore: 0, parts: 2, isSubParts: true },
            { id: "fe", name: "Final Exam (FE)", weight: 40, minScore: 4.0, parts: 1, isSubParts: false, isFE: true }
        ],
        minAvgToPass: 5.0
    },
    practical_pe: {
        id: "practical_pe",
        name: "Lý thuyết + Thực hành PE (Lab + PT + Ass + PE + FE)",
        components: [
            { id: "lab", name: "Lab", weight: 10, minScore: 0, parts: 4, isSubParts: true },
            { id: "pt", name: "Progress Test", weight: 10, minScore: 0, parts: 2, isSubParts: true },
            { id: "ass", name: "Assignment", weight: 20, minScore: 0, parts: 1, isSubParts: false },
            { id: "pe", name: "Practical Exam (PE)", weight: 30, minScore: 0, parts: 1, isSubParts: false },
            { id: "fe", name: "Final Exam (FE)", weight: 30, minScore: 4.0, parts: 1, isSubParts: false, isFE: true }
        ],
        minAvgToPass: 5.0
    },
    online_coursera: {
        id: "online_coursera",
        name: "Môn Online / Coursera (Quiz + Ass + FE)",
        components: [
            { id: "quiz", name: "Quizzes / Exercises", weight: 30, minScore: 0, parts: 3, isSubParts: true },
            { id: "ass", name: "Assignment / Capstone", weight: 30, minScore: 0, parts: 1, isSubParts: false },
            { id: "fe", name: "Final Exam (FE)", weight: 40, minScore: 4.0, parts: 1, isSubParts: false, isFE: true }
        ],
        minAvgToPass: 5.0
    },
    project_swp: {
        id: "project_swp",
        name: "Đồ án / Project (Iteration + Defense)",
        components: [
            { id: "iter", name: "Tiến độ Iterations / Quá trình", weight: 50, minScore: 0, parts: 3, isSubParts: true },
            { id: "defense", name: "Bảo vệ đồ án (Final Defense)", weight: 50, minScore: 4.0, parts: 1, isSubParts: false, isFE: true }
        ],
        minAvgToPass: 5.0
    }
};

// =========================================================================
// 2. CHUYÊN NGÀNH TỰ CHỌN COMBO TRACKS (Kỳ 5, Kỳ 7, Kỳ 8)
// =========================================================================
const COMBO_TRACKS = {
    dotnet: {
        id: "dotnet",
        name: ".NET (Cross-Platform .NET)",
        nameVi: "Lập trình .NET (Cross-Platform .NET)",
        description: "Phát triển ứng dụng chuyên sâu trên nền tảng Microsoft .NET Core / C#",
        courses: {
            5: ["PRN212"],
            7: ["PRN222", "PRU213"],
            8: ["SE_COM4_ELE"]
        }
    },
    react: {
        id: "react",
        name: "React / NodeJS Fullstack",
        nameVi: "Web Fullstack (React / NodeJS)",
        description: "Phát triển ứng dụng web hiện đại với React, NodeJS và React Native",
        courses: {
            5: ["FER202"],
            7: ["SDN302", "MMA301"],
            8: ["SE_COM4_ELE"]
        }
    },
    ai: {
        id: "ai",
        name: "Artificial Intelligence (AI)",
        nameVi: "Trí tuệ nhân tạo (AI)",
        description: "Học máy, xử lý ngôn ngữ tự nhiên và thị giác máy tính với Python",
        courses: {
            5: ["PRP201c"],
            7: ["AIL304m", "DBM301"],
            8: ["SE_COM4_ELE"]
        }
    },
    java: {
        id: "java",
        name: "Intensive Java Enterprise",
        nameVi: "Java chuyên sâu (Intensive Java)",
        description: "Kiến trúc doanh nghiệp quy mô lớn với Spring Boot và Microservices",
        courses: {
            5: ["HSF302"],
            7: ["SBA301", "MSS301"],
            8: ["SE_COM4_ELE"]
        }
    },
    game: {
        id: "game",
        name: "Game Development",
        nameVi: "Phát triển Game (Game Dev)",
        description: "Thiết kế và phát triển game đa nền tảng với Unity 3D & C#",
        courses: {
            5: ["FGU301"],
            7: ["GDC301", "AGU301"],
            8: ["SE_COM4_ELE"]
        }
    },
    datascience: {
        id: "datascience",
        name: "Applied Data Science",
        nameVi: "Khoa học dữ liệu ứng dụng",
        description: "Phân tích, trực quan hóa và mô hình hóa dữ liệu lớn (Big Data)",
        courses: {
            5: ["PDS301m"],
            7: ["DHV301", "MDS301"],
            8: ["SE_COM4_ELE"]
        }
    },
    icdesign: {
        id: "icdesign",
        name: "Integrated Circuit (IC) Design",
        nameVi: "Thiết kế vi mạch (IC Design)",
        description: "Thiết kế mạch tích hợp VLSI, vi xử lý và hệ thống nhúng",
        courses: {
            5: ["ECI101"],
            7: ["MIP201", "DCD301"],
            8: ["SE_COM4_ELE"]
        }
    },
    japanese: {
        id: "japanese",
        name: "Japanese Bridge Engineer (BrSE)",
        nameVi: "Kỹ sư cầu nối Nhật Bản (JS / BrSE)",
        description: "Đào tạo kỹ sư phần mềm cầu nối thị trường Nhật Bản (N3/N2 & IT)",
        courses: {
            5: ["JPD133"],
            7: ["JPD316", "JIT401"],
            8: ["JIS401"]
        }
    }
};

// Aliases for combo keys (supporting COM_NET, COM_REACT, etc.)
COMBO_TRACKS.COM_NET = COMBO_TRACKS.dotnet;
COMBO_TRACKS.COM_REACT = COMBO_TRACKS.react;
COMBO_TRACKS.COM_AI = COMBO_TRACKS.ai;
COMBO_TRACKS.COM_JAVA = COMBO_TRACKS.java;
COMBO_TRACKS.COM_GAME = COMBO_TRACKS.game;
COMBO_TRACKS.COM_DS = COMBO_TRACKS.datascience;
COMBO_TRACKS.COM_IC = COMBO_TRACKS.icdesign;
COMBO_TRACKS.COM_JS = COMBO_TRACKS.japanese;

// Helper to look up combo track safely
function getComboTrack(trackId) {
    if (!trackId) return COMBO_TRACKS.dotnet;
    return COMBO_TRACKS[trackId] || COMBO_TRACKS[trackId.toLowerCase()] || COMBO_TRACKS.dotnet;
}

// =========================================================================
// 3. ĐỒ ÁN / KHÓA LUẬN TỐT NGHIỆP CAPSTONE ELECTIVES (Học kỳ 9)
// =========================================================================
const GRADUATION_ELECTIVES = [
    {
        code: "SEP490",
        nameVi: "Đồ án tốt nghiệp KTPM",
        nameEn: "SE Capstone Project",
        credits: 10,
        description: "Đồ án tốt nghiệp kỹ sư phần mềm tiêu chuẩn (50% Quá trình + 50% Bảo vệ)"
    },
    {
        code: "SET490",
        nameVi: "Khóa luận tốt nghiệp Kỹ thuật phần mềm",
        nameEn: "SE Graduation Thesis",
        credits: 10,
        description: "Khóa luận nghiên cứu học thuật chuyên sâu (Pilot từ FA26)"
    },
    {
        code: "EXE402",
        nameVi: "Dự án khởi nghiệp tốt nghiệp",
        nameEn: "Graduation Thesis on a Startup Project",
        credits: 10,
        description: "Dự án khởi nghiệp thực chiến tốt nghiệp (Pitching & Doanh thu)"
    },
    {
        code: "PIT490",
        nameVi: "Đồ án tốt nghiệp liên chuyên ngành CNTT",
        nameEn: "IT Interdisciplinary Graduation Project",
        credits: 10,
        description: "Đồ án tốt nghiệp liên chuyên ngành công nghệ thông tin"
    },
    {
        code: "GRC490",
        nameVi: "Khóa luận tốt nghiệp liên ngành QTKD - KTPM",
        nameEn: "Interdisciplinary Business - SE Thesis",
        credits: 10,
        description: "Khóa luận tốt nghiệp liên ngành Quản trị kinh doanh & Kỹ thuật phần mềm"
    }
];

// =========================================================================
// 4. CHI TIẾT CẤU TRÚC ĐIỂM (ĐỀ CƯƠNG CHI TIẾT CỦA 75+ MÔN HỌC KHÓA K20B)
// =========================================================================
const SUBJECT_SCHEMAS = {
    "OTP101": {
        "code": "OTP101",
        "nameVi": "Định hướng & Rèn luyện tập trung",
        "nameEn": "Orientation and General Training Program",
        "credits": 0,
        "isScored": false,
        "isPassFailOnly": true,
        "isConditionCourse": true,
        "hasDetailedSyllabus": true,
        "minAvgToPass": 5.0,
        "note": "Tuần lễ định hướng và Tháng rèn luyện tập trung FPTU (GDQP & Vovinam căn bản). Đạt điều kiện để vào chuyên ngành.",
        "components": [],
        "assessments": [],
        "passingCriteria": {
            "minTotal": 5.0,
            "minFE": 4.0
        }
    },
    "PEN": {
        "code": "PEN",
        "nameVi": "Tiếng Anh chuẩn bị",
        "nameEn": "Preparation English",
        "credits": 0,
        "isScored": false,
        "isPassFailOnly": true,
        "isConditionCourse": true,
        "hasDetailedSyllabus": true,
        "minAvgToPass": 5.0,
        "note": "Chương trình tiếng Anh dự bị theo cấp độ (PEN101 - PEN601). Đạt điều kiện để lên chuyên ngành.",
        "components": [],
        "assessments": [],
        "passingCriteria": {
            "minTotal": 5.0,
            "minFE": 4.0
        }
    },
    "PEN101": {
        "code": "PEN101",
        "nameVi": "Tiếng Anh chuẩn bị 1",
        "nameEn": "Preparation English 1",
        "credits": 0,
        "isScored": false,
        "isPassFailOnly": true,
        "isConditionCourse": true,
        "hasDetailedSyllabus": true,
        "minAvgToPass": 5.0,
        "note": "Tiếng Anh dự bị Level 1 (Pass/Fail).",
        "components": [],
        "assessments": [],
        "passingCriteria": {
            "minTotal": 5.0,
            "minFE": 4.0
        }
    },
    "VOV114": {
        "code": "VOV114",
        "nameVi": "Giáo dục thể chất 1 (Vovinam 1)",
        "nameEn": "Physical Education 1 (Vovinam 1)",
        "credits": 2,
        "isScored": false,
        "isPhysicalEducation": true,
        "isConditionCourse": true,
        "hasDetailedSyllabus": true,
        "minAvgToPass": 5.0,
        "note": "Môn giáo dục thể chất điều kiện (không tính TBM kỳ). Điều kiện qua môn: Thi thực hành FE >= 5.0",
        "components": [
            {
                "id": "fe",
                "name": "Final Exam (Thi thực hành Vovinam 1)",
                "weight": 100,
                "minScore": 5.0,
                "parts": 1,
                "isSubParts": false,
                "isFE": true,
                "note": "Thi kết thúc môn (Lý thuyết, kỹ thuật căn bản, thể lực). Cần >= 5.0 để Pass"
            }
        ],
        "assessments": [
            {
                "id": "fe",
                "name": "Final Exam (Thi thực hành Vovinam 1)",
                "weight": 100,
                "minScore": 5.0,
                "parts": 1,
                "isSubParts": false,
                "isFE": true,
                "note": "Thi kết thúc môn (Lý thuyết, kỹ thuật căn bản, thể lực). Cần >= 5.0 để Pass"
            }
        ],
        "passingCriteria": {
            "minTotal": 5.0,
            "minFE": 5.0
        }
    },
    "PHE_COM*1": {
        "code": "PHE_COM*1",
        "nameVi": "Giáo dục thể chất 1 (Vovinam 1)",
        "nameEn": "Physical Education 1",
        "credits": 2,
        "isScored": false,
        "isPhysicalEducation": true,
        "isConditionCourse": true,
        "aliasSyllabus": "VOV114",
        "hasDetailedSyllabus": true,
        "minAvgToPass": 5.0,
        "note": "Môn GDTC Vovinam 1. Không tính TBM, điều kiện thi FE >= 5.0 để Pass.",
        "components": [
            {
                "id": "fe",
                "name": "Final Exam (Thi thực hành Vovinam 1)",
                "weight": 100,
                "minScore": 5.0,
                "parts": 1,
                "isSubParts": false,
                "isFE": true,
                "note": "Thi kết thúc môn. Cần >= 5.0 để Pass"
            }
        ],
        "assessments": [
            {
                "id": "fe",
                "name": "Final Exam (Thi thực hành Vovinam 1)",
                "weight": 100,
                "minScore": 5.0,
                "parts": 1,
                "isSubParts": false,
                "isFE": true,
                "note": "Thi kết thúc môn. Cần >= 5.0 để Pass"
            }
        ],
        "passingCriteria": {
            "minTotal": 5.0,
            "minFE": 5.0
        }
    },
    "DTR103": {
        "code": "DTR103",
        "nameVi": "Nhạc cụ truyền thống (Đàn tranh)",
        "nameEn": "Traditional Musical Instrument (Dan Tranh)",
        "credits": 3,
        "isScored": true,
        "hasDetailedSyllabus": true,
        "minAvgToPass": 5.0,
        "note": "Môn năng khiếu nhạc cụ truyền thống FPTU - CÓ tính vào TBM kỳ.",
        "components": [
            {
                "id": "ass",
                "name": "Assignment (Bài tập định kỳ)",
                "weight": 15,
                "minScore": 0,
                "parts": 1,
                "isSubParts": false,
                "isFE": false,
                "note": "Kiểm tra định kỳ diễn tấu"
            },
            {
                "id": "part",
                "name": "In-class Participation (Chuyên cần)",
                "weight": 15,
                "minScore": 0,
                "parts": 1,
                "isSubParts": false,
                "isFE": false,
                "note": "Chuyên cần và thái độ học tập trên lớp"
            },
            {
                "id": "fe",
                "name": "Final Exam (Thực hành diễn tấu)",
                "weight": 70,
                "minScore": 4.0,
                "parts": 1,
                "isSubParts": false,
                "isFE": true,
                "note": "Thi thực hành diễn tấu tác phẩm trước hội đồng. Cần >= 4.0"
            }
        ],
        "assessments": [
            {
                "id": "ass",
                "name": "Assignment (Bài tập định kỳ)",
                "weight": 15,
                "minScore": 0,
                "parts": 1,
                "isSubParts": false,
                "isFE": false,
                "note": "Kiểm tra định kỳ diễn tấu"
            },
            {
                "id": "part",
                "name": "In-class Participation (Chuyên cần)",
                "weight": 15,
                "minScore": 0,
                "parts": 1,
                "isSubParts": false,
                "isFE": false,
                "note": "Chuyên cần và thái độ học tập trên lớp"
            },
            {
                "id": "fe",
                "name": "Final Exam (Thực hành diễn tấu)",
                "weight": 70,
                "minScore": 4.0,
                "parts": 1,
                "isSubParts": false,
                "isFE": true,
                "note": "Thi thực hành diễn tấu tác phẩm trước hội đồng. Cần >= 4.0"
            }
        ],
        "passingCriteria": {
            "minTotal": 5.0,
            "minFE": 4.0
        }
    },
    "TMI_ELE": {
        "code": "TMI_ELE",
        "nameVi": "Nhạc cụ truyền thống",
        "nameEn": "Traditional Musical Instrument",
        "credits": 3,
        "isScored": true,
        "aliasSyllabus": "DTR103",
        "hasDetailedSyllabus": true,
        "minAvgToPass": 5.0,
        "note": "Tự chọn nhạc cụ truyền thống FPTU (Đàn tranh, Sáo trúc, Đàn bầu...) - CÓ tính TBM kỳ.",
        "components": [
            {
                "id": "ass",
                "name": "Assignment (Bài tập định kỳ)",
                "weight": 15,
                "minScore": 0,
                "parts": 1,
                "isSubParts": false,
                "isFE": false
            },
            {
                "id": "part",
                "name": "In-class Participation (Chuyên cần)",
                "weight": 15,
                "minScore": 0,
                "parts": 1,
                "isSubParts": false,
                "isFE": false
            },
            {
                "id": "fe",
                "name": "Final Exam (Thực hành diễn tấu)",
                "weight": 70,
                "minScore": 4.0,
                "parts": 1,
                "isSubParts": false,
                "isFE": true,
                "note": "Cần >= 4.0"
            }
        ],
        "assessments": [
            {
                "id": "ass",
                "name": "Assignment (Bài tập định kỳ)",
                "weight": 15,
                "minScore": 0,
                "parts": 1,
                "isSubParts": false,
                "isFE": false
            },
            {
                "id": "part",
                "name": "In-class Participation (Chuyên cần)",
                "weight": 15,
                "minScore": 0,
                "parts": 1,
                "isSubParts": false,
                "isFE": false
            },
            {
                "id": "fe",
                "name": "Final Exam (Thực hành diễn tấu)",
                "weight": 70,
                "minScore": 4.0,
                "parts": 1,
                "isSubParts": false,
                "isFE": true,
                "note": "Cần >= 4.0"
            }
        ],
        "passingCriteria": {
            "minTotal": 5.0,
            "minFE": 4.0
        }
    },
    "PRF192": {
        "code": "PRF192",
        "nameVi": "Cơ sở lập trình (C)",
        "nameEn": "Programming Fundamentals",
        "credits": 3,
        "isScored": true,
        "hasDetailedSyllabus": true,
        "minAvgToPass": 5.0,
        "note": "Môn cơ sở ngành cốt lõi. Cần qua PE và FE >= 4.0.",
        "components": [
            {
                "id": "ass",
                "name": "Assignment",
                "weight": 15,
                "minScore": 0,
                "parts": 1,
                "isSubParts": false,
                "isFE": false,
                "note": "Bài tập lớn lập trình C"
            },
            {
                "id": "pt",
                "name": "Progress Test",
                "weight": 15,
                "minScore": 0,
                "parts": 2,
                "isSubParts": true,
                "note": "2 bài kiểm tra tiến độ"
            },
            {
                "id": "ws",
                "name": "Workshop",
                "weight": 10,
                "minScore": 0,
                "parts": 5,
                "isSubParts": true,
                "note": "5 bài thực hành Workshop"
            },
            {
                "id": "pe",
                "name": "Practical Exam (PE)",
                "weight": 30,
                "minScore": 0,
                "parts": 1,
                "isSubParts": false,
                "isFE": false,
                "note": "Thi thực hành lập trình C trên máy 85 phút. Điểm > 0"
            },
            {
                "id": "fe",
                "name": "Final Exam (FE)",
                "weight": 30,
                "minScore": 4.0,
                "parts": 1,
                "isSubParts": false,
                "isFE": true,
                "note": "Thi trắc nghiệm cuối kỳ EOS. Cần >= 4.0"
            }
        ],
        "assessments": [
            {
                "id": "ass",
                "name": "Assignment",
                "weight": 15,
                "minScore": 0,
                "parts": 1,
                "isSubParts": false,
                "isFE": false,
                "note": "Bài tập lớn lập trình C"
            },
            {
                "id": "pt",
                "name": "Progress Test",
                "weight": 15,
                "minScore": 0,
                "parts": 2,
                "isSubParts": true,
                "note": "2 bài kiểm tra tiến độ"
            },
            {
                "id": "ws",
                "name": "Workshop",
                "weight": 10,
                "minScore": 0,
                "parts": 5,
                "isSubParts": true,
                "note": "5 bài thực hành Workshop"
            },
            {
                "id": "pe",
                "name": "Practical Exam (PE)",
                "weight": 30,
                "minScore": 0,
                "parts": 1,
                "isSubParts": false,
                "isFE": false,
                "note": "Thi thực hành lập trình C trên máy 85 phút. Điểm > 0"
            },
            {
                "id": "fe",
                "name": "Final Exam (FE)",
                "weight": 30,
                "minScore": 4.0,
                "parts": 1,
                "isSubParts": false,
                "isFE": true,
                "note": "Thi trắc nghiệm cuối kỳ EOS. Cần >= 4.0"
            }
        ],
        "passingCriteria": {
            "minTotal": 5.0,
            "minFE": 4.0
        }
    },
    "MAE101": {
        "code": "MAE101",
        "nameVi": "Toán cho ngành kỹ thuật",
        "nameEn": "Mathematics for Engineering",
        "credits": 3,
        "isScored": true,
        "hasDetailedSyllabus": true,
        "minAvgToPass": 5.0,
        "components": [
            {
                "id": "ass",
                "name": "Assignments/Exercises",
                "weight": 30,
                "minScore": 0,
                "parts": 3,
                "isSubParts": true,
                "note": "3 bài tập / bài tập lớn"
            },
            {
                "id": "pt",
                "name": "Progress Test",
                "weight": 30,
                "minScore": 0,
                "parts": 3,
                "isSubParts": true,
                "note": "3 bài kiểm tra tiến độ"
            },
            {
                "id": "fe",
                "name": "Final Exam (FE)",
                "weight": 40,
                "minScore": 4.0,
                "parts": 1,
                "isSubParts": false,
                "isFE": true,
                "note": "Thi trắc nghiệm EOS 60 phút. Cần >= 4.0"
            }
        ],
        "assessments": [
            {
                "id": "ass",
                "name": "Assignments/Exercises",
                "weight": 30,
                "minScore": 0,
                "parts": 3,
                "isSubParts": true,
                "note": "3 bài tập / bài tập lớn"
            },
            {
                "id": "pt",
                "name": "Progress Test",
                "weight": 30,
                "minScore": 0,
                "parts": 3,
                "isSubParts": true,
                "note": "3 bài kiểm tra tiến độ"
            },
            {
                "id": "fe",
                "name": "Final Exam (FE)",
                "weight": 40,
                "minScore": 4.0,
                "parts": 1,
                "isSubParts": false,
                "isFE": true,
                "note": "Thi trắc nghiệm EOS 60 phút. Cần >= 4.0"
            }
        ],
        "passingCriteria": {
            "minTotal": 5.0,
            "minFE": 4.0
        }
    },
    "CEA201": {
        "code": "CEA201",
        "nameVi": "Tổ chức & Kiến trúc máy tính",
        "nameEn": "Computer Organization and Architecture",
        "credits": 3,
        "isScored": true,
        "hasDetailedSyllabus": true,
        "minAvgToPass": 5.0,
        "components": [
            {
                "id": "ass",
                "name": "Assignment",
                "weight": 20,
                "minScore": 0,
                "parts": 1,
                "isSubParts": false,
                "isFE": false,
                "note": "Bài tập lớn kiến trúc máy tính"
            },
            {
                "id": "ex",
                "name": "Exercises / AI Edunext Activities",
                "weight": 40,
                "minScore": 0,
                "parts": 4,
                "isSubParts": true,
                "note": "Hoạt động AI Edunext và bài tập trên lớp"
            },
            {
                "id": "fe",
                "name": "Final Exam (FE)",
                "weight": 40,
                "minScore": 4.0,
                "parts": 1,
                "isSubParts": false,
                "isFE": true,
                "note": "Thi trắc nghiệm EOS 50 câu. Cần >= 4.0"
            }
        ],
        "assessments": [
            {
                "id": "ass",
                "name": "Assignment",
                "weight": 20,
                "minScore": 0,
                "parts": 1,
                "isSubParts": false,
                "isFE": false,
                "note": "Bài tập lớn kiến trúc máy tính"
            },
            {
                "id": "ex",
                "name": "Exercises / AI Edunext Activities",
                "weight": 40,
                "minScore": 0,
                "parts": 4,
                "isSubParts": true,
                "note": "Hoạt động AI Edunext và bài tập trên lớp"
            },
            {
                "id": "fe",
                "name": "Final Exam (FE)",
                "weight": 40,
                "minScore": 4.0,
                "parts": 1,
                "isSubParts": false,
                "isFE": true,
                "note": "Thi trắc nghiệm EOS 50 câu. Cần >= 4.0"
            }
        ],
        "passingCriteria": {
            "minTotal": 5.0,
            "minFE": 4.0
        }
    },
    "CSI106": {
        "code": "CSI106",
        "nameVi": "Nhập môn khoa học máy tính",
        "nameEn": "Introduction to Computer Science",
        "credits": 3,
        "isScored": true,
        "hasDetailedSyllabus": true,
        "minAvgToPass": 5.0,
        "components": [
            {
                "id": "pres",
                "name": "Group Presentation",
                "weight": 10,
                "minScore": 0,
                "parts": 2,
                "isSubParts": true,
                "note": "2 bài thuyết trình nhóm"
            },
            {
                "id": "lab",
                "name": "Lab",
                "weight": 20,
                "minScore": 0,
                "parts": 2,
                "isSubParts": true,
                "note": "2 bài thực hành Lab"
            },
            {
                "id": "pt",
                "name": "Progress Test",
                "weight": 30,
                "minScore": 0,
                "parts": 3,
                "isSubParts": true,
                "note": "3 bài kiểm tra tiến độ"
            },
            {
                "id": "fe",
                "name": "Final Exam (FE)",
                "weight": 40,
                "minScore": 4.0,
                "parts": 1,
                "isSubParts": false,
                "isFE": true,
                "note": "Thi trắc nghiệm EOS 60 câu. Cần >= 4.0"
            }
        ],
        "assessments": [
            {
                "id": "pres",
                "name": "Group Presentation",
                "weight": 10,
                "minScore": 0,
                "parts": 2,
                "isSubParts": true,
                "note": "2 bài thuyết trình nhóm"
            },
            {
                "id": "lab",
                "name": "Lab",
                "weight": 20,
                "minScore": 0,
                "parts": 2,
                "isSubParts": true,
                "note": "2 bài thực hành Lab"
            },
            {
                "id": "pt",
                "name": "Progress Test",
                "weight": 30,
                "minScore": 0,
                "parts": 3,
                "isSubParts": true,
                "note": "3 bài kiểm tra tiến độ"
            },
            {
                "id": "fe",
                "name": "Final Exam (FE)",
                "weight": 40,
                "minScore": 4.0,
                "parts": 1,
                "isSubParts": false,
                "isFE": true,
                "note": "Thi trắc nghiệm EOS 60 câu. Cần >= 4.0"
            }
        ],
        "passingCriteria": {
            "minTotal": 5.0,
            "minFE": 4.0
        }
    },
    "SSL101c": {
        "code": "SSL101c",
        "nameVi": "Kỹ năng học tập đại học",
        "nameEn": "Academic Skills for University Success",
        "credits": 3,
        "isScored": true,
        "hasDetailedSyllabus": true,
        "minAvgToPass": 5.0,
        "note": "Môn học trực tuyến Coursera (100% TE). Điều kiện dự thi: Hoàn thành chứng chỉ Coursera trước hạn.",
        "components": [
            {
                "id": "fe",
                "name": "Theoretical Exam (TE / FE)",
                "weight": 100,
                "minScore": 4.0,
                "parts": 1,
                "isSubParts": false,
                "isFE": true,
                "note": "Thi trắc nghiệm EOS 60 câu trắc nghiệm. Cần >= 4.0"
            }
        ],
        "assessments": [
            {
                "id": "fe",
                "name": "Theoretical Exam (TE / FE)",
                "weight": 100,
                "minScore": 4.0,
                "parts": 1,
                "isSubParts": false,
                "isFE": true,
                "note": "Thi trắc nghiệm EOS 60 câu trắc nghiệm. Cần >= 4.0"
            }
        ],
        "passingCriteria": {
            "minTotal": 5.0,
            "minFE": 4.0
        }
    },
    "VOV124": {
        "code": "VOV124",
        "nameVi": "Giáo dục thể chất 2 (Vovinam 2)",
        "nameEn": "Physical Education 2 (Vovinam 2)",
        "credits": 2,
        "isScored": false,
        "isPhysicalEducation": true,
        "isConditionCourse": true,
        "hasDetailedSyllabus": true,
        "minAvgToPass": 5.0,
        "note": "Môn giáo dục thể chất điều kiện (không tính TBM kỳ). Điều kiện qua môn: Thi thực hành FE >= 5.0",
        "components": [
            {
                "id": "fe",
                "name": "Final Exam (Thi thực hành Vovinam 2)",
                "weight": 100,
                "minScore": 5.0,
                "parts": 1,
                "isSubParts": false,
                "isFE": true,
                "note": "Thi thực hành kỹ thuật Vovinam 2. Cần >= 5.0 để Pass"
            }
        ],
        "assessments": [
            {
                "id": "fe",
                "name": "Final Exam (Thi thực hành Vovinam 2)",
                "weight": 100,
                "minScore": 5.0,
                "parts": 1,
                "isSubParts": false,
                "isFE": true,
                "note": "Thi thực hành kỹ thuật Vovinam 2. Cần >= 5.0 để Pass"
            }
        ],
        "passingCriteria": {
            "minTotal": 5.0,
            "minFE": 5.0
        }
    },
    "PHE_COM*2": {
        "code": "PHE_COM*2",
        "nameVi": "Giáo dục thể chất 2 (Vovinam 2)",
        "nameEn": "Physical Education 2",
        "credits": 2,
        "isScored": false,
        "isPhysicalEducation": true,
        "isConditionCourse": true,
        "aliasSyllabus": "VOV124",
        "hasDetailedSyllabus": true,
        "minAvgToPass": 5.0,
        "note": "Không tính vào TBM kỳ. Điều kiện thi đạt >= 5.0 để Pass.",
        "components": [
            {
                "id": "fe",
                "name": "Final Exam (Thi thực hành Vovinam 2)",
                "weight": 100,
                "minScore": 5.0,
                "parts": 1,
                "isSubParts": false,
                "isFE": true,
                "note": "Cần >= 5.0 để Pass"
            }
        ],
        "assessments": [
            {
                "id": "fe",
                "name": "Final Exam (Thi thực hành Vovinam 2)",
                "weight": 100,
                "minScore": 5.0,
                "parts": 1,
                "isSubParts": false,
                "isFE": true,
                "note": "Cần >= 5.0 để Pass"
            }
        ],
        "passingCriteria": {
            "minTotal": 5.0,
            "minFE": 5.0
        }
    },
    "MAD101": {
        "code": "MAD101",
        "nameVi": "Toán rời rạc",
        "nameEn": "Discrete Mathematics",
        "credits": 3,
        "isScored": true,
        "hasDetailedSyllabus": true,
        "minAvgToPass": 5.0,
        "components": [
            {
                "id": "pt",
                "name": "Progress Test",
                "weight": 30,
                "minScore": 0,
                "parts": 3,
                "isSubParts": true,
                "note": "3 bài PT. Điểm TB > 0"
            },
            {
                "id": "ass",
                "name": "Assignments/Exercises",
                "weight": 20,
                "minScore": 0,
                "parts": 2,
                "isSubParts": true,
                "note": "2 bài tập lớn/trên lớp. Điểm TB > 0"
            },
            {
                "id": "prog_ass",
                "name": "Programming Assignment",
                "weight": 10,
                "minScore": 0,
                "parts": 1,
                "isSubParts": false,
                "note": "1 bài lập trình giải thuật. Điểm > 0"
            },
            {
                "id": "fe",
                "name": "Final Exam (FE)",
                "weight": 40,
                "minScore": 4.0,
                "parts": 1,
                "isSubParts": false,
                "isFE": true,
                "note": "Thi trên máy tính EOS. Điểm >= 4.0"
            }
        ],
        "assessments": [
            {
                "id": "pt",
                "name": "Progress Test",
                "weight": 30,
                "minScore": 0,
                "parts": 3,
                "isSubParts": true,
                "note": "3 bài PT. Điểm TB > 0"
            },
            {
                "id": "ass",
                "name": "Assignments/Exercises",
                "weight": 20,
                "minScore": 0,
                "parts": 2,
                "isSubParts": true,
                "note": "2 bài tập lớn/trên lớp. Điểm TB > 0"
            },
            {
                "id": "prog_ass",
                "name": "Programming Assignment",
                "weight": 10,
                "minScore": 0,
                "parts": 1,
                "isSubParts": false,
                "note": "1 bài lập trình giải thuật. Điểm > 0"
            },
            {
                "id": "fe",
                "name": "Final Exam (FE)",
                "weight": 40,
                "minScore": 4.0,
                "parts": 1,
                "isSubParts": false,
                "isFE": true,
                "note": "Thi trên máy tính EOS. Điểm >= 4.0"
            }
        ],
        "passingCriteria": {
            "minTotal": 5.0,
            "minFE": 4.0
        }
    },
    "PRO192": {
        "code": "PRO192",
        "nameVi": "Lập trình hướng đối tượng (Java)",
        "nameEn": "Object-Oriented Programming",
        "credits": 3,
        "isScored": true,
        "hasDetailedSyllabus": true,
        "minAvgToPass": 5.0,
        "components": [
            {
                "id": "ass",
                "name": "Assignment",
                "weight": 20,
                "minScore": 0,
                "parts": 1,
                "isSubParts": false,
                "isFE": false,
                "note": "1 bài tập lớn OOP Java"
            },
            {
                "id": "lab",
                "name": "Lab exercises",
                "weight": 10,
                "minScore": 0,
                "parts": 4,
                "isSubParts": true,
                "note": "Các bài tập Lab thực hành trên lớp"
            },
            {
                "id": "pt",
                "name": "Progress Test",
                "weight": 10,
                "minScore": 0,
                "parts": 2,
                "isSubParts": true,
                "note": "2 bài kiểm tra tiến độ"
            },
            {
                "id": "pe",
                "name": "Practical Exam (PE)",
                "weight": 30,
                "minScore": 0,
                "parts": 1,
                "isSubParts": false,
                "isFE": false,
                "note": "Thi thực hành lập trình Java (85 phút). Điểm > 0"
            },
            {
                "id": "fe",
                "name": "Final Exam (FE)",
                "weight": 30,
                "minScore": 4.0,
                "parts": 1,
                "isSubParts": false,
                "isFE": true,
                "note": "Thi lý thuyết cuối kỳ EOS. Cần >= 4.0"
            }
        ],
        "assessments": [
            {
                "id": "ass",
                "name": "Assignment",
                "weight": 20,
                "minScore": 0,
                "parts": 1,
                "isSubParts": false,
                "isFE": false,
                "note": "1 bài tập lớn OOP Java"
            },
            {
                "id": "lab",
                "name": "Lab exercises",
                "weight": 10,
                "minScore": 0,
                "parts": 4,
                "isSubParts": true,
                "note": "Các bài tập Lab thực hành trên lớp"
            },
            {
                "id": "pt",
                "name": "Progress Test",
                "weight": 10,
                "minScore": 0,
                "parts": 2,
                "isSubParts": true,
                "note": "2 bài kiểm tra tiến độ"
            },
            {
                "id": "pe",
                "name": "Practical Exam (PE)",
                "weight": 30,
                "minScore": 0,
                "parts": 1,
                "isSubParts": false,
                "isFE": false,
                "note": "Thi thực hành lập trình Java (85 phút). Điểm > 0"
            },
            {
                "id": "fe",
                "name": "Final Exam (FE)",
                "weight": 30,
                "minScore": 4.0,
                "parts": 1,
                "isSubParts": false,
                "isFE": true,
                "note": "Thi lý thuyết cuối kỳ EOS. Cần >= 4.0"
            }
        ],
        "passingCriteria": {
            "minTotal": 5.0,
            "minFE": 4.0
        }
    },
    "OSG202": {
        "code": "OSG202",
        "nameVi": "Hệ điều hành",
        "nameEn": "Operating Systems",
        "credits": 3,
        "isScored": true,
        "hasDetailedSyllabus": true,
        "minAvgToPass": 5.0,
        "components": [
            {
                "id": "lab",
                "name": "Lab (Linux Shell)",
                "weight": 20,
                "minScore": 0,
                "parts": 3,
                "isSubParts": true,
                "note": "Thực hành Linux shell scripts"
            },
            {
                "id": "pt",
                "name": "Progress Test",
                "weight": 20,
                "minScore": 0,
                "parts": 2,
                "isSubParts": true,
                "note": "2 bài kiểm tra tiến độ"
            },
            {
                "id": "ass",
                "name": "Assignment / Project",
                "weight": 20,
                "minScore": 0,
                "parts": 1,
                "isSubParts": false,
                "isFE": false,
                "note": "Bài tập lớn môn Hệ điều hành"
            },
            {
                "id": "fe",
                "name": "Final Exam (FE)",
                "weight": 40,
                "minScore": 4.0,
                "parts": 1,
                "isSubParts": false,
                "isFE": true,
                "note": "Thi lý thuyết cuối kỳ EOS. Cần >= 4.0"
            }
        ],
        "assessments": [
            {
                "id": "lab",
                "name": "Lab (Linux Shell)",
                "weight": 20,
                "minScore": 0,
                "parts": 3,
                "isSubParts": true,
                "note": "Thực hành Linux shell scripts"
            },
            {
                "id": "pt",
                "name": "Progress Test",
                "weight": 20,
                "minScore": 0,
                "parts": 2,
                "isSubParts": true,
                "note": "2 bài kiểm tra tiến độ"
            },
            {
                "id": "ass",
                "name": "Assignment / Project",
                "weight": 20,
                "minScore": 0,
                "parts": 1,
                "isSubParts": false,
                "isFE": false,
                "note": "Bài tập lớn môn Hệ điều hành"
            },
            {
                "id": "fe",
                "name": "Final Exam (FE)",
                "weight": 40,
                "minScore": 4.0,
                "parts": 1,
                "isSubParts": false,
                "isFE": true,
                "note": "Thi lý thuyết cuối kỳ EOS. Cần >= 4.0"
            }
        ],
        "passingCriteria": {
            "minTotal": 5.0,
            "minFE": 4.0
        }
    },
    "NWC204": {
        "code": "NWC204",
        "nameVi": "Mạng máy tính",
        "nameEn": "Computer Networking",
        "credits": 3,
        "isScored": true,
        "hasDetailedSyllabus": true,
        "minAvgToPass": 5.0,
        "components": [
            {
                "id": "lab",
                "name": "Lab & Course Project",
                "weight": 20,
                "minScore": 0,
                "parts": 2,
                "isSubParts": true,
                "note": "Lab và dự án môn học"
            },
            {
                "id": "pt",
                "name": "Progress Test",
                "weight": 30,
                "minScore": 0,
                "parts": 3,
                "isSubParts": true,
                "note": "3 bài kiểm tra tiến độ"
            },
            {
                "id": "pe",
                "name": "Practical Exam (PE)",
                "weight": 20,
                "minScore": 0,
                "parts": 1,
                "isSubParts": false,
                "isFE": false,
                "note": "Thi thực hành Cisco Packet Tracer 85 phút. Điểm > 0"
            },
            {
                "id": "fe",
                "name": "Final Exam (FE)",
                "weight": 30,
                "minScore": 4.0,
                "parts": 1,
                "isSubParts": false,
                "isFE": true,
                "note": "Thi lý thuyết cuối kỳ EOS 60 phút. Cần >= 4.0"
            }
        ],
        "assessments": [
            {
                "id": "lab",
                "name": "Lab & Course Project",
                "weight": 20,
                "minScore": 0,
                "parts": 2,
                "isSubParts": true,
                "note": "Lab và dự án môn học"
            },
            {
                "id": "pt",
                "name": "Progress Test",
                "weight": 30,
                "minScore": 0,
                "parts": 3,
                "isSubParts": true,
                "note": "3 bài kiểm tra tiến độ"
            },
            {
                "id": "pe",
                "name": "Practical Exam (PE)",
                "weight": 20,
                "minScore": 0,
                "parts": 1,
                "isSubParts": false,
                "isFE": false,
                "note": "Thi thực hành Cisco Packet Tracer 85 phút. Điểm > 0"
            },
            {
                "id": "fe",
                "name": "Final Exam (FE)",
                "weight": 30,
                "minScore": 4.0,
                "parts": 1,
                "isSubParts": false,
                "isFE": true,
                "note": "Thi lý thuyết cuối kỳ EOS 60 phút. Cần >= 4.0"
            }
        ],
        "passingCriteria": {
            "minTotal": 5.0,
            "minFE": 4.0
        }
    },
    "WED201c": {
        "code": "WED201c",
        "nameVi": "Thiết kế Web",
        "nameEn": "Web Design",
        "credits": 3,
        "isScored": true,
        "hasDetailedSyllabus": true,
        "minAvgToPass": 5.0,
        "note": "Môn học kết hợp Coursera (50% PE + 50% TE). Yêu cầu hoàn tất khóa Coursera để dự thi.",
        "components": [
            {
                "id": "pe",
                "name": "Practical Assignment / PE",
                "weight": 50,
                "minScore": 4.0,
                "parts": 1,
                "isSubParts": false,
                "isFE": false,
                "note": "Thi thực hành / Dự án thiết kế Web. Cần >= 4.0"
            },
            {
                "id": "fe",
                "name": "Theoretical Exam (TE / FE)",
                "weight": 50,
                "minScore": 4.0,
                "parts": 1,
                "isSubParts": false,
                "isFE": true,
                "note": "Thi trắc nghiệm lý thuyết cuối kỳ EOS. Cần >= 4.0"
            }
        ],
        "assessments": [
            {
                "id": "pe",
                "name": "Practical Assignment / PE",
                "weight": 50,
                "minScore": 4.0,
                "parts": 1,
                "isSubParts": false,
                "isFE": false,
                "note": "Thi thực hành / Dự án thiết kế Web. Cần >= 4.0"
            },
            {
                "id": "fe",
                "name": "Theoretical Exam (TE / FE)",
                "weight": 50,
                "minScore": 4.0,
                "parts": 1,
                "isSubParts": false,
                "isFE": true,
                "note": "Thi trắc nghiệm lý thuyết cuối kỳ EOS. Cần >= 4.0"
            }
        ],
        "passingCriteria": {
            "minTotal": 5.0,
            "minFE": 4.0
        }
    },
    "VOV134": {
        "code": "VOV134",
        "nameVi": "Giáo dục thể chất 3 (Vovinam 3)",
        "nameEn": "Physical Education 3 (Vovinam 3)",
        "credits": 2,
        "isScored": false,
        "isPhysicalEducation": true,
        "isConditionCourse": true,
        "hasDetailedSyllabus": true,
        "minAvgToPass": 5.0,
        "note": "Môn giáo dục thể chất điều kiện (không tính TBM kỳ). Điều kiện qua môn: Thi thực hành FE >= 5.0",
        "components": [
            {
                "id": "fe",
                "name": "Final Exam (Thi thực hành Vovinam 3)",
                "weight": 100,
                "minScore": 5.0,
                "parts": 1,
                "isSubParts": false,
                "isFE": true,
                "note": "Thi thực hành kỹ thuật Vovinam 3. Cần >= 5.0 để Pass"
            }
        ],
        "assessments": [
            {
                "id": "fe",
                "name": "Final Exam (Thi thực hành Vovinam 3)",
                "weight": 100,
                "minScore": 5.0,
                "parts": 1,
                "isSubParts": false,
                "isFE": true,
                "note": "Thi thực hành kỹ thuật Vovinam 3. Cần >= 5.0 để Pass"
            }
        ],
        "passingCriteria": {
            "minTotal": 5.0,
            "minFE": 5.0
        }
    },
    "PHE_COM*3": {
        "code": "PHE_COM*3",
        "nameVi": "Giáo dục thể chất 3 (Vovinam 3)",
        "nameEn": "Physical Education 3",
        "credits": 2,
        "isScored": false,
        "isPhysicalEducation": true,
        "isConditionCourse": true,
        "aliasSyllabus": "VOV134",
        "hasDetailedSyllabus": true,
        "minAvgToPass": 5.0,
        "note": "Không tính vào TBM kỳ. Điều kiện thi đạt >= 5.0 để Pass.",
        "components": [
            {
                "id": "fe",
                "name": "Final Exam (Thi thực hành Vovinam 3)",
                "weight": 100,
                "minScore": 5.0,
                "parts": 1,
                "isSubParts": false,
                "isFE": true,
                "note": "Cần >= 5.0 để Pass"
            }
        ],
        "assessments": [
            {
                "id": "fe",
                "name": "Final Exam (Thi thực hành Vovinam 3)",
                "weight": 100,
                "minScore": 5.0,
                "parts": 1,
                "isSubParts": false,
                "isFE": true,
                "note": "Cần >= 5.0 để Pass"
            }
        ],
        "passingCriteria": {
            "minTotal": 5.0,
            "minFE": 5.0
        }
    },
    "DBI202": {
        "code": "DBI202",
        "nameVi": "Các hệ cơ sở dữ liệu",
        "nameEn": "Introduction to Databases",
        "credits": 3,
        "isScored": true,
        "hasDetailedSyllabus": true,
        "minAvgToPass": 5.0,
        "components": [
            {
                "id": "ass",
                "name": "Assignment",
                "weight": 20,
                "minScore": 0,
                "parts": 1,
                "isSubParts": false,
                "note": "1 bài tập lớn thiết kế CSDL. Điểm > 0"
            },
            {
                "id": "lab",
                "name": "Lab Exercises",
                "weight": 10,
                "minScore": 0,
                "parts": 5,
                "isSubParts": true,
                "note": "5 bài thực hành Lab. Điểm TB > 0"
            },
            {
                "id": "pe",
                "name": "Practical Exam (PE)",
                "weight": 30,
                "minScore": 0,
                "parts": 1,
                "isSubParts": false,
                "note": "1 bài thi thực hành truy vấn SQL 85 phút. Điểm > 0"
            },
            {
                "id": "pt",
                "name": "Progress Test",
                "weight": 10,
                "minScore": 0,
                "parts": 2,
                "isSubParts": true,
                "note": "2 bài trắc nghiệm LMS. Điểm TB > 0"
            },
            {
                "id": "fe",
                "name": "Final Exam (FE)",
                "weight": 30,
                "minScore": 4.0,
                "parts": 1,
                "isSubParts": false,
                "isFE": true,
                "note": "Thi lý thuyết cuối kỳ 60 phút trắc nghiệm. Điểm >= 4.0"
            }
        ],
        "assessments": [
            {
                "id": "ass",
                "name": "Assignment",
                "weight": 20,
                "minScore": 0,
                "parts": 1,
                "isSubParts": false,
                "note": "1 bài tập lớn thiết kế CSDL. Điểm > 0"
            },
            {
                "id": "lab",
                "name": "Lab Exercises",
                "weight": 10,
                "minScore": 0,
                "parts": 5,
                "isSubParts": true,
                "note": "5 bài thực hành Lab. Điểm TB > 0"
            },
            {
                "id": "pe",
                "name": "Practical Exam (PE)",
                "weight": 30,
                "minScore": 0,
                "parts": 1,
                "isSubParts": false,
                "note": "1 bài thi thực hành truy vấn SQL 85 phút. Điểm > 0"
            },
            {
                "id": "pt",
                "name": "Progress Test",
                "weight": 10,
                "minScore": 0,
                "parts": 2,
                "isSubParts": true,
                "note": "2 bài trắc nghiệm LMS. Điểm TB > 0"
            },
            {
                "id": "fe",
                "name": "Final Exam (FE)",
                "weight": 30,
                "minScore": 4.0,
                "parts": 1,
                "isSubParts": false,
                "isFE": true,
                "note": "Thi lý thuyết cuối kỳ 60 phút trắc nghiệm. Điểm >= 4.0"
            }
        ],
        "passingCriteria": {
            "minTotal": 5.0,
            "minFE": 4.0
        }
    },
    "MAS291": {
        "code": "MAS291",
        "nameVi": "Xác suất thống kê",
        "nameEn": "Statistics & Probability",
        "credits": 3,
        "isScored": true,
        "hasDetailedSyllabus": true,
        "minAvgToPass": 5.0,
        "components": [
            {
                "id": "ass",
                "name": "Assignment",
                "weight": 20,
                "minScore": 0,
                "parts": 2,
                "isSubParts": true,
                "note": "2 bài tập lớn"
            },
            {
                "id": "comp_prj",
                "name": "Computer Project (R/Python)",
                "weight": 15,
                "minScore": 0,
                "parts": 1,
                "isSubParts": false,
                "isFE": false,
                "note": "Dự án phân tích dữ liệu thống kê (R / Python)"
            },
            {
                "id": "pt",
                "name": "Progress Test",
                "weight": 30,
                "minScore": 0,
                "parts": 3,
                "isSubParts": true,
                "note": "3 bài kiểm tra tiến độ"
            },
            {
                "id": "fe",
                "name": "Final Exam (FE)",
                "weight": 35,
                "minScore": 4.0,
                "parts": 1,
                "isSubParts": false,
                "isFE": true,
                "note": "Thi cuối kỳ EOS. Cần >= 4.0"
            }
        ],
        "assessments": [
            {
                "id": "ass",
                "name": "Assignment",
                "weight": 20,
                "minScore": 0,
                "parts": 2,
                "isSubParts": true,
                "note": "2 bài tập lớn"
            },
            {
                "id": "comp_prj",
                "name": "Computer Project (R/Python)",
                "weight": 15,
                "minScore": 0,
                "parts": 1,
                "isSubParts": false,
                "isFE": false,
                "note": "Dự án phân tích dữ liệu thống kê (R / Python)"
            },
            {
                "id": "pt",
                "name": "Progress Test",
                "weight": 30,
                "minScore": 0,
                "parts": 3,
                "isSubParts": true,
                "note": "3 bài kiểm tra tiến độ"
            },
            {
                "id": "fe",
                "name": "Final Exam (FE)",
                "weight": 35,
                "minScore": 4.0,
                "parts": 1,
                "isSubParts": false,
                "isFE": true,
                "note": "Thi cuối kỳ EOS. Cần >= 4.0"
            }
        ],
        "passingCriteria": {
            "minTotal": 5.0,
            "minFE": 4.0
        }
    },
    "SWE202c": {
        "code": "SWE202c",
        "nameVi": "Nhập môn Kỹ thuật phần mềm",
        "nameEn": "Introduction to Software Engineering",
        "credits": 3,
        "isScored": true,
        "hasDetailedSyllabus": true,
        "minAvgToPass": 5.0,
        "note": "Môn học kết hợp Coursera (50% PE + 50% TE).",
        "components": [
            {
                "id": "pe",
                "name": "Capstone Assignment / Project (PE)",
                "weight": 50,
                "minScore": 4.0,
                "parts": 1,
                "isSubParts": false,
                "isFE": false,
                "note": "Dự án / Bài tập thực hành phần mềm. Cần >= 4.0"
            },
            {
                "id": "fe",
                "name": "Theoretical Exam (TE / FE)",
                "weight": 50,
                "minScore": 4.0,
                "parts": 1,
                "isSubParts": false,
                "isFE": true,
                "note": "Thi lý thuyết cuối kỳ EOS. Cần >= 4.0"
            }
        ],
        "assessments": [
            {
                "id": "pe",
                "name": "Capstone Assignment / Project (PE)",
                "weight": 50,
                "minScore": 4.0,
                "parts": 1,
                "isSubParts": false,
                "isFE": false,
                "note": "Dự án / Bài tập thực hành phần mềm. Cần >= 4.0"
            },
            {
                "id": "fe",
                "name": "Theoretical Exam (TE / FE)",
                "weight": 50,
                "minScore": 4.0,
                "parts": 1,
                "isSubParts": false,
                "isFE": true,
                "note": "Thi lý thuyết cuối kỳ EOS. Cần >= 4.0"
            }
        ],
        "passingCriteria": {
            "minTotal": 5.0,
            "minFE": 4.0
        }
    },
    "JPD113": {
        "code": "JPD113",
        "nameVi": "Tiếng Nhật sơ cấp 1 (A1.1)",
        "nameEn": "Elementary Japanese 1 - A1.1",
        "credits": 3,
        "isScored": true,
        "hasDetailedSyllabus": true,
        "minAvgToPass": 5.0,
        "components": [
            {
                "id": "st",
                "name": "Small Tests",
                "weight": 40,
                "minScore": 0,
                "parts": 2,
                "isSubParts": true,
                "note": "2 bài kiểm tra định kỳ (20% mỗi bài)"
            },
            {
                "id": "part",
                "name": "Class Participation",
                "weight": 15,
                "minScore": 0,
                "parts": 1,
                "isSubParts": false,
                "isFE": false,
                "note": "Chuyên cần 5% và thái độ học tập 10%"
            },
            {
                "id": "speaking",
                "name": "Final Speaking Exam (Nói)",
                "weight": 30,
                "minScore": 0,
                "parts": 1,
                "isSubParts": false,
                "isFE": false,
                "note": "Thi vấn đáp trực tiếp 10 phút/sinh viên, không được 0 điểm"
            },
            {
                "id": "fe",
                "name": "Final Written Exam (FE)",
                "weight": 15,
                "minScore": 0,
                "parts": 1,
                "isSubParts": false,
                "isFE": true,
                "note": "Thi viết EOS (Từ vựng, ngữ pháp, Kanji, đọc hiểu)"
            }
        ],
        "assessments": [
            {
                "id": "st",
                "name": "Small Tests",
                "weight": 40,
                "minScore": 0,
                "parts": 2,
                "isSubParts": true,
                "note": "2 bài kiểm tra định kỳ (20% mỗi bài)"
            },
            {
                "id": "part",
                "name": "Class Participation",
                "weight": 15,
                "minScore": 0,
                "parts": 1,
                "isSubParts": false,
                "isFE": false,
                "note": "Chuyên cần 5% và thái độ học tập 10%"
            },
            {
                "id": "speaking",
                "name": "Final Speaking Exam (Nói)",
                "weight": 30,
                "minScore": 0,
                "parts": 1,
                "isSubParts": false,
                "isFE": false,
                "note": "Thi vấn đáp trực tiếp 10 phút/sinh viên, không được 0 điểm"
            },
            {
                "id": "fe",
                "name": "Final Written Exam (FE)",
                "weight": 15,
                "minScore": 0,
                "parts": 1,
                "isSubParts": false,
                "isFE": true,
                "note": "Thi viết EOS (Từ vựng, ngữ pháp, Kanji, đọc hiểu)"
            }
        ],
        "passingCriteria": {
            "minTotal": 5.0,
            "minFE": 4.0
        }
    },
    "LAB211": {
        "code": "LAB211",
        "nameVi": "Thực hành OOP với Java",
        "nameEn": "OOP with Java Lab",
        "credits": 3,
        "isScored": false,
        "isPassFailOnly": true,
        "isConditionCourse": true,
        "hasDetailedSyllabus": true,
        "minAvgToPass": 5.0,
        "note": "Is Scored: False - Môn Lab điều kiện chỉ xét Pass / Not Pass (hoàn thành các bài Lab theo yêu cầu). Not Pass sẽ chặn danh hiệu.",
        "components": [],
        "assessments": [],
        "passingCriteria": {
            "minTotal": 5.0,
            "minFE": 4.0
        }
    },
    "CSD201": {
        "code": "CSD201",
        "nameVi": "Cấu trúc dữ liệu và giải thuật",
        "nameEn": "Data Structures and Algorithms",
        "credits": 3,
        "isScored": true,
        "hasDetailedSyllabus": true,
        "minAvgToPass": 5.0,
        "components": [
            {
                "id": "ass",
                "name": "Assignment",
                "weight": 20,
                "minScore": 0,
                "parts": 2,
                "isSubParts": true,
                "note": "2 bài tập lớn cấu trúc dữ liệu"
            },
            {
                "id": "pt",
                "name": "Progress Test",
                "weight": 20,
                "minScore": 0,
                "parts": 2,
                "isSubParts": true,
                "note": "2 bài kiểm tra tiến độ"
            },
            {
                "id": "pe",
                "name": "Practical Exam (PE)",
                "weight": 30,
                "minScore": 0,
                "parts": 1,
                "isSubParts": false,
                "note": "Thi thực hành thuật toán Java 85 phút. Điểm > 0"
            },
            {
                "id": "fe",
                "name": "Final Exam (FE)",
                "weight": 30,
                "minScore": 4.0,
                "parts": 1,
                "isSubParts": false,
                "isFE": true,
                "note": "Thi lý thuyết cuối kỳ EOS. Cần >= 4.0"
            }
        ],
        "assessments": [
            {
                "id": "ass",
                "name": "Assignment",
                "weight": 20,
                "minScore": 0,
                "parts": 2,
                "isSubParts": true,
                "note": "2 bài tập lớn cấu trúc dữ liệu"
            },
            {
                "id": "pt",
                "name": "Progress Test",
                "weight": 20,
                "minScore": 0,
                "parts": 2,
                "isSubParts": true,
                "note": "2 bài kiểm tra tiến độ"
            },
            {
                "id": "pe",
                "name": "Practical Exam (PE)",
                "weight": 30,
                "minScore": 0,
                "parts": 1,
                "isSubParts": false,
                "note": "Thi thực hành thuật toán Java 85 phút. Điểm > 0"
            },
            {
                "id": "fe",
                "name": "Final Exam (FE)",
                "weight": 30,
                "minScore": 4.0,
                "parts": 1,
                "isSubParts": false,
                "isFE": true,
                "note": "Thi lý thuyết cuối kỳ EOS. Cần >= 4.0"
            }
        ],
        "passingCriteria": {
            "minTotal": 5.0,
            "minFE": 4.0
        }
    },
    "PRJ301": {
        "code": "PRJ301",
        "nameVi": "Phát triển ứng dụng Java Web",
        "nameEn": "Java Web Application Development",
        "credits": 3,
        "isScored": true,
        "hasDetailedSyllabus": true,
        "minAvgToPass": 5.0,
        "components": [
            {
                "id": "ass",
                "name": "Assignment (Web Project)",
                "weight": 30,
                "minScore": 0,
                "parts": 1,
                "isSubParts": false,
                "isFE": false,
                "note": "Bài tập lớn phát triển ứng dụng web Java"
            },
            {
                "id": "ws",
                "name": "Workshop",
                "weight": 10,
                "minScore": 0,
                "parts": 2,
                "isSubParts": true,
                "note": "2 bài Workshop (5% mỗi bài)"
            },
            {
                "id": "pt",
                "name": "Progress Test",
                "weight": 10,
                "minScore": 0,
                "parts": 2,
                "isSubParts": true,
                "note": "2 bài kiểm tra tiến độ (5% mỗi bài)"
            },
            {
                "id": "pe",
                "name": "Practical Exam (PE)",
                "weight": 30,
                "minScore": 0,
                "parts": 1,
                "isSubParts": false,
                "isFE": false,
                "note": "Thi thực hành Java Web Servlet/JSP (85 phút). Điểm > 0"
            },
            {
                "id": "fe",
                "name": "Final Exam (FE)",
                "weight": 20,
                "minScore": 4.0,
                "parts": 1,
                "isSubParts": false,
                "isFE": true,
                "note": "Thi lý thuyết cuối kỳ EOS. Cần >= 4.0"
            }
        ],
        "assessments": [
            {
                "id": "ass",
                "name": "Assignment (Web Project)",
                "weight": 30,
                "minScore": 0,
                "parts": 1,
                "isSubParts": false,
                "isFE": false,
                "note": "Bài tập lớn phát triển ứng dụng web Java"
            },
            {
                "id": "ws",
                "name": "Workshop",
                "weight": 10,
                "minScore": 0,
                "parts": 2,
                "isSubParts": true,
                "note": "2 bài Workshop (5% mỗi bài)"
            },
            {
                "id": "pt",
                "name": "Progress Test",
                "weight": 10,
                "minScore": 0,
                "parts": 2,
                "isSubParts": true,
                "note": "2 bài kiểm tra tiến độ (5% mỗi bài)"
            },
            {
                "id": "pe",
                "name": "Practical Exam (PE)",
                "weight": 30,
                "minScore": 0,
                "parts": 1,
                "isSubParts": false,
                "isFE": false,
                "note": "Thi thực hành Java Web Servlet/JSP (85 phút). Điểm > 0"
            },
            {
                "id": "fe",
                "name": "Final Exam (FE)",
                "weight": 20,
                "minScore": 4.0,
                "parts": 1,
                "isSubParts": false,
                "isFE": true,
                "note": "Thi lý thuyết cuối kỳ EOS. Cần >= 4.0"
            }
        ],
        "passingCriteria": {
            "minTotal": 5.0,
            "minFE": 4.0
        }
    },
    "SWR302": {
        "code": "SWR302",
        "nameVi": "Yêu cầu phần mềm",
        "nameEn": "Software Requirement",
        "credits": 3,
        "isScored": true,
        "hasDetailedSyllabus": true,
        "minAvgToPass": 5.0,
        "components": [
            {
                "id": "lab",
                "name": "Lab / Assignment",
                "weight": 25,
                "minScore": 0,
                "parts": 2,
                "isSubParts": true,
                "note": "Lab và bài tập tài liệu yêu cầu"
            },
            {
                "id": "pt",
                "name": "Progress Test",
                "weight": 25,
                "minScore": 0,
                "parts": 2,
                "isSubParts": true,
                "note": "2 bài kiểm tra tiến độ"
            },
            {
                "id": "pe",
                "name": "Practical Exam (PE)",
                "weight": 25,
                "minScore": 0,
                "parts": 1,
                "isSubParts": false,
                "isFE": false,
                "note": "Thi thực hành kỹ nghệ yêu cầu. Điểm > 0"
            },
            {
                "id": "fe",
                "name": "Final Exam (FE)",
                "weight": 25,
                "minScore": 4.0,
                "parts": 1,
                "isSubParts": false,
                "isFE": true,
                "note": "Thi lý thuyết cuối kỳ EOS. Cần >= 4.0"
            }
        ],
        "assessments": [
            {
                "id": "lab",
                "name": "Lab / Assignment",
                "weight": 25,
                "minScore": 0,
                "parts": 2,
                "isSubParts": true,
                "note": "Lab và bài tập tài liệu yêu cầu"
            },
            {
                "id": "pt",
                "name": "Progress Test",
                "weight": 25,
                "minScore": 0,
                "parts": 2,
                "isSubParts": true,
                "note": "2 bài kiểm tra tiến độ"
            },
            {
                "id": "pe",
                "name": "Practical Exam (PE)",
                "weight": 25,
                "minScore": 0,
                "parts": 1,
                "isSubParts": false,
                "isFE": false,
                "note": "Thi thực hành kỹ nghệ yêu cầu. Điểm > 0"
            },
            {
                "id": "fe",
                "name": "Final Exam (FE)",
                "weight": 25,
                "minScore": 4.0,
                "parts": 1,
                "isSubParts": false,
                "isFE": true,
                "note": "Thi lý thuyết cuối kỳ EOS. Cần >= 4.0"
            }
        ],
        "passingCriteria": {
            "minTotal": 5.0,
            "minFE": 4.0
        }
    },
    "IOT102": {
        "code": "IOT102",
        "nameVi": "Internet vạn vật (IoT)",
        "nameEn": "Internet of Things",
        "credits": 3,
        "isScored": true,
        "hasDetailedSyllabus": true,
        "minAvgToPass": 5.0,
        "components": [
            {
                "id": "part",
                "name": "Active Learning & Participation",
                "weight": 10,
                "minScore": 0,
                "parts": 1,
                "isSubParts": false,
                "isFE": false,
                "note": "Chuyên cần và tương tác trên lớp"
            },
            {
                "id": "lab",
                "name": "Lab Assessment",
                "weight": 10,
                "minScore": 0,
                "parts": 2,
                "isSubParts": true,
                "note": "Các bài thực hành phòng Lab"
            },
            {
                "id": "pt",
                "name": "Progress Test",
                "weight": 20,
                "minScore": 0,
                "parts": 2,
                "isSubParts": true,
                "note": "2 bài kiểm tra tiến độ"
            },
            {
                "id": "pres",
                "name": "Presentation",
                "weight": 10,
                "minScore": 0,
                "parts": 1,
                "isSubParts": false,
                "isFE": false,
                "note": "Thuyết trình chuyên đề"
            },
            {
                "id": "proj_pres",
                "name": "Final Project Presentation",
                "weight": 20,
                "minScore": 4.0,
                "parts": 1,
                "isSubParts": false,
                "isFE": false,
                "note": "Bảo vệ dự án IoT cuối kỳ. Cần >= 4.0"
            },
            {
                "id": "fe",
                "name": "Final Exam (FE)",
                "weight": 30,
                "minScore": 4.0,
                "parts": 1,
                "isSubParts": false,
                "isFE": true,
                "note": "Thi lý thuyết cuối kỳ EOS. Cần >= 4.0"
            }
        ],
        "assessments": [
            {
                "id": "part",
                "name": "Active Learning & Participation",
                "weight": 10,
                "minScore": 0,
                "parts": 1,
                "isSubParts": false,
                "isFE": false,
                "note": "Chuyên cần và tương tác trên lớp"
            },
            {
                "id": "lab",
                "name": "Lab Assessment",
                "weight": 10,
                "minScore": 0,
                "parts": 2,
                "isSubParts": true,
                "note": "Các bài thực hành phòng Lab"
            },
            {
                "id": "pt",
                "name": "Progress Test",
                "weight": 20,
                "minScore": 0,
                "parts": 2,
                "isSubParts": true,
                "note": "2 bài kiểm tra tiến độ"
            },
            {
                "id": "pres",
                "name": "Presentation",
                "weight": 10,
                "minScore": 0,
                "parts": 1,
                "isSubParts": false,
                "isFE": false,
                "note": "Thuyết trình chuyên đề"
            },
            {
                "id": "proj_pres",
                "name": "Final Project Presentation",
                "weight": 20,
                "minScore": 4.0,
                "parts": 1,
                "isSubParts": false,
                "isFE": false,
                "note": "Bảo vệ dự án IoT cuối kỳ. Cần >= 4.0"
            },
            {
                "id": "fe",
                "name": "Final Exam (FE)",
                "weight": 30,
                "minScore": 4.0,
                "parts": 1,
                "isSubParts": false,
                "isFE": true,
                "note": "Thi lý thuyết cuối kỳ EOS. Cần >= 4.0"
            }
        ],
        "passingCriteria": {
            "minTotal": 5.0,
            "minFE": 4.0
        }
    },
    "JPD123": {
        "code": "JPD123",
        "nameVi": "Tiếng Nhật sơ cấp 2 (A1.2)",
        "nameEn": "Elementary Japanese 1 - A1.2",
        "credits": 3,
        "isScored": true,
        "hasDetailedSyllabus": true,
        "minAvgToPass": 5.0,
        "components": [
            {
                "id": "st",
                "name": "Small Tests",
                "weight": 40,
                "minScore": 0,
                "parts": 2,
                "isSubParts": true,
                "note": "2 bài kiểm tra định kỳ (20% mỗi bài)"
            },
            {
                "id": "part",
                "name": "Class Participation",
                "weight": 15,
                "minScore": 0,
                "parts": 1,
                "isSubParts": false,
                "isFE": false,
                "note": "Chuyên cần và thái độ học tập trên lớp"
            },
            {
                "id": "speaking",
                "name": "Final Speaking Exam (Nói)",
                "weight": 30,
                "minScore": 0,
                "parts": 1,
                "isSubParts": false,
                "isFE": false,
                "note": "Thi vấn đáp trực tiếp 10 phút/sinh viên, không được 0 điểm"
            },
            {
                "id": "fe",
                "name": "Final Written Exam (FE)",
                "weight": 15,
                "minScore": 0,
                "parts": 1,
                "isSubParts": false,
                "isFE": true,
                "note": "Thi viết EOS. Cần >= 4.0"
            }
        ],
        "assessments": [
            {
                "id": "st",
                "name": "Small Tests",
                "weight": 40,
                "minScore": 0,
                "parts": 2,
                "isSubParts": true,
                "note": "2 bài kiểm tra định kỳ (20% mỗi bài)"
            },
            {
                "id": "part",
                "name": "Class Participation",
                "weight": 15,
                "minScore": 0,
                "parts": 1,
                "isSubParts": false,
                "isFE": false,
                "note": "Chuyên cần và thái độ học tập trên lớp"
            },
            {
                "id": "speaking",
                "name": "Final Speaking Exam (Nói)",
                "weight": 30,
                "minScore": 0,
                "parts": 1,
                "isSubParts": false,
                "isFE": false,
                "note": "Thi vấn đáp trực tiếp 10 phút/sinh viên, không được 0 điểm"
            },
            {
                "id": "fe",
                "name": "Final Written Exam (FE)",
                "weight": 15,
                "minScore": 0,
                "parts": 1,
                "isSubParts": false,
                "isFE": true,
                "note": "Thi viết EOS. Cần >= 4.0"
            }
        ],
        "passingCriteria": {
            "minTotal": 5.0,
            "minFE": 4.0
        }
    },
    "SWP391": {
        "code": "SWP391",
        "nameVi": "Dự án phát triển phần mềm",
        "nameEn": "Software Development Project",
        "credits": 3,
        "isScored": true,
        "hasDetailedSyllabus": true,
        "minAvgToPass": 5.0,
        "note": "Đồ án nhóm phát triển phần mềm thực tế. Điểm quá trình cần >= 5.0 để được ra Hội đồng bảo vệ.",
        "components": [
            {
                "id": "m1",
                "name": "Milestone 1 (Requirement & Design)",
                "weight": 15,
                "minScore": 0,
                "parts": 1,
                "isSubParts": false,
                "isFE": false,
                "note": "Tuần 3: Đặc tả yêu cầu & Thiết kế kiến trúc"
            },
            {
                "id": "m2",
                "name": "Milestone 2 (Core Workflows 1 & 2)",
                "weight": 20,
                "minScore": 0,
                "parts": 1,
                "isSubParts": false,
                "isFE": false,
                "note": "Tuần 8: Hoàn thành Workflow 1 & 2"
            },
            {
                "id": "m3",
                "name": "Milestone 3 (Full System & Test)",
                "weight": 25,
                "minScore": 0,
                "parts": 1,
                "isSubParts": false,
                "isFE": false,
                "note": "Tuần 10: Toàn bộ chức năng & Kiểm thử. TB quá trình >= 5.0"
            },
            {
                "id": "defense",
                "name": "Final Project Defense (FE)",
                "weight": 40,
                "minScore": 4.0,
                "parts": 1,
                "isSubParts": false,
                "isFE": true,
                "note": "Bảo vệ đồ án trước Hội đồng. Cần >= 4.0 để Pass"
            }
        ],
        "assessments": [
            {
                "id": "m1",
                "name": "Milestone 1 (Requirement & Design)",
                "weight": 15,
                "minScore": 0,
                "parts": 1,
                "isSubParts": false,
                "isFE": false,
                "note": "Tuần 3: Đặc tả yêu cầu & Thiết kế kiến trúc"
            },
            {
                "id": "m2",
                "name": "Milestone 2 (Core Workflows 1 & 2)",
                "weight": 20,
                "minScore": 0,
                "parts": 1,
                "isSubParts": false,
                "isFE": false,
                "note": "Tuần 8: Hoàn thành Workflow 1 & 2"
            },
            {
                "id": "m3",
                "name": "Milestone 3 (Full System & Test)",
                "weight": 25,
                "minScore": 0,
                "parts": 1,
                "isSubParts": false,
                "isFE": false,
                "note": "Tuần 10: Toàn bộ chức năng & Kiểm thử. TB quá trình >= 5.0"
            },
            {
                "id": "defense",
                "name": "Final Project Defense (FE)",
                "weight": 40,
                "minScore": 4.0,
                "parts": 1,
                "isSubParts": false,
                "isFE": true,
                "note": "Bảo vệ đồ án trước Hội đồng. Cần >= 4.0 để Pass"
            }
        ],
        "passingCriteria": {
            "minTotal": 5.0,
            "minFE": 4.0
        }
    },
    "SWT301": {
        "code": "SWT301",
        "nameVi": "Kiểm thử phần mềm",
        "nameEn": "Software Testing",
        "credits": 3,
        "isScored": true,
        "hasDetailedSyllabus": true,
        "minAvgToPass": 5.0,
        "components": [
            {
                "id": "ass",
                "name": "Assignment",
                "weight": 10,
                "minScore": 0,
                "parts": 1,
                "isSubParts": false,
                "isFE": false,
                "note": "1 bài tập lớn kiểm thử"
            },
            {
                "id": "lab",
                "name": "Lab",
                "weight": 15,
                "minScore": 0,
                "parts": 3,
                "isSubParts": true,
                "note": "3 bài thực hành công cụ kiểm thử"
            },
            {
                "id": "pt",
                "name": "Progress Test",
                "weight": 25,
                "minScore": 0,
                "parts": 3,
                "isSubParts": true,
                "note": "3 bài kiểm tra tiến độ"
            },
            {
                "id": "pe",
                "name": "Practical Exam (PE)",
                "weight": 25,
                "minScore": 0,
                "parts": 1,
                "isSubParts": false,
                "isFE": false,
                "note": "Thi thực hành viết test cases & automation. Điểm > 0"
            },
            {
                "id": "fe",
                "name": "Final Exam (FE)",
                "weight": 25,
                "minScore": 4.0,
                "parts": 1,
                "isSubParts": false,
                "isFE": true,
                "note": "Thi lý thuyết cuối kỳ EOS. Cần >= 4.0"
            }
        ],
        "assessments": [
            {
                "id": "ass",
                "name": "Assignment",
                "weight": 10,
                "minScore": 0,
                "parts": 1,
                "isSubParts": false,
                "isFE": false,
                "note": "1 bài tập lớn kiểm thử"
            },
            {
                "id": "lab",
                "name": "Lab",
                "weight": 15,
                "minScore": 0,
                "parts": 3,
                "isSubParts": true,
                "note": "3 bài thực hành công cụ kiểm thử"
            },
            {
                "id": "pt",
                "name": "Progress Test",
                "weight": 25,
                "minScore": 0,
                "parts": 3,
                "isSubParts": true,
                "note": "3 bài kiểm tra tiến độ"
            },
            {
                "id": "pe",
                "name": "Practical Exam (PE)",
                "weight": 25,
                "minScore": 0,
                "parts": 1,
                "isSubParts": false,
                "isFE": false,
                "note": "Thi thực hành viết test cases & automation. Điểm > 0"
            },
            {
                "id": "fe",
                "name": "Final Exam (FE)",
                "weight": 25,
                "minScore": 4.0,
                "parts": 1,
                "isSubParts": false,
                "isFE": true,
                "note": "Thi lý thuyết cuối kỳ EOS. Cần >= 4.0"
            }
        ],
        "passingCriteria": {
            "minTotal": 5.0,
            "minFE": 4.0
        }
    },
    "WDU203c": {
        "code": "WDU203c",
        "nameVi": "Thiết kế trải nghiệm người dùng (UI/UX)",
        "nameEn": "UI/UX Design",
        "credits": 3,
        "isScored": true,
        "hasDetailedSyllabus": true,
        "minAvgToPass": 5.0,
        "note": "Môn học trực tuyến Coursera (100% TE). Hoàn thành 6 khóa MOOCs để đủ điều kiện thi (+1 điểm thưởng nếu hoàn thành sớm).",
        "components": [
            {
                "id": "fe",
                "name": "Final Theory Exam (TE / FE)",
                "weight": 100,
                "minScore": 4.0,
                "parts": 1,
                "isSubParts": false,
                "isFE": true,
                "note": "Thi lý thuyết cuối kỳ EOS trắc nghiệm. Cần >= 4.0, Tổng kết >= 5.0"
            }
        ],
        "assessments": [
            {
                "id": "fe",
                "name": "Final Theory Exam (TE / FE)",
                "weight": 100,
                "minScore": 4.0,
                "parts": 1,
                "isSubParts": false,
                "isFE": true,
                "note": "Thi lý thuyết cuối kỳ EOS trắc nghiệm. Cần >= 4.0, Tổng kết >= 5.0"
            }
        ],
        "passingCriteria": {
            "minTotal": 5.0,
            "minFE": 4.0
        }
    },
    "SSG105": {
        "code": "SSG105",
        "nameVi": "Kỹ năng giao tiếp và cộng tác",
        "nameEn": "Communication & Collaboration Skills",
        "credits": 3,
        "isScored": true,
        "hasDetailedSyllabus": true,
        "minAvgToPass": 5.0,
        "components": [
            {
                "id": "quiz",
                "name": "In-class Quizzes & Progress",
                "weight": 20,
                "minScore": 0,
                "parts": 2,
                "isSubParts": true,
                "note": "Kiểm tra tiến độ & Quizzes"
            },
            {
                "id": "act",
                "name": "Activities / Exercises",
                "weight": 15,
                "minScore": 0,
                "parts": 3,
                "isSubParts": true,
                "note": "Hoạt động & bài tập tương tác trên lớp"
            },
            {
                "id": "gp1",
                "name": "Group Project Part 1",
                "weight": 20,
                "minScore": 0,
                "parts": 1,
                "isSubParts": false,
                "isFE": false,
                "note": "Đề cương & thuyết trình nhóm giai đoạn 1"
            },
            {
                "id": "gp2",
                "name": "Group Project Part 2",
                "weight": 20,
                "minScore": 0,
                "parts": 1,
                "isSubParts": false,
                "isFE": false,
                "note": "Sản phẩm bàn giao & báo cáo nhóm giai đoạn 2"
            },
            {
                "id": "fe",
                "name": "Final Exam (FE)",
                "weight": 25,
                "minScore": 4.0,
                "parts": 1,
                "isSubParts": false,
                "isFE": true,
                "note": "Thi cuối kỳ EOS. Cần >= 4.0"
            }
        ],
        "assessments": [
            {
                "id": "quiz",
                "name": "In-class Quizzes & Progress",
                "weight": 20,
                "minScore": 0,
                "parts": 2,
                "isSubParts": true,
                "note": "Kiểm tra tiến độ & Quizzes"
            },
            {
                "id": "act",
                "name": "Activities / Exercises",
                "weight": 15,
                "minScore": 0,
                "parts": 3,
                "isSubParts": true,
                "note": "Hoạt động & bài tập tương tác trên lớp"
            },
            {
                "id": "gp1",
                "name": "Group Project Part 1",
                "weight": 20,
                "minScore": 0,
                "parts": 1,
                "isSubParts": false,
                "isFE": false,
                "note": "Đề cương & thuyết trình nhóm giai đoạn 1"
            },
            {
                "id": "gp2",
                "name": "Group Project Part 2",
                "weight": 20,
                "minScore": 0,
                "parts": 1,
                "isSubParts": false,
                "isFE": false,
                "note": "Sản phẩm bàn giao & báo cáo nhóm giai đoạn 2"
            },
            {
                "id": "fe",
                "name": "Final Exam (FE)",
                "weight": 25,
                "minScore": 4.0,
                "parts": 1,
                "isSubParts": false,
                "isFE": true,
                "note": "Thi cuối kỳ EOS. Cần >= 4.0"
            }
        ],
        "passingCriteria": {
            "minTotal": 5.0,
            "minFE": 4.0
        }
    },
    "OJT202": {
        "code": "OJT202",
        "nameVi": "Thực tập doanh nghiệp (OJT)",
        "nameEn": "On-The-Job Training",
        "credits": 10,
        "isScored": false,
        "isPassFailOnly": true,
        "isConditionCourse": true,
        "hasDetailedSyllabus": true,
        "minAvgToPass": 5.0,
        "note": "Đào tạo thực tế tại doanh nghiệp (10 tín chỉ). Đánh giá 3 tiêu chí: Chuyên môn 40%, Kỹ năng mềm 30%, Thái độ 30%. Không tính vào TBM kỳ; Không xét Cóc Vàng / Top 100.",
        "components": [
            {
                "id": "comp1",
                "name": "Kiến thức & Kỹ năng chuyên môn",
                "weight": 40,
                "minScore": 0,
                "parts": 1,
                "isSubParts": false,
                "isFE": false,
                "note": "Doanh nghiệp đánh giá năng lực nghiệp vụ (40%)"
            },
            {
                "id": "comp2",
                "name": "Kỹ năng mềm & Làm việc nhóm",
                "weight": 30,
                "minScore": 0,
                "parts": 1,
                "isSubParts": false,
                "isFE": false,
                "note": "Doanh nghiệp đánh giá kỹ năng giao tiếp và cộng tác (30%)"
            },
            {
                "id": "comp3",
                "name": "Thái độ & Kỷ luật lao động",
                "weight": 30,
                "minScore": 0,
                "parts": 1,
                "isSubParts": false,
                "isFE": false,
                "note": "Doanh nghiệp đánh giá ý thức tuân thủ kỷ luật (30%)"
            }
        ],
        "assessments": [
            {
                "id": "comp1",
                "name": "Kiến thức & Kỹ năng chuyên môn",
                "weight": 40,
                "minScore": 0,
                "parts": 1,
                "isSubParts": false,
                "isFE": false,
                "note": "Doanh nghiệp đánh giá năng lực nghiệp vụ (40%)"
            },
            {
                "id": "comp2",
                "name": "Kỹ năng mềm & Làm việc nhóm",
                "weight": 30,
                "minScore": 0,
                "parts": 1,
                "isSubParts": false,
                "isFE": false,
                "note": "Doanh nghiệp đánh giá kỹ năng giao tiếp và cộng tác (30%)"
            },
            {
                "id": "comp3",
                "name": "Thái độ & Kỷ luật lao động",
                "weight": 30,
                "minScore": 0,
                "parts": 1,
                "isSubParts": false,
                "isFE": false,
                "note": "Doanh nghiệp đánh giá ý thức tuân thủ kỷ luật (30%)"
            }
        ],
        "passingCriteria": {
            "minTotal": 5.0,
            "minFE": 4.0
        }
    },
    "ENW493c": {
        "code": "ENW493c",
        "nameVi": "Phương pháp nghiên cứu & Viết học thuật",
        "nameEn": "Research Methods & Academic Writing Skills",
        "credits": 3,
        "isScored": true,
        "hasDetailedSyllabus": true,
        "minAvgToPass": 5.0,
        "note": "Môn học trực tuyến Coursera (100% PE: 30% Trắc nghiệm + 70% Viết luận học thuật).",
        "components": [
            {
                "id": "fe",
                "name": "Final Exam PE (MCQ 30% + Essay 70%)",
                "weight": 100,
                "minScore": 4.0,
                "parts": 2,
                "isSubParts": true,
                "isFE": true,
                "note": "Part 1 trắc nghiệm 30 câu (30%) + Part 2 viết luận 450-500 từ (70%). Cần >= 4.0"
            }
        ],
        "assessments": [
            {
                "id": "fe",
                "name": "Final Exam PE (MCQ 30% + Essay 70%)",
                "weight": 100,
                "minScore": 4.0,
                "parts": 2,
                "isSubParts": true,
                "isFE": true,
                "note": "Part 1 trắc nghiệm 30 câu (30%) + Part 2 viết luận 450-500 từ (70%). Cần >= 4.0"
            }
        ],
        "passingCriteria": {
            "minTotal": 5.0,
            "minFE": 4.0
        }
    },
    "SWD392": {
        "code": "SWD392",
        "nameVi": "Kiến trúc và thiết kế phần mềm",
        "nameEn": "Software Architecture and Design",
        "credits": 3,
        "isScored": true,
        "hasDetailedSyllabus": true,
        "minAvgToPass": 5.0,
        "components": [
            {
                "id": "proj",
                "name": "Course Project (Architecture)",
                "weight": 25,
                "minScore": 0,
                "parts": 1,
                "isSubParts": false,
                "isFE": false,
                "note": "Dự án thiết kế kiến trúc phần mềm"
            },
            {
                "id": "pt",
                "name": "Progress Test",
                "weight": 15,
                "minScore": 0,
                "parts": 3,
                "isSubParts": true,
                "note": "3 bài kiểm tra tiến độ (5% mỗi bài)"
            },
            {
                "id": "pe",
                "name": "Practical Exam (PE)",
                "weight": 20,
                "minScore": 0,
                "parts": 1,
                "isSubParts": false,
                "isFE": false,
                "note": "Thi thực hành thiết kế kiến trúc. Điểm > 0"
            },
            {
                "id": "fe",
                "name": "Final Exam (FE)",
                "weight": 40,
                "minScore": 4.0,
                "parts": 1,
                "isSubParts": false,
                "isFE": true,
                "note": "Thi lý thuyết cuối kỳ EOS. Cần >= 4.0"
            }
        ],
        "assessments": [
            {
                "id": "proj",
                "name": "Course Project (Architecture)",
                "weight": 25,
                "minScore": 0,
                "parts": 1,
                "isSubParts": false,
                "isFE": false,
                "note": "Dự án thiết kế kiến trúc phần mềm"
            },
            {
                "id": "pt",
                "name": "Progress Test",
                "weight": 15,
                "minScore": 0,
                "parts": 3,
                "isSubParts": true,
                "note": "3 bài kiểm tra tiến độ (5% mỗi bài)"
            },
            {
                "id": "pe",
                "name": "Practical Exam (PE)",
                "weight": 20,
                "minScore": 0,
                "parts": 1,
                "isSubParts": false,
                "isFE": false,
                "note": "Thi thực hành thiết kế kiến trúc. Điểm > 0"
            },
            {
                "id": "fe",
                "name": "Final Exam (FE)",
                "weight": 40,
                "minScore": 4.0,
                "parts": 1,
                "isSubParts": false,
                "isFE": true,
                "note": "Thi lý thuyết cuối kỳ EOS. Cần >= 4.0"
            }
        ],
        "passingCriteria": {
            "minTotal": 5.0,
            "minFE": 4.0
        }
    },
    "PMG201c": {
        "code": "PMG201c",
        "nameVi": "Quản lý dự án",
        "nameEn": "Project Management",
        "credits": 3,
        "isScored": true,
        "hasDetailedSyllabus": true,
        "minAvgToPass": 5.0,
        "note": "Môn học kết hợp Coursera (50% Assignment + 50% TE).",
        "components": [
            {
                "id": "ass",
                "name": "Assignment (Project Management Plan)",
                "weight": 50,
                "minScore": 4.0,
                "parts": 1,
                "isSubParts": false,
                "isFE": false,
                "note": "Kế hoạch quản lý dự án thực tế. Cần >= 4.0"
            },
            {
                "id": "fe",
                "name": "Final Theory Exam (TE / FE)",
                "weight": 50,
                "minScore": 4.0,
                "parts": 1,
                "isSubParts": false,
                "isFE": true,
                "note": "Thi trắc nghiệm lý thuyết cuối kỳ EOS. Cần >= 4.0"
            }
        ],
        "assessments": [
            {
                "id": "ass",
                "name": "Assignment (Project Management Plan)",
                "weight": 50,
                "minScore": 4.0,
                "parts": 1,
                "isSubParts": false,
                "isFE": false,
                "note": "Kế hoạch quản lý dự án thực tế. Cần >= 4.0"
            },
            {
                "id": "fe",
                "name": "Final Theory Exam (TE / FE)",
                "weight": 50,
                "minScore": 4.0,
                "parts": 1,
                "isSubParts": false,
                "isFE": true,
                "note": "Thi trắc nghiệm lý thuyết cuối kỳ EOS. Cần >= 4.0"
            }
        ],
        "passingCriteria": {
            "minTotal": 5.0,
            "minFE": 4.0
        }
    },
    "EXE101": {
        "code": "EXE101",
        "nameVi": "Trải nghiệm khởi nghiệp 1",
        "nameEn": "Experiential Entrepreneurship 1",
        "credits": 3,
        "isScored": true,
        "hasDetailedSyllabus": true,
        "minAvgToPass": 5.0,
        "components": [
            {
                "id": "pres",
                "name": "Constructivism Presentations",
                "weight": 15,
                "minScore": 0,
                "parts": 1,
                "isSubParts": false,
                "isFE": false,
                "note": "Thuyết trình kiến tạo trên lớp"
            },
            {
                "id": "cp1",
                "name": "Group Assignment 1 (Checkpoint 1)",
                "weight": 10,
                "minScore": 0,
                "parts": 1,
                "isSubParts": false,
                "isFE": false,
                "note": "Báo cáo tiến độ ý tưởng khởi nghiệp"
            },
            {
                "id": "cp2",
                "name": "Group Assignment 2 (Checkpoint 2)",
                "weight": 20,
                "minScore": 0,
                "parts": 1,
                "isSubParts": false,
                "isFE": false,
                "note": "Khảo sát và xác thực thị trường"
            },
            {
                "id": "cp3",
                "name": "Group Assignment 3 (Checkpoint 3)",
                "weight": 15,
                "minScore": 0,
                "parts": 1,
                "isSubParts": false,
                "isFE": false,
                "note": "Mô hình kinh doanh & Kế hoạch tài chính"
            },
            {
                "id": "fe",
                "name": "Final Pitch Presentation (FE)",
                "weight": 40,
                "minScore": 4.0,
                "parts": 1,
                "isSubParts": false,
                "isFE": true,
                "note": "Pitching dự án trước hội đồng giám khảo. Cần >= 4.0"
            }
        ],
        "assessments": [
            {
                "id": "pres",
                "name": "Constructivism Presentations",
                "weight": 15,
                "minScore": 0,
                "parts": 1,
                "isSubParts": false,
                "isFE": false,
                "note": "Thuyết trình kiến tạo trên lớp"
            },
            {
                "id": "cp1",
                "name": "Group Assignment 1 (Checkpoint 1)",
                "weight": 10,
                "minScore": 0,
                "parts": 1,
                "isSubParts": false,
                "isFE": false,
                "note": "Báo cáo tiến độ ý tưởng khởi nghiệp"
            },
            {
                "id": "cp2",
                "name": "Group Assignment 2 (Checkpoint 2)",
                "weight": 20,
                "minScore": 0,
                "parts": 1,
                "isSubParts": false,
                "isFE": false,
                "note": "Khảo sát và xác thực thị trường"
            },
            {
                "id": "cp3",
                "name": "Group Assignment 3 (Checkpoint 3)",
                "weight": 15,
                "minScore": 0,
                "parts": 1,
                "isSubParts": false,
                "isFE": false,
                "note": "Mô hình kinh doanh & Kế hoạch tài chính"
            },
            {
                "id": "fe",
                "name": "Final Pitch Presentation (FE)",
                "weight": 40,
                "minScore": 4.0,
                "parts": 1,
                "isSubParts": false,
                "isFE": true,
                "note": "Pitching dự án trước hội đồng giám khảo. Cần >= 4.0"
            }
        ],
        "passingCriteria": {
            "minTotal": 5.0,
            "minFE": 4.0
        }
    },
    "PRM393": {
        "code": "PRM393",
        "nameVi": "Lập trình di động",
        "nameEn": "Mobile Programming",
        "credits": 3,
        "isScored": true,
        "hasDetailedSyllabus": true,
        "minAvgToPass": 5.0,
        "components": [
            {
                "id": "pt",
                "name": "Progress Test",
                "weight": 15,
                "minScore": 0,
                "parts": 3,
                "isSubParts": true,
                "note": "3 bài kiểm tra tiến độ (5% mỗi bài)"
            },
            {
                "id": "pe",
                "name": "Practical Exam (PE)",
                "weight": 25,
                "minScore": 0,
                "parts": 1,
                "isSubParts": false,
                "isFE": false,
                "note": "Thi thực hành Android Studio 90 phút. Điểm > 0"
            },
            {
                "id": "proj",
                "name": "Mobile App Project",
                "weight": 30,
                "minScore": 0,
                "parts": 2,
                "isSubParts": true,
                "note": "Dự án ứng dụng di động (Sản phẩm 20%, Thuyết trình 10%)"
            },
            {
                "id": "fe",
                "name": "Final Exam (FE)",
                "weight": 30,
                "minScore": 4.0,
                "parts": 1,
                "isSubParts": false,
                "isFE": true,
                "note": "Thi lý thuyết cuối kỳ EOS. Cần >= 4.0"
            }
        ],
        "assessments": [
            {
                "id": "pt",
                "name": "Progress Test",
                "weight": 15,
                "minScore": 0,
                "parts": 3,
                "isSubParts": true,
                "note": "3 bài kiểm tra tiến độ (5% mỗi bài)"
            },
            {
                "id": "pe",
                "name": "Practical Exam (PE)",
                "weight": 25,
                "minScore": 0,
                "parts": 1,
                "isSubParts": false,
                "isFE": false,
                "note": "Thi thực hành Android Studio 90 phút. Điểm > 0"
            },
            {
                "id": "proj",
                "name": "Mobile App Project",
                "weight": 30,
                "minScore": 0,
                "parts": 2,
                "isSubParts": true,
                "note": "Dự án ứng dụng di động (Sản phẩm 20%, Thuyết trình 10%)"
            },
            {
                "id": "fe",
                "name": "Final Exam (FE)",
                "weight": 30,
                "minScore": 4.0,
                "parts": 1,
                "isSubParts": false,
                "isFE": true,
                "note": "Thi lý thuyết cuối kỳ EOS. Cần >= 4.0"
            }
        ],
        "passingCriteria": {
            "minTotal": 5.0,
            "minFE": 4.0
        }
    },
    "ITE302c": {
        "code": "ITE302c",
        "nameVi": "Đạo đức trong CNTT",
        "nameEn": "Ethics in IT",
        "credits": 3,
        "isScored": true,
        "hasDetailedSyllabus": true,
        "minAvgToPass": 5.0,
        "note": "Môn học trực tuyến Coursera (100% TE). Hoàn thành khóa học để dự thi.",
        "components": [
            {
                "id": "fe",
                "name": "Final Exam (TE / FE)",
                "weight": 100,
                "minScore": 4.0,
                "parts": 1,
                "isSubParts": false,
                "isFE": true,
                "note": "Thi trắc nghiệm cuối kỳ EOS 60 câu. Cần >= 4.0"
            }
        ],
        "assessments": [
            {
                "id": "fe",
                "name": "Final Exam (TE / FE)",
                "weight": 100,
                "minScore": 4.0,
                "parts": 1,
                "isSubParts": false,
                "isFE": true,
                "note": "Thi trắc nghiệm cuối kỳ EOS 60 câu. Cần >= 4.0"
            }
        ],
        "passingCriteria": {
            "minTotal": 5.0,
            "minFE": 4.0
        }
    },
    "EXE201": {
        "code": "EXE201",
        "nameVi": "Trải nghiệm khởi nghiệp 2",
        "nameEn": "Experiential Entrepreneurship 2",
        "credits": 3,
        "isScored": true,
        "hasDetailedSyllabus": true,
        "minAvgToPass": 5.0,
        "note": "100% đánh giá quá trình (Outcome 1 40%, Outcome 2 20%, Outcome 3 40%). Không có kỳ thi cuối kỳ EOS.",
        "components": [
            {
                "id": "oc1",
                "name": "Outcome 1 (Demo & Market Readiness)",
                "weight": 40,
                "minScore": 0,
                "parts": 1,
                "isSubParts": false,
                "isFE": false,
                "note": "Demo sản phẩm/dịch vụ hoàn thiện & mức độ sẵn sàng thị trường"
            },
            {
                "id": "oc2",
                "name": "Outcome 2 (Pitching Presentation)",
                "weight": 20,
                "minScore": 0,
                "parts": 1,
                "isSubParts": false,
                "isFE": false,
                "note": "Thuyết trình gọi vốn / Pitching trước nhà đầu tư"
            },
            {
                "id": "oc3",
                "name": "Outcome 3 (Sales Proof & Final Report)",
                "weight": 40,
                "minScore": 0,
                "parts": 1,
                "isSubParts": false,
                "isFE": true,
                "note": "Minh chứng doanh thu, khách hàng thực tế và Báo cáo tổng kết"
            }
        ],
        "assessments": [
            {
                "id": "oc1",
                "name": "Outcome 1 (Demo & Market Readiness)",
                "weight": 40,
                "minScore": 0,
                "parts": 1,
                "isSubParts": false,
                "isFE": false,
                "note": "Demo sản phẩm/dịch vụ hoàn thiện & mức độ sẵn sàng thị trường"
            },
            {
                "id": "oc2",
                "name": "Outcome 2 (Pitching Presentation)",
                "weight": 20,
                "minScore": 0,
                "parts": 1,
                "isSubParts": false,
                "isFE": false,
                "note": "Thuyết trình gọi vốn / Pitching trước nhà đầu tư"
            },
            {
                "id": "oc3",
                "name": "Outcome 3 (Sales Proof & Final Report)",
                "weight": 40,
                "minScore": 0,
                "parts": 1,
                "isSubParts": false,
                "isFE": true,
                "note": "Minh chứng doanh thu, khách hàng thực tế và Báo cáo tổng kết"
            }
        ],
        "passingCriteria": {
            "minTotal": 5.0,
            "minFE": 4.0
        }
    },
    "MLN111": {
        "code": "MLN111",
        "nameVi": "Triết học Mác - Lênin",
        "nameEn": "Philosophy of Marxism – Leninism",
        "credits": 3,
        "isScored": true,
        "hasDetailedSyllabus": true,
        "minAvgToPass": 5.0,
        "components": [
            {
                "id": "ass",
                "name": "Assignment (Thuyết trình / Tiểu luận)",
                "weight": 40,
                "minScore": 0,
                "parts": 1,
                "isSubParts": false,
                "isFE": false,
                "note": "Bài tập lớn / Thuyết trình sản phẩm sáng tạo"
            },
            {
                "id": "part",
                "name": "Class Participation (Chuyên cần)",
                "weight": 10,
                "minScore": 0,
                "parts": 1,
                "isSubParts": false,
                "isFE": false,
                "note": "Chuyên cần và thảo luận trên lớp"
            },
            {
                "id": "pt",
                "name": "Progress Test",
                "weight": 20,
                "minScore": 0,
                "parts": 1,
                "isSubParts": false,
                "isFE": false,
                "note": "Kiểm tra tiến độ trắc nghiệm trên lớp"
            },
            {
                "id": "fe",
                "name": "Final Exam (FE)",
                "weight": 30,
                "minScore": 4.0,
                "parts": 1,
                "isSubParts": false,
                "isFE": true,
                "note": "Thi trắc nghiệm cuối kỳ EOS 60 câu. Cần >= 4.0"
            }
        ],
        "assessments": [
            {
                "id": "ass",
                "name": "Assignment (Thuyết trình / Tiểu luận)",
                "weight": 40,
                "minScore": 0,
                "parts": 1,
                "isSubParts": false,
                "isFE": false,
                "note": "Bài tập lớn / Thuyết trình sản phẩm sáng tạo"
            },
            {
                "id": "part",
                "name": "Class Participation (Chuyên cần)",
                "weight": 10,
                "minScore": 0,
                "parts": 1,
                "isSubParts": false,
                "isFE": false,
                "note": "Chuyên cần và thảo luận trên lớp"
            },
            {
                "id": "pt",
                "name": "Progress Test",
                "weight": 20,
                "minScore": 0,
                "parts": 1,
                "isSubParts": false,
                "isFE": false,
                "note": "Kiểm tra tiến độ trắc nghiệm trên lớp"
            },
            {
                "id": "fe",
                "name": "Final Exam (FE)",
                "weight": 30,
                "minScore": 4.0,
                "parts": 1,
                "isSubParts": false,
                "isFE": true,
                "note": "Thi trắc nghiệm cuối kỳ EOS 60 câu. Cần >= 4.0"
            }
        ],
        "passingCriteria": {
            "minTotal": 5.0,
            "minFE": 4.0
        }
    },
    "MLN122": {
        "code": "MLN122",
        "nameVi": "Kinh tế chính trị Mác - Lênin",
        "nameEn": "Political Economics of Marxism – Leninism",
        "credits": 2,
        "isScored": true,
        "hasDetailedSyllabus": true,
        "minAvgToPass": 5.0,
        "components": [
            {
                "id": "ass",
                "name": "Assignment (Thuyết trình / Tiểu luận)",
                "weight": 40,
                "minScore": 0,
                "parts": 1,
                "isSubParts": false,
                "isFE": false,
                "note": "Bài tập lớn / Thuyết trình"
            },
            {
                "id": "part",
                "name": "Class Participation (Chuyên cần)",
                "weight": 10,
                "minScore": 0,
                "parts": 1,
                "isSubParts": false,
                "isFE": false,
                "note": "Chuyên cần & tương tác trên lớp"
            },
            {
                "id": "pt",
                "name": "Progress Test",
                "weight": 20,
                "minScore": 0,
                "parts": 1,
                "isSubParts": false,
                "isFE": false,
                "note": "Kiểm tra tiến độ"
            },
            {
                "id": "fe",
                "name": "Final Exam (FE)",
                "weight": 30,
                "minScore": 4.0,
                "parts": 1,
                "isSubParts": false,
                "isFE": true,
                "note": "Thi cuối kỳ EOS. Cần >= 4.0"
            }
        ],
        "assessments": [
            {
                "id": "ass",
                "name": "Assignment (Thuyết trình / Tiểu luận)",
                "weight": 40,
                "minScore": 0,
                "parts": 1,
                "isSubParts": false,
                "isFE": false,
                "note": "Bài tập lớn / Thuyết trình"
            },
            {
                "id": "part",
                "name": "Class Participation (Chuyên cần)",
                "weight": 10,
                "minScore": 0,
                "parts": 1,
                "isSubParts": false,
                "isFE": false,
                "note": "Chuyên cần & tương tác trên lớp"
            },
            {
                "id": "pt",
                "name": "Progress Test",
                "weight": 20,
                "minScore": 0,
                "parts": 1,
                "isSubParts": false,
                "isFE": false,
                "note": "Kiểm tra tiến độ"
            },
            {
                "id": "fe",
                "name": "Final Exam (FE)",
                "weight": 30,
                "minScore": 4.0,
                "parts": 1,
                "isSubParts": false,
                "isFE": true,
                "note": "Thi cuối kỳ EOS. Cần >= 4.0"
            }
        ],
        "passingCriteria": {
            "minTotal": 5.0,
            "minFE": 4.0
        }
    },
    "HCM202": {
        "code": "HCM202",
        "nameVi": "Tư tưởng Hồ Chí Minh",
        "nameEn": "Ho Chi Minh Ideology",
        "credits": 2,
        "isScored": true,
        "hasDetailedSyllabus": true,
        "minAvgToPass": 5.0,
        "components": [
            {
                "id": "ass",
                "name": "Assignment (Thuyết trình / Tiểu luận)",
                "weight": 40,
                "minScore": 0,
                "parts": 1,
                "isSubParts": false,
                "isFE": false
            },
            {
                "id": "part",
                "name": "Class Participation (Chuyên cần)",
                "weight": 10,
                "minScore": 0,
                "parts": 1,
                "isSubParts": false,
                "isFE": false
            },
            {
                "id": "pt",
                "name": "Progress Test",
                "weight": 20,
                "minScore": 0,
                "parts": 1,
                "isSubParts": false,
                "isFE": false
            },
            {
                "id": "fe",
                "name": "Final Exam (FE)",
                "weight": 30,
                "minScore": 4.0,
                "parts": 1,
                "isSubParts": false,
                "isFE": true,
                "note": "Thi cuối kỳ EOS. Cần >= 4.0"
            }
        ],
        "assessments": [
            {
                "id": "ass",
                "name": "Assignment (Thuyết trình / Tiểu luận)",
                "weight": 40,
                "minScore": 0,
                "parts": 1,
                "isSubParts": false,
                "isFE": false
            },
            {
                "id": "part",
                "name": "Class Participation (Chuyên cần)",
                "weight": 10,
                "minScore": 0,
                "parts": 1,
                "isSubParts": false,
                "isFE": false
            },
            {
                "id": "pt",
                "name": "Progress Test",
                "weight": 20,
                "minScore": 0,
                "parts": 1,
                "isSubParts": false,
                "isFE": false
            },
            {
                "id": "fe",
                "name": "Final Exam (FE)",
                "weight": 30,
                "minScore": 4.0,
                "parts": 1,
                "isSubParts": false,
                "isFE": true,
                "note": "Thi cuối kỳ EOS. Cần >= 4.0"
            }
        ],
        "passingCriteria": {
            "minTotal": 5.0,
            "minFE": 4.0
        }
    },
    "MLN131": {
        "code": "MLN131",
        "nameVi": "Chủ nghĩa xã hội khoa học",
        "nameEn": "Scientific Socialism",
        "credits": 2,
        "isScored": true,
        "hasDetailedSyllabus": true,
        "minAvgToPass": 5.0,
        "components": [
            {
                "id": "ass",
                "name": "Assignment (Thuyết trình / Tiểu luận)",
                "weight": 40,
                "minScore": 0,
                "parts": 1,
                "isSubParts": false,
                "isFE": false
            },
            {
                "id": "part",
                "name": "Class Participation (Chuyên cần)",
                "weight": 10,
                "minScore": 0,
                "parts": 1,
                "isSubParts": false,
                "isFE": false
            },
            {
                "id": "pt",
                "name": "Progress Test",
                "weight": 20,
                "minScore": 0,
                "parts": 1,
                "isSubParts": false,
                "isFE": false
            },
            {
                "id": "fe",
                "name": "Final Exam (FE)",
                "weight": 30,
                "minScore": 4.0,
                "parts": 1,
                "isSubParts": false,
                "isFE": true,
                "note": "Thi cuối kỳ EOS. Cần >= 4.0"
            }
        ],
        "assessments": [
            {
                "id": "ass",
                "name": "Assignment (Thuyết trình / Tiểu luận)",
                "weight": 40,
                "minScore": 0,
                "parts": 1,
                "isSubParts": false,
                "isFE": false
            },
            {
                "id": "part",
                "name": "Class Participation (Chuyên cần)",
                "weight": 10,
                "minScore": 0,
                "parts": 1,
                "isSubParts": false,
                "isFE": false
            },
            {
                "id": "pt",
                "name": "Progress Test",
                "weight": 20,
                "minScore": 0,
                "parts": 1,
                "isSubParts": false,
                "isFE": false
            },
            {
                "id": "fe",
                "name": "Final Exam (FE)",
                "weight": 30,
                "minScore": 4.0,
                "parts": 1,
                "isSubParts": false,
                "isFE": true,
                "note": "Thi cuối kỳ EOS. Cần >= 4.0"
            }
        ],
        "passingCriteria": {
            "minTotal": 5.0,
            "minFE": 4.0
        }
    },
    "VNR202": {
        "code": "VNR202",
        "nameVi": "Lịch sử Đảng Cộng sản Việt Nam",
        "nameEn": "History of Communist Party of Vietnam",
        "credits": 2,
        "isScored": true,
        "hasDetailedSyllabus": true,
        "minAvgToPass": 5.0,
        "components": [
            {
                "id": "ass",
                "name": "Assignment (Thuyết trình / Tiểu luận)",
                "weight": 40,
                "minScore": 0,
                "parts": 1,
                "isSubParts": false,
                "isFE": false
            },
            {
                "id": "part",
                "name": "Class Participation (Chuyên cần)",
                "weight": 10,
                "minScore": 0,
                "parts": 1,
                "isSubParts": false,
                "isFE": false
            },
            {
                "id": "pt",
                "name": "Progress Test",
                "weight": 20,
                "minScore": 0,
                "parts": 1,
                "isSubParts": false,
                "isFE": false
            },
            {
                "id": "fe",
                "name": "Final Exam (FE)",
                "weight": 30,
                "minScore": 4.0,
                "parts": 1,
                "isSubParts": false,
                "isFE": true,
                "note": "Thi cuối kỳ EOS. Cần >= 4.0"
            }
        ],
        "assessments": [
            {
                "id": "ass",
                "name": "Assignment (Thuyết trình / Tiểu luận)",
                "weight": 40,
                "minScore": 0,
                "parts": 1,
                "isSubParts": false,
                "isFE": false
            },
            {
                "id": "part",
                "name": "Class Participation (Chuyên cần)",
                "weight": 10,
                "minScore": 0,
                "parts": 1,
                "isSubParts": false,
                "isFE": false
            },
            {
                "id": "pt",
                "name": "Progress Test",
                "weight": 20,
                "minScore": 0,
                "parts": 1,
                "isSubParts": false,
                "isFE": false
            },
            {
                "id": "fe",
                "name": "Final Exam (FE)",
                "weight": 30,
                "minScore": 4.0,
                "parts": 1,
                "isSubParts": false,
                "isFE": true,
                "note": "Thi cuối kỳ EOS. Cần >= 4.0"
            }
        ],
        "passingCriteria": {
            "minTotal": 5.0,
            "minFE": 4.0
        }
    },
    "SEP490": {
        "code": "SEP490",
        "nameVi": "Đồ án tốt nghiệp KTPM",
        "nameEn": "SE Capstone Project",
        "credits": 10,
        "isScored": true,
        "hasDetailedSyllabus": true,
        "minAvgToPass": 5.0,
        "note": "Đồ án tốt nghiệp kỹ sư phần mềm (10 tín chỉ). Điểm quá trình OGA >= 5.0 để được bảo vệ; Điểm bảo vệ Hội đồng >= 4.0.",
        "components": [
            {
                "id": "oga",
                "name": "On-going Assessment (OGA - Reports 1-7)",
                "weight": 50,
                "minScore": 5.0,
                "parts": 1,
                "isSubParts": false,
                "isFE": false,
                "note": "Điểm quá trình phải đạt >= 5.0 để được bảo vệ"
            },
            {
                "id": "defense",
                "name": "Final Project Defense (TDA)",
                "weight": 50,
                "minScore": 4.0,
                "parts": 1,
                "isSubParts": false,
                "isFE": true,
                "note": "Bảo vệ đồ án trước hội đồng (90 phút). Cần >= 4.0"
            }
        ],
        "assessments": [
            {
                "id": "oga",
                "name": "On-going Assessment (OGA - Reports 1-7)",
                "weight": 50,
                "minScore": 5.0,
                "parts": 1,
                "isSubParts": false,
                "isFE": false,
                "note": "Điểm quá trình phải đạt >= 5.0 để được bảo vệ"
            },
            {
                "id": "defense",
                "name": "Final Project Defense (TDA)",
                "weight": 50,
                "minScore": 4.0,
                "parts": 1,
                "isSubParts": false,
                "isFE": true,
                "note": "Bảo vệ đồ án trước hội đồng (90 phút). Cần >= 4.0"
            }
        ],
        "passingCriteria": {
            "minTotal": 5.0,
            "minFE": 4.0
        }
    },
    "SET490": {
        "code": "SET490",
        "nameVi": "Khóa luận tốt nghiệp Kỹ thuật phần mềm",
        "nameEn": "SE Graduation Thesis",
        "credits": 10,
        "isScored": true,
        "hasDetailedSyllabus": true,
        "minAvgToPass": 5.0,
        "components": [
            {
                "id": "oga",
                "name": "On-going Research Assessment",
                "weight": 50,
                "minScore": 5.0,
                "parts": 1,
                "isSubParts": false,
                "isFE": false
            },
            {
                "id": "defense",
                "name": "Graduation Thesis Defense (FE)",
                "weight": 50,
                "minScore": 4.0,
                "parts": 1,
                "isSubParts": false,
                "isFE": true
            }
        ],
        "assessments": [
            {
                "id": "oga",
                "name": "On-going Research Assessment",
                "weight": 50,
                "minScore": 5.0,
                "parts": 1,
                "isSubParts": false,
                "isFE": false
            },
            {
                "id": "defense",
                "name": "Graduation Thesis Defense (FE)",
                "weight": 50,
                "minScore": 4.0,
                "parts": 1,
                "isSubParts": false,
                "isFE": true
            }
        ],
        "passingCriteria": {
            "minTotal": 5.0,
            "minFE": 4.0
        }
    },
    "EXE402": {
        "code": "EXE402",
        "nameVi": "Dự án khởi nghiệp tốt nghiệp",
        "nameEn": "Graduation Thesis on a Startup Project",
        "credits": 10,
        "isScored": true,
        "hasDetailedSyllabus": true,
        "minAvgToPass": 5.0,
        "components": [
            {
                "id": "oc1",
                "name": "Outcome 1 (Startup MVP & Verification)",
                "weight": 20,
                "minScore": 0,
                "parts": 1,
                "isSubParts": false,
                "isFE": false
            },
            {
                "id": "oc2",
                "name": "Outcome 2 (Market Survey & Testing)",
                "weight": 10,
                "minScore": 0,
                "parts": 1,
                "isSubParts": false,
                "isFE": false
            },
            {
                "id": "oc3",
                "name": "Outcome 3 (Financial Model & Operations)",
                "weight": 20,
                "minScore": 0,
                "parts": 1,
                "isSubParts": false,
                "isFE": false
            },
            {
                "id": "defense",
                "name": "Oral Thesis Defense (FE)",
                "weight": 30,
                "minScore": 4.0,
                "parts": 1,
                "isSubParts": false,
                "isFE": true
            },
            {
                "id": "sales",
                "name": "Sales Results & Commercialization Proof",
                "weight": 20,
                "minScore": 0,
                "parts": 1,
                "isSubParts": false,
                "isFE": false
            }
        ],
        "assessments": [
            {
                "id": "oc1",
                "name": "Outcome 1 (Startup MVP & Verification)",
                "weight": 20,
                "minScore": 0,
                "parts": 1,
                "isSubParts": false,
                "isFE": false
            },
            {
                "id": "oc2",
                "name": "Outcome 2 (Market Survey & Testing)",
                "weight": 10,
                "minScore": 0,
                "parts": 1,
                "isSubParts": false,
                "isFE": false
            },
            {
                "id": "oc3",
                "name": "Outcome 3 (Financial Model & Operations)",
                "weight": 20,
                "minScore": 0,
                "parts": 1,
                "isSubParts": false,
                "isFE": false
            },
            {
                "id": "defense",
                "name": "Oral Thesis Defense (FE)",
                "weight": 30,
                "minScore": 4.0,
                "parts": 1,
                "isSubParts": false,
                "isFE": true
            },
            {
                "id": "sales",
                "name": "Sales Results & Commercialization Proof",
                "weight": 20,
                "minScore": 0,
                "parts": 1,
                "isSubParts": false,
                "isFE": false
            }
        ],
        "passingCriteria": {
            "minTotal": 5.0,
            "minFE": 4.0
        }
    },
    "PIT490": {
        "code": "PIT490",
        "nameVi": "Đồ án tốt nghiệp liên chuyên ngành CNTT",
        "nameEn": "IT Interdisciplinary Graduation Project",
        "credits": 10,
        "isScored": true,
        "hasDetailedSyllabus": true,
        "minAvgToPass": 5.0,
        "components": [
            {
                "id": "oga",
                "name": "Interdisciplinary Project On-going (OGA)",
                "weight": 50,
                "minScore": 5.0,
                "parts": 1,
                "isSubParts": false,
                "isFE": false
            },
            {
                "id": "defense",
                "name": "Project Defense & System Demo (FE)",
                "weight": 50,
                "minScore": 4.0,
                "parts": 1,
                "isSubParts": false,
                "isFE": true
            }
        ],
        "assessments": [
            {
                "id": "oga",
                "name": "Interdisciplinary Project On-going (OGA)",
                "weight": 50,
                "minScore": 5.0,
                "parts": 1,
                "isSubParts": false,
                "isFE": false
            },
            {
                "id": "defense",
                "name": "Project Defense & System Demo (FE)",
                "weight": 50,
                "minScore": 4.0,
                "parts": 1,
                "isSubParts": false,
                "isFE": true
            }
        ],
        "passingCriteria": {
            "minTotal": 5.0,
            "minFE": 4.0
        }
    },
    "GRC490": {
        "code": "GRC490",
        "nameVi": "Khóa luận tốt nghiệp liên ngành QTKD - KTPM",
        "nameEn": "Interdisciplinary Business - SE Thesis",
        "credits": 10,
        "isScored": true,
        "hasDetailedSyllabus": true,
        "minAvgToPass": 5.0,
        "components": [
            {
                "id": "milestones",
                "name": "Milestone Reports (Reports 1-4 & STD)",
                "weight": 50,
                "minScore": 5.0,
                "parts": 1,
                "isSubParts": false,
                "isFE": false
            },
            {
                "id": "defense",
                "name": "Oral Defense & Business Plan Presentation (FE)",
                "weight": 50,
                "minScore": 4.0,
                "parts": 1,
                "isSubParts": false,
                "isFE": true
            }
        ],
        "assessments": [
            {
                "id": "milestones",
                "name": "Milestone Reports (Reports 1-4 & STD)",
                "weight": 50,
                "minScore": 5.0,
                "parts": 1,
                "isSubParts": false,
                "isFE": false
            },
            {
                "id": "defense",
                "name": "Oral Defense & Business Plan Presentation (FE)",
                "weight": 50,
                "minScore": 4.0,
                "parts": 1,
                "isSubParts": false,
                "isFE": true
            }
        ],
        "passingCriteria": {
            "minTotal": 5.0,
            "minFE": 4.0
        }
    },
    "SE_GRA_ELE": {
        "code": "SE_GRA_ELE",
        "nameVi": "Đồ án tốt nghiệp KTPM (CapStone Project)",
        "nameEn": "Graduation Elective - Software Engineering",
        "credits": 10,
        "isScored": true,
        "aliasSyllabus": "SEP490",
        "hasDetailedSyllabus": true,
        "minAvgToPass": 5.0,
        "note": "Khóa luận / Đồ án tốt nghiệp kỹ sư phần mềm (10 tín chỉ).",
        "components": [
            {
                "id": "oga",
                "name": "Tiến độ Iterations / Quá trình (OGA)",
                "weight": 50,
                "minScore": 5.0,
                "parts": 1,
                "isSubParts": false,
                "isFE": false
            },
            {
                "id": "defense",
                "name": "Bảo vệ đồ án (Final Defense)",
                "weight": 50,
                "minScore": 4.0,
                "parts": 1,
                "isSubParts": false,
                "isFE": true
            }
        ],
        "assessments": [
            {
                "id": "oga",
                "name": "Tiến độ Iterations / Quá trình (OGA)",
                "weight": 50,
                "minScore": 5.0,
                "parts": 1,
                "isSubParts": false,
                "isFE": false
            },
            {
                "id": "defense",
                "name": "Bảo vệ đồ án (Final Defense)",
                "weight": 50,
                "minScore": 4.0,
                "parts": 1,
                "isSubParts": false,
                "isFE": true
            }
        ],
        "passingCriteria": {
            "minTotal": 5.0,
            "minFE": 4.0
        }
    },
    "PRN212": {
        "code": "PRN212",
        "nameVi": "Lập trình .NET cơ bản",
        "nameEn": "Basic Cross-Platform .NET Application Development",
        "credits": 3,
        "isScored": true,
        "hasDetailedSyllabus": true,
        "minAvgToPass": 5.0,
        "components": [
            {
                "id": "ass",
                "name": "Assignment",
                "weight": 15,
                "minScore": 0,
                "parts": 1,
                "isSubParts": false,
                "isFE": false
            },
            {
                "id": "proj",
                "name": "Group Project",
                "weight": 20,
                "minScore": 0,
                "parts": 1,
                "isSubParts": false,
                "isFE": false
            },
            {
                "id": "pt",
                "name": "Progress test",
                "weight": 10,
                "minScore": 0,
                "parts": 2,
                "isSubParts": true
            },
            {
                "id": "pe",
                "name": "Practical Exam (PE)",
                "weight": 25,
                "minScore": 0,
                "parts": 1,
                "isSubParts": false,
                "isFE": false
            },
            {
                "id": "fe",
                "name": "Theoretical exam (FE)",
                "weight": 30,
                "minScore": 4.0,
                "parts": 1,
                "isSubParts": false,
                "isFE": true
            }
        ],
        "assessments": [
            {
                "id": "ass",
                "name": "Assignment",
                "weight": 15,
                "minScore": 0,
                "parts": 1,
                "isSubParts": false,
                "isFE": false
            },
            {
                "id": "proj",
                "name": "Group Project",
                "weight": 20,
                "minScore": 0,
                "parts": 1,
                "isSubParts": false,
                "isFE": false
            },
            {
                "id": "pt",
                "name": "Progress test",
                "weight": 10,
                "minScore": 0,
                "parts": 2,
                "isSubParts": true
            },
            {
                "id": "pe",
                "name": "Practical Exam (PE)",
                "weight": 25,
                "minScore": 0,
                "parts": 1,
                "isSubParts": false,
                "isFE": false
            },
            {
                "id": "fe",
                "name": "Theoretical exam (FE)",
                "weight": 30,
                "minScore": 4.0,
                "parts": 1,
                "isSubParts": false,
                "isFE": true
            }
        ],
        "passingCriteria": {
            "minTotal": 5.0,
            "minFE": 4.0
        }
    },
    "PRN222": {
        "code": "PRN222",
        "nameVi": "Lập trình .NET nâng cao",
        "nameEn": "Advanced Cross-Platform .NET Application Development",
        "credits": 3,
        "isScored": true,
        "hasDetailedSyllabus": true,
        "minAvgToPass": 5.0,
        "components": [
            {
                "id": "ass",
                "name": "Assignment",
                "weight": 10,
                "minScore": 0,
                "parts": 1,
                "isSubParts": false,
                "isFE": false
            },
            {
                "id": "proj",
                "name": "Group Project",
                "weight": 25,
                "minScore": 0,
                "parts": 1,
                "isSubParts": false,
                "isFE": false
            },
            {
                "id": "pt",
                "name": "Progress test",
                "weight": 10,
                "minScore": 0,
                "parts": 2,
                "isSubParts": true
            },
            {
                "id": "pe",
                "name": "Practical Exam (PE)",
                "weight": 25,
                "minScore": 0,
                "parts": 1,
                "isSubParts": false,
                "isFE": false
            },
            {
                "id": "fe",
                "name": "Theoretical exam (FE)",
                "weight": 30,
                "minScore": 4.0,
                "parts": 1,
                "isSubParts": false,
                "isFE": true
            }
        ],
        "assessments": [
            {
                "id": "ass",
                "name": "Assignment",
                "weight": 10,
                "minScore": 0,
                "parts": 1,
                "isSubParts": false,
                "isFE": false
            },
            {
                "id": "proj",
                "name": "Group Project",
                "weight": 25,
                "minScore": 0,
                "parts": 1,
                "isSubParts": false,
                "isFE": false
            },
            {
                "id": "pt",
                "name": "Progress test",
                "weight": 10,
                "minScore": 0,
                "parts": 2,
                "isSubParts": true
            },
            {
                "id": "pe",
                "name": "Practical Exam (PE)",
                "weight": 25,
                "minScore": 0,
                "parts": 1,
                "isSubParts": false,
                "isFE": false
            },
            {
                "id": "fe",
                "name": "Theoretical exam (FE)",
                "weight": 30,
                "minScore": 4.0,
                "parts": 1,
                "isSubParts": false,
                "isFE": true
            }
        ],
        "passingCriteria": {
            "minTotal": 5.0,
            "minFE": 4.0
        }
    },
    "PRU213": {
        "code": "PRU213",
        "nameVi": "Lập trình ứng dụng phân tán .NET",
        "nameEn": "Distributed Systems with .NET",
        "credits": 3,
        "isScored": true,
        "hasDetailedSyllabus": true,
        "minAvgToPass": 5.0,
        "components": [
            {
                "id": "proj",
                "name": "Final project",
                "weight": 30,
                "minScore": 0,
                "parts": 1,
                "isSubParts": false,
                "isFE": false
            },
            {
                "id": "lab",
                "name": "Labs",
                "weight": 20,
                "minScore": 0,
                "parts": 4,
                "isSubParts": true
            },
            {
                "id": "quiz",
                "name": "Quizzes",
                "weight": 20,
                "minScore": 0,
                "parts": 2,
                "isSubParts": true
            },
            {
                "id": "fe",
                "name": "Final exam (FE)",
                "weight": 30,
                "minScore": 4.0,
                "parts": 1,
                "isSubParts": false,
                "isFE": true
            }
        ],
        "assessments": [
            {
                "id": "proj",
                "name": "Final project",
                "weight": 30,
                "minScore": 0,
                "parts": 1,
                "isSubParts": false,
                "isFE": false
            },
            {
                "id": "lab",
                "name": "Labs",
                "weight": 20,
                "minScore": 0,
                "parts": 4,
                "isSubParts": true
            },
            {
                "id": "quiz",
                "name": "Quizzes",
                "weight": 20,
                "minScore": 0,
                "parts": 2,
                "isSubParts": true
            },
            {
                "id": "fe",
                "name": "Final exam (FE)",
                "weight": 30,
                "minScore": 4.0,
                "parts": 1,
                "isSubParts": false,
                "isFE": true
            }
        ],
        "passingCriteria": {
            "minTotal": 5.0,
            "minFE": 4.0
        }
    },
    "FER202": {
        "code": "FER202",
        "nameVi": "Lập trình Front-End với React",
        "nameEn": "Front-End Web Development with React",
        "credits": 3,
        "isScored": true,
        "hasDetailedSyllabus": true,
        "minAvgToPass": 5.0,
        "components": [
            {
                "id": "ass",
                "name": "Assignment",
                "weight": 15,
                "minScore": 0,
                "parts": 1,
                "isSubParts": false,
                "isFE": false
            },
            {
                "id": "lab",
                "name": "Labs",
                "weight": 20,
                "minScore": 0,
                "parts": 6,
                "isSubParts": true
            },
            {
                "id": "pe",
                "name": "Practical Exam (PE)",
                "weight": 20,
                "minScore": 0,
                "parts": 1,
                "isSubParts": false,
                "isFE": false
            },
            {
                "id": "pt",
                "name": "Progress test",
                "weight": 15,
                "minScore": 0,
                "parts": 2,
                "isSubParts": true
            },
            {
                "id": "fe",
                "name": "Final exam (FE)",
                "weight": 30,
                "minScore": 4.0,
                "parts": 1,
                "isSubParts": false,
                "isFE": true
            }
        ],
        "assessments": [
            {
                "id": "ass",
                "name": "Assignment",
                "weight": 15,
                "minScore": 0,
                "parts": 1,
                "isSubParts": false,
                "isFE": false
            },
            {
                "id": "lab",
                "name": "Labs",
                "weight": 20,
                "minScore": 0,
                "parts": 6,
                "isSubParts": true
            },
            {
                "id": "pe",
                "name": "Practical Exam (PE)",
                "weight": 20,
                "minScore": 0,
                "parts": 1,
                "isSubParts": false,
                "isFE": false
            },
            {
                "id": "pt",
                "name": "Progress test",
                "weight": 15,
                "minScore": 0,
                "parts": 2,
                "isSubParts": true
            },
            {
                "id": "fe",
                "name": "Final exam (FE)",
                "weight": 30,
                "minScore": 4.0,
                "parts": 1,
                "isSubParts": false,
                "isFE": true
            }
        ],
        "passingCriteria": {
            "minTotal": 5.0,
            "minFE": 4.0
        }
    },
    "SDN302": {
        "code": "SDN302",
        "nameVi": "Phát triển Back-End với NodeJS",
        "nameEn": "Back-End Web Development with NodeJS",
        "credits": 3,
        "isScored": true,
        "hasDetailedSyllabus": true,
        "minAvgToPass": 5.0,
        "components": [
            {
                "id": "ass",
                "name": "Assignment",
                "weight": 20,
                "minScore": 0,
                "parts": 1,
                "isSubParts": false,
                "isFE": false
            },
            {
                "id": "pe",
                "name": "Practical Exam (PE)",
                "weight": 25,
                "minScore": 0,
                "parts": 1,
                "isSubParts": false,
                "isFE": false
            },
            {
                "id": "pt",
                "name": "Progress test",
                "weight": 15,
                "minScore": 0,
                "parts": 3,
                "isSubParts": true
            },
            {
                "id": "proj",
                "name": "Project",
                "weight": 15,
                "minScore": 0,
                "parts": 1,
                "isSubParts": false,
                "isFE": false
            },
            {
                "id": "fe",
                "name": "Final exam (FE)",
                "weight": 25,
                "minScore": 4.0,
                "parts": 1,
                "isSubParts": false,
                "isFE": true
            }
        ],
        "assessments": [
            {
                "id": "ass",
                "name": "Assignment",
                "weight": 20,
                "minScore": 0,
                "parts": 1,
                "isSubParts": false,
                "isFE": false
            },
            {
                "id": "pe",
                "name": "Practical Exam (PE)",
                "weight": 25,
                "minScore": 0,
                "parts": 1,
                "isSubParts": false,
                "isFE": false
            },
            {
                "id": "pt",
                "name": "Progress test",
                "weight": 15,
                "minScore": 0,
                "parts": 3,
                "isSubParts": true
            },
            {
                "id": "proj",
                "name": "Project",
                "weight": 15,
                "minScore": 0,
                "parts": 1,
                "isSubParts": false,
                "isFE": false
            },
            {
                "id": "fe",
                "name": "Final exam (FE)",
                "weight": 25,
                "minScore": 4.0,
                "parts": 1,
                "isSubParts": false,
                "isFE": true
            }
        ],
        "passingCriteria": {
            "minTotal": 5.0,
            "minFE": 4.0
        }
    },
    "MMA301": {
        "code": "MMA301",
        "nameVi": "Phát triển ứng dụng đa nền tảng (React Native)",
        "nameEn": "Multi-platform Mobile App Development",
        "credits": 3,
        "isScored": true,
        "hasDetailedSyllabus": true,
        "minAvgToPass": 5.0,
        "components": [
            {
                "id": "ass",
                "name": "Assignment",
                "weight": 10,
                "minScore": 0,
                "parts": 1,
                "isSubParts": false,
                "isFE": false
            },
            {
                "id": "lab",
                "name": "Labs",
                "weight": 20,
                "minScore": 0,
                "parts": 4,
                "isSubParts": true
            },
            {
                "id": "pt",
                "name": "Progress Test",
                "weight": 10,
                "minScore": 0,
                "parts": 2,
                "isSubParts": true
            },
            {
                "id": "pe",
                "name": "Practical Exam (PE)",
                "weight": 20,
                "minScore": 0,
                "parts": 1,
                "isSubParts": false,
                "isFE": false
            },
            {
                "id": "fe",
                "name": "Final Exam (FE)",
                "weight": 40,
                "minScore": 4.0,
                "parts": 1,
                "isSubParts": false,
                "isFE": true
            }
        ],
        "assessments": [
            {
                "id": "ass",
                "name": "Assignment",
                "weight": 10,
                "minScore": 0,
                "parts": 1,
                "isSubParts": false,
                "isFE": false
            },
            {
                "id": "lab",
                "name": "Labs",
                "weight": 20,
                "minScore": 0,
                "parts": 4,
                "isSubParts": true
            },
            {
                "id": "pt",
                "name": "Progress Test",
                "weight": 10,
                "minScore": 0,
                "parts": 2,
                "isSubParts": true
            },
            {
                "id": "pe",
                "name": "Practical Exam (PE)",
                "weight": 20,
                "minScore": 0,
                "parts": 1,
                "isSubParts": false,
                "isFE": false
            },
            {
                "id": "fe",
                "name": "Final Exam (FE)",
                "weight": 40,
                "minScore": 4.0,
                "parts": 1,
                "isSubParts": false,
                "isFE": true
            }
        ],
        "passingCriteria": {
            "minTotal": 5.0,
            "minFE": 4.0
        }
    },
    "PRP201c": {
        "code": "PRP201c",
        "nameVi": "Lập trình Python cho AI",
        "nameEn": "Python Programming for Artificial Intelligence",
        "credits": 3,
        "isScored": true,
        "hasDetailedSyllabus": true,
        "minAvgToPass": 5.0,
        "note": "Môn học kết hợp Coursera (50% PE + 50% TE).",
        "components": [
            {
                "id": "pe",
                "name": "Practical Assignment (PE)",
                "weight": 50,
                "minScore": 4.0,
                "parts": 1,
                "isSubParts": false,
                "isFE": false
            },
            {
                "id": "fe",
                "name": "Theoretical Exam (TE / FE)",
                "weight": 50,
                "minScore": 4.0,
                "parts": 1,
                "isSubParts": false,
                "isFE": true
            }
        ],
        "assessments": [
            {
                "id": "pe",
                "name": "Practical Assignment (PE)",
                "weight": 50,
                "minScore": 4.0,
                "parts": 1,
                "isSubParts": false,
                "isFE": false
            },
            {
                "id": "fe",
                "name": "Theoretical Exam (TE / FE)",
                "weight": 50,
                "minScore": 4.0,
                "parts": 1,
                "isSubParts": false,
                "isFE": true
            }
        ],
        "passingCriteria": {
            "minTotal": 5.0,
            "minFE": 4.0
        }
    },
    "AIL304m": {
        "code": "AIL304m",
        "nameVi": "Học máy ứng dụng",
        "nameEn": "Applied Machine Learning",
        "credits": 3,
        "isScored": true,
        "hasDetailedSyllabus": true,
        "minAvgToPass": 5.0,
        "components": [
            {
                "id": "lab",
                "name": "Lab",
                "weight": 20,
                "minScore": 0,
                "parts": 2,
                "isSubParts": true
            },
            {
                "id": "pt",
                "name": "Progress test",
                "weight": 20,
                "minScore": 0,
                "parts": 2,
                "isSubParts": true
            },
            {
                "id": "proj",
                "name": "Project",
                "weight": 30,
                "minScore": 0,
                "parts": 3,
                "isSubParts": true
            },
            {
                "id": "fe",
                "name": "Final Exam (FE)",
                "weight": 30,
                "minScore": 4.0,
                "parts": 1,
                "isSubParts": false,
                "isFE": true
            }
        ],
        "assessments": [
            {
                "id": "lab",
                "name": "Lab",
                "weight": 20,
                "minScore": 0,
                "parts": 2,
                "isSubParts": true
            },
            {
                "id": "pt",
                "name": "Progress test",
                "weight": 20,
                "minScore": 0,
                "parts": 2,
                "isSubParts": true
            },
            {
                "id": "proj",
                "name": "Project",
                "weight": 30,
                "minScore": 0,
                "parts": 3,
                "isSubParts": true
            },
            {
                "id": "fe",
                "name": "Final Exam (FE)",
                "weight": 30,
                "minScore": 4.0,
                "parts": 1,
                "isSubParts": false,
                "isFE": true
            }
        ],
        "passingCriteria": {
            "minTotal": 5.0,
            "minFE": 4.0
        }
    },
    "DBM301": {
        "code": "DBM301",
        "nameVi": "Khai phá dữ liệu",
        "nameEn": "Data Mining",
        "credits": 3,
        "isScored": true,
        "hasDetailedSyllabus": true,
        "minAvgToPass": 5.0,
        "components": [
            {
                "id": "ass",
                "name": "Assignment",
                "weight": 30,
                "minScore": 0,
                "parts": 1,
                "isSubParts": false,
                "isFE": false
            },
            {
                "id": "pt",
                "name": "Progress Test",
                "weight": 40,
                "minScore": 0,
                "parts": 2,
                "isSubParts": true
            },
            {
                "id": "fe",
                "name": "Final Exam (FE)",
                "weight": 30,
                "minScore": 4.0,
                "parts": 1,
                "isSubParts": false,
                "isFE": true
            }
        ],
        "assessments": [
            {
                "id": "ass",
                "name": "Assignment",
                "weight": 30,
                "minScore": 0,
                "parts": 1,
                "isSubParts": false,
                "isFE": false
            },
            {
                "id": "pt",
                "name": "Progress Test",
                "weight": 40,
                "minScore": 0,
                "parts": 2,
                "isSubParts": true
            },
            {
                "id": "fe",
                "name": "Final Exam (FE)",
                "weight": 30,
                "minScore": 4.0,
                "parts": 1,
                "isSubParts": false,
                "isFE": true
            }
        ],
        "passingCriteria": {
            "minTotal": 5.0,
            "minFE": 4.0
        }
    },
    "HSF302": {
        "code": "HSF302",
        "nameVi": "Kiến trúc ứng dụng doanh nghiệp với Java",
        "nameEn": "Enterprise Application Architecture with Java",
        "credits": 3,
        "isScored": true,
        "hasDetailedSyllabus": true,
        "minAvgToPass": 5.0,
        "components": [
            {
                "id": "ass",
                "name": "Assignment",
                "weight": 10,
                "minScore": 0,
                "parts": 1,
                "isSubParts": false,
                "isFE": false
            },
            {
                "id": "proj",
                "name": "Group Project",
                "weight": 25,
                "minScore": 0,
                "parts": 1,
                "isSubParts": false,
                "isFE": false
            },
            {
                "id": "pt",
                "name": "Progress test",
                "weight": 10,
                "minScore": 0,
                "parts": 2,
                "isSubParts": true
            },
            {
                "id": "pe",
                "name": "Practical Exam (PE)",
                "weight": 25,
                "minScore": 0,
                "parts": 1,
                "isSubParts": false,
                "isFE": false
            },
            {
                "id": "fe",
                "name": "Theoretical exam (FE)",
                "weight": 30,
                "minScore": 4.0,
                "parts": 1,
                "isSubParts": false,
                "isFE": true
            }
        ],
        "assessments": [
            {
                "id": "ass",
                "name": "Assignment",
                "weight": 10,
                "minScore": 0,
                "parts": 1,
                "isSubParts": false,
                "isFE": false
            },
            {
                "id": "proj",
                "name": "Group Project",
                "weight": 25,
                "minScore": 0,
                "parts": 1,
                "isSubParts": false,
                "isFE": false
            },
            {
                "id": "pt",
                "name": "Progress test",
                "weight": 10,
                "minScore": 0,
                "parts": 2,
                "isSubParts": true
            },
            {
                "id": "pe",
                "name": "Practical Exam (PE)",
                "weight": 25,
                "minScore": 0,
                "parts": 1,
                "isSubParts": false,
                "isFE": false
            },
            {
                "id": "fe",
                "name": "Theoretical exam (FE)",
                "weight": 30,
                "minScore": 4.0,
                "parts": 1,
                "isSubParts": false,
                "isFE": true
            }
        ],
        "passingCriteria": {
            "minTotal": 5.0,
            "minFE": 4.0
        }
    },
    "SBA301": {
        "code": "SBA301",
        "nameVi": "Phát triển dịch vụ với Spring Boot",
        "nameEn": "Spring Boot Application Development",
        "credits": 3,
        "isScored": true,
        "hasDetailedSyllabus": true,
        "minAvgToPass": 5.0,
        "components": [
            {
                "id": "ass",
                "name": "Assignment",
                "weight": 10,
                "minScore": 0,
                "parts": 1,
                "isSubParts": false,
                "isFE": false
            },
            {
                "id": "proj",
                "name": "Group Project",
                "weight": 25,
                "minScore": 0,
                "parts": 1,
                "isSubParts": false,
                "isFE": false
            },
            {
                "id": "pt",
                "name": "Progress test",
                "weight": 10,
                "minScore": 0,
                "parts": 2,
                "isSubParts": true
            },
            {
                "id": "pe",
                "name": "Practical Exam (PE)",
                "weight": 25,
                "minScore": 0,
                "parts": 1,
                "isSubParts": false,
                "isFE": false
            },
            {
                "id": "fe",
                "name": "Theoretical exam (FE)",
                "weight": 30,
                "minScore": 4.0,
                "parts": 1,
                "isSubParts": false,
                "isFE": true
            }
        ],
        "assessments": [
            {
                "id": "ass",
                "name": "Assignment",
                "weight": 10,
                "minScore": 0,
                "parts": 1,
                "isSubParts": false,
                "isFE": false
            },
            {
                "id": "proj",
                "name": "Group Project",
                "weight": 25,
                "minScore": 0,
                "parts": 1,
                "isSubParts": false,
                "isFE": false
            },
            {
                "id": "pt",
                "name": "Progress test",
                "weight": 10,
                "minScore": 0,
                "parts": 2,
                "isSubParts": true
            },
            {
                "id": "pe",
                "name": "Practical Exam (PE)",
                "weight": 25,
                "minScore": 0,
                "parts": 1,
                "isSubParts": false,
                "isFE": false
            },
            {
                "id": "fe",
                "name": "Theoretical exam (FE)",
                "weight": 30,
                "minScore": 4.0,
                "parts": 1,
                "isSubParts": false,
                "isFE": true
            }
        ],
        "passingCriteria": {
            "minTotal": 5.0,
            "minFE": 4.0
        }
    },
    "MSS301": {
        "code": "MSS301",
        "nameVi": "Kiến trúc hệ thống Microservices với Java",
        "nameEn": "Microservices System Architecture with Java",
        "credits": 3,
        "isScored": true,
        "hasDetailedSyllabus": true,
        "minAvgToPass": 5.0,
        "components": [
            {
                "id": "ass",
                "name": "Assignment",
                "weight": 10,
                "minScore": 0,
                "parts": 1,
                "isSubParts": false,
                "isFE": false
            },
            {
                "id": "proj",
                "name": "Group Project",
                "weight": 25,
                "minScore": 0,
                "parts": 1,
                "isSubParts": false,
                "isFE": false
            },
            {
                "id": "pt",
                "name": "Progress test",
                "weight": 10,
                "minScore": 0,
                "parts": 2,
                "isSubParts": true
            },
            {
                "id": "pe",
                "name": "Practical Exam (PE)",
                "weight": 25,
                "minScore": 0,
                "parts": 1,
                "isSubParts": false,
                "isFE": false
            },
            {
                "id": "fe",
                "name": "Theoretical exam (FE)",
                "weight": 30,
                "minScore": 4.0,
                "parts": 1,
                "isSubParts": false,
                "isFE": true
            }
        ],
        "assessments": [
            {
                "id": "ass",
                "name": "Assignment",
                "weight": 10,
                "minScore": 0,
                "parts": 1,
                "isSubParts": false,
                "isFE": false
            },
            {
                "id": "proj",
                "name": "Group Project",
                "weight": 25,
                "minScore": 0,
                "parts": 1,
                "isSubParts": false,
                "isFE": false
            },
            {
                "id": "pt",
                "name": "Progress test",
                "weight": 10,
                "minScore": 0,
                "parts": 2,
                "isSubParts": true
            },
            {
                "id": "pe",
                "name": "Practical Exam (PE)",
                "weight": 25,
                "minScore": 0,
                "parts": 1,
                "isSubParts": false,
                "isFE": false
            },
            {
                "id": "fe",
                "name": "Theoretical exam (FE)",
                "weight": 30,
                "minScore": 4.0,
                "parts": 1,
                "isSubParts": false,
                "isFE": true
            }
        ],
        "passingCriteria": {
            "minTotal": 5.0,
            "minFE": 4.0
        }
    },
    "FGU301": {
        "code": "FGU301",
        "nameVi": "Phát triển Game với Unity căn bản",
        "nameEn": "Fundamental Game Development with Unity",
        "credits": 3,
        "isScored": true,
        "hasDetailedSyllabus": true,
        "minAvgToPass": 5.0,
        "components": [
            {
                "id": "ass",
                "name": "Assignment (Game Prototype)",
                "weight": 40,
                "minScore": 0,
                "parts": 1,
                "isSubParts": false,
                "isFE": false
            },
            {
                "id": "pt",
                "name": "Progress Test",
                "weight": 30,
                "minScore": 0,
                "parts": 2,
                "isSubParts": true
            },
            {
                "id": "fe",
                "name": "Final Exam (FE)",
                "weight": 30,
                "minScore": 4.0,
                "parts": 1,
                "isSubParts": false,
                "isFE": true
            }
        ],
        "assessments": [
            {
                "id": "ass",
                "name": "Assignment (Game Prototype)",
                "weight": 40,
                "minScore": 0,
                "parts": 1,
                "isSubParts": false,
                "isFE": false
            },
            {
                "id": "pt",
                "name": "Progress Test",
                "weight": 30,
                "minScore": 0,
                "parts": 2,
                "isSubParts": true
            },
            {
                "id": "fe",
                "name": "Final Exam (FE)",
                "weight": 30,
                "minScore": 4.0,
                "parts": 1,
                "isSubParts": false,
                "isFE": true
            }
        ],
        "passingCriteria": {
            "minTotal": 5.0,
            "minFE": 4.0
        }
    },
    "GDC301": {
        "code": "GDC301",
        "nameVi": "Thiết kế Game và Đồ họa 3D",
        "nameEn": "Game Design and 3D Creation",
        "credits": 3,
        "isScored": true,
        "hasDetailedSyllabus": true,
        "minAvgToPass": 5.0,
        "components": [
            {
                "id": "lab",
                "name": "Lab",
                "weight": 10,
                "minScore": 0,
                "parts": 3,
                "isSubParts": true
            },
            {
                "id": "ass",
                "name": "Assignment",
                "weight": 10,
                "minScore": 0,
                "parts": 1,
                "isSubParts": false,
                "isFE": false
            },
            {
                "id": "pt",
                "name": "Progress Test",
                "weight": 10,
                "minScore": 0,
                "parts": 2,
                "isSubParts": true
            },
            {
                "id": "ws",
                "name": "Workshop",
                "weight": 5,
                "minScore": 0,
                "parts": 1,
                "isSubParts": false,
                "isFE": false
            },
            {
                "id": "pres",
                "name": "Presentation",
                "weight": 5,
                "minScore": 0,
                "parts": 1,
                "isSubParts": false,
                "isFE": false
            },
            {
                "id": "pe",
                "name": "Practical Exam (PE)",
                "weight": 30,
                "minScore": 0,
                "parts": 1,
                "isSubParts": false,
                "isFE": false
            },
            {
                "id": "fe",
                "name": "Final Exam (FE)",
                "weight": 30,
                "minScore": 4.0,
                "parts": 1,
                "isSubParts": false,
                "isFE": true
            }
        ],
        "assessments": [
            {
                "id": "lab",
                "name": "Lab",
                "weight": 10,
                "minScore": 0,
                "parts": 3,
                "isSubParts": true
            },
            {
                "id": "ass",
                "name": "Assignment",
                "weight": 10,
                "minScore": 0,
                "parts": 1,
                "isSubParts": false,
                "isFE": false
            },
            {
                "id": "pt",
                "name": "Progress Test",
                "weight": 10,
                "minScore": 0,
                "parts": 2,
                "isSubParts": true
            },
            {
                "id": "ws",
                "name": "Workshop",
                "weight": 5,
                "minScore": 0,
                "parts": 1,
                "isSubParts": false,
                "isFE": false
            },
            {
                "id": "pres",
                "name": "Presentation",
                "weight": 5,
                "minScore": 0,
                "parts": 1,
                "isSubParts": false,
                "isFE": false
            },
            {
                "id": "pe",
                "name": "Practical Exam (PE)",
                "weight": 30,
                "minScore": 0,
                "parts": 1,
                "isSubParts": false,
                "isFE": false
            },
            {
                "id": "fe",
                "name": "Final Exam (FE)",
                "weight": 30,
                "minScore": 4.0,
                "parts": 1,
                "isSubParts": false,
                "isFE": true
            }
        ],
        "passingCriteria": {
            "minTotal": 5.0,
            "minFE": 4.0
        }
    },
    "AGU301": {
        "code": "AGU301",
        "nameVi": "Phát triển Game nâng cao với Unity",
        "nameEn": "Advanced Game Development with Unity",
        "credits": 3,
        "isScored": true,
        "hasDetailedSyllabus": true,
        "minAvgToPass": 5.0,
        "components": [
            {
                "id": "ass",
                "name": "Assignment",
                "weight": 30,
                "minScore": 0,
                "parts": 1,
                "isSubParts": false,
                "isFE": false
            },
            {
                "id": "proj",
                "name": "Game Project",
                "weight": 30,
                "minScore": 0,
                "parts": 1,
                "isSubParts": false,
                "isFE": false
            },
            {
                "id": "pt",
                "name": "Progress Test",
                "weight": 15,
                "minScore": 0,
                "parts": 2,
                "isSubParts": true
            },
            {
                "id": "fe",
                "name": "Final Exam (FE)",
                "weight": 25,
                "minScore": 4.0,
                "parts": 1,
                "isSubParts": false,
                "isFE": true
            }
        ],
        "assessments": [
            {
                "id": "ass",
                "name": "Assignment",
                "weight": 30,
                "minScore": 0,
                "parts": 1,
                "isSubParts": false,
                "isFE": false
            },
            {
                "id": "proj",
                "name": "Game Project",
                "weight": 30,
                "minScore": 0,
                "parts": 1,
                "isSubParts": false,
                "isFE": false
            },
            {
                "id": "pt",
                "name": "Progress Test",
                "weight": 15,
                "minScore": 0,
                "parts": 2,
                "isSubParts": true
            },
            {
                "id": "fe",
                "name": "Final Exam (FE)",
                "weight": 25,
                "minScore": 4.0,
                "parts": 1,
                "isSubParts": false,
                "isFE": true
            }
        ],
        "passingCriteria": {
            "minTotal": 5.0,
            "minFE": 4.0
        }
    },
    "PDS301m": {
        "code": "PDS301m",
        "nameVi": "Python cho Khoa học dữ liệu",
        "nameEn": "Python for Data Science",
        "credits": 3,
        "isScored": true,
        "hasDetailedSyllabus": true,
        "minAvgToPass": 5.0,
        "components": [
            {
                "id": "ass",
                "name": "Assignment",
                "weight": 20,
                "minScore": 0,
                "parts": 1,
                "isSubParts": false,
                "isFE": false
            },
            {
                "id": "lab",
                "name": "Labs",
                "weight": 10,
                "minScore": 0,
                "parts": 3,
                "isSubParts": true
            },
            {
                "id": "pt1",
                "name": "Progress test 1",
                "weight": 5,
                "minScore": 0,
                "parts": 1,
                "isSubParts": false,
                "isFE": false
            },
            {
                "id": "pt2",
                "name": "Progress test 2",
                "weight": 5,
                "minScore": 0,
                "parts": 1,
                "isSubParts": false,
                "isFE": false
            },
            {
                "id": "proj",
                "name": "Project",
                "weight": 30,
                "minScore": 4.0,
                "parts": 1,
                "isSubParts": false,
                "isFE": false
            },
            {
                "id": "fe",
                "name": "Final exam (FE)",
                "weight": 30,
                "minScore": 4.0,
                "parts": 1,
                "isSubParts": false,
                "isFE": true
            }
        ],
        "assessments": [
            {
                "id": "ass",
                "name": "Assignment",
                "weight": 20,
                "minScore": 0,
                "parts": 1,
                "isSubParts": false,
                "isFE": false
            },
            {
                "id": "lab",
                "name": "Labs",
                "weight": 10,
                "minScore": 0,
                "parts": 3,
                "isSubParts": true
            },
            {
                "id": "pt1",
                "name": "Progress test 1",
                "weight": 5,
                "minScore": 0,
                "parts": 1,
                "isSubParts": false,
                "isFE": false
            },
            {
                "id": "pt2",
                "name": "Progress test 2",
                "weight": 5,
                "minScore": 0,
                "parts": 1,
                "isSubParts": false,
                "isFE": false
            },
            {
                "id": "proj",
                "name": "Project",
                "weight": 30,
                "minScore": 4.0,
                "parts": 1,
                "isSubParts": false,
                "isFE": false
            },
            {
                "id": "fe",
                "name": "Final exam (FE)",
                "weight": 30,
                "minScore": 4.0,
                "parts": 1,
                "isSubParts": false,
                "isFE": true
            }
        ],
        "passingCriteria": {
            "minTotal": 5.0,
            "minFE": 4.0
        }
    },
    "DHV301": {
        "code": "DHV301",
        "nameVi": "Trực quan hóa dữ liệu",
        "nameEn": "Data Visualization",
        "credits": 3,
        "isScored": true,
        "hasDetailedSyllabus": true,
        "minAvgToPass": 5.0,
        "components": [
            {
                "id": "ass",
                "name": "Assignments",
                "weight": 15,
                "minScore": 0,
                "parts": 3,
                "isSubParts": true
            },
            {
                "id": "proj",
                "name": "Group Project",
                "weight": 30,
                "minScore": 0,
                "parts": 1,
                "isSubParts": false,
                "isFE": false
            },
            {
                "id": "pt",
                "name": "Progress test",
                "weight": 5,
                "minScore": 0,
                "parts": 1,
                "isSubParts": false,
                "isFE": false
            },
            {
                "id": "pe",
                "name": "Practical Exam (PE)",
                "weight": 30,
                "minScore": 4.0,
                "parts": 1,
                "isSubParts": false,
                "isFE": false
            },
            {
                "id": "fe",
                "name": "Theoretical exam (FE)",
                "weight": 20,
                "minScore": 4.0,
                "parts": 1,
                "isSubParts": false,
                "isFE": true
            }
        ],
        "assessments": [
            {
                "id": "ass",
                "name": "Assignments",
                "weight": 15,
                "minScore": 0,
                "parts": 3,
                "isSubParts": true
            },
            {
                "id": "proj",
                "name": "Group Project",
                "weight": 30,
                "minScore": 0,
                "parts": 1,
                "isSubParts": false,
                "isFE": false
            },
            {
                "id": "pt",
                "name": "Progress test",
                "weight": 5,
                "minScore": 0,
                "parts": 1,
                "isSubParts": false,
                "isFE": false
            },
            {
                "id": "pe",
                "name": "Practical Exam (PE)",
                "weight": 30,
                "minScore": 4.0,
                "parts": 1,
                "isSubParts": false,
                "isFE": false
            },
            {
                "id": "fe",
                "name": "Theoretical exam (FE)",
                "weight": 20,
                "minScore": 4.0,
                "parts": 1,
                "isSubParts": false,
                "isFE": true
            }
        ],
        "passingCriteria": {
            "minTotal": 5.0,
            "minFE": 4.0
        }
    },
    "MDS301": {
        "code": "MDS301",
        "nameVi": "Phương pháp mô hình hóa dữ liệu",
        "nameEn": "Applied Modeling for Data Science",
        "credits": 3,
        "isScored": true,
        "hasDetailedSyllabus": true,
        "minAvgToPass": 5.0,
        "components": [
            {
                "id": "ass",
                "name": "Assignment",
                "weight": 20,
                "minScore": 0,
                "parts": 1,
                "isSubParts": false,
                "isFE": false
            },
            {
                "id": "lab",
                "name": "Lab",
                "weight": 20,
                "minScore": 0,
                "parts": 4,
                "isSubParts": true
            },
            {
                "id": "ws",
                "name": "Workshop",
                "weight": 10,
                "minScore": 0,
                "parts": 2,
                "isSubParts": true
            },
            {
                "id": "pt",
                "name": "Progress Test",
                "weight": 20,
                "minScore": 0,
                "parts": 2,
                "isSubParts": true
            },
            {
                "id": "fe",
                "name": "Final Exam (FE)",
                "weight": 30,
                "minScore": 4.0,
                "parts": 1,
                "isSubParts": false,
                "isFE": true
            }
        ],
        "assessments": [
            {
                "id": "ass",
                "name": "Assignment",
                "weight": 20,
                "minScore": 0,
                "parts": 1,
                "isSubParts": false,
                "isFE": false
            },
            {
                "id": "lab",
                "name": "Lab",
                "weight": 20,
                "minScore": 0,
                "parts": 4,
                "isSubParts": true
            },
            {
                "id": "ws",
                "name": "Workshop",
                "weight": 10,
                "minScore": 0,
                "parts": 2,
                "isSubParts": true
            },
            {
                "id": "pt",
                "name": "Progress Test",
                "weight": 20,
                "minScore": 0,
                "parts": 2,
                "isSubParts": true
            },
            {
                "id": "fe",
                "name": "Final Exam (FE)",
                "weight": 30,
                "minScore": 4.0,
                "parts": 1,
                "isSubParts": false,
                "isFE": true
            }
        ],
        "passingCriteria": {
            "minTotal": 5.0,
            "minFE": 4.0
        }
    },
    "ECI101": {
        "code": "ECI101",
        "nameVi": "Nhập môn thiết kế vi mạch",
        "nameEn": "Introduction to IC Design",
        "credits": 3,
        "isScored": true,
        "hasDetailedSyllabus": true,
        "minAvgToPass": 5.0,
        "components": [
            {
                "id": "ass",
                "name": "Assignment",
                "weight": 30,
                "minScore": 0,
                "parts": 1,
                "isSubParts": false,
                "isFE": false
            },
            {
                "id": "pt",
                "name": "Progress Test",
                "weight": 20,
                "minScore": 0,
                "parts": 2,
                "isSubParts": true
            },
            {
                "id": "pe",
                "name": "Practical Exam (PE)",
                "weight": 20,
                "minScore": 0,
                "parts": 1,
                "isSubParts": false,
                "isFE": false
            },
            {
                "id": "fe",
                "name": "Final Exam (FE)",
                "weight": 30,
                "minScore": 4.0,
                "parts": 1,
                "isSubParts": false,
                "isFE": true
            }
        ],
        "assessments": [
            {
                "id": "ass",
                "name": "Assignment",
                "weight": 30,
                "minScore": 0,
                "parts": 1,
                "isSubParts": false,
                "isFE": false
            },
            {
                "id": "pt",
                "name": "Progress Test",
                "weight": 20,
                "minScore": 0,
                "parts": 2,
                "isSubParts": true
            },
            {
                "id": "pe",
                "name": "Practical Exam (PE)",
                "weight": 20,
                "minScore": 0,
                "parts": 1,
                "isSubParts": false,
                "isFE": false
            },
            {
                "id": "fe",
                "name": "Final Exam (FE)",
                "weight": 30,
                "minScore": 4.0,
                "parts": 1,
                "isSubParts": false,
                "isFE": true
            }
        ],
        "passingCriteria": {
            "minTotal": 5.0,
            "minFE": 4.0
        }
    },
    "MIP201": {
        "code": "MIP201",
        "nameVi": "Vi xử lý & Vi điều khiển",
        "nameEn": "Microprocessors and Microcontrollers",
        "credits": 3,
        "isScored": true,
        "hasDetailedSyllabus": true,
        "minAvgToPass": 5.0,
        "components": [
            {
                "id": "lab",
                "name": "Lab & Assignment",
                "weight": 30,
                "minScore": 0,
                "parts": 3,
                "isSubParts": true
            },
            {
                "id": "pt",
                "name": "Progress Test",
                "weight": 30,
                "minScore": 0,
                "parts": 2,
                "isSubParts": true
            },
            {
                "id": "fe",
                "name": "Final Exam (FE)",
                "weight": 40,
                "minScore": 4.0,
                "parts": 1,
                "isSubParts": false,
                "isFE": true
            }
        ],
        "assessments": [
            {
                "id": "lab",
                "name": "Lab & Assignment",
                "weight": 30,
                "minScore": 0,
                "parts": 3,
                "isSubParts": true
            },
            {
                "id": "pt",
                "name": "Progress Test",
                "weight": 30,
                "minScore": 0,
                "parts": 2,
                "isSubParts": true
            },
            {
                "id": "fe",
                "name": "Final Exam (FE)",
                "weight": 40,
                "minScore": 4.0,
                "parts": 1,
                "isSubParts": false,
                "isFE": true
            }
        ],
        "passingCriteria": {
            "minTotal": 5.0,
            "minFE": 4.0
        }
    },
    "DCD301": {
        "code": "DCD301",
        "nameVi": "Thiết kế mạch số",
        "nameEn": "Digital Circuit Design",
        "credits": 3,
        "isScored": true,
        "hasDetailedSyllabus": true,
        "minAvgToPass": 5.0,
        "components": [
            {
                "id": "ass",
                "name": "Assignments",
                "weight": 10,
                "minScore": 0,
                "parts": 2,
                "isSubParts": true
            },
            {
                "id": "lab",
                "name": "Labs (Circuits)",
                "weight": 30,
                "minScore": 0,
                "parts": 3,
                "isSubParts": true
            },
            {
                "id": "pt",
                "name": "Progress Tests",
                "weight": 20,
                "minScore": 0,
                "parts": 2,
                "isSubParts": true
            },
            {
                "id": "fe",
                "name": "Final Exam (FE)",
                "weight": 40,
                "minScore": 4.0,
                "parts": 1,
                "isSubParts": false,
                "isFE": true
            }
        ],
        "assessments": [
            {
                "id": "ass",
                "name": "Assignments",
                "weight": 10,
                "minScore": 0,
                "parts": 2,
                "isSubParts": true
            },
            {
                "id": "lab",
                "name": "Labs (Circuits)",
                "weight": 30,
                "minScore": 0,
                "parts": 3,
                "isSubParts": true
            },
            {
                "id": "pt",
                "name": "Progress Tests",
                "weight": 20,
                "minScore": 0,
                "parts": 2,
                "isSubParts": true
            },
            {
                "id": "fe",
                "name": "Final Exam (FE)",
                "weight": 40,
                "minScore": 4.0,
                "parts": 1,
                "isSubParts": false,
                "isFE": true
            }
        ],
        "passingCriteria": {
            "minTotal": 5.0,
            "minFE": 4.0
        }
    },
    "JPD133": {
        "code": "JPD133",
        "nameVi": "Tiếng Nhật trung cấp 1 (A2.1)",
        "nameEn": "Intermediate Japanese 1 - A2.1",
        "credits": 3,
        "isScored": true,
        "hasDetailedSyllabus": true,
        "minAvgToPass": 5.0,
        "components": [
            {
                "id": "st",
                "name": "Small Tests",
                "weight": 40,
                "minScore": 0,
                "parts": 2,
                "isSubParts": true
            },
            {
                "id": "part",
                "name": "Class Participation",
                "weight": 15,
                "minScore": 0,
                "parts": 1,
                "isSubParts": false,
                "isFE": false
            },
            {
                "id": "speaking",
                "name": "Final Speaking Exam (Nói)",
                "weight": 30,
                "minScore": 0,
                "parts": 1,
                "isSubParts": false,
                "isFE": false
            },
            {
                "id": "fe",
                "name": "Final Written Exam (FE)",
                "weight": 15,
                "minScore": 0,
                "parts": 1,
                "isSubParts": false,
                "isFE": true
            }
        ],
        "assessments": [
            {
                "id": "st",
                "name": "Small Tests",
                "weight": 40,
                "minScore": 0,
                "parts": 2,
                "isSubParts": true
            },
            {
                "id": "part",
                "name": "Class Participation",
                "weight": 15,
                "minScore": 0,
                "parts": 1,
                "isSubParts": false,
                "isFE": false
            },
            {
                "id": "speaking",
                "name": "Final Speaking Exam (Nói)",
                "weight": 30,
                "minScore": 0,
                "parts": 1,
                "isSubParts": false,
                "isFE": false
            },
            {
                "id": "fe",
                "name": "Final Written Exam (FE)",
                "weight": 15,
                "minScore": 0,
                "parts": 1,
                "isSubParts": false,
                "isFE": true
            }
        ],
        "passingCriteria": {
            "minTotal": 5.0,
            "minFE": 4.0
        }
    },
    "JPD316": {
        "code": "JPD316",
        "nameVi": "Tiếng Nhật chuyên ngành CNTT (IT Japanese)",
        "nameEn": "Japanese for Information Technology",
        "credits": 3,
        "isScored": true,
        "hasDetailedSyllabus": true,
        "minAvgToPass": 5.0,
        "components": [
            {
                "id": "st",
                "name": "Small Tests",
                "weight": 40,
                "minScore": 0,
                "parts": 2,
                "isSubParts": true
            },
            {
                "id": "part",
                "name": "Class Participation",
                "weight": 15,
                "minScore": 0,
                "parts": 1,
                "isSubParts": false,
                "isFE": false
            },
            {
                "id": "speaking",
                "name": "Final Speaking Exam (Nói)",
                "weight": 30,
                "minScore": 0,
                "parts": 1,
                "isSubParts": false,
                "isFE": false
            },
            {
                "id": "fe",
                "name": "Final Written Exam (FE)",
                "weight": 15,
                "minScore": 0,
                "parts": 1,
                "isSubParts": false,
                "isFE": true
            }
        ],
        "assessments": [
            {
                "id": "st",
                "name": "Small Tests",
                "weight": 40,
                "minScore": 0,
                "parts": 2,
                "isSubParts": true
            },
            {
                "id": "part",
                "name": "Class Participation",
                "weight": 15,
                "minScore": 0,
                "parts": 1,
                "isSubParts": false,
                "isFE": false
            },
            {
                "id": "speaking",
                "name": "Final Speaking Exam (Nói)",
                "weight": 30,
                "minScore": 0,
                "parts": 1,
                "isSubParts": false,
                "isFE": false
            },
            {
                "id": "fe",
                "name": "Final Written Exam (FE)",
                "weight": 15,
                "minScore": 0,
                "parts": 1,
                "isSubParts": false,
                "isFE": true
            }
        ],
        "passingCriteria": {
            "minTotal": 5.0,
            "minFE": 4.0
        }
    },
    "JIS401": {
        "code": "JIS401",
        "nameVi": "Kỹ năng làm việc trong doanh nghiệp Nhật Bản",
        "nameEn": "Japanese IT Workplace Skills",
        "credits": 3,
        "isScored": true,
        "hasDetailedSyllabus": true,
        "minAvgToPass": 5.0,
        "components": [
            {
                "id": "st",
                "name": "Small Tests / Presentation",
                "weight": 40,
                "minScore": 0,
                "parts": 2,
                "isSubParts": true
            },
            {
                "id": "part",
                "name": "Class Participation",
                "weight": 20,
                "minScore": 0,
                "parts": 1,
                "isSubParts": false,
                "isFE": false
            },
            {
                "id": "fe",
                "name": "Final Exam (FE)",
                "weight": 40,
                "minScore": 4.0,
                "parts": 1,
                "isSubParts": false,
                "isFE": true
            }
        ],
        "assessments": [
            {
                "id": "st",
                "name": "Small Tests / Presentation",
                "weight": 40,
                "minScore": 0,
                "parts": 2,
                "isSubParts": true
            },
            {
                "id": "part",
                "name": "Class Participation",
                "weight": 20,
                "minScore": 0,
                "parts": 1,
                "isSubParts": false,
                "isFE": false
            },
            {
                "id": "fe",
                "name": "Final Exam (FE)",
                "weight": 40,
                "minScore": 4.0,
                "parts": 1,
                "isSubParts": false,
                "isFE": true
            }
        ],
        "passingCriteria": {
            "minTotal": 5.0,
            "minFE": 4.0
        }
    },
    "JIT401": {
        "code": "JIT401",
        "nameVi": "Thực hành dự án công nghệ với đối tác Nhật",
        "nameEn": "IT Project with Japanese Enterprise",
        "credits": 3,
        "isScored": true,
        "hasDetailedSyllabus": true,
        "minAvgToPass": 5.0,
        "components": [
            {
                "id": "proj",
                "name": "Project & Small Tests",
                "weight": 40,
                "minScore": 0,
                "parts": 2,
                "isSubParts": true
            },
            {
                "id": "part",
                "name": "Class Participation",
                "weight": 20,
                "minScore": 0,
                "parts": 1,
                "isSubParts": false,
                "isFE": false
            },
            {
                "id": "fe",
                "name": "Final Exam (FE)",
                "weight": 40,
                "minScore": 4.0,
                "parts": 1,
                "isSubParts": false,
                "isFE": true
            }
        ],
        "assessments": [
            {
                "id": "proj",
                "name": "Project & Small Tests",
                "weight": 40,
                "minScore": 0,
                "parts": 2,
                "isSubParts": true
            },
            {
                "id": "part",
                "name": "Class Participation",
                "weight": 20,
                "minScore": 0,
                "parts": 1,
                "isSubParts": false,
                "isFE": false
            },
            {
                "id": "fe",
                "name": "Final Exam (FE)",
                "weight": 40,
                "minScore": 4.0,
                "parts": 1,
                "isSubParts": false,
                "isFE": true
            }
        ],
        "passingCriteria": {
            "minTotal": 5.0,
            "minFE": 4.0
        }
    },
    "SE_COM*1": {
        "code": "SE_COM*1",
        "nameVi": "Học phần 1 của Combo chuyên ngành",
        "nameEn": "Subject 1 of Elective Combo",
        "credits": 3,
        "isScored": true,
        "hasDetailedSyllabus": true,
        "minAvgToPass": 5.0,
        "components": [
            {
                "id": "lab",
                "name": "Lab",
                "weight": 10,
                "minScore": 0,
                "parts": 4,
                "isSubParts": true
            },
            {
                "id": "pt",
                "name": "Progress Test",
                "weight": 10,
                "minScore": 0,
                "parts": 2,
                "isSubParts": true
            },
            {
                "id": "ass",
                "name": "Assignment",
                "weight": 20,
                "minScore": 0,
                "parts": 1,
                "isSubParts": false
            },
            {
                "id": "pe",
                "name": "Practical Exam (PE)",
                "weight": 30,
                "minScore": 0,
                "parts": 1,
                "isSubParts": false
            },
            {
                "id": "fe",
                "name": "Final Exam (FE)",
                "weight": 30,
                "minScore": 4.0,
                "parts": 1,
                "isSubParts": false,
                "isFE": true
            }
        ],
        "assessments": [
            {
                "id": "lab",
                "name": "Lab",
                "weight": 10,
                "minScore": 0,
                "parts": 4,
                "isSubParts": true
            },
            {
                "id": "pt",
                "name": "Progress Test",
                "weight": 10,
                "minScore": 0,
                "parts": 2,
                "isSubParts": true
            },
            {
                "id": "ass",
                "name": "Assignment",
                "weight": 20,
                "minScore": 0,
                "parts": 1,
                "isSubParts": false
            },
            {
                "id": "pe",
                "name": "Practical Exam (PE)",
                "weight": 30,
                "minScore": 0,
                "parts": 1,
                "isSubParts": false
            },
            {
                "id": "fe",
                "name": "Final Exam (FE)",
                "weight": 30,
                "minScore": 4.0,
                "parts": 1,
                "isSubParts": false,
                "isFE": true
            }
        ],
        "passingCriteria": {
            "minTotal": 5.0,
            "minFE": 4.0
        }
    },
    "SE_COM1": {
        "code": "SE_COM1",
        "nameVi": "Học phần 1 của Combo chuyên ngành",
        "nameEn": "Subject 1 of Elective Combo",
        "credits": 3,
        "isScored": true,
        "aliasSyllabus": "SE_COM*1",
        "hasDetailedSyllabus": true,
        "minAvgToPass": 5.0,
        "components": [
            {
                "id": "lab",
                "name": "Lab",
                "weight": 10,
                "minScore": 0,
                "parts": 4,
                "isSubParts": true
            },
            {
                "id": "pt",
                "name": "Progress Test",
                "weight": 10,
                "minScore": 0,
                "parts": 2,
                "isSubParts": true
            },
            {
                "id": "ass",
                "name": "Assignment",
                "weight": 20,
                "minScore": 0,
                "parts": 1,
                "isSubParts": false
            },
            {
                "id": "pe",
                "name": "Practical Exam (PE)",
                "weight": 30,
                "minScore": 0,
                "parts": 1,
                "isSubParts": false
            },
            {
                "id": "fe",
                "name": "Final Exam (FE)",
                "weight": 30,
                "minScore": 4.0,
                "parts": 1,
                "isSubParts": false,
                "isFE": true
            }
        ],
        "assessments": [
            {
                "id": "lab",
                "name": "Lab",
                "weight": 10,
                "minScore": 0,
                "parts": 4,
                "isSubParts": true
            },
            {
                "id": "pt",
                "name": "Progress Test",
                "weight": 10,
                "minScore": 0,
                "parts": 2,
                "isSubParts": true
            },
            {
                "id": "ass",
                "name": "Assignment",
                "weight": 20,
                "minScore": 0,
                "parts": 1,
                "isSubParts": false
            },
            {
                "id": "pe",
                "name": "Practical Exam (PE)",
                "weight": 30,
                "minScore": 0,
                "parts": 1,
                "isSubParts": false
            },
            {
                "id": "fe",
                "name": "Final Exam (FE)",
                "weight": 30,
                "minScore": 4.0,
                "parts": 1,
                "isSubParts": false,
                "isFE": true
            }
        ],
        "passingCriteria": {
            "minTotal": 5.0,
            "minFE": 4.0
        }
    },
    "SE_COM*2": {
        "code": "SE_COM*2",
        "nameVi": "Học phần 2 của Combo chuyên ngành",
        "nameEn": "Subject 2 of Elective Combo",
        "credits": 3,
        "isScored": true,
        "hasDetailedSyllabus": true,
        "minAvgToPass": 5.0,
        "components": [
            {
                "id": "lab",
                "name": "Lab",
                "weight": 10,
                "minScore": 0,
                "parts": 4,
                "isSubParts": true
            },
            {
                "id": "pt",
                "name": "Progress Test",
                "weight": 10,
                "minScore": 0,
                "parts": 2,
                "isSubParts": true
            },
            {
                "id": "ass",
                "name": "Assignment",
                "weight": 20,
                "minScore": 0,
                "parts": 1,
                "isSubParts": false
            },
            {
                "id": "pe",
                "name": "Practical Exam (PE)",
                "weight": 30,
                "minScore": 0,
                "parts": 1,
                "isSubParts": false
            },
            {
                "id": "fe",
                "name": "Final Exam (FE)",
                "weight": 30,
                "minScore": 4.0,
                "parts": 1,
                "isSubParts": false,
                "isFE": true
            }
        ],
        "assessments": [
            {
                "id": "lab",
                "name": "Lab",
                "weight": 10,
                "minScore": 0,
                "parts": 4,
                "isSubParts": true
            },
            {
                "id": "pt",
                "name": "Progress Test",
                "weight": 10,
                "minScore": 0,
                "parts": 2,
                "isSubParts": true
            },
            {
                "id": "ass",
                "name": "Assignment",
                "weight": 20,
                "minScore": 0,
                "parts": 1,
                "isSubParts": false
            },
            {
                "id": "pe",
                "name": "Practical Exam (PE)",
                "weight": 30,
                "minScore": 0,
                "parts": 1,
                "isSubParts": false
            },
            {
                "id": "fe",
                "name": "Final Exam (FE)",
                "weight": 30,
                "minScore": 4.0,
                "parts": 1,
                "isSubParts": false,
                "isFE": true
            }
        ],
        "passingCriteria": {
            "minTotal": 5.0,
            "minFE": 4.0
        }
    },
    "SE_COM2": {
        "code": "SE_COM2",
        "nameVi": "Học phần 2 của Combo chuyên ngành",
        "nameEn": "Subject 2 of Elective Combo",
        "credits": 3,
        "isScored": true,
        "aliasSyllabus": "SE_COM*2",
        "hasDetailedSyllabus": true,
        "minAvgToPass": 5.0,
        "components": [
            {
                "id": "lab",
                "name": "Lab",
                "weight": 10,
                "minScore": 0,
                "parts": 4,
                "isSubParts": true
            },
            {
                "id": "pt",
                "name": "Progress Test",
                "weight": 10,
                "minScore": 0,
                "parts": 2,
                "isSubParts": true
            },
            {
                "id": "ass",
                "name": "Assignment",
                "weight": 20,
                "minScore": 0,
                "parts": 1,
                "isSubParts": false
            },
            {
                "id": "pe",
                "name": "Practical Exam (PE)",
                "weight": 30,
                "minScore": 0,
                "parts": 1,
                "isSubParts": false
            },
            {
                "id": "fe",
                "name": "Final Exam (FE)",
                "weight": 30,
                "minScore": 4.0,
                "parts": 1,
                "isSubParts": false,
                "isFE": true
            }
        ],
        "assessments": [
            {
                "id": "lab",
                "name": "Lab",
                "weight": 10,
                "minScore": 0,
                "parts": 4,
                "isSubParts": true
            },
            {
                "id": "pt",
                "name": "Progress Test",
                "weight": 10,
                "minScore": 0,
                "parts": 2,
                "isSubParts": true
            },
            {
                "id": "ass",
                "name": "Assignment",
                "weight": 20,
                "minScore": 0,
                "parts": 1,
                "isSubParts": false
            },
            {
                "id": "pe",
                "name": "Practical Exam (PE)",
                "weight": 30,
                "minScore": 0,
                "parts": 1,
                "isSubParts": false
            },
            {
                "id": "fe",
                "name": "Final Exam (FE)",
                "weight": 30,
                "minScore": 4.0,
                "parts": 1,
                "isSubParts": false,
                "isFE": true
            }
        ],
        "passingCriteria": {
            "minTotal": 5.0,
            "minFE": 4.0
        }
    },
    "SE_COM*3": {
        "code": "SE_COM*3",
        "nameVi": "Học phần 3 của Combo chuyên ngành",
        "nameEn": "Subject 3 of Elective Combo",
        "credits": 3,
        "isScored": true,
        "hasDetailedSyllabus": true,
        "minAvgToPass": 5.0,
        "components": [
            {
                "id": "lab",
                "name": "Lab",
                "weight": 10,
                "minScore": 0,
                "parts": 4,
                "isSubParts": true
            },
            {
                "id": "pt",
                "name": "Progress Test",
                "weight": 10,
                "minScore": 0,
                "parts": 2,
                "isSubParts": true
            },
            {
                "id": "ass",
                "name": "Assignment",
                "weight": 20,
                "minScore": 0,
                "parts": 1,
                "isSubParts": false
            },
            {
                "id": "pe",
                "name": "Practical Exam (PE)",
                "weight": 30,
                "minScore": 0,
                "parts": 1,
                "isSubParts": false
            },
            {
                "id": "fe",
                "name": "Final Exam (FE)",
                "weight": 30,
                "minScore": 4.0,
                "parts": 1,
                "isSubParts": false,
                "isFE": true
            }
        ],
        "assessments": [
            {
                "id": "lab",
                "name": "Lab",
                "weight": 10,
                "minScore": 0,
                "parts": 4,
                "isSubParts": true
            },
            {
                "id": "pt",
                "name": "Progress Test",
                "weight": 10,
                "minScore": 0,
                "parts": 2,
                "isSubParts": true
            },
            {
                "id": "ass",
                "name": "Assignment",
                "weight": 20,
                "minScore": 0,
                "parts": 1,
                "isSubParts": false
            },
            {
                "id": "pe",
                "name": "Practical Exam (PE)",
                "weight": 30,
                "minScore": 0,
                "parts": 1,
                "isSubParts": false
            },
            {
                "id": "fe",
                "name": "Final Exam (FE)",
                "weight": 30,
                "minScore": 4.0,
                "parts": 1,
                "isSubParts": false,
                "isFE": true
            }
        ],
        "passingCriteria": {
            "minTotal": 5.0,
            "minFE": 4.0
        }
    },
    "SE_COM3": {
        "code": "SE_COM3",
        "nameVi": "Học phần 3 của Combo chuyên ngành",
        "nameEn": "Subject 3 of Elective Combo",
        "credits": 3,
        "isScored": true,
        "aliasSyllabus": "SE_COM*3",
        "hasDetailedSyllabus": true,
        "minAvgToPass": 5.0,
        "components": [
            {
                "id": "lab",
                "name": "Lab",
                "weight": 10,
                "minScore": 0,
                "parts": 4,
                "isSubParts": true
            },
            {
                "id": "pt",
                "name": "Progress Test",
                "weight": 10,
                "minScore": 0,
                "parts": 2,
                "isSubParts": true
            },
            {
                "id": "ass",
                "name": "Assignment",
                "weight": 20,
                "minScore": 0,
                "parts": 1,
                "isSubParts": false
            },
            {
                "id": "pe",
                "name": "Practical Exam (PE)",
                "weight": 30,
                "minScore": 0,
                "parts": 1,
                "isSubParts": false
            },
            {
                "id": "fe",
                "name": "Final Exam (FE)",
                "weight": 30,
                "minScore": 4.0,
                "parts": 1,
                "isSubParts": false,
                "isFE": true
            }
        ],
        "assessments": [
            {
                "id": "lab",
                "name": "Lab",
                "weight": 10,
                "minScore": 0,
                "parts": 4,
                "isSubParts": true
            },
            {
                "id": "pt",
                "name": "Progress Test",
                "weight": 10,
                "minScore": 0,
                "parts": 2,
                "isSubParts": true
            },
            {
                "id": "ass",
                "name": "Assignment",
                "weight": 20,
                "minScore": 0,
                "parts": 1,
                "isSubParts": false
            },
            {
                "id": "pe",
                "name": "Practical Exam (PE)",
                "weight": 30,
                "minScore": 0,
                "parts": 1,
                "isSubParts": false
            },
            {
                "id": "fe",
                "name": "Final Exam (FE)",
                "weight": 30,
                "minScore": 4.0,
                "parts": 1,
                "isSubParts": false,
                "isFE": true
            }
        ],
        "passingCriteria": {
            "minTotal": 5.0,
            "minFE": 4.0
        }
    },
    "SE_COM*4_ELE": {
        "code": "SE_COM*4_ELE",
        "nameVi": "Học phần 4 của Combo chuyên ngành",
        "nameEn": "Subject 4 of Elective Combo",
        "credits": 3,
        "isScored": true,
        "hasDetailedSyllabus": true,
        "minAvgToPass": 5.0,
        "components": [
            {
                "id": "lab",
                "name": "Lab",
                "weight": 10,
                "minScore": 0,
                "parts": 4,
                "isSubParts": true
            },
            {
                "id": "pt",
                "name": "Progress Test",
                "weight": 10,
                "minScore": 0,
                "parts": 2,
                "isSubParts": true
            },
            {
                "id": "ass",
                "name": "Assignment",
                "weight": 20,
                "minScore": 0,
                "parts": 1,
                "isSubParts": false
            },
            {
                "id": "pe",
                "name": "Practical Exam (PE)",
                "weight": 30,
                "minScore": 0,
                "parts": 1,
                "isSubParts": false
            },
            {
                "id": "fe",
                "name": "Final Exam (FE)",
                "weight": 30,
                "minScore": 4.0,
                "parts": 1,
                "isSubParts": false,
                "isFE": true
            }
        ],
        "assessments": [
            {
                "id": "lab",
                "name": "Lab",
                "weight": 10,
                "minScore": 0,
                "parts": 4,
                "isSubParts": true
            },
            {
                "id": "pt",
                "name": "Progress Test",
                "weight": 10,
                "minScore": 0,
                "parts": 2,
                "isSubParts": true
            },
            {
                "id": "ass",
                "name": "Assignment",
                "weight": 20,
                "minScore": 0,
                "parts": 1,
                "isSubParts": false
            },
            {
                "id": "pe",
                "name": "Practical Exam (PE)",
                "weight": 30,
                "minScore": 0,
                "parts": 1,
                "isSubParts": false
            },
            {
                "id": "fe",
                "name": "Final Exam (FE)",
                "weight": 30,
                "minScore": 4.0,
                "parts": 1,
                "isSubParts": false,
                "isFE": true
            }
        ],
        "passingCriteria": {
            "minTotal": 5.0,
            "minFE": 4.0
        }
    },
    "SE_COM4": {
        "code": "SE_COM4",
        "nameVi": "Học phần 4 của Combo chuyên ngành",
        "nameEn": "Subject 4 of Elective Combo",
        "credits": 3,
        "isScored": true,
        "aliasSyllabus": "SE_COM*4_ELE",
        "hasDetailedSyllabus": true,
        "minAvgToPass": 5.0,
        "components": [
            {
                "id": "lab",
                "name": "Lab",
                "weight": 10,
                "minScore": 0,
                "parts": 4,
                "isSubParts": true
            },
            {
                "id": "pt",
                "name": "Progress Test",
                "weight": 10,
                "minScore": 0,
                "parts": 2,
                "isSubParts": true
            },
            {
                "id": "ass",
                "name": "Assignment",
                "weight": 20,
                "minScore": 0,
                "parts": 1,
                "isSubParts": false
            },
            {
                "id": "pe",
                "name": "Practical Exam (PE)",
                "weight": 30,
                "minScore": 0,
                "parts": 1,
                "isSubParts": false
            },
            {
                "id": "fe",
                "name": "Final Exam (FE)",
                "weight": 30,
                "minScore": 4.0,
                "parts": 1,
                "isSubParts": false,
                "isFE": true
            }
        ],
        "assessments": [
            {
                "id": "lab",
                "name": "Lab",
                "weight": 10,
                "minScore": 0,
                "parts": 4,
                "isSubParts": true
            },
            {
                "id": "pt",
                "name": "Progress Test",
                "weight": 10,
                "minScore": 0,
                "parts": 2,
                "isSubParts": true
            },
            {
                "id": "ass",
                "name": "Assignment",
                "weight": 20,
                "minScore": 0,
                "parts": 1,
                "isSubParts": false
            },
            {
                "id": "pe",
                "name": "Practical Exam (PE)",
                "weight": 30,
                "minScore": 0,
                "parts": 1,
                "isSubParts": false
            },
            {
                "id": "fe",
                "name": "Final Exam (FE)",
                "weight": 30,
                "minScore": 4.0,
                "parts": 1,
                "isSubParts": false,
                "isFE": true
            }
        ],
        "passingCriteria": {
            "minTotal": 5.0,
            "minFE": 4.0
        }
    }
};

// Tham chiếu tương thích ngược cho SAMPLE_SUBJECTS_SCHEMA
const SAMPLE_SUBJECTS_SCHEMA = SUBJECT_SCHEMAS;

// Aliases cho các mã môn combo và giáo dục thể chất không có ký tự đặc biệt
if (SUBJECT_SCHEMAS["SE_COM*4_ELE"]) {
    SUBJECT_SCHEMAS["SE_COM4_ELE"] = SUBJECT_SCHEMAS["SE_COM*4_ELE"];
}
if (SUBJECT_SCHEMAS["PHE_COM*1"]) {
    SUBJECT_SCHEMAS["PHE_COM1"] = SUBJECT_SCHEMAS["PHE_COM*1"];
}
if (SUBJECT_SCHEMAS["PHE_COM*2"]) {
    SUBJECT_SCHEMAS["PHE_COM2"] = SUBJECT_SCHEMAS["PHE_COM*2"];
}
if (SUBJECT_SCHEMAS["PHE_COM*3"]) {
    SUBJECT_SCHEMAS["PHE_COM3"] = SUBJECT_SCHEMAS["PHE_COM*3"];
}

// =========================================================================
// 5. DANH MỤC 10 HỌC KỲ (KỲ 0 ĐẾN KỲ 9) KHÓA K20B (BIT_SE_K20B)
// =========================================================================
const CURRICULUM_SEMESTERS = [
    {
        "semester": 0,
        "title": "Học kỳ 0 (Chuẩn bị)",
        "description": "Giai đoạn định hướng, tiếng Anh chuẩn bị, nhạc cụ truyền thống và rèn luyện thể chất.",
        "subjects": [
            {
                "code": "TMI_ELE",
                "nameVi": "Nhạc cụ truyền thống",
                "nameEn": "Traditional musical instrument",
                "credits": 3,
                "isScored": true,
                "aliasSyllabus": "DTR103",
                "note": "Môn năng khiếu truyền thống FPTU - CÓ tính vào TBM kỳ."
            },
            {
                "code": "PHE_COM*1",
                "nameVi": "Giáo dục thể chất 1 (Vovinam 1)",
                "nameEn": "Physical Education 1",
                "credits": 2,
                "isScored": false,
                "aliasSyllabus": "VOV114",
                "isPhysicalEducation": true,
                "isConditionCourse": true,
                "note": "Không tính vào TBM kỳ. Điều kiện thi đạt >= 5.0 để Pass."
            },
            {
                "code": "PEN",
                "nameVi": "Tiếng Anh chuẩn bị",
                "nameEn": "Preparation English",
                "credits": 0,
                "isScored": false,
                "isPassFailOnly": true,
                "isConditionCourse": true,
                "note": "Chương trình tiếng Anh dự bị theo cấp độ. Đạt điều kiện để lên chuyên ngành."
            },
            {
                "code": "OTP101",
                "nameVi": "Định hướng & Rèn luyện tập trung",
                "nameEn": "Orientation and General Training Program",
                "credits": 0,
                "isScored": false,
                "isPassFailOnly": true,
                "isConditionCourse": true,
                "note": "Tháng rèn luyện tập trung / Tuần lễ định hướng FPTU."
            }
        ]
    },
    {
        "semester": 1,
        "title": "Học kỳ 1",
        "description": "Bước đệm lập trình C căn bản, kiến trúc máy tính và toán kỹ thuật.",
        "subjects": [
            {
                "code": "PRF192",
                "nameVi": "Cơ sở lập trình (C)",
                "nameEn": "Programming Fundamentals",
                "credits": 3,
                "isScored": true
            },
            {
                "code": "MAE101",
                "nameVi": "Toán cho ngành kỹ thuật",
                "nameEn": "Mathematics for Engineering",
                "credits": 3,
                "isScored": true
            },
            {
                "code": "CEA201",
                "nameVi": "Tổ chức & Kiến trúc máy tính",
                "nameEn": "Computer Organization and Architecture",
                "credits": 3,
                "isScored": true
            },
            {
                "code": "CSI106",
                "nameVi": "Nhập môn khoa học máy tính",
                "nameEn": "Introduction to Computer Science",
                "credits": 3,
                "isScored": true
            },
            {
                "code": "SSL101c",
                "nameVi": "Kỹ năng học tập đại học",
                "nameEn": "Academic Skills for University Success",
                "credits": 3,
                "isScored": true
            },
            {
                "code": "PHE_COM*2",
                "nameVi": "Giáo dục thể chất 2 (Vovinam 2)",
                "nameEn": "Physical Education 2",
                "credits": 2,
                "isScored": false,
                "aliasSyllabus": "VOV124",
                "isPhysicalEducation": true,
                "isConditionCourse": true,
                "note": "Không tính vào TBM kỳ."
            }
        ]
    },
    {
        "semester": 2,
        "title": "Học kỳ 2",
        "description": "Lập trình hướng đối tượng Java, Toán rời rạc, Hệ điều hành và Thiết kế Web.",
        "subjects": [
            {
                "code": "MAD101",
                "nameVi": "Toán rời rạc",
                "nameEn": "Discrete mathematics",
                "credits": 3,
                "isScored": true,
                "aliasSyllabus": "MAD101"
            },
            {
                "code": "PRO192",
                "nameVi": "Lập trình hướng đối tượng (Java)",
                "nameEn": "Object-Oriented Programming",
                "credits": 3,
                "isScored": true
            },
            {
                "code": "OSG202",
                "nameVi": "Hệ điều hành",
                "nameEn": "Operating Systems",
                "credits": 3,
                "isScored": true
            },
            {
                "code": "NWC204",
                "nameVi": "Mạng máy tính",
                "nameEn": "Computer Networking",
                "credits": 3,
                "isScored": true
            },
            {
                "code": "WED201c",
                "nameVi": "Thiết kế Web",
                "nameEn": "Web Design",
                "credits": 3,
                "isScored": true
            },
            {
                "code": "PHE_COM*3",
                "nameVi": "Giáo dục thể chất 3 (Vovinam 3)",
                "nameEn": "Physical Education 3",
                "credits": 2,
                "isScored": false,
                "aliasSyllabus": "VOV134",
                "isPhysicalEducation": true,
                "isConditionCourse": true,
                "note": "Không tính vào TBM kỳ."
            }
        ]
    },
    {
        "semester": 3,
        "title": "Học kỳ 3",
        "description": "Cơ sở dữ liệu SQL, Xác suất thống kê, Nhập môn KTPM và Ngoại ngữ Nhật 1.",
        "subjects": [
            {
                "code": "DBI202",
                "nameVi": "Các hệ cơ sở dữ liệu",
                "nameEn": "Introduction to Databases",
                "credits": 3,
                "isScored": true,
                "aliasSyllabus": "DBI202"
            },
            {
                "code": "MAS291",
                "nameVi": "Xác suất thống kê",
                "nameEn": "Statistics & Probability",
                "credits": 3,
                "isScored": true
            },
            {
                "code": "SWE202c",
                "nameVi": "Nhập môn Kỹ thuật phần mềm",
                "nameEn": "Introduction to Software Engineering",
                "credits": 3,
                "isScored": true
            },
            {
                "code": "JPD113",
                "nameVi": "Tiếng Nhật sơ cấp 1 (A1.1)",
                "nameEn": "Elementary Japanese 1 - A1.1",
                "credits": 3,
                "isScored": true
            },
            {
                "code": "LAB211",
                "nameVi": "Thực hành OOP với Java (Lab)",
                "nameEn": "OOP with Java Lab",
                "credits": 3,
                "isScored": false,
                "aliasSyllabus": "LAB211",
                "isPassFailOnly": true,
                "isConditionCourse": true,
                "note": "Is Scored: False - Không tính vào TBM kỳ, chỉ xét Pass / Not Pass."
            }
        ]
    },
    {
        "semester": 4,
        "title": "Học kỳ 4",
        "description": "Cấu trúc dữ liệu giải thuật, Java Web, IoT và Kỹ nghệ yêu cầu phần mềm.",
        "subjects": [
            {
                "code": "CSD201",
                "nameVi": "Cấu trúc dữ liệu và giải thuật",
                "nameEn": "Data Structures and Algorithms",
                "credits": 3,
                "isScored": true
            },
            {
                "code": "PRJ301",
                "nameVi": "Phát triển ứng dụng Java Web",
                "nameEn": "Java Web Application Development",
                "credits": 3,
                "isScored": true
            },
            {
                "code": "SWR302",
                "nameVi": "Yêu cầu phần mềm",
                "nameEn": "Software Requirement",
                "credits": 3,
                "isScored": true
            },
            {
                "code": "IOT102",
                "nameVi": "Internet vạn vật (IoT)",
                "nameEn": "Internet of Things",
                "credits": 3,
                "isScored": true
            },
            {
                "code": "JPD123",
                "nameVi": "Tiếng Nhật sơ cấp 2 (A1.2)",
                "nameEn": "Elementary Japanese 1 - A1.2",
                "credits": 3,
                "isScored": true
            }
        ]
    },
    {
        "semester": 5,
        "title": "Học kỳ 5",
        "description": "Dự án phần mềm SWP391, Kiểm thử phần mềm, UI/UX và Môn chuyên ngành Combo 1.",
        "isComboSemester": true,
        "comboSemesterKey": "SE_COM1",
        "subjects": [
            {
                "code": "SWP391",
                "nameVi": "Dự án phát triển phần mềm",
                "nameEn": "Software development project",
                "credits": 3,
                "isScored": true
            },
            {
                "code": "SWT301",
                "nameVi": "Kiểm thử phần mềm",
                "nameEn": "Software Testing",
                "credits": 3,
                "isScored": true
            },
            {
                "code": "WDU203c",
                "nameVi": "Thiết kế trải nghiệm người dùng (UI/UX)",
                "nameEn": "UI/UX Design",
                "credits": 3,
                "isScored": true
            },
            {
                "code": "SSG105",
                "nameVi": "Kỹ năng giao tiếp và cộng tác",
                "nameEn": "Communication & Collaboration Skills",
                "credits": 3,
                "isScored": true
            },
            {
                "code": "SE_COM*1",
                "nameVi": "Học phần 1 của Combo chuyên ngành",
                "nameEn": "Subject 1 of Elective Combo",
                "credits": 3,
                "isScored": true,
                "isCombo": true,
                "comboSlot": 1
            }
        ]
    },
    {
        "semester": 6,
        "title": "Học kỳ 6 (OJT - Thực tập doanh nghiệp)",
        "description": "Học kỳ thực tập thực tế tại doanh nghiệp công nghệ và phương pháp nghiên cứu.",
        "hasPredictions": false,
        "subjects": [
            {
                "code": "OJT202",
                "nameVi": "Thực tập doanh nghiệp (OJT)",
                "nameEn": "On-The-Job Training",
                "credits": 10,
                "isScored": false,
                "isPassFailOnly": true,
                "isConditionCourse": true,
                "note": "Đánh giá bởi doanh nghiệp thực tập và giảng viên hướng dẫn (40/30/30). Không tính vào TBM kỳ; Không xét Cóc Vàng / Top 100."
            },
            {
                "code": "ENW493c",
                "nameVi": "Phương pháp nghiên cứu & Viết học thuật",
                "nameEn": "Research Methods & Academic Writing Skills",
                "credits": 3,
                "isScored": true
            }
        ]
    },
    {
        "semester": 7,
        "title": "Học kỳ 7",
        "description": "Kiến trúc thiết kế phần mềm, Quản lý dự án, Khởi nghiệp 1 và Combo 2-3.",
        "isComboSemester": true,
        "comboSemesterKey": "SE_COM2_3",
        "subjects": [
            {
                "code": "SWD392",
                "nameVi": "Kiến trúc và thiết kế phần mềm",
                "nameEn": "Software Architecture and Design",
                "credits": 3,
                "isScored": true
            },
            {
                "code": "PMG201c",
                "nameVi": "Quản lý dự án",
                "nameEn": "Project Management",
                "credits": 3,
                "isScored": true
            },
            {
                "code": "EXE101",
                "nameVi": "Trải nghiệm khởi nghiệp 1",
                "nameEn": "Experiential Entrepreneurship 1",
                "credits": 3,
                "isScored": true
            },
            {
                "code": "SE_COM*2",
                "nameVi": "Học phần 2 của Combo chuyên ngành",
                "nameEn": "Subject 2 of Elective Combo",
                "credits": 3,
                "isScored": true,
                "isCombo": true,
                "comboSlot": 2
            },
            {
                "code": "SE_COM*3",
                "nameVi": "Học phần 3 của Combo chuyên ngành",
                "nameEn": "Subject 3 of Elective Combo",
                "credits": 3,
                "isScored": true,
                "isCombo": true,
                "comboSlot": 3
            }
        ]
    },
    {
        "semester": 8,
        "title": "Học kỳ 8",
        "description": "Lập trình di động, Đạo đức CNTT, Triết học, Kinh tế chính trị và Combo 4.",
        "isComboSemester": true,
        "comboSemesterKey": "SE_COM4",
        "hasPredictions": false,
        "subjects": [
            {
                "code": "PRM393",
                "nameVi": "Lập trình di động",
                "nameEn": "Mobile Programming",
                "credits": 3,
                "isScored": true
            },
            {
                "code": "ITE302c",
                "nameVi": "Đạo đức trong CNTT",
                "nameEn": "Ethics in IT",
                "credits": 3,
                "isScored": true
            },
            {
                "code": "EXE201",
                "nameVi": "Trải nghiệm khởi nghiệp 2",
                "nameEn": "Experiential Entrepreneurship 2",
                "credits": 3,
                "isScored": true
            },
            {
                "code": "MLN111",
                "nameVi": "Triết học Mác - Lênin",
                "nameEn": "Philosophy of Marxism – Leninism",
                "credits": 3,
                "isScored": true
            },
            {
                "code": "MLN122",
                "nameVi": "Kinh tế chính trị Mác - Lênin",
                "nameEn": "Political economics of Marxism – Leninism",
                "credits": 2,
                "isScored": true
            },
            {
                "code": "SE_COM*4_ELE",
                "nameVi": "Học phần 4 của Combo chuyên ngành",
                "nameEn": "Subject 4 of Elective Combo",
                "credits": 3,
                "isScored": true,
                "isCombo": true,
                "comboSlot": 4
            }
        ]
    },
    {
        "semester": 9,
        "title": "Học kỳ 9 (Tốt nghiệp)",
        "description": "Đồ án tốt nghiệp / Khóa luận chuyên ngành Kỹ thuật phần mềm và Chính trị.",
        "isGraduationSemester": true,
        "electiveKey": "SE_GRA_ELE",
        "hasPredictions": false,
        "subjects": [
            {
                "code": "SE_GRA_ELE",
                "nameVi": "Đồ án tốt nghiệp KTPM (CapStone Project)",
                "nameEn": "Graduation Elective - Software Engineering",
                "credits": 10,
                "isScored": true,
                "isCapstone": true,
                "aliasSyllabus": "SEP490",
                "note": "Khóa luận / Đồ án tốt nghiệp kỹ sư phần mềm (10 tín chỉ)."
            },
            {
                "code": "HCM202",
                "nameVi": "Tư tưởng Hồ Chí Minh",
                "nameEn": "Ho Chi Minh Ideology",
                "credits": 2,
                "isScored": true
            },
            {
                "code": "MLN131",
                "nameVi": "Chủ nghĩa xã hội khoa học",
                "nameEn": "Scientific socialism",
                "credits": 2,
                "isScored": true
            },
            {
                "code": "VNR202",
                "nameVi": "Lịch sử Đảng Cộng sản Việt Nam",
                "nameEn": "History of Communist Party of Vietnam",
                "credits": 2,
                "isScored": true
            }
        ]
    }
];

// =========================================================================
// 6. CÂU QUOTE TRUYỀN CẢM HỨNG CÓC FPTU
// =========================================================================
const MOTIVATIONAL_QUOTES = [
    "Bảng dự đoán điểm môn & TBM học kỳ dựa theo Syllabus K20 (BIT_SE_K20B).",
    "Điểm TBM học kỳ được tính theo trung bình cộng đơn thuần (không nhân hệ số tín chỉ).",
    "Kết quả mang tính chất tham khảo & dự đoán theo quy chế đào tạo Đại học FPT.",
    "Dữ liệu được cập nhật đối chiếu trực tiếp với Khung chương trình đào tạo K20B."
];

// Xuất module cho môi trường Node.js testing

// Inline Mascot SVG for reliable canvas export
const MASCOT_HAPPY_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 240" width="100%" height="100%" fill="none">
  <defs>
    <!-- Skin Gradients -->
    <linearGradient id="happySkinGrad" x1="40" y1="30" x2="180" y2="180" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="#FFB03A"/>
      <stop offset="60%" stop-color="#FB8C00"/>
      <stop offset="100%" stop-color="#E65100"/>
    </linearGradient>
    <radialGradient id="bellyGrad" cx="120" cy="145" r="50" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="#FFF8E7"/>
      <stop offset="70%" stop-color="#FFE0B2"/>
      <stop offset="100%" stop-color="#FFCC80"/>
    </radialGradient>
    <linearGradient id="shirtGrad" x1="70" y1="140" x2="170" y2="230" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="#FF6F00"/>
      <stop offset="100%" stop-color="#D84315"/>
    </linearGradient>
    <linearGradient id="eyePupilGrad" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#211103"/>
      <stop offset="100%" stop-color="#4E2606"/>
    </linearGradient>
    <linearGradient id="mouthGrad" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#880E4F"/>
      <stop offset="100%" stop-color="#4A0025"/>
    </linearGradient>
    <linearGradient id="tongueGrad" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#FF80AB"/>
      <stop offset="100%" stop-color="#F50057"/>
    </linearGradient>
    <!-- Drop Shadow Filter -->
    <filter id="softDropShadow" x="-10%" y="-10%" width="125%" height="125%">
      <feDropShadow dx="0" dy="4" stdDeviation="4" flood-color="#78350F" flood-opacity="0.18"/>
    </filter>
    <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="3" result="glow"/>
      <feComposite in="SourceGraphic" in2="glow" operator="over"/>
    </filter>
  </defs>

  <!-- Ground / Base Shadow -->
  <ellipse cx="120" cy="225" rx="65" ry="10" fill="#0F172A" fill-opacity="0.1"/>

  <!-- Frog Body & Head Group -->
  <g filter="url(#softDropShadow)">
    
    <!-- Waving Left Arm (Viewer's Left) -->
    <path d="M 68 140 C 50 125, 32 105, 36 90 C 39 78, 54 80, 58 94 C 62 106, 75 130, 80 144 Z" fill="url(#happySkinGrad)" stroke="#B44000" stroke-width="2.5" stroke-linejoin="round"/>
    <!-- Cute Waving Hand / Fingers -->
    <circle cx="37" cy="86" r="8" fill="#FFA726" stroke="#B44000" stroke-width="2"/>
    <circle cx="48" cy="80" r="7" fill="#FFA726" stroke="#B44000" stroke-width="2"/>
    <circle cx="30" cy="94" r="6.5" fill="#FFA726" stroke="#B44000" stroke-width="2"/>

    <!-- Right Arm (Viewer's Right) Holding Pencil -->
    <path d="M 172 145 C 190 140, 205 132, 210 145 C 213 155, 198 165, 180 162 Z" fill="url(#happySkinGrad)" stroke="#B44000" stroke-width="2.5"/>
    <!-- Pencil -->
    <g transform="translate(195, 110) rotate(25)">
      <polygon points="10,0 18,0 18,45 10,45" fill="#0066B2"/>
      <polygon points="10,45 18,45 14,56" fill="#FFE0B2"/>
      <polygon points="13,53 15,53 14,56" fill="#1E293B"/>
      <rect x="10" y="0" width="8" height="6" fill="#EF4444" rx="1"/>
    </g>
    <!-- Right Hand / Fingers gripping pencil -->
    <circle cx="204" cy="144" r="7.5" fill="#FFA726" stroke="#B44000" stroke-width="2"/>
    <circle cx="198" cy="151" r="6.5" fill="#FFA726" stroke="#B44000" stroke-width="2"/>

    <!-- Main Head & Chubby Face Base -->
    <path d="M 65 95 C 45 125, 48 165, 82 178 C 102 185, 138 185, 158 178 C 192 165, 195 125, 175 95 C 160 70, 80 70, 65 95 Z" fill="url(#happySkinGrad)" stroke="#B44000" stroke-width="3"/>

    <!-- Cute Chubby Cheeks Highlight -->
    <path d="M 66 128 C 58 140, 62 155, 78 162 C 72 150, 70 138, 66 128 Z" fill="#FFB74D" opacity="0.6"/>
    <path d="M 174 128 C 182 140, 178 155, 162 162 C 168 150, 170 138, 174 128 Z" fill="#FFB74D" opacity="0.6"/>

    <!-- Left Eye Bulb Socket -->
    <circle cx="85" cy="74" r="28" fill="url(#happySkinGrad)" stroke="#B44000" stroke-width="3"/>
    <!-- Right Eye Bulb Socket -->
    <circle cx="155" cy="74" r="28" fill="url(#happySkinGrad)" stroke="#B44000" stroke-width="3"/>

    <!-- Left Eye Sclera (White) -->
    <circle cx="87" cy="74" r="21" fill="#FFFFFF" stroke="#E2E8F0" stroke-width="1.5"/>
    <!-- Right Eye Sclera (White) -->
    <circle cx="153" cy="74" r="21" fill="#FFFFFF" stroke="#E2E8F0" stroke-width="1.5"/>

    <!-- Left Pupil & Highlights (Large, sparkling, joyful anime/chibi eyes) -->
    <circle cx="89" cy="74" r="14" fill="url(#eyePupilGrad)"/>
    <circle cx="93" cy="70" r="5.5" fill="#FFFFFF"/>
    <circle cx="83" cy="80" r="2.8" fill="#FFFFFF"/>

    <!-- Right Pupil & Highlights -->
    <circle cx="151" cy="74" r="14" fill="url(#eyePupilGrad)"/>
    <circle cx="155" cy="70" r="5.5" fill="#FFFFFF"/>
    <circle cx="145" cy="80" r="2.8" fill="#FFFFFF"/>

    <!-- Eyelid Creases (Cute friendly expression) -->
    <path d="M 68 56 C 78 48, 98 50, 106 58" stroke="#B44000" stroke-width="3" stroke-linecap="round"/>
    <path d="M 172 56 C 162 48, 142 50, 134 58" stroke="#B44000" stroke-width="3" stroke-linecap="round"/>

    <!-- Toad Brow Freckles / Spots (As seen in FPT official mascot) -->
    <circle cx="120" cy="62" r="3" fill="#D84315" opacity="0.45"/>
    <circle cx="114" cy="68" r="2.5" fill="#D84315" opacity="0.45"/>
    <circle cx="126" cy="68" r="2.5" fill="#D84315" opacity="0.45"/>
    <circle cx="120" cy="74" r="2" fill="#D84315" opacity="0.45"/>

    <!-- Light Peach/Cream Chin & Throat Area -->
    <path d="M 88 135 C 92 155, 148 155, 152 135 C 156 160, 145 178, 120 180 C 95 178, 84 160, 88 135 Z" fill="url(#bellyGrad)"/>

    <!-- Cheerful Open Mouth (Wide happy smile) -->
    <path d="M 82 124 C 95 118, 145 118, 158 124 C 162 132, 156 160, 120 162 C 84 160, 78 132, 82 124 Z" fill="url(#mouthGrad)" stroke="#7A1D00" stroke-width="2.5" stroke-linejoin="round"/>
    
    <!-- Mouth Tongue -->
    <path d="M 98 148 C 104 138, 136 138, 142 148 C 136 160, 104 160, 98 148 Z" fill="url(#tongueGrad)"/>

    <!-- Cheek Blush (Soft pink/orange glow) -->
    <ellipse cx="70" cy="132" rx="9" ry="5.5" fill="#FF3D00" opacity="0.25"/>
    <ellipse cx="170" cy="132" rx="9" ry="5.5" fill="#FF3D00" opacity="0.25"/>

    <!-- Nostril Dots -->
    <ellipse cx="114" cy="112" rx="1.5" ry="2" fill="#9A3412"/>
    <ellipse cx="126" cy="112" rx="1.5" ry="2" fill="#9A3412"/>

    <!-- FPT POLO SHIRT (Vibrant orange with crisp white trim) -->
    <!-- Shirt Body -->
    <path d="M 72 172 L 64 220 L 176 220 L 168 172 C 150 182, 90 182, 72 172 Z" fill="url(#shirtGrad)" stroke="#BF360C" stroke-width="2.5"/>

    <!-- White Collar Trim -->
    <!-- Left Collar Wing -->
    <path d="M 120 180 L 86 168 L 96 195 L 120 186 Z" fill="#FFFFFF" stroke="#CBD5E1" stroke-width="1.5"/>
    <!-- Right Collar Wing -->
    <path d="M 120 180 L 154 168 L 144 195 L 120 186 Z" fill="#FFFFFF" stroke="#CBD5E1" stroke-width="1.5"/>
    <!-- Collar Double-line Piping Accent -->
    <path d="M 88 171 L 96 193" stroke="#FF6F00" stroke-width="1.2" stroke-linecap="round"/>
    <path d="M 152 171 L 144 193" stroke="#FF6F00" stroke-width="1.2" stroke-linecap="round"/>

    <!-- Polo Placket & Buttons -->
    <rect x="116" y="184" width="8" height="28" fill="#FFFFFF" rx="2" stroke="#CBD5E1" stroke-width="1"/>
    <circle cx="120" cy="192" r="1.8" fill="#FF6F00"/>
    <circle cx="120" cy="204" r="1.8" fill="#FF6F00"/>

    <!-- FPT University Crest / Logo on Chest (Viewer's Right) -->
    <g transform="translate(136, 194) scale(0.65)">
      <rect x="0" y="0" width="34" height="15" rx="3" fill="#FFFFFF" opacity="0.95"/>
      <text x="3" y="11" font-family="'Plus Jakarta Sans', Arial, sans-serif" font-weight="900" font-size="8" fill="#FF6F00">FPT</text>
      <text x="21" y="7" font-family="'Plus Jakarta Sans', Arial, sans-serif" font-weight="700" font-size="4" fill="#0066B2">EDU</text>
      <text x="21" y="12" font-family="'Plus Jakarta Sans', Arial, sans-serif" font-weight="600" font-size="3.5" fill="#10B981">UNI</text>
    </g>

    <!-- Cute Sparkles / Stars near Head -->
    <g fill="#FFD54F" opacity="0.9">
      <path d="M 38 60 Q 42 60 42 56 Q 42 60 46 60 Q 42 60 42 64 Q 42 60 38 60 Z"/>
      <path d="M 198 68 Q 203 68 203 63 Q 203 68 208 68 Q 203 68 203 73 Q 203 68 198 68 Z"/>
    </g>

  </g>
</svg>`;

if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        COURSE_TEMPLATES,
        COMBO_TRACKS,
        GRADUATION_ELECTIVES,
        SUBJECT_SCHEMAS,
        SAMPLE_SUBJECTS_SCHEMA,
        CURRICULUM_SEMESTERS,
        MOTIVATIONAL_QUOTES,
        MASCOT_HAPPY_SVG,
        getComboTrack
    };
}
