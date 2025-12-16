import { useMemo } from "react";
import { Button } from "@/components/ui/buttonn";
import { Building2, PlusCircle } from "lucide-react";
import Flag from "react-world-flags";
import countryList from "react-select-country-list";

export default function VendorSection({
  vendors = [],
  selectedVendor,
  onSelectVendor,
  vendorLatestPrices = {},
  onAddVendor,
}) {
  const byId = useMemo(() => {
    const map = {};
    vendors.forEach((v) => (map[v.id] = v));
    return map;
  }, [vendors]);

  // ✅ Lấy mã quốc gia cho flag
  const getCountryCode = (countryName) => {
    if (!countryName) return null;
    const countries = countryList().getData();
    const match = countries.find(
      (c) => c.label.toLowerCase() === countryName.toLowerCase()
    );
    return match ? match.value : null;
  };

  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-emerald-600 flex items-center gap-2">
          <Building2 size={18} /> Nhà cung cấp
        </h3>

        <div className="hidden md:flex flex items-center gap-2">
          {onAddVendor && (
            <Button
              size="sm"
              onClick={onAddVendor}
              className="h-9 px-4 bg-emerald-500 hover:bg-emerald-600 text-white flex items-center gap-2 font-medium rounded-lg shadow"
            >
              <PlusCircle size={16} /> Thêm vendor mới
            </Button>
          )}
          {selectedVendor && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onSelectVendor("")}
              className="h-9 px-3 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30"
            >
              Bỏ chọn
            </Button>
          )}
        </div>
      </div>

      {/* Vendor Cards */}
      {vendors.length > 0 ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          {vendors.map((v) => {
            const active = selectedVendor === v.id;
            const latest = vendorLatestPrices[v.id];
            const countryCode = getCountryCode(v.origin);

            return (
              <button
  key={v.id}
  onClick={() => onSelectVendor(v.id)}
  className={`group text-left rounded-xl border transition-all duration-200 p-4 ${
    active
      ? "border-emerald-500 ring-1 ring-emerald-300 bg-gradient-to-br from-emerald-50/80 to-emerald-100/40 dark:from-emerald-900/30 dark:to-gray-800"
      : "border-gray-200 dark:border-gray-700 hover:border-emerald-400 hover:shadow-md hover:-translate-y-[1px]"
  }`}
>
  <div className="flex items-start justify-between">
    <div className="space-y-0.5">
      <p className="text-xs text-gray-500 dark:text-gray-400">
        Mã: <span className="font-mono text-gray-600">{v.id}</span>
      </p>

      <div className="flex items-center gap-2">
        {countryCode && (
          <Flag
            code={countryCode}
            className="w-5 h-4 rounded-sm border border-gray-300 dark:border-gray-600 shadow-sm"
          />
        )}
        <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
          {v.name}
        </p>
      </div>

      <p className="text-xs text-gray-500 dark:text-gray-400">
        Quốc gia: {v.origin || "—"}
      </p>
    </div>

    {active && (
      <span className="px-2 py-0.5 text-[10px] rounded bg-emerald-500 text-white font-semibold">
        Đang chọn
      </span>
    )}
  </div>
</button>

            );
          })}
        </div>
      ) : (
        <div className="text-sm text-gray-500 italic text-center py-8">
          Chưa có nhà cung cấp nào.
        </div>
      )}
    </div>
  );
}
