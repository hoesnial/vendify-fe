"use client";

import { useState } from "react";

interface OnScreenKeyboardProps {
  onKeyPress: (key: string) => void;
  onBackspace: () => void;
  onClose: () => void;
  currentValue: string;
}

export default function OnScreenKeyboard({
  onKeyPress,
  onBackspace,
  onClose,
  currentValue,
}: OnScreenKeyboardProps) {
  const [isShiftActive, setIsShiftActive] = useState(false);
  const [currentLayout, setCurrentLayout] = useState<"letters" | "numbers">(
    "letters"
  );

  const letterRows = [
    ["q", "w", "e", "r", "t", "y", "u", "i", "o", "p"],
    ["a", "s", "d", "f", "g", "h", "j", "k", "l"],
    ["z", "x", "c", "v", "b", "n", "m"],
  ];

  const numberRows = [
    ["1", "2", "3", "4", "5", "6", "7", "8", "9", "0"],
    ["!", "@", "#", "$", "%", "^", "&", "*", "(", ")"],
    ["-", "_", "+", "=", "/", "\\", "|", "[", "]", "{", "}"],
  ];

  const handleKeyPress = (key: string) => {
    const finalKey = isShiftActive ? key.toUpperCase() : key;
    onKeyPress(finalKey);
    if (isShiftActive) {
      setIsShiftActive(false);
    }
  };

  const toggleLayout = () => {
    setCurrentLayout((prev) => (prev === "letters" ? "numbers" : "letters"));
  };

  const rows = currentLayout === "letters" ? letterRows : numberRows;

  return (
    <div className="fixed inset-x-0 bottom-0 bg-gray-800 text-white p-4 shadow-2xl z-50 rounded-t-3xl">
      {/* Display */}
      <div className="mb-4 bg-gray-700 rounded-lg p-3 flex items-center justify-between">
        <div className="flex-1 text-lg overflow-x-auto whitespace-nowrap">
          {currentValue || "Ketik pesan Anda..."}
        </div>
        <button
          onClick={onClose}
          className="ml-2 text-gray-400 hover:text-white transition-colors"
        >
          <svg
            className="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </button>
      </div>

      {/* Keyboard */}
      <div className="space-y-2">
        {rows.map((row, rowIndex) => (
          <div key={rowIndex} className="flex justify-center gap-1">
            {rowIndex === 2 && currentLayout === "letters" && (
              <button
                onClick={() => setIsShiftActive(!isShiftActive)}
                className={`px-4 py-3 rounded-lg font-semibold transition-all ${
                  isShiftActive
                    ? "bg-blue-600 hover:bg-blue-700"
                    : "bg-gray-700 hover:bg-gray-600"
                }`}
              >
                ⇧
              </button>
            )}
            {row.map((key) => (
              <button
                key={key}
                onClick={() => handleKeyPress(key)}
                className="min-w-[40px] px-3 py-3 bg-gray-700 hover:bg-gray-600 rounded-lg font-semibold transition-all active:scale-95"
              >
                {isShiftActive && currentLayout === "letters"
                  ? key.toUpperCase()
                  : key}
              </button>
            ))}
            {rowIndex === 2 && (
              <button
                onClick={onBackspace}
                className="px-4 py-3 bg-red-600 hover:bg-red-700 rounded-lg font-semibold transition-all active:scale-95"
              >
                ⌫
              </button>
            )}
          </div>
        ))}

        {/* Bottom Row */}
        <div className="flex justify-center gap-1">
          <button
            onClick={toggleLayout}
            className="px-4 py-3 bg-gray-700 hover:bg-gray-600 rounded-lg font-semibold transition-all"
          >
            {currentLayout === "letters" ? "123" : "ABC"}
          </button>
          <button
            onClick={() => handleKeyPress("?")}
            className="px-4 py-3 bg-gray-700 hover:bg-gray-600 rounded-lg font-semibold transition-all"
          >
            ?
          </button>
          <button
            onClick={() => handleKeyPress(" ")}
            className="flex-1 px-4 py-3 bg-gray-700 hover:bg-gray-600 rounded-lg font-semibold transition-all"
          >
            Space
          </button>
          <button
            onClick={() => handleKeyPress(",")}
            className="px-4 py-3 bg-gray-700 hover:bg-gray-600 rounded-lg font-semibold transition-all"
          >
            ,
          </button>
          <button
            onClick={() => handleKeyPress(".")}
            className="px-4 py-3 bg-gray-700 hover:bg-gray-600 rounded-lg font-semibold transition-all"
          >
            .
          </button>
        </div>
      </div>
    </div>
  );
}
