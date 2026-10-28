import { request, type PageResult } from './client'

export interface BomLine {
  id: number
  componentId: number
  componentCode: string
  componentName: string
  unitName: string | null
  qty: string
  lossRate: string
}

export interface Bom {
  id: number
  bomCode: string
  version: string
  baseQty: string
  productId: number
  productCode: string
  productName: string
  status: number
  remark: string | null
  lines?: BomLine[]
}

export interface BomLineInput {
  componentId: number
  qty: number
  lossRate: number
}

export interface BomInput {
  bomCode: string
  productId: number
  version: string
  baseQty: number
  remark?: string
  lines: BomLineInput[]
}

export interface WorkOrder {
  id: number
  workOrderNo: string
  orderDate: string
  productId: number
  productCode: string
  productName: string
  bomId: number
  bomCode: string
  warehouseId: number
  warehouseName: string
  planQty: string
  finishQty: string
  issuedQty: string
  status: number
  remark: string | null
  createdAt: string
}

export interface WorkOrderInput {
  productId: number
  bomId: number
  warehouseId: number
  planQty: number
  orderDate: string
  remark?: string
}

export interface IssueRow {
  id: number
  issueNo: string
  workOrderId: number
  workOrderNo: string
  materialId: number
  materialCode: string
  materialName: string
  qty: string
  createdAt: string
}

export interface ReportRow {
  id: number
  reportNo: string
  workOrderId: number
  workOrderNo: string
  productId: number
  productCode: string
  productName: string
  qty: string
  createdAt: string
}

export function listBoms(params: { current: number; size: number; keyword?: string }) {
  const query = new URLSearchParams({
    current: String(params.current),
    size: String(params.size),
  })
  if (params.keyword) {
    query.set('keyword', params.keyword)
  }
  return request<PageResult<Bom>>(`/api/boms?${query.toString()}`)
}

export function getBom(id: number) {
  return request<Bom>(`/api/boms/${id}`)
}

export function createBom(input: BomInput) {
  return request<Bom>('/api/boms', {
    method: 'POST',
    body: JSON.stringify(input),
  })
}

export function updateBom(id: number, input: BomInput) {
  return request<Bom>(`/api/boms/${id}`, {
    method: 'PUT',
    body: JSON.stringify(input),
  })
}

export function changeBomStatus(id: number, status: number) {
  return request<Bom>(`/api/boms/${id}/status?status=${status}`, {
    method: 'POST',
  })
}

export function deleteBom(id: number) {
  return request<void>(`/api/boms/${id}`, { method: 'DELETE' })
}

export function listWorkOrders(params: {
  current: number
  size: number
  keyword?: string
  status?: number
}) {
  const query = new URLSearchParams({
    current: String(params.current),
    size: String(params.size),
  })
  if (params.keyword) {
    query.set('keyword', params.keyword)
  }
  if (params.status !== undefined) {
    query.set('status', String(params.status))
  }
  return request<PageResult<WorkOrder>>(`/api/work-orders?${query.toString()}`)
}

export function getWorkOrder(id: number) {
  return request<WorkOrder>(`/api/work-orders/${id}`)
}

export function createWorkOrder(input: WorkOrderInput) {
  return request<WorkOrder>('/api/work-orders', {
    method: 'POST',
    body: JSON.stringify(input),
  })
}

export function releaseWorkOrder(id: number) {
  return request<WorkOrder>(`/api/work-orders/${id}/release`, { method: 'POST' })
}

export function issueWorkOrder(
  id: number,
  lines: { materialId: number; qty: number; batchId?: number }[],
) {
  return request<WorkOrder>(`/api/work-orders/${id}/issue`, {
    method: 'POST',
    body: JSON.stringify({ lines }),
  })
}

export function reportWorkOrder(id: number, qty: number, batchNo?: string) {
  return request<WorkOrder>(`/api/work-orders/${id}/report`, {
    method: 'POST',
    body: JSON.stringify({ qty, batchNo }),
  })
}

export function listWorkOrderIssues(id: number) {
  return request<IssueRow[]>(`/api/work-orders/${id}/issues`)
}

export function listWorkOrderReports(id: number) {
  return request<ReportRow[]>(`/api/work-orders/${id}/reports`)
}
