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
import OrderLineBatchSelect from '../components/OrderLineBatchSelect'
import {
  createDelivery,
  getDelivery,
  listDeliveries,
  shipDelivery,
  type Delivery,
  type DeliveryLine,
} from '../api/delivery'
import {
  getSalesOrder,
  listSalesOrders,
  type SalesOrderLine,
} from '../api/sales'

interface DeliveryLineForm {
  orderLineId: number
  quantity: number
  batchId?: number
}

interface DeliveryFormValues {
  orderId: number
  deliveryDate: Dayjs
  remark?: string
  lines: DeliveryLineForm[]
}

const statusMeta: Record<number, { color: string; label: string }> = {
  0: { color: 'default', label: '待出库' },
  1: { color: 'success', label: '已出库' },
}

function quantity(value: string | number | null | undefined) {
  if (value === null || value === undefined || value === '') {
    return '-'
  }
  return Number(value).toLocaleString('zh-CN', {
    maximumFractionDigits: 6,
  })
}

function pendingQuantity(line: SalesOrderLine) {
  return Number(line.quantity) - Number(line.deliveredQty ?? 0)
}

export default function DeliveriesPage() {
  const { message } = App.useApp()
  const queryClient = useQueryClient()
  const [form] = Form.useForm<DeliveryFormValues>()

  const [current, setCurrent] = useState(1)
  const [size, setSize] = useState(10)
  const [keywordInput, setKeywordInput] = useState('')
  const [keyword, setKeyword] = useState('')
  const [statusFilter, setStatusFilter] = useState<number | undefined>()
  const [open, setOpen] = useState(false)
  const [detailId, setDetailId] = useState<number | null>(null)
  const [orderId, setOrderId] = useState<number | undefined>()

  const deliveries = useQuery({
    queryKey: ['deliveries', current, size, keyword, statusFilter],
    queryFn: () => listDeliveries({ current, size, keyword, status: statusFilter }),
    placeholderData: (previous) => previous,
  })
  const detail = useQuery({
    queryKey: ['delivery', detailId],
    queryFn: () => getDelivery(detailId as number),
    enabled: detailId !== null,
  })
  const auditedOrders = useQuery({
    queryKey: ['sales-orders', 'auditable'],
    queryFn: () => listSalesOrders({ current: 1, size: 100, status: 1 }),
  })
  const orderDetail = useQuery({
    queryKey: ['sales-order', orderId],
    queryFn: () => getSalesOrder(orderId as number),
    enabled: orderId !== undefined,
  })

  const orderOptions = (auditedOrders.data?.records ?? []).map((order) => ({
    value: order.id,
    label: `${order.orderNo} ${order.customerName}`,
  }))

  const pendingLines = (orderDetail.data?.lines ?? []).filter(
    (line) => pendingQuantity(line) > 0,
  )

  const createMutation = useMutation({
    mutationFn: (values: DeliveryFormValues) =>
      createDelivery({
        orderId: values.orderId,
        deliveryDate: values.deliveryDate.format('YYYY-MM-DD'),
        remark: values.remark,
        lines: values.lines,
      }),
    onSuccess: () => {
      message.success('发货单已创建，出库后才会扣减库存')
      setOpen(false)
      queryClient.invalidateQueries({ queryKey: ['deliveries'] })
      queryClient.invalidateQueries({ queryKey: ['sales-orders'] })
    },
    onError: (error: Error) => message.error(error.message),
  })

  const shipMutation = useMutation({
    mutationFn: shipDelivery,
    onSuccess: () => {
      message.success('发货出库完成，库存已扣减')
      queryClient.invalidateQueries({ queryKey: ['deliveries'] })
      queryClient.invalidateQueries({ queryKey: ['inventory'] })
      queryClient.invalidateQueries({ queryKey: ['sales-orders'] })
    },
    onError: (error: Error) => message.error(error.message),
  })

  const openCreate = () => {
    form.resetFields()
    const firstOrder = orderOptions[0]?.value
    setOrderId(firstOrder)
    form.setFieldsValue({
      orderId: firstOrder,
      deliveryDate: dayjs(),
      remark: '',
      lines: [],
    })
    setOpen(true)
  }

  const pickOrder = (value: number) => {
    setOrderId(value)
    form.setFieldsValue({ orderId: value, lines: [] })
  }

  const fillAllPending = async () => {
    const lines = pendingLines.map((line) => ({
      orderLineId: line.id,
      quantity: pendingQuantity(line),
    }))
    form.setFieldsValue({ lines })
  }

  const submit = async () => {
    const values = await form.validateFields()
    if (!values.lines || values.lines.length === 0) {
      message.warning('至少选择一条发货明细')
      return
    }
    createMutation.mutate(values)
  }

  const columns: TableColumnsType<Delivery> = [
    { title: '发货单号', dataIndex: 'deliveryNo', width: 190, fixed: 'left' },
    { title: '发货日期', dataIndex: 'deliveryDate', width: 120 },
    { title: '销售订单', dataIndex: 'orderNo', width: 180 },
    { title: '客户', dataIndex: 'customerName', width: 150 },
    { title: '仓库', dataIndex: 'warehouseName', width: 110 },
    {
      title: '出库单',
      dataIndex: 'outboundNo',
      width: 190,
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
      width: 160,
      fixed: 'right',
      render: (_, record) => (
        <Space>
          <Button type="link" size="small" onClick={() => setDetailId(record.id)}>
            详情
          </Button>
          {record.status === 0 && (
            <Popconfirm
              title="确认出库？"
              description="出库会扣减库存并写流水，不可重复。"
              okText="出库"
              cancelText="取消"
              onConfirm={() => shipMutation.mutate(record.id)}
            >
              <Button type="link" size="small">
                出库
              </Button>
            </Popconfirm>
          )}
        </Space>
      ),
    },
  ]

  const lineColumns: TableColumnsType<DeliveryLine> = [
    { title: '物料编码', dataIndex: 'materialCode', width: 130 },
    { title: '物料名称', dataIndex: 'materialName', width: 160 },
    {
      title: '发货数量',
      dataIndex: 'quantity',
      width: 120,
      align: 'right',
      render: (value: string) => quantity(value),
    },
  ]

  return (
    <div className="page">
      <div className="page-heading">
        <div>
          <Typography.Title level={3}>销售发货</Typography.Title>
          <Typography.Text type="secondary">
            按已审核订单创建发货单，出库确认时扣库存并生成出库单。
          </Typography.Text>
        </div>
        <Space wrap>
          <Input
            allowClear
            prefix={<SearchOutlined />}
            placeholder="发货单 / 订单 / 客户"
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
              { value: 0, label: '待出库' },
              { value: 1, label: '已出库' },
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
            onClick={() => queryClient.invalidateQueries({ queryKey: ['deliveries'] })}
          >
            刷新
          </Button>
          <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>
            新增发货单
          </Button>
        </Space>
      </div>

      <Table<Delivery>
        rowKey="id"
        loading={deliveries.isLoading}
        columns={columns}
        dataSource={deliveries.data?.records ?? []}
        scroll={{ x: 1240 }}
        pagination={{
          current,
          pageSize: size,
          total: deliveries.data?.total ?? 0,
          showSizeChanger: true,
          showTotal: (total) => `共 ${total} 条`,
          onChange: (nextPage, nextSize) => {
            setCurrent(nextPage)
            setSize(nextSize)
          },
        }}
      />

      <Modal
        title="新增发货单"
        open={open}
        width={900}
        onOk={submit}
        confirmLoading={createMutation.isPending}
        onCancel={() => setOpen(false)}
        okText="保存发货单"
        cancelText="取消"
        destroyOnHidden
      >
        <Form form={form} layout="vertical">
          <Row gutter={16}>
            <Col span={10}>
              <Form.Item
                name="orderId"
                label="销售订单"
                rules={[{ required: true, message: '请选择订单' }]}
              >
                <Select
                  showSearch
                  optionFilterProp="label"
                  options={orderOptions}
                  placeholder="选择已审核订单"
                  onChange={pickOrder}
                />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="deliveryDate"
                label="发货日期"
                rules={[{ required: true, message: '请选择发货日期' }]}
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

          <Divider>发货明细</Divider>
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
                            label: `${line.materialCode} ${line.materialName}（可发 ${quantity(
                              pendingQuantity(line),
                            )}）`,
                          }))}
                        />
                      </Form.Item>
                    ),
                  },
                  {
                    title: '发货数量',
                    width: 160,
                    render: (_, field) => (
                      <Form.Item noStyle name={[field.name, 'quantity']} rules={[{ required: true }]}>
                        <InputNumber min={0.000001} precision={6} style={{ width: '100%' }} />
                      </Form.Item>
                    ),
                  },
                  {
                    title: '批次（批次物料必填）',
                    width: 260,
                    render: (_, field) => {
                      const lineId = form.getFieldValue(['lines', field.name, 'orderLineId'])
                      const orderLine = pendingLines.find((item) => item.id === lineId)
                      return (
                        <Form.Item noStyle name={[field.name, 'batchId']}>
                          <OrderLineBatchSelect
                            materialId={orderLine?.materialId}
                            warehouseId={orderDetail.data?.warehouseId}
                          />
                        </Form.Item>
                      )
                    },
                  },
                ]}
              />
            )}
          </Form.List>
        </Form>
      </Modal>

      <Modal
        title={detail.data?.deliveryNo ?? '发货单详情'}
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
                { key: 'order', label: '销售订单', children: detail.data.orderNo },
                { key: 'customer', label: '客户', children: detail.data.customerName },
                { key: 'warehouse', label: '仓库', children: detail.data.warehouseName },
                { key: 'date', label: '发货日期', children: detail.data.deliveryDate },
                {
                  key: 'status',
                  label: '状态',
                  children: (
                    <Tag color={statusMeta[detail.data.status]?.color}>
                      {statusMeta[detail.data.status]?.label}
                    </Tag>
                  ),
                },
                { key: 'outbound', label: '出库单', children: detail.data.outboundNo || '-' },
                { key: 'remark', label: '备注', children: detail.data.remark || '-' },
              ]}
            />
            <Divider />
            <Table<DeliveryLine>
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
