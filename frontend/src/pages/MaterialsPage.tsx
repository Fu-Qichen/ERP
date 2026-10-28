import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  App,
  Button,
  Form,
  Input,
  Modal,
  Popconfirm,
  Segmented,
  Space,
  Table,
  Tag,
  Typography,
  type TableColumnsType,
} from 'antd'
import { PlusOutlined, ReloadOutlined, SearchOutlined } from '@ant-design/icons'
import { useState } from 'react'
import {
  createMaterial,
  deleteMaterial,
  listMaterials,
  updateMaterial,
  type Material,
  type MaterialInput,
} from '../api/materials'

const defaultInput: MaterialInput = {
  code: '',
  name: '',
  spec: '',
  unit: 'PCS',
  status: 1,
}

export default function MaterialsPage() {
  const { message } = App.useApp()
  const queryClient = useQueryClient()
  const [form] = Form.useForm<MaterialInput>()

  const [current, setCurrent] = useState(1)
  const [size, setSize] = useState(10)
  const [keywordInput, setKeywordInput] = useState('')
  const [keyword, setKeyword] = useState('')
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<Material | null>(null)

  const materials = useQuery({
    queryKey: ['materials', current, size, keyword],
    queryFn: () => listMaterials({ current, size, keyword }),
    placeholderData: (previous) => previous,
  })

  const saveMutation = useMutation({
    mutationFn: (values: MaterialInput) =>
      editing
        ? updateMaterial(editing.id, values)
        : createMaterial(values),
    onSuccess: () => {
      message.success(editing ? '物料已更新' : '物料已创建')
      setOpen(false)
      queryClient.invalidateQueries({ queryKey: ['materials'] })
    },
    onError: (error: Error) => {
      message.error(error.message)
    },
  })

  const deleteMutation = useMutation({
    mutationFn: deleteMaterial,
    onSuccess: () => {
      message.success('物料已删除')
      queryClient.invalidateQueries({ queryKey: ['materials'] })
    },
    onError: (error: Error) => {
      message.error(error.message)
    },
  })

  const openCreate = () => {
    setEditing(null)
    form.resetFields()
    form.setFieldsValue(defaultInput)
    setOpen(true)
  }

  const openEdit = (record: Material) => {
    setEditing(record)
    form.setFieldsValue({
      code: record.code,
      name: record.name,
      spec: record.spec ?? '',
      unit: record.unit,
      status: record.status,
    })
    setOpen(true)
  }

  const submit = async () => {
    const values = await form.validateFields()
    saveMutation.mutate(values)
  }

  const columns: TableColumnsType<Material> = [
    {
      title: '物料编码',
      dataIndex: 'code',
      width: 150,
      fixed: 'left',
    },
    {
      title: '物料名称',
      dataIndex: 'name',
      width: 180,
    },
    {
      title: '规格',
      dataIndex: 'spec',
      width: 160,
      render: (value: string | null) => value || '-',
    },
    {
      title: '单位',
      dataIndex: 'unit',
      width: 90,
    },
    {
      title: '状态',
      dataIndex: 'status',
      width: 100,
      render: (value: number) =>
        value === 1 ? <Tag color="success">启用</Tag> : <Tag>停用</Tag>,
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
      width: 140,
      fixed: 'right',
      render: (_, record) => (
        <Space>
          <Button type="link" size="small" onClick={() => openEdit(record)}>
            编辑
          </Button>
          <Popconfirm
            title="删除该物料？"
            description="删除后不可恢复。"
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
    <div className="page">
      <div className="page-heading">
        <div>
          <Typography.Title level={3}>物料管理</Typography.Title>
          <Typography.Text type="secondary">
            主数据维护，分页与关键字查询走 MyBatis-Plus。
          </Typography.Text>
        </div>
        <Space>
          <Input
            allowClear
            prefix={<SearchOutlined />}
            placeholder="物料编码 / 名称"
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
            onClick={() => queryClient.invalidateQueries({ queryKey: ['materials'] })}
          >
            刷新
          </Button>
          <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>
            新增物料
          </Button>
        </Space>
      </div>

      <Table<Material>
        rowKey="id"
        loading={materials.isLoading}
        columns={columns}
        dataSource={materials.data?.records ?? []}
        scroll={{ x: 1000 }}
        pagination={{
          current,
          pageSize: size,
          total: materials.data?.total ?? 0,
          showSizeChanger: true,
          showTotal: (total) => `共 ${total} 条`,
          onChange: (nextPage, nextSize) => {
            setCurrent(nextPage)
            setSize(nextSize)
          },
        }}
      />

      <Modal
        title={editing ? '编辑物料' : '新增物料'}
        open={open}
        onOk={submit}
        confirmLoading={saveMutation.isPending}
        onCancel={() => setOpen(false)}
        okText="保存"
        cancelText="取消"
        destroyOnHidden
      >
        <Form form={form} layout="vertical" initialValues={defaultInput}>
          <Form.Item
            name="code"
            label="物料编码"
            rules={[{ required: true, message: '请输入物料编码' }]}
          >
            <Input maxLength={32} placeholder="如 M-003" />
          </Form.Item>
          <Form.Item
            name="name"
            label="物料名称"
            rules={[{ required: true, message: '请输入物料名称' }]}
          >
            <Input maxLength={128} placeholder="如 测试物料C" />
          </Form.Item>
          <Form.Item name="spec" label="规格">
            <Input maxLength={128} placeholder="如 30x40" />
          </Form.Item>
          <Form.Item
            name="unit"
            label="单位"
            rules={[{ required: true, message: '请输入单位' }]}
          >
            <Input maxLength={16} placeholder="如 PCS / KG" />
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
    </div>
  )
}
