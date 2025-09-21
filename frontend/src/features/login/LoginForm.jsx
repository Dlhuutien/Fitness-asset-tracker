import React from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardFooter,
} from "@/components/ui/card";

export default function LoginForm() {
  return (
    <Card
      className="p-10 rounded-3xl bg-gradient-to-br from-gray-900/80 via-gray-800/60 to-gray-900/80 
                 border border-white/10 backdrop-blur-2xl shadow-[0_0_40px_rgba(0,255,180,0.15)] 
                 transition-transform hover:scale-[1.01]"
    >
      <CardHeader>
        <CardTitle
          className="text-center text-4xl font-extrabold 
                     bg-gradient-to-r from-green-400 via-emerald-300 to-teal-400 
                     bg-clip-text text-transparent drop-shadow-md"
        >
          Welcome to <span className="text-green-400">FITX</span>
        </CardTitle>
      </CardHeader>

      {/* Form Inputs */}
      <CardContent className="space-y-6">
        {/* Username */}
        <div
          className="group flex items-center gap-3 h-14 px-4 rounded-2xl 
                     bg-white/10 border-2 border-transparent 
                     focus-within:border-green-400 focus-within:ring-2 
                     focus-within:ring-green-300/50 transition-all"
        >
          <span className="text-gray-400 group-focus-within:text-green-400">
            📧
          </span>
          <Input
            placeholder="Email hoặc Username"
            className="flex-1 bg-transparent border-none focus:ring-0 focus:outline-none"
          />
        </div>

        {/* Password */}
        <div
          className="group flex items-center gap-3 h-14 px-4 rounded-2xl 
                     bg-white/10 border-2 border-transparent 
                     focus-within:border-green-400 focus-within:ring-2 
                     focus-within:ring-green-300/50 transition-all"
        >
          <span className="text-gray-400 group-focus-within:text-green-400">
            🔒
          </span>
          <Input
            type="password"
            placeholder="Password"
            className="flex-1 bg-transparent border-none focus:ring-0 focus:outline-none"
          />
        </div>

        {/* Login Button */}
        <Button
          className="w-full h-14 rounded-full text-lg font-semibold tracking-wide
                     bg-gradient-to-r from-green-500 via-emerald-400 to-cyan-400 
                     bg-[length:200%_200%] animate-gradient-x shadow-lg 
                     hover:shadow-green-500/30 transition-all"
        >
          Log in
        </Button>
      </CardContent>

      {/* Footer */}
      <CardFooter className="flex justify-between text-sm text-gray-400">
        <label className="flex items-center gap-2">
          <input type="checkbox" className="accent-green-500" /> Remember me
        </label>
        <a href="#" className="hover:text-green-300 transition-colors">
          Forget password?
        </a>
      </CardFooter>
    </Card>
  );
}
