import { useQuery } from '@tanstack/react-query'
import {
  Button,
  Card,
  Col,
  Input,
  Row,
  Select,
  Space,
  Table,
  Tag,
  Typography,
  type TableColumnsType,
} from 'antd'
import { FileSearchOutlined, ReloadOutlined } from '@ant-design/icons'
import { useState } from 'react'
import { listMaterials } from '../api/materials'
import { listWarehouses } from '../api/master'
import { listLedger, type LedgerEntry } from '../api/stock'

const bizLabels: Record<string, { color: string; label: string }> = {
  PURCHASE_IN: { color: 'success', label: '采购入库' },
  SALES_OUT: { color: 'processing', label: '销售出库' },
}

function quantity(value: string | number | null | undefined) {
  if (value === null || value === undefined || value === '') {
    return '-'
  }
  return Number(value).toLocaleString('zh-CN', { maximumFractionDigits: 6 })
}

export default function LedgerPage() {
  const [current, setCurrent] = useState(1)
  const [size, setSize] = useState(20)
  const [keywordInput, setKeywordInput] = useState('')
  const [keyword, setKeyword] = useState('')
  const [materialId, setMaterialId] = useState<number | undefined>()
  const [warehouseId, setWarehouseId] = useState<number | undefined>()
  const [bizType, setBizType] = useState<string | undefined>()

  const ledger = useQuery({
    queryKey: ['ledger', current, size, keyword, materialId, warehouseId, bizType],
    queryFn: () =>
      listLedger({ current, size, keyword, materialId, warehouseId, bizType }),
    placeholderData: (previous) => previous,
  })
  const materials = useQuery({
    queryKey: ['materials', 'options'],
    queryFn: () => listMaterials({ current: 1, size: 100 }),
  })
  const warehouses = useQuery({
    queryKey: ['warehouses'],
    queryFn: listWarehouses,
  })

  const records = ledger.data?.records ?? []
  const inboundQty = records
    .filter((row) => row.direction > 0)
    .reduce((sum, row) => sum + Number(row.qty), 0)
  const outboundQty = records
    .filter((row) => row.direction < 0)
    .reduce((sum, row) => sum + Number(row.qty), 0)

  const columns: TableColumnsType<LedgerEntry> = [
    {
      title: '发生时间',
      dataIndex: 'occurredAt',
      width: 180,
      render: (value: string) => new Date(value).toLocaleString('zh-CN'),
    },
    { title: '物料编码', dataIndex: 'materialCode', width: 130 },
    { title: '物料名称', dataIndex: 'materialName', width: 160 },
    { title: '仓库', dataIndex: 'warehouseName', width: 110 },
    {
      title: '业务类型',
      dataIndex: 'bizType',
      width: 130,
      render: (value: string) => {
        const meta = bizLabels[value]
        return meta ? <Tag color={meta.color}>{meta.label}</Tag> : <Tag>{value}</Tag>
      },
    },
    {
      title: '方向',
      dataIndex: 'direction',
      width: 90,
      render: (value: number) =>
        value > 0 ? <Tag color="success">入库</Tag> : <Tag color="warning">出库</Tag>,
    },
    {
      title: '数量',
      dataIndex: 'qty',
      width: 120,
      align: 'right',
      render: (value: string, record) =>
        `${record.direction > 0 ? '+' : '-'}${quantity(value)}`,
    },
    {
      title: '来源单据',
      dataIndex: 'sourceNo',
      width: 180,
      render: (value: string | null, record) => value || `${record.sourceType}#${record.sourceId}`,
    },
    { title: '备注', dataIndex: 'remark', ellipsis: true },
  ]

  const resetFilters = () => {
    setKeywordInput('')
    setKeyword('')
    setMaterialId(undefined)
    setWarehouseId(undefined)
    setBizType(undefined)
    setCurrent(1)
  }

  return (
    <div className="page">
      <div className="page-heading">
        <div>
          <Typography.Title level={3}>库存流水</Typography.Title>
          <Typography.Text type="secondary">
            库存数量的唯一依据；余额表是流水汇总快照。
          </Typography.Text>
        </div>
        <Space wrap>
          <Input
            allowClear
            prefix={<FileSearchOutlined />}
            placeholder="物料编码 / 名称"
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
            placeholder="物料"
            style={{ width: 200 }}
            value={materialId}
            onChange={(value: number | undefined) => {
              setMaterialId(value)
              setCurrent(1)
            }}
            options={(materials.data?.records ?? []).map((material) => ({
              value: material.id,
              label: `${material.code} ${material.name}`,
            }))}
            showSearch
            optionFilterProp="label"
          />
          <Select
            allowClear
            placeholder="仓库"
            style={{ width: 150 }}
            value={warehouseId}
            onChange={(value: number | undefined) => {
              setWarehouseId(value)
              setCurrent(1)
            }}
            options={(warehouses.data ?? []).map((warehouse) => ({
              value: warehouse.id,
              label: warehouse.warehouseName,
            }))}
          />
          <Select
            allowClear
            placeholder="业务类型"
            style={{ width: 140 }}
            value={bizType}
            onChange={(value: string | undefined) => {
              setBizType(value)
              setCurrent(1)
            }}
            options={[
              { value: 'PURCHASE_IN', label: '采购入库' },
              { value: 'SALES_OUT', label: '销售出库' },
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
          <Button onClick={resetFilters}>重置</Button>
          <Button
            icon={<ReloadOutlined />}
            onClick={() => ledger.refetch()}
            loading={ledger.isFetching}
          >
            刷新
          </Button>
        </Space>
      </div>

      <Row gutter={16}>
        <Col xs={24} sm={8}>
          <Card size="small">
            <Typography.Text type="secondary">当前页入库合计</Typography.Text>
            <div className="ledger-total ledger-total-in">+ {quantity(inboundQty)}</div>
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card size="small">
            <Typography.Text type="secondary">当前页出库合计</Typography.Text>
            <div className="ledger-total ledger-total-out">- {quantity(outboundQty)}</div>
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card size="small">
            <Typography.Text type="secondary">当前页净变动</Typography.Text>
            <div className="ledger-total">
              {quantity(inboundQty - outboundQty)}
            </div>
          </Card>
        </Col>
      </Row>

      <Table<LedgerEntry>
        rowKey="id"
        loading={ledger.isLoading}
        columns={columns}
        dataSource={records}
        scroll={{ x: 1240 }}
        pagination={{
          current,
          pageSize: size,
          total: ledger.data?.total ?? 0,
          showSizeChanger: true,
          showTotal: (total) => `共 ${total} 条`,
          onChange: (nextPage, nextSize) => {
            setCurrent(nextPage)
            setSize(nextSize)
          },
        }}
      />
    </div>
  )
}
