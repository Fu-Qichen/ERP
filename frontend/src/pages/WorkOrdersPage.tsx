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
  Popconfirm,
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
import BatchSelect from '../components/BatchSelect'
import { listMaterials } from '../api/materials'
import { listWarehouses } from '../api/master'
import {
  createWorkOrder,
  getWorkOrder,
  issueWorkOrder,
  listBoms,
  listWorkOrderIssues,
  listWorkOrderReports,
  listWorkOrders,
  releaseWorkOrder,
  reportWorkOrder,
  type Bom,
  type IssueRow,
  type ReportRow,
  type WorkOrder,
} from '../api/manufacturing'

interface WorkOrderFormValues {
  productId: number
  bomId: number
  warehouseId: number
  planQty: number
  orderDate: Dayjs
  remark?: string
}

interface IssueFormValues {
  lines: { materialId: number; qty: number; batchId?: number }[]
}

const statusMeta: Record<number, { color: string; label: string }> = {
  0: { color: 'default', label: '草稿' },
  1: { color: 'processing', label: '已下达' },
  2: { color: 'success', label: '已完工' },
  3: { color: 'warning', label: '已关闭' },
}

function quantity(value: string | number | null | undefined) {
  if (value === null || value === undefined || value === '') {
    return '-'
  }
  return Number(value).toLocaleString('zh-CN', { maximumFractionDigits: 6 })
}

