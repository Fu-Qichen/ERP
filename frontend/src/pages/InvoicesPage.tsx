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
  Modal,
  Row,
  Select,
  Space,
  Table,
  Tabs,
  Tag,
  Typography,
  type TableColumnsType,
} from 'antd'
import { PlusOutlined, ReloadOutlined, SearchOutlined } from '@ant-design/icons'
import dayjs, { type Dayjs } from 'dayjs'
import { useState } from 'react'
import { listDeliveries, type Delivery } from '../api/delivery'
import {
  createInvoice,
  getInvoice,
  listInvoices,
  listReceivables,
  type Invoice,
  type InvoiceLine,
  type Receivable,
} from '../api/invoice'

interface InvoiceFormValues {
  deliveryId: number
  invoiceDate: Dayjs
  remark?: string
}

const invoiceStatus: Record<number, { color: string; label: string }> = {
  0: { color: 'success', label: '已开票' },
  1: { color: 'default', label: '已作废' },
}

const receivableStatus: Record<number, { color: string; label: string }> = {
  0: { color: 'processing', label: '未收款' },
  1: { color: 'warning', label: '部分收款' },
  2: { color: 'success', label: '已结清' },
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
  return Number(value).toLocaleString('zh-CN', { maximumFractionDigits: 6 })
}

