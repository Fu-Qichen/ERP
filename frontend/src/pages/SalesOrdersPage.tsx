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
import { PlusOutlined, PrinterOutlined, ReloadOutlined, SearchOutlined } from '@ant-design/icons'
import dayjs, { type Dayjs } from 'dayjs'
import { useState } from 'react'
import ApprovalTimeline from '../components/ApprovalTimeline'
import { listMaterials } from '../api/materials'
import { listCustomers, listWarehouses } from '../api/master'
import {
  auditSalesOrder,
  closeSalesOrder,
  createSalesOrder,
  getSalesOrder,
  listSalesOrders,
  type SalesOrder,
  type SalesOrderLine,
} from '../api/sales'

interface OrderLineForm {
  materialId: number
  quantity: number
  taxUnitPrice: number
  taxRate: number
}

interface OrderFormValues {
  customerId: number
  warehouseId: number
  orderDate: Dayjs
  remark?: string
  lines: OrderLineForm[]
}

const defaultLine: OrderLineForm = {
  materialId: 0,
  quantity: 1,
  taxUnitPrice: 0,
  taxRate: 13,
}

const statusMeta: Record<number, { color: string; label: string }> = {
  0: { color: 'default', label: '草稿' },
  1: { color: 'processing', label: '已审核' },
  2: { color: 'success', label: '已关闭' },
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

function quantity(value: string | number | null | undefined) {
  if (value === null || value === undefined || value === '') {
    return '-'
  }
  return Number(value).toLocaleString('zh-CN', {
    maximumFractionDigits: 6,
  })
}

export default function SalesOrdersPage() {
  const { message } = App.useApp()
  const queryClient = useQueryClient()
  const [form] = Form.useForm<OrderFormValues>()

  const [current, setCurrent] = useState(1)
  const [size, setSize] = useState(10)
  const [keywordInput, setKeywordInput] = useState('')
  const [keyword, setKeyword] = useState('')
  const [statusFilter, setStatusFilter] = useState<number | undefined>()
  const [open, setOpen] = useState(false)
  const [detailId, setDetailId] = useState<number | null>(null)

  const watchedLines = Form.useWatch('lines', form)

  const customers = useQuery({
    queryKey: ['customers'],
    queryFn: listCustomers,
  })
  const warehouses = useQuery({
    queryKey: ['warehouses'],
    queryFn: listWarehouses,
  })
  const materials = useQuery({
    queryKey: ['materials', 'options'],
    queryFn: () => listMaterials({ current: 1, size: 100 }),
  })
  const orders = useQuery({
    queryKey: ['sales-orders', current, size, keyword, statusFilter],
    queryFn: () =>
      listSalesOrders({ current, size, keyword, status: statusFilter }),
    placeholderData: (previous) => previous,
  })
  const detail = useQuery({
    queryKey: ['sales-order', detailId],
    queryFn: () => getSalesOrder(detailId as number),
    enabled: detailId !== null,
  })

  const customerOptions = (customers.data ?? []).map((customer) => ({
    value: customer.id,
    label: `${customer.customerCode} ${customer.customerName}`,
  }))
  const warehouseOptions = (warehouses.data ?? []).map((warehouse) => ({
    value: warehouse.id,
    label: `${warehouse.warehouseCode} ${warehouse.warehouseName}`,
  }))
  const materialOptions = (materials.data?.records ?? []).map((material) => ({
    value: material.id,
    label: `${material.code} ${material.name}`,
  }))

  const createMutation = useMutation({
    mutationFn: (values: OrderFormValues) =>
      createSalesOrder({
        customerId: values.customerId,
        warehouseId: values.warehouseId,
        orderDate: values.orderDate.format('YYYY-MM-DD'),
        remark: values.remark,
        lines: values.lines,
      }),
    onSuccess: () => {
      message.success('订单已创建，确认后才会扣减库存')
      setOpen(false)
      queryClient.invalidateQueries({ queryKey: ['sales-orders'] })
    },
    onError: (error: Error) => {
      message.error(error.message)
    },
  })

  const auditMutation = useMutation({
    mutationFn: auditSalesOrder,
    onSuccess: () => {
      message.success('订单已审核，可进入发货流程')
      queryClient.invalidateQueries({ queryKey: ['sales-orders'] })
      queryClient.invalidateQueries({ queryKey: ['sales-order'] })
    },
    onError: (error: Error) => {
      message.error(error.message)
    },
  })

  const closeMutation = useMutation({
    mutationFn: closeSalesOrder,
    onSuccess: () => {
      message.success('订单已关闭')
      queryClient.invalidateQueries({ queryKey: ['sales-orders'] })
      queryClient.invalidateQueries({ queryKey: ['sales-order'] })
    },
    onError: (error: Error) => {
      message.error(error.message)
    },
  })

  const openCreate = () => {
    form.resetFields()
    form.setFieldsValue({
      customerId: customerOptions[0]?.value,
      warehouseId: warehouseOptions[0]?.value,
      orderDate: dayjs(),
      remark: '',
      lines: [defaultLine],
    })
    setOpen(true)
  }

  const submit = async () => {
    const values = await form.validateFields()
    createMutation.mutate(values)
  }

  const totalPreview = (watchedLines ?? []).reduce(
    (sum, line) =>
      sum + Number(line?.quantity ?? 0) * Number(line?.taxUnitPrice ?? 0),
    0,
  )

  const columns: TableColumnsType<SalesOrder> = [
    {
      title: '订单号',
      dataIndex: 'orderNo',
      width: 180,
      fixed: 'left',
    },
    {
      title: '订单日期',
      dataIndex: 'orderDate',
      width: 120,
    },
    {
      title: '客户',
      dataIndex: 'customerName',
      width: 160,
    },
    {
      title: '仓库',
      dataIndex: 'warehouseName',
      width: 120,
    },
    {
      title: '含税金额',
      dataIndex: 'totalAmount',
      width: 140,
      align: 'right',
      render: (value: string) => money(value),
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
      title: '创建时间',
      dataIndex: 'createdAt',
      width: 180,
      render: (value: string) => new Date(value).toLocaleString('zh-CN'),
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
              title="审核该订单？"
              description="审核只改状态，不扣库存；库存扣减在发货出库时发生。"
              okText="审核"
              cancelText="取消"
              onConfirm={() => auditMutation.mutate(record.id)}
            >
              <Button type="link" size="small">
                审核
              </Button>
            </Popconfirm>
          )}
          {record.status === 1 && (
            <Popconfirm
              title="关闭该订单？"
              description="只有全部明细发货后才能关闭。"
              okText="关闭"
              cancelText="取消"
              onConfirm={() => closeMutation.mutate(record.id)}
            >
              <Button type="link" size="small">
                关闭
              </Button>
            </Popconfirm>
          )}
        </Space>
      ),
    },
  ]

  const lineColumns: TableColumnsType<SalesOrderLine> = [
    { title: '物料编码', dataIndex: 'materialCode', width: 130 },
    { title: '物料名称', dataIndex: 'materialName', width: 160 },
    {
      title: '数量',
      dataIndex: 'quantity',
      width: 110,
      align: 'right',
      render: (value: string) => quantity(value),
    },
    {
      title: '已发货',
      dataIndex: 'deliveredQty',
      width: 110,
      align: 'right',
      render: (value: string | null) => quantity(value),
    },
    {
      title: '未发货',
      key: 'pendingQty',
      width: 110,
      align: 'right',
      render: (_, record) =>
        quantity(Number(record.quantity) - Number(record.deliveredQty ?? 0)),
    },
    {
      title: '含税单价',
      dataIndex: 'taxUnitPrice',
      width: 120,
      align: 'right',
      render: (value: string) => money(value),
    },
    {
      title: '税率(%)',
      dataIndex: 'taxRate',
      width: 90,
      align: 'right',
    },
    {
      title: '金额',
      dataIndex: 'amount',
      width: 130,
      align: 'right',
      render: (value: string) => money(value),
    },
  ]

  return (
    <div className="page">
      <div className="page-heading">
        <div>
          <Typography.Title level={3}>销售订单</Typography.Title>
          <Typography.Text type="secondary">
            审核只改状态；发货出库时才扣库存并写流水。
          </Typography.Text>
        </div>
        <Space wrap>
          <Input
            allowClear
            prefix={<SearchOutlined />}
            placeholder="订单号 / 客户"
            value={keywordInput}
            onChange={(event) => setKeywordInput(event.target.value)}
            onPressEnter={() => {
              setKeyword(keywordInput.trim())
              setCurrent(1)
            }}
            style={{ width: 220 }}
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
              { value: 0, label: '草稿' },
              { value: 1, label: '已审核' },
              { value: 2, label: '已关闭' },
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
            onClick={() => queryClient.invalidateQueries({ queryKey: ['sales-orders'] })}
          >
            刷新
          </Button>
          <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>
            新增订单
          </Button>
        </Space>
      </div>

      <Table<SalesOrder>
        rowKey="id"
        loading={orders.isLoading}
        columns={columns}
        dataSource={orders.data?.records ?? []}
        scroll={{ x: 1180 }}
        pagination={{
          current,
          pageSize: size,
          total: orders.data?.total ?? 0,
          showSizeChanger: true,
          showTotal: (total) => `共 ${total} 条`,
          onChange: (nextPage, nextSize) => {
            setCurrent(nextPage)
            setSize(nextSize)
          },
        }}
      />

      <Modal
        title="新增销售订单"
        open={open}
        width={1000}
        onOk={submit}
        confirmLoading={createMutation.isPending}
        onCancel={() => setOpen(false)}
        okText="保存草稿"
        cancelText="取消"
        destroyOnHidden
      >
        <Form form={form} layout="vertical" initialValues={{ lines: [defaultLine] }}>
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item
                name="customerId"
                label="客户"
                rules={[{ required: true, message: '请选择客户' }]}
              >
                <Select
                  showSearch
                  optionFilterProp="label"
                  options={customerOptions}
                  placeholder="选择客户"
                />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="warehouseId"
                label="发货仓库"
                rules={[{ required: true, message: '请选择仓库' }]}
              >
                <Select
                  options={warehouseOptions}
                  placeholder="选择仓库"
                />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="orderDate"
                label="订单日期"
                rules={[{ required: true, message: '请选择订单日期' }]}
              >
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item name="remark" label="备注">
            <Input maxLength={255} placeholder="可选" />
          </Form.Item>

          <Divider>订单明细</Divider>
          <Form.List name="lines">
            {(fields, { add, remove }) => (
              <>
                {fields.map(({ key, name, ...restField }) => (
                  <Row key={key} gutter={8}>
                    <Col span={9}>
                      <Form.Item
                        {...restField}
                        name={[name, 'materialId']}
                        label="物料"
                        rules={[{ required: true, message: '请选择物料' }]}
                      >
                        <Select
                          showSearch
                          optionFilterProp="label"
                          options={materialOptions}
                          placeholder="选择物料"
                        />
                      </Form.Item>
                    </Col>
                    <Col span={5}>
                      <Form.Item
                        {...restField}
                        name={[name, 'quantity']}
                        label="数量"
                        rules={[{ required: true, message: '请输入数量' }]}
                      >
                        <InputNumber
                          min={0.000001}
                          precision={6}
                          style={{ width: '100%' }}
                        />
                      </Form.Item>
                    </Col>
                    <Col span={5}>
                      <Form.Item
                        {...restField}
                        name={[name, 'taxUnitPrice']}
                        label="含税单价"
                        rules={[{ required: true, message: '请输入单价' }]}
                      >
                        <InputNumber
                          min={0}
                          precision={6}
                          style={{ width: '100%' }}
                        />
                      </Form.Item>
                    </Col>
                    <Col span={3}>
                      <Form.Item
                        {...restField}
                        name={[name, 'taxRate']}
                        label="税率(%)"
                        rules={[{ required: true, message: '请输入税率' }]}
                      >
                        <InputNumber
                          min={0}
                          max={100}
                          precision={2}
                          style={{ width: '100%' }}
                        />
                      </Form.Item>
                    </Col>
                    <Col span={2}>
                      <Form.Item label=" ">
                        <Button
                          danger
                          type="text"
                          disabled={fields.length === 1}
                          onClick={() => remove(name)}
                        >
                          删除
                        </Button>
                      </Form.Item>
                    </Col>
                  </Row>
                ))}
                <Button
                  type="dashed"
                  block
                  icon={<PlusOutlined />}
                  onClick={() => add({ ...defaultLine })}
                >
                  添加明细
                </Button>
              </>
            )}
          </Form.List>

          <div className="order-total-preview">
            含税合计：<strong>¥ {money(totalPreview)}</strong>
          </div>
        </Form>
      </Modal>

      <Modal
        title={detail.data?.orderNo ?? '订单详情'}
        open={detailId !== null}
        width={860}
        footer={
          detail.data ? (
            <Space>
              <Button onClick={() => setDetailId(null)}>关闭</Button>
              <Button
                type="primary"
                icon={<PrinterOutlined />}
                onClick={() =>
                  window.open(`/print/sales-order/${detail.data?.id}`, '_blank')
                }
              >
                打印订单
              </Button>
            </Space>
          ) : null
        }
        onCancel={() => setDetailId(null)}
        destroyOnHidden
      >
        {detail.data && (
          <>
            <Descriptions
              size="small"
              column={3}
              items={[
                { key: 'customer', label: '客户', children: detail.data.customerName },
                { key: 'warehouse', label: '仓库', children: detail.data.warehouseName },
                {
                  key: 'status',
                  label: '状态',
                  children: (
                    <Tag color={statusMeta[detail.data.status]?.color}>
                      {statusMeta[detail.data.status]?.label}
                    </Tag>
                  ),
                },
                { key: 'date', label: '订单日期', children: detail.data.orderDate },
                {
                  key: 'amount',
                  label: '含税金额',
                  children: `¥ ${money(detail.data.totalAmount)}`,
                },
                { key: 'remark', label: '备注', children: detail.data.remark || '-' },
              ]}
            />
            <Divider />
            <Table<SalesOrderLine>
              rowKey="id"
              size="small"
              pagination={false}
              columns={lineColumns}
              dataSource={detail.data.lines ?? []}
            />
            <Divider>审批记录</Divider>
            <ApprovalTimeline bizType="SALES_ORDER" bizId={detail.data.id} />
          </>
        )}
      </Modal>
    </div>
  )
}
