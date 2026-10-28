import { request, type PageResult } from './client'

export interface SalesOrderLine {
  id: number
  materialId: number
  materialCode: string
  materialName: string
  quantity: string
  taxUnitPrice: string
  taxRate: string
  amount: string
  deliveredQty: string
}

export interface SalesOrder {
  id: number
  orderNo: string
  orderDate: string
  customerId: number
  customerName: string
  warehouseId: number
  warehouseName: string
  status: number
  totalAmount: string
  remark: string | null
  createdAt: string
  lines?: SalesOrderLine[]
}

export interface SalesOrderLineInput {
  materialId: number
  quantity: number
  taxUnitPrice: number
  taxRate: number
}

export interface SalesOrderInput {
  customerId: number
  warehouseId: number
  orderDate: string
  remark?: string
  lines: SalesOrderLineInput[]
}

export interface SalesOrderQuery {
  current: number
  size: number
  keyword?: string
  status?: number
}

export function listSalesOrders(query: SalesOrderQuery) {
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
  return request<PageResult<SalesOrder>>(`/api/sales-orders?${params.toString()}`)
}

export function getSalesOrder(id: number) {
  return request<SalesOrder>(`/api/sales-orders/${id}`)
}

export function createSalesOrder(input: SalesOrderInput) {
  return request<SalesOrder>('/api/sales-orders', {
    method: 'POST',
    body: JSON.stringify(input),
  })
}

export function auditSalesOrder(id: number) {
  return request<SalesOrder>(`/api/sales-orders/${id}/audit`, {
    method: 'POST',
  })
}

export function closeSalesOrder(id: number) {
  return request<SalesOrder>(`/api/sales-orders/${id}/close`, {
    method: 'POST',
  })
}
