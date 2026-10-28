import { request, type PageResult } from './client'

export interface InvoiceLine {
  id: number
  deliveryLineId: number
  materialId: number
  materialCode: string
  materialName: string
  quantity: string
  taxUnitPrice: string
  taxRate: string
  amount: string
  taxAmount: string
}

export interface Invoice {
  id: number
  invoiceNo: string
  invoiceDate: string
  deliveryId: number
  deliveryNo: string
  orderId: number
  orderNo: string
  customerId: number
  customerName: string
  amount: string
  taxAmount: string
  totalAmount: string
  status: number
  remark: string | null
  createdAt: string
  receivableNo: string | null
  lines?: InvoiceLine[]
}

export interface InvoiceInput {
  deliveryId: number
  invoiceDate: string
  remark?: string
}

export interface Receivable {
  id: number
  receivableNo: string
  invoiceId: number
  invoiceNo: string
  customerId: number
  customerName: string
  invoiceDate: string
  totalAmount: string
  paidAmount: string
  balance: string
  status: number
  createdAt: string
}

export function listInvoices(params: { current: number; size: number; keyword?: string }) {
  const query = new URLSearchParams({
    current: String(params.current),
    size: String(params.size),
  })
  if (params.keyword) {
    query.set('keyword', params.keyword)
  }
  return request<PageResult<Invoice>>(`/api/invoices?${query.toString()}`)
}

export function getInvoice(id: number) {
  return request<Invoice>(`/api/invoices/${id}`)
}

export function createInvoice(input: InvoiceInput) {
  return request<Invoice>('/api/invoices', {
    method: 'POST',
    body: JSON.stringify(input),
  })
}

export function listReceivables(params: {
  current: number
  size: number
  keyword?: string
  status?: number
  customerId?: number
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
  if (params.customerId !== undefined) {
    query.set('customerId', String(params.customerId))
  }
  if (params.openOnly) {
    query.set('openOnly', 'true')
  }
  return request<PageResult<Receivable>>(`/api/receivables?${query.toString()}`)
}
