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
    moving: "Đang di chuyển",
    "in stock": "Thiết bị trong kho",
    "temporary urgent": "Ngừng tạm thời",
    "in progress": "Đang bảo trì",
    deleted: "Đã xóa",
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
function useFixedDropdownPosition(open, anchorRef, menuWidth = 240, offset = 8) {
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
  values = [],
  selected = [],
  onChange,
  controller,
}) {
  const anchorRef = useRef(null);
  const isOpen = controller.openKey === selfKey;

  const toggleValue = (val) => {
    if (selected.includes(val)) onChange(selected.filter((v) => v !== val));
    else onChange([...selected, val]);
  };

  const selectAll = () => onChange([...values]);
  const clearAll = () => onChange([]);

  return (
    <div className="relative" ref={anchorRef}>
      <div
        className="flex items-center justify-between cursor-pointer group"
        onMouseDown={(e) => e.stopPropagation()}
        onClick={() => controller.toggle(selfKey)}
      >
        <span>{label}</span>
        <Filter
          size={16}
          className={`ml-1 transition ${
            isOpen ? "text-emerald-500" : "text-gray-400 group-hover:text-emerald-400"
          }`}
        />
      </div>

      {/* Dropdown render ra body để không bị cắt bởi overflow */}
      <PortalDropdown
        open={isOpen}
        anchorRef={anchorRef}
        width={240}
        onClose={() => controller.setOpenKey(null)}
      >
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg shadow-xl max-h-[280px] overflow-y-auto animate-in fade-in zoom-in-95">
          <div className="sticky top-0 bg-gray-50 dark:bg-gray-700 px-3 py-2 flex items-center justify-between text-xs text-gray-600 dark:text-gray-300 border-b dark:border-gray-600">
            <button onClick={selectAll} className="hover:text-emerald-500">
              Chọn tất cả
            </button>
            <button onClick={clearAll} className="hover:text-rose-500">
              Bỏ tất cả
            </button>
          </div>

          {values.length === 0 ? (
            <div className="p-3 text-center text-gray-400 text-sm">Không có dữ liệu</div>
          ) : (
            values.map((val) => (
              <label
                key={val}
                className="flex items-center gap-2 px-3 py-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer text-sm"
              >
                <input
                  type="checkbox"
                  className="accent-emerald-500 w-4 h-4"
                  checked={selected.includes(val)}
                  onChange={() => toggleValue(val)}
                />
                <span className="truncate" title={val}>
                  {val}
                </span>
              </label>
            ))
          )}
        </div>
      </PortalDropdown>
    </div>
  );
}

/* ======================
   ColumnVisibilityButton (portal)
====================== */
export function ColumnVisibilityButton({ visibleColumns, setVisibleColumns, labels }) {
  const [open, setOpen] = useState(false);
  const anchorRef = useRef(null);

  const toggleCol = (key) => {
    setVisibleColumns((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const showAll = () => {
    const all = Object.fromEntries(Object.keys(visibleColumns).map((k) => [k, true]));
    setVisibleColumns(all);
  };
  const hideAll = () => {
    const all = Object.fromEntries(Object.keys(visibleColumns).map((k) => [k, false]));
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
