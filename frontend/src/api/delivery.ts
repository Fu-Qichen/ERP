import { request, type PageResult } from './client'

export interface DeliveryLine {
  id: number
  orderLineId: number
  materialId: number
  materialCode: string
  materialName: string
  batchId: number | null
  batchNo: string | null
  quantity: string
}

export interface Delivery {
  id: number
  deliveryNo: string
  deliveryDate: string
  orderId: number
  orderNo: string
  customerId: number
  customerName: string
  warehouseId: number
  warehouseName: string
  status: number
  remark: string | null
  createdAt: string
  outboundId: number | null
  outboundNo: string | null
  outboundStatus: number | null
  lines?: DeliveryLine[]
}

export interface DeliveryLineInput {
  orderLineId: number
  quantity: number
  batchId?: number
}

export interface DeliveryInput {
  orderId: number
  deliveryDate: string
  remark?: string
  lines: DeliveryLineInput[]
}

export interface DeliveryQuery {
  current: number
  size: number
  keyword?: string
  status?: number
}

export function listDeliveries(query: DeliveryQuery) {
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
  return request<PageResult<Delivery>>(`/api/deliveries?${params.toString()}`)
}

export function getDelivery(id: number) {
  return request<Delivery>(`/api/deliveries/${id}`)
}

export function createDelivery(input: DeliveryInput) {
  return request<Delivery>('/api/deliveries', {
    method: 'POST',
    body: JSON.stringify(input),
  })
}

export function shipDelivery(id: number) {
  return request<Delivery>(`/api/deliveries/${id}/ship`, { method: 'POST' })
}
