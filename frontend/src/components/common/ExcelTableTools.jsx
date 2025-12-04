import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Eye, Filter } from "lucide-react";
import { Button } from "@/components/ui/buttonn";

/* ======================
   Helpers
====================== */
export function getStatusVN(status) {
  const map = {
    active: "Hoạt động",
    inactive: "Ngưng hoạt động",
    ready: "Bảo trì thành công",
    failed: "Bảo trì thất bại",
    moving: "Đang điều chuyển",
    "in stock": "Thiết bị trong kho",
    "temporary urgent": "Ngừng tạm thời",
    "in progress": "Đang bảo trì",
    deleted: "Đã xóa",
    disposed: "Đã thanh lý", // ✅ chữ thường
  };
  return map[status?.trim()?.toLowerCase()] || "Không xác định";
}

export function getUniqueValues(list, getter) {
  const set = new Set();
  (list || []).forEach((item) => {
    const v = typeof getter === "function" ? getter(item) : item?.[getter];
    if (v !== undefined && v !== null && v !== "") set.add(String(v));
  });
  return Array.from(set).sort((a, b) => a.localeCompare(b, "vi"));
}

export function useGlobalFilterController() {
  const [openKey, setOpenKey] = useState(null);
  const toggle = (key) => setOpenKey((prev) => (prev === key ? null : key));
  return { openKey, toggle, setOpenKey };
}

/* ======================
   Internal hooks
====================== */
function useFixedDropdownPosition(
  open,
  anchorRef,
  menuWidth = 240,
  offset = 8
) {
  const [pos, setPos] = useState({ top: 0, left: 0 });

  useEffect(() => {
    if (!open) return;

    const update = () => {
      const r = anchorRef.current?.getBoundingClientRect();
      if (!r) return;
      let left = r.left;
      let top = r.bottom + offset;

      // tránh tràn phải
      if (left + menuWidth > window.innerWidth - 8) {
        left = Math.max(8, window.innerWidth - menuWidth - 8);
      }
      // tránh tràn trái
      if (left < 8) left = 8;

      setPos({ top, left });
    };

    update();
    window.addEventListener("resize", update);
    // lắng nghe scroll của cả trang & các container (capture)
    window.addEventListener("scroll", update, true);
    return () => {
      window.removeEventListener("resize", update);
      window.removeEventListener("scroll", update, true);
    };
  }, [open, anchorRef, menuWidth, offset]);

  return pos;
}

function PortalDropdown({ open, anchorRef, width = 240, onClose, children }) {
  const { top, left } = useFixedDropdownPosition(open, anchorRef, width);

  useEffect(() => {
    if (!open) return;
    const handle = () => onClose?.();
    // Đóng khi click ngoài
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, [open, onClose]);

  if (!open) return null;

  return createPortal(
    <div
      style={{
        position: "fixed",
        top,
        left,
        width,
        zIndex: 1000,
      }}
      // chặn lan ra document để khỏi bị đóng khi click bên trong
      onMouseDown={(e) => e.stopPropagation()}
    >
      {children}
    </div>,
    document.body
  );
}

/* ======================
   HeaderFilter (Excel-style)
====================== */
export function HeaderFilter({
  selfKey,
  label,
  values,
  selected,
  onChange,
  controller,
}) {
  const [open, setOpen] = useState(false);
  const buttonRef = useRef(null);
  const dropdownRef = useRef(null);

  const toggleDropdown = (e) => {
    e.stopPropagation();
    setOpen(!open);
    controller?.closeAllExcept?.(selfKey);
  };

  // Đóng dropdown khi click ngoài
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target) &&
        !buttonRef.current.contains(event.target)
      ) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative inline-flex items-center gap-1 group select-none">
      {/* Tiêu đề + icon filter nằm cùng dòng */}
      <span className="text-sm font-medium text-gray-700 dark:text-gray-200 flex items-center gap-1">
        {label}
        <button
          ref={buttonRef}
          onClick={toggleDropdown}
          className="w-4 h-4 opacity-60 hover:opacity-100 hover:text-emerald-500 transition"
        >
          <Filter
            size={14}
            className={`transition-transform duration-200 ${
              open
                ? "rotate-180 text-emerald-500"
                : "text-gray-400 dark:text-gray-300"
            }`}
          />
        </button>
      </span>

      {/* Dropdown filter */}
      {open && (
        <div
          ref={dropdownRef}
          className="absolute z-[9999] top-[120%] left-0 min-w-[180px] bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md shadow-lg p-2 text-sm"
        >
          <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mb-1">
            <button
              className="hover:text-emerald-500"
              onClick={() => onChange(values)}
            >
              Chọn tất cả
            </button>
            <button className="hover:text-red-500" onClick={() => onChange([])}>
              Bỏ tất cả
            </button>
          </div>
          <div className="max-h-48 overflow-y-auto space-y-1 pr-1">
            {values.map((v, i) => (
              <label key={i} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={selected.includes(v)}
                  onChange={() =>
                    onChange(
                      selected.includes(v)
                        ? selected.filter((x) => x !== v)
                        : [...selected, v]
                    )
                  }
                  className="accent-emerald-500"
                />
                <span className="truncate">{v || "(Trống)"}</span>
              </label>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/* ======================
   ColumnVisibilityButton (portal)
====================== */
export function ColumnVisibilityButton({
  visibleColumns,
  setVisibleColumns,
  labels,
}) {
  const [open, setOpen] = useState(false);
  const anchorRef = useRef(null);

  const toggleCol = (key) => {
    setVisibleColumns((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const showAll = () => {
    const all = Object.fromEntries(
      Object.keys(visibleColumns).map((k) => [k, true])
    );
    setVisibleColumns(all);
  };
  const hideAll = () => {
    const all = Object.fromEntries(
      Object.keys(visibleColumns).map((k) => [k, false])
    );
    setVisibleColumns(all);
  };

  return (
    <div className="relative" ref={anchorRef}>
      <Button
        onMouseDown={(e) => e.stopPropagation()}
        onClick={() => setOpen((p) => !p)}
        className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white font-medium px-4 py-2 rounded-md shadow-md transition"
      >
        <Eye size={18} />
        <span>Hiển thị cột</span>
      </Button>

      <PortalDropdown
        open={open}
        anchorRef={anchorRef}
        width={240}
        onClose={() => setOpen(false)}
      >
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg animate-in fade-in zoom-in-95 p-2">
          <div className="flex justify-between text-xs px-1 pb-2 text-gray-500 dark:text-gray-400 border-b dark:border-gray-700">
            <button onClick={showAll} className="hover:text-emerald-500">
              Chọn tất cả
            </button>
            <button onClick={hideAll} className="hover:text-rose-500">
              Bỏ tất cả
            </button>
          </div>
          <div className="max-h-56 overflow-y-auto mt-2">
            {Object.keys(labels).map((key) => (
              <label
                key={key}
                className="flex items-center gap-2 px-2 py-1 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer"
              >
                <input
                  type="checkbox"
                  className="accent-emerald-500 w-4 h-4"
                  checked={!!visibleColumns[key]}
                  onChange={() => toggleCol(key)}
                />
                <span>{labels[key]}</span>
              </label>
            ))}
          </div>
        </div>
      </PortalDropdown>
    </div>
  );
}
