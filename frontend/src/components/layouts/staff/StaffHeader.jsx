import { Button } from "@/components/ui/buttonn";

export default function StaffHeader() {
  return (
    <div className="flex items-center justify-between mb-6">
      <h1 className="text-2xl font-bold">Danh sách nhân viên</h1>
      <Button className="bg-green-500 hover:bg-green-600">
        + Thêm nhân viên
      </Button>
    </div>
  );
}
