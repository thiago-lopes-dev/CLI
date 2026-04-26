// =============================================================================
// tests/date.test.js — Testes unitários para utils/date.js
// =============================================================================

import { parseDateInput, formatDueDate, isOverdue, isDueToday } from '../src/utils/date.js'
import { format, addDays } from 'date-fns'

const today    = format(new Date(), 'yyyy-MM-dd')
const tomorrow = format(addDays(new Date(), 1), 'yyyy-MM-dd')
const yesterday = format(addDays(new Date(), -1), 'yyyy-MM-dd')

describe('parseDateInput', () => {
  test('retorna null para entrada vazia', () => {
    expect(parseDateInput('')).toBeNull()
    expect(parseDateInput(null)).toBeNull()
    expect(parseDateInput(undefined)).toBeNull()
  })

  test('interpreta "hoje" como data atual', () => {
    expect(parseDateInput('hoje')).toBe(today)
  })

  test('interpreta "amanhã" e "amanha" como amanhã', () => {
    expect(parseDateInput('amanhã')).toBe(tomorrow)
    expect(parseDateInput('amanha')).toBe(tomorrow)
  })

  test('interpreta "+N" como N dias a partir de hoje', () => {
    const in3 = format(addDays(new Date(), 3), 'yyyy-MM-dd')
    expect(parseDateInput('+3')).toBe(in3)
  })

  test('interpreta formato dd/MM/yyyy', () => {
    expect(parseDateInput('01/06/2025')).toBe('2025-06-01')
  })

  test('interpreta formato yyyy-MM-dd', () => {
    expect(parseDateInput('2025-12-31')).toBe('2025-12-31')
  })

  test('retorna null para formato inválido', () => {
    expect(parseDateInput('data-invalida')).toBeNull()
  })
})

describe('isOverdue', () => {
  test('retorna true para data no passado', () => {
    expect(isOverdue(yesterday)).toBe(true)
  })

  test('retorna false para hoje', () => {
    expect(isOverdue(today)).toBe(false)
  })

  test('retorna false para data futura', () => {
    expect(isOverdue(tomorrow)).toBe(false)
  })

  test('retorna false para null', () => {
    expect(isOverdue(null)).toBe(false)
  })
})

describe('isDueToday', () => {
  test('retorna true para hoje', () => {
    expect(isDueToday(today)).toBe(true)
  })

  test('retorna false para amanhã', () => {
    expect(isDueToday(tomorrow)).toBe(false)
  })

  test('retorna false para null', () => {
    expect(isDueToday(null)).toBe(false)
  })
})
