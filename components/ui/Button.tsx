"use client";

import React from "react";
import { cn } from "@/lib/utils";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?:
    | "default"
    | "primary"
    | "secondary"
    | "danger"
    | "ghost"
    | "mcd"
    | "mcd-yellow";
  size?: "sm" | "md" | "lg" | "xl";
  fullWidth?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = "default",
      size = "md",
      fullWidth = false,
      ...props
    },
    ref
  ) => {
    return (
      <button
        className={cn(
          // Base styles
          "inline-flex items-center justify-center rounded-lg font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 shadow-sm hover:shadow-md",

          // Variants - Healthcare Professional Theme
          {
            "bg-gray-200 text-gray-800 hover:bg-gray-300":
              variant === "default",
            // Healthcare Primary Blue
            "bg-[#0066cc] text-white hover:bg-[#004a99] focus-visible:ring-[#0066cc] shadow-[0_4px_6px_rgba(0,102,204,0.15)]":
              variant === "primary",
            // Healthcare Light Blue (untuk secondary actions)
            "bg-[#00b4d8] text-white hover:bg-[#0096c7] focus-visible:ring-[#00b4d8] font-bold shadow-[0_4px_6px_rgba(0,180,216,0.25)]":
              variant === "mcd-yellow",
            // Healthcare Gradient Blue
            "bg-gradient-to-r from-[#0066cc] to-[#004a99] text-white hover:from-[#004a99] hover:to-[#003366] focus-visible:ring-[#0066cc] shadow-[0_4px_6px_rgba(0,102,204,0.2)]":
              variant === "mcd",
            "bg-blue-100 text-blue-700 hover:bg-blue-200 focus-visible:ring-blue-500 border border-blue-200":
              variant === "secondary",
            "bg-red-600 text-white hover:bg-red-700 focus-visible:ring-red-500":
              variant === "danger",
            "hover:bg-blue-50 text-blue-600 focus-visible:ring-blue-500":
              variant === "ghost",
          },

          // Sizes
          {
            "h-9 px-3 text-sm": size === "sm",
            "h-12 px-4 text-base": size === "md",
            "h-14 px-6 text-lg": size === "lg",
            "h-16 px-8 text-xl": size === "xl",
          },

          // Full width
          {
            "w-full": fullWidth,
          },

          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);

Button.displayName = "Button";

export { Button };