function InvoicesTab() {
  const { message } = App.useApp()
  const queryClient = useQueryClient()
  const [form] = Form.useForm<InvoiceFormValues>()

  const [current, setCurrent] = useState(1)
  const [size, setSize] = useState(10)
  const [keywordInput, setKeywordInput] = useState('')
  const [keyword, setKeyword] = useState('')
  const [open, setOpen] = useState(false)
  const [detailId, setDetailId] = useState<number | null>(null)

  const invoices = useQuery({
    queryKey: ['invoices', current, size, keyword],
    queryFn: () => listInvoices({ current, size, keyword }),
    placeholderData: (previous) => previous,
  })
  const detail = useQuery({
    queryKey: ['invoice', detailId],
    queryFn: () => getInvoice(detailId as number),
    enabled: detailId !== null,
  })
  const shippedDeliveries = useQuery({
    queryKey: ['deliveries', 'invoicable'],
    queryFn: () => listDeliveries({ current: 1, size: 100, status: 1 }),
  })

  const invoicedDeliveryIds = new Set(
    (invoices.data?.records ?? []).map((invoice) => invoice.deliveryId),
  )
  const deliveryOptions = (shippedDeliveries.data?.records ?? [])
    .filter((delivery) => !invoicedDeliveryIds.has(delivery.id))
    .map((delivery: Delivery) => ({
      value: delivery.id,
      label: `${delivery.deliveryNo} ${delivery.customerName}`,
    }))

  const createMutation = useMutation({
    mutationFn: (values: InvoiceFormValues) =>
      createInvoice({
        deliveryId: values.deliveryId,
        invoiceDate: values.invoiceDate.format('YYYY-MM-DD'),
        remark: values.remark,
      }),
    onSuccess: () => {
      message.success('发票已开具，应收单已生成')
      setOpen(false)
      queryClient.invalidateQueries({ queryKey: ['invoices'] })
      queryClient.invalidateQueries({ queryKey: ['receivables'] })
      queryClient.invalidateQueries({ queryKey: ['deliveries'] })
    },
    onError: (error: Error) => message.error(error.message),
  })

  const openCreate = () => {
    form.resetFields()
    form.setFieldsValue({
      deliveryId: deliveryOptions[0]?.value,
      invoiceDate: dayjs(),
      remark: '',
    })
    setOpen(true)
  }

  const submit = async () => {
    createMutation.mutate(await form.validateFields())
  }

  const columns: TableColumnsType<Invoice> = [
    { title: '发票号', dataIndex: 'invoiceNo', width: 180, fixed: 'left' },
    { title: '开票日期', dataIndex: 'invoiceDate', width: 120 },
    { title: '发货单', dataIndex: 'deliveryNo', width: 180 },
    { title: '订单号', dataIndex: 'orderNo', width: 180 },
    { title: '客户', dataIndex: 'customerName', width: 140 },
    {
      title: '含税金额',
      dataIndex: 'totalAmount',
      width: 130,
      align: 'right',
      render: (value: string) => money(value),
    },
    {
      title: '税额',
      dataIndex: 'taxAmount',
      width: 120,
      align: 'right',
      render: (value: string) => money(value),
    },
    {
      title: '应收单',
      dataIndex: 'receivableNo',
      width: 190,
      render: (value: string | null) =>
        value ? (
          <Typography.Text copyable={{ text: value }} style={{ fontSize: 12 }}>
            {value}
          </Typography.Text>
        ) : (
          '-'
        ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      width: 100,
      render: (value: number) => {
        const meta = invoiceStatus[value] ?? invoiceStatus[0]
        return <Tag color={meta.color}>{meta.label}</Tag>
      },
    },
    {
      title: '操作',
      key: 'action',
      width: 90,
      fixed: 'right',
      render: (_, record) => (
        <Button type="link" size="small" onClick={() => setDetailId(record.id)}>
          详情
        </Button>
      ),
    },
  ]

  const lineColumns: TableColumnsType<InvoiceLine> = [
    { title: '物料编码', dataIndex: 'materialCode', width: 130 },
    { title: '物料名称', dataIndex: 'materialName', width: 150 },
    {
      title: '数量',
      dataIndex: 'quantity',
      width: 100,
      align: 'right',
      render: (value: string) => quantity(value),
    },
    {
      title: '含税单价',
      dataIndex: 'taxUnitPrice',
      width: 110,
      align: 'right',
      render: (value: string) => money(value),
    },
    { title: '税率(%)', dataIndex: 'taxRate', width: 90, align: 'right' },
    {
      title: '含税金额',
      dataIndex: 'amount',
      width: 120,
      align: 'right',
      render: (value: string) => money(value),
    },
    {
      title: '税额',
      dataIndex: 'taxAmount',
      width: 110,
      align: 'right',
      render: (value: string) => money(value),
    },
  ]

  return (
    <>
      <div className="tab-toolbar">
        <Space wrap>
          <Input
            allowClear
            prefix={<SearchOutlined />}
            placeholder="发票号 / 发货单 / 客户"
            value={keywordInput}
            onChange={(event) => setKeywordInput(event.target.value)}
            onPressEnter={() => {
              setKeyword(keywordInput.trim())
              setCurrent(1)
            }}
            style={{ width: 240 }}
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
            onClick={() => queryClient.invalidateQueries({ queryKey: ['invoices'] })}
          >
            刷新
          </Button>
          <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>
            开具发票
          </Button>
        </Space>
      </div>

      <Table<Invoice>
        rowKey="id"
        loading={invoices.isLoading}
        columns={columns}
        dataSource={invoices.data?.records ?? []}
        scroll={{ x: 1400 }}
        pagination={{
          current,
          pageSize: size,
          total: invoices.data?.total ?? 0,
          showSizeChanger: true,
          showTotal: (total) => `共 ${total} 条`,
          onChange: (nextPage, nextSize) => {
            setCurrent(nextPage)
            setSize(nextSize)
          },
        }}
      />

      <Modal
        title="开具销售发票"
        open={open}
        onOk={submit}
        confirmLoading={createMutation.isPending}
        onCancel={() => setOpen(false)}
        okText="开票"
        cancelText="取消"
        destroyOnHidden
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="deliveryId"
            label="发货单"
            rules={[{ required: true, message: '请选择发货单' }]}
          >
            <Select
              showSearch
              optionFilterProp="label"
              options={deliveryOptions}
              placeholder="选择已出库发货单"
            />
          </Form.Item>
          <Form.Item
            name="invoiceDate"
            label="开票日期"
            rules={[{ required: true, message: '请选择开票日期' }]}
          >
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="remark" label="备注">
            <Input maxLength={255} placeholder="可选" />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title={detail.data?.invoiceNo ?? '发票详情'}
        open={detailId !== null}
        width={900}
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
                { key: 'delivery', label: '发货单', children: detail.data.deliveryNo },
                { key: 'order', label: '订单号', children: detail.data.orderNo },
                { key: 'customer', label: '客户', children: detail.data.customerName },
                { key: 'date', label: '开票日期', children: detail.data.invoiceDate },
                {
                  key: 'total',
                  label: '含税金额',
                  children: `¥ ${money(detail.data.totalAmount)}`,
                },
                {
                  key: 'tax',
                  label: '税额',
                  children: `¥ ${money(detail.data.taxAmount)}`,
                },
                { key: 'receivable', label: '应收单', children: detail.data.receivableNo || '-' },
              ]}
            />
            <Divider />
            <Table<InvoiceLine>
              rowKey="id"
              size="small"
              pagination={false}
              columns={lineColumns}
              dataSource={detail.data.lines ?? []}
            />
          </>
        )}
      </Modal>
    </>
  )
}

