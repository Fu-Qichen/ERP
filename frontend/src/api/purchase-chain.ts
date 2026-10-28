import { request, type PageResult } from './client'

export interface PurchaseReceiptLine {
  id: number
  orderLineId: number
  materialId: number
  materialCode: string
  materialName: string
  batchId: number | null
  batchNo: string | null
  quantity: string
  taxUnitPrice: string
  taxRate: string
  amount: string
}

export interface PurchaseReceipt {
  id: number
  receiptNo: string
  receiptDate: string
  orderId: number
  orderNo: string
  supplierId: number
  supplierName: string
  warehouseId: number
  warehouseName: string
  status: number
  remark: string | null
  createdAt: string
  inboundNo: string | null
  lines?: PurchaseReceiptLine[]
}

export interface PurchaseReceiptInput {
  orderId: number
  receiptDate: string
  remark?: string
  lines: { orderLineId: number; quantity: number; batchId?: number; batchNo?: string }[]
}

export interface PurchaseInvoiceLine {
  id: number
  receiptLineId: number
  materialId: number
  materialCode: string
  materialName: string
  quantity: string
  taxUnitPrice: string
  taxRate: string
  amount: string
  taxAmount: string
}

export interface PurchaseInvoice {
  id: number
  invoiceNo: string
  invoiceDate: string
  receiptId: number
  receiptNo: string
  orderId: number
  orderNo: string
  supplierId: number
  supplierName: string
  amount: string
  taxAmount: string
  totalAmount: string
  status: number
  remark: string | null
  createdAt: string
  payableNo: string | null
  lines?: PurchaseInvoiceLine[]
}

export interface Payable {
  id: number
  payableNo: string
  invoiceId: number
  invoiceNo: string
  supplierId: number
  supplierName: string
  invoiceDate: string
  totalAmount: string
  paidAmount: string
  balance: string
  status: number
  createdAt: string
}

export interface PaymentDetail {
  id: number
  payableId: number
  payableNo: string
  invoiceNo: string
  amount: string
}

export interface Payment {
  id: number
  paymentNo: string
  paymentDate: string
  supplierId: number
  supplierName: string
  settleMethodId: number | null
  settleMethodName: string | null
  amount: string
  usedAmount: string
  status: number
  remark: string | null
  createdAt: string
  details?: PaymentDetail[]
}

export interface PaymentInput {
  supplierId: number
  paymentDate: string
  settleMethodId?: number | null
  amount: number
  remark?: string
  details: { payableId: number; amount: number }[]
}

export function listPurchaseReceipts(params: {
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
  return request<PageResult<PurchaseReceipt>>(
    `/api/purchase-receipts?${query.toString()}`,
  )
}

export function getPurchaseReceipt(id: number) {
  return request<PurchaseReceipt>(`/api/purchase-receipts/${id}`)
}

export function createPurchaseReceipt(input: PurchaseReceiptInput) {
  return request<PurchaseReceipt>('/api/purchase-receipts', {
    method: 'POST',
    body: JSON.stringify(input),
  })
}

export function receivePurchaseReceipt(id: number) {
  return request<PurchaseReceipt>(`/api/purchase-receipts/${id}/receive`, {
    method: 'POST',
  })
}

export function listPurchaseInvoices(params: {
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
  return request<PageResult<PurchaseInvoice>>(
    `/api/purchase-invoices?${query.toString()}`,
  )
}

export function getPurchaseInvoice(id: number) {
  return request<PurchaseInvoice>(`/api/purchase-invoices/${id}`)
}

export function createPurchaseInvoice(input: {
  receiptId: number
  invoiceDate: string
  remark?: string
}) {
  return request<PurchaseInvoice>('/api/purchase-invoices', {
    method: 'POST',
    body: JSON.stringify(input),
  })
}

export function listPayables(params: {
  current: number
  size: number
  keyword?: string
  status?: number
  supplierId?: number
  openOnly?: boolean
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
  if (params.supplierId !== undefined) {
    query.set('supplierId', String(params.supplierId))
  }
  if (params.openOnly) {
    query.set('openOnly', 'true')
  }
  return request<PageResult<Payable>>(`/api/payables?${query.toString()}`)
}

export function listPayments(params: {
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
  return request<PageResult<Payment>>(`/api/payments?${query.toString()}`)
}

export function getPayment(id: number) {
  return request<Payment>(`/api/payments/${id}`)
}

export function createPayment(input: PaymentInput) {
  return request<Payment>('/api/payments', {
    method: 'POST',
    body: JSON.stringify(input),
  })
}
