"use client";

import React, { useState, useEffect, useCallback } from "react";
import { CheckCircle, Settings, Package, AlertCircle } from "lucide-react";
import { useVendingStore } from "@/lib/store";
import { vendingAPI } from "@/lib/api";

interface DispensingProps {
  productName: string;
  onComplete: (success: boolean) => void;
}

const Dispensing: React.FC<DispensingProps> = ({ productName, onComplete }) => {
  const [stage, setStage] = useState<
    "waiting_payment" | "dispensing" | "checking" | "complete" | "failed"
  >("dispensing");
  const [progress, setProgress] = useState(0);
  const { currentOrder } = useVendingStore();

  const startDispensingProcess = useCallback(() => {
    // Simulate dispensing process
    const stages = [
      { stage: "dispensing" as const, duration: 2000, progress: 0 },
      { stage: "checking" as const, duration: 1500, progress: 70 },
      { stage: "complete" as const, duration: 1000, progress: 100 },
    ];

    let currentStageIndex = 0;
    let stageProgress = 0;

    const interval = setInterval(() => {
      const currentStage = stages[currentStageIndex];
      stageProgress += 5;

      // Update progress based on current stage
      const baseProgress =
        currentStageIndex > 0
          ? (stages
              .slice(0, currentStageIndex)
              .reduce((sum, s) => sum + s.progress, 0) /
              stages.length) *
            100
          : 0;

      const stageProgressPercent =
        (stageProgress / 100) * ((currentStage.progress / stages.length) * 100);
      setProgress(Math.min(100, baseProgress + stageProgressPercent));

      if (stageProgress >= 100) {
        setStage(currentStage.stage);
        stageProgress = 0;
        currentStageIndex++;

        if (currentStageIndex >= stages.length) {
          clearInterval(interval);
          setTimeout(() => {
            // Simulate 90% success rate
            const success = Math.random() > 0.1;
            if (success) {
              onComplete(true);
            } else {
              setStage("failed");
              setTimeout(() => onComplete(false), 2000);
            }
          }, 1000);
        }
      }
    }, 50);

    return () => clearInterval(interval);
  }, [onComplete]);

  useEffect(() => {
    // Check if order is paid or still pending
    const checkOrderStatus = async () => {
      if (!currentOrder) return;

      try {
        const order = await vendingAPI.getOrderStatus(currentOrder.order_id);

        if (order.status === "PENDING") {
          // Payment not confirmed yet, show waiting state
          setStage("waiting_payment");

          // Poll every 5 seconds for status update
          const pollInterval = setInterval(async () => {
            try {
              const updatedOrder = await vendingAPI.getOrderStatus(
                currentOrder.order_id
              );

              if (
                updatedOrder.status === "PAID" ||
                updatedOrder.status === "DISPENSING" ||
                updatedOrder.status === "COMPLETED"
              ) {
                clearInterval(pollInterval);
                // Trigger dispense
                await vendingAPI.triggerDispense(currentOrder.order_id);
                setStage("dispensing");
                startDispensingProcess();
              }
            } catch (error) {
              console.error("Error polling order status:", error);
            }
          }, 5000);

          // Cleanup on unmount
          return () => clearInterval(pollInterval);
        } else if (order.status === "PAID" || order.status === "DISPENSING") {
          // Already paid, start dispensing
          setStage("dispensing");
          startDispensingProcess();
        } else if (order.status === "FAILED") {
          setStage("failed");
          // onComplete(false) will be triggered by the user clicking the button
        } else if (order.status === "COMPLETED") {
          // Already completed
          setStage("complete");
          setTimeout(() => onComplete(true), 2000);
        }
      } catch (error) {
        console.error("Error checking order status:", error);
        // If error checking status, default to failed after a retry or just show error
        setStage("failed");
      }
    };

    checkOrderStatus();
  }, [currentOrder, onComplete, startDispensingProcess]);

  // Calculate circular progress
  const radius = 75;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  const getStepStatus = (step: 1 | 2 | 3) => {
    if (stage === "waiting_payment") return "pending";
    if (stage === "complete" || stage === "failed") {
      return step <= 3 ? "completed" : "pending";
    }
    if (stage === "dispensing") {
      return step === 1 ? "completed" : step === 2 ? "active" : "pending";
    }
    if (stage === "checking") {
      return step <= 2 ? "completed" : step === 3 ? "active" : "pending";
    }
    return "pending";
  };

  return (
    <div className="w-full max-w-md mx-auto bg-slate-50 rounded-2xl shadow-lg p-6 md:p-8">
      {/* Header */}
      <header className="text-center mb-8">
        <h1 className="text-2xl font-bold text-slate-800">
          Dispensing Your Item
        </h1>
        <p className="text-slate-500 mt-1">{productName}</p>
      </header>

      {/* Main Content */}
      <main className="flex flex-col items-center">
        {/* Circular Progress */}
        <div className="relative w-48 h-48 mb-8">
          <svg className="w-full h-full" viewBox="0 0 160 160">
            {/* Background Circle */}
            <circle
              className="text-slate-200"
              cx="80"
              cy="80"
              fill="transparent"
              r={radius}
              stroke="currentColor"
              strokeWidth="10"
            />
            {/* Progress Circle */}
            <circle
              className="text-teal-500 transition-all duration-1000 ease-linear"
              cx="80"
              cy="80"
              fill="transparent"
              r={radius}
              stroke="currentColor"
              strokeLinecap="round"
              strokeWidth="10"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              transform="rotate(-90 80 80)"
            />
          </svg>

          {/* Center Text */}
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
            <span className={`text-4xl font-bold ${stage === 'failed' ? 'text-red-500' : 'text-teal-500'}`}>
              {stage === 'failed' ? '!' : `${Math.round(progress)}%`}
            </span>
            <span className="text-sm text-slate-500">
              {stage === "waiting_payment"
                ? "Waiting..."
                : stage === "dispensing"
                ? "Dispensing..."
                : stage === "checking"
                ? "Verifying..."
                : stage === "complete"
                ? "Complete!"
                : "Failed"}
            </span>
          </div>
        </div>

        {/* Step Indicators */}
        <div className="w-full space-y-5">
          {/* Step 1: Payment Verified */}
          <div className="flex items-center">
            <div
              className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center transition-all ${
                getStepStatus(1) === "completed"
                  ? "bg-teal-500 shadow-[0_0_15px_rgba(20,184,166,0.5)]"
                  : "bg-slate-300"
              }`}
            >
              <CheckCircle
                className={`w-4 h-4 ${
                  getStepStatus(1) === "completed"
                    ? "text-white"
                    : "text-slate-500"
                }`}
              />
            </div>
            <div className="ml-4 flex-1">
              <p
                className={`font-medium ${
                  getStepStatus(1) === "completed"
                    ? "text-slate-800"
                    : "text-slate-500"
                }`}
              >
                Payment Verified
              </p>
              <p className="text-sm text-slate-500">
                {getStepStatus(1) === "completed"
                  ? "Your payment was successful."
                  : "Waiting for payment confirmation..."}
              </p>
            </div>
          </div>

          {/* Step 2: Sending Command to Machine */}
          <div
            className={`flex items-center transition-opacity ${
              getStepStatus(2) === "pending" ? "opacity-40" : "opacity-100"
            }`}
          >
            <div
              className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center transition-all ${
                getStepStatus(2) === "completed"
                  ? "bg-teal-500 shadow-[0_0_15px_rgba(20,184,166,0.5)]"
                  : getStepStatus(2) === "active"
                  ? "bg-teal-500 shadow-[0_0_15px_rgba(20,184,166,0.5)] animate-pulse"
                  : "bg-slate-300"
              }`}
            >
              {getStepStatus(2) === "completed" ? (
                <CheckCircle className="w-4 h-4 text-white" />
              ) : (
                <Settings
                  className={`w-4 h-4 ${
                    getStepStatus(2) === "active"
                      ? "text-white animate-spin"
                      : "text-slate-500"
                  }`}
                />
              )}
            </div>
            <div className="ml-4 flex-1">
              <p
                className={`font-medium ${
                  getStepStatus(2) === "pending"
                    ? "text-slate-500"
                    : "text-slate-800"
                }`}
              >
                Sending Command to Machine
              </p>
              <p className="text-sm text-slate-500">
                {getStepStatus(2) === "completed"
                  ? "Device connected successfully."
                  : getStepStatus(2) === "active"
                  ? "Connecting to the device..."
                  : "Waiting for device connection..."}
              </p>
            </div>
          </div>

          {/* Step 3: Item Dispensed */}
          <div
            className={`flex items-center transition-opacity ${
              getStepStatus(3) === "pending" ? "opacity-40" : "opacity-100"
            }`}
          >
            <div
              className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center transition-all ${
                getStepStatus(3) === "completed"
                  ? "bg-teal-500 shadow-[0_0_15px_rgba(20,184,166,0.5)]"
                  : getStepStatus(3) === "active"
                  ? "bg-teal-500 shadow-[0_0_15px_rgba(20,184,166,0.5)] animate-pulse"
                  : "bg-slate-300"
              }`}
            >
              {getStepStatus(3) === "completed" ? (
                <CheckCircle className="w-4 h-4 text-white" />
              ) : (
                <Package
                  className={`w-4 h-4 ${
                    getStepStatus(3) === "active" ||
                    getStepStatus(3) === "completed"
                      ? "text-white"
                      : "text-slate-500"
                  }`}
                />
              )}
            </div>
            <div className="ml-4 flex-1">
              <p
                className={`font-medium ${
                  getStepStatus(3) === "pending"
                    ? "text-slate-500"
                    : "text-slate-800"
                }`}
              >
                Item Dispensed
              </p>
              <p className="text-sm text-slate-500">
                {getStepStatus(3) === "completed"
                  ? "Please collect your item!"
                  : getStepStatus(3) === "active"
                  ? "Dispensing your item..."
                  : "Waiting for device confirmation..."}
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="mt-12 text-center">
        {stage === "failed" && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center justify-center mb-2">
              <AlertCircle className="w-5 h-5 text-red-600 mr-2" />
              <p className="font-semibold text-red-600">Dispensing Failed</p>
            </div>
            <p className="text-sm text-red-600">
               Please contact support.
            </p>
          </div>
        )}
        
        {stage === "complete" && (
           <div className="mb-4">
             <p className="text-teal-600 font-medium mb-3">Dispensing Complete!</p>
             <button 
                onClick={() => onComplete(true)}
                className="w-full bg-teal-500 text-white hover:bg-teal-600 transition-all py-3 rounded-lg font-bold shadow-md"
             >
                Ambil Barang & Selesai
             </button>
           </div>
        )}

        {stage !== "complete" && (
            <button 
              onClick={() => {
                 useVendingStore.getState().resetTransaction();
              }}
              className="w-full text-slate-500 hover:text-white hover:bg-slate-500 transition-all py-3 rounded-lg bg-slate-100 font-medium"
            >
              {stage === 'failed' ? 'Kembali ke Beranda (Reset)' : 'Batalkan / Kembali'}
            </button>
        )}
      </footer>
    </div>
  );
};

export default Dispensing;
