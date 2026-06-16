import React, { useState, useEffect } from "react";
import {
  Users,
  MonitorPlay,
  FileSpreadsheet,
  Settings,
  UserCog,
  LogOut,
  Plus,
  Edit2,
  Trash2,
  Search,
  X,
  CheckCircle2,
  BookOpen,
  ExternalLink,
  GraduationCap,
  LayoutDashboard,
  Download,
  Folder,
  Clock,
  ShieldAlert,
  Lock,
  Contact,
  ArrowRight,
  Layers,
  GraduationCap as StudentIcon,
  User,
  Key,
  BookType,
  AlertTriangle,
  Maximize,
  Image as ImageIcon,
  Palette,
  Printer,
  ShieldCheck, // <-- TAMBAHKAN IMPORT INI
} from "lucide-react";

// === FIREBASE CONFIGURATION ===
import { initializeApp } from "firebase/app";
import {
  getAuth,
  signInAnonymously,
  onAuthStateChanged,
  signInWithCustomToken,
} from "firebase/auth";
import {
  getFirestore,
  collection,
  onSnapshot,
  doc,
  setDoc,
  deleteDoc,
} from "firebase/firestore";

// Konfigurasi Firebase Anda (Akan digunakan saat Anda deploy ke Blogger)
const myFirebaseConfig = {
  apiKey: "AIzaSyDv2WMjCnOlXOKHpU7uI5mnc_dz3H35DVY",
  authDomain: "cbt-smks-cordova-tebo.firebaseapp.com",
  projectId: "cbt-smks-cordova-tebo",
  storageBucket: "cbt-smks-cordova-tebo.firebasestorage.app",
  messagingSenderId: "160812636650",
  appId: "1:160812636650:web:b10aadd42a3634f47fba93",
};

// Logika adaptasi lingkungan (Otomatis mendeteksi jika berjalan di Preview atau di Blogger Anda)
const isCanvas = typeof __firebase_config !== "undefined";
const configToUse = isCanvas ? JSON.parse(__firebase_config) : myFirebaseConfig;

const app = initializeApp(configToUse);
const auth = getAuth(app);
const db = getFirestore(app);
const appId =
  isCanvas && typeof __app_id !== "undefined" ? __app_id : "cbt-blogger-app";

// Fungsi Helper Path Firebase
const getColPath = (col) =>
  isCanvas ? `artifacts/${appId}/public/data/${col}` : col;

// --- KONFIGURASI TEMA WARNA DINAMIS ---
const THEMES = {
  emerald: {
    bg: "bg-[#11A367]",
    hover: "hover:bg-[#0b8a54]",
    text: "text-[#11A367]",
    border: "border-[#11A367]",
    ring: "focus:ring-[#11A367]",
    shadow: "shadow-[#11A367]/30",
    lightBg: "bg-[#11A367]/10",
    gradient: "from-[#11A367] to-[#0A633D]",
  },
  blue: {
    bg: "bg-[#1877F2]",
    hover: "hover:bg-[#155fc0]",
    text: "text-[#1877F2]",
    border: "border-[#1877F2]",
    ring: "focus:ring-[#1877F2]",
    shadow: "shadow-[#1877F2]/30",
    lightBg: "bg-[#1877F2]/10",
    gradient: "from-[#1877F2] to-[#0A4A9C]",
  },
  indigo: {
    bg: "bg-indigo-600",
    hover: "hover:bg-indigo-700",
    text: "text-indigo-600",
    border: "border-indigo-600",
    ring: "focus:ring-indigo-600",
    shadow: "shadow-indigo-600/30",
    lightBg: "bg-indigo-600/10",
    gradient: "from-indigo-600 to-indigo-900",
  },
  rose: {
    bg: "bg-rose-600",
    hover: "hover:bg-rose-700",
    text: "text-rose-600",
    border: "border-rose-600",
    ring: "focus:ring-rose-600",
    shadow: "shadow-rose-600/30",
    lightBg: "bg-rose-600/10",
    gradient: "from-rose-600 to-rose-900",
  },
};

