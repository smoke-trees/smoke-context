import * as express from "express";
import NodeFetch, { HeaderInit, RequestInfo, RequestInit } from 'node-fetch';
import * as uuid from 'uuid';
import { AsyncLocalStorage } from 'async_hooks'

declare global {
  namespace SmokeContext {
    type KeyValuePair = {}
  }
  namespace express {
    export interface Request {
      context: ContextType
    }
  }
}

export interface KeyValuePair extends SmokeContext.KeyValuePair {
}

export interface ContextOptions {
  /** Header name to extract the tracing id from*/
  headerName?: string;
  extractKeyValuePairs?: () => KeyValuePair;
  generateTraceId?: () => string;
}

export interface ContextType {
  traceId: string;
  values: KeyValuePair
  headerName: string;
}



export default function Context(options: ContextOptions): express.RequestHandler {
  const generateTraceId = options.generateTraceId ?? uuid.v4
  const extractKeyValuePairs = options.extractKeyValuePairs ?? function () { return {} }
  return function (req, res, next) {
    const headerName = options.headerName ?? 'SMK-TRACE-ID'
    req.context = {
      traceId: (req.get(headerName) ?? generateTraceId()),
      values: extractKeyValuePairs(),
      headerName: headerName
    }
    next()
  } as express.RequestHandler
}

class ContextProviderClass {
  asyncLocalStorage
  constructor() {
    this.asyncLocalStorage = new AsyncLocalStorage()
  }

  getContext() {
    return this.asyncLocalStorage.getStore() as ContextType
  }

  getMiddleware(options: ContextOptions) {
    const generateTraceId = options.generateTraceId ?? uuid.v4
    const extractKeyValuePairs = options.extractKeyValuePairs ?? function () { return {} }
    return (req: express.Request, res: express.Response, next: express.NextFunction) => {
      const headerName = options.headerName ?? 'SMK-TRACE-ID'
      const context = {
        traceId: (req.get(headerName) ?? generateTraceId()),
        values: extractKeyValuePairs(),
        headerName: headerName
      }
      req.context = context
      this.asyncLocalStorage.run(context, () => {
        next()
      })
    }
  }
}

export const ContextProvider = new ContextProviderClass()

export function fetch(url: RequestInfo, context?: ContextType, init?: RequestInit) {
  const headers: HeaderInit = {
    ...init?.headers
  }
  if (!context && ContextProvider) {
    context = ContextProvider.getContext()
  }
  if (context) {
    if (typeof (headers) === 'object') {
      (headers as any)[context.headerName] = context.traceId
    }
  }
  console.log('fetch', context)
  return NodeFetch(url, {
    ...init,
    headers: headers
  })
}