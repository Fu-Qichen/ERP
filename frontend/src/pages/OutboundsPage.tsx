import { useQuery } from '@tanstack/react-query'
import {
  Button,
  Descriptions,
  Divider,
  Input,
  Modal,
  Space,
  Table,
  Tag,
  Typography,
  type TableColumnsType,
} from 'antd'
import { ReloadOutlined, SearchOutlined } from '@ant-design/icons'
import { useState } from 'react'
import {
  getOutbound,
  listOutbounds,
  type Outbound,
  type OutboundLine,
} from '../api/stock'

function money(value: string | number | null | undefined) {
  if (value === null || value === undefined || value === '') {
    return '-'
  }
  return Number(value).toLocaleString('zh-CN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
}

function quantity(value: string | number | null | undefined) {
  if (value === null || value === undefined || value === '') {
    return '-'
  }
  return Number(value).toLocaleString('zh-CN', { maximumFractionDigits: 6 })
}

export default function OutboundsPage() {
  const [current, setCurrent] = useState(1)
  const [size, setSize] = useState(10)
  const [keywordInput, setKeywordInput] = useState('')
  const [keyword, setKeyword] = useState('')
  const [detailId, setDetailId] = useState<number | null>(null)

  const outbounds = useQuery({
    queryKey: ['outbounds', current, size, keyword],
    queryFn: () => listOutbounds({ current, size, keyword }),
    placeholderData: (previous) => previous,
  })
  const detail = useQuery({
    queryKey: ['outbound', detailId],
    queryFn: () => getOutbound(detailId as number),
    enabled: detailId !== null,
  })

  const columns: TableColumnsType<Outbound> = [
    { title: '出库单号', dataIndex: 'outboundNo', width: 180, fixed: 'left' },
    { title: '发货单', dataIndex: 'deliveryNo', width: 180 },
    { title: '销售订单', dataIndex: 'orderNo', width: 180 },
    { title: '客户', dataIndex: 'customerName', width: 140 },
    { title: '仓库', dataIndex: 'warehouseName', width: 110 },
    {
      title: '状态',
      dataIndex: 'status',
      width: 100,
      render: (value: number) =>
        value === 1 ? <Tag color="success">已过账</Tag> : <Tag>未过账</Tag>,
    },
    {
      title: '过账时间',
      dataIndex: 'postedAt',
      width: 180,
      render: (value: string | null) =>
        value ? new Date(value).toLocaleString('zh-CN') : '-',
    },
    {
      title: '操作',
      key: 'action',
      width: 90,
      fixed: 'right',
      render: (_, record) => (
        <Button type="link" size="small" onClick={() => setDetailId(record.id)}>
          详情
        </Button>
      ),
    },
  ]

  const lineColumns: TableColumnsType<OutboundLine> = [
    { title: '物料编码', dataIndex: 'materialCode', width: 130 },
    { title: '物料名称', dataIndex: 'materialName', width: 160 },
    {
      title: '出库数量',
      dataIndex: 'quantity',
      width: 120,
      align: 'right',
      render: (value: string) => quantity(value),
    },
    {
      title: '含税单价',
      dataIndex: 'taxUnitPrice',
      width: 120,
      align: 'right',
      render: (value: string) => money(value),
    },
    {
      title: '含税金额',
      dataIndex: 'amount',
      width: 130,
      align: 'right',
      render: (value: string) => money(value),
    },
  ]

  return (
    <div className="page">
      <div className="page-heading">
        <div>
          <Typography.Title level={3}>销售出库</Typography.Title>
          <Typography.Text type="secondary">
            发货出库时生成并过账，库存扣减以出库流水为准。
          </Typography.Text>
        </div>
        <Space wrap>
          <Input
            allowClear
            prefix={<SearchOutlined />}
            placeholder="出库单 / 发货单 / 订单"
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
            onClick={() => outbounds.refetch()}
            loading={outbounds.isFetching}
          >
            刷新
          </Button>
        </Space>
      </div>

      <Table<Outbound>
        rowKey="id"
        loading={outbounds.isLoading}
        columns={columns}
        dataSource={outbounds.data?.records ?? []}
        scroll={{ x: 1180 }}
        pagination={{
          current,
          pageSize: size,
          total: outbounds.data?.total ?? 0,
          showSizeChanger: true,
          showTotal: (total) => `共 ${total} 条`,
          onChange: (nextPage, nextSize) => {
            setCurrent(nextPage)
            setSize(nextSize)
          },
        }}
      />

      <Modal
        title={detail.data?.outboundNo ?? '出库单详情'}
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
                { key: 'delivery', label: '发货单', children: detail.data.deliveryNo },
                { key: 'order', label: '销售订单', children: detail.data.orderNo },
                { key: 'customer', label: '客户', children: detail.data.customerName },
                { key: 'warehouse', label: '仓库', children: detail.data.warehouseName },
                {
                  key: 'status',
                  label: '状态',
                  children:
                    detail.data.status === 1 ? (
                      <Tag color="success">已过账</Tag>
                    ) : (
                      <Tag>未过账</Tag>
                    ),
                },
                {
                  key: 'postedAt',
                  label: '过账时间',
                  children: detail.data.postedAt
                    ? new Date(detail.data.postedAt).toLocaleString('zh-CN')
                    : '-',
                },
              ]}
            />
            <Divider />
            <Table<OutboundLine>
              rowKey="id"
              size="small"
              pagination={false}
              columns={lineColumns}
              dataSource={detail.data.lines ?? []}
            />
          </>
        )}
      </Modal>
    </div>
  )
}
