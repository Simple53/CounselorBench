import React from "react";
import { partyStagesList, getPoliticalStep } from "./partyProgress.mjs";

export { partyStagesList, getPoliticalStep };

export function StepperProgress({ political }) {
  const currentStep = getPoliticalStep(political);
  const isFull = currentStep === 5;
  const isZero = currentStep === 0;

  return (
    <div className="stepper-progress" style={{ display: "flex", flexDirection: "column", gap: 6, width: "100%", maxWidth: 380 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ fontSize: 13, fontWeight: 600, color: isFull ? "#059669" : "#2563eb" }}>
          当前阶段：{political || "群众"}
        </span>
        <span style={{ fontSize: 12, opacity: 0.8 }}>
          {isFull ? "已完成入党" : isZero ? "未启动发展" : `距离转正还差 ${5 - currentStep} 步`}
        </span>
      </div>
      <div style={{ display: "flex", alignItems: "center", position: "relative" }}>
        {partyStagesList.map((stage, idx) => {
          const stepNum = idx + 1;
          const isDone = currentStep >= stepNum;
          const isCurrent = currentStep === stepNum;
          return (
            <React.Fragment key={stage.name}>
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  zIndex: 2,
                  minWidth: 44,
                }}
              >
                <div
                  style={{
                    width: 18,
                    height: 18,
                    borderRadius: "50%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 10,
                    fontWeight: "bold",
                    color: isDone ? "#ffffff" : "#64748b",
                    background: isDone ? "#2563eb" : "#e2e8f0",
                    border: isCurrent ? "2px solid #3b82f6" : "none",
                    boxShadow: isCurrent ? "0 0 0 3px rgba(59,130,246,0.25)" : "none",
                  }}
                  title={`${stage.name}（${stage.desc}）`}
                >
                  {isDone ? "✓" : stepNum}
                </div>
                <span
                  style={{
                    fontSize: 11,
                    marginTop: 3,
                    color: isDone ? "#1e293b" : "#94a3b8",
                    fontWeight: isCurrent ? "bold" : "normal",
                    whiteSpace: "nowrap",
                  }}
                >
                  {stage.name}
                </span>
              </div>
              {idx < partyStagesList.length - 1 && (
                <div
                  style={{
                    flex: 1,
                    height: 3,
                    background: currentStep > stepNum ? "#2563eb" : "#e2e8f0",
                    marginBottom: 16,
                  }}
                />
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
}
