import { request, type PageResult } from './client'

export interface OutboundLine {
  id: number
  materialId: number
  materialCode: string
  materialName: string
  quantity: string
  taxUnitPrice: string
  amount: string
}

export interface Outbound {
  id: number
  outboundNo: string
  deliveryId: number
  deliveryNo: string
  orderNo: string
  customerName: string
  warehouseId: number
  warehouseName: string
  status: number
  postedAt: string | null
  createdAt: string
  lines?: OutboundLine[]
}

export interface InboundLine {
  id: number
  materialId: number
  materialCode: string
  materialName: string
  quantity: string
  taxUnitPrice: string
}

export interface Inbound {
  id: number
  inboundNo: string
  receiptId: number
  receiptNo: string
  orderNo: string
  supplierName: string
  warehouseId: number
  warehouseName: string
  status: number
  postedAt: string | null
  createdAt: string
  lines?: InboundLine[]
}

export interface LedgerEntry {
  id: number
  materialId: number
  materialCode: string
  materialName: string
  warehouseId: number
  warehouseName: string
  bizType: string
  direction: number
  qty: string
  sourceType: string
  sourceId: number
  sourceNo: string | null
  batchId: number | null
  batchNo: string | null
  occurredAt: string
  remark: string | null
}

export function listOutbounds(params: {
  current: number
  size: number
  keyword?: string
}) {
  const query = new URLSearchParams({
    current: String(params.current),
    size: String(params.size),
  })
  if (params.keyword) {
    query.set('keyword', params.keyword)
  }
  return request<PageResult<Outbound>>(`/api/outbounds?${query.toString()}`)
}

export function getOutbound(id: number) {
  return request<Outbound>(`/api/outbounds/${id}`)
}

export function listInbounds(params: {
  current: number
  size: number
  keyword?: string
}) {
  const query = new URLSearchParams({
    current: String(params.current),
    size: String(params.size),
  })
  if (params.keyword) {
    query.set('keyword', params.keyword)
  }
  return request<PageResult<Inbound>>(`/api/inbounds?${query.toString()}`)
}

export function getInbound(id: number) {
  return request<Inbound>(`/api/inbounds/${id}`)
}

export interface ReconcileRow {
  materialId: number
  materialCode: string
  materialName: string
  warehouseId: number
  warehouseName: string
  batchId: number | null
  batchNo: string | null
  balanceQty: string
  ledgerQty: string
  diffQty: string
  status: 'MATCHED' | 'DIFF'
}

export function ledgerExportUrl(params: {
  materialId?: number
  warehouseId?: number
  bizType?: string
  batchId?: number
  keyword?: string
}) {
  const query = new URLSearchParams()
  if (params.materialId !== undefined) {
    query.set('materialId', String(params.materialId))
  }
  if (params.warehouseId !== undefined) {
    query.set('warehouseId', String(params.warehouseId))
  }
  if (params.bizType) {
    query.set('bizType', params.bizType)
  }
  if (params.batchId !== undefined) {
    query.set('batchId', String(params.batchId))
  }
  if (params.keyword) {
    query.set('keyword', params.keyword)
  }
  const suffix = query.toString()
  return `/api/ledger/export${suffix ? `?${suffix}` : ''}`
}

export function listReconcile(params: {
  warehouseId?: number
  onlyDiff?: boolean
}) {
  const query = new URLSearchParams()
  if (params.warehouseId !== undefined) {
    query.set('warehouseId', String(params.warehouseId))
  }
  if (params.onlyDiff) {
    query.set('onlyDiff', 'true')
  }
  const suffix = query.toString()
  return request<ReconcileRow[]>(`/api/reconcile${suffix ? `?${suffix}` : ''}`)
}

export function listLedger(params: {
  current: number
  size: number
  materialId?: number
  warehouseId?: number
  bizType?: string
  batchId?: number
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
  if (params.bizType) {
    query.set('bizType', params.bizType)
  }
  if (params.batchId !== undefined) {
    query.set('batchId', String(params.batchId))
  }
  if (params.keyword) {
    query.set('keyword', params.keyword)
  }
  return request<PageResult<LedgerEntry>>(`/api/ledger?${query.toString()}`)
}
