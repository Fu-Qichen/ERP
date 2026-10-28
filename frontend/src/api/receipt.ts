import { request, type PageResult } from './client'

export interface ReceiptDetail {
  id: number
  receivableId: number
  receivableNo: string
  invoiceNo: string
  amount: string
}

export interface Receipt {
  id: number
  receiptNo: string
  receiptDate: string
  customerId: number
  customerName: string
  settleMethodId: number | null
  settleMethodName: string | null
  amount: string
  usedAmount: string
  status: number
  remark: string | null
  createdAt: string
  details?: ReceiptDetail[]
}

export interface ReceiptDetailInput {
  receivableId: number
  amount: number
}

export interface ReceiptInput {
  customerId: number
  receiptDate: string
  settleMethodId?: number | null
  amount: number
  remark?: string
  details: ReceiptDetailInput[]
}

export function listReceipts(params: { current: number; size: number; keyword?: string }) {
  const query = new URLSearchParams({
    current: String(params.current),
    size: String(params.size),
  })
  if (params.keyword) {
    query.set('keyword', params.keyword)
  }
  return request<PageResult<Receipt>>(`/api/receipts?${query.toString()}`)
}

export function getReceipt(id: number) {
  return request<Receipt>(`/api/receipts/${id}`)
}

export function createReceipt(input: ReceiptInput) {
  return request<Receipt>('/api/receipts', {
    method: 'POST',
    body: JSON.stringify(input),
  })
}
