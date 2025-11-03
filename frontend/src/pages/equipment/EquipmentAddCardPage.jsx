// ✅ src/pages/equipment/EquipmentAddCardPage.jsx
import { useState, useEffect, useImperativeHandle, forwardRef } from "react";
import { Button } from "@/components/ui/buttonn";
import { toast } from "sonner";
import { useSWRConfig } from "swr";
import { API } from "@/config/url";

import AddCard1 from "@/components/panel/addCardEquipment/AddCard1";
import AddCard3 from "@/components/panel/addCardEquipment/AddCard3";

import EquipmentGroupQuickAdd from "@/components/panel/addCardEquipment/QuickGroup";
import EquipmentTypeQuickAdd from "@/components/panel/addCardEquipment/QuickType";

import CategoryMainService from "@/services/categoryMainService";
import CategoryTypeService from "@/services/categoryTypeService";
import AttributeService from "@/services/attributeService";
import TypeAttributeService from "@/services/typeAttributeService";
import EquipmentService from "@/services/equipmentService";

function EquipmentAddCardPageInner({ onSuccessAdd, onCancel, onLoadingChange }, ref) {
  const { mutate } = useSWRConfig();

  // ===================== STATE =====================
  const [formData, setFormData] = useState({
    group: "",
    type: "",
    name: "",
    description: "",
    image: null,
    preview: "",
  });

  const [groups, setGroups] = useState([]);
  const [types, setTypes] = useState([]);
  const [attributes, setAttributes] = useState([]);
  const [typeAttributes, setTypeAttributes] = useState([]);
  const [selectedAttrs, setSelectedAttrs] = useState({});
  const [selectedNewAttrs, setSelectedNewAttrs] = useState({});

  const [searchAttr, setSearchAttr] = useState("");
  const [attrTab, setAttrTab] = useState("pick");
  const [showAddAttr, setShowAddAttr] = useState(false);
  const [newAttr, setNewAttr] = useState("");
  const [loadingAdd, setLoadingAdd] = useState(false);
  const [spinClearChecked, setSpinClearChecked] = useState(false);
  const [spinClearInputs, setSpinClearInputs] = useState(false);
  const [loadingSubmit, setLoadingSubmit] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
const [errors, setErrors] = useState({});

  const [openQuickAddGroup, setOpenQuickAddGroup] = useState(false);
  const [openQuickAddType, setOpenQuickAddType] = useState(false);

  // ===================== FETCH DATA =====================
  useEffect(() => {
    onLoadingChange?.(loadingSubmit);
  }, [loadingSubmit]);

  useEffect(() => {
    (async () => {
      try {
        const [groupList, typeList, attrList] = await Promise.all([
          CategoryMainService.getAll(),
          CategoryTypeService.getAllWithDisplayName(),
          AttributeService.getAll(),
        ]);
        setGroups(groupList || []);
        setTypes(typeList || []);
        setAttributes(attrList || []);
      } catch (err) {
        console.error("❌ Lỗi load dữ liệu:", err);
      }
    })();
  }, []);

  useEffect(() => {
    if (!formData.type) {
      setTypeAttributes([]);
      setSelectedAttrs({});
      return;
    }
    (async () => {
      try {
        const data = await TypeAttributeService.getAttributesByType(formData.type);
        setTypeAttributes(data || []);
        setSelectedAttrs({});
      } catch (err) {
        console.error("❌ Lỗi khi tải attribute:", err);
        toast.error("Không thể tải thông số kỹ thuật cho loại này.");
      }
    })();
  }, [formData.type]);

  // ===================== HANDLERS =====================
  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const previewURL = URL.createObjectURL(file);
    setFormData((p) => ({ ...p, image: file, preview: previewURL }));
  };

  const clearAllChecked = () => {
    setSpinClearChecked(true);
    setSelectedAttrs({});
    setTimeout(() => setSpinClearChecked(false), 600);
  };

  const clearAllInputs = () => {
    setSpinClearInputs(true);
    setSelectedAttrs((prev) =>
      Object.fromEntries(Object.keys(prev).map((k) => [k, ""]))
    );
    setTimeout(() => setSpinClearInputs(false), 600);
  };

  const addNewAttribute = async () => {
    const trimmed = newAttr.trim();
    if (!trimmed) {
      setErrorMsg("Vui lòng nhập tên thông số.");
      return;
    }
    setLoadingAdd(true);
    setErrorMsg("");
    setSuccessMsg("");
    try {
      const existingAttr = attributes.find(
        (a) => a.name.toLowerCase() === trimmed.toLowerCase()
      );
      let attrToUse = existingAttr;

      if (!existingAttr) {
        const created = await AttributeService.create({ name: trimmed });
        setAttributes((prev) => [...prev, created]);
        attrToUse = created;
      }

      if (formData.type && attrToUse) {
        await TypeAttributeService.addAttributeToType(formData.type, attrToUse.id);
        const updated = await TypeAttributeService.getAttributesByType(formData.type);
        setTypeAttributes(updated || []);
        setSuccessMsg(`Đã thêm thông số "${trimmed}" vào loại thiết bị.`);
      } else {
        setSuccessMsg(`Đã thêm thông số "${trimmed}" (chưa gắn loại).`);
      }

      setNewAttr("");
      setShowAddAttr(false);
    } catch (err) {
      console.error("❌ Lỗi khi thêm attribute:", err);
      setErrorMsg(err?.message || "Không thể thêm thông số mới.");
    } finally {
      setLoadingAdd(false);
    }
  };

  // ===================== VALIDATION TOÀN CỤC =====================
