import { useQuery } from '@tanstack/react-query'
import { Select } from 'antd'
import { listAvailableBatches } from '../api/batches'
import { listMaterials } from '../api/materials'

interface OrderLineBatchSelectProps {
  materialId?: number
  warehouseId?: number
  value?: number
  onChange?: (value: number | undefined) => void
}

/**
 * 发货/收货明细行的批次下拉：物料与仓库由订单明细行决定。
 */
export default function OrderLineBatchSelect({
  materialId,
  warehouseId,
  value,
  onChange,
}: OrderLineBatchSelectProps) {
  const batches = useQuery({
    queryKey: ['batches', 'available', materialId, warehouseId],
    queryFn: () => listAvailableBatches(materialId as number, warehouseId as number),
    enabled: Boolean(materialId && warehouseId),
  })

  const options = (batches.data ?? []).map((batch) => ({
    value: batch.id,
    label: `${batch.batchNo}（到期 ${batch.expireDate ?? '-'}，可用 ${Number(batch.availableQty)}）`,
  }))

  return (
    <Select
      showSearch
      optionFilterProp="label"
      allowClear
      style={{ width: '100%' }}
      disabled={!materialId || !warehouseId}
      loading={batches.isFetching}
      placeholder={materialId && warehouseId ? '选择批次' : '先选择物料'}
      value={value}
      options={options}
      onChange={(next) => onChange?.(next)}
    />
  )
}

/**
 * 仅为触发物料查询而存在的辅助 hook，供页面判断是否批次物料。
 */
export function useMaterialBatchMode(materialId?: number) {
  const materials = useQuery({
    queryKey: ['materials', 'options'],
    queryFn: () => listMaterials({ current: 1, size: 100 }),
  })
  const item = (materials.data?.records ?? []).find((record) => record.id === materialId)
  return item?.batchMode ?? 0
}
