import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  App,
  Button,
  Card,
  Col,
  Form,
  Input,
  InputNumber,
  Modal,
  Popconfirm,
  Row,
  Segmented,
  Select,
  Space,
  Table,
  Tag,
  Typography,
  type TableColumnsType,
} from 'antd'
import { PlusOutlined } from '@ant-design/icons'
import { useState } from 'react'
import {
  createMaterialClass,
  createUom,
  deleteMaterialClass,
  deleteUom,
  listMaterialClasses,
  listUoms,
  updateMaterialClass,
  updateUom,
  type MaterialClass,
  type MaterialClassInput,
  type UnitOfMeasure,
  type UnitOfMeasureInput,
} from '../api/materials'

const statusTag = (value: number) =>
  value === 1 ? <Tag color="success">启用</Tag> : <Tag>停用</Tag>

function MaterialClassesTab() {
  const { message } = App.useApp()
  const queryClient = useQueryClient()
  const [form] = Form.useForm<MaterialClassInput>()
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<MaterialClass | null>(null)

  const classes = useQuery({
    queryKey: ['material-classes'],
    queryFn: listMaterialClasses,
  })

  const saveMutation = useMutation({
    mutationFn: (values: MaterialClassInput) =>
      editing ? updateMaterialClass(editing.id, values) : createMaterialClass(values),
    onSuccess: () => {
      message.success(editing ? '分类已更新' : '分类已创建')
      setOpen(false)
      queryClient.invalidateQueries({ queryKey: ['material-classes'] })
      queryClient.invalidateQueries({ queryKey: ['materials'] })
    },
    onError: (error: Error) => message.error(error.message),
  })

  const deleteMutation = useMutation({
    mutationFn: deleteMaterialClass,
    onSuccess: () => {
      message.success('分类已删除')
      queryClient.invalidateQueries({ queryKey: ['material-classes'] })
    },
    onError: (error: Error) => message.error(error.message),
  })

  const openCreate = () => {
    setEditing(null)
    form.resetFields()
    form.setFieldsValue({ status: 1 })
    setOpen(true)
  }

  const openEdit = (record: MaterialClass) => {
    setEditing(record)
    form.setFieldsValue({
      classCode: record.classCode,
      className: record.className,
      parentId: record.parentId ?? undefined,
      status: record.status,
    })
    setOpen(true)
  }

  const submit = async () => {
    const values = await form.validateFields()
    saveMutation.mutate({ ...values, parentId: values.parentId ?? null })
  }

  const parentOptions = (classes.data ?? [])
    .filter((item) => item.id !== editing?.id)
    .map((item) => ({
      value: item.id,
      label: `${item.classCode} ${item.className}`,
    }))

  const columns: TableColumnsType<MaterialClass> = [
    { title: '分类编码', dataIndex: 'classCode', width: 130 },
    { title: '分类名称', dataIndex: 'className' },
    {
      title: '上级分类',
      dataIndex: 'parentId',
      width: 160,
      render: (value: number | null) => {
        if (value === null) {
          return '-'
        }
        const parent = (classes.data ?? []).find((item) => item.id === value)
        return parent ? parent.className : value
      },
    },
    { title: '状态', dataIndex: 'status', width: 90, render: statusTag },
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
            title="删除该分类？"
            description="有子分类或被物料引用时不能删除。"
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
          新增分类
        </Button>
      </div>
      <Table<MaterialClass>
        rowKey="id"
        loading={classes.isLoading}
        columns={columns}
        dataSource={classes.data ?? []}
        pagination={false}
      />

      <Modal
        title={editing ? '编辑物料分类' : '新增物料分类'}
        open={open}
        onOk={submit}
        confirmLoading={saveMutation.isPending}
        onCancel={() => setOpen(false)}
        okText="保存"
        cancelText="取消"
        destroyOnHidden
      >
        <Form form={form} layout="vertical">
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
          <Form.Item name="status" label="状态">
            <Segmented
              options={[
                { label: '启用', value: 1 },
                { label: '停用', value: 0 },
              ]}
            />
          </Form.Item>
        </Form>
      </Modal>
    </>
  )
}

