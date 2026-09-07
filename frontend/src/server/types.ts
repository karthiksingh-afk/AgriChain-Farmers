export interface ApiRequest<TBody = any, TQuery = Record<string, string>, TParams = Record<string, string>> {
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  path: string;
  headers: Record<string, string>;
  body?: TBody;
  query?: TQuery;
  params?: TParams;
  farmerId?: string;
}

export interface ApiResponsePayload<T = any> {
  status: number;
  data?: T;
  error?: {
    message: string;
    code?: string;
    details?: any;
  };
}
