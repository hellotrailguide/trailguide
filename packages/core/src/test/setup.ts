import { afterEach } from 'vitest'
import { resetSession } from '../analytics'

afterEach(() => {
  resetSession()
  document.body.innerHTML = ''
  localStorage.clear()
})
