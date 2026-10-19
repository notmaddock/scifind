import { env } from '#/env'

export const apiUrl = new URL(env.VITE_API_URL, window.location.origin)
  .href.replace(/\/$/, '')
