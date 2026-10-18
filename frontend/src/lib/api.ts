import { env } from '#/env'

export const apiUrl = env.VITE_API_URL.replace(/\/$/, '')
