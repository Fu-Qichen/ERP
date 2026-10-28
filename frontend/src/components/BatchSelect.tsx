import { useQuery } from '@tanstack/react-query'
import { Select } from 'antd'
import { listAvailableBatches } from '../api/batches'

interface BatchSelectProps {
  materialId?: number
  warehouseId?: number
  value?: number
  onChange?: (value: number | undefined) => void
  disabled?: boolean
  placeholder?: string
}

/**
 * 可用批次下拉：按先到期先出排序，label 内嵌到期日与可用数量。
 */
export default function BatchSelect({
  materialId,
  warehouseId,
  value,
  onChange,
  disabled,
  placeholder = '选择批次',
}: BatchSelectProps) {
  const enabled = Boolean(materialId && warehouseId)
  const batches = useQuery({
    queryKey: ['batches', 'available', materialId, warehouseId],
    queryFn: () => listAvailableBatches(materialId as number, warehouseId as number),
    enabled,
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
      disabled={disabled || !enabled}
      loading={batches.isFetching}
      placeholder={enabled ? placeholder : '先选择物料与仓库'}
      value={value}
      options={options}
      onChange={(next) => onChange?.(next)}
    />
  )
}