export default function App() {
  const [userAuth, setUserAuth] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [activeTab, setActiveTab] = useState("student");
  const [loginError, setLoginError] = useState("");
  const [loading, setLoading] = useState(true);

  // State Data Tersinkronisasi Firebase
  const [students, setStudents] = useState([]);
  const [exams, setExams] = useState([]);
  const [admins, setAdmins] = useState([]);
  const [appSettings, setAppSettings] = useState(null);

  const [adminMenu, setAdminMenu] = useState("monitoring");
  const [tokenInput, setTokenInput] = useState("");
  const [tokenError, setTokenError] = useState("");
  const [isTokenMode, setIsTokenMode] = useState(false);
  const [isExamStarted, setIsExamStarted] = useState(false);
  // const [violationCount, setViolationCount] = useState(0); // Dihapus karena tidak dipakai untuk menghindari warning

  // 1. Inisialisasi Otentikasi Firebase
  useEffect(() => {
    const initAuth = async () => {
      try {
        if (
          typeof __initial_auth_token !== "undefined" &&
          __initial_auth_token
        ) {
          await signInWithCustomToken(auth, __initial_auth_token);
        } else {
          await signInAnonymously(auth);
        }
      } catch (err) {
        console.error("Auth Error:", err);
      }
    };
    initAuth();
    const unsubscribe = onAuthStateChanged(auth, setUserAuth);
    return () => unsubscribe();
  }, []);

  // 2. Tarik Data Realtime dari Firestore
  useEffect(() => {
    if (!userAuth) return;

    const unsubStudents = onSnapshot(
      collection(db, getColPath("students")),
      (snap) => {
        setStudents(snap.docs.map((d) => d.data()));
      },
      console.error
    );

    const unsubExams = onSnapshot(
      collection(db, getColPath("exams")),
      (snap) => {
        setExams(snap.docs.map((d) => d.data()));
      },
      console.error
    );

    const unsubAdmins = onSnapshot(
      collection(db, getColPath("admins")),
      (snap) => {
        const data = snap.docs.map((d) => d.data());
        setAdmins(data);
        // Buat admin default jika database kosong
        if (data.length === 0) {
          setDoc(doc(db, getColPath("admins"), "admin-1"), {
            id: "admin-1",
            name: "Admin Utama",
            username: "admin",
            password: "admin",
            role: "Hak Penuh",
          });
        }
      },
      console.error
    );

    const unsubSettings = onSnapshot(
      doc(db, getColPath("settings"), "global"),
      (docSnap) => {
        if (docSnap.exists()) {
          setAppSettings(docSnap.data());
          setLoading(false);
        } else {
          // Buat pengaturan default jika database kosong
          const defaultSettings = {
            schoolName: "SMKs Cordova Tebo",
            logoUrl: null,
            theme: "emerald",
            maintenanceMode: false,
            printSettings: {
              kepalaSekolah: "Dr. Ahmad Dahlan, M.Pd",
              nipKepalaSekolah: "19800101 200501 1 001",
              tanggalCetak: new Date().toISOString().split("T")[0],
              ttdUrl: null,
            },
          };
          setDoc(doc(db, getColPath("settings"), "global"), defaultSettings);
          setAppSettings(defaultSettings);
          setLoading(false);
        }
      },
      console.error
    );

    return () => {
      unsubStudents();
      unsubExams();
      unsubAdmins();
      unsubSettings();
    };
  }, [userAuth]);

  // Efek Keamanan (Proctoring) saat ujian dimulai
  useEffect(() => {
    if (currentUser?.role !== "student" || !isExamStarted) return;

    const handleVisibilityChange = () => {
      if (document.hidden) {
        alert(
          "PELANGGARAN FATAL! Anda terdeteksi keluar dari layar ujian. Akun Anda diblokir otomatis oleh sistem dan ujian dihentikan!"
        );

        // Update status di Firebase
        setDoc(
          doc(db, getColPath("students"), currentUser.data.id.toString()),
          { status: "Diblokir" },
          { merge: true }
        );

        if (document.fullscreenElement) {
          document.exitFullscreen().catch((err) => console.warn(err));
        }

        setCurrentUser(null);
        setLoginError("");
        setTokenInput("");
        setTokenError("");
        setIsTokenMode(false);
        setIsExamStarted(false);
        // setViolationCount(0);
      }
    };

    const handleContextMenu = (e) => e.preventDefault();
    const handleKeyDown = (e) => {
      if (
        (e.ctrlKey && ["c", "v", "x", "p"].includes(e.key.toLowerCase())) ||
        e.key === "F12"
      ) {
        e.preventDefault();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    document.addEventListener("contextmenu", handleContextMenu);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      document.removeEventListener("contextmenu", handleContextMenu);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isExamStarted, currentUser]);

  const handleLogin = (e, type) => {
    e.preventDefault();
    setLoginError("");
    const formData = new FormData(e.target);

    if (type === "student") {
      const nisn = formData.get("nisn");
      const tingkat = formData.get("tingkat");
      const kelas = formData.get("kelas");
      const subject = formData.get("subject");

      const student = students.find(
        (s) => s.nisn === nisn && s.tingkat === tingkat && s.kelas === kelas
      );
      if (!student)
        return setLoginError(
          "Kombinasi NISN, Tingkat, atau Kelas tidak ditemukan!"
        );
      if (student.status === "Diblokir")
        return setLoginError(
          "Akun Anda DIBLOKIR otomatis karena indikasi pelanggaran!"
        );

      const now = new Date();
      const hasActiveExam = exams.some((e) => {
        const start = new Date(e.jadwalMulai);
        const end = new Date(e.batasAkhir);
        return (
          e.subject === subject &&
          e.tingkat === tingkat &&
          now >= start &&
          now <= end
        );
      });

      if (!hasActiveExam) {
        const examExists = exams.some(
          (e) => e.subject === subject && e.tingkat === tingkat
        );
        if (!examExists)
          return setLoginError(
            `Ujian ${subject} tidak ditemukan untuk tingkat ${tingkat}!`
          );
      }

      setCurrentUser({
        role: "student",
        data: student,
        activeSubject: subject,
      });
    } else {
      const idField = formData.get("username");
      const pass = formData.get("password");
      const admin = admins.find(
        (a) => a.username === idField && a.password === pass
      );
      if (admin) setCurrentUser({ role: "admin", data: admin });
      else setLoginError("Username atau Password admin salah!");
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setLoginError("");
    setTokenInput("");
    setTokenError("");
    setIsTokenMode(false);
    setIsExamStarted(false);
    // setViolationCount(0);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F5F7F9]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const t = THEMES[appSettings?.theme] || THEMES.emerald;
  const activeExam = exams.find(
    (e) =>
      e.subject === currentUser?.activeSubject &&
      e.tingkat === currentUser?.data?.tingkat
  );

  // ==========================================
  // VIEW: PORTAL LOGIN (SPLIT VIEW)
  // ==========================================
  if (!currentUser) {
    const availableSubjects = [...new Set(exams.map((e) => e.subject))];
    const availableClasses = [...new Set(students.map((s) => s.kelas))].filter(
      Boolean
    );

    return (
      <div className="min-h-screen bg-[#F5F7F9] flex flex-col items-center justify-center p-4 sm:p-8 font-sans">
        <div className="max-w-[850px] w-full bg-white rounded-[24px] shadow-2xl flex flex-col md:flex-row overflow-hidden min-h-[550px] border border-slate-100">
          <div
            className={`w-full md:w-1/2 bg-gradient-to-b ${t.gradient} p-10 flex flex-col items-center justify-center text-center text-white relative transition-colors duration-500`}
          >
            <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white via-transparent to-transparent"></div>

            <div className="relative z-10 flex flex-col items-center">
              {appSettings.logoUrl ? (
                <img
                  src={appSettings.logoUrl}
                  alt="Logo"
                  className="w-32 h-32 object-contain mb-6 drop-shadow-lg"
                />
              ) : (
                <div className="w-28 h-28 bg-white/20 rounded-full flex items-center justify-center mb-6 shadow-inner border border-white/30 backdrop-blur-sm">
                  <StudentIcon className="text-white w-14 h-14" />
                </div>
              )}
              <h1 className="text-3xl font-extrabold mb-2 tracking-tight">
                Aplikasi CBT
              </h1>
              <p className="text-white/80 font-light tracking-wide uppercase text-sm">
                Portal Ujian Online
              </p>

              <div className="w-16 h-px bg-white/30 my-8"></div>

              <h2 className="text-xl font-bold tracking-wide">
                {appSettings.schoolName}
              </h2>
            </div>
          </div>

          <div className="w-full md:w-1/2 p-8 sm:p-12 bg-white flex flex-col">
            <div className="flex gap-4 mb-8 justify-center md:justify-start">
              <button
                onClick={() => {
                  setActiveTab("student");
                  setLoginError("");
                }}
                className={`flex items-center gap-2 px-6 py-2.5 rounded-full text-sm font-bold transition-all ${
                  activeTab === "student"
                    ? `${t.bg} text-white shadow-md ${t.shadow}`
                    : "text-slate-500 hover:bg-slate-50"
                }`}
              >
                <StudentIcon className="w-4 h-4" /> Siswa
              </button>
              <button
                onClick={() => {
                  setActiveTab("admin");
                  setLoginError("");
                }}
                className={`flex items-center gap-2 px-6 py-2.5 rounded-full text-sm font-bold transition-all ${
                  activeTab === "admin"
                    ? `${t.bg} text-white shadow-md ${t.shadow}`
                    : "text-slate-500 hover:bg-slate-50"
                }`}
              >
                <UserCog className="w-4 h-4" /> Admin
              </button>
            </div>

            {loginError && (
              <div className="mb-6 p-3 bg-red-50 border border-red-200 text-red-600 rounded-lg text-xs font-bold flex items-center gap-2">
                <ShieldAlert className="w-4 h-4" /> {loginError}
              </div>
            )}

            {activeTab === "student" ? (
              appSettings.maintenanceMode ? (
                <div className="text-center py-10 my-auto">
                  <Settings className="w-12 h-12 text-slate-300 mx-auto mb-4 animate-spin-slow" />
                  <h3 className="text-lg font-bold text-slate-800">
                    Sistem Dalam Perbaikan
                  </h3>
                  <p className="text-sm text-slate-500 mt-2">
                    Portal ujian ditutup sementara waktu. Harap tunggu arahan
                    pengawas.
                  </p>
                </div>
              ) : (
                <form
                  onSubmit={(e) => handleLogin(e, "student")}
                  className="space-y-5 flex-1"
                >
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase">
                      NISN
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                        <Contact className={`w-4 h-4 ${t.text}`} />
                      </div>
                      <input
                        name="nisn"
                        type="text"
                        required
                        placeholder="Masukkan NISN"
                        className={`pl-10 w-full px-4 py-3 rounded-lg border border-slate-300 focus:${t.border} text-slate-800 text-sm focus:ring-1 ${t.ring} outline-none transition-all`}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase">
                        Tingkat
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                          <Layers className={`w-4 h-4 ${t.text}`} />
                        </div>
                        <select
                          name="tingkat"
                          required
                          className={`pl-10 w-full px-4 py-3 rounded-lg border border-slate-300 focus:${t.border} text-slate-800 text-sm focus:ring-1 ${t.ring} outline-none transition-all appearance-none bg-white`}
                        >
                          <option value="">-- Pilih --</option>
                          <option value="10">10</option>
                          <option value="11">11</option>
                          <option value="12">12</option>
                        </select>
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase">
                        Kelas
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                          <StudentIcon className={`w-4 h-4 ${t.text}`} />
                        </div>
                        <select
                          name="kelas"
                          required
                          className={`pl-10 w-full px-4 py-3 rounded-lg border border-slate-300 focus:${t.border} text-slate-800 text-sm focus:ring-1 ${t.ring} outline-none transition-all appearance-none bg-white`}
                        >
                          <option value="">-- Pilih --</option>
                          {availableClasses.map((c) => (
                            <option key={c} value={c}>
                              {c}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase">
                      Mata Pelajaran
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                        <BookType className={`w-4 h-4 ${t.text}`} />
                      </div>
                      <select
                        name="subject"
                        required
                        className={`pl-10 w-full px-4 py-3 rounded-lg border border-slate-300 focus:${t.border} text-slate-800 text-sm focus:ring-1 ${t.ring} outline-none transition-all appearance-none bg-white`}
                      >
                        <option value="">-- Pilih --</option>
                        {availableSubjects.map((sub) => (
                          <option key={sub} value={sub}>
                            {sub}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <button
                    type="submit"
                    className={`w-full py-3.5 ${t.bg} ${t.hover} text-white rounded-lg font-bold text-sm tracking-wide transition-all active:scale-[0.98] mt-6 flex items-center justify-center gap-2`}
                  >
                    <ArrowRight className="w-4 h-4" /> LOGIN UJIAN
                  </button>
                </form>
              )
            ) : (
              <form
                onSubmit={(e) => handleLogin(e, "admin")}
                className="space-y-5 flex-1"
              >
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase">
                    Username Admin
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                      <Contact className={`w-4 h-4 ${t.text}`} />
                    </div>
                    <input
                      name="username"
                      type="text"
                      required
                      placeholder="admin"
                      defaultValue="admin"
                      className={`pl-10 w-full px-4 py-3 rounded-lg border border-slate-300 focus:${t.border} text-slate-800 text-sm focus:ring-1 ${t.ring} outline-none transition-all`}
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase">
                    Password
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                      <Key className={`w-4 h-4 ${t.text}`} />
                    </div>
                    <input
                      name="password"
                      type="password"
                      required
                      placeholder="••••••••"
                      defaultValue="admin"
                      className={`pl-10 w-full px-4 py-3 rounded-lg border border-slate-300 focus:${t.border} text-slate-800 text-sm focus:ring-1 ${t.ring} outline-none transition-all`}
                    />
                  </div>
                </div>
                <button
                  type="submit"
                  className={`w-full py-3.5 ${t.bg} ${t.hover} text-white rounded-lg font-bold text-sm tracking-wide transition-all active:scale-[0.98] mt-6 flex items-center justify-center gap-2`}
                >
                  <ArrowRight className="w-4 h-4" /> LOGIN ADMIN
                </button>
              </form>
            )}
          </div>
        </div>
        <p className="mt-8 text-slate-500/80 text-xs font-bold tracking-wide">
          © 2026 Hak Cipta Pengembang Tamrin, S.Pd
        </p>
      </div>
    );
  }

  // ==========================================
  // VIEW: DASHBOARD SISWA & UJIAN
  // ==========================================
  if (currentUser.role === "student") {
    const handleStartExam = async () => {
      if (!isTokenMode) {
        setIsTokenMode(true);
        return;
      }
      if (tokenInput !== activeExam?.token) {
        setTokenError("Token tidak valid!");
        return;
      }

      // Update Firestore: Sedang Ujian
      await setDoc(
        doc(db, getColPath("students"), currentUser.data.id.toString()),
        { ...currentUser.data, status: "Sedang Ujian" },
        { merge: true }
      );
      setIsExamStarted(true);

      try {
        if (document.documentElement.requestFullscreen)
          await document.documentElement.requestFullscreen();
      } catch (err) {}
    };

    const handleFinishExam = async () => {
      if (
        window.confirm(
          "Yakin ingin menyelesaikan ujian? Anda tidak dapat kembali ke lembar soal setelah ini."
        )
      ) {
        await setDoc(
          doc(db, getColPath("students"), currentUser.data.id.toString()),
          { ...currentUser.data, status: "Selesai" },
          { merge: true }
        );
        if (document.fullscreenElement)
          document.exitFullscreen().catch((err) => {});
        handleLogout();
      }
    };

    if (isExamStarted) {
      return (
        <div className="fixed inset-0 z-50 bg-[#F5F7F9] flex flex-col h-screen overflow-hidden">
          <header
            className={`${t.bg} text-white px-6 py-3 flex justify-between items-center shadow-md z-10 shrink-0`}
          >
            <div className="flex items-center gap-4">
              <ShieldCheck className="w-6 h-6" />
              <div>
                <h2 className="font-bold text-sm uppercase tracking-wide">
                  {activeExam?.subject}
                </h2>
                <p className="text-[10px] text-white/80">
                  {currentUser.data.name} | {currentUser.data.nisn}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-6">
              <div className="bg-white/10 px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-2">
                <Clock className="w-4 h-4" /> Waktu Berjalan
              </div>
              <button
                onClick={handleFinishExam}
                className="bg-red-600 hover:bg-red-700 text-white px-5 py-2 rounded-lg text-xs font-bold uppercase tracking-widest shadow-md transition-colors"
              >
                SELESAI UJIAN
              </button>
            </div>
          </header>
          <div className="flex-1 w-full bg-white relative">
            <iframe
              src={activeExam?.link}
              className="w-full h-full border-0 absolute inset-0"
              title="Lembar Ujian"
              sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
            ></iframe>
            <div className="absolute bottom-4 right-4 bg-slate-900/80 backdrop-blur-md text-white px-4 py-2 rounded-xl text-[10px] font-bold shadow-lg pointer-events-none flex items-center gap-2">
              <Maximize className="w-3 h-3 text-emerald-400" /> Keamanan Layar
              Penuh Aktif
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="min-h-screen bg-[#F5F7F9] flex flex-col items-center justify-center p-4 font-sans">
        <div className="w-full max-w-[500px] bg-white rounded-2xl shadow-xl overflow-hidden animate-in zoom-in-95 duration-500 border border-slate-100">
          <div
            className={`${t.bg} p-6 text-center text-white flex flex-col items-center transition-colors duration-500`}
          >
            <Contact className="w-10 h-10 mb-2 opacity-95" />
            <h2 className="text-xl font-bold tracking-wide uppercase">
              Kartu Peserta Ujian
            </h2>
          </div>
          <div className="p-8">
            <div className="space-y-4 mb-8">
              <div className="flex border-b border-slate-100 pb-3">
                <span className="w-1/3 text-slate-500 text-sm text-right pr-4">
                  NISN :
                </span>
                <span className="w-2/3 text-slate-800 font-bold text-sm">
                  {currentUser.data.nisn}
                </span>
              </div>
              <div className="flex border-b border-slate-100 pb-3">
                <span className="w-1/3 text-slate-500 text-sm text-right pr-4">
                  Nama Lengkap :
                </span>
                <span className="w-2/3 text-slate-800 font-bold text-sm">
                  {currentUser.data.name}
                </span>
              </div>
              <div className="flex border-b border-slate-100 pb-3">
                <span className="w-1/3 text-slate-500 text-sm text-right pr-4">
                  Kelas Rombel :
                </span>
                <span className="w-2/3 text-slate-800 font-bold text-sm">
                  {currentUser.data.tingkat} {currentUser.data.kelas}
                </span>
              </div>
              <div className="flex pb-2">
                <span className="w-1/3 text-slate-500 text-sm text-right pr-4">
                  Mata Pelajaran :
                </span>
                <span className={`w-2/3 ${t.text} font-bold text-sm`}>
                  {currentUser.activeSubject}
                </span>
              </div>
            </div>
            <div className="bg-[#FFF8E1] rounded-xl p-5 text-center flex flex-col items-center gap-2 mb-6 border border-amber-200/50">
              <ShieldAlert
                className="w-8 h-8 text-[#FFC107]"
                fill="#FFC107"
                color="white"
              />
              <p className="text-[#795548] text-[13px] font-semibold leading-relaxed">
                Sistem pengawasan cerdas aktif. Jika Anda keluar, meminimalkan,
                atau membagi layar (split screen), sistem akan{" "}
                <span className="font-bold text-red-600">MEMBLOKIR</span> akun
                Anda secara otomatis!
              </p>
            </div>
            {isTokenMode && (
              <div className="animate-in slide-in-from-top-2 duration-300 mb-6">
                <div
                  className={`mb-5 p-4 rounded-xl border ${t.lightBg} ${t.border} text-center shadow-sm`}
                >
                  <p
                    className={`text-xs font-bold ${t.text} uppercase tracking-wider mb-1 flex items-center justify-center gap-1.5`}
                  >
                    <Key className="w-3.5 h-3.5" /> Token Ujian Anda
                  </p>
                  <h3
                    className={`text-4xl font-black ${t.text} tracking-widest my-1`}
                  >
                    {activeExam?.token}
                  </h3>
                  <p className="text-[10px] text-slate-600 font-medium">
                    Silakan ketik ulang token di atas ke dalam kolom di bawah
                    ini
                  </p>
                </div>
                <input
                  type="text"
                  value={tokenInput}
                  onChange={(e) => {
                    setTokenInput(e.target.value.toUpperCase());
                    setTokenError("");
                  }}
                  placeholder="KETIK ULANG TOKEN"
                  className={`w-full px-4 py-3.5 rounded-xl border-2 border-slate-300 focus:${t.border} text-center font-black text-xl text-slate-800 outline-none transition-all uppercase tracking-widest bg-slate-50 focus:bg-white shadow-inner`}
                />
                {tokenError && (
                  <p className="text-red-500 text-xs font-bold text-center mt-2">
                    {tokenError}
                  </p>
                )}
              </div>
            )}
            <button
              onClick={handleStartExam}
              className={`w-full py-3.5 ${t.bg} ${t.hover} text-white rounded-lg font-bold text-sm uppercase tracking-wide transition-all active:scale-95 flex items-center justify-center gap-2 shadow-lg ${t.shadow}`}
            >
              <Lock className="w-4 h-4" />{" "}
              {isTokenMode ? "VALIDASI & MULAI" : "INPUT TOKEN & MULAI"}
            </button>
            <div className="text-center pt-5">
              <button
                onClick={handleLogout}
                className="text-[#E53935] hover:text-red-800 font-bold text-sm transition-colors"
              >
                Batal & Keluar
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ==========================================
  // VIEW: ADMIN
  // ==========================================
  const AdminSidebarItem = ({ id, icon: Icon, label }) => (
    <button
      onClick={() => setAdminMenu(id)}
      className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-lg mb-1 transition-all duration-200 group ${
        adminMenu === id
          ? `${t.lightBg} ${t.text} font-bold`
          : "text-slate-600 hover:bg-slate-50 font-semibold"
      }`}
    >
      <Icon
        className={`w-5 h-5 transition-transform duration-200 ${
          adminMenu === id ? t.text : "text-slate-400"
        }`}
      />
      <span className="text-sm">{label}</span>
    </button>
  );

  return (
    <div className="min-h-screen flex bg-[#F5F7F9] text-slate-800 font-sans print:bg-white">
      <aside className="w-64 bg-white border-r border-slate-200 hidden md:flex flex-col sticky top-0 h-screen z-20 shadow-xl shadow-slate-200/40 print:hidden">
        <div className="p-6 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className={`${t.bg} p-2 rounded-lg transition-colors`}>
              <LayoutDashboard className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="font-bold text-base tracking-tight text-slate-800 leading-none">
                CBT ADMIN
              </h2>
            </div>
          </div>
        </div>
        <nav className="flex-1 p-4 overflow-y-auto">
          <AdminSidebarItem
            id="monitoring"
            icon={MonitorPlay}
            label="Monitoring Peserta"
          />
          <AdminSidebarItem id="students" icon={Users} label="Data Peserta" />
          <AdminSidebarItem
            id="exams"
            icon={FileSpreadsheet}
            label="Bank Soal"
          />
          <AdminSidebarItem
            id="print"
            icon={Printer}
            label="Cetak Kartu Ujian"
          />
          <AdminSidebarItem id="users" icon={UserCog} label="Manajemen Admin" />
          <AdminSidebarItem
            id="settings"
            icon={Settings}
            label="Pengaturan Sistem"
          />
        </nav>
        <div className="p-4 border-t border-slate-100">
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-red-600 hover:bg-red-50 transition-all font-bold text-sm"
          >
            <LogOut className="w-4 h-4" /> Keluar Sistem
          </button>
        </div>
      </aside>

      <main className="flex-1 flex flex-col min-h-0 overflow-hidden print:overflow-visible">
        <header className="md:hidden bg-white border-b border-slate-200 p-4 flex justify-between items-center shadow-sm sticky top-0 z-20 print:hidden">
          <h2 className="font-extrabold text-sm text-slate-800 uppercase tracking-wider">
            CBT ADMIN
          </h2>
          <button
            onClick={handleLogout}
            className="p-2 bg-red-50 text-red-600 rounded-lg"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </header>

        <div className="flex-1 overflow-auto p-6 lg:p-10 print:p-0 print:m-0 print:overflow-visible bg-slate-50 print:bg-white">
          {adminMenu === "monitoring" && (
            <MonitoringView
              students={students}
              db={db}
              getColPath={getColPath}
              theme={t}
            />
          )}
          {adminMenu === "students" && (
            <GenericCRUD
              collectionName="students"
              title="DATA PESERTA"
              subtitle="Administrasi data induk siswa"
              data={students}
              db={db}
              getColPath={getColPath}
              theme={t}
              isStudent={true}
              columns={[
                { key: "nisn", label: "NISN", type: "text" },
                { key: "name", label: "Nama Lengkap", type: "text" },
                { key: "tingkat", label: "Tingkat", type: "text" },
                { key: "kelas", label: "Kelas", type: "text" },
              ]}
            />
          )}
          {adminMenu === "exams" && (
            <ExamsCRUD data={exams} db={db} getColPath={getColPath} theme={t} />
          )}
          {adminMenu === "print" && (
            <PrintCardsView
              students={students}
              appSettings={appSettings}
              db={db}
              getColPath={getColPath}
              theme={t}
            />
          )}
          {adminMenu === "users" && (
            <GenericCRUD
              collectionName="admins"
              title="MANAJEMEN ADMIN"
              subtitle="Kelola pengguna dan hak akses"
              data={admins}
              db={db}
              getColPath={getColPath}
              theme={t}
              columns={[
                { key: "name", label: "Nama Lengkap", type: "text" },
                { key: "username", label: "Username", type: "text" },
                {
                  key: "role",
                  label: "Peran Akses",
                  type: "select",
                  options: ["Hak Penuh", "Baca Saja"],
                },
                { key: "password", label: "Password", type: "password" },
              ]}
            />
          )}
          {adminMenu === "settings" && (
            <SettingsView
              appSettings={appSettings}
              db={db}
              getColPath={getColPath}
              theme={t}
            />
          )}
        </div>
      </main>
    </div>
  );
}

// ==========================================
// SUB-COMPONENTS
// ==========================================

function MonitoringView({ students, db, getColPath, theme }) {
  const [searchQuery, setSearchQuery] = React.useState("");
  const [lastSync, setLastSync] = React.useState(new Date());
  const [isLive, setIsLive] = React.useState(true);

  useEffect(() => {
    let interval;
    if (isLive) interval = setInterval(() => setLastSync(new Date()), 5000);
    return () => clearInterval(interval);
  }, [isLive]);

  const stats = {
    total: students.length,
    online: students.filter((s) => s.status === "Sedang Ujian").length,
    done: students.filter((s) => s.status === "Selesai").length,
    blocked: students.filter((s) => s.status === "Diblokir").length,
  };

  const filteredStudents = students.filter(
    (s) =>
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.nisn.includes(searchQuery) ||
      s.kelas.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const ubahStatus = async (id, status) => {
    await setDoc(
      doc(db, getColPath("students"), id.toString()),
      { status },
      { merge: true }
    );
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h2 className="text-2xl font-black text-slate-800 tracking-tight">
              MONITORING PESERTA
            </h2>
            <button
              onClick={() => setIsLive(!isLive)}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border transition-colors ${
                isLive
                  ? "bg-red-50 text-red-600 border-red-200"
                  : "bg-slate-100 text-slate-500 border-slate-200"
              }`}
            >
              {isLive && (
                <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
              )}{" "}
              {isLive ? "Live Sync Aktif" : "Live Sync Berhenti"}
            </button>
          </div>
          <p className="text-slate-500 text-sm">
            Pantau status pengerjaan secara real-time tersinkronisasi Firebase.
          </p>
        </div>
        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Cari Nama, NISN, Kelas..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={`w-full pl-10 pr-4 py-2.5 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-1 ${theme.ring} text-slate-800 font-medium transition-all shadow-sm`}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            label: "Total Peserta",
            value: stats.total,
            textColor: "text-white",
            bg: "bg-gradient-to-br from-blue-500 to-indigo-600",
            iconColor: "text-blue-100",
            shadow: "shadow-blue-500/30",
          },
          {
            label: "Sedang Ujian",
            value: stats.online,
            textColor: "text-white",
            bg: "bg-gradient-to-br from-amber-500 to-orange-500",
            iconColor: "text-amber-100",
            shadow: "shadow-orange-500/30",
          },
          {
            label: "Selesai Ujian",
            value: stats.done,
            textColor: "text-white",
            bg: "bg-gradient-to-br from-emerald-500 to-teal-500",
            iconColor: "text-emerald-100",
            shadow: "shadow-teal-500/30",
          },
          {
            label: "Siswa Diblokir",
            value: stats.blocked,
            textColor: "text-white",
            bg: "bg-gradient-to-br from-red-500 to-rose-600",
            iconColor: "text-red-100",
            shadow: "shadow-rose-500/30",
          },
        ].map((stat, i) => (
          <div
            key={i}
            className={`${stat.bg} rounded-2xl p-6 shadow-lg ${stat.shadow} flex items-center gap-5 hover:scale-[1.02] transition-transform relative overflow-hidden`}
          >
            <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-white/10 rounded-full blur-xl pointer-events-none"></div>
            <div
              className={`w-14 h-14 rounded-2xl bg-white/20 flex items-center justify-center ${stat.textColor} backdrop-blur-sm border border-white/20 relative z-10`}
            >
              <Users className="w-7 h-7" />
            </div>
            <div className="flex flex-col justify-center relative z-10">
              <p
                className={`text-[11px] font-bold ${stat.iconColor} uppercase tracking-wide mb-1`}
              >
                {stat.label}
              </p>
              <p
                className={`text-3xl font-black ${stat.textColor} leading-none`}
              >
                {stat.value}
              </p>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 min-h-[300px]">
        {filteredStudents.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-slate-400 py-12">
            <Search className="w-10 h-10 mb-3 text-slate-300" />
            <p className="text-sm font-bold">Tidak ada siswa ditemukan.</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 gap-4">
            {filteredStudents.map((student) => (
              <div
                key={student.id}
                className={`bg-white p-4 rounded-xl border-y border-r border-l-4 shadow-sm flex justify-between items-center transition-all hover:shadow-md ${
                  student.status === "Sedang Ujian"
                    ? "border-l-amber-500 border-y-slate-100 border-r-slate-100"
                    : student.status === "Selesai"
                    ? "border-l-emerald-500 border-y-slate-100 border-r-slate-100"
                    : student.status === "Diblokir"
                    ? "border-l-red-500 border-y-slate-100 border-r-slate-100"
                    : "border-l-slate-300 border-y-slate-100 border-r-slate-100"
                }`}
              >
                <div>
                  <span className="text-[10px] font-bold text-slate-500 uppercase bg-slate-50 px-2 py-0.5 rounded-md border border-slate-200">
                    Kelas {student.tingkat} {student.kelas}
                  </span>
                  <h4 className="font-bold text-sm text-slate-800 mt-2">
                    {student.name}
                  </h4>
                  <p className="text-xs text-slate-500">{student.nisn}</p>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <span
                    className={`px-3 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider ${
                      student.status === "Sedang Ujian"
                        ? "bg-amber-100 text-amber-700"
                        : student.status === "Selesai"
                        ? "bg-emerald-100 text-emerald-700"
                        : student.status === "Diblokir"
                        ? "bg-red-100 text-red-700"
                        : "bg-slate-100 text-slate-600"
                    }`}
                  >
                    {student.status}
                  </span>
                  {student.status === "Sedang Ujian" && (
                    <button
                      onClick={() => ubahStatus(student.id, "Selesai")}
                      className="text-[10px] bg-slate-800 hover:bg-slate-900 text-white px-3 py-1.5 rounded-md font-bold shadow-sm active:scale-95"
                    >
                      Tandai Selesai
                    </button>
                  )}
                  {student.status === "Diblokir" && (
                    <button
                      onClick={() => ubahStatus(student.id, "Offline")}
                      className="text-[10px] bg-red-600 hover:bg-red-700 text-white px-3 py-1.5 rounded-md font-bold shadow-sm active:scale-95"
                    >
                      Buka Blokir
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function GenericCRUD({
  title,
  subtitle,
  data,
  db,
  collectionName,
  columns,
  theme,
  isStudent,
}) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [importing, setImporting] = useState(false);
  const [formData, setFormData] = useState({});
  const [editingItem, setEditingItem] = useState(null);

  const openModal = (item = null) => {
    setEditingItem(item);
    setFormData(item || {});
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const id = editingItem ? editingItem.id.toString() : Date.now().toString();
    const payload = { id, ...formData };
    if (!editingItem && isStudent) payload.status = "Offline";
    await setDoc(
      doc(
        db,
        `artifacts/cbt-blogger-app/public/data/${collectionName}`.replace(
          "artifacts/cbt-blogger-app/public/data",
          collectionName
        ),
        id
      ),
      payload,
      { merge: true }
    );
    setIsModalOpen(false);
  };

  const handleDelete = async (id) => {
    if (window.confirm("Yakin ingin menghapus data ini?")) {
      await deleteDoc(
        doc(
          db,
          `artifacts/cbt-blogger-app/public/data/${collectionName}`.replace(
            "artifacts/cbt-blogger-app/public/data",
            collectionName
          ),
          id.toString()
        )
      );
    }
  };

  // Logika Import Excel Siswa
  const handleStudentFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setImporting(true);
    if (!window.XLSX) {
      const script = document.createElement("script");
      script.src =
        "https://cdn.sheetjs.com/xlsx-latest/package/dist/xlsx.full.min.js";
      script.onload = () => processExcel(file);
      document.body.appendChild(script);
    } else {
      processExcel(file);
    }
  };

  const processExcel = (file) => {
    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target.result;
        const wb = window.XLSX.read(bstr, { type: "binary" });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const parsedData = window.XLSX.utils.sheet_to_json(ws);

        parsedData.forEach(async (row, index) => {
          const newId = (Date.now() + index).toString();
          const student = {
            id: newId,
            nisn: String(row.NISN || row.nisn || ""),
            name: row.Nama || row.nama || "",
            tingkat: String(row.Tingkat || row.tingkat || ""),
            kelas: row.Kelas || row.kelas || "",
            status: "Offline",
          };
          if (student.nisn && student.name) {
            await setDoc(
              doc(
                db,
                `artifacts/cbt-blogger-app/public/data/${collectionName}`.replace(
                  "artifacts/cbt-blogger-app/public/data",
                  collectionName
                ),
                newId
              ),
              student
            );
          }
        });
        setImporting(false);
        setIsImportModalOpen(false);
      } catch (e) {
        alert("Gagal memproses file.");
        setImporting(false);
      }
    };
    reader.readAsBinaryString(file);
  };

  const downloadStudentTemplate = () => {
    const ws = window.XLSX.utils.aoa_to_sheet([
      ["NISN", "Nama", "Tingkat", "Kelas"],
      ["0011223344", "Siswa Contoh", "10", "MIPA 1"],
    ]);
    const wb = window.XLSX.utils.book_new();
    window.XLSX.utils.book_append_sheet(wb, ws, "Data");
    window.XLSX.writeFile(wb, "Template_Data_Peserta.xlsx");
  };

  const cardGradients = [
    "from-blue-500 to-indigo-600 shadow-blue-500/30",
    "from-emerald-500 to-teal-500 shadow-teal-500/30",
    "from-amber-500 to-orange-500 shadow-orange-500/30",
    "from-purple-500 to-fuchsia-600 shadow-fuchsia-500/30",
    "from-rose-500 to-pink-600 shadow-rose-500/30",
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-800 tracking-tight">
            {title}
          </h2>
          <p className="text-sm text-slate-500 mt-1">{subtitle}</p>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          {isStudent && (
            <button
              onClick={() => setIsImportModalOpen(true)}
              className={`${theme.bg} ${theme.hover} text-white px-5 py-2.5 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all shadow-md ${theme.shadow} flex-1 sm:flex-none`}
            >
              <Download className="w-4 h-4" /> Import Excel
            </button>
          )}
          <button
            onClick={() => openModal()}
            className={`${theme.bg} ${theme.hover} text-white px-5 py-2.5 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all shadow-md ${theme.shadow} flex-1 sm:flex-none`}
          >
            <Plus className="w-4 h-4" /> Tambah Manual
          </button>
        </div>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
        {data.map((item, index) => {
          const grad = cardGradients[index % cardGradients.length];
          return (
            <div
              key={item.id}
              className={`bg-gradient-to-br ${grad} p-6 rounded-2xl flex justify-between items-center text-white shadow-xl hover:scale-[1.02] transition-transform relative overflow-hidden`}
            >
              <div className="absolute -right-6 -bottom-6 w-24 h-24 bg-white/10 rounded-full blur-xl pointer-events-none"></div>
              <div className="relative z-10 w-full">
                <h4 className="font-black text-xl mb-1">
                  {item.name || item.username}
                </h4>
                <p className="text-xs text-white/80 font-medium mb-5">
                  <span className="font-bold uppercase tracking-wider">
                    {columns[0].key}:
                  </span>{" "}
                  {item[columns[0].key]}
                </p>
                <div className="flex justify-between items-end">
                  <div className="space-x-2">
                    <button
                      onClick={() => openModal(item)}
                      className="p-2.5 bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-lg transition-colors"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(item.id)}
                      className="p-2.5 bg-red-500/80 hover:bg-red-500 backdrop-blur-sm rounded-lg transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl">
            <h3 className="font-black text-xl mb-5 text-slate-800 border-b border-slate-100 pb-3">
              {editingItem ? "Edit Data" : "Tambah Data"}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              {columns.map((c) =>
                c.type === "select" ? (
                  <div key={c.key}>
                    <label className="block text-xs font-bold mb-1.5 text-slate-600">
                      {c.label}
                    </label>
                    <select
                      required
                      value={formData[c.key] || ""}
                      onChange={(e) =>
                        setFormData({ ...formData, [c.key]: e.target.value })
                      }
                      className={`w-full p-3 border border-slate-300 rounded-xl text-sm focus:${theme.border} focus:ring-1 ${theme.ring} outline-none bg-white`}
                    >
                      <option value="">Pilih</option>
                      {c.options.map((o) => (
                        <option key={o} value={o}>
                          {o}
                        </option>
                      ))}
                    </select>
                  </div>
                ) : (
                  <div key={c.key}>
                    <label className="block text-xs font-bold mb-1.5 text-slate-600">
                      {c.label}
                    </label>
                    <input
                      required
                      type={c.type === "password" ? "password" : "text"}
                      value={formData[c.key] || ""}
                      onChange={(e) =>
                        setFormData({ ...formData, [c.key]: e.target.value })
                      }
                      className={`w-full p-3 border border-slate-300 rounded-xl text-sm focus:${theme.border} focus:ring-1 ${theme.ring} outline-none`}
                    />
                  </div>
                )
              )}
              <div className="flex gap-3 pt-4 border-t border-slate-100 mt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 bg-slate-100 hover:bg-slate-200 p-3.5 rounded-xl font-bold text-slate-700 transition-all"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className={`flex-1 ${theme.bg} ${theme.hover} text-white p-3.5 rounded-xl font-bold shadow-md ${theme.shadow} transition-all`}
                >
                  Simpan ke Firestore
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isImportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white p-6 rounded-2xl w-full max-w-md shadow-2xl">
            <div className="flex justify-between items-center mb-5">
              <h3 className="font-bold text-lg text-slate-800 flex items-center gap-2">
                <FileSpreadsheet className={`w-5 h-5 ${theme.text}`} /> Import
                Data Excel
              </h3>
              <button
                onClick={() => setIsImportModalOpen(false)}
                className="text-slate-400 hover:bg-slate-100 p-2 rounded-lg transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div
              className={`p-4 ${theme.lightBg} ${theme.text} rounded-xl text-xs mb-5 border border-slate-100`}
            >
              <p className="font-bold mb-2">Kolom Wajib:</p>
              <div className="bg-white p-3 rounded-lg font-mono text-center font-bold mb-3 shadow-sm">
                NISN | Nama | Tingkat | Kelas
              </div>
              <button
                type="button"
                onClick={() => {
                  if (!window.XLSX) {
                    const script = document.createElement("script");
                    script.src =
                      "https://cdn.sheetjs.com/xlsx-latest/package/dist/xlsx.full.min.js";
                    script.onload = downloadStudentTemplate;
                    document.body.appendChild(script);
                  } else {
                    downloadStudentTemplate();
                  }
                }}
                className={`w-full font-bold bg-white py-2.5 rounded-lg shadow-sm hover:bg-slate-50 transition-all ${theme.text}`}
              >
                Unduh Template (.xlsx)
              </button>
            </div>
            <div className="border-2 border-dashed border-slate-300 rounded-xl p-8 text-center relative hover:bg-slate-50 transition-colors group">
              <input
                type="file"
                accept=".xlsx, .xls, .csv"
                onChange={handleStudentFileUpload}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                disabled={importing}
              />
              <Folder className="w-10 h-10 text-slate-400 mx-auto mb-3 group-hover:scale-110 transition-transform" />
              <p className="text-sm font-bold text-slate-700">
                {importing ? "Menyimpan ke Firestore..." : "Pilih File Excel"}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function ExamsCRUD({ data, db, getColPath, theme }) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [importing, setImporting] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [formData, setFormData] = useState({});

  const generateToken = () => {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let result = "";
    for (let i = 0; i < 5; i++)
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    return result;
  };

  const handleOpenModal = (item = null) => {
    setEditingItem(item);
    setFormData(
      item || {
        tingkat: "",
        subject: "",
        token: generateToken(),
        durasi: 60,
        jadwalMulai: "",
        batasAkhir: "",
        link: "",
      }
    );
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const id = editingItem ? editingItem.id.toString() : Date.now().toString();
    await setDoc(
      doc(
        db,
        `artifacts/cbt-blogger-app/public/data/exams`.replace(
          "artifacts/cbt-blogger-app/public/data",
          "exams"
        ),
        id
      ),
      { id, ...formData },
      { merge: true }
    );
    setIsModalOpen(false);
  };

  const handleDelete = async (id) => {
    if (window.confirm("Hapus jadwal ujian ini?")) {
      await deleteDoc(
        doc(
          db,
          `artifacts/cbt-blogger-app/public/data/exams`.replace(
            "artifacts/cbt-blogger-app/public/data",
            "exams"
          ),
          id.toString()
        )
      );
    }
  };

  const processExamExcel = (file) => {
    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target.result;
        const wb = window.XLSX.read(bstr, { type: "binary" });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const parsedData = window.XLSX.utils.sheet_to_json(ws);

        parsedData.forEach(async (row, i) => {
          const newId = (Date.now() + i).toString();
          const exam = {
            id: newId,
            tingkat: String(row.Tingkat || row.tingkat || ""),
            subject: row["Mata Pelajaran"] || row.Mapel || row.subject || "",
            token: String(row.Token || row.token || generateToken()),
            durasi: Number(row.Durasi || row.durasi || 60),
            jadwalMulai: row["Jadwal Mulai"] || row.jadwalMulai || "",
            batasAkhir: row["Batas Akhir"] || row.batasAkhir || "",
            link: row.Link || row.link || "",
          };
          if (exam.subject && exam.tingkat) {
            await setDoc(
              doc(
                db,
                `artifacts/cbt-blogger-app/public/data/exams`.replace(
                  "artifacts/cbt-blogger-app/public/data",
                  "exams"
                ),
                newId
              ),
              exam
            );
          }
        });
        setImporting(false);
        setIsImportModalOpen(false);
      } catch (e) {
        alert("Gagal memproses file. Pastikan format benar.");
        setImporting(false);
      }
    };
    reader.readAsBinaryString(file);
  };

  const handleExamFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setImporting(true);
    if (!window.XLSX) {
      const script = document.createElement("script");
      script.src =
        "https://cdn.sheetjs.com/xlsx-latest/package/dist/xlsx.full.min.js";
      script.onload = () => processExamExcel(file);
      document.body.appendChild(script);
    } else {
      processExamExcel(file);
    }
  };

  const downloadExamTemplate = () => {
    const createAndDownload = () => {
      const ws = window.XLSX.utils.aoa_to_sheet([
        [
          "Tingkat",
          "Mata Pelajaran",
          "Token",
          "Durasi",
          "Jadwal Mulai",
          "Batas Akhir",
          "Link",
        ],
        [
          "11",
          "Bahasa Indonesia",
          "8055",
          60,
          "2026-06-15T08:00",
          "2026-06-15T09:20",
          "https://docs.google.com/forms/d/e/.../viewform?embedded=true",
        ],
      ]);
      const wb = window.XLSX.utils.book_new();
      window.XLSX.utils.book_append_sheet(wb, ws, "Jadwal Ujian");
      window.XLSX.writeFile(wb, "Template_Bank_Soal.xlsx");
    };

    if (!window.XLSX) {
      const script = document.createElement("script");
      script.src =
        "https://cdn.sheetjs.com/xlsx-latest/package/dist/xlsx.full.min.js";
      script.onload = createAndDownload;
      document.body.appendChild(script);
    } else {
      createAndDownload();
    }
  };

  const formatDateTime = (dateStr) => {
    if (!dateStr) return { date: "-", time: "-" };
    const d = new Date(dateStr);
    const days = [
      "Minggu",
      "Senin",
      "Selasa",
      "Rabu",
      "Kamis",
      "Jumat",
      "Sabtu",
    ];
    const months = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "Mei",
      "Jun",
      "Jul",
      "Agt",
      "Sep",
      "Okt",
      "Nov",
      "Des",
    ];
    return {
      date: `${days[d.getDay()]}, ${d.getDate()} ${
        months[d.getMonth()]
      } ${d.getFullYear()}`,
      time: `${String(d.getHours()).padStart(2, "0")}:${String(
        d.getMinutes()
      ).padStart(2, "0")} WIB`,
    };
  };

  const subjectColors = [
    "from-indigo-500 to-purple-600 shadow-indigo-500/30",
    "from-emerald-500 to-teal-500 shadow-emerald-500/30",
    "from-orange-500 to-red-500 shadow-orange-500/30",
    "from-cyan-500 to-blue-600 shadow-cyan-500/30",
    "from-pink-500 to-rose-600 shadow-pink-500/30",
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-800 tracking-tight">
            BANK SOAL & JADWAL
          </h2>
          <p className="text-sm text-slate-500">
            Kelola soal ujian ke Firebase
          </p>
        </div>
        <div className="flex gap-3 w-full sm:w-auto">
          <button
            onClick={() => setIsImportModalOpen(true)}
            className={`flex-1 sm:flex-none flex items-center justify-center gap-2 ${theme.bg} ${theme.hover} text-white px-5 py-2.5 rounded-xl text-sm font-bold shadow-lg ${theme.shadow} transition-all`}
          >
            <Download className="w-4 h-4" /> Import Excel
          </button>
          <button
            onClick={() => handleOpenModal()}
            className={`flex-1 sm:flex-none flex items-center justify-center gap-2 ${theme.bg} ${theme.hover} text-white px-5 py-2.5 rounded-xl text-sm font-bold shadow-lg ${theme.shadow} transition-all`}
          >
            <Plus className="w-4 h-4" /> Buat Manual
          </button>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-5">
        {data.map((item, index) => {
          const start = formatDateTime(item.jadwalMulai);
          const end = formatDateTime(item.batasAkhir);
          const grad = subjectColors[index % subjectColors.length];
          return (
            <div
              key={item.id}
              className={`bg-gradient-to-br ${grad} rounded-2xl p-6 text-white shadow-xl relative overflow-hidden group hover:scale-[1.02] transition-transform`}
            >
              <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-white/10 rounded-full blur-2xl pointer-events-none group-hover:scale-150 transition-transform duration-700"></div>
              <div className="relative z-10 flex justify-between items-start mb-6">
                <div className="flex items-center gap-2">
                  <span className="bg-white/20 backdrop-blur-sm text-white text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-widest border border-white/20">
                    Kls {item.tingkat}
                  </span>
                  <span className="bg-black/20 backdrop-blur-sm text-white text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest border border-white/10 flex items-center gap-1">
                    <Key className="w-3 h-3" /> {item.token}
                  </span>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleOpenModal(item)}
                    className="p-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors backdrop-blur-sm"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(item.id)}
                    className="p-2 bg-red-500/80 hover:bg-red-600 rounded-lg transition-colors backdrop-blur-sm"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <h3 className="text-3xl font-black mb-6 tracking-tight relative z-10">
                {item.subject}
              </h3>
              <div className="grid grid-cols-2 gap-3 mb-6 relative z-10">
                <div className="bg-black/10 backdrop-blur-sm rounded-xl p-3 border border-white/10">
                  <p className="text-[10px] font-bold text-white/70 uppercase mb-1 flex items-center gap-1">
                    <Clock className="w-3 h-3" /> Mulai
                  </p>
                  <p className="font-bold text-sm leading-tight">
                    {start.date}
                  </p>
                  <p className="text-xs text-white/80">{start.time}</p>
                </div>
                <div className="bg-black/10 backdrop-blur-sm rounded-xl p-3 border border-white/10">
                  <p className="text-[10px] font-bold text-white/70 uppercase mb-1 flex items-center gap-1">
                    <Clock className="w-3 h-3" /> Berakhir
                  </p>
                  <p className="font-bold text-sm leading-tight">{end.date}</p>
                  <p className="text-xs text-white/80">{end.time}</p>
                </div>
              </div>
              <div className="flex justify-between items-center relative z-10 border-t border-white/20 pt-4">
                <span className="font-bold text-sm flex items-center gap-1.5">
                  <MonitorPlay className="w-4 h-4" /> {item.durasi} Menit
                </span>
                <a
                  href={item.link}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs font-black uppercase tracking-widest hover:underline flex items-center gap-1 bg-white text-slate-800 px-3 py-1.5 rounded-lg shadow-sm"
                >
                  Cek Soal <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>
          );
        })}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-2xl p-6 shadow-2xl">
            <h3 className="font-black text-xl mb-6 text-slate-800 border-b border-slate-100 pb-4">
              {editingItem ? "Edit Jadwal" : "Buat Jadwal Baru"}
            </h3>
            <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-5">
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1.5">
                  Tingkat
                </label>
                <input
                  required
                  value={formData.tingkat}
                  onChange={(e) =>
                    setFormData({ ...formData, tingkat: e.target.value })
                  }
                  className={`w-full p-3 border border-slate-300 rounded-xl text-sm focus:${theme.border} focus:ring-1 ${theme.ring} outline-none`}
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1.5">
                  Mata Pelajaran
                </label>
                <input
                  required
                  value={formData.subject}
                  onChange={(e) =>
                    setFormData({ ...formData, subject: e.target.value })
                  }
                  className={`w-full p-3 border border-slate-300 rounded-xl text-sm focus:${theme.border} focus:ring-1 ${theme.ring} outline-none`}
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1.5">
                  Token Sistem (Otomatis)
                </label>
                <div className="flex gap-2">
                  <input
                    readOnly
                    value={formData.token}
                    className={`w-full p-3 border border-slate-300 rounded-xl text-sm font-black tracking-widest ${theme.text} bg-slate-50 outline-none cursor-not-allowed`}
                  />
                  <button
                    type="button"
                    onClick={() =>
                      setFormData({ ...formData, token: generateToken() })
                    }
                    className="px-4 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl text-xs font-bold transition-all shadow-sm"
                  >
                    Acak
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1.5">
                  Durasi (Menit)
                </label>
                <input
                  type="number"
                  required
                  value={formData.durasi}
                  onChange={(e) =>
                    setFormData({ ...formData, durasi: e.target.value })
                  }
                  className={`w-full p-3 border border-slate-300 rounded-xl text-sm focus:${theme.border} focus:ring-1 ${theme.ring} outline-none`}
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1.5">
                  Jadwal Mulai
                </label>
                <input
                  type="datetime-local"
                  required
                  value={formData.jadwalMulai}
                  onChange={(e) =>
                    setFormData({ ...formData, jadwalMulai: e.target.value })
                  }
                  className={`w-full p-3 border border-slate-300 rounded-xl text-sm focus:${theme.border} focus:ring-1 ${theme.ring} outline-none`}
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1.5">
                  Batas Akhir
                </label>
                <input
                  type="datetime-local"
                  required
                  value={formData.batasAkhir}
                  onChange={(e) =>
                    setFormData({ ...formData, batasAkhir: e.target.value })
                  }
                  className={`w-full p-3 border border-slate-300 rounded-xl text-sm focus:${theme.border} focus:ring-1 ${theme.ring} outline-none`}
                />
              </div>
              <div className="col-span-2">
                <label className="block text-xs font-bold text-slate-600 mb-1.5">
                  Link Google Form (
                  <span className="text-amber-500">
                    Gunakan link ?embedded=true
                  </span>
                  )
                </label>
                <input
                  type="url"
                  required
                  value={formData.link}
                  onChange={(e) =>
                    setFormData({ ...formData, link: e.target.value })
                  }
                  className={`w-full p-3 border border-slate-300 rounded-xl text-sm focus:${theme.border} focus:ring-1 ${theme.ring} outline-none`}
                  placeholder="https://docs.google.com/forms/d/e/.../viewform?embedded=true"
                />
              </div>
              <div className="col-span-2 flex gap-3 mt-4 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 p-3.5 bg-slate-100 hover:bg-slate-200 rounded-xl font-bold text-sm text-slate-700 transition-all"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className={`flex-1 p-3.5 ${theme.bg} ${theme.hover} text-white rounded-xl font-bold text-sm shadow-md ${theme.shadow} transition-all`}
                >
                  Simpan Jadwal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isImportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white p-6 rounded-2xl w-full max-w-md shadow-2xl">
            <div className="flex justify-between items-center mb-5">
              <h3 className="font-bold text-lg text-slate-800 flex items-center gap-2">
                <FileSpreadsheet className={`w-5 h-5 ${theme.text}`} /> Import
                Jadwal Excel
              </h3>
              <button
                onClick={() => setIsImportModalOpen(false)}
                className="text-slate-400 hover:bg-slate-100 p-2 rounded-lg transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div
              className={`p-4 ${theme.lightBg} ${theme.text} rounded-xl text-xs mb-5 border border-slate-100`}
            >
              <p className="font-bold mb-2 flex items-center gap-1.5">
                <BookOpen className="w-4 h-4" /> Format Kolom Wajib:
              </p>
              <div className="bg-white p-3 rounded-lg border border-slate-200 font-mono text-center tracking-wider font-bold mb-3 shadow-sm break-words leading-relaxed">
                Tingkat | Mata Pelajaran | Token | Durasi | Jadwal Mulai | Batas
                Akhir | Link
              </div>
              <button
                type="button"
                onClick={() => {
                  if (!window.XLSX) {
                    const script = document.createElement("script");
                    script.src =
                      "https://cdn.sheetjs.com/xlsx-latest/package/dist/xlsx.full.min.js";
                    script.onload = downloadExamTemplate;
                    document.body.appendChild(script);
                  } else {
                    downloadExamTemplate();
                  }
                }}
                className={`w-full text-center font-bold bg-white border border-slate-200 py-2.5 rounded-lg shadow-sm hover:bg-slate-50 transition-all ${theme.text}`}
              >
                Unduh Contoh Template (.xlsx)
              </button>
            </div>
            <div className="border-2 border-dashed border-slate-300 rounded-xl p-8 text-center relative hover:bg-slate-50 transition-colors group">
              <input
                type="file"
                accept=".xlsx, .xls, .csv"
                onChange={handleExamFileUpload}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                disabled={importing}
              />
              <Folder className="w-10 h-10 text-slate-400 mx-auto mb-3 group-hover:scale-110 transition-transform" />
              <p className="text-sm font-bold text-slate-700">
                {importing ? "Menyimpan ke Firestore..." : "Pilih File Excel"}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function SettingsView({ appSettings, db, getColPath, theme }) {
  const [localSettings, setLocalSettings] = useState(appSettings);

  const handleLogoUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (evt) =>
        setLocalSettings({ ...localSettings, logoUrl: evt.target.result });
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async () => {
    await setDoc(
      doc(
        db,
        `artifacts/cbt-blogger-app/public/data/settings`.replace(
          "artifacts/cbt-blogger-app/public/data",
          "settings"
        ),
        "global"
      ),
      localSettings,
      { merge: true }
    );
    alert("Pengaturan berhasil disimpan ke Database!");
  };

  return (
    <div className="max-w-2xl bg-white rounded-2xl border border-slate-200 p-8 shadow-sm">
      <h2 className="text-2xl font-black text-slate-800 mb-6">
        PENGATURAN SISTEM CBT
      </h2>
      <div className="space-y-6">
        <div className="p-6 bg-gradient-to-br from-indigo-50 to-blue-50 rounded-2xl border border-indigo-100 shadow-sm flex items-center gap-6">
          {localSettings.logoUrl ? (
            <img
              src={localSettings.logoUrl}
              alt="Logo"
              className="w-20 h-20 object-contain bg-white rounded-xl border border-indigo-200 p-2 shadow-sm"
            />
          ) : (
            <div className="w-20 h-20 bg-white border border-indigo-200 rounded-xl flex items-center justify-center text-indigo-300 shadow-sm">
              <ImageIcon className="w-8 h-8" />
            </div>
          )}
          <div className="flex-1">
            <label className="block text-sm font-black text-indigo-900 mb-1">
              Logo Aplikasi
            </label>
            <input
              type="file"
              accept="image/*"
              onChange={handleLogoUpload}
              className="w-full text-xs text-indigo-600 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-indigo-600 file:text-white hover:file:bg-indigo-700 cursor-pointer transition-colors"
            />
          </div>
        </div>

        <div className="p-6 bg-gradient-to-br from-emerald-50 to-teal-50 rounded-2xl border border-emerald-100 shadow-sm">
          <label className="block text-sm font-black text-emerald-900 mb-1">
            Nama Instansi / Sekolah
          </label>
          <input
            type="text"
            value={localSettings.schoolName}
            onChange={(e) =>
              setLocalSettings({ ...localSettings, schoolName: e.target.value })
            }
            className="w-full p-3.5 border border-emerald-200 rounded-xl bg-white focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none font-bold text-slate-800 transition-all shadow-sm"
          />
        </div>

        <div className="p-6 bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl border border-amber-100 shadow-sm">
          <label className="block text-sm font-black text-amber-900 mb-1 flex items-center gap-2">
            <Palette className="w-4 h-4" /> Tema Warna Dasar
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { id: "emerald", name: "Hijau Zamrud", color: "bg-[#11A367]" },
              { id: "blue", name: "Biru Laut", color: "bg-[#1877F2]" },
              { id: "indigo", name: "Ungu Nila", color: "bg-indigo-600" },
              { id: "rose", name: "Merah Ros", color: "bg-rose-600" },
            ].map((themeOpt) => (
              <button
                key={themeOpt.id}
                onClick={() =>
                  setLocalSettings({ ...localSettings, theme: themeOpt.id })
                }
                className={`flex flex-col items-center justify-center gap-2 p-3 rounded-xl border-2 transition-all bg-white ${
                  localSettings.theme === themeOpt.id
                    ? "border-amber-500 shadow-md shadow-amber-500/20"
                    : "border-amber-100 hover:border-amber-300"
                }`}
              >
                <div
                  className={`w-8 h-8 rounded-full shadow-sm ${themeOpt.color}`}
                ></div>
                <span
                  className={`text-[10px] font-bold ${
                    localSettings.theme === themeOpt.id
                      ? "text-amber-900"
                      : "text-slate-500"
                  }`}
                >
                  {themeOpt.name}
                </span>
              </button>
            ))}
          </div>
        </div>

        <button
          onClick={handleSave}
          className={`w-full ${theme.bg} ${theme.hover} text-white px-6 py-4 rounded-xl font-bold uppercase tracking-wider mt-4 transition-all shadow-lg ${theme.shadow}`}
        >
          Simpan ke Database Firebase
        </button>
      </div>
    </div>
  );
}

function PrintCardsView({
  students,
  appSettings,
  setAppSettings,
  theme,
  db,
  getColPath,
}) {
  const [filterKelas, setFilterKelas] = useState("");
  const [showSettings, setShowSettings] = useState(false);
  const availableClasses = [...new Set(students.map((s) => s.kelas))].filter(
    Boolean
  );

  const filteredStudents = filterKelas
    ? students.filter((s) => s.kelas === filterKelas)
    : students;

  const handlePrint = () => window.print();

  const handleTtdUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (evt) => {
        const newSettings = {
          ...appSettings,
          printSettings: {
            ...appSettings.printSettings,
            ttdUrl: evt.target.result,
          },
        };
        setAppSettings(newSettings);
        setDoc(
          doc(
            db,
            `artifacts/cbt-blogger-app/public/data/settings`.replace(
              "artifacts/cbt-blogger-app/public/data",
              "settings"
            ),
            "global"
          ),
          newSettings,
          { merge: true }
        );
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSettingChange = (field, value) => {
    const newSettings = {
      ...appSettings,
      printSettings: { ...appSettings.printSettings, [field]: value },
    };
    setAppSettings(newSettings);
    // Auto-save to Firebase
    setDoc(
      doc(
        db,
        `artifacts/cbt-blogger-app/public/data/settings`.replace(
          "artifacts/cbt-blogger-app/public/data",
          "settings"
        ),
        "global"
      ),
      newSettings,
      { merge: true }
    );
  };

  const formatTanggalIndo = (dateStr) => {
    if (!dateStr) return "";
    const date = new Date(dateStr);
    const bulan = [
      "Januari",
      "Februari",
      "Maret",
      "April",
      "Mei",
      "Juni",
      "Juli",
      "Agustus",
      "September",
      "Oktober",
      "November",
      "Desember",
    ];
    return `${date.getDate()} ${bulan[date.getMonth()]} ${date.getFullYear()}`;
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 print:hidden mb-4">
        <div>
          <h2 className="text-2xl font-black text-slate-800 tracking-tight">
            CETAK KARTU UJIAN
          </h2>
          <p className="text-sm text-slate-500">
            Sesuaikan dan cetak kartu peserta (A4, 6 Kartu per halaman)
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
          <button
            onClick={() => setShowSettings(!showSettings)}
            className={`bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 px-5 py-3 rounded-xl text-sm font-bold shadow-sm transition-all flex items-center justify-center gap-2 ${
              showSettings
                ? "bg-slate-100 border-slate-400 ring-2 ring-slate-200"
                : ""
            }`}
          >
            <Settings className="w-4 h-4" /> Pengaturan Kartu
          </button>
          <select
            value={filterKelas}
            onChange={(e) => setFilterKelas(e.target.value)}
            className="p-3 border border-slate-300 rounded-xl text-sm outline-none shadow-sm focus:border-slate-500 font-bold text-slate-700 bg-white"
          >
            <option value="">Semua Kelas</option>
            {availableClasses.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
          <button
            onClick={handlePrint}
            className={`${theme.bg} ${theme.hover} text-white px-6 py-3 rounded-xl text-sm font-bold shadow-md transition-all flex items-center justify-center gap-2`}
          >
            <Printer className="w-4 h-4" /> Cetak Sekarang
          </button>
        </div>
      </div>

      {showSettings && (
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 print:hidden mb-8 animate-in slide-in-from-top-4">
          <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2 border-b border-slate-100 pb-3">
            <Edit2 className="w-4 h-4 text-slate-500" /> Kostumisasi Keterangan
            Tanda Tangan (Tersimpan Otomatis ke Cloud)
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1.5">
                Nama Kepala Sekolah / Panitia
              </label>
              <input
                type="text"
                value={appSettings.printSettings.kepalaSekolah}
                onChange={(e) =>
                  handleSettingChange("kepalaSekolah", e.target.value)
                }
                className={`w-full p-2.5 border border-slate-300 rounded-lg text-sm focus:${theme.border} focus:ring-1 ${theme.ring} outline-none font-semibold text-slate-800`}
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1.5">
                NIP Kepala Sekolah
              </label>
              <input
                type="text"
                value={appSettings.printSettings.nipKepalaSekolah}
                onChange={(e) =>
                  handleSettingChange("nipKepalaSekolah", e.target.value)
                }
                className={`w-full p-2.5 border border-slate-300 rounded-lg text-sm focus:${theme.border} focus:ring-1 ${theme.ring} outline-none font-semibold text-slate-800`}
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1.5">
                Tanggal Cetak / Penetapan
              </label>
              <input
                type="date"
                value={appSettings.printSettings.tanggalCetak}
                onChange={(e) =>
                  handleSettingChange("tanggalCetak", e.target.value)
                }
                className={`w-full p-2.5 border border-slate-300 rounded-lg text-sm focus:${theme.border} focus:ring-1 ${theme.ring} outline-none font-semibold text-slate-800`}
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1.5">
                Upload TTD (PNG Transparan)
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={handleTtdUpload}
                className="w-full text-xs text-slate-500 file:mr-2 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-bold file:bg-slate-100 file:text-slate-700 hover:file:bg-slate-200 cursor-pointer"
              />
              {appSettings.printSettings.ttdUrl && (
                <button
                  onClick={() => handleSettingChange("ttdUrl", null)}
                  className="text-[10px] text-red-500 hover:text-red-700 font-bold mt-1 inline-block"
                >
                  Hapus TTD
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 print:grid-cols-2 print:gap-[6mm] print:w-[210mm] print:mx-auto print:bg-white bg-slate-50">
        {filteredStudents.length === 0 ? (
          <div className="col-span-full py-12 text-center text-slate-400 font-bold bg-white rounded-xl border border-slate-200 print:hidden">
            Tidak ada peserta di kelas ini.
          </div>
        ) : (
          filteredStudents.map((student) => (
            <div
              key={student.id}
              className="border-2 border-slate-800 rounded-xl p-4 bg-white flex flex-col justify-between break-inside-avoid print:h-[92mm] h-auto shadow-sm print:shadow-none print:m-0 relative"
            >
              <div className="flex items-center gap-4 border-b-[3px] border-slate-800 pb-3 mb-4">
                {appSettings.logoUrl ? (
                  <img
                    src={appSettings.logoUrl}
                    alt="Logo"
                    className="w-12 h-12 object-contain"
                  />
                ) : (
                  <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center border border-slate-300">
                    <StudentIcon className="w-6 h-6 text-slate-400" />
                  </div>
                )}
                <div>
                  <h3 className="font-black text-[14px] uppercase leading-tight text-slate-900">
                    {appSettings.schoolName}
                  </h3>
                  <p className="text-[10px] font-bold text-slate-600 tracking-widest mt-0.5">
                    KARTU PESERTA UJIAN
                  </p>
                </div>
              </div>
              <div className="space-y-2.5 flex-1 px-1">
                <div className="flex items-center">
                  <span className="w-24 text-[11px] font-bold text-slate-500 tracking-wider">
                    NISN
                  </span>
                  <span className="flex-1 text-[13px] font-black text-slate-900">
                    : {student.nisn}
                  </span>
                </div>
                <div className="flex items-center">
                  <span className="w-24 text-[11px] font-bold text-slate-500 tracking-wider">
                    NAMA
                  </span>
                  <span className="flex-1 text-[13px] font-black text-slate-900">
                    : {student.name}
                  </span>
                </div>
                <div className="flex items-center">
                  <span className="w-24 text-[11px] font-bold text-slate-500 tracking-wider">
                    TINGKAT
                  </span>
                  <span className="flex-1 text-[13px] font-black text-slate-900">
                    : {student.tingkat}
                  </span>
                </div>
                <div className="flex items-center">
                  <span className="w-24 text-[11px] font-bold text-slate-500 tracking-wider">
                    KELAS
                  </span>
                  <span className="flex-1 text-[13px] font-black text-slate-900">
                    : {student.kelas}
                  </span>
                </div>
              </div>
              <div className="mt-5 pt-3 flex justify-between items-end px-1">
                <div className="text-center w-28">
                  <p className="text-[10px] font-bold text-slate-600 mb-8">
                    Peserta Ujian
                  </p>
                  <div className="w-full h-px bg-slate-800 mx-auto mb-0.5"></div>
                  <p className="text-[9px] font-bold text-slate-600 truncate">
                    {student.name}
                  </p>
                </div>
                <div className="text-center flex flex-col items-center min-w-[35mm]">
                  <p className="text-[10px] font-bold text-slate-600 mb-1">
                    Ditetapkan,{" "}
                    {formatTanggalIndo(appSettings.printSettings.tanggalCetak)}
                  </p>
                  <p className="text-[10px] font-bold text-slate-600 mb-0">
                    Kepala Sekolah,
                  </p>
                  {appSettings.printSettings.ttdUrl ? (
                    <img
                      src={appSettings.printSettings.ttdUrl}
                      className="h-10 object-contain my-0.5 mix-blend-multiply"
                      alt="TTD"
                    />
                  ) : (
                    <div className="h-10"></div>
                  )}
                  <p className="text-[11px] font-black text-slate-900 border-b border-slate-900 leading-tight inline-block px-1 mt-0.5">
                    {appSettings.printSettings.kepalaSekolah}
                  </p>
                  <p className="text-[9px] font-bold text-slate-600 mt-0.5">
                    NIP. {appSettings.printSettings.nipKepalaSekolah}
                  </p>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
