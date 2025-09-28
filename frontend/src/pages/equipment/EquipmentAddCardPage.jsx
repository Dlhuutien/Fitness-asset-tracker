import PageContainer from "@/components/common/PageContainer";
import PageTransition from "@/components/common/PageTransition";

export default function EquipmentAddCardPage() {
  return (
    <PageTransition>
      <PageContainer>
        <h1 className="text-xl font-bold">Thêm thẻ kho, thông số</h1>
        <p className="text-gray-600">
          Trang thêm thẻ kho và thông số thiết bị.
        </p>
      </PageContainer>
    </PageTransition>
  );
}
