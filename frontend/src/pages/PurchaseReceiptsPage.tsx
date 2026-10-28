import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  App,
  Button,
  Col,
  DatePicker,
  Descriptions,
  Divider,
  Form,
  Input,
  InputNumber,
  Modal,
  Popconfirm,
  Row,
  Select,
  Space,
  Table,
  Tag,
  Typography,
  type TableColumnsType,
} from 'antd'
import { PlusOutlined, ReloadOutlined, SearchOutlined } from '@ant-design/icons'
import dayjs, { type Dayjs } from 'dayjs'
import { useState } from 'react'
import {
  getPurchaseOrder,
  listPurchaseOrders,
  type PurchaseOrderLine,
} from '../api/purchase'
import {
  createPurchaseReceipt,
  getPurchaseReceipt,
  listPurchaseReceipts,
  receivePurchaseReceipt,
  type PurchaseReceipt,
  type PurchaseReceiptLine,
} from '../api/purchase-chain'

interface ReceiptLineForm {
  orderLineId: number
  quantity: number
  batchNo?: string
}

interface ReceiptFormValues {
  orderId: number
  receiptDate: Dayjs
  remark?: string
  lines: ReceiptLineForm[]
}

const statusMeta: Record<number, { color: string; label: string }> = {
  0: { color: 'default', label: '待入库' },
  1: { color: 'success', label: '已入库' },
}

function quantity(value: string | number | null | undefined) {
  if (value === null || value === undefined || value === '') {
    return '-'
  }
  return Number(value).toLocaleString('zh-CN', { maximumFractionDigits: 6 })
}

function pendingQuantity(line: PurchaseOrderLine) {
  return Number(line.quantity) - Number(line.receivedQty ?? 0)
}

