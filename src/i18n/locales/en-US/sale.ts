// Sale module aggregator
import client from './sale/client'
import sea from './sale/sea'
import level from './sale/level'
import commissionSetting from './sale/commissionSetting'
import contract from './sale/contract'
import contractView from './sale/contractView'
import out from './sale/out'
import returnView from './sale/return'
import exchange from './sale/exchange'
import offer from './sale/offer'
import overview from './sale/overview'
import sample from './sale/sample'
import miniOrders from './sale/miniOrders'
import miniVideos from './sale/miniVideos'
import miniQrcode from './sale/miniQrcode'

export default {
  client,
  sea,
  level,
  commissionSetting,
  contract,
  contractView,
  out,
  return: returnView,
  exchange,
  offer,
  overview,
  sample,
  miniOrders,
  miniVideos,
  miniQrcode,
}
