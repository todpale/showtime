type LoadStatus = 'idle' | 'loading' | 'ready' | 'error'

type RequestParams = Record<string, string | number | null | undefined>

interface ApiErrorBody {
  message?: string
  statusText?: string
}

export type { LoadStatus, ApiErrorBody, RequestParams }
