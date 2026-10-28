import { useQuery } from '@tanstack/react-query'
import {
  Button,
  Card,
  Col,
  Row,
  Select,
  Space,
  Statistic,
  Switch,
  Table,
  Tag,
  Typography,
  type TableColumnsType,
} from 'antd'
import { ReloadOutlined } from '@ant-design/icons'
import { useState } from 'react'
import { listWarehouses } from '../api/master'
import { listReconcile, type ReconcileRow } from '../api/stock'

function quantity(value: string | number | null | undefined) {
  if (value === null || value === undefined || value === '') {
    return '-'
  }
  return Number(value).toLocaleString('zh-CN', { maximumFractionDigits: 6 })
}

export default function ReconcilePage() {
  const [warehouseId, setWarehouseId] = useState<number | undefined>()
  const [onlyDiff, setOnlyDiff] = useState(false)

  const rows = useQuery({
    queryKey: ['reconcile', warehouseId, onlyDiff],
    queryFn: () => listReconcile({ warehouseId, onlyDiff }),
  })
  const warehouses = useQuery({
    queryKey: ['warehouses'],
    queryFn: listWarehouses,
  })

  const data = rows.data ?? []
  const diffRows = onlyDiff ? data : data.filter((row) => row.status === 'DIFF')
  const totalDiff = data.reduce((sum, row) => sum + Number(row.diffQty), 0)

  const columns: TableColumnsType<ReconcileRow> = [
    { title: '物料编码', dataIndex: 'materialCode', width: 130 },
    { title: '物料名称', dataIndex: 'materialName', width: 160 },
    { title: '仓库', dataIndex: 'warehouseName', width: 110 },
    {
      title: '余额表数量',
      dataIndex: 'balanceQty',
      width: 130,
      align: 'right',
      render: (value: string) => quantity(value),
    },
    {
      title: '流水合计',
      dataIndex: 'ledgerQty',
      width: 130,
      align: 'right',
      render: (value: string) => quantity(value),
    },
    {
      title: '差异',
      dataIndex: 'diffQty',
      width: 130,
      align: 'right',
      render: (value: string, record) => (
        <Typography.Text
          type={record.status === 'DIFF' ? 'danger' : undefined}
          strong={record.status === 'DIFF'}
        >
          {record.status === 'DIFF' ? quantity(value) : '0'}
        </Typography.Text>
      ),
    },
    {
      title: '结果',
      dataIndex: 'status',
      width: 110,
      render: (value: string) =>
        value === 'MATCHED' ? (
          <Tag color="success">一致</Tag>
        ) : (
          <Tag color="error">存在差异</Tag>
        ),
    },
  ]

  return (
    <div className="page">
      <div className="page-heading">
        <div>
          <Typography.Title level={3}>库存对账</Typography.Title>
          <Typography.Text type="secondary">
            库存余额与库存流水汇总逐项比对，差异行标红。
          </Typography.Text>
        </div>
        <Space wrap>
          <Select
            allowClear
            placeholder="全部仓库"
            style={{ width: 160 }}
            value={warehouseId}
            onChange={(value: number | undefined) => setWarehouseId(value)}
            options={(warehouses.data ?? []).map((item) => ({
              value: item.id,
              label: item.warehouseName,
            }))}
          />
          <Space>
            <Typography.Text type="secondary">只看差异</Typography.Text>
            <Switch checked={onlyDiff} onChange={setOnlyDiff} />
          </Space>
          <Button
            icon={<ReloadOutlined />}
            onClick={() => rows.refetch()}
            loading={rows.isFetching}
          >
            重新对账
          </Button>
        </Space>
      </div>

      <Row gutter={16}>
        <Col xs={24} sm={8}>
          <Card size="small">
            <Statistic title="比对记录" value={data.length} suffix="条" />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card size="small">
            <Statistic
              title="差异记录"
              value={diffRows.length}
              suffix="条"
              valueStyle={{ color: diffRows.length > 0 ? '#cf1322' : undefined }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card size="small">
            <Statistic
              title="差异合计"
              value={totalDiff}
              precision={0}
              valueStyle={{ color: totalDiff !== 0 ? '#cf1322' : undefined }}
            />
          </Card>
        </Col>
      </Row>

      <Table<ReconcileRow>
        rowKey={(record) => `${record.materialId}-${record.warehouseId}`}
        loading={rows.isLoading}
        columns={columns}
        dataSource={data}
        rowClassName={(record) => (record.status === 'DIFF' ? 'reconcile-diff-row' : '')}
        pagination={false}
        scroll={{ x: 900 }}
      />
    </div>
  )
}
