import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  App,
  Button,
  Card,
  Col,
  Form,
  Input,
  Modal,
  Popconfirm,
  Row,
  Segmented,
  Select,
  Space,
  Table,
  Tabs,
  Tag,
  Typography,
  type TableColumnsType,
} from 'antd'
import { PlusOutlined } from '@ant-design/icons'
import { useState } from 'react'
import DictionarySection from '../components/DictionarySection'
import { listStaff } from '../api/organization'
import {
  createCustomer,
  createSupplier,
  deleteCustomer,
  deleteSupplier,
  listCurrencies,
  listCustomerClasses,
  listCustomers,
  listPayConditions,
  listSettleMethods,
  listSupplierClasses,
  listSuppliers,
  updateCustomer,
  updateSupplier,
  type Customer,
  type CustomerInput,
  type Supplier,
  type SupplierInput,
} from '../api/master'

const statusTag = (value: number) =>
  value === 1 ? <Tag color="success">启用</Tag> : <Tag>停用</Tag>

function CustomersTab() {
  const { message } = App.useApp()
  const queryClient = useQueryClient()
  const [form] = Form.useForm<CustomerInput>()
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<Customer | null>(null)

  const customers = useQuery({ queryKey: ['customers'], queryFn: listCustomers })
  const classes = useQuery({
    queryKey: ['customer-classes'],
    queryFn: listCustomerClasses,
  })
  const staff = useQuery({ queryKey: ['staff'], queryFn: listStaff })
  const currencies = useQuery({
    queryKey: ['currencies'],
    queryFn: listCurrencies,
  })
  const settleMethods = useQuery({
    queryKey: ['settle-methods'],
    queryFn: listSettleMethods,
  })
  const payConditions = useQuery({
    queryKey: ['pay-conditions'],
    queryFn: listPayConditions,
  })

  const saveMutation = useMutation({
    mutationFn: (values: CustomerInput) =>
      editing ? updateCustomer(editing.id, values) : createCustomer(values),
    onSuccess: () => {
      message.success(editing ? '客户已更新' : '客户已创建')
      setOpen(false)
      queryClient.invalidateQueries({ queryKey: ['customers'] })
    },
    onError: (error: Error) => message.error(error.message),
  })

  const deleteMutation = useMutation({
    mutationFn: deleteCustomer,
    onSuccess: () => {
      message.success('客户已删除')
      queryClient.invalidateQueries({ queryKey: ['customers'] })
    },
    onError: (error: Error) => message.error(error.message),
  })

  const openCreate = () => {
    setEditing(null)
    form.resetFields()
    form.setFieldsValue({
      classId: classes.data?.[0]?.id,
      currencyId: currencies.data?.[0]?.id,
      status: 1,
    })
    setOpen(true)
  }

  const openEdit = (record: Customer) => {
    setEditing(record)
    form.setFieldsValue({
      customerCode: record.customerCode,
      customerName: record.customerName,
      classId: record.classId,
      staffId: record.staffId ?? undefined,
      currencyId: record.currencyId,
      settleMethodId: record.settleMethodId ?? undefined,
      payConditionId: record.payConditionId ?? undefined,
      status: record.status,
    })
    setOpen(true)
  }

  const submit = async () => {
    saveMutation.mutate(await form.validateFields())
  }

  const columns: TableColumnsType<Customer> = [
    { title: '客户编码', dataIndex: 'customerCode', width: 130 },
    { title: '客户名称', dataIndex: 'customerName', width: 170 },
    {
      title: '分类',
      dataIndex: 'className',
      width: 120,
      render: (value: string | null) => value || '-',
    },
    {
      title: '业务员',
      dataIndex: 'staffName',
      width: 110,
      render: (value: string | null) => value || '-',
    },
    {
      title: '币种',
      dataIndex: 'currencyName',
      width: 100,
      render: (value: string | null) => value || '-',
    },
    {
      title: '结算方式',
      dataIndex: 'settleMethodName',
      width: 120,
      render: (value: string | null) => value || '-',
    },
    {
      title: '付款条件',
      dataIndex: 'payConditionName',
      width: 120,
      render: (value: string | null) => value || '-',
    },
    {
      title: '状态',
      dataIndex: 'status',
      width: 90,
      render: statusTag,
    },
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
            title="删除该客户？"
            description="被销售订单引用时不能删除。"
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
    <>
      <div className="tab-toolbar">
        <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>
          新增客户
        </Button>
      </div>
      <Table<Customer>
        rowKey="id"
        loading={customers.isLoading}
        columns={columns}
        dataSource={customers.data ?? []}
        scroll={{ x: 1100 }}
        pagination={false}
      />

      <Modal
        title={editing ? '编辑客户' : '新增客户'}
        open={open}
        width={760}
        onOk={submit}
        confirmLoading={saveMutation.isPending}
        onCancel={() => setOpen(false)}
        okText="保存"
        cancelText="取消"
        destroyOnHidden
      >
        <Form form={form} layout="vertical">
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="customerCode"
                label="客户编码"
                rules={[{ required: true, message: '请输入客户编码' }]}
              >
                <Input maxLength={32} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="customerName"
                label="客户名称"
                rules={[{ required: true, message: '请输入客户名称' }]}
              >
                <Input maxLength={128} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="classId"
                label="客户分类"
                rules={[{ required: true, message: '请选择分类' }]}
              >
                <Select
                  options={(classes.data ?? []).map((item) => ({
                    value: item.id,
                    label: `${item.classCode} ${item.className}`,
                  }))}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="staffId" label="业务员">
                <Select
                  allowClear
                  options={(staff.data ?? []).map((item) => ({
                    value: item.id,
                    label: `${item.staffNo} ${item.staffName}`,
                  }))}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="currencyId"
                label="币种"
                rules={[{ required: true, message: '请选择币种' }]}
              >
                <Select
                  options={(currencies.data ?? []).map((item) => ({
                    value: item.id,
                    label: `${item.currencyCode} ${item.currencyName}`,
                  }))}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
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
            <Col span={12}>
              <Form.Item name="payConditionId" label="付款条件">
                <Select
                  allowClear
                  options={(payConditions.data ?? []).map((item) => ({
                    value: item.id,
                    label: `${item.conditionName} (${item.days}天)`,
                  }))}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="status" label="状态">
                <Segmented
                  options={[
                    { label: '启用', value: 1 },
                    { label: '停用', value: 0 },
                  ]}
                />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>
    </>
  )
}