function ReceivablesTab() {
  const queryClient = useQueryClient()
  const [current, setCurrent] = useState(1)
  const [size, setSize] = useState(10)
  const [keywordInput, setKeywordInput] = useState('')
  const [keyword, setKeyword] = useState('')
  const [statusFilter, setStatusFilter] = useState<number | undefined>()

  const receivables = useQuery({
    queryKey: ['receivables', current, size, keyword, statusFilter],
    queryFn: () => listReceivables({ current, size, keyword, status: statusFilter }),
    placeholderData: (previous) => previous,
  })

  const outstanding = (receivables.data?.records ?? []).reduce(
    (sum, item) => sum + Number(item.balance),
    0,
  )

  const columns: TableColumnsType<Receivable> = [
    { title: '应收单号', dataIndex: 'receivableNo', width: 180, fixed: 'left' },
    { title: '发票号', dataIndex: 'invoiceNo', width: 180 },
    { title: '客户', dataIndex: 'customerName', width: 150 },
    { title: '开票日期', dataIndex: 'invoiceDate', width: 120 },
    {
      title: '应收金额',
      dataIndex: 'totalAmount',
      width: 130,
      align: 'right',
      render: (value: string) => money(value),
    },
    {
      title: '已收金额',
      dataIndex: 'paidAmount',
      width: 130,
      align: 'right',
      render: (value: string) => money(value),
    },
    {
      title: '未收余额',
      dataIndex: 'balance',
      width: 130,
      align: 'right',
      render: (value: string) => money(value),
    },
    {
      title: '状态',
      dataIndex: 'status',
      width: 100,
      render: (value: number) => {
        const meta = receivableStatus[value] ?? receivableStatus[0]
        return <Tag color={meta.color}>{meta.label}</Tag>
      },
    },
  ]

  return (
    <>
      <div className="tab-toolbar">
        <Space wrap>
          <Typography.Text type="secondary">
            当前页未收余额合计：¥ {money(outstanding)}
          </Typography.Text>
          <Input
            allowClear
            prefix={<SearchOutlined />}
            placeholder="应收单 / 发票 / 客户"
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
              { value: 0, label: '未收款' },
              { value: 1, label: '部分收款' },
              { value: 2, label: '已结清' },
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
            onClick={() => queryClient.invalidateQueries({ queryKey: ['receivables'] })}
          >
            刷新
          </Button>
        </Space>
      </div>

      <Table<Receivable>
        rowKey="id"
        loading={receivables.isLoading}
        columns={columns}
        dataSource={receivables.data?.records ?? []}
        scroll={{ x: 1120 }}
        pagination={{
          current,
          pageSize: size,
          total: receivables.data?.total ?? 0,
          showSizeChanger: true,
          showTotal: (total) => `共 ${total} 条`,
          onChange: (nextPage, nextSize) => {
            setCurrent(nextPage)
            setSize(nextSize)
          },
        }}
      />
    </>
  )
}

export default function InvoicesPage() {
  return (
    <div className="page">
      <div className="page-heading">
        <div>
          <Typography.Title level={3}>销售发票与应收</Typography.Title>
          <Typography.Text type="secondary">
            按已出库发货单开票，开票后自动生成应收单。
          </Typography.Text>
        </div>
      </div>

      <Row>
        <Col span={24}>
          <Tabs
            items={[
              { key: 'invoices', label: '销售发票', children: <InvoicesTab /> },
              { key: 'receivables', label: '应收单', children: <ReceivablesTab /> },
            ]}
          />
        </Col>
      </Row>
    </div>
  )
}
