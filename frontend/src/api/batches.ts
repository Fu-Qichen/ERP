import { request, type PageResult } from './client'

export interface Batch {
  id: number
  materialId: number
  materialCode: string
  materialName: string
  batchNo: string
  produceDate: string | null
  expireDate: string | null
  sourceType: string | null
  sourceId: number | null
  status: number
  remark: string | null
  availableQty: string
  createdAt: string
}

export interface BatchInput {
  materialId: number
  batchNo: string
  produceDate?: string | null
  expireDate?: string | null
  remark?: string
}

export interface BatchUpdateInput {
  produceDate?: string | null
  expireDate?: string | null
  status?: number
  remark?: string
}

export function listBatches(params: {
  current: number
  size: number
  materialId?: number
  warehouseId?: number
  keyword?: string
}) {
  const query = new URLSearchParams({
    current: String(params.current),
    size: String(params.size),
  })
  if (params.materialId !== undefined) {
    query.set('materialId', String(params.materialId))
  }
  if (params.warehouseId !== undefined) {
    query.set('warehouseId', String(params.warehouseId))
  }
  if (params.keyword) {
    query.set('keyword', params.keyword)
  }
  return request<PageResult<Batch>>(`/api/batches?${query.toString()}`)
}

export function listAvailableBatches(materialId: number, warehouseId: number) {
  return request<Batch[]>(
    `/api/batches/available?materialId=${materialId}&warehouseId=${warehouseId}`,
  )
}

export function getBatch(id: number) {
  return request<Batch>(`/api/batches/${id}`)
}

export function createBatch(input: BatchInput) {
  return request<Batch>('/api/batches', {
    method: 'POST',
    body: JSON.stringify(input),
  })
}

export function updateBatch(id: number, input: BatchUpdateInput) {
  return request<Batch>(`/api/batches/${id}`, {
    method: 'PUT',
    body: JSON.stringify(input),
  })
}
