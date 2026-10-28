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
  Tabs,
  Tag,
  Typography,
  type TableColumnsType,
} from 'antd'
import { PlusOutlined } from '@ant-design/icons'
import { useEffect, useState, type Key } from 'react'
import {
  createDepartment,
  createStaff,
  deleteDepartment,
  deleteStaff,
  listDepartments,
  listStaff,
  updateDepartment,
  updateStaff,
  type Dept,
  type DeptInput,
  type Staff,
  type StaffInput,
} from '../api/organization'

interface DeptNode extends Dept {
  children?: DeptNode[]
}

function buildTree(rows: Dept[]): DeptNode[] {
  const map = new Map<number, DeptNode>()
  rows.forEach((row) => map.set(row.id, { ...row, children: [] }))
  const roots: DeptNode[] = []
  rows.forEach((row) => {
    const node = map.get(row.id)!
    if (row.parentId && map.has(row.parentId)) {
      map.get(row.parentId)!.children!.push(node)
    } else {
      roots.push(node)
    }
  })
  const stripEmpty = (node: DeptNode): DeptNode => {
    if (!node.children || node.children.length === 0) {
      delete node.children
    } else {
      node.children = node.children.map(stripEmpty)
    }
    return node
  }

  return roots.map(stripEmpty)
}

function DepartmentsTab() {
  const { message } = App.useApp()
  const queryClient = useQueryClient()
  const [form] = Form.useForm<DeptInput>()
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<Dept | null>(null)
  const [expandedKeys, setExpandedKeys] = useState<Key[]>([])

  const departments = useQuery({
    queryKey: ['departments'],
    queryFn: listDepartments,
  })

  useEffect(() => {
    setExpandedKeys((departments.data ?? []).map((dept) => dept.id))
  }, [departments.data])

  const saveMutation = useMutation({
    mutationFn: (values: DeptInput) =>
      editing ? updateDepartment(editing.id, values) : createDepartment(values),
    onSuccess: () => {
      message.success(editing ? '部门已更新' : '部门已创建')
      setOpen(false)
      queryClient.invalidateQueries({ queryKey: ['departments'] })
      queryClient.invalidateQueries({ queryKey: ['staff'] })
    },
    onError: (error: Error) => message.error(error.message),
  })

  const deleteMutation = useMutation({
    mutationFn: deleteDepartment,
    onSuccess: () => {
      message.success('部门已删除')
      queryClient.invalidateQueries({ queryKey: ['departments'] })
    },
    onError: (error: Error) => message.error(error.message),
  })

  const openCreate = () => {
    setEditing(null)
    form.resetFields()
    form.setFieldsValue({ status: 1 })
    setOpen(true)
  }

  const openEdit = (record: Dept) => {
    setEditing(record)
    form.setFieldsValue({
      deptCode: record.deptCode,
      deptName: record.deptName,
      parentId: record.parentId ?? undefined,
      status: record.status,
    })
    setOpen(true)
  }

  const submit = async () => {
    saveMutation.mutate(await form.validateFields())
  }

  const options = (departments.data ?? [])
    .filter((dept) => dept.id !== editing?.id)
    .map((dept) => ({
      value: dept.id,
      label: `${dept.deptCode} ${dept.deptName}`,
    }))

  const columns: TableColumnsType<DeptNode> = [
    { title: '部门编码', dataIndex: 'deptCode', width: 140 },
    { title: '部门名称', dataIndex: 'deptName' },
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
            title="删除该部门？"
            description="有子部门或员工时不能删除。"
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
          新增部门
        </Button>
      </div>
      <Table<DeptNode>
        rowKey="id"
        loading={departments.isLoading}
        columns={columns}
        dataSource={buildTree(departments.data ?? [])}
        pagination={false}
        expandable={{
          expandedRowKeys: expandedKeys,
          onExpandedRowsChange: (keys) => setExpandedKeys([...keys]),
        }}
      />

      <Modal
        title={editing ? '编辑部门' : '新增部门'}
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
            name="deptCode"
            label="部门编码"
            rules={[{ required: true, message: '请输入部门编码' }]}
          >
            <Input maxLength={32} />
          </Form.Item>
          <Form.Item
            name="deptName"
            label="部门名称"
            rules={[{ required: true, message: '请输入部门名称' }]}
          >
            <Input maxLength={128} />
          </Form.Item>
          <Form.Item name="parentId" label="上级部门">
            <Select allowClear options={options} placeholder="不选表示根部门" />
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

function StaffTab() {
  const { message } = App.useApp()
  const queryClient = useQueryClient()
  const [form] = Form.useForm<StaffInput>()
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<Staff | null>(null)

  const departments = useQuery({
    queryKey: ['departments'],
    queryFn: listDepartments,
  })
  const staff = useQuery({
    queryKey: ['staff'],
    queryFn: listStaff,
  })

  const deptNames = new Map(
    (departments.data ?? []).map((dept) => [dept.id, dept.deptName]),
  )

  const saveMutation = useMutation({
    mutationFn: (values: StaffInput) =>
      editing ? updateStaff(editing.id, values) : createStaff(values),
    onSuccess: () => {
      message.success(editing ? '员工已更新' : '员工已创建')
      setOpen(false)
      queryClient.invalidateQueries({ queryKey: ['staff'] })
    },
    onError: (error: Error) => message.error(error.message),
  })

  const deleteMutation = useMutation({
    mutationFn: deleteStaff,
    onSuccess: () => {
      message.success('员工已删除')
      queryClient.invalidateQueries({ queryKey: ['staff'] })
    },
    onError: (error: Error) => message.error(error.message),
  })

  const openCreate = () => {
    setEditing(null)
    form.resetFields()
    form.setFieldsValue({ status: 1 })
    setOpen(true)
  }

  const openEdit = (record: Staff) => {
    setEditing(record)
    form.setFieldsValue({
      staffNo: record.staffNo,
      staffName: record.staffName,
      deptId: record.deptId,
      status: record.status,
    })
    setOpen(true)
  }

  const submit = async () => {
    saveMutation.mutate(await form.validateFields())
  }

  const columns: TableColumnsType<Staff> = [
    { title: '员工编号', dataIndex: 'staffNo', width: 140 },
    { title: '姓名', dataIndex: 'staffName', width: 160 },
    {
      title: '所属部门',
      dataIndex: 'deptId',
      render: (value: number) => deptNames.get(value) ?? '-',
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
            title="删除该员工？"
            description="被客户引用时不能删除。"
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
          新增员工
        </Button>
      </div>
      <Table<Staff>
        rowKey="id"
        loading={staff.isLoading}
        columns={columns}
        dataSource={staff.data ?? []}
        pagination={false}
      />

      <Modal
        title={editing ? '编辑员工' : '新增员工'}
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
            name="staffNo"
            label="员工编号"
            rules={[{ required: true, message: '请输入员工编号' }]}
          >
            <Input maxLength={32} />
          </Form.Item>
          <Form.Item
            name="staffName"
            label="姓名"
            rules={[{ required: true, message: '请输入姓名' }]}
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
    </>
  )
}

export default function OrganizationPage() {
  return (
    <div className="page">
      <div className="page-heading">
        <div>
          <Typography.Title level={3}>组织架构</Typography.Title>
          <Typography.Text type="secondary">
            部门树与员工档案，客户/供应商的业务员从这里引用。
          </Typography.Text>
        </div>
      </div>

      <Tabs
        items={[
          { key: 'departments', label: '部门', children: <DepartmentsTab /> },
          { key: 'staff', label: '员工', children: <StaffTab /> },
        ]}
      />
    </div>
  )
}
