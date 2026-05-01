"use client";

import  { forwardRef } from "react";


const Input = forwardRef(({ icon: Icon, className = "", ...props }, ref) => {
  return (
    <div className="relative mb-6">
      <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
      
        {Icon && <Icon className="w-5 h-5 text-green-500" />}
      </div>
      <input
        {...props}
        ref={ref}
        className={`w-full pl-10 pr-3 py-2 bg-gray-800 bg-opacity-50 rounded-lg border border-gray-700 focus:border-green-500 focus:bg-opacity-75 text-white placeholder-gray-400 transition duration-200 ${className}`}
      />
    </div>
  );
});

Input.displayName = "Input";

export default Input;