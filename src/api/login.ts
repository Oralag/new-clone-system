import http from './http'

export interface LoginParams {
  account: string
  password: string
  terminal?: number
}

export const loginApi = (data: LoginParams) =>
  http.post('/login/account', { ...data, terminal: 1 })

export const logoutApi = () => http.post('/login/logout')

export const getUserInfoApi = () => http.get('/auth/getUserInfo')
