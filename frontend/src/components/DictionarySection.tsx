import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  App,
  Button,
  Form,
  Input,
  InputNumber,
  Modal,
  Popconfirm,
  Segmented,
  Select,
  Space,
  Table,
  Tag,
  type TableColumnsType,
} from 'antd'
import { PlusOutlined } from '@ant-design/icons'
import { useState } from 'react'
import {
  createCurrency,
  createCustomerClass,
  createPayCondition,
  createSettleMethod,
  createSupplierClass,
  deleteCurrency,
  deleteCustomerClass,
  deletePayCondition,
  deleteSettleMethod,
  deleteSupplierClass,
  listCurrencies,
  listCustomerClasses,
  listPayConditions,
  listSettleMethods,
  listSupplierClasses,
  updateCurrency,
  updateCustomerClass,
  updatePayCondition,
  updateSettleMethod,
  updateSupplierClass,
  type ClassInput,
  type Currency,
  type CurrencyInput,
  type CustomerClass,
  type PayCondition,
  type PayConditionInput,
  type SettleMethod,
  type SettleMethodInput,
  type SupplierClass,
} from '../api/master'

export type DictionaryKind =
  | 'customerClass'
  | 'supplierClass'
  | 'currency'
  | 'settleMethod'
  | 'payCondition'

type Row = CustomerClass | SupplierClass | Currency | SettleMethod | PayCondition
type FormValues = Record<string, unknown>

interface SectionConfig {
  title: string
  addLabel: string
  queryKey: string
  list: () => Promise<Row[]>
  create: (input: FormValues) => Promise<unknown>
  update: (id: number, input: FormValues) => Promise<unknown>
  remove: (id: number) => Promise<void>
  columns: TableColumnsType<Row>
  initialValues: FormValues
}

const statusTag = (value: number) =>
  value === 1 ? <Tag color="success">启用</Tag> : <Tag>停用</Tag>

const CONFIG: Record<DictionaryKind, SectionConfig> = {
  customerClass: {
    title: '客户分类',
    addLabel: '新增客户分类',
    queryKey: 'customer-classes',
    list: listCustomerClasses,
    create: (input) => createCustomerClass(input as unknown as ClassInput),
    update: (id, input) =>
      updateCustomerClass(id, input as unknown as ClassInput),
    remove: deleteCustomerClass,
    columns: [
      { title: '编码', dataIndex: 'classCode', width: 120 },
      { title: '名称', dataIndex: 'className' },
      { title: '状态', dataIndex: 'status', width: 90, render: statusTag },
    ],
    initialValues: { status: 1 },
  },
  supplierClass: {
    title: '供应商分类',
    addLabel: '新增供应商分类',
    queryKey: 'supplier-classes',
    list: listSupplierClasses,
    create: (input) => createSupplierClass(input as unknown as ClassInput),
    update: (id, input) =>
      updateSupplierClass(id, input as unknown as ClassInput),
    remove: deleteSupplierClass,
    columns: [
      { title: '编码', dataIndex: 'classCode', width: 120 },
      { title: '名称', dataIndex: 'className' },
      { title: '状态', dataIndex: 'status', width: 90, render: statusTag },
    ],
    initialValues: { status: 1 },
  },
  currency: {
    title: '币种',
    addLabel: '新增币种',
    queryKey: 'currencies',
    list: listCurrencies,
    create: (input) => createCurrency(input as unknown as CurrencyInput),
    update: (id, input) =>
      updateCurrency(id, input as unknown as CurrencyInput),
    remove: deleteCurrency,
    columns: [
      { title: '编码', dataIndex: 'currencyCode', width: 110 },
      { title: '名称', dataIndex: 'currencyName' },
      { title: '汇率', dataIndex: 'exchangeRate', width: 120 },
      { title: '状态', dataIndex: 'status', width: 90, render: statusTag },
    ],
    initialValues: { exchangeRate: 1, status: 1 },
  },
  settleMethod: {
    title: '结算方式',
    addLabel: '新增结算方式',
    queryKey: 'settle-methods',
    list: listSettleMethods,
    create: (input) => createSettleMethod(input as unknown as SettleMethodInput),
    update: (id, input) =>
      updateSettleMethod(id, input as unknown as SettleMethodInput),
    remove: deleteSettleMethod,
    columns: [
      { title: '编码', dataIndex: 'methodCode', width: 120 },
      { title: '名称', dataIndex: 'methodName' },
      { title: '状态', dataIndex: 'status', width: 90, render: statusTag },
    ],
    initialValues: { status: 1 },
  },
  payCondition: {
    title: '付款条件',
    addLabel: '新增付款条件',
    queryKey: 'pay-conditions',
    list: listPayConditions,
    create: (input) => createPayCondition(input as unknown as PayConditionInput),
    update: (id, input) =>
      updatePayCondition(id, input as unknown as PayConditionInput),
    remove: deletePayCondition,
    columns: [
      { title: '编码', dataIndex: 'conditionCode', width: 120 },
      { title: '名称', dataIndex: 'conditionName' },
      { title: '天数', dataIndex: 'days', width: 90 },
      { title: '状态', dataIndex: 'status', width: 90, render: statusTag },
    ],
    initialValues: { days: 0, status: 1 },
  },
}