function UnitsTab() {
  const { message } = App.useApp()
  const queryClient = useQueryClient()
  const [form] = Form.useForm<UnitOfMeasureInput>()
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<UnitOfMeasure | null>(null)

  const uoms = useQuery({ queryKey: ['uoms'], queryFn: listUoms })

  const saveMutation = useMutation({
    mutationFn: (values: UnitOfMeasureInput) =>
      editing ? updateUom(editing.id, values) : createUom(values),
    onSuccess: () => {
      message.success(editing ? '单位已更新' : '单位已创建')
      setOpen(false)
      queryClient.invalidateQueries({ queryKey: ['uoms'] })
      queryClient.invalidateQueries({ queryKey: ['materials'] })
    },
    onError: (error: Error) => message.error(error.message),
  })

  const deleteMutation = useMutation({
    mutationFn: deleteUom,
    onSuccess: () => {
      message.success('单位已删除')
      queryClient.invalidateQueries({ queryKey: ['uoms'] })
    },
    onError: (error: Error) => message.error(error.message),
  })

  const openCreate = () => {
    setEditing(null)
    form.resetFields()
    form.setFieldsValue({ decimalDigits: 0, status: 1 })
    setOpen(true)
  }

  const openEdit = (record: UnitOfMeasure) => {
    setEditing(record)
    form.setFieldsValue({
      unitCode: record.unitCode,
      unitName: record.unitName,
      decimalDigits: record.decimalDigits,
      status: record.status,
    })
    setOpen(true)
  }

  const submit = async () => {
    saveMutation.mutate(await form.validateFields())
  }

  const columns: TableColumnsType<UnitOfMeasure> = [
    { title: '单位编码', dataIndex: 'unitCode' },
    { title: '单位名称', dataIndex: 'unitName' },
    {
      title: '小数位数',
      dataIndex: 'decimalDigits',
      align: 'right',
    },
    { title: '状态', dataIndex: 'status', render: statusTag },
    {
      title: '操作',
      key: 'action',
      width: 120,
      className: 'table-actions',
      render: (_, record) => (
        <Space>
          <Button type="link" size="small" onClick={() => openEdit(record)}>
            编辑
          </Button>
          <Popconfirm
            title="删除该单位？"
            description="被物料引用时不能删除。"
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
          新增单位
        </Button>
      </div>
      <Table<UnitOfMeasure>
        rowKey="id"
        loading={uoms.isLoading}
        columns={columns}
        dataSource={uoms.data ?? []}
        pagination={false}
      />

      <Modal
        title={editing ? '编辑计量单位' : '新增计量单位'}
        open={open}
        onOk={submit}
        confirmLoading={saveMutation.isPending}
        onCancel={() => setOpen(false)}
        okText="保存"
        cancelText="取消"
        destroyOnHidden
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="unitCode"
            label="单位编码"
            rules={[{ required: true, message: '请输入单位编码' }]}
          >
            <Input maxLength={16} placeholder="如 PCS / KG" />
          </Form.Item>
          <Form.Item
            name="unitName"
            label="单位名称"
            rules={[{ required: true, message: '请输入单位名称' }]}
          >
            <Input maxLength={32} placeholder="如 件 / 千克" />
          </Form.Item>
          <Form.Item
            name="decimalDigits"
            label="小数位数"
            rules={[{ required: true, message: '请输入小数位数' }]}
          >
            <InputNumber min={0} max={6} precision={0} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="status" label="状态">
            <Segmented
              options={[
                { label: '启用', value: 1 },
                { label: '停用', value: 0 },
              ]}
            />
          </Form.Item>
        </Form>
      </Modal>
    </>
  )
}

export default function MaterialMasterPage() {
  return (
    <div className="page">
      <div className="page-heading">
        <div>
          <Typography.Title level={3}>物料分类与单位</Typography.Title>
          <Typography.Text type="secondary">
            物料必须先有分类与计量单位；小数位数决定数量精度。
          </Typography.Text>
        </div>
      </div>

      <Row gutter={24}>
        <Col xs={24} xl={13}>
          <Card size="small" title="物料分类">
            <MaterialClassesTab />
          </Card>
        </Col>
        <Col xs={24} xl={11}>
          <Card size="small" title="计量单位">
            <UnitsTab />
          </Card>
        </Col>
      </Row>
    </div>
  )
}
