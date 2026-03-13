'use client'

import { useState } from 'react'
import Link from 'next/link'
import { WizardStep1 } from '@/components/analyses/WizardStep1'
import { WizardStep2 } from '@/components/analyses/WizardStep2'
import { WizardStep3 } from '@/components/analyses/WizardStep3'
import type { WizardData } from '@/types'
import { cn } from '@/lib/utils'

const steps = [
  { number: 1, label: 'Configuración' },
  { number: 2, label: 'Plataformas' },
  { number: 3, label: 'Resumen' },
]

const initialData: WizardData = {
  step1: {
    name: '',
    description: '',
    dateRangeStart: '',
    dateRangeEnd: '',
  },
  step2: {},
}

export default function NewAnalysisPage() {
  const [currentStep, setCurrentStep] = useState(1)
  const [data, setData] = useState<WizardData>(initialData)

  return (
    <div className="min-h-screen bg-[#0A0F1E]">
      {/* Header */}
      <header className="border-b border-[#1F2937] bg-[#0A0F1E]/80 backdrop-blur-sm">
        <div className="max-w-3xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/dashboard" className="text-gray-400 hover:text-white transition-colors">
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
            </Link>
            <div className="flex items-center gap-2">
              <span className="text-xl font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
                AdIntel
              </span>
              <span className="text-gray-600">/</span>
              <span className="text-gray-300 text-sm">Nuevo análisis</span>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-10">
        {/* Step indicator */}
        <div className="flex items-center justify-center mb-10">
          {steps.map((step, index) => (
            <div key={step.number} className="flex items-center">
              {/* Step circle */}
              <div className="flex flex-col items-center">
                <div
                  className={cn(
                    'w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-300',
                    currentStep === step.number
                      ? 'bg-indigo-600 text-white ring-4 ring-indigo-600/20'
                      : currentStep > step.number
                      ? 'bg-emerald-600 text-white'
                      : 'bg-[#1F2937] text-gray-500'
                  )}
                >
                  {currentStep > step.number ? (
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
                      <polyline points="20,6 9,17 4,12" />
                    </svg>
                  ) : (
                    step.number
                  )}
                </div>
                <span
                  className={cn(
                    'text-xs mt-1.5 font-medium',
                    currentStep === step.number
                      ? 'text-indigo-400'
                      : currentStep > step.number
                      ? 'text-emerald-400'
                      : 'text-gray-600'
                  )}
                >
                  {step.label}
                </span>
              </div>

              {/* Connector line */}
              {index < steps.length - 1 && (
                <div
                  className={cn(
                    'h-0.5 w-24 mx-2 transition-all duration-300 mb-5',
                    currentStep > step.number ? 'bg-emerald-600' : 'bg-[#1F2937]'
                  )}
                />
              )}
            </div>
          ))}
        </div>

        {/* Wizard content */}
        <div className="bg-[#111827] border border-[#1F2937] rounded-2xl p-8">
          {currentStep === 1 && (
            <WizardStep1
              data={data.step1}
              onChange={(step1) => setData({ ...data, step1 })}
              onNext={() => setCurrentStep(2)}
            />
          )}
          {currentStep === 2 && (
            <WizardStep2
              data={data.step2}
              onChange={(step2) => setData({ ...data, step2 })}
              onNext={() => setCurrentStep(3)}
              onBack={() => setCurrentStep(1)}
            />
          )}
          {currentStep === 3 && (
            <WizardStep3
              data={data}
              onBack={() => setCurrentStep(2)}
            />
          )}
        </div>
      </main>
    </div>
  )
}
