// import { Outlet } from "react-router-dom";
// import Header from "@/components/layouts/header/Header";
// import Sidebar from "./Sidebar";

// export default function DashboardLayout() {
//   return (
//     <div className="flex min-h-screen bg-bg-light dark:bg-bg-dark font-sans transition-colors relative">
//       <Sidebar />
//       <div className="flex-1 flex flex-col relative">
//         <Header />
//         <main className="flex-1 p-6 overflow-y-auto">
//           <Outlet />
//         </main>
//       </div>
//     </div>
//   );
// }
import { Outlet } from "react-router-dom";
import Header from "@/components/layouts/header/Header";
import Sidebar from "./Sidebar";

export default function DashboardLayout() {
  return (
    <div className="flex min-h-screen bg-bg-light dark:bg-bg-dark font-sans transition-colors">
      {/* ✅ Sidebar cố định, z-50 để nằm trên header */}
      <div className="fixed top-0 left-0 h-screen overflow-y-auto hide-scrollbar z-50 min-w-[300px]">
        <Sidebar />
      </div>

      {/* ✅ Nội dung chính (đẩy sang phải đúng width sidebar) */}
      <div className="flex-1 flex flex-col min-h-screen ml-[250px] transition-all duration-300">
        <Header />
        <main className="flex-1 p-6 overflow-y-auto pt-20">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