export default function WorkOrdersPage() {
  const { message } = App.useApp()
  const queryClient = useQueryClient()
  const [form] = Form.useForm<WorkOrderFormValues>()
  const [issueForm] = Form.useForm<IssueFormValues>()
  const [reportForm] = Form.useForm<{ qty: number; batchNo?: string }>()

  const [current, setCurrent] = useState(1)
  const [size, setSize] = useState(10)
  const [keywordInput, setKeywordInput] = useState('')
  const [keyword, setKeyword] = useState('')
  const [statusFilter, setStatusFilter] = useState<number | undefined>()
  const [open, setOpen] = useState(false)
  const [issueOpen, setIssueOpen] = useState(false)
  const [reportOpen, setReportOpen] = useState(false)
  const [detailId, setDetailId] = useState<number | null>(null)
  const [activeOrder, setActiveOrder] = useState<WorkOrder | null>(null)

  const orders = useQuery({
    queryKey: ['work-orders', current, size, keyword, statusFilter],
    queryFn: () => listWorkOrders({ current, size, keyword, status: statusFilter }),
    placeholderData: (previous) => previous,
  })
  const detail = useQuery({
    queryKey: ['work-order', detailId],
    queryFn: () => getWorkOrder(detailId as number),
    enabled: detailId !== null,
  })
  const issues = useQuery({
    queryKey: ['work-order-issues', detailId],
    queryFn: () => listWorkOrderIssues(detailId as number),
    enabled: detailId !== null,
  })
  const reports = useQuery({
    queryKey: ['work-order-reports', detailId],
    queryFn: () => listWorkOrderReports(detailId as number),
    enabled: detailId !== null,
  })
  const materials = useQuery({
    queryKey: ['materials', 'options'],
    queryFn: () => listMaterials({ current: 1, size: 100 }),
  })
  const boms = useQuery({
    queryKey: ['boms', 'options'],
    queryFn: () => listBoms({ current: 1, size: 100 }),
  })
  const warehouses = useQuery({
    queryKey: ['warehouses'],
    queryFn: listWarehouses,
  })

  const materialOptions = (materials.data?.records ?? []).map((item) => ({
    value: item.id,
    label: `${item.code} ${item.name}`,
  }))
  const productOptions = materialOptions
  const bomOptions = (boms.data?.records ?? []).map((bom: Bom) => ({
    value: bom.id,
    label: `${bom.bomCode} ${bom.version} · ${bom.productName}`,
  }))
  const warehouseOptions = (warehouses.data ?? []).map((item) => ({
    value: item.id,
    label: item.warehouseName,
  }))

  const invalidateAll = () => {
    queryClient.invalidateQueries({ queryKey: ['work-orders'] })
    queryClient.invalidateQueries({ queryKey: ['work-order'] })
    queryClient.invalidateQueries({ queryKey: ['work-order-issues'] })
    queryClient.invalidateQueries({ queryKey: ['work-order-reports'] })
    queryClient.invalidateQueries({ queryKey: ['inventory'] })
    queryClient.invalidateQueries({ queryKey: ['ledger'] })
  }

  const createMutation = useMutation({
    mutationFn: (values: WorkOrderFormValues) =>
      createWorkOrder({
        productId: values.productId,
        bomId: values.bomId,
        warehouseId: values.warehouseId,
        planQty: values.planQty,
        orderDate: values.orderDate.format('YYYY-MM-DD'),
        remark: values.remark,
      }),
    onSuccess: () => {
      message.success('生产工单已创建')
      setOpen(false)
      invalidateAll()
    },
    onError: (error: Error) => message.error(error.message),
  })

  const releaseMutation = useMutation({
    mutationFn: releaseWorkOrder,
    onSuccess: () => {
      message.success('工单已下达，可以领料')
      invalidateAll()
    },
    onError: (error: Error) => message.error(error.message),
  })

  const issueMutation = useMutation({
    mutationFn: ({ id, lines }: { id: number; lines: { materialId: number; qty: number }[] }) =>
      issueWorkOrder(id, lines),
    onSuccess: () => {
      message.success('领料完成，子件库存已扣减')
      setIssueOpen(false)
      invalidateAll()
    },
    onError: (error: Error) => message.error(error.message),
  })

  const reportMutation = useMutation({
    mutationFn: ({ id, qty, batchNo }: { id: number; qty: number; batchNo?: string }) =>
      reportWorkOrder(id, qty, batchNo),
    onSuccess: () => {
      message.success('报工完成，成品已入库')
      setReportOpen(false)
      invalidateAll()
    },
    onError: (error: Error) => message.error(error.message),
  })

  const openCreate = () => {
    form.resetFields()
    form.setFieldsValue({
      productId: productOptions[0]?.value,
      bomId: bomOptions[0]?.value,
      warehouseId: warehouseOptions[0]?.value,
      planQty: 1,
      orderDate: dayjs(),
      remark: '',
    })
    setOpen(true)
  }

  const submit = async () => {
    createMutation.mutate(await form.validateFields())
  }

  const openIssue = (order: WorkOrder) => {
    setActiveOrder(order)
    issueForm.resetFields()
    issueForm.setFieldsValue({ lines: [{ materialId: 0, qty: 1 }] })
    setIssueOpen(true)
  }

  const openReport = (order: WorkOrder) => {
    setActiveOrder(order)
    reportForm.resetFields()
    const remaining = Number(order.planQty) - Number(order.finishQty)
    reportForm.setFieldsValue({ qty: remaining > 0 ? remaining : 0 })
    setReportOpen(true)
  }

  const submitIssue = async () => {
    if (!activeOrder) {
      return
    }
    const values = await issueForm.validateFields()
    issueMutation.mutate({ id: activeOrder.id, lines: values.lines })
  }

  const submitReport = async () => {
    if (!activeOrder) {
      return
    }
    const values = await reportForm.validateFields()
    reportMutation.mutate({ id: activeOrder.id, qty: values.qty, batchNo: values.batchNo })
  }

  const columns: TableColumnsType<WorkOrder> = [
    { title: '工单号', dataIndex: 'workOrderNo', width: 170 },
    { title: '开工日期', dataIndex: 'orderDate', width: 110 },
    { title: '成品', dataIndex: 'productName', width: 130 },
    { title: 'BOM', dataIndex: 'bomCode', width: 120 },
    { title: '仓库', dataIndex: 'warehouseName', width: 90 },
    {
      title: '计划',
      dataIndex: 'planQty',
      width: 90,
      align: 'right',
      render: (value: string) => quantity(value),
    },
    {
      title: '已领料',
      dataIndex: 'issuedQty',
      width: 90,
      align: 'right',
      render: (value: string) => quantity(value),
    },
    {
      title: '已完工',
      dataIndex: 'finishQty',
      width: 90,
      align: 'right',
      render: (value: string) => quantity(value),
    },
    {
      title: '状态',
      dataIndex: 'status',
      width: 95,
      render: (value: number) => {
        const meta = statusMeta[value] ?? statusMeta[0]
        return <Tag color={meta.color}>{meta.label}</Tag>
      },
    },
    {
      title: '操作',
      key: 'action',
      width: 200,
      className: 'table-actions',
      render: (_, record) => (
        <Space>
          <Button type="link" size="small" onClick={() => setDetailId(record.id)}>
            详情
          </Button>
          {record.status === 0 && (
            <Popconfirm
              title="下达该工单？"
              description="下达后可以领料与报工。"
              okText="下达"
              cancelText="取消"
              onConfirm={() => releaseMutation.mutate(record.id)}
            >
              <Button type="link" size="small">
                下达
              </Button>
            </Popconfirm>
          )}
          {record.status === 1 && (
            <>
              <Button type="link" size="small" onClick={() => openIssue(record)}>
                领料
              </Button>
              <Button type="link" size="small" onClick={() => openReport(record)}>
                报工
              </Button>
            </>
          )}
        </Space>
      ),
    },
  ]

  const issueColumns: TableColumnsType<IssueRow> = [
    { title: '领料单号', dataIndex: 'issueNo', width: 180 },
    { title: '物料编码', dataIndex: 'materialCode', width: 120 },
    { title: '物料名称', dataIndex: 'materialName', width: 150 },
    {
      title: '领料数量',
      dataIndex: 'qty',
      width: 110,
      align: 'right',
      render: (value: string) => quantity(value),
    },
    { title: '时间', dataIndex: 'createdAt', width: 170 },
  ]

  const reportColumns: TableColumnsType<ReportRow> = [
    { title: '报工单号', dataIndex: 'reportNo', width: 180 },
    { title: '成品编码', dataIndex: 'productCode', width: 120 },
    { title: '成品名称', dataIndex: 'productName', width: 150 },
    {
      title: '完工数量',
      dataIndex: 'qty',
      width: 110,
      align: 'right',
      render: (value: string) => quantity(value),
    },
    { title: '时间', dataIndex: 'createdAt', width: 170 },
  ]

  return (
    <div className="page">
      <div className="page-heading">
        <div>
          <Typography.Title level={3}>生产工单</Typography.Title>
          <Typography.Text type="secondary">
            按 BOM 下达工单；领料扣子件库存，报工增加成品库存。
          </Typography.Text>
        </div>
        <Space wrap>
          <Input
            allowClear
            prefix={<SearchOutlined />}
            placeholder="工单号 / 成品"
            value={keywordInput}
            onChange={(event) => setKeywordInput(event.target.value)}
            onPressEnter={() => {
              setKeyword(keywordInput.trim())
              setCurrent(1)
            }}
            style={{ width: 200 }}
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
              { value: 0, label: '草稿' },
              { value: 1, label: '已下达' },
              { value: 2, label: '已完工' },
              { value: 3, label: '已关闭' },
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
            onClick={() => queryClient.invalidateQueries({ queryKey: ['work-orders'] })}
          >
            刷新
          </Button>
          <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>
            新增工单
          </Button>
        </Space>
      </div>

      <Table<WorkOrder>
        rowKey="id"
        loading={orders.isLoading}
        columns={columns}
        dataSource={orders.data?.records ?? []}
        scroll={{ x: 1180 }}
        pagination={{
          current,
          pageSize: size,
          total: orders.data?.total ?? 0,
          showSizeChanger: true,
          showTotal: (total) => `共 ${total} 条`,
          onChange: (nextPage, nextSize) => {
            setCurrent(nextPage)
            setSize(nextSize)
          },
        }}
      />

      <Modal
        title="新增生产工单"
        open={open}
        width={760}
        onOk={submit}
        confirmLoading={createMutation.isPending}
        onCancel={() => setOpen(false)}
        okText="保存草稿"
        cancelText="取消"
        destroyOnHidden
      >
        <Form form={form} layout="vertical">
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="productId"
                label="成品"
                rules={[{ required: true, message: '请选择成品' }]}
              >
                <Select showSearch optionFilterProp="label" options={productOptions} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="bomId"
                label="BOM"
                rules={[{ required: true, message: '请选择 BOM' }]}
              >
                <Select showSearch optionFilterProp="label" options={bomOptions} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="warehouseId"
                label="生产仓库"
                rules={[{ required: true, message: '请选择仓库' }]}
              >
                <Select options={warehouseOptions} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="planQty"
                label="计划数量"
                rules={[{ required: true, message: '请输入计划数量' }]}
              >
                <InputNumber min={0.000001} precision={6} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="orderDate"
                label="开工日期"
                rules={[{ required: true, message: '请选择日期' }]}
              >
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="remark" label="备注">
            <Input maxLength={255} placeholder="可选" />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title={`领料 - ${activeOrder?.workOrderNo ?? ''}`}
        open={issueOpen}
        width={720}
        onOk={submitIssue}
        confirmLoading={issueMutation.isPending}
        onCancel={() => setIssueOpen(false)}
        okText="确认领料"
        cancelText="取消"
        destroyOnHidden
      >
        <Form form={issueForm} layout="vertical">
          <Form.List name="lines">
            {(fields, { add, remove }) => (
              <>
                {fields.map(({ key, name, ...restField }) => (
                  <Row key={key} gutter={8}>
                    <Col span={8}>
                      <Form.Item
                        {...restField}
                        name={[name, 'materialId']}
                        label="子件"
                        rules={[{ required: true, message: '请选择子件' }]}
                      >
                        <Select showSearch optionFilterProp="label" options={materialOptions} />
                      </Form.Item>
                    </Col>
                    <Col span={6}>
                      <Form.Item
                        {...restField}
                        name={[name, 'batchId']}
                        label="批次（批次物料必填）"
                      >
                        <BatchSelect
                          materialId={issueForm.getFieldValue(['lines', name, 'materialId'])}
                          warehouseId={activeOrder?.warehouseId}
                        />
                      </Form.Item>
                    </Col>
                    <Col span={7}>
                      <Form.Item
                        {...restField}
                        name={[name, 'qty']}
                        label="领料数量"
                        rules={[{ required: true, message: '请输入数量' }]}
                      >
                        <InputNumber min={0.000001} precision={6} style={{ width: '100%' }} />
                      </Form.Item>
                    </Col>
                    <Col span={3}>
                      <Form.Item label=" ">
                        <Button
                          danger
                          type="text"
                          disabled={fields.length === 1}
                          onClick={() => remove(name)}
                        >
                          删
                        </Button>
                      </Form.Item>
                    </Col>
                  </Row>
                ))}
                <Button type="dashed" block icon={<PlusOutlined />} onClick={() => add()}>
                  添加子件
                </Button>
              </>
            )}
          </Form.List>
        </Form>
      </Modal>

      <Modal
        title={`报工 - ${activeOrder?.workOrderNo ?? ''}`}
        open={reportOpen}
        onOk={submitReport}
        confirmLoading={reportMutation.isPending}
        onCancel={() => setReportOpen(false)}
        okText="确认报工"
        cancelText="取消"
        destroyOnHidden
      >
        <Form form={reportForm} layout="vertical">
          <Form.Item
            name="qty"
            label="完工数量"
            rules={[{ required: true, message: '请输入完工数量' }]}
          >
            <InputNumber min={0.000001} precision={6} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item
            name="batchNo"
            label="成品批次号"
            extra="成品启用批次管理时必须填写；留空则自动按日期生成"
          >
            <Input placeholder="如 B20261101" maxLength={64} />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title={detail.data?.workOrderNo ?? '工单详情'}
        open={detailId !== null}
        width={920}
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
                { key: 'product', label: '成品', children: detail.data.productName },
                { key: 'bom', label: 'BOM', children: detail.data.bomCode },
                { key: 'warehouse', label: '仓库', children: detail.data.warehouseName },
                {
                  key: 'plan',
                  label: '计划数量',
                  children: quantity(detail.data.planQty),
                },
                {
                  key: 'finish',
                  label: '已完工',
                  children: quantity(detail.data.finishQty),
                },
                {
                  key: 'issued',
                  label: '已领料',
                  children: quantity(detail.data.issuedQty),
                },
                {
                  key: 'status',
                  label: '状态',
                  children: (
                    <Tag color={statusMeta[detail.data.status]?.color}>
                      {statusMeta[detail.data.status]?.label}
                    </Tag>
                  ),
                },
                { key: 'date', label: '开工日期', children: detail.data.orderDate },
                { key: 'remark', label: '备注', children: detail.data.remark || '-' },
              ]}
            />
            <Divider />
            <Tabs
              items={[
                {
                  key: 'issues',
                  label: '领料记录',
                  children: (
                    <Table<IssueRow>
                      rowKey="id"
                      size="small"
                      pagination={false}
                      loading={issues.isLoading}
                      columns={issueColumns}
                      dataSource={issues.data ?? []}
                    />
                  ),
                },
                {
                  key: 'reports',
                  label: '报工记录',
                  children: (
                    <Table<ReportRow>
                      rowKey="id"
                      size="small"
                      pagination={false}
                      loading={reports.isLoading}
                      columns={reportColumns}
                      dataSource={reports.data ?? []}
                    />
                  ),
                },
              ]}
            />
          </>
        )}
      </Modal>
    </div>
  )
}
