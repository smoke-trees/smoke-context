import { Request } from 'express'

/* eslint-disable */
declare global {
  namespace Express {
    export interface Request {
      context: ContextType
    }
  }
  namespace SmokeContext {
    export interface KeyValuePair { [key: string]: any }
  }

}

export interface ContextOptions {
  /** Header name to extract the tracing id from */
  headerName?: string;
  extractKeyValuePairs?: (req?: Request) => SmokeContext.KeyValuePair;
  generateTraceId?: () => string;
}

export interface ContextType {
  traceId: string;
  values: SmokeContext.KeyValuePair
  headerName: string;
}
