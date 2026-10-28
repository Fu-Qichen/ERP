export interface PageResult<T> {
  records: T[]
  total: number
  current: number
  size: number
  pages: number
}

export class ApiError extends Error {
  status: number

  constructor(status: number, message: string) {
    super(message)
    this.status = status
  }
}

export async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(path, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...init?.headers,
    },
  })

  if (response.status === 204) {
    return undefined as T
  }

  const payload = await response.json().catch(() => null)

  if (!response.ok) {
    const message =
      payload?.message ??
      payload?.error ??
      `请求失败（HTTP ${response.status}）`
    throw new ApiError(response.status, message)
  }

  return payload as T
}
