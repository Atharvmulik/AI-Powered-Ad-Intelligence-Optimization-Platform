declare module 'axios' {
  export interface AxiosResponse<T = any> {
    data: T
    [key: string]: any
  }

  export interface AxiosInstance {
    get<T = any>(url: string, config?: any): Promise<AxiosResponse<T>>
    post<T = any>(url: string, data?: any, config?: any): Promise<AxiosResponse<T>>
    put<T = any>(url: string, data?: any, config?: any): Promise<AxiosResponse<T>>
    delete<T = any>(url: string, config?: any): Promise<AxiosResponse<T>>
    [key: string]: any
  }

  const axios: {
    create(config?: any): AxiosInstance
  }

  export default axios
}
