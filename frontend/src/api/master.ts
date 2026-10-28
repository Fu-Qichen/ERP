import { request } from './client'

export interface Customer {
  id: number
  customerCode: string
  customerName: string
  classId?: number
  className?: string | null
  staffId?: number | null
  staffName?: string | null
  currencyId?: number
  currencyName?: string | null
  settleMethodId?: number | null
  settleMethodName?: string | null
  payConditionId?: number | null
  payConditionName?: string | null
  status: number
}

export interface CustomerInput {
  customerCode: string
  customerName: string
  classId: number
  staffId?: number | null
  currencyId: number
  settleMethodId?: number | null
  payConditionId?: number | null
  status?: number
}

export interface Supplier {
  id: number
  supplierCode: string
  supplierName: string
  classId?: number
  className?: string | null
  currencyId?: number
  currencyName?: string | null
  payConditionId?: number | null
  payConditionName?: string | null
  status: number
}

export interface SupplierInput {
  supplierCode: string
  supplierName: string
  classId: number
  currencyId: number
  payConditionId?: number | null
  status?: number
}

export interface CustomerClass {
  id: number
  classCode: string
  className: string
  parentId: number | null
  status: number
}

export interface SupplierClass {
  id: number
  classCode: string
  className: string
  parentId: number | null
  status: number
}

export interface Currency {
  id: number
  currencyCode: string
  currencyName: string
  exchangeRate: string
  status: number
}

export interface SettleMethod {
  id: number
  methodCode: string
  methodName: string
  status: number
}

export interface PayCondition {
  id: number
  conditionCode: string
  conditionName: string
  days: number
  status: number
}

export interface ClassInput {
  classCode: string
  className: string
  parentId?: number | null
  status?: number
}

export interface CurrencyInput {
  currencyCode: string
  currencyName: string
  exchangeRate: number
  status?: number
}

export interface SettleMethodInput {
  methodCode: string
  methodName: string
  status?: number
}

export interface PayConditionInput {
  conditionCode: string
  conditionName: string
  days: number
  status?: number
}

export interface Warehouse {
  id: number
  warehouseCode: string
  warehouseName: string
  deptId?: number
  deptName?: string | null
  status: number
}

export interface WarehouseInput {
  warehouseCode: string
  warehouseName: string
  deptId: number
  status?: number
}

export interface InventoryBalance {
  id: number
  materialId: number
  materialCode: string
  materialName: string
  warehouseId: number
  warehouseName: string
  qty: string
  lockedQty: string
  batchId: number | null
  batchNo: string | null
  expireDate: string | null
}

export function listCustomers() {
  return request<Customer[]>('/api/customers')
}

export function createCustomer(input: CustomerInput) {
  return request<Customer>('/api/customers', {
    method: 'POST',
    body: JSON.stringify(input),
  })
}

export function updateCustomer(id: number, input: CustomerInput) {
  return request<Customer>(`/api/customers/${id}`, {
    method: 'PUT',
    body: JSON.stringify(input),
  })
}

export function deleteCustomer(id: number) {
  return request<void>(`/api/customers/${id}`, { method: 'DELETE' })
}

export function listSuppliers() {
  return request<Supplier[]>('/api/suppliers')
}

export function createSupplier(input: SupplierInput) {
  return request<Supplier>('/api/suppliers', {
    method: 'POST',
    body: JSON.stringify(input),
  })
}

export function updateSupplier(id: number, input: SupplierInput) {
  return request<Supplier>(`/api/suppliers/${id}`, {
    method: 'PUT',
    body: JSON.stringify(input),
  })
}

export function deleteSupplier(id: number) {
  return request<void>(`/api/suppliers/${id}`, { method: 'DELETE' })
}

export function listCustomerClasses() {
  return request<CustomerClass[]>('/api/customer-classes')
}

export function listSupplierClasses() {
  return request<SupplierClass[]>('/api/supplier-classes')
}

export function listCurrencies() {
  return request<Currency[]>('/api/currencies')
}

export function listSettleMethods() {
  return request<SettleMethod[]>('/api/settle-methods')
}

export function listPayConditions() {
  return request<PayCondition[]>('/api/pay-conditions')
}

export function createCustomerClass(input: ClassInput) {
  return request<CustomerClass>('/api/customer-classes', {
    method: 'POST',
    body: JSON.stringify(input),
  })
}

export function updateCustomerClass(id: number, input: ClassInput) {
  return request<CustomerClass>(`/api/customer-classes/${id}`, {
    method: 'PUT',
    body: JSON.stringify(input),
  })
}

export function deleteCustomerClass(id: number) {
  return request<void>(`/api/customer-classes/${id}`, { method: 'DELETE' })
}

export function createSupplierClass(input: ClassInput) {
  return request<SupplierClass>('/api/supplier-classes', {
    method: 'POST',
    body: JSON.stringify(input),
  })
}

export function updateSupplierClass(id: number, input: ClassInput) {
  return request<SupplierClass>(`/api/supplier-classes/${id}`, {
    method: 'PUT',
    body: JSON.stringify(input),
  })
}

export function deleteSupplierClass(id: number) {
  return request<void>(`/api/supplier-classes/${id}`, { method: 'DELETE' })
}

export function createCurrency(input: CurrencyInput) {
  return request<Currency>('/api/currencies', {
    method: 'POST',
    body: JSON.stringify(input),
  })
}

export function updateCurrency(id: number, input: CurrencyInput) {
  return request<Currency>(`/api/currencies/${id}`, {
    method: 'PUT',
    body: JSON.stringify(input),
  })
}

export function deleteCurrency(id: number) {
  return request<void>(`/api/currencies/${id}`, { method: 'DELETE' })
}

export function createSettleMethod(input: SettleMethodInput) {
  return request<SettleMethod>('/api/settle-methods', {
    method: 'POST',
    body: JSON.stringify(input),
  })
}

export function updateSettleMethod(id: number, input: SettleMethodInput) {
  return request<SettleMethod>(`/api/settle-methods/${id}`, {
    method: 'PUT',
    body: JSON.stringify(input),
  })
}

export function deleteSettleMethod(id: number) {
  return request<void>(`/api/settle-methods/${id}`, { method: 'DELETE' })
}

export function createPayCondition(input: PayConditionInput) {
  return request<PayCondition>('/api/pay-conditions', {
    method: 'POST',
    body: JSON.stringify(input),
  })
}

export function updatePayCondition(id: number, input: PayConditionInput) {
  return request<PayCondition>(`/api/pay-conditions/${id}`, {
    method: 'PUT',
    body: JSON.stringify(input),
  })
}

export function deletePayCondition(id: number) {
  return request<void>(`/api/pay-conditions/${id}`, { method: 'DELETE' })
}

export function listWarehouses() {
  return request<Warehouse[]>('/api/warehouses')
}

export function createWarehouse(input: WarehouseInput) {
  return request<Warehouse>('/api/warehouses', {
    method: 'POST',
    body: JSON.stringify(input),
  })
}

export function updateWarehouse(id: number, input: WarehouseInput) {
  return request<Warehouse>(`/api/warehouses/${id}`, {
    method: 'PUT',
    body: JSON.stringify(input),
  })
}

export function deleteWarehouse(id: number) {
  return request<void>(`/api/warehouses/${id}`, { method: 'DELETE' })
}

export function listInventory(warehouseId?: number) {
  const query = warehouseId ? `?warehouseId=${warehouseId}` : ''
  return request<InventoryBalance[]>(`/api/inventory${query}`)
}