export default function PurchaseReceiptsPage() {
  const { message } = App.useApp()
  const queryClient = useQueryClient()
  const [form] = Form.useForm<ReceiptFormValues>()

  const [current, setCurrent] = useState(1)
  const [size, setSize] = useState(10)
  const [keywordInput, setKeywordInput] = useState('')
  const [keyword, setKeyword] = useState('')
  const [statusFilter, setStatusFilter] = useState<number | undefined>()
  const [open, setOpen] = useState(false)
  const [detailId, setDetailId] = useState<number | null>(null)
  const [orderId, setOrderId] = useState<number | undefined>()

  const receipts = useQuery({
    queryKey: ['purchase-receipts', current, size, keyword, statusFilter],
    queryFn: () =>
      listPurchaseReceipts({ current, size, keyword, status: statusFilter }),
    placeholderData: (previous) => previous,
  })
  const detail = useQuery({
    queryKey: ['purchase-receipt', detailId],
    queryFn: () => getPurchaseReceipt(detailId as number),
    enabled: detailId !== null,
  })
  const auditedOrders = useQuery({
    queryKey: ['purchase-orders', 'auditable'],
    queryFn: () => listPurchaseOrders({ current: 1, size: 100, status: 1 }),
  })
  const orderDetail = useQuery({
    queryKey: ['purchase-order', orderId],
    queryFn: () => getPurchaseOrder(orderId as number),
    enabled: orderId !== undefined,
  })

  const orderOptions = (auditedOrders.data?.records ?? []).map((order) => ({
    value: order.id,
    label: `${order.orderNo} ${order.supplierName}`,
  }))

  const pendingLines = (orderDetail.data?.lines ?? []).filter(
    (line) => pendingQuantity(line) > 0,
  )

  const createMutation = useMutation({
    mutationFn: (values: ReceiptFormValues) =>
      createPurchaseReceipt({
        orderId: values.orderId,
        receiptDate: values.receiptDate.format('YYYY-MM-DD'),
        remark: values.remark,
        lines: values.lines,
      }),
    onSuccess: () => {
      message.success('收货单已创建，入库后才会增加库存')
      setOpen(false)
      queryClient.invalidateQueries({ queryKey: ['purchase-receipts'] })
      queryClient.invalidateQueries({ queryKey: ['purchase-orders'] })
    },
    onError: (error: Error) => message.error(error.message),
  })

  const receiveMutation = useMutation({
    mutationFn: receivePurchaseReceipt,
    onSuccess: () => {
      message.success('采购入库完成，库存已增加')
      queryClient.invalidateQueries({ queryKey: ['purchase-receipts'] })
      queryClient.invalidateQueries({ queryKey: ['purchase-orders'] })
      queryClient.invalidateQueries({ queryKey: ['inventory'] })
    },
    onError: (error: Error) => message.error(error.message),
  })

  const openCreate = () => {
    form.resetFields()
    const firstOrder = orderOptions[0]?.value
    setOrderId(firstOrder)
    form.setFieldsValue({
      orderId: firstOrder,
      receiptDate: dayjs(),
      remark: '',
      lines: [],
    })
    setOpen(true)
  }

  const pickOrder = (value: number) => {
    setOrderId(value)
    form.setFieldsValue({ orderId: value, lines: [] })
  }

  const fillAllPending = () => {
    form.setFieldsValue({
      lines: pendingLines.map((line) => ({
        orderLineId: line.id,
        quantity: pendingQuantity(line),
      })),
    })
  }

  const submit = async () => {
    const values = await form.validateFields()
    if (!values.lines || values.lines.length === 0) {
      message.warning('至少选择一条收货明细')
      return
    }
    createMutation.mutate(values)
  }

  const columns: TableColumnsType<PurchaseReceipt> = [
    { title: '收货单号', dataIndex: 'receiptNo', width: 180, fixed: 'left' },
    { title: '收货日期', dataIndex: 'receiptDate', width: 120 },
    { title: '采购订单', dataIndex: 'orderNo', width: 180 },
    { title: '供应商', dataIndex: 'supplierName', width: 140 },
    { title: '仓库', dataIndex: 'warehouseName', width: 110 },
    {
      title: '入库单',
      dataIndex: 'inboundNo',
      width: 180,
      render: (value: string | null) => value || '-',
    },
    {
      title: '状态',
      dataIndex: 'status',
      width: 100,
      render: (value: number) => {
        const meta = statusMeta[value] ?? statusMeta[0]
        return <Tag color={meta.color}>{meta.label}</Tag>
      },
    },
    {
      title: '操作',
      key: 'action',
      width: 150,
      fixed: 'right',
      render: (_, record) => (
        <Space>
          <Button type="link" size="small" onClick={() => setDetailId(record.id)}>
            详情
          </Button>
          {record.status === 0 && (
            <Popconfirm
              title="确认入库？"
              description="入库会增加库存并写流水，不可重复。"
              okText="入库"
              cancelText="取消"
              onConfirm={() => receiveMutation.mutate(record.id)}
            >
              <Button type="link" size="small">
                入库
              </Button>
            </Popconfirm>
          )}
        </Space>
      ),
    },
  ]

  const lineColumns: TableColumnsType<PurchaseReceiptLine> = [
    { title: '物料编码', dataIndex: 'materialCode', width: 130 },
    { title: '物料名称', dataIndex: 'materialName', width: 160 },
    {
      title: '收货数量',
      dataIndex: 'quantity',
      width: 120,
      align: 'right',
      render: (value: string) => quantity(value),
    },
    {
      title: '含税金额',
      dataIndex: 'amount',
      width: 130,
      align: 'right',
      render: (value: string) =>
        Number(value).toLocaleString('zh-CN', {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        }),
    },
  ]

  return (
    <div className="page">
      <div className="page-heading">
        <div>
          <Typography.Title level={3}>采购收货</Typography.Title>
          <Typography.Text type="secondary">
            按已审核采购订单创建收货单，入库时增加库存并生成入库单。
          </Typography.Text>
        </div>
        <Space wrap>
          <Input
            allowClear
            prefix={<SearchOutlined />}
            placeholder="收货单 / 订单 / 供应商"
            value={keywordInput}
            onChange={(event) => setKeywordInput(event.target.value)}
            onPressEnter={() => {
              setKeyword(keywordInput.trim())
              setCurrent(1)
            }}
            style={{ width: 240 }}
          />
          <Select
            allowClear
            placeholder="全部状态"
            style={{ width: 130 }}
            value={statusFilter}
            onChange={(value: number | undefined) => {
              setStatusFilter(value)
              setCurrent(1)
            }}
            options={[
              { value: 0, label: '待入库' },
              { value: 1, label: '已入库' },
            ]}
          />
          <Button
            onClick={() => {
              setKeyword(keywordInput.trim())
              setCurrent(1)
            }}
          >
            查询
          </Button>
          <Button
            icon={<ReloadOutlined />}
            onClick={() => queryClient.invalidateQueries({ queryKey: ['purchase-receipts'] })}
          >
            刷新
          </Button>
          <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>
            新增收货单
          </Button>
        </Space>
      </div>

      <Table<PurchaseReceipt>
        rowKey="id"
        loading={receipts.isLoading}
        columns={columns}
        dataSource={receipts.data?.records ?? []}
        scroll={{ x: 1200 }}
        pagination={{
          current,
          pageSize: size,
          total: receipts.data?.total ?? 0,
          showSizeChanger: true,
          showTotal: (total) => `共 ${total} 条`,
          onChange: (nextPage, nextSize) => {
            setCurrent(nextPage)
            setSize(nextSize)
          },
        }}
      />

      <Modal
        title="新增收货单"
        open={open}
        width={900}
        onOk={submit}
        confirmLoading={createMutation.isPending}
        onCancel={() => setOpen(false)}
        okText="保存收货单"
        cancelText="取消"
        destroyOnHidden
      >
        <Form form={form} layout="vertical">
          <Row gutter={16}>
            <Col span={10}>
              <Form.Item
                name="orderId"
                label="采购订单"
                rules={[{ required: true, message: '请选择订单' }]}
              >
                <Select
                  showSearch
                  optionFilterProp="label"
                  options={orderOptions}
                  placeholder="选择已审核采购订单"
                  onChange={pickOrder}
                />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="receiptDate"
                label="收货日期"
                rules={[{ required: true, message: '请选择收货日期' }]}
              >
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item label=" ">
                <Button block onClick={fillAllPending} disabled={pendingLines.length === 0}>
                  填入剩余数量
                </Button>
              </Form.Item>
            </Col>
          </Row>

          <Form.Item name="remark" label="备注">
            <Input maxLength={255} placeholder="可选" />
          </Form.Item>

          <Divider>收货明细</Divider>
          <Form.List name="lines">
            {(fields) => (
              <Table
                size="small"
                pagination={false}
                rowKey="key"
                dataSource={fields}
                columns={[
                  {
                    title: '物料',
                    render: (_, field) => (
                      <Form.Item
                        noStyle
                        name={[field.name, 'orderLineId']}
                        rules={[{ required: true }]}
                      >
                        <Select
                          style={{ width: '100%' }}
                          options={pendingLines.map((line) => ({
                            value: line.id,
                            label: `${line.materialCode} ${line.materialName}（可收 ${quantity(
                              pendingQuantity(line),
                            )}）`,
                          }))}
                        />
                      </Form.Item>
                    ),
                  },
                  {
                    title: '收货数量',
                    width: 160,
                    render: (_, field) => (
                      <Form.Item noStyle name={[field.name, 'quantity']} rules={[{ required: true }]}>
                        <InputNumber min={0.000001} precision={6} style={{ width: '100%' }} />
                      </Form.Item>
                    ),
                  },
                  {
                    title: '批次号（批次物料必填）',
                    width: 200,
                    render: (_, field) => (
                      <Form.Item noStyle name={[field.name, 'batchNo']}>
                        <Input placeholder="如 B20261101，留空则不给批次物料入库" />
                      </Form.Item>
                    ),
                  },
                ]}
              />
            )}
          </Form.List>
        </Form>
      </Modal>

      <Modal
        title={detail.data?.receiptNo ?? '收货单详情'}
        open={detailId !== null}
        width={860}
        footer={null}
        onCancel={() => setDetailId(null)}
        destroyOnHidden
      >
        {detail.data && (
          <>
            <Descriptions
              size="small"
              column={3}
              items={[
                { key: 'order', label: '采购订单', children: detail.data.orderNo },
                { key: 'supplier', label: '供应商', children: detail.data.supplierName },
                { key: 'warehouse', label: '仓库', children: detail.data.warehouseName },
                { key: 'date', label: '收货日期', children: detail.data.receiptDate },
                {
                  key: 'status',
                  label: '状态',
                  children: (
                    <Tag color={statusMeta[detail.data.status]?.color}>
                      {statusMeta[detail.data.status]?.label}
                    </Tag>
                  ),
                },
                { key: 'inbound', label: '入库单', children: detail.data.inboundNo || '-' },
                { key: 'remark', label: '备注', children: detail.data.remark || '-' },
              ]}
            />
            <Divider />
            <Table<PurchaseReceiptLine>
              rowKey="id"
              size="small"
              pagination={false}
              columns={lineColumns}
              dataSource={detail.data.lines ?? []}
            />
          </>
        )}
      </Modal>
    </div>
  )
}
