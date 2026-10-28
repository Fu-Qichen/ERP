import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  App,
  Button,
  Form,
  Input,
  Modal,
  Popconfirm,
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
import { listDepartments } from '../api/organization'
import {
  createWarehouse,
  deleteWarehouse,
  listWarehouses,
  updateWarehouse,
  type Warehouse,
  type WarehouseInput,
} from '../api/master'

export default function WarehousesPage() {
  const { message } = App.useApp()
  const queryClient = useQueryClient()
  const [form] = Form.useForm<WarehouseInput>()
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<Warehouse | null>(null)

  const warehouses = useQuery({
    queryKey: ['warehouses'],
    queryFn: listWarehouses,
  })
  const departments = useQuery({
    queryKey: ['departments'],
    queryFn: listDepartments,
  })

  const saveMutation = useMutation({
    mutationFn: (values: WarehouseInput) =>
      editing ? updateWarehouse(editing.id, values) : createWarehouse(values),
    onSuccess: () => {
      message.success(editing ? '仓库已更新' : '仓库已创建')
      setOpen(false)
      queryClient.invalidateQueries({ queryKey: ['warehouses'] })
    },
    onError: (error: Error) => message.error(error.message),
  })

  const deleteMutation = useMutation({
    mutationFn: deleteWarehouse,
    onSuccess: () => {
      message.success('仓库已删除')
      queryClient.invalidateQueries({ queryKey: ['warehouses'] })
    },
    onError: (error: Error) => message.error(error.message),
  })

  const openCreate = () => {
    setEditing(null)
    form.resetFields()
    form.setFieldsValue({
      deptId: departments.data?.[0]?.id,
      status: 1,
    })
    setOpen(true)
  }

  const openEdit = (record: Warehouse) => {
    setEditing(record)
    form.setFieldsValue({
      warehouseCode: record.warehouseCode,
      warehouseName: record.warehouseName,
      deptId: record.deptId,
      status: record.status,
    })
    setOpen(true)
  }

  const submit = async () => {
    saveMutation.mutate(await form.validateFields())
  }

  const columns: TableColumnsType<Warehouse> = [
    { title: '仓库编码', dataIndex: 'warehouseCode', width: 140 },
    { title: '仓库名称', dataIndex: 'warehouseName', width: 180 },
    {
      title: '所属部门',
      dataIndex: 'deptName',
      render: (value: string | null) => value || '-',
    },
    {
      title: '状态',
      dataIndex: 'status',
      width: 100,
      render: (value: number) =>
        value === 1 ? <Tag color="success">启用</Tag> : <Tag>停用</Tag>,
    },
    {
      title: '操作',
      key: 'action',
      width: 140,
      render: (_, record) => (
        <Space>
          <Button type="link" size="small" onClick={() => openEdit(record)}>
            编辑
          </Button>
          <Popconfirm
            title="删除该仓库？"
            description="有库存余额或业务单据引用时不能删除。"
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
          <Typography.Title level={3}>仓库管理</Typography.Title>
          <Typography.Text type="secondary">
            仓库归属部门，销售/采购/库存单据按仓库记账。
          </Typography.Text>
        </div>
        <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>
          新增仓库
        </Button>
      </div>

      <Table<Warehouse>
        rowKey="id"
        loading={warehouses.isLoading}
        columns={columns}
        dataSource={warehouses.data ?? []}
        pagination={false}
      />

      <Modal
        title={editing ? '编辑仓库' : '新增仓库'}
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
            name="warehouseCode"
            label="仓库编码"
            rules={[{ required: true, message: '请输入仓库编码' }]}
          >
            <Input maxLength={32} />
          </Form.Item>
          <Form.Item
            name="warehouseName"
            label="仓库名称"
            rules={[{ required: true, message: '请输入仓库名称' }]}
          >
            <Input maxLength={128} />
          </Form.Item>
          <Form.Item
            name="deptId"
            label="所属部门"
            rules={[{ required: true, message: '请选择部门' }]}
          >
            <Select
              options={(departments.data ?? []).map((dept) => ({
                value: dept.id,
                label: `${dept.deptCode} ${dept.deptName}`,
              }))}
              placeholder="选择部门"
            />
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
