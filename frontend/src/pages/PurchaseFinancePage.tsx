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
import { listSettleMethods, listSuppliers } from '../api/master'
import {
  createPayment,
  createPurchaseInvoice,
  getPayment,
  getPurchaseInvoice,
  listPayables,
  listPayments,
  listPurchaseInvoices,
  listPurchaseReceipts,
  type Payable,
  type Payment,
  type PaymentDetail,
  type PurchaseInvoice,
  type PurchaseInvoiceLine,
  type PurchaseReceipt,
} from '../api/purchase-chain'

interface InvoiceFormValues {
  receiptId: number
  invoiceDate: Dayjs
  remark?: string
}

interface PaymentLineForm {
  payableId: number
  amount: number
}

interface PaymentFormValues {
  supplierId: number
  paymentDate: Dayjs
  settleMethodId?: number
  amount: number
  remark?: string
  details: PaymentLineForm[]
}

const documentStatus: Record<number, { color: string; label: string }> = {
  0: { color: 'processing', label: '未结算' },
  1: { color: 'warning', label: '部分结算' },
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

function PurchaseInvoicesTab() {
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
    queryKey: ['purchase-invoices', current, size, keyword],
    queryFn: () => listPurchaseInvoices({ current, size, keyword }),
    placeholderData: (previous) => previous,
  })
  const detail = useQuery({
    queryKey: ['purchase-invoice', detailId],
    queryFn: () => getPurchaseInvoice(detailId as number),
    enabled: detailId !== null,
  })
  const receivedReceipts = useQuery({
    queryKey: ['purchase-receipts', 'invoicable'],
    queryFn: () => listPurchaseReceipts({ current: 1, size: 100, status: 1 }),
  })

  const invoicedIds = new Set(
    (invoices.data?.records ?? []).map((invoice) => invoice.receiptId),
  )
  const receiptOptions = (receivedReceipts.data?.records ?? [])
    .filter((receipt: PurchaseReceipt) => !invoicedIds.has(receipt.id))
    .map((receipt: PurchaseReceipt) => ({
      value: receipt.id,
      label: `${receipt.receiptNo} ${receipt.supplierName}`,
    }))

  const createMutation = useMutation({
    mutationFn: (values: InvoiceFormValues) =>
      createPurchaseInvoice({
        receiptId: values.receiptId,
        invoiceDate: values.invoiceDate.format('YYYY-MM-DD'),
        remark: values.remark,
      }),
    onSuccess: () => {
      message.success('采购发票已开具，应付单已生成')
      setOpen(false)
      queryClient.invalidateQueries({ queryKey: ['purchase-invoices'] })
      queryClient.invalidateQueries({ queryKey: ['payables'] })
    },
    onError: (error: Error) => message.error(error.message),
  })

  const openCreate = () => {
    form.resetFields()
    form.setFieldsValue({
      receiptId: receiptOptions[0]?.value,
      invoiceDate: dayjs(),
      remark: '',
    })
    setOpen(true)
  }

  const submit = async () => {
    createMutation.mutate(await form.validateFields())
  }

  const columns: TableColumnsType<PurchaseInvoice> = [
    { title: '发票号', dataIndex: 'invoiceNo', width: 190, fixed: 'left' },
    { title: '开票日期', dataIndex: 'invoiceDate', width: 120 },
    { title: '收货单', dataIndex: 'receiptNo', width: 180 },
    { title: '采购订单', dataIndex: 'orderNo', width: 180 },
    { title: '供应商', dataIndex: 'supplierName', width: 140 },
    { title: '应付单', dataIndex: 'payableNo', width: 170, render: (value: string | null) => value || '-' },
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

  const lineColumns: TableColumnsType<PurchaseInvoiceLine> = [
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
            placeholder="发票号 / 收货单 / 供应商"
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
            onClick={() => queryClient.invalidateQueries({ queryKey: ['purchase-invoices'] })}
          >
            刷新
          </Button>
          <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>
            开具发票
          </Button>
        </Space>
      </div>

      <Table<PurchaseInvoice>
        rowKey="id"
        loading={invoices.isLoading}
        columns={columns}
        dataSource={invoices.data?.records ?? []}
        scroll={{ x: 1320 }}
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
        title="开具采购发票"
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
            name="receiptId"
            label="收货单"
            rules={[{ required: true, message: '请选择收货单' }]}
          >
            <Select
              showSearch
              optionFilterProp="label"
              options={receiptOptions}
              placeholder="选择已入库收货单"
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
        title={detail.data?.invoiceNo ?? '采购发票详情'}
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
                { key: 'receipt', label: '收货单', children: detail.data.receiptNo },
                { key: 'order', label: '采购订单', children: detail.data.orderNo },
                { key: 'supplier', label: '供应商', children: detail.data.supplierName },
                { key: 'date', label: '开票日期', children: detail.data.invoiceDate },
                {
                  key: 'total',
                  label: '含税金额',
                  children: `¥ ${money(detail.data.totalAmount)}`,
                },
                { key: 'tax', label: '税额', children: `¥ ${money(detail.data.taxAmount)}` },
                { key: 'payable', label: '应付单', children: detail.data.payableNo || '-' },
              ]}
            />
            <Divider />
            <Table<PurchaseInvoiceLine>
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