const validateAll = () => {
  const newErrors = {};
  if (!formData.name?.trim()) newErrors.name = "Vui lòng nhập tên dòng thiết bị";
  if (!formData.group) newErrors.group = "Vui lòng chọn nhóm thiết bị";
  if (!formData.type) newErrors.type = "Vui lòng chọn loại thiết bị";

  setErrors(newErrors);

  if (Object.keys(newErrors).length > 0) {
    toast.error("⚠️ Vui lòng nhập đầy đủ thông tin!");
    return false;
  }
  return true;
};


  // ✅ Cho phép gọi validateAll từ cha (EquipmentSectionPage)
  useImperativeHandle(ref, () => ({
    validateAll: () => {
      console.log("✅ validateAll() được gọi!");
      return validateAll();
    },
  }));

  // ===================== SUBMIT =====================
  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");

    if (!validateAll()) return;

    setLoadingSubmit(true);
    try {
      const attrArray = Object.entries(selectedAttrs)
        .map(([attrName, value]) => {
          const attrObj = attributes.find((a) => a.name === attrName);
          return attrObj ? { attribute_id: attrObj.id, value } : null;
        })
        .filter(Boolean);

      const payload = {
        name: formData.name,
        category_type_id: formData.type,
        description: formData.description,
        image: formData.image instanceof File ? formData.image : null,
        attributes: attrArray,
      };

      const res = await EquipmentService.create(payload);
      toast.success(`✅ Thiết bị "${res.name}" đã được thêm.`);
      mutate(`${API}equipment`);
      onSuccessAdd?.(res);

      setFormData({
        group: "",
        type: "",
        name: "",
        description: "",
        image: null,
        preview: "",
      });
      setSelectedAttrs({});
    } catch (err) {
      console.error("❌ Lỗi khi tạo thiết bị:", err);
      toast.error(err?.message || "Có lỗi xảy ra khi tạo thiết bị.");
    } finally {
      setLoadingSubmit(false);
    }
  };

  // ===================== UI =====================
  return (
    <div className="w-full overflow-hidden flex flex-col">
      <div className="flex flex-col h-full">
        <div className="flex-1 px-4 pt-4 pb-2 max-h-[calc(100vh-130px)]">
          <form id="equipment-add-form" onSubmit={handleSubmit} className="space-y-5">
            <AddCard1
              formData={formData}
              setFormData={setFormData}
              handleFileChange={handleFileChange}
              groups={groups}
              types={types}
              setOpenQuickAddGroup={setOpenQuickAddGroup}
              setOpenQuickAddType={setOpenQuickAddType}
errors={errors}
            />

            <AddCard3
              formData={formData}
              attributes={attributes}
              setAttributes={setAttributes}
              typeAttributes={typeAttributes}
              setTypeAttributes={setTypeAttributes}
              selectedAttrs={selectedAttrs}
              setSelectedAttrs={setSelectedAttrs}
              searchAttr={searchAttr}
              setSearchAttr={setSearchAttr}
              attrTab={attrTab}
              setAttrTab={setAttrTab}
              showAddAttr={showAddAttr}
              setShowAddAttr={setShowAddAttr}
              newAttr={newAttr}
              setNewAttr={setNewAttr}
              addNewAttribute={addNewAttribute}
              loadingAdd={loadingAdd}
              setLoadingAdd={setLoadingAdd}
              selectedNewAttrs={selectedNewAttrs}
              setSelectedNewAttrs={setSelectedNewAttrs}
              clearAllChecked={clearAllChecked}
              clearAllInputs={clearAllInputs}
              spinClearChecked={spinClearChecked}
              spinClearInputs={spinClearInputs}
              errorMsg={errorMsg}
              successMsg={successMsg}
            />
          </form>
        </div>
      </div>

      {/* ==== Quick Add Modals ==== */}
      <EquipmentGroupQuickAdd
        open={openQuickAddGroup}
        onClose={() => setOpenQuickAddGroup(false)}
        onSuccess={(newGroup) => {
          setGroups((prev) => [...prev, newGroup]);
          setFormData((prev) => ({ ...prev, group: newGroup.id, type: "" }));
          toast.success(`🎉 Đã thêm nhóm "${newGroup.name}"!`);
        }}
      />

      <EquipmentTypeQuickAdd
        open={openQuickAddType}
        onClose={() => setOpenQuickAddType(false)}
        onSuccess={(newType) => {
          setTypes((prev) => [...prev, newType]);
          setFormData((prev) => ({ ...prev, type: newType.id }));
          toast.success(`🎉 Đã thêm loại "${newType.name}"!`);
        }}
      />
    </div>
  );
}

export default forwardRef(EquipmentAddCardPageInner);