function Fields({
  kind,
  parentOptions,
}: {
  kind: DictionaryKind
  parentOptions: { value: number; label: string }[]
}) {
  const statusField = (
    <Form.Item name="status" label="状态">
      <Segmented
        options={[
          { label: '启用', value: 1 },
          { label: '停用', value: 0 },
        ]}
      />
    </Form.Item>
  )

  if (kind === 'customerClass' || kind === 'supplierClass') {
    return (
      <>
        <Form.Item
          name="classCode"
          label="分类编码"
          rules={[{ required: true, message: '请输入分类编码' }]}
        >
          <Input maxLength={32} />
        </Form.Item>
        <Form.Item
          name="className"
          label="分类名称"
          rules={[{ required: true, message: '请输入分类名称' }]}
        >
          <Input maxLength={128} />
        </Form.Item>
        <Form.Item name="parentId" label="上级分类">
          <Select allowClear options={parentOptions} placeholder="不选表示根分类" />
        </Form.Item>
        {statusField}
      </>
    )
  }

  if (kind === 'currency') {
    return (
      <>
        <Form.Item
          name="currencyCode"
          label="币种编码"
          rules={[{ required: true, message: '请输入币种编码' }]}
        >
          <Input maxLength={16} />
        </Form.Item>
        <Form.Item
          name="currencyName"
          label="币种名称"
          rules={[{ required: true, message: '请输入币种名称' }]}
        >
          <Input maxLength={64} />
        </Form.Item>
        <Form.Item
          name="exchangeRate"
          label="汇率"
          rules={[{ required: true, message: '请输入汇率' }]}
        >
          <InputNumber
            min={0.000001}
            precision={6}
            style={{ width: '100%' }}
          />
        </Form.Item>
        {statusField}
      </>
    )
  }

  if (kind === 'settleMethod') {
    return (
      <>
        <Form.Item
          name="methodCode"
          label="结算方式编码"
          rules={[{ required: true, message: '请输入编码' }]}
        >
          <Input maxLength={32} />
        </Form.Item>
        <Form.Item
          name="methodName"
          label="结算方式名称"
          rules={[{ required: true, message: '请输入名称' }]}
        >
          <Input maxLength={64} />
        </Form.Item>
        {statusField}
      </>
    )
  }

  return (
    <>
      <Form.Item
        name="conditionCode"
        label="付款条件编码"
        rules={[{ required: true, message: '请输入编码' }]}
      >
        <Input maxLength={32} />
      </Form.Item>
      <Form.Item
        name="conditionName"
        label="付款条件名称"
        rules={[{ required: true, message: '请输入名称' }]}
      >
        <Input maxLength={64} />
      </Form.Item>
      <Form.Item
        name="days"
        label="账期天数"
        rules={[{ required: true, message: '请输入天数' }]}
      >
        <InputNumber min={0} precision={0} style={{ width: '100%' }} />
      </Form.Item>
      {statusField}
    </>
  )
}

export default function DictionarySection({ kind }: { kind: DictionaryKind }) {
  const config = CONFIG[kind]
  const { message } = App.useApp()
  const queryClient = useQueryClient()
  const [form] = Form.useForm<FormValues>()
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<Row | null>(null)

  const rows = useQuery({
    queryKey: [config.queryKey],
    queryFn: config.list,
  })

  const saveMutation = useMutation({
    mutationFn: (values: FormValues) =>
      editing ? config.update(editing.id, values) : config.create(values),
    onSuccess: () => {
      message.success(editing ? '已更新' : '已创建')
      setOpen(false)
      queryClient.invalidateQueries({ queryKey: [config.queryKey] })
      queryClient.invalidateQueries({ queryKey: ['customers'] })
      queryClient.invalidateQueries({ queryKey: ['suppliers'] })
    },
    onError: (error: Error) => message.error(error.message),
  })

  const deleteMutation = useMutation({
    mutationFn: config.remove,
    onSuccess: () => {
      message.success('已删除')
      queryClient.invalidateQueries({ queryKey: [config.queryKey] })
    },
    onError: (error: Error) => message.error(error.message),
  })

  const openCreate = () => {
    setEditing(null)
    form.resetFields()
    form.setFieldsValue(config.initialValues)
    setOpen(true)
  }

  const openEdit = (record: Row) => {
    setEditing(record)
    form.setFieldsValue(record as unknown as FormValues)
    setOpen(true)
  }

  const submit = async () => {
    const values = await form.validateFields()
    saveMutation.mutate({
      ...values,
      status: values.status ?? 1,
      parentId: values.parentId ?? null,
    })
  }

  const parentOptions = (kind === 'customerClass' || kind === 'supplierClass')
    ? (rows.data ?? [])
        .filter((row) => row.id !== editing?.id)
        .map((row) => {
          const item = row as CustomerClass | SupplierClass
          return {
            value: item.id,
            label: `${item.classCode} ${item.className}`,
          }
        })
    : []

  const columns: TableColumnsType<Row> = [
    ...config.columns,
    {
      title: '操作',
      key: 'action',
      width: 130,
      render: (_, record) => (
        <Space>
          <Button type="link" size="small" onClick={() => openEdit(record)}>
            编辑
          </Button>
          <Popconfirm
            title="删除该字典项？"
            description="被引用时不能删除。"
            okText="删除"
            cancelText="取消"
            onConfirm={() => deleteMutation.mutate(record.id)}
          >
            <Button type="link" size="small" danger>
              删除
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ]

  return (
    <div className="dictionary-section">
      <div className="tab-toolbar">
        <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>
          {config.addLabel}
        </Button>
      </div>
      <Table<Row>
        rowKey="id"
        size="small"
        loading={rows.isLoading}
        columns={columns}
        dataSource={rows.data ?? []}
        pagination={false}
      />

      <Modal
        title={editing ? `编辑${config.title}` : config.addLabel}
        open={open}
        onOk={submit}
        confirmLoading={saveMutation.isPending}
        onCancel={() => setOpen(false)}
        okText="保存"
        cancelText="取消"
        destroyOnHidden
      >
        <Form form={form} layout="vertical">
          <Fields kind={kind} parentOptions={parentOptions} />
        </Form>
      </Modal>
    </div>
  )
}