function PayablesTab() {
  const queryClient = useQueryClient()
  const [current, setCurrent] = useState(1)
  const [size, setSize] = useState(10)
  const [keywordInput, setKeywordInput] = useState('')
  const [keyword, setKeyword] = useState('')
  const [statusFilter, setStatusFilter] = useState<number | undefined>()

  const payables = useQuery({
    queryKey: ['payables', current, size, keyword, statusFilter],
    queryFn: () => listPayables({ current, size, keyword, status: statusFilter }),
    placeholderData: (previous) => previous,
  })

  const outstanding = (payables.data?.records ?? []).reduce(
    (sum, item) => sum + Number(item.balance),
    0,
  )

  const columns: TableColumnsType<Payable> = [
    { title: '应付单号', dataIndex: 'payableNo', width: 170, fixed: 'left' },
    { title: '发票号', dataIndex: 'invoiceNo', width: 190 },
    { title: '供应商', dataIndex: 'supplierName', width: 150 },
    { title: '开票日期', dataIndex: 'invoiceDate', width: 120 },
    {
      title: '应付金额',
      dataIndex: 'totalAmount',
      width: 130,
      align: 'right',
      render: (value: string) => money(value),
    },
    {
      title: '已付金额',
      dataIndex: 'paidAmount',
      width: 130,
      align: 'right',
      render: (value: string) => money(value),
    },
    {
      title: '未付余额',
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
        const meta = documentStatus[value] ?? documentStatus[0]
        return <Tag color={meta.color}>{meta.label}</Tag>
      },
    },
  ]

  return (
    <>
      <div className="tab-toolbar">
        <Space wrap>
          <Typography.Text type="secondary">
            当前页未付余额合计：¥ {money(outstanding)}
          </Typography.Text>
          <Input
            allowClear
            prefix={<SearchOutlined />}
            placeholder="应付单 / 发票 / 供应商"
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
              { value: 0, label: '未付款' },
              { value: 1, label: '部分付款' },
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
            onClick={() => queryClient.invalidateQueries({ queryKey: ['payables'] })}
          >
            刷新
          </Button>
        </Space>
      </div>

      <Table<Payable>
        rowKey="id"
        loading={payables.isLoading}
        columns={columns}
        dataSource={payables.data?.records ?? []}
        scroll={{ x: 1120 }}
        pagination={{
          current,
          pageSize: size,
          total: payables.data?.total ?? 0,
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

function PaymentsTab() {
  const { message } = App.useApp()
  const queryClient = useQueryClient()
  const [form] = Form.useForm<PaymentFormValues>()

  const [current, setCurrent] = useState(1)
  const [size, setSize] = useState(10)
  const [keywordInput, setKeywordInput] = useState('')
  const [keyword, setKeyword] = useState('')
  const [open, setOpen] = useState(false)
  const [detailId, setDetailId] = useState<number | null>(null)
  const [supplierId, setSupplierId] = useState<number | undefined>()

  const watchedDetails = Form.useWatch('details', form) ?? []
  const writeOffTotal = watchedDetails.reduce(
    (sum, detail) => sum + Number(detail?.amount ?? 0),
    0,
  )

  const payments = useQuery({
    queryKey: ['payments', current, size, keyword],
    queryFn: () => listPayments({ current, size, keyword }),
    placeholderData: (previous) => previous,
  })
  const detail = useQuery({
    queryKey: ['payment', detailId],
    queryFn: () => getPayment(detailId as number),
    enabled: detailId !== null,
  })
  const suppliers = useQuery({ queryKey: ['suppliers'], queryFn: listSuppliers })
  const settleMethods = useQuery({
    queryKey: ['settle-methods'],
    queryFn: listSettleMethods,
  })
  const openPayables = useQuery({
    queryKey: ['payables', 'open', supplierId],
    queryFn: () => listPayables({ current: 1, size: 100, supplierId, openOnly: true }),
    enabled: open && supplierId !== undefined,
  })

  const supplierOptions = (suppliers.data ?? []).map((supplier) => ({
    value: supplier.id,
    label: `${supplier.supplierCode} ${supplier.supplierName}`,
  }))
  const payableOptions = (openPayables.data?.records ?? []).map((item: Payable) => ({
    value: item.id,
    label: `${item.payableNo}（${item.invoiceNo}，余额 ${money(item.balance)}）`,
  }))

  const createMutation = useMutation({
    mutationFn: (values: PaymentFormValues) =>
      createPayment({
        supplierId: values.supplierId,
        paymentDate: values.paymentDate.format('YYYY-MM-DD'),
        settleMethodId: values.settleMethodId ?? null,
        amount: values.amount,
        remark: values.remark,
        details: values.details,
      }),
    onSuccess: () => {
      message.success('付款已登记，应付已核销')
      setOpen(false)
      queryClient.invalidateQueries({ queryKey: ['payments'] })
      queryClient.invalidateQueries({ queryKey: ['payables'] })
    },
    onError: (error: Error) => message.error(error.message),
  })

  const openCreate = () => {
    form.resetFields()
    const firstSupplier = supplierOptions[0]?.value
    setSupplierId(firstSupplier)
    form.setFieldsValue({
      supplierId: firstSupplier,
      paymentDate: dayjs(),
      amount: 0,
      remark: '',
      details: [],
    })
    setOpen(true)
  }

  const pickSupplier = (value: number) => {
    setSupplierId(value)
    form.setFieldsValue({ supplierId: value, details: [], amount: 0 })
  }

  const fillFullBalance = () => {
    const rows = (openPayables.data?.records ?? []).map((item) => ({
      payableId: item.id,
      amount: Number(item.balance),
    }))
    form.setFieldsValue({
      details: rows,
      amount: rows.reduce((sum, row) => sum + row.amount, 0),
    })
  }

  const submit = async () => {
    const values = await form.validateFields()
    if (!values.details || values.details.length === 0) {
      message.warning('至少选择一条核销明细')
      return
    }
    createMutation.mutate(values)
  }

  const columns: TableColumnsType<Payment> = [
    { title: '付款单号', dataIndex: 'paymentNo', width: 180, fixed: 'left' },
    { title: '付款日期', dataIndex: 'paymentDate', width: 120 },
    { title: '供应商', dataIndex: 'supplierName', width: 150 },
    {
      title: '结算方式',
      dataIndex: 'settleMethodName',
      width: 120,
      render: (value: string | null) => value || '-',
    },
    {
      title: '付款金额',
      dataIndex: 'amount',
      width: 130,
      align: 'right',
      render: (value: string) => money(value),
    },
    {
      title: '已核销',
      dataIndex: 'usedAmount',
      width: 130,
      align: 'right',
      render: (value: string) => money(value),
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

  const detailColumns: TableColumnsType<PaymentDetail> = [
    { title: '应付单号', dataIndex: 'payableNo', width: 180 },
    { title: '发票号', dataIndex: 'invoiceNo', width: 190 },
    {
      title: '核销金额',
      dataIndex: 'amount',
      width: 130,
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
            placeholder="付款单号 / 供应商"
            value={keywordInput}
            onChange={(event) => setKeywordInput(event.target.value)}
            onPressEnter={() => {
              setKeyword(keywordInput.trim())
              setCurrent(1)
            }}
            style={{ width: 220 }}
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
            onClick={() => queryClient.invalidateQueries({ queryKey: ['payments'] })}
          >
            刷新
          </Button>
          <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>
            登记付款
          </Button>
        </Space>
      </div>

      <Table<Payment>
        rowKey="id"
        loading={payments.isLoading}
        columns={columns}
        dataSource={payments.data?.records ?? []}
        scroll={{ x: 1020 }}
        pagination={{
          current,
          pageSize: size,
          total: payments.data?.total ?? 0,
          showSizeChanger: true,
          showTotal: (total) => `共 ${total} 条`,
          onChange: (nextPage, nextSize) => {
            setCurrent(nextPage)
            setSize(nextSize)
          },
        }}
      />

      <Modal
        title="登记付款"
        open={open}
        width={900}
        onOk={submit}
        confirmLoading={createMutation.isPending}
        onCancel={() => setOpen(false)}
        okText="确认付款"
        cancelText="取消"
        destroyOnHidden
      >
        <Form form={form} layout="vertical">
          <Row gutter={16}>
            <Col span={10}>
              <Form.Item
                name="supplierId"
                label="供应商"
                rules={[{ required: true, message: '请选择供应商' }]}
              >
                <Select
                  showSearch
                  optionFilterProp="label"
                  options={supplierOptions}
                  onChange={pickSupplier}
                />
              </Form.Item>
            </Col>
            <Col span={7}>
              <Form.Item
                name="paymentDate"
                label="付款日期"
                rules={[{ required: true, message: '请选择付款日期' }]}
              >
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={7}>
              <Form.Item name="settleMethodId" label="结算方式">
                <Select
                  allowClear
                  options={(settleMethods.data ?? []).map((item) => ({
                    value: item.id,
                    label: `${item.methodCode} ${item.methodName}`,
                  }))}
                />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={10}>
              <Form.Item
                name="amount"
                label="付款金额"
                rules={[{ required: true, message: '请输入付款金额' }]}
              >
                <InputNumber min={0.000001} precision={6} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={14}>
              <Form.Item label=" ">
                <Space>
                  <Button onClick={fillFullBalance} disabled={payableOptions.length === 0}>
                    按余额全部核销
                  </Button>
                  <Typography.Text type="secondary">
                    已填核销：¥ {money(writeOffTotal)}
                  </Typography.Text>
                </Space>
              </Form.Item>
            </Col>
          </Row>

          <Form.Item name="remark" label="备注">
            <Input maxLength={255} placeholder="可选" />
          </Form.Item>

          <Divider>核销明细</Divider>
          <Form.List name="details">
            {(fields) => (
              <Table
                size="small"
                pagination={false}
                rowKey="key"
                dataSource={fields}
                columns={[
                  {
                    title: '应付单',
                    render: (_, field) => (
                      <Form.Item
                        noStyle
                        name={[field.name, 'payableId']}
                        rules={[{ required: true }]}
                      >
                        <Select
                          showSearch
                          optionFilterProp="label"
                          style={{ width: '100%' }}
                          options={payableOptions}
                        />
                      </Form.Item>
                    ),
                  },
                  {
                    title: '核销金额',
                    width: 180,
                    render: (_, field) => (
                      <Form.Item noStyle name={[field.name, 'amount']} rules={[{ required: true }]}>
                        <InputNumber min={0.000001} precision={6} style={{ width: '100%' }} />
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
        title={detail.data?.paymentNo ?? '付款单详情'}
        open={detailId !== null}
        width={760}
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
                { key: 'supplier', label: '供应商', children: detail.data.supplierName },
                { key: 'date', label: '付款日期', children: detail.data.paymentDate },
                {
                  key: 'method',
                  label: '结算方式',
                  children: detail.data.settleMethodName || '-',
                },
                {
                  key: 'amount',
                  label: '付款金额',
                  children: `¥ ${money(detail.data.amount)}`,
                },
                {
                  key: 'used',
                  label: '已核销',
                  children: `¥ ${money(detail.data.usedAmount)}`,
                },
                { key: 'remark', label: '备注', children: detail.data.remark || '-' },
              ]}
            />
            <Divider />
            <Table<PaymentDetail>
              rowKey="id"
              size="small"
              pagination={false}
              columns={detailColumns}
              dataSource={detail.data.details ?? []}
            />
          </>
        )}
      </Modal>
    </>
  )
}

export default function PurchaseFinancePage() {
  return (
    <div className="page">
      <div className="page-heading">
        <div>
          <Typography.Title level={3}>采购发票与应付</Typography.Title>
          <Typography.Text type="secondary">
            按已入库收货单开票生成应付，付款后按应付单核销。
          </Typography.Text>
        </div>
      </div>

      <Tabs
        items={[
          { key: 'invoices', label: '采购发票', children: <PurchaseInvoicesTab /> },
          { key: 'payables', label: '应付单', children: <PayablesTab /> },
          { key: 'payments', label: '付款与核销', children: <PaymentsTab /> },
        ]}
      />
    </div>
  )
}
