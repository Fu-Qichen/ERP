import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  App,
  Button,
  Col,
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
  Tag,
  Typography,
  type TableColumnsType,
} from 'antd'
import { PlusOutlined, ReloadOutlined, SearchOutlined } from '@ant-design/icons'
import { useState } from 'react'
import { listMaterials } from '../api/materials'
import {
  changeBomStatus,
  createBom,
  deleteBom,
  getBom,
  listBoms,
  updateBom,
  type Bom,
  type BomLine,
} from '../api/manufacturing'

interface LineForm {
  componentId: number
  qty: number
  lossRate: number
}

interface BomFormValues {
  bomCode: string
  productId: number
  version: string
  baseQty: number
  remark?: string
  lines: LineForm[]
}

const emptyLine: LineForm = { componentId: 0, qty: 1, lossRate: 0 }

function quantity(value: string | number | null | undefined) {
  if (value === null || value === undefined || value === '') {
    return '-'
  }
  return Number(value).toLocaleString('zh-CN', { maximumFractionDigits: 6 })
}

export default function BomPage() {
  const { message } = App.useApp()
  const queryClient = useQueryClient()
  const [form] = Form.useForm<BomFormValues>()

  const [current, setCurrent] = useState(1)
  const [size, setSize] = useState(10)
  const [keywordInput, setKeywordInput] = useState('')
  const [keyword, setKeyword] = useState('')
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<Bom | null>(null)
  const [detailId, setDetailId] = useState<number | null>(null)

  const boms = useQuery({
    queryKey: ['boms', current, size, keyword],
    queryFn: () => listBoms({ current, size, keyword }),
    placeholderData: (previous) => previous,
  })
  const detail = useQuery({
    queryKey: ['bom', detailId],
    queryFn: () => getBom(detailId as number),
    enabled: detailId !== null,
  })
  const materials = useQuery({
    queryKey: ['materials', 'options'],
    queryFn: () => listMaterials({ current: 1, size: 100 }),
  })

  const materialOptions = (materials.data?.records ?? []).map((item) => ({
    value: item.id,
    label: `${item.code} ${item.name}`,
  }))
  const productOptions = (materials.data?.records ?? []).map((item) => ({
    value: item.id,
    label: `${item.code} ${item.name}（${item.className ?? '-'}）`,
  }))

  const saveMutation = useMutation({
    mutationFn: (values: BomFormValues) =>
      editing ? updateBom(editing.id, values) : createBom(values),
    onSuccess: () => {
      message.success(editing ? 'BOM 已更新' : 'BOM 已创建')
      setOpen(false)
      queryClient.invalidateQueries({ queryKey: ['boms'] })
    },
    onError: (error: Error) => message.error(error.message),
  })

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: number; status: number }) =>
      changeBomStatus(id, status),
    onSuccess: () => {
      message.success('BOM 状态已更新')
      queryClient.invalidateQueries({ queryKey: ['boms'] })
    },
    onError: (error: Error) => message.error(error.message),
  })

  const deleteMutation = useMutation({
    mutationFn: deleteBom,
    onSuccess: () => {
      message.success('BOM 已删除')
      queryClient.invalidateQueries({ queryKey: ['boms'] })
    },
    onError: (error: Error) => message.error(error.message),
  })

  const openCreate = () => {
    setEditing(null)
    form.resetFields()
    form.setFieldsValue({
      version: 'V1',
      baseQty: 1,
      productId: productOptions[0]?.value,
      remark: '',
      lines: [{ ...emptyLine }],
    })
    setOpen(true)
  }

  const openEdit = async (id: number) => {
    const bom = await getBom(id)
    setEditing(bom)
    form.setFieldsValue({
      bomCode: bom.bomCode,
      productId: bom.productId,
      version: bom.version,
      baseQty: Number(bom.baseQty),
      remark: bom.remark ?? '',
      lines: (bom.lines ?? []).map((line) => ({
        componentId: line.componentId,
        qty: Number(line.qty),
        lossRate: Number(line.lossRate),
      })),
    })
    setOpen(true)
  }

  const submit = async () => {
    saveMutation.mutate(await form.validateFields())
  }

  const columns: TableColumnsType<Bom> = [
    { title: 'BOM 编码', dataIndex: 'bomCode', width: 160, fixed: 'left' },
    { title: '版本', dataIndex: 'version', width: 90 },
    { title: '成品编码', dataIndex: 'productCode', width: 130 },
    { title: '成品名称', dataIndex: 'productName', width: 160 },
    {
      title: '基准数量',
      dataIndex: 'baseQty',
      width: 110,
      align: 'right',
      render: (value: string) => quantity(value),
    },
    {
      title: '状态',
      dataIndex: 'status',
      width: 90,
      render: (value: number) =>
        value === 1 ? <Tag color="success">启用</Tag> : <Tag>停用</Tag>,
    },
    {
      title: '操作',
      key: 'action',
      width: 230,
      fixed: 'right',
      render: (_, record) => (
        <Space>
          <Button type="link" size="small" onClick={() => setDetailId(record.id)}>
            详情
          </Button>
          <Button type="link" size="small" onClick={() => openEdit(record.id)}>
            编辑
          </Button>
          <Button
            type="link"
            size="small"
            onClick={() =>
              statusMutation.mutate({
                id: record.id,
                status: record.status === 1 ? 0 : 1,
              })
            }
          >
            {record.status === 1 ? '停用' : '启用'}
          </Button>
          <Popconfirm
            title="删除该 BOM？"
            description="被生产工单引用时不能删除。"
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

  const detailLineColumns: TableColumnsType<BomLine> = [
    { title: '子件编码', dataIndex: 'componentCode', width: 130 },
    { title: '子件名称', dataIndex: 'componentName', width: 160 },
    {
      title: '用量',
      dataIndex: 'qty',
      width: 110,
      align: 'right',
      render: (value: string) => quantity(value),
    },
    { title: '单位', dataIndex: 'unitName', width: 90 },
    {
      title: '损耗率(%)',
      dataIndex: 'lossRate',
      width: 110,
      align: 'right',
    },
  ]

  return (
    <div className="page">
      <div className="page-heading">
        <div>
          <Typography.Title level={3}>物料清单（BOM）</Typography.Title>
          <Typography.Text type="secondary">
            按基准数量定义子件用量与损耗，供生产工单领料参考。
          </Typography.Text>
        </div>
        <Space wrap>
          <Input
            allowClear
            prefix={<SearchOutlined />}
            placeholder="BOM 编码 / 成品"
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
            onClick={() => queryClient.invalidateQueries({ queryKey: ['boms'] })}
          >
            刷新
          </Button>
          <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>
            新增 BOM
          </Button>
        </Space>
      </div>

      <Table<Bom>
        rowKey="id"
        loading={boms.isLoading}
        columns={columns}
        dataSource={boms.data?.records ?? []}
        scroll={{ x: 1080 }}
        pagination={{
          current,
          pageSize: size,
          total: boms.data?.total ?? 0,
          showSizeChanger: true,
          showTotal: (total) => `共 ${total} 条`,
          onChange: (nextPage, nextSize) => {
            setCurrent(nextPage)
            setSize(nextSize)
          },
        }}
      />

      <Modal
        title={editing ? '编辑 BOM' : '新增 BOM'}
        open={open}
        width={900}
        onOk={submit}
        confirmLoading={saveMutation.isPending}
        onCancel={() => setOpen(false)}
        okText="保存"
        cancelText="取消"
        destroyOnHidden
      >
        <Form form={form} layout="vertical">
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item
                name="bomCode"
                label="BOM 编码"
                rules={[{ required: true, message: '请输入 BOM 编码' }]}
              >
                <Input maxLength={32} placeholder="如 BOM-M004" />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item
                name="version"
                label="版本"
                rules={[{ required: true, message: '请输入版本' }]}
              >
                <Input maxLength={16} />
              </Form.Item>
            </Col>
            <Col span={10}>
              <Form.Item
                name="productId"
                label="成品"
                rules={[{ required: true, message: '请选择成品' }]}
              >
                <Select
                  showSearch
                  optionFilterProp="label"
                  options={productOptions}
                />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item
                name="baseQty"
                label="基准数量"
                rules={[{ required: true, message: '请输入基准数量' }]}
              >
                <InputNumber min={0.000001} precision={6} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={16}>
              <Form.Item name="remark" label="备注">
                <Input maxLength={255} placeholder="可选" />
              </Form.Item>
            </Col>
          </Row>

          <Divider>BOM 明细</Divider>
          <Form.List name="lines">
            {(fields, { add, remove }) => (
              <>
                {fields.map(({ key, name, ...restField }) => (
                  <Row key={key} gutter={8}>
                    <Col span={11}>
                      <Form.Item
                        {...restField}
                        name={[name, 'componentId']}
                        label="子件"
                        rules={[{ required: true, message: '请选择子件' }]}
                      >
                        <Select
                          showSearch
                          optionFilterProp="label"
                          options={materialOptions}
                        />
                      </Form.Item>
                    </Col>
                    <Col span={6}>
                      <Form.Item
                        {...restField}
                        name={[name, 'qty']}
                        label="用量"
                        rules={[{ required: true, message: '请输入用量' }]}
                      >
                        <InputNumber min={0.000001} precision={6} style={{ width: '100%' }} />
                      </Form.Item>
                    </Col>
                    <Col span={5}>
                      <Form.Item
                        {...restField}
                        name={[name, 'lossRate']}
                        label="损耗率(%)"
                        rules={[{ required: true, message: '请输入损耗率' }]}
                      >
                        <InputNumber min={0} max={100} precision={2} style={{ width: '100%' }} />
                      </Form.Item>
                    </Col>
                    <Col span={2}>
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
                <Button
                  type="dashed"
                  block
                  icon={<PlusOutlined />}
                  onClick={() => add({ ...emptyLine })}
                >
                  添加子件
                </Button>
              </>
            )}
          </Form.List>
        </Form>
      </Modal>

      <Modal
        title={detail.data?.bomCode ?? 'BOM 详情'}
        open={detailId !== null}
        width={860}
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
                { key: 'bom', label: '版本', children: detail.data.version },
                { key: 'product', label: '成品', children: detail.data.productName },
                {
                  key: 'base',
                  label: '基准数量',
                  children: quantity(detail.data.baseQty),
                },
                {
                  key: 'status',
                  label: '状态',
                  children:
                    detail.data.status === 1 ? (
                      <Tag color="success">启用</Tag>
                    ) : (
                      <Tag>停用</Tag>
                    ),
                },
                { key: 'remark', label: '备注', children: detail.data.remark || '-' },
              ]}
            />
            <Divider />
            <Table<BomLine>
              rowKey="id"
              size="small"
              pagination={false}
              columns={detailLineColumns}
              dataSource={detail.data.lines ?? []}
            />
          </>
        )}
      </Modal>
    </div>
  )
}
