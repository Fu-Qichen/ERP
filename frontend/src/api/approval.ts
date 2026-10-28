import { request, type PageResult } from './client'

export interface ApprovalLog {
  id: number
  step: number
  action: string
  approver: string
  remark: string | null
  createdAt: string
}

export interface Approval {
  id: number
  bizType: string
  bizId: number
  bizNo: string
  status: number
  currentStep: number
  totalSteps: number
  amount: string | null
  submitRemark: string | null
  submittedAt: string
  finishedAt: string | null
  logs?: ApprovalLog[]
}

export interface DecisionInput {
  approver: string
  approved: boolean
  remark?: string
}

export function listApprovals(params: {
  current: number
  size: number
  bizType?: string
  status?: number
  keyword?: string
}) {
  const query = new URLSearchParams({
    current: String(params.current),
    size: String(params.size),
  })
  if (params.bizType) {
    query.set('bizType', params.bizType)
  }
  if (params.status !== undefined) {
    query.set('status', String(params.status))
  }
  if (params.keyword) {
    query.set('keyword', params.keyword)
  }
  return request<PageResult<Approval>>(`/api/approvals?${query.toString()}`)
}

export function getApproval(id: number) {
  return request<Approval>(`/api/approvals/${id}`)
}

export function decideApproval(id: number, input: DecisionInput) {
  return request<Approval>(`/api/approvals/${id}/decide`, {
    method: 'POST',
    body: JSON.stringify(input),
  })
}

export function pendingApprovalCount() {
  return request<number>('/api/approvals/pending-count')
}

export function listApprovalLogs(bizType: string, bizId: number) {
  return request<ApprovalLog[]>(
    `/api/approvals/logs?bizType=${bizType}&bizId=${bizId}`,
  )
}

export function decideSalesOrder(id: number, input: DecisionInput) {
  return request<unknown>(`/api/sales-orders/${id}/decide`, {
    method: 'POST',
    body: JSON.stringify(input),
  })
}

export function decidePurchaseOrder(id: number, input: DecisionInput) {
  return request<unknown>(`/api/purchase-orders/${id}/decide`, {
    method: 'POST',
    body: JSON.stringify(input),
  })
}
