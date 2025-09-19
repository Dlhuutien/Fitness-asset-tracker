import { useState } from "react";
import reactLogo from "./assets/react.svg";
import viteLogo from "/vite.svg";
import "./App.css";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

function App() {
  return (
    <>
    <div className="p-8 flex flex-col gap-4 max-w-md mx-auto">
      <Input
        placeholder="Nhập tên thiết bị"
        value={name}
        onChange={(e) => setName(e.target.value)}
      />
      <Button onClick={() => alert(`Thiết bị: ${name}`)}>Submit</Button>
    </div>
    </>
  );
}

export default App;
