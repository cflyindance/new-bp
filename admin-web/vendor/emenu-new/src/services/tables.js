import request from '@/utils/request'

export async function getAreas() {
  const response = await request({
    url: '/seatingArea/list',
    method: 'get',
    params: {
      // fetchSeats: true,
      // fetchOrders: true,
    },
  })
  return response
}

export async function getTables(areaId) {
  const response = await request({
    url: '/table/list',
    method: 'get',
    params: {
      areaId,
    },
  })
  if (!response?.tables) return response
  return response
}

export async function fetchTable(id, areaId = null) {
  const response = await request({
    url: '/table/fetch',
    method: 'get',
    params: {
      id,
    },
  })
  return response
}