function SuppliersTab() {
  const { message } = App.useApp()
  const queryClient = useQueryClient()
  const [form] = Form.useForm<SupplierInput>()
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<Supplier | null>(null)

  const suppliers = useQuery({ queryKey: ['suppliers'], queryFn: listSuppliers })
  const classes = useQuery({
    queryKey: ['supplier-classes'],
    queryFn: listSupplierClasses,
  })
  const currencies = useQuery({
    queryKey: ['currencies'],
    queryFn: listCurrencies,
  })
  const payConditions = useQuery({
    queryKey: ['pay-conditions'],
    queryFn: listPayConditions,
  })

  const saveMutation = useMutation({
    mutationFn: (values: SupplierInput) =>
      editing ? updateSupplier(editing.id, values) : createSupplier(values),
    onSuccess: () => {
      message.success(editing ? '供应商已更新' : '供应商已创建')
      setOpen(false)
      queryClient.invalidateQueries({ queryKey: ['suppliers'] })
    },
    onError: (error: Error) => message.error(error.message),
  })

  const deleteMutation = useMutation({
    mutationFn: deleteSupplier,
    onSuccess: () => {
      message.success('供应商已删除')
      queryClient.invalidateQueries({ queryKey: ['suppliers'] })
    },
    onError: (error: Error) => message.error(error.message),
  })

  const openCreate = () => {
    setEditing(null)
    form.resetFields()
    form.setFieldsValue({
      classId: classes.data?.[0]?.id,
      currencyId: currencies.data?.[0]?.id,
      status: 1,
    })
    setOpen(true)
  }

  const openEdit = (record: Supplier) => {
    setEditing(record)
    form.setFieldsValue({
      supplierCode: record.supplierCode,
      supplierName: record.supplierName,
      classId: record.classId,
      currencyId: record.currencyId,
      payConditionId: record.payConditionId ?? undefined,
      status: record.status,
    })
    setOpen(true)
  }

  const submit = async () => {
    saveMutation.mutate(await form.validateFields())
  }

  const columns: TableColumnsType<Supplier> = [
    { title: '供应商编码', dataIndex: 'supplierCode', width: 140 },
    { title: '供应商名称', dataIndex: 'supplierName', width: 180 },
    {
      title: '分类',
      dataIndex: 'className',
      width: 120,
      render: (value: string | null) => value || '-',
    },
    {
      title: '币种',
      dataIndex: 'currencyName',
      width: 100,
      render: (value: string | null) => value || '-',
    },
    {
      title: '付款条件',
      dataIndex: 'payConditionName',
      width: 130,
      render: (value: string | null) => value || '-',
    },
    {
      title: '状态',
      dataIndex: 'status',
      width: 90,
      render: statusTag,
    },
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
            title="删除该供应商？"
            description="被采购订单引用时不能删除。"
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
    <>
      <div className="tab-toolbar">
        <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>
          新增供应商
        </Button>
      </div>
      <Table<Supplier>
        rowKey="id"
        loading={suppliers.isLoading}
        columns={columns}
        dataSource={suppliers.data ?? []}
        scroll={{ x: 900 }}
        pagination={false}
      />

      <Modal
        title={editing ? '编辑供应商' : '新增供应商'}
        open={open}
        width={720}
        onOk={submit}
        confirmLoading={saveMutation.isPending}
        onCancel={() => setOpen(false)}
        okText="保存"
        cancelText="取消"
        destroyOnHidden
      >
        <Form form={form} layout="vertical">
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="supplierCode"
                label="供应商编码"
                rules={[{ required: true, message: '请输入供应商编码' }]}
              >
                <Input maxLength={32} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="supplierName"
                label="供应商名称"
                rules={[{ required: true, message: '请输入供应商名称' }]}
              >
                <Input maxLength={128} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="classId"
                label="供应商分类"
                rules={[{ required: true, message: '请选择分类' }]}
              >
                <Select
                  options={(classes.data ?? []).map((item) => ({
                    value: item.id,
                    label: `${item.classCode} ${item.className}`,
                  }))}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="currencyId"
                label="币种"
                rules={[{ required: true, message: '请选择币种' }]}
              >
                <Select
                  options={(currencies.data ?? []).map((item) => ({
                    value: item.id,
                    label: `${item.currencyCode} ${item.currencyName}`,
                  }))}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="payConditionId" label="付款条件">
                <Select
                  allowClear
                  options={(payConditions.data ?? []).map((item) => ({
                    value: item.id,
                    label: `${item.conditionName} (${item.days}天)`,
                  }))}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="status" label="状态">
                <Segmented
                  options={[
                    { label: '启用', value: 1 },
                    { label: '停用', value: 0 },
                  ]}
                />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>
    </>
  )
}

