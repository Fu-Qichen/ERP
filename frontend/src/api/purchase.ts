import { request, type PageResult } from './client'

export interface PurchaseOrderLine {
  id: number
  materialId: number
  materialCode: string
  materialName: string
  quantity: string
  taxUnitPrice: string
  taxRate: string
  amount: string
  receivedQty: string
}

export interface PurchaseOrder {
  id: number
  orderNo: string
  orderDate: string
  supplierId: number
  supplierName: string
  warehouseId: number
  warehouseName: string
  status: number
  totalAmount: string
  remark: string | null
  createdAt: string
  lines?: PurchaseOrderLine[]
}

export interface PurchaseOrderLineInput {
  materialId: number
  quantity: number
  taxUnitPrice: number
  taxRate: number
}

export interface PurchaseOrderInput {
  supplierId: number
  warehouseId: number
  orderDate: string
  remark?: string
  lines: PurchaseOrderLineInput[]
}

export interface PurchaseOrderQuery {
  current: number
  size: number
  keyword?: string
  status?: number
}

export function listPurchaseOrders(query: PurchaseOrderQuery) {
  const params = new URLSearchParams({
    current: String(query.current),
    size: String(query.size),
  })
  if (query.keyword) {
    params.set('keyword', query.keyword)
  }
  if (query.status !== undefined) {
    params.set('status', String(query.status))
  }
  return request<PageResult<PurchaseOrder>>(`/api/purchase-orders?${params.toString()}`)
}

export function getPurchaseOrder(id: number) {
  return request<PurchaseOrder>(`/api/purchase-orders/${id}`)
}

export function createPurchaseOrder(input: PurchaseOrderInput) {
  return request<PurchaseOrder>('/api/purchase-orders', {
    method: 'POST',
    body: JSON.stringify(input),
  })
}

export function auditPurchaseOrder(id: number) {
  return request<PurchaseOrder>(`/api/purchase-orders/${id}/audit`, {
    method: 'POST',
  })
}

export function closePurchaseOrder(id: number) {
  return request<PurchaseOrder>(`/api/purchase-orders/${id}/close`, {
    method: 'POST',
  })
}
