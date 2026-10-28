import { request, type PageResult } from './client'

export interface Material {
  id: number
  code: string
  name: string
  spec: string | null
  classId: number
  classCode: string | null
  className: string | null
  uomId: number
  unitCode: string | null
  unitName: string | null
  batchMode: number
  status: number
  createdAt: string
  updatedAt: string
}

export interface MaterialInput {
  code: string
  name: string
  spec?: string
  classId: number
  uomId: number
  status?: number
  batchMode?: number
}

export interface MaterialClass {
  id: number
  classCode: string
  className: string
  parentId: number | null
  status: number
}

export interface MaterialClassInput {
  classCode: string
  className: string
  parentId?: number | null
  status?: number
}

export interface UnitOfMeasure {
  id: number
  unitCode: string
  unitName: string
  decimalDigits: number
  status: number
}

export interface UnitOfMeasureInput {
  unitCode: string
  unitName: string
  decimalDigits: number
  status?: number
}

export interface MaterialQuery {
  current: number
  size: number
  keyword?: string
  classId?: number
}

export function listMaterials(query: MaterialQuery) {
  const params = new URLSearchParams({
    current: String(query.current),
    size: String(query.size),
  })
  if (query.keyword) {
    params.set('keyword', query.keyword)
  }
  if (query.classId !== undefined) {
    params.set('classId', String(query.classId))
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

export function listMaterialClasses() {
  return request<MaterialClass[]>('/api/material-classes')
}

export function createMaterialClass(input: MaterialClassInput) {
  return request<MaterialClass>('/api/material-classes', {
    method: 'POST',
    body: JSON.stringify(input),
  })
}

export function updateMaterialClass(id: number, input: MaterialClassInput) {
  return request<MaterialClass>(`/api/material-classes/${id}`, {
    method: 'PUT',
    body: JSON.stringify(input),
  })
}

export function deleteMaterialClass(id: number) {
  return request<void>(`/api/material-classes/${id}`, { method: 'DELETE' })
}

export function listUoms() {
  return request<UnitOfMeasure[]>('/api/uoms')
}

export function createUom(input: UnitOfMeasureInput) {
  return request<UnitOfMeasure>('/api/uoms', {
    method: 'POST',
    body: JSON.stringify(input),
  })
}

export function updateUom(id: number, input: UnitOfMeasureInput) {
  return request<UnitOfMeasure>(`/api/uoms/${id}`, {
    method: 'PUT',
    body: JSON.stringify(input),
  })
}

export function deleteUom(id: number) {
  return request<void>(`/api/uoms/${id}`, { method: 'DELETE' })
}