function DictionariesTab() {
  return (
    <Row gutter={[16, 16]}>
      <Col xs={24} xl={12}>
        <Card size="small" title="客户分类">
          <DictionarySection kind="customerClass" />
        </Card>
      </Col>
      <Col xs={24} xl={12}>
        <Card size="small" title="供应商分类">
          <DictionarySection kind="supplierClass" />
        </Card>
      </Col>
      <Col xs={24} xl={12}>
        <Card size="small" title="币种">
          <DictionarySection kind="currency" />
        </Card>
      </Col>
      <Col xs={24} xl={12}>
        <Card size="small" title="结算方式">
          <DictionarySection kind="settleMethod" />
        </Card>
      </Col>
      <Col xs={24} xl={12}>
        <Card size="small" title="付款条件">
          <DictionarySection kind="payCondition" />
        </Card>
      </Col>
    </Row>
  )
}

export default function PartnersPage() {
  return (
    <div className="page">
      <div className="page-heading">
        <div>
          <Typography.Title level={3}>客商管理</Typography.Title>
          <Typography.Text type="secondary">
            客户、供应商及其分类、币种、结算方式与付款条件。
          </Typography.Text>
        </div>
      </div>

      <Tabs
        items={[
          { key: 'customers', label: '客户', children: <CustomersTab /> },
          { key: 'suppliers', label: '供应商', children: <SuppliersTab /> },
          { key: 'dictionaries', label: '基础字典', children: <DictionariesTab /> },
        ]}
      />
    </div>
  )
}
