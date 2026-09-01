import request from '@/utils/request'

export function getAreas() {
  return request({
    url: '/seatingArea/list',
    method: 'get',
    params: {
      // fetchSeats: true,
      // fetchOrders: true,
    },
  })
}

export function getTables(areaId) {
  return request({
    url: '/table/list',
    method: 'get',
    params: {
      areaId,
    },
  })
}

export function fetchTable(id) {
  return request({
    url: '/table/fetch',
    method: 'get',
    params: {
      id,
    },
  })
}
