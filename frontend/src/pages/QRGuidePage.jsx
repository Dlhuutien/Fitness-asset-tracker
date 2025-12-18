// src/pages/QRGuidePage.jsx
import { useEffect, useMemo, useRef, useState } from "react";
import PageContainer from "@/components/common/PageContainer";
import { Button } from "@/components/ui/buttonn";
import {
  QrCode,
  Camera,
  ScanLine,
  XCircle,
  Sparkles,
  Upload,
  FolderOpen,
  Image as ImageIcon,
  Loader2,
} from "lucide-react";
import { Html5Qrcode } from "html5-qrcode";
import { toast } from "sonner";
import { AnimatePresence, motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import EquipmentUnitService from "@/services/equipmentUnitService";
import Status from "@/components/common/Status";

export default function QRGuidePage() {
  const qrRef = useRef(null);
  const navigate = useNavigate();

  const fileInputRef = useRef(null);
  const folderInputRef = useRef(null);

  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState("");
  const STATUS_LABEL = {
    active: "Hoạt động",
    inactive: "Ngưng sử dụng",
    "temporary urgent": "Ngừng tạm thời",
    "in progress": "Đang bảo trì",
    ready: "Bảo trì thành công",
    failed: "Bảo trì thất bại",
    moving: "Đang điều chuyển",
    "in stock": "Thiết bị trong kho",
    deleted: "Đã xóa",
    disposed: "Đã thanh lý",
  };
  const convertUnitStatus = (status) => {
    if (!status) return "Không xác định";
    return STATUS_LABEL[status.toLowerCase()] || "Không xác định";
  };

  // Import UI
  const [showImport, setShowImport] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [importing, setImporting] = useState(false);
  const [importResults, setImportResults] = useState([]);
  //
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewData, setPreviewData] = useState(null);
  //Lưu data
  const IMPORT_CACHE_KEY = "qr_import_results";
  const IMPORT_OPEN_KEY = "qr_import_open";
  const QR_HISTORY_KEY = "qr_history";
  const [qrHistory, setQrHistory] = useState([]);

  /* ================= START SCAN ================= */
  useEffect(() => {
    if (!scanning) return;

    const qr = new Html5Qrcode("qr-reader");
    qrRef.current = qr;

    const boxSize = Math.min(window.innerWidth * 0.7, 320);

    qr.start(
      { facingMode: "environment" },
      {
        fps: 10,
        qrbox: { width: boxSize, height: boxSize },
      },
      async (decodedText) => {
        if (!decodedText) return;

        toast.success("✅ Quét QR thành công");

        await stopScan();

        try {
          const data = await EquipmentUnitService.getById(decodedText);

          pushHistory({
            id: decodedText,
            name: data?.equipment?.name || "—",
            status: convertUnitStatus(data?.status),
            vendor: data?.vendor_name || "—",
            branch: data?.branch_id || "—",
            floor: data?.floor_name || "—",
            area: data?.area_name || "—",
            time: new Date().toISOString(),
            source: "scan",
          });

          setPreviewData(data);
          setPreviewOpen(true);
        } catch {
          toast.error("❌ Không tìm thấy thiết bị");
        }
      },
      () => {}
    ).catch(() => {
      setError("Không thể truy cập camera");
      setScanning(false);
    });

    return () => {
      stopScan();
    };
  }, [scanning]);

  /* ================= STOP SCAN (TẮT CAMERA THẬT) ================= */
  const stopScan = async () => {
    try {
      // 1️⃣ Dừng html5-qrcode
      if (qrRef.current) {
        await qrRef.current.stop();
        await qrRef.current.clear();
        qrRef.current = null;
      }

      // 2️⃣ TẮT CỨNG MediaStream (QUAN TRỌNG NHẤT)
      const videoEl = document.querySelector("#qr-reader video");

      if (videoEl) {
        const stream = videoEl.srcObject;

        if (stream) {
          stream.getTracks().forEach((track) => {
            track.stop(); // 🚨 TẮT CAMERA THẬT
          });
        }

        videoEl.srcObject = null;
        videoEl.remove();
      }

      // 3️⃣ Tắt mọi MediaDevices còn sót
      if (navigator.mediaDevices?.getUserMedia) {
        const devices = await navigator.mediaDevices.enumerateDevices();
        devices
          .filter((d) => d.kind === "videoinput")
          .forEach(() => {
            navigator.mediaDevices
              .getUserMedia({ video: false })
              .catch(() => {});
          });
      }
    } catch (err) {
      console.error("❌ Stop scan error:", err);
    } finally {
      setScanning(false);
    }
  };

  /* ================== IMPORT HELPERS ================== */
  const isImageFile = (file) => {
    if (!file) return false;
    if (file.type?.startsWith("image/")) return true;
    const name = (file.name || "").toLowerCase();
    return (
      name.endsWith(".png") ||
      name.endsWith(".jpg") ||
      name.endsWith(".jpeg") ||
      name.endsWith(".webp") ||
      name.endsWith(".bmp")
    );
  };

  const dedupeByNameAndSize = (files) => {
    const map = new Map();
    files.forEach((f) => {
      const key = `${f.name}-${f.size}`;
      if (!map.has(key)) map.set(key, f);
    });
    return Array.from(map.values());
  };

  // ✅ Đọc folder kéo-thả (Chrome/Edge) bằng webkitGetAsEntry
  const readAllFilesFromEntry = async (entry) => {
    // entry: FileSystemEntry
    if (!entry) return [];

    if (entry.isFile) {
      const file = await new Promise((resolve, reject) => {
        entry.file(resolve, reject);
      });
      return [file];
    }

    if (entry.isDirectory) {
      const reader = entry.createReader();
      const entries = await new Promise((resolve, reject) => {
        const all = [];
        const readBatch = () => {
          reader.readEntries(
            (batch) => {
              if (!batch.length) return resolve(all);
              all.push(...batch);
              readBatch();
            },
            (err) => reject(err)
          );
        };
        readBatch();
      });

      const nested = await Promise.all(entries.map(readAllFilesFromEntry));
      return nested.flat();
    }

    return [];
  };

  const scanFilesAndFetchInfo = async (files) => {
    const imgFiles = dedupeByNameAndSize(files).filter(isImageFile);

    if (!imgFiles.length) {
      toast.error("❌ Không tìm thấy file ảnh QR hợp lệ");
      return;
    }

    setImporting(true);
    setImportResults([]);

    const scanner = new Html5Qrcode("qr-import-temp");

    const results = [];
    for (let i = 0; i < imgFiles.length; i++) {
      const file = imgFiles[i];

      try {
        const decodedText = await scanner.scanFile(file, false);

        // gọi API lấy thông tin thiết bị
        const data = await EquipmentUnitService.getById(decodedText);

        results.push({
          index: i + 1,
          id: decodedText,
          name: data?.equipment?.name || "—",
          status: data?.status || "—",
          vendor: data?.vendor_name || "—",
          branch: data?.branch_id || "—",
          floor: data?.floor_name || "—",
          area: data?.area_name || "—",
        });
        pushHistory({
          id: decodedText,
          name: data?.equipment?.name || "—",
          status: convertUnitStatus(data?.status),
          vendor: data?.vendor_name || "—",
          branch: data?.branch_id || "—",
          floor: data?.floor_name || "—",
          area: data?.area_name || "—",
          time: new Date().toISOString(),
          source: "import",
        });
      } catch (err) {
        results.push({
          index: i + 1,
          id: "❌ Không đọc được QR",
          name: "—",
          status: "—",
          vendor: "—",
          branch: "—",
        });
      }
    }

    try {
      await scanner.clear();
    } catch {}
    setImportResults(results);
    sessionStorage.setItem(IMPORT_CACHE_KEY, JSON.stringify(results));
    sessionStorage.setItem(IMPORT_OPEN_KEY, "1");

    setImporting(false);
    toast.success("✅ Import QR hoàn tất");
  };

  /* ================== IMPORT: CHỌN FILE ================== */
  const handlePickFiles = async (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    await scanFilesAndFetchInfo(files);
    e.target.value = "";
  };

  /* ================== IMPORT: CHỌN FOLDER (INPUT) ================== */
  const handlePickFolder = async (e) => {
    // input type=file + webkitdirectory -> trả về list files (đã flatten)
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    await scanFilesAndFetchInfo(files);
    e.target.value = "";
  };

  /* ================== IMPORT: DROPZONE ================== */
  const onDrop = async (ev) => {
    ev.preventDefault();
    ev.stopPropagation();
    setIsDragging(false);

    const dt = ev.dataTransfer;
    if (!dt) return;

    // 1) Nếu browser cung cấp items (có thể đọc folder)
    const items = Array.from(dt.items || []);
    if (items.length) {
      const entries = items
        .map((it) => (it.webkitGetAsEntry ? it.webkitGetAsEntry() : null))
        .filter(Boolean);

      if (entries.length) {
        try {
          const allFilesNested = await Promise.all(
            entries.map(readAllFilesFromEntry)
          );
          const files = allFilesNested.flat();
          await scanFilesAndFetchInfo(files);
          return;
        } catch (err) {
          console.error("Read folder drop failed:", err);
          // fallback xuống getAsFile
        }
      }

      // fallback: lấy file trực tiếp
      const files = items
        .map((it) => it.getAsFile && it.getAsFile())
        .filter(Boolean);
      await scanFilesAndFetchInfo(files);
      return;
    }

    // 2) fallback: dt.files
    const files = Array.from(dt.files || []);
    await scanFilesAndFetchInfo(files);
  };

  const onDragOver = (ev) => {
    ev.preventDefault();
    ev.stopPropagation();
    setIsDragging(true);
  };

  const onDragLeave = (ev) => {
    ev.preventDefault();
    ev.stopPropagation();
    setIsDragging(false);
  };

  const tableRows = useMemo(() => importResults || [], [importResults]);

  // =======Lưu Storage===========
  useEffect(() => {
    const cached = sessionStorage.getItem(IMPORT_CACHE_KEY);
    const open = sessionStorage.getItem(IMPORT_OPEN_KEY);

    if (cached) {
      try {
        setImportResults(JSON.parse(cached));
        setShowImport(open === "1");
      } catch {
        sessionStorage.removeItem(IMPORT_CACHE_KEY);
        sessionStorage.removeItem(IMPORT_OPEN_KEY);
      }
    }
  }, []);
  useEffect(() => {
    const cached = sessionStorage.getItem(QR_HISTORY_KEY);
    if (cached) {
      try {
        setQrHistory(JSON.parse(cached));
      } catch {
        sessionStorage.removeItem(QR_HISTORY_KEY);
      }
    }
  }, []);
  const pushHistory = (item) => {
    setQrHistory((prev) => {
      const next = [item, ...prev].slice(0, 10); // giữ 10 bản ghi gần nhất
      sessionStorage.setItem(QR_HISTORY_KEY, JSON.stringify(next));
      return next;
    });
  };

  return (
    <PageContainer>
      <div className="max-w-5xl mx-auto space-y-6 px-2 sm:px-0">
        {/* ================= HEADER ================= */}
        <div className="rounded-2xl p-5 sm:p-6 bg-gradient-to-r from-emerald-500 to-cyan-500 text-white shadow-lg flex items-center gap-4">
          <QrCode className="w-9 h-9 sm:w-10 sm:h-10" />
          <div>
            <h1 className="text-lg sm:text-2xl font-bold">
              Quét / Import QR thiết bị
            </h1>
            <p className="text-xs sm:text-sm opacity-90">
              Quét camera hoặc kéo thả ảnh / folder QR để tra cứu thiết bị
            </p>
          </div>
        </div>

        {/* ================= GUIDE ================= */}
        {!scanning && (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <GuideCard
                icon={<ScanLine className="w-6 h-6 text-cyan-500" />}
                title="Quét QR"
                text="Dùng camera quét trực tiếp QR thiết bị"
              />
              <GuideCard
                icon={<Upload className="w-6 h-6 text-emerald-500" />}
                title="Import QR"
                text="Kéo thả n ảnh hoặc 1 folder chứa ảnh QR"
              />
              <GuideCard
                icon={<Sparkles className="w-6 h-6 text-amber-500" />}
                title="Xem kết quả"
                text="Hiển thị danh sách thiết bị trong bảng"
              />
            </div>

            {/* ACTION BUTTONS */}
            <div className="flex justify-center gap-4 pt-3 flex-wrap">
              <Button
                onClick={() => {
                  setShowImport(false);
                  setScanning(true);
                }}
                className="px-6 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 text-white shadow-lg flex items-center gap-2"
              >
                <Camera className="w-5 h-5" />
                Quét QR
              </Button>

              <Button
                variant="outline"
                onClick={() => {
                  setError("");
                  setShowImport(true);
                }}
                className="px-6 py-3 rounded-xl border-emerald-400 text-emerald-600 shadow flex items-center gap-2"
              >
                <Upload className="w-5 h-5" />
                Import (kéo thả)
              </Button>
            </div>

            {/* IMPORT ZONE */}
            <AnimatePresence>
              {showImport && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 8 }}
                  className="bg-white dark:bg-gray-800 rounded-2xl p-5 shadow-xl space-y-4"
                >
                  <div className="flex items-start justify-between gap-3 flex-wrap">
                    <div className="space-y-1">
                      <h2 className="font-semibold text-emerald-600 flex items-center gap-2">
                        <Upload className="w-5 h-5" />
                        Import ảnh QR
                      </h2>
                      <p className="text-sm text-gray-500">
                        Bạn có thể kéo thả <b>n file ảnh</b> hoặc{" "}
                        <b>1 folder</b> chứa ảnh QR vào khung bên dưới.
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        onClick={() => fileInputRef.current?.click()}
                        className="flex items-center gap-2"
                        disabled={importing}
                      >
                        <ImageIcon className="w-4 h-4" />
                        Chọn ảnh
                      </Button>

                      <Button
                        variant="outline"
                        onClick={() => folderInputRef.current?.click()}
                        className="flex items-center gap-2"
                        disabled={importing}
                      >
                        <FolderOpen className="w-4 h-4" />
                        Chọn folder
                      </Button>

                      <Button
                        variant="outline"
                        onClick={() => {
                          setShowImport(false);
                          setImportResults([]);
                          sessionStorage.removeItem(IMPORT_CACHE_KEY);
                          sessionStorage.removeItem(IMPORT_OPEN_KEY);
                        }}
                        className="flex items-center gap-2"
                        disabled={importing}
                      >
                        <XCircle className="w-4 h-4" />
                        Đóng
                      </Button>

                      {/* Hidden inputs */}
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        multiple
                        className="hidden"
                        onChange={handlePickFiles}
                      />

                      <input
                        ref={folderInputRef}
                        type="file"
                        accept="image/*"
                        multiple
                        webkitdirectory="true"
                        className="hidden"
                        onChange={handlePickFolder}
                      />
                    </div>
                  </div>

                  {/* Dropzone */}
                  <div
                    onDrop={onDrop}
                    onDragOver={onDragOver}
                    onDragLeave={onDragLeave}
                    className={`
                      relative
                      w-full
                      rounded-2xl
                      border-2 border-dashed
                      p-8 sm:p-10
                      transition
                      ${
                        isDragging
                          ? "border-emerald-400 bg-emerald-50/70 dark:bg-emerald-900/10"
                          : "border-gray-300 bg-gray-50 dark:bg-gray-900/20"
                      }
                    `}
                  >
                    <div className="flex flex-col items-center text-center gap-3">
                      <div
                        className={`
                          w-14 h-14 rounded-2xl
                          flex items-center justify-center
                          ${
                            isDragging
                              ? "bg-emerald-100 text-emerald-600"
                              : "bg-white dark:bg-gray-800 text-gray-600"
                          }
                          shadow
                        `}
                      >
                        <Upload className="w-7 h-7" />
                      </div>

                      <div className="space-y-1">
                        <p className="font-semibold text-gray-800 dark:text-gray-100">
                          Kéo thả ảnh QR hoặc folder vào đây
                        </p>
                        <p className="text-sm text-gray-500">
                          Hỗ trợ PNG, JPG, JPEG, WEBP…
                        </p>
                      </div>

                      {importing && (
                        <div className="flex items-center gap-2 text-sm text-emerald-600 mt-2">
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Đang xử lý ảnh QR...
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Result table */}
                  {tableRows.length > 0 && (
                    <div className="bg-white dark:bg-gray-900 rounded-2xl border shadow-sm overflow-hidden">
                      <div className="p-4 flex items-center justify-between gap-3 flex-wrap">
                        <h3 className="font-semibold text-emerald-600">
                          Kết quả import ({tableRows.length})
                        </h3>
                        <p className="text-xs text-gray-500">
                          Click 1 dòng để mở trang thiết bị
                        </p>
                      </div>

                      <div className="overflow-x-auto">
                        <table className="w-full text-xs sm:text-sm border-t">
                          <thead className="bg-gray-100 dark:bg-gray-800">
                            <tr>
                              <th className="p-2 border-r text-center w-[60px]">
                                #
                              </th>
                              <th className="p-2 border-r">ID thiết bị</th>
                              <th className="p-2 border-r">Tên thiết bị</th>
                              <th className="p-2 border-r">Trạng thái</th>
                              <th className="p-2 border-r">Nhà cung cấp</th>
                              <th className="p-2 border-r">Chi nhánh</th>
                              <th className="p-2 border-r">Tầng</th>
                              <th className="p-2">Khu</th>
                            </tr>
                          </thead>
                          <tbody>
                            {tableRows.map((row) => {
                              const isBad = String(row.id || "").startsWith(
                                "❌"
                              );
                              return (
                                <tr
                                  key={row.index}
                                  className={`hover:bg-gray-50 dark:hover:bg-gray-800/60 ${
                                    isBad ? "opacity-80" : "cursor-pointer"
                                  }`}
                                  onClick={() => {
                                    if (isBad) return;
                                    navigate(`/app/equipment/${row.id}`);
                                  }}
                                >
                                  <td className="p-2 border-t border-r text-center">
                                    {row.index}
                                  </td>
                                  <td className="p-2 border-t border-r font-mono">
                                    {row.id}
                                  </td>
                                  <td className="p-2 border-t border-r">
                                    {row.name}
                                  </td>
                                  <td className="p-2 border-t border-r">
                                    <Status
                                      status={convertUnitStatus(row.status)}
                                    />
                                  </td>
                                  <td className="p-2 border-t border-r">
                                    {row.vendor}
                                  </td>
                                  <td className="p-2 border-t border-r">
                                    {row.branch}
                                  </td>
                                  <td className="p-2 border-t border-r">
                                    {row.floor}
                                  </td>
                                  <td className="p-2 border-t">{row.area}</td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </>
        )}

        {/* ================= SCANNER ================= */}
        <AnimatePresence>
          {scanning && (
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              className="bg-white dark:bg-gray-800 rounded-2xl p-4 sm:p-5 shadow-xl space-y-4"
            >
              <div className="flex justify-between items-center">
                <h2 className="font-semibold text-emerald-600 flex items-center gap-2">
                  <Camera className="w-5 h-5" /> Đang quét QR
                </h2>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={stopScan}
                  className="flex items-center gap-1"
                >
                  <XCircle className="w-4 h-4" /> Hủy
                </Button>
              </div>

              {/* ===== SCAN BOX ===== */}
              <div
                className="
                  relative mx-auto
                  w-[90vw] max-w-[420px]
                  aspect-square
                  rounded-2xl
                  border-2 border-emerald-400
                  bg-black
                  overflow-hidden
                  shadow-xl
                "
              >
                <div id="qr-reader" className="w-full h-full" />

                {/* Corner marks */}
                <div className="absolute inset-0 pointer-events-none">
                  <Corner className="top-0 left-0" />
                  <Corner className="top-0 right-0 rotate-90" />
                  <Corner className="bottom-0 right-0 rotate-180" />
                  <Corner className="bottom-0 left-0 -rotate-90" />
                </div>

                {/* Scan line */}
                <motion.div
                  initial={{ y: 0 }}
                  animate={{ y: "85%" }}
                  transition={{
                    repeat: Infinity,
                    duration: 2,
                    ease: "linear",
                  }}
                  className="absolute left-0 right-0 h-[2px] bg-emerald-400/80"
                />
              </div>

              <p className="text-center text-sm sm:text-base text-gray-500">
                Giữ QR trong khung để hệ thống nhận diện
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        {error && (
          <div className="text-center text-sm text-red-500">{error}</div>
        )}

        {/* ✅ div ẩn: html5-qrcode cần 1 container id để scanFile */}
        <div id="qr-import-temp" className="hidden" />

        {qrHistory.length > 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow space-y-3">
            {/* HEADER */}
            <div className="flex items-center justify-between gap-2">
              <h3 className="font-semibold text-emerald-600">
                Lịch sử quét / import QR
              </h3>

              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  setQrHistory([]);
                  sessionStorage.removeItem(QR_HISTORY_KEY);
                  toast.success("✅ Đã xoá lịch sử");
                }}
              >
                Xoá lịch sử
              </Button>
            </div>

            {/* TABLE */}
            <div className="overflow-x-auto">
              <table className="w-full text-xs sm:text-sm border-t">
                <thead className="bg-gray-100 dark:bg-gray-700">
                  <tr>
                    <th className="p-2 border-r">Dạng</th>
                    <th className="p-2 border-r">Thời điểm</th>
                    <th className="p-2 border-r">ID thiết bị</th>
                    <th className="p-2 border-r">Tên thiết bị</th>
                    <th className="p-2 border-r">Trạng thái</th>
                    <th className="p-2 border-r">Nhà cung cấp</th>
                    <th className="p-2 border-r">Chi nhánh</th>
                    <th className="p-2 border-r">Tầng</th>
                    <th className="p-2">Khu</th>
                  </tr>
                </thead>

                <tbody>
                  {qrHistory.map((item, idx) => (
                    <tr
                      key={idx}
                      className="
                hover:bg-emerald-50 dark:hover:bg-gray-700/50
                cursor-pointer
                transition
              "
                      onClick={() => navigate(`/app/equipment/${item.id}`)}
                    >
                      <td className="p-2 border-t border-r whitespace-nowrap">
                        {item.source === "scan" ? "📷 Quét" : "📁 Import"}
                      </td>

                      <td className="p-2 border-t border-r whitespace-nowrap">
                        {new Date(item.time).toLocaleTimeString("vi-VN", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </td>

                      <td className="p-2 border-t border-r font-mono">
                        {item.id}
                      </td>

                      <td className="p-2 border-t border-r">{item.name}</td>

                      <td className="p-2 border-t border-r">
                        <Status status={item.status} />
                      </td>

                      <td className="p-2 border-t border-r">{item.vendor}</td>

                      <td className="p-2 border-t border-r">{item.branch}</td>

                      <td className="p-2 border-t border-r text-center">
                        {item.floor}
                      </td>

                      <td className="p-2 border-t text-center">{item.area}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* ================= FITX LIGHT PRO POPUP ================= */}
      <AnimatePresence>
        {previewOpen && previewData && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setPreviewOpen(false)}
          >
            <motion.div
              onClick={(e) => e.stopPropagation()}
              initial={{ y: 40, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 40, opacity: 0 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
              className="w-[92vw] max-w-5xl bg-white rounded-[28px] 
              shadow-[0_40px_120px_rgba(0,0,0,0.18)] overflow-hidden"
            >
              {/* TOP ACCENT */}
              <div className="h-1.5 bg-gradient-to-r from-emerald-400 to-cyan-400" />

              <div className="p-10">
                {/* ===== HEADER ===== */}
                <div className="flex-col sm:flex-row">
                  {/* IMAGE */}
                  <div
                    className="w-64 h-64 rounded-2xl bg-gradient-to-br from-emerald-50 to-cyan-50
                    border border-emerald-100 flex items-center justify-center"
                  >
                    <img
                      src={previewData.equipment?.image || "/placeholder.jpg"}
                      alt={previewData.equipment?.name}
                      className="max-w-full max-h-full object-contain"
                    />
                  </div>

                  {/* MAIN INFO */}
                  <div className="flex-1 space-y-5">
                    {/* TITLE */}
                    <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-gray-900">
                      {previewData.equipment?.name}
                    </h1>

                    {/* STATUS */}
                    <div>
                      <Status status={convertUnitStatus(previewData.status)} />
                    </div>

                    {/* ID */}
                    <p className="text-base text-gray-500">
                      Mã định danh thiết bị:&nbsp;
                      <span className="font-mono font-medium text-gray-800">
                        {previewData.id}
                      </span>
                    </p>

                    {/* INFO GRID */}
                    <div className="grid grid-cols-2 gap-x-6 sm:gap-x-12 gap-y-4 sm:gap-y-6 text-sm sm:text-base mt-6">
                      <LightSpec
                        label="Nhà cung cấp"
                        value={previewData.vendor_name}
                      />
                      <LightSpec
                        label="Chi nhánh"
                        value={previewData.branch_id}
                      />
                      <LightSpec
                        label="Nhóm thiết bị"
                        value={previewData.equipment?.main_name}
                      />
                      <LightSpec
                        label="Loại thiết bị"
                        value={previewData.equipment?.type_name}
                      />
                      <LightSpec label="Tầng" value={previewData.floor_name} />

                      <LightSpec label="Khu" value={previewData.area_name} />
                    </div>
                  </div>
                </div>

                {/* DIVIDER */}
                <div className="my-10 h-px bg-gray-200" />

                {/* ACTION */}
                <div className="flex justify-end gap-4">
                  <button
                    onClick={() => setPreviewOpen(false)}
                    className="
                px-8 py-3
                rounded-xl
                border border-gray-300
                text-gray-700
                hover:bg-gray-100
              "
                  >
                    Đóng
                  </button>

                  <button
                    onClick={() => navigate(`/app/equipment/${previewData.id}`)}
                    className="
                px-10 py-3
                rounded-xl
                bg-emerald-500
                text-white font-semibold
                hover:bg-emerald-600
                shadow-lg shadow-emerald-500/30
              "
                  >
                    Đi đến thiết bị →
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </PageContainer>
  );
}

/* ================= SUB COMPONENTS ================= */

function GuideCard({ icon, title, text }) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 shadow border space-y-3">
      {icon}
      <h3 className="text-sm sm:text-base font-semibold">{title}</h3>
      <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300">
        {text}
      </p>
    </div>
  );
}

function Corner({ className = "" }) {
  return (
    <div
      className={`absolute w-6 h-6 border-t-4 border-l-4 border-emerald-400 ${className}`}
    />
  );
}
function LightSpec({ label, value }) {
  return (
    <div>
      <p className="text-sm text-gray-500">{label}</p>
      <p className="text-lg font-semibold text-gray-900">{value || "—"}</p>
    </div>
  );
}
