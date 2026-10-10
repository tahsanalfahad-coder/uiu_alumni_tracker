import React from 'react';
import { Check } from 'lucide-react';
import './Stepper.css';

export default function Stepper({ steps = [], currentStep = 1 }) {
  return (
    <div className="stepper-container">
      {steps.map((step, idx) => {
        const stepNum = idx + 1;
        const isCompleted = currentStep > stepNum;
        const isActive = currentStep === stepNum;

        return (
          <React.Fragment key={idx}>
            <div className={`stepper-item ${isActive ? 'stepper-active' : ''} ${isCompleted ? 'stepper-completed' : ''}`}>
              <div className="stepper-circle">
                {isCompleted ? <Check size={16} /> : stepNum}
              </div>
              <div className="stepper-label-wrap">
                <span className="stepper-step-num">Step {stepNum}</span>
                <span className="stepper-title">{step.title}</span>
              </div>
            </div>

            {idx < steps.length - 1 && (
              <div className={`stepper-line ${isCompleted ? 'line-active' : ''}`} />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}
