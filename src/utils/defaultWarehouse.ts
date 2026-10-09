import { createParams, getParamsList, updateParams } from '@/api/setting'

export const DEFAULT_WAREHOUSE_STORAGE_KEY = 'erp_default_warehouse_id'
export const DEFAULT_WAREHOUSE_PARAM_KEY = 'default_warehouse_id'
const DEFAULT_WAREHOUSE_PARAM_NAME = '默认仓库ID'

function parseParamRows(res: any) {
  return res?.data?.rows ?? res?.data?.list ?? res?.rows ?? res?.list ?? []
}

function toWarehouseId(value: any) {
  const id = Number(value)
  return Number.isFinite(id) && id > 0 ? id : 0
}

export function readLocalDefaultWarehouseId() {
  return toWarehouseId(localStorage.getItem(DEFAULT_WAREHOUSE_STORAGE_KEY))
}

export function writeLocalDefaultWarehouseId(id: any) {
  const warehouseId = toWarehouseId(id)
  if (warehouseId > 0) localStorage.setItem(DEFAULT_WAREHOUSE_STORAGE_KEY, String(warehouseId))
  else localStorage.removeItem(DEFAULT_WAREHOUSE_STORAGE_KEY)
}

async function findDefaultWarehouseParam() {
  const res = await getParamsList({ key: DEFAULT_WAREHOUSE_PARAM_KEY, list_rows: 200 })
  const rows = parseParamRows(res)
  return rows.find((row: any) => row.key === DEFAULT_WAREHOUSE_PARAM_KEY) || null
}

let defaultWarehouseRequest: Promise<number> | null = null
// 以后端设置为准：每次打开页面先问一次后端，本机缓存只在后端读不到时兜底
// （以前本机有值就不问后端，别的电脑设的默认仓库在这台永远不生效）
let remoteChecked = false

export async function getSyncedDefaultWarehouseId(forceRefresh = false) {
  const localId = readLocalDefaultWarehouseId()
  if (!forceRefresh && remoteChecked && localId > 0) return localId
  if (!defaultWarehouseRequest) {
    defaultWarehouseRequest = (async () => {
      try {
        const row = await findDefaultWarehouseParam()
        const remoteId = toWarehouseId(row?.value)
        remoteChecked = true
        if (remoteId > 0) {
          writeLocalDefaultWarehouseId(remoteId)
          return remoteId
        }
      } catch {
        //
      } finally {
        defaultWarehouseRequest = null
      }
      return localId
    })()
  }
  return defaultWarehouseRequest
}

export async function saveSyncedDefaultWarehouseId(id: any) {
  const warehouseId = toWarehouseId(id)
  writeLocalDefaultWarehouseId(warehouseId)
  const row = await findDefaultWarehouseParam()
  if (row?.id) {
    await updateParams({ ...row, value: warehouseId ? String(warehouseId) : '' })
    return
  }
  await createParams({
    name: DEFAULT_WAREHOUSE_PARAM_NAME,
    key: DEFAULT_WAREHOUSE_PARAM_KEY,
    value: warehouseId ? String(warehouseId) : '',
  })
}
