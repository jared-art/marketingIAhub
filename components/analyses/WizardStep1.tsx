'use client'

import { useState } from 'react'
import type { WizardStep1Data } from '@/types'

interface WizardStep1Props {
  data: WizardStep1Data
  onChange: (data: WizardStep1Data) => void
  onNext: () => void
}

const presets = [
  { label: '7 días', days: 7 },
  { label: '30 días', days: 30 },
  { label: '90 días', days: 90 },
]

function getDateString(daysAgo: number): string {
  const d = new Date()
  d.setDate(d.getDate() - daysAgo)
  return d.toISOString().split('T')[0]
}

function getTodayString(): string {
  return new Date().toISOString().split('T')[0]
}

export function WizardStep1({ data, onChange, onNext }: WizardStep1Props) {
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [selectedPreset, setSelectedPreset] = useState<number | null>(null)

  const handlePreset = (days: number) => {
    setSelectedPreset(days)
    onChange({
      ...data,
      dateRangeStart: getDateString(days),
      dateRangeEnd: getTodayString(),
    })
  }

  const validate = () => {
    const newErrors: Record<string, string> = {}
    if (!data.name.trim()) newErrors.name = 'El nombre es obligatorio'
    if (data.name.trim().length < 3) newErrors.name = 'El nombre debe tener al menos 3 caracteres'
    if (!data.dateRangeStart) newErrors.dateRangeStart = 'La fecha de inicio es obligatoria'
    if (!data.dateRangeEnd) newErrors.dateRangeEnd = 'La fecha de fin es obligatoria'
    if (data.dateRangeStart && data.dateRangeEnd && data.dateRangeStart >= data.dateRangeEnd) {
      newErrors.dateRangeEnd = 'La fecha de fin debe ser posterior a la de inicio'
    }
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleNext = () => {
    if (validate()) onNext()
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-white mb-1">Configura tu análisis</h2>
        <p className="text-gray-400 text-sm">
          Dale un nombre al análisis y selecciona el rango de fechas que quieres analizar.
        </p>
      </div>

      {/* Analysis name */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Nombre del análisis <span className="text-red-400">*</span>
        </label>
        <input
          type="text"
          value={data.name}
          onChange={(e) => onChange({ ...data, name: e.target.value })}
          placeholder="Ej: Análisis Q1 2024 — Campaña Verano"
          className={`w-full bg-[#0A0F1E] border rounded-lg px-4 py-3 text-white placeholder-gray-600 focus:outline-none transition-all duration-200 ${
            errors.name
              ? 'border-red-500 focus:border-red-400'
              : 'border-[#1F2937] focus:border-indigo-500'
          }`}
        />
        {errors.name && (
          <p className="text-red-400 text-xs mt-1">{errors.name}</p>
        )}
      </div>

      {/* Description */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Descripción <span className="text-gray-500">(opcional)</span>
        </label>
        <textarea
          value={data.description}
          onChange={(e) => onChange({ ...data, description: e.target.value })}
          placeholder="Notas adicionales sobre este análisis..."
          rows={3}
          className="w-full bg-[#0A0F1E] border border-[#1F2937] rounded-lg px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-indigo-500 transition-all duration-200 resize-none"
        />
      </div>

      {/* Date range */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-3">
          Rango de fechas <span className="text-red-400">*</span>
        </label>

        {/* Quick presets */}
        <div className="flex gap-2 mb-4">
          {presets.map((preset) => (
            <button
              key={preset.days}
              type="button"
              onClick={() => handlePreset(preset.days)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                selectedPreset === preset.days
                  ? 'bg-indigo-600 text-white border border-indigo-500'
                  : 'bg-[#0A0F1E] text-gray-400 border border-[#1F2937] hover:border-indigo-500/50 hover:text-white'
              }`}
            >
              Últimos {preset.label}
            </button>
          ))}
          <button
            type="button"
            onClick={() => setSelectedPreset(null)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
              selectedPreset === null && (data.dateRangeStart || data.dateRangeEnd)
                ? 'bg-indigo-600 text-white border border-indigo-500'
                : 'bg-[#0A0F1E] text-gray-400 border border-[#1F2937] hover:border-indigo-500/50 hover:text-white'
            }`}
          >
            Personalizado
          </button>
        </div>

        {/* Custom date inputs */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs text-gray-500 mb-1.5">Fecha inicio</label>
            <input
              type="date"
              value={data.dateRangeStart}
              onChange={(e) => {
                setSelectedPreset(null)
                onChange({ ...data, dateRangeStart: e.target.value })
              }}
              className={`w-full bg-[#0A0F1E] border rounded-lg px-4 py-2.5 text-white focus:outline-none transition-all duration-200 text-sm ${
                errors.dateRangeStart
                  ? 'border-red-500'
                  : 'border-[#1F2937] focus:border-indigo-500'
              }`}
            />
            {errors.dateRangeStart && (
              <p className="text-red-400 text-xs mt-1">{errors.dateRangeStart}</p>
            )}
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1.5">Fecha fin</label>
            <input
              type="date"
              value={data.dateRangeEnd}
              onChange={(e) => {
                setSelectedPreset(null)
                onChange({ ...data, dateRangeEnd: e.target.value })
              }}
              className={`w-full bg-[#0A0F1E] border rounded-lg px-4 py-2.5 text-white focus:outline-none transition-all duration-200 text-sm ${
                errors.dateRangeEnd
                  ? 'border-red-500'
                  : 'border-[#1F2937] focus:border-indigo-500'
              }`}
            />
            {errors.dateRangeEnd && (
              <p className="text-red-400 text-xs mt-1">{errors.dateRangeEnd}</p>
            )}
          </div>
        </div>
      </div>

      {/* Next button */}
      <div className="flex justify-end pt-2">
        <button
          onClick={handleNext}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white font-medium px-6 py-3 rounded-lg transition-all duration-200"
        >
          Siguiente
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>
    </div>
  )
}
