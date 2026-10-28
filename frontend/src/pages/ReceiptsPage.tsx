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
  Tag,
  Typography,
  type TableColumnsType,
} from 'antd'
import { PlusOutlined, ReloadOutlined, SearchOutlined } from '@ant-design/icons'
import dayjs, { type Dayjs } from 'dayjs'
import { useState } from 'react'
import { listCustomers, listSettleMethods } from '../api/master'
import { listReceivables, type Receivable } from '../api/invoice'
import {
  createReceipt,
  getReceipt,
  listReceipts,
  type Receipt,
  type ReceiptDetail,
} from '../api/receipt'

interface WriteOffRow {
  receivableId: number
  amount: number
}

interface ReceiptFormValues {
  customerId: number
  receiptDate: Dayjs
  settleMethodId?: number
  amount: number
  remark?: string
  details: WriteOffRow[]
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

export default function ReceiptsPage() {
  const { message } = App.useApp()
  const queryClient = useQueryClient()
  const [form] = Form.useForm<ReceiptFormValues>()

  const [current, setCurrent] = useState(1)
  const [size, setSize] = useState(10)
  const [keywordInput, setKeywordInput] = useState('')
  const [keyword, setKeyword] = useState('')
  const [open, setOpen] = useState(false)
  const [detailId, setDetailId] = useState<number | null>(null)
  const [customerId, setCustomerId] = useState<number | undefined>()

  const watchedDetails = Form.useWatch('details', form) ?? []
  const writeOffTotal = watchedDetails.reduce(
    (sum, detail) => sum + Number(detail?.amount ?? 0),
    0,
  )

  const receipts = useQuery({
    queryKey: ['receipts', current, size, keyword],
    queryFn: () => listReceipts({ current, size, keyword }),
    placeholderData: (previous) => previous,
  })
  const detail = useQuery({
    queryKey: ['receipt', detailId],
    queryFn: () => getReceipt(detailId as number),
    enabled: detailId !== null,
  })
  const customers = useQuery({ queryKey: ['customers'], queryFn: listCustomers })
  const settleMethods = useQuery({
    queryKey: ['settle-methods'],
    queryFn: listSettleMethods,
  })
  const openReceivables = useQuery({
    queryKey: ['receivables', 'open', customerId],
    queryFn: () =>
      listReceivables({
        current: 1,
        size: 100,
        customerId,
        openOnly: true,
      }),
    enabled: open && customerId !== undefined,
  })

  const customerOptions = (customers.data ?? []).map((customer) => ({
    value: customer.id,
    label: `${customer.customerCode} ${customer.customerName}`,
  }))
  const receivableOptions = (openReceivables.data?.records ?? []).map(
    (item: Receivable) => ({
      value: item.id,
      label: `${item.receivableNo}（${item.invoiceNo}，余额 ${money(item.balance)}）`,
    }),
  )

  const createMutation = useMutation({
    mutationFn: (values: ReceiptFormValues) =>
      createReceipt({
        customerId: values.customerId,
        receiptDate: values.receiptDate.format('YYYY-MM-DD'),
        settleMethodId: values.settleMethodId ?? null,
        amount: values.amount,
        remark: values.remark,
        details: values.details,
      }),
    onSuccess: () => {
      message.success('收款已登记，应收已核销')
      setOpen(false)
      queryClient.invalidateQueries({ queryKey: ['receipts'] })
      queryClient.invalidateQueries({ queryKey: ['receivables'] })
    },
    onError: (error: Error) => message.error(error.message),
  })

  const openCreate = () => {
    form.resetFields()
    const firstCustomer = customerOptions[0]?.value
    setCustomerId(firstCustomer)
    form.setFieldsValue({
      customerId: firstCustomer,
      receiptDate: dayjs(),
      amount: 0,
      remark: '',
      details: [],
    })
    setOpen(true)
  }

  const pickCustomer = (value: number) => {
    setCustomerId(value)
    form.setFieldsValue({ customerId: value, details: [], amount: 0 })
  }

  const fillFullBalance = async () => {
    const rows = (openReceivables.data?.records ?? []).map((item) => ({
      receivableId: item.id,
      amount: Number(item.balance),
    }))
    const total = rows.reduce((sum, row) => sum + row.amount, 0)
    form.setFieldsValue({ details: rows, amount: total })
  }

  const submit = async () => {
    const values = await form.validateFields()
    if (!values.details || values.details.length === 0) {
      message.warning('至少选择一条核销明细')
      return
    }
    createMutation.mutate(values)
  }

  const columns: TableColumnsType<Receipt> = [
    { title: '收款单号', dataIndex: 'receiptNo', width: 180, fixed: 'left' },
    { title: '收款日期', dataIndex: 'receiptDate', width: 120 },
    { title: '客户', dataIndex: 'customerName', width: 150 },
    {
      title: '结算方式',
      dataIndex: 'settleMethodName',
      width: 120,
      render: (value: string | null) => value || '-',
    },
    {
      title: '收款金额',
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
      title: '状态',
      dataIndex: 'status',
      width: 100,
      render: (value: number) =>
        value === 0 ? <Tag color="success">已收款</Tag> : <Tag>已作废</Tag>,
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

  const detailColumns: TableColumnsType<ReceiptDetail> = [
    { title: '应收单号', dataIndex: 'receivableNo', width: 180 },
    { title: '发票号', dataIndex: 'invoiceNo', width: 180 },
    {
      title: '核销金额',
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
          <Typography.Title level={3}>收款与核销</Typography.Title>
          <Typography.Text type="secondary">
            登记收款后按应收单核销，余额与状态自动更新。
          </Typography.Text>
        </div>
        <Space wrap>
          <Input
            allowClear
            prefix={<SearchOutlined />}
            placeholder="收款单号 / 客户"
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
            onClick={() => queryClient.invalidateQueries({ queryKey: ['receipts'] })}
          >
            刷新
          </Button>
          <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>
            登记收款
          </Button>
        </Space>
      </div>

      <Table<Receipt>
        rowKey="id"
        loading={receipts.isLoading}
        columns={columns}
        dataSource={receipts.data?.records ?? []}
        scroll={{ x: 1080 }}
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
        title="登记收款"
        open={open}
        width={900}
        onOk={submit}
        confirmLoading={createMutation.isPending}
        onCancel={() => setOpen(false)}
        okText="确认收款"
        cancelText="取消"
        destroyOnHidden
      >
        <Form form={form} layout="vertical">
          <Row gutter={16}>
            <Col span={10}>
              <Form.Item
                name="customerId"
                label="客户"
                rules={[{ required: true, message: '请选择客户' }]}
              >
                <Select
                  showSearch
                  optionFilterProp="label"
                  options={customerOptions}
                  onChange={pickCustomer}
                />
              </Form.Item>
            </Col>
            <Col span={7}>
              <Form.Item
                name="receiptDate"
                label="收款日期"
                rules={[{ required: true, message: '请选择收款日期' }]}
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
                label="收款金额"
                rules={[{ required: true, message: '请输入收款金额' }]}
              >
                <InputNumber
                  min={0.000001}
                  precision={6}
                  style={{ width: '100%' }}
                />
              </Form.Item>
            </Col>
            <Col span={14}>
              <Form.Item label=" ">
                <Space>
                  <Button onClick={fillFullBalance} disabled={receivableOptions.length === 0}>
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
                    title: '应收单',
                    render: (_, field) => (
                      <Form.Item
                        noStyle
                        name={[field.name, 'receivableId']}
                        rules={[{ required: true }]}
                      >
                        <Select
                          showSearch
                          optionFilterProp="label"
                          style={{ width: '100%' }}
                          options={receivableOptions}
                        />
                      </Form.Item>
                    ),
                  },
                  {
                    title: '核销金额',
                    width: 180,
                    render: (_, field) => (
                      <Form.Item
                        noStyle
                        name={[field.name, 'amount']}
                        rules={[{ required: true }]}
                      >
                        <InputNumber
                          min={0.000001}
                          precision={6}
                          style={{ width: '100%' }}
                        />
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
        title={detail.data?.receiptNo ?? '收款单详情'}
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
                { key: 'customer', label: '客户', children: detail.data.customerName },
                { key: 'date', label: '收款日期', children: detail.data.receiptDate },
                {
                  key: 'method',
                  label: '结算方式',
                  children: detail.data.settleMethodName || '-',
                },
                {
                  key: 'amount',
                  label: '收款金额',
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
            <Table<ReceiptDetail>
              rowKey="id"
              size="small"
              pagination={false}
              columns={detailColumns}
              dataSource={detail.data.details ?? []}
            />
          </>
        )}
      </Modal>
    </div>
  )
}
