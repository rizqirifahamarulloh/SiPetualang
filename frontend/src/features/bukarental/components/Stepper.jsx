import { Check } from 'lucide-react'

const steps = [
  { label: 'S&K', key: 'sk' },
  { label: 'Data Diri', key: 'data-diri' },
  { label: 'Unggah Foto KTP', key: 'unggah-ktp' },
]

export default function Stepper({ currentStep }) {
  return (
    <div className="br-stepper">
      {steps.map((step, index) => {
        const stepNum = index + 1
        const isCompleted = stepNum < currentStep
        const isActive = stepNum === currentStep
        const isPending = stepNum > currentStep

        return (
          <div key={step.key} style={{ display: 'flex', alignItems: 'center', flex: index < steps.length - 1 ? 1 : 'none' }}>
            <div className="br-stepper-item">
              <div
                className={`br-stepper-circle ${
                  isCompleted ? 'completed' : isActive ? 'active' : 'pending'
                }`}
              >
                {isCompleted ? (
                  <Check size={18} strokeWidth={3} />
                ) : (
                  stepNum
                )}
              </div>
              <span className={`br-stepper-label ${isActive || isCompleted ? 'active' : ''}`}>
                {step.label}
              </span>
            </div>

            {index < steps.length - 1 && (
              <div
                className={`br-stepper-line ${isCompleted ? 'completed' : ''}`}
              />
            )}
          </div>
        )
      })}
    </div>
  )
}
