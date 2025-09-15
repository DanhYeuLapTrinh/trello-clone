export interface AppResponse<T> {
  data: T
  message: string
  status: 'success' | 'error'
}
