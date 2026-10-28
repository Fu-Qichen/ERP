import { request } from './client'

export interface Dept {
  id: number
  deptCode: string
  deptName: string
  parentId: number | null
  status: number
}

export interface DeptInput {
  deptCode: string
  deptName: string
  parentId?: number | null
  status?: number
}

export interface Staff {
  id: number
  staffNo: string
  staffName: string
  deptId: number
  status: number
}

export interface StaffInput {
  staffNo: string
  staffName: string
  deptId: number
  status?: number
}

export function listDepartments() {
  return request<Dept[]>('/api/departments')
}

export function createDepartment(input: DeptInput) {
  return request<Dept>('/api/departments', {
    method: 'POST',
    body: JSON.stringify(input),
  })
}

export function updateDepartment(id: number, input: DeptInput) {
  return request<Dept>(`/api/departments/${id}`, {
    method: 'PUT',
    body: JSON.stringify(input),
  })
}

export function deleteDepartment(id: number) {
  return request<void>(`/api/departments/${id}`, { method: 'DELETE' })
}

export function listStaff() {
  return request<Staff[]>('/api/staff')
}

export function createStaff(input: StaffInput) {
  return request<Staff>('/api/staff', {
    method: 'POST',
    body: JSON.stringify(input),
  })
}

export function updateStaff(id: number, input: StaffInput) {
  return request<Staff>(`/api/staff/${id}`, {
    method: 'PUT',
    body: JSON.stringify(input),
  })
}

export function deleteStaff(id: number) {
  return request<void>(`/api/staff/${id}`, { method: 'DELETE' })
}
