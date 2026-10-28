import { request, type PageResult } from './client'

export interface Material {
  id: number
  code: string
  name: string
  spec: string | null
  unit: string
  status: number
  createdAt: string
  updatedAt: string
}

export interface MaterialInput {
  code: string
  name: string
  spec?: string
  unit: string
  status?: number
}

export interface MaterialQuery {
  current: number
  size: number
  keyword?: string
}

export function listMaterials(query: MaterialQuery) {
  const params = new URLSearchParams({
    current: String(query.current),
    size: String(query.size),
  })
  if (query.keyword) {
    params.set('keyword', query.keyword)
  }
  return request<PageResult<Material>>(`/api/materials?${params.toString()}`)
}

export function createMaterial(input: MaterialInput) {
  return request<Material>('/api/materials', {
    method: 'POST',
    body: JSON.stringify(input),
  })
}

export function updateMaterial(id: number, input: MaterialInput) {
  return request<Material>(`/api/materials/${id}`, {
    method: 'PUT',
    body: JSON.stringify(input),
  })
}

export function deleteMaterial(id: number) {
  return request<void>(`/api/materials/${id}`, { method: 'DELETE' })
}
