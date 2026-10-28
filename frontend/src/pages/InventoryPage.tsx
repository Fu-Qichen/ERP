import { useQuery } from '@tanstack/react-query'
import { Button, Card, Space, Table, Tag, Typography, type TableColumnsType } from 'antd'
import { ReloadOutlined } from '@ant-design/icons'
import { listInventory, type InventoryBalance } from '../api/master'

function quantity(value: string) {
  return Number(value).toLocaleString('zh-CN', {
    maximumFractionDigits: 6,
  })
}

export default function InventoryPage() {
  const inventory = useQuery({
    queryKey: ['inventory'],
    queryFn: () => listInventory(),
  })

  const columns: TableColumnsType<InventoryBalance> = [
    { title: '物料编码', dataIndex: 'materialCode', width: 150 },
    { title: '物料名称', dataIndex: 'materialName', width: 200 },
    { title: '仓库', dataIndex: 'warehouseName', width: 120 },
    {
      title: '批次',
      dataIndex: 'batchNo',
      width: 150,
      render: (value: string | null) => value || <span style={{ color: '#bfbfbf' }}>-</span>,
    },
    { title: '到期日', dataIndex: 'expireDate', width: 120, render: (value: string | null) => value || '-' },
    {
      title: '库存数量',
      dataIndex: 'qty',
      width: 140,
      align: 'right',
      render: (value: string) => quantity(value),
    },
    {
      title: '锁定数量',
      dataIndex: 'lockedQty',
      width: 140,
      align: 'right',
      render: (value: string) => quantity(value),
    },
    {
      title: '状态',
      key: 'state',
      width: 100,
      render: (_, record) =>
        Number(record.qty) <= 0 ? (
          <Tag color="error">缺货</Tag>
        ) : (
          <Tag color="success">正常</Tag>
        ),
    },
  ]

  return (
    <div className="page">
      <div className="page-heading">
        <div>
          <Typography.Title level={3}>库存管理</Typography.Title>
          <Typography.Text type="secondary">
            余额是快照，流水是依据；销售确认扣减，采购入库增加。
          </Typography.Text>
        </div>
        <Space>
          <Button
            icon={<ReloadOutlined />}
            onClick={() => inventory.refetch()}
            loading={inventory.isFetching}
          >
            刷新
          </Button>
        </Space>
      </div>

      <Card>
        <Table<InventoryBalance>
          rowKey="id"
          loading={inventory.isLoading}
          columns={columns}
          dataSource={inventory.data ?? []}
          pagination={false}
          scroll={{ x: 1160 }}
        />
      </Card>
    </div>
  )
}
