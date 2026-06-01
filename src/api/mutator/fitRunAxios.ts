import type { AxiosError, AxiosRequestConfig } from 'axios';

import { apiAxios } from '../axiosClient';

export type ErrorType<TError> = AxiosError<TError>;
export type BodyType<TBody> = TBody;

export async function fitRunAxios<TResponse, TBody = unknown>(
  config: AxiosRequestConfig<TBody>,
  options?: AxiosRequestConfig<TBody>
): Promise<TResponse> {
  const response = await apiAxios.request<TResponse>({
    ...config,
    ...options,
    headers: {
      ...config.headers,
      ...options?.headers
    }
  });

  return response.data;
}
