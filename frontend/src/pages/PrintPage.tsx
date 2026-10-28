import { useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Button, Descriptions, Spin, Table, Typography } from 'antd'
import { PrinterOutlined } from '@ant-design/icons'
import { getSalesOrder, type SalesOrderLine } from '../api/sales'
import { getPurchaseOrder, type PurchaseOrderLine } from '../api/purchase'

const statusLabel: Record<number, string> = {
  0: '草稿',
  1: '已审核',
  2: '已关闭',
}

function money(value: string | number | null | undefined) {
  if (value === null || value === undefined || value === '') {
    return '-'
  }
  return Number(value).toLocaleString('zh-CN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
}

function PrintActions() {
  return (
    <div className="print-actions">
      <Button icon={<PrinterOutlined />} type="primary" onClick={() => window.print()}>
        打印
      </Button>
      <Button onClick={() => window.close()}>关闭</Button>
    </div>
  )
}

function SalesOrderSheet({ id }: { id: number }) {
  const order = useQuery({
    queryKey: ['print-sales-order', id],
    queryFn: () => getSalesOrder(id),
  })

  if (order.isLoading) {
    return <Spin />
  }
  if (!order.data) {
    return <Typography.Text type="danger">订单不存在</Typography.Text>
  }

  const data = order.data
  const lines = data.lines ?? []
  const totalQty = lines.reduce((sum, line) => sum + Number(line.quantity), 0)
  const totalAmount = lines.reduce((sum, line) => sum + Number(line.amount), 0)

  const columns = [
    { title: '#', width: 40, render: (_: unknown, __: SalesOrderLine, index: number) => index + 1 },
    { title: '物料编码', dataIndex: 'materialCode', width: 110 },
    { title: '物料名称', dataIndex: 'materialName' },
    { title: '数量', dataIndex: 'quantity', width: 90, align: 'right' as const },
    { title: '含税单价', dataIndex: 'taxUnitPrice', width: 100, align: 'right' as const, render: (v: string) => money(v) },
    { title: '税率', dataIndex: 'taxRate', width: 70, align: 'right' as const, render: (v: string) => `${Number(v)}%` },
    { title: '金额', dataIndex: 'amount', width: 110, align: 'right' as const, render: (v: string) => money(v) },
  ]

  return (
    <div className="print-sheet">
      <h1>销售订单</h1>
      <Descriptions bordered size="small" column={3}>
        <Descriptions.Item label="订单号">{data.orderNo}</Descriptions.Item>
        <Descriptions.Item label="订单日期">{data.orderDate}</Descriptions.Item>
        <Descriptions.Item label="状态">{statusLabel[data.status] ?? data.status}</Descriptions.Item>
        <Descriptions.Item label="客户">{data.customerName}</Descriptions.Item>
        <Descriptions.Item label="仓库">{data.warehouseName}</Descriptions.Item>
        <Descriptions.Item label="备注">{data.remark || '-'}</Descriptions.Item>
      </Descriptions>
      <Table
        size="small"
        bordered
        pagination={false}
        rowKey="id"
        dataSource={lines}
        columns={columns}
        summary={() => (
          <Table.Summary.Row>
            <Table.Summary.Cell index={0} colSpan={3}>
              合计
            </Table.Summary.Cell>
            <Table.Summary.Cell index={1} align="right">
              {totalQty}
            </Table.Summary.Cell>
            <Table.Summary.Cell index={2} colSpan={2} />
            <Table.Summary.Cell index={3} align="right">
              {money(totalAmount)}
            </Table.Summary.Cell>
          </Table.Summary.Row>
        )}
      />
      <div className="print-sign">
        <span>制单：____________</span>
        <span>审核：____________</span>
        <span>客户签收：____________</span>
      </div>
    </div>
  )
}

function PurchaseOrderSheet({ id }: { id: number }) {
  const order = useQuery({
    queryKey: ['print-purchase-order', id],
    queryFn: () => getPurchaseOrder(id),
  })

  if (order.isLoading) {
    return <Spin />
  }
  if (!order.data) {
    return <Typography.Text type="danger">采购订单不存在</Typography.Text>
  }

  const data = order.data
  const lines = data.lines ?? []
  const totalQty = lines.reduce((sum, line) => sum + Number(line.quantity), 0)
  const totalAmount = lines.reduce((sum, line) => sum + Number(line.amount), 0)

  const columns = [
    { title: '#', width: 40, render: (_: unknown, __: PurchaseOrderLine, index: number) => index + 1 },
    { title: '物料编码', dataIndex: 'materialCode', width: 110 },
    { title: '物料名称', dataIndex: 'materialName' },
    { title: '数量', dataIndex: 'quantity', width: 90, align: 'right' as const },
    { title: '含税单价', dataIndex: 'taxUnitPrice', width: 100, align: 'right' as const, render: (v: string) => money(v) },
    { title: '税率', dataIndex: 'taxRate', width: 70, align: 'right' as const, render: (v: string) => `${Number(v)}%` },
    { title: '金额', dataIndex: 'amount', width: 110, align: 'right' as const, render: (v: string) => money(v) },
  ]

  return (
    <div className="print-sheet">
      <h1>采购订单</h1>
      <Descriptions bordered size="small" column={3}>
        <Descriptions.Item label="订单号">{data.orderNo}</Descriptions.Item>
        <Descriptions.Item label="订单日期">{data.orderDate}</Descriptions.Item>
        <Descriptions.Item label="状态">{statusLabel[data.status] ?? data.status}</Descriptions.Item>
        <Descriptions.Item label="供应商">{data.supplierName}</Descriptions.Item>
        <Descriptions.Item label="收货仓库">{data.warehouseName}</Descriptions.Item>
        <Descriptions.Item label="备注">{data.remark || '-'}</Descriptions.Item>
      </Descriptions>
      <Table
        size="small"
        bordered
        pagination={false}
        rowKey="id"
        dataSource={lines}
        columns={columns}
        summary={() => (
          <Table.Summary.Row>
            <Table.Summary.Cell index={0} colSpan={3}>
              合计
            </Table.Summary.Cell>
            <Table.Summary.Cell index={1} align="right">
              {totalQty}
            </Table.Summary.Cell>
            <Table.Summary.Cell index={2} colSpan={2} />
            <Table.Summary.Cell index={3} align="right">
              {money(totalAmount)}
            </Table.Summary.Cell>
          </Table.Summary.Row>
        )}
      />
      <div className="print-sign">
        <span>制单：____________</span>
        <span>审核：____________</span>
        <span>供应商确认：____________</span>
      </div>
    </div>
  )
}

export default function PrintPage() {
  const { type, id } = useParams<{ type: string; id: string }>()
  const navigate = useNavigate()

  useEffect(() => {
    if (!type || !id) {
      navigate('/')
    }
  }, [type, id, navigate])

  const orderId = Number(id)

  return (
    <div className="print-page">
      <PrintActions />
      {type === 'sales-order' && <SalesOrderSheet id={orderId} />}
      {type === 'purchase-order' && <PurchaseOrderSheet id={orderId} />}
      {type !== 'sales-order' && type !== 'purchase-order' && (
        <Typography.Text type="danger">不支持的打印类型：{type}</Typography.Text>
      )}
    </div>
  )
}
