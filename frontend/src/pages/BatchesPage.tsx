import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  Button,
  Card,
  Col,
  DatePicker,
  Form,
  Input,
  message,
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
import { listMaterials } from '../api/materials'
import { listWarehouses } from '../api/master'
import { createBatch, listBatches, updateBatch, type Batch } from '../api/batches'

const sourceLabels: Record<string, string> = {
  GR: '采购收货',
  WO: '生产报工',
  MANUAL: '手工新建',
}

interface BatchFormValues {
  materialId: number
  batchNo: string
  produceDate?: Dayjs
  expireDate?: Dayjs
  remark?: string
}

export default function BatchesPage() {
  const queryClient = useQueryClient()
  const [keyword, setKeyword] = useState('')
  const [search, setSearch] = useState('')
  const [materialId, setMaterialId] = useState<number | undefined>()
  const [warehouseId, setWarehouseId] = useState<number | undefined>()
  const [page, setPage] = useState({ current: 1, size: 20 })
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<Batch | null>(null)
  const [form] = Form.useForm<BatchFormValues>()

  const materials = useQuery({
    queryKey: ['materials', 'options'],
    queryFn: () => listMaterials({ current: 1, size: 100 }),
  })
  const warehouses = useQuery({ queryKey: ['warehouses'], queryFn: () => listWarehouses() })

  const batches = useQuery({
    queryKey: ['batches', page.current, page.size, search, materialId, warehouseId],
    queryFn: () =>
      listBatches({
        current: page.current,
        size: page.size,
        keyword: search || undefined,
        materialId,
        warehouseId,
      }),
  })

  const materialOptions = (materials.data?.records ?? []).map((item) => ({
    value: item.id,
    label: `${item.code} ${item.name}`,
  }))
  const warehouseOptions = (warehouses.data ?? []).map((item) => ({
    value: item.id,
    label: item.warehouseName,
  }))

  const createMutation = useMutation({
    mutationFn: createBatch,
    onSuccess: () => {
      message.success('批次已创建')
      setOpen(false)
      queryClient.invalidateQueries({ queryKey: ['batches'] })
    },
    onError: (error: Error) => message.error(error.message),
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, values }: { id: number; values: BatchFormValues }) =>
      updateBatch(id, {
        produceDate: values.produceDate ? values.produceDate.format('YYYY-MM-DD') : null,
        expireDate: values.expireDate ? values.expireDate.format('YYYY-MM-DD') : null,
        remark: values.remark,
      }),
    onSuccess: () => {
      message.success('批次已更新')
      setOpen(false)
      queryClient.invalidateQueries({ queryKey: ['batches'] })
    },
    onError: (error: Error) => message.error(error.message),
  })

  const openCreate = () => {
    setEditing(null)
    form.resetFields()
    setOpen(true)
  }

  const openEdit = (record: Batch) => {
    setEditing(record)
    form.setFieldsValue({
      materialId: record.materialId,
      batchNo: record.batchNo,
      produceDate: record.produceDate ? dayjs(record.produceDate) : undefined,
      expireDate: record.expireDate ? dayjs(record.expireDate) : undefined,
      remark: record.remark ?? undefined,
    })
    setOpen(true)
  }

  const submit = () => {
    form.validateFields().then((values) => {
      if (editing) {
        updateMutation.mutate({ id: editing.id, values })
        return
      }
      createMutation.mutate({
        materialId: values.materialId,
        batchNo: values.batchNo,
        produceDate: values.produceDate ? values.produceDate.format('YYYY-MM-DD') : null,
        expireDate: values.expireDate ? values.expireDate.format('YYYY-MM-DD') : null,
        remark: values.remark,
      })
    })
  }

  const columns: TableColumnsType<Batch> = [
    { title: '批次号', dataIndex: 'batchNo', width: 160, fixed: 'left' },
    { title: '物料编码', dataIndex: 'materialCode', width: 120 },
    { title: '物料名称', dataIndex: 'materialName', width: 160 },
    { title: '生产日期', dataIndex: 'produceDate', width: 120 },
    { title: '到期日', dataIndex: 'expireDate', width: 120 },
    {
      title: '可用库存',
      dataIndex: 'availableQty',
      width: 110,
      align: 'right',
      render: (value: string) => (
        <span style={{ color: Number(value) > 0 ? undefined : '#bfbfbf' }}>
          {Number(value)}
        </span>
      ),
    },
    {
      title: '来源',
      dataIndex: 'sourceType',
      width: 110,
      render: (value: string | null) => (
        <Tag>{value ? sourceLabels[value] ?? value : '-'}</Tag>
      ),
    },
    { title: '备注', dataIndex: 'remark', width: 160, render: (value: string | null) => value || '-' },
    {
      title: '操作',
      key: 'action',
      width: 90,
      render: (_, record) => (
        <Button type="link" size="small" onClick={() => openEdit(record)}>
          编辑
        </Button>
      ),
    },
  ]

  return (
    <Card
      title="批次档案"
      extra={
        <Space>
          <Input
            allowClear
            placeholder="批次号 / 物料"
            prefix={<SearchOutlined />}
            style={{ width: 220 }}
            value={keyword}
            onChange={(event) => setKeyword(event.target.value)}
            onPressEnter={() => {
              setSearch(keyword)
              setPage((prev) => ({ ...prev, current: 1 }))
            }}
          />
          <Select
            allowClear
            showSearch
            optionFilterProp="label"
            placeholder="物料"
            style={{ width: 200 }}
            options={materialOptions}
            value={materialId}
            onChange={(value) => {
              setMaterialId(value)
              setPage((prev) => ({ ...prev, current: 1 }))
            }}
          />
          <Select
            allowClear
            placeholder="仓库"
            style={{ width: 140 }}
            options={warehouseOptions}
            value={warehouseId}
            onChange={(value) => {
              setWarehouseId(value)
              setPage((prev) => ({ ...prev, current: 1 }))
            }}
          />
          <Button
            icon={<ReloadOutlined />}
            onClick={() => {
              setSearch(keyword)
              setPage((prev) => ({ ...prev, current: 1 }))
            }}
          >
            查询
          </Button>
          <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>
            新建批次
          </Button>
        </Space>
      }
    >
      <Typography.Paragraph type="secondary">
        可用库存按物料 + 仓库统计当前批次余额；出库时按到期日从早到晚排序，便于先到期先出。
      </Typography.Paragraph>
      <Table
        rowKey="id"
        size="small"
        loading={batches.isLoading}
        columns={columns}
        dataSource={batches.data?.records ?? []}
        scroll={{ x: 1180 }}
        pagination={{
          current: page.current,
          pageSize: page.size,
          total: batches.data?.total ?? 0,
          showSizeChanger: true,
          onChange: (current, size) => setPage({ current, size }),
        }}
      />

      <Modal
        title={editing ? `编辑批次 ${editing.batchNo}` : '新建批次'}
        open={open}
        width={640}
        onOk={submit}
        confirmLoading={createMutation.isPending || updateMutation.isPending}
        onCancel={() => setOpen(false)}
        okText="保存"
        cancelText="取消"
        destroyOnHidden
      >
        <Form form={form} layout="vertical">
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="materialId"
                label="物料"
                rules={[{ required: true, message: '请选择物料' }]}
              >
                <Select
                  showSearch
                  optionFilterProp="label"
                  disabled={Boolean(editing)}
                  options={materialOptions}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="batchNo"
                label="批次号"
                rules={[{ required: true, message: '请输入批次号' }]}
              >
                <Input disabled={Boolean(editing)} placeholder="如 B20261101" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="produceDate" label="生产日期">
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="expireDate" label="到期日">
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={24}>
              <Form.Item name="remark" label="备注">
                <Input.TextArea rows={2} maxLength={255} />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>
    </Card>
  )
}
