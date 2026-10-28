import { useQuery } from '@tanstack/react-query'
import {
  Card,
  Col,
  Empty,
  Row,
  Space,
  Statistic,
  Table,
  Tag,
  Typography,
  type TableColumnsType,
} from 'antd'
import { Link } from 'react-router-dom'
import { listInventory } from '../api/master'
import { listSalesOrders } from '../api/sales'
import { listLedger, listOutbounds, type LedgerEntry } from '../api/stock'
import { listPayables } from '../api/purchase-chain'
import { listReceivables } from '../api/invoice'

function money(value: number) {
  return value.toLocaleString('zh-CN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
}

function minusMoney(value: number) {
  return `${value < 0 ? '-' : ''}${money(Math.abs(value))}`
}

export default function DashboardPage() {
  const inventory = useQuery({
    queryKey: ['inventory', 'dashboard'],
    queryFn: () => listInventory(),
  })
  const sales = useQuery({
    queryKey: ['sales-orders', 'dashboard'],
    queryFn: () => listSalesOrders({ current: 1, size: 100 }),
  })
  const receipts = useQuery({
    queryKey: ['receivables', 'dashboard'],
    queryFn: () =>
      listReceivables({ current: 1, size: 100, openOnly: true }),
  })
  const payables = useQuery({
    queryKey: ['payables', 'dashboard'],
    queryFn: () => listPayables({ current: 1, size: 100, openOnly: true }),
  })
  const ledger = useQuery({
    queryKey: ['ledger', 'dashboard'],
    queryFn: () => listLedger({ current: 1, size: 100 }),
  })
  const outbounds = useQuery({
    queryKey: ['outbounds', 'dashboard'],
    queryFn: () => listOutbounds({ current: 1, size: 5 }),
  })

  const stockQty = (inventory.data ?? []).reduce(
    (sum, row) => sum + Number(row.qty),
    0,
  )
  const lowStock = (inventory.data ?? []).filter((row) => Number(row.qty) <= 0)

  const receivableBalance = (receipts.data?.records ?? []).reduce(
    (sum, row) => sum + Number(row.balance),
    0,
  )
  const payableBalance = (payables.data?.records ?? []).reduce(
    (sum, row) => sum + Number(row.balance),
    0,
  )

  const pendingShip = (sales.data?.records ?? []).filter(
    (order) => order.status === 1,
  ).length
  const draftOrder = (sales.data?.records ?? []).filter(
    (order) => order.status === 0,
  ).length

  const ledgerRows = ledger.data?.records ?? []
  const inboundQty = ledgerRows
    .filter((row) => row.direction > 0)
    .reduce((sum, row) => sum + Number(row.qty), 0)
  const outboundQty = ledgerRows
    .filter((row) => row.direction < 0)
    .reduce((sum, row) => sum + Number(row.qty), 0)

  const ledgerColumns: TableColumnsType<LedgerEntry> = [
    {
      title: '时间',
      dataIndex: 'occurredAt',
      width: 160,
      render: (value: string) => new Date(value).toLocaleString('zh-CN'),
    },
    { title: '物料', dataIndex: 'materialCode', width: 110 },
    {
      title: '类型',
      dataIndex: 'bizType',
      width: 110,
      render: (value: string) =>
        value === 'PURCHASE_IN' ? (
          <Tag color="success">采购入库</Tag>
        ) : (
          <Tag color="processing">销售出库</Tag>
        ),
    },
    {
      title: '数量',
      dataIndex: 'qty',
      width: 110,
      align: 'right',
      render: (value: string, record) =>
        `${record.direction > 0 ? '+' : '-'}${Number(value).toLocaleString('zh-CN', {
          maximumFractionDigits: 6,
        })}`,
    },
    {
      title: '来源',
      dataIndex: 'sourceNo',
      render: (value: string | null) => value || '-',
    },
  ]

  return (
    <div className="page">
      <div className="page-heading">
        <div>
          <Typography.Title level={3}>工作台</Typography.Title>
          <Typography.Text type="secondary">
            销售与采购两条链路已打通：订单 → 审核 → 出入库 → 发票 → 应收/应付 → 核销。
          </Typography.Text>
        </div>
      </div>

      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} xl={6}>
          <Card size="small">
            <Statistic
              title="库存总数量"
              value={stockQty}
              loading={inventory.isLoading}
              precision={0}
            />
            <Typography.Text type="secondary">
              {lowStock.length} 项缺货 ·{' '}
              <Link to="/inventory">查看余额</Link>
            </Typography.Text>
          </Card>
        </Col>
        <Col xs={24} sm={12} xl={6}>
          <Card size="small">
            <Statistic
              title="销售订单"
              value={sales.data?.total ?? 0}
              loading={sales.isLoading}
              suffix="单"
            />
            <Typography.Text type="secondary">
              草稿 {draftOrder} · 待发货 {pendingShip} ·{' '}
              <Link to="/sales">查看订单</Link>
            </Typography.Text>
          </Card>
        </Col>
        <Col xs={24} sm={12} xl={6}>
          <Card size="small">
            <Statistic
              title="应收未收余额"
              value={receivableBalance}
              loading={receipts.isLoading}
              precision={2}
              valueStyle={{ color: receivableBalance > 0 ? '#cf1322' : undefined }}
            />
            <Typography.Text type="secondary">
              <Link to="/receipts">去收款核销</Link>
            </Typography.Text>
          </Card>
        </Col>
        <Col xs={24} sm={12} xl={6}>
          <Card size="small">
            <Statistic
              title="应付未付余额"
              value={payableBalance}
              loading={payables.isLoading}
              precision={2}
              valueStyle={{ color: payableBalance > 0 ? '#d46b08' : undefined }}
            />
            <Typography.Text type="secondary">
              <Link to="/purchase-finance">去付款核销</Link>
            </Typography.Text>
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        <Col xs={24} xl={14}>
          <Card
            size="small"
            title="最近库存流水"
            extra={<Link to="/ledger">全部流水</Link>}
          >
            <Table<LedgerEntry>
              rowKey="id"
              size="small"
              loading={ledger.isLoading}
              columns={ledgerColumns}
              dataSource={ledgerRows.slice(0, 6)}
              pagination={false}
            />
          </Card>
        </Col>
        <Col xs={24} xl={10}>
          <Space direction="vertical" size={16} style={{ width: '100%' }}>
            <Card size="small" title="本周出入库">
              <Row gutter={16}>
                <Col span={8}>
                  <Statistic title="入库" value={inboundQty} precision={0} />
                </Col>
                <Col span={8}>
                  <Statistic title="出库" value={outboundQty} precision={0} />
                </Col>
                <Col span={8}>
                  <div className="statistic-caption">净变动</div>
                  <div className="ledger-total">{minusMoney(inboundQty - outboundQty)}</div>
                </Col>
              </Row>
            </Card>

            <Card
              size="small"
              title="最近出库单"
              extra={<Link to="/outbounds">全部出库</Link>}
            >
              {(outbounds.data?.records ?? []).length === 0 ? (
                <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="暂无出库单" />
              ) : (
                <Space direction="vertical" size={4} style={{ width: '100%' }}>
                  {(outbounds.data?.records ?? []).map((item) => (
                    <div key={item.id} className="dashboard-row">
                      <Typography.Text>{item.outboundNo}</Typography.Text>
                      <Typography.Text type="secondary">
                        {item.customerName} ·{' '}
                        {item.postedAt
                          ? new Date(item.postedAt).toLocaleDateString('zh-CN')
                          : '-'}
                      </Typography.Text>
                    </div>
                  ))}
                </Space>
              )}
            </Card>
          </Space>
        </Col>
      </Row>

      <Card className="next-step-card" title="下一步">
        <Typography.Paragraph>
          1. 登录、角色、菜单与按钮权限。
        </Typography.Paragraph>
        <Typography.Paragraph>
          2. 单据打印、库存流水导出、异常对账报表。
        </Typography.Paragraph>
        <Typography.Paragraph>
          3. 物料分类、计量单位、BOM 与生产工单。
        </Typography.Paragraph>
      </Card>
    </div>
  )
}
