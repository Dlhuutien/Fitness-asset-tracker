import { useMemo } from "react";
import AuthService from "@/services/AuthService";

/**
 * Hook dùng để lấy thông tin phân quyền người dùng hiện tại
 * Dựa trên dữ liệu lưu trong localStorage (fitx_auth)
 *
 * Quyền hiện tại hỗ trợ:
 * - super-admin: toàn quyền hệ thống
 * - admin: toàn quyền trong chi nhánh
 * - operator: quyền vận hành (nhập hàng, chuyển kho)
 * - technician: quyền kỹ thuật (bảo trì, kiểm tra)
 */
export default function useAuthRole() {
  const auth = AuthService.getAuth();
  const user = auth?.user || {};
  const groups = user.groups || [];
  const attrs = user.userAttributes || {};

  const branchId = attrs["custom:branch_id"] || null;

  // Cờ phân quyền rõ ràng
  const isSuperAdmin = groups.includes("super-admin");
  const isAdmin = groups.includes("admin");
  const isOperator = groups.includes("operator");
  const isTechnician = groups.includes("technician");

  // Tiện ích kiểm tra nhanh
  const hasRole = (role) => groups.includes(role);
  const hasAnyRole = (roles = []) => roles.some((r) => groups.includes(r));

  // Tự động xác định vai trò cao nhất (ưu tiên theo thứ tự)
  const roleLevel = useMemo(() => {
    if (isSuperAdmin) return "super-admin";
    if (isAdmin) return "admin";
    if (isOperator) return "operator";
    if (isTechnician) return "technician";
    return "guest";
  }, [isSuperAdmin, isAdmin, isOperator, isTechnician]);

  // Trả về object dùng chung cho toàn app
  return useMemo(
    () => ({
      user,
      username: user.username,
      email: attrs.email,
      groups,
      branchId,
      roleLevel,
      isSuperAdmin,
      isAdmin,
      isOperator,
      isTechnician,
      hasRole,
      hasAnyRole,
    }),
    [
      user,
      attrs.email,
      groups,
      branchId,
      roleLevel,
      isSuperAdmin,
      isAdmin,
      isOperator,
      isTechnician,
    ]
  );
}
