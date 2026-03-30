// =============================================================================
// utils/date.js — Helpers de data
// =============================================================================

import { format, parseISO, isValid, addDays, isBefore, isToday, differenceInDays } from 'date-fns'
import { ptBR } from 'date-fns/locale'

/**
 * Converte input humano para formato ISO (yyyy-MM-dd)
 * Aceita: 'hoje', 'amanhã', 'amanha', '+3', '2025-12-31', '31/12/2025'
 */
export function parseDateInput(input) {
  if (!input || input.trim() === '') return null

  const str = input.trim().toLowerCase()

  if (str === 'hoje')              return format(new Date(), 'yyyy-MM-dd')
  if (str === 'amanhã' || str === 'amanha') return format(addDays(new Date(), 1), 'yyyy-MM-dd')
  if (str === 'depois')            return format(addDays(new Date(), 2), 'yyyy-MM-dd')

  // +N dias
  const plusMatch = str.match(/^\+(\d+)$/)
  if (plusMatch) return format(addDays(new Date(), parseInt(plusMatch[1])), 'yyyy-MM-dd')

  // dd/MM/yyyy
  const brMatch = str.match(/^(\d{2})\/(\d{2})\/(\d{4})$/)
  if (brMatch) {
    const [, d, m, y] = brMatch
    const date = new Date(`${y}-${m}-${d}`)
    return isValid(date) ? format(date, 'yyyy-MM-dd') : null
  }

  // yyyy-MM-dd
  const isoMatch = str.match(/^\d{4}-\d{2}-\d{2}$/)
  if (isoMatch) {
    const date = parseISO(str)
    return isValid(date) ? str : null
  }

  return null
}

/**
 * Formata data para exibição legível
 */
export function formatDueDate(dateStr) {
  if (!dateStr) return null
  const date = parseISO(dateStr)
  if (!isValid(date)) return dateStr

  if (isToday(date)) return 'hoje'

  const diff = differenceInDays(date, new Date())
  if (diff === 1) return 'amanhã'
  if (diff === -1) return 'ontem'
  if (diff > 1 && diff <= 7) return `em ${diff} dias`
  if (diff < -1) return `há ${Math.abs(diff)} dias`

  return format(date, "dd 'de' MMM", { locale: ptBR })
}

export function isOverdue(dateStr) {
  if (!dateStr) return false
  const date = parseISO(dateStr)
  return isValid(date) && isBefore(date, new Date()) && !isToday(date)
}

export function isDueToday(dateStr) {
  if (!dateStr) return false
  const date = parseISO(dateStr)
  return isValid(date) && isToday(date)
}

export function isDueSoon(dateStr) {
  if (!dateStr) return false
  const date = parseISO(dateStr)
  if (!isValid(date)) return false
  const diff = differenceInDays(date, new Date())
  return diff > 0 && diff <= 3
}
