import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/Button";
import { Pencil, Trash2 } from "lucide-react";
import PageContainer from "@/components/common/PageContainer";

const equipmentData = [
  {
    id: 1,
    name: "Máy chạy bộ Life Fitness T5",
    category: "Cardio",
    status: "active",
    warranty: "12 tháng",
  },
  {
    id: 2,
    name: "Ghế đẩy ngực Technogym",
    category: "Strength",
    status: "maintenance",
    warranty: "24 tháng",
  },
  {
    id: 3,
    name: "Xe đạp tập Matrix C50",
    category: "Cardio",
    status: "inactive",
    warranty: "6 tháng",
  },
{
    id: 3,
    name: "Xe đạp tập Matrix C50",
    category: "Cardio",
    status: "inactive",
    warranty: "6 tháng",
  },
{
    id: 3,
    name: "Xe đạp tập Matrix C50",
    category: "Cardio",
    status: "inactive",
    warranty: "6 tháng",
  },
{
    id: 3,
    name: "Xe đạp tập Matrix C50",
    category: "Cardio",
    status: "inactive",
    warranty: "6 tháng",
  },
{
    id: 3,
    name: "Xe đạp tập Matrix C50",
    category: "Cardio",
    status: "inactive",
    warranty: "6 tháng",
  },
{
    id: 3,
    name: "Xe đạp tập Matrix C50",
    category: "Cardio",
    status: "inactive",
    warranty: "6 tháng",
  },
{
    id: 3,
    name: "Xe đạp tập Matrix C50",
    category: "Cardio",
    status: "inactive",
    warranty: "6 tháng",
  },
{
    id: 3,
    name: "Xe đạp tập Matrix C50",
    category: "Cardio",
    status: "inactive",
    warranty: "6 tháng",
  },
{
    id: 3,
    name: "Xe đạp tập Matrix C50",
    category: "Cardio",
    status: "inactive",
    warranty: "6 tháng",
  },
{
    id: 3,
    name: "Xe đạp tập Matrix C50",
    category: "Cardio",
    status: "inactive",
    warranty: "6 tháng",
  },
{
    id: 3,
    name: "Xe đạp tập Matrix C50",
    category: "Cardio",
    status: "inactive",
    warranty: "6 tháng",
  },
{
    id: 3,
    name: "Xe đạp tập Matrix C50",
    category: "Cardio",
    status: "inactive",
    warranty: "6 tháng",
  },
{
    id: 3,
    name: "Xe đạp tập Matrix C50",
    category: "Cardio",
    status: "inactive",
    warranty: "6 tháng",
  },
{
    id: 3,
    name: "Xe đạp tập Matrix C50",
    category: "Cardio",
    status: "inactive",
    warranty: "6 tháng",
  },
{
    id: 3,
    name: "Xe đạp tập Matrix C50",
    category: "Cardio",
    status: "inactive",
    warranty: "6 tháng",
  },
{
    id: 3,
    name: "Xe đạp tập Matrix C50",
    category: "Cardio",
    status: "inactive",
    warranty: "6 tháng",
  },
{
    id: 3,
    name: "Xe đạp tập Matrix C50",
    category: "Cardio",
    status: "inactive",
    warranty: "6 tháng",
  },
{
    id: 3,
    name: "Xe đạp tập Matrix C50",
    category: "Cardio",
    status: "inactive",
    warranty: "6 tháng",
  },
{
    id: 3,
    name: "Xe đạp tập Matrix C50",
    category: "Cardio",
    status: "inactive",
    warranty: "6 tháng",
  },
];

export default function EquipmentPage() {
  return (
<PageContainer >

      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold">Danh sách thiết bị</h1>
          <Button>+ Thêm thiết bị</Button>
        </div>
  
        {/* Equipment Table */}
        <div className="rounded-xl border shadow-sm bg-white">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50">
                <TableHead className="w-[50px]">#</TableHead>
                <TableHead>Tên thiết bị</TableHead>
                <TableHead>Loại</TableHead>
                <TableHead>Tình trạng</TableHead>
                <TableHead>Bảo hành</TableHead>
                <TableHead className="text-right">Hành động</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {equipmentData.map((eq, idx) => (
                <TableRow key={eq.id} className="hover:bg-gray-50">
                  <TableCell>{idx + 1}</TableCell>
                  <TableCell className="font-medium">{eq.name}</TableCell>
                  <TableCell>{eq.category}</TableCell>
                  <TableCell>
                    {eq.status === "active" && (
                      <Badge className="bg-emerald-500 hover:bg-emerald-600">
                        Hoạt động
                      </Badge>
                    )}
                    {eq.status === "maintenance" && (
                      <Badge className="bg-yellow-500 hover:bg-yellow-600 text-white">
                        Bảo trì
                      </Badge>
                    )}
                    {eq.status === "inactive" && (
                      <Badge variant="destructive">Ngưng</Badge>
                    )}
                  </TableCell>
                  <TableCell>{eq.warranty}</TableCell>
                  <TableCell className="text-right space-x-2">
                    <Button size="icon" variant="outline">
                      <Pencil size={16} />
                    </Button>
                    <Button size="icon" variant="destructive">
                      <Trash2 size={16} />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
</PageContainer>
  );
}
