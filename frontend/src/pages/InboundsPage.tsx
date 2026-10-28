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
  getInbound,
  listInbounds,
  type Inbound,
  type InboundLine,
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

export default function InboundsPage() {
  const [current, setCurrent] = useState(1)
  const [size, setSize] = useState(10)
  const [keywordInput, setKeywordInput] = useState('')
  const [keyword, setKeyword] = useState('')
  const [detailId, setDetailId] = useState<number | null>(null)

  const inbounds = useQuery({
    queryKey: ['inbounds', current, size, keyword],
    queryFn: () => listInbounds({ current, size, keyword }),
    placeholderData: (previous) => previous,
  })
  const detail = useQuery({
    queryKey: ['inbound', detailId],
    queryFn: () => getInbound(detailId as number),
    enabled: detailId !== null,
  })

  const columns: TableColumnsType<Inbound> = [
    { title: '入库单号', dataIndex: 'inboundNo', width: 180, fixed: 'left' },
    { title: '收货单', dataIndex: 'receiptNo', width: 180 },
    { title: '采购订单', dataIndex: 'orderNo', width: 180 },
    { title: '供应商', dataIndex: 'supplierName', width: 140 },
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

  const lineColumns: TableColumnsType<InboundLine> = [
    { title: '物料编码', dataIndex: 'materialCode', width: 130 },
    { title: '物料名称', dataIndex: 'materialName', width: 160 },
    {
      title: '入库数量',
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
  ]

  return (
    <div className="page">
      <div className="page-heading">
        <div>
          <Typography.Title level={3}>采购入库</Typography.Title>
          <Typography.Text type="secondary">
            收货入库时生成并过账，库存增加以入库流水为准。
          </Typography.Text>
        </div>
        <Space wrap>
          <Input
            allowClear
            prefix={<SearchOutlined />}
            placeholder="入库单 / 收货单 / 订单"
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
            onClick={() => inbounds.refetch()}
            loading={inbounds.isFetching}
          >
            刷新
          </Button>
        </Space>
      </div>

      <Table<Inbound>
        rowKey="id"
        loading={inbounds.isLoading}
        columns={columns}
        dataSource={inbounds.data?.records ?? []}
        scroll={{ x: 1180 }}
        pagination={{
          current,
          pageSize: size,
          total: inbounds.data?.total ?? 0,
          showSizeChanger: true,
          showTotal: (total) => `共 ${total} 条`,
          onChange: (nextPage, nextSize) => {
            setCurrent(nextPage)
            setSize(nextSize)
          },
        }}
      />

      <Modal
        title={detail.data?.inboundNo ?? '入库单详情'}
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
                { key: 'receipt', label: '收货单', children: detail.data.receiptNo },
                { key: 'order', label: '采购订单', children: detail.data.orderNo },
                { key: 'supplier', label: '供应商', children: detail.data.supplierName },
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
            <Table<InboundLine>
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
