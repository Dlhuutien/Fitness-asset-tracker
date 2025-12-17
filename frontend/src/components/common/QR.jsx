import { QRCodeCanvas } from "qrcode.react";

export default function QR({ value, size = 160 }) {
  if (!value) return null;

  return (
    <div className="p-4 rounded-2xl bg-white border-2 border-emerald-400 shadow-md">
      <QRCodeCanvas
        value={String(value)}
        size={size}
        level="H"
        includeMargin
      />
    </div>
  );
}
