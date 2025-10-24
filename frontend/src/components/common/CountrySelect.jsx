import { useMemo } from "react";
import Select from "react-select";
import countryList from "react-select-country-list";
import Flag from "react-world-flags";

export default function CountrySelect({ value, onChange }) {
  const rawOptions = useMemo(() => countryList().getData(), []);

  // 🔹 Tạo danh sách quốc gia kèm lá cờ SVG
  const options = useMemo(
    () =>
      rawOptions.map((c) => ({
        value: c.label,
        code: c.value, // mã ISO (VN, US,...)
        label: (
          <div className="flex items-center gap-2">
            <Flag
              code={c.value}
              style={{
                width: "20px",
                height: "14px",
                borderRadius: "2px",
                objectFit: "cover",
              }}
              fallback={<span className="text-gray-400">🏳️</span>}
            />
            <span>{c.label}</span>
          </div>
        ),
      })),
    [rawOptions]
  );

  // 🔧 Tùy chỉnh style React Select (FitX style)
  const customStyles = {
    control: (base, state) => ({
      ...base,
      backgroundColor:
        document.documentElement.classList.contains("dark")
          ? "#1f2937"
          : "#fff",
      color:
        document.documentElement.classList.contains("dark")
          ? "#f9fafb"
          : "#111827",
      borderColor: state.isFocused ? "#10b981" : "#e5e7eb",
      boxShadow: state.isFocused ? "0 0 0 1px #10b981" : "none",
      "&:hover": { borderColor: "#10b981" },
      borderRadius: "0.5rem",
      minHeight: "2.5rem",
    }),
    menu: (base) => ({
      ...base,
      zIndex: 50,
      backgroundColor:
        document.documentElement.classList.contains("dark")
          ? "#374151"
          : "#fff",
      borderRadius: "0.5rem",
      overflow: "hidden",
    }),
    option: (base, state) => ({
      ...base,
      backgroundColor: state.isFocused
        ? "#10b98122"
        : document.documentElement.classList.contains("dark")
        ? "#374151"
        : "#fff",
      color:
        document.documentElement.classList.contains("dark") || state.isFocused
          ? "#013819ff"
          : "#111827",
      cursor: "pointer",
      padding: "8px 12px",
    }),
    singleValue: (base) => ({
      ...base,
      color: document.documentElement.classList.contains("dark")
        ? "#f9fafb"
        : "#111827",
    }),
  };

  return (
    <Select
      placeholder="🌍 Chọn quốc gia..."
      options={options}
      value={options.find((opt) => opt.value === value) || null}
      onChange={(selected) => onChange(selected?.value || "")}
      styles={customStyles}
      isClearable
    />
  );
}
