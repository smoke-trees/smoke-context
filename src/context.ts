import { NextFunction, Request, Response } from "express";
import * as uuid from 'uuid'
import NodeFetch, { RequestInit, RequestInfo } from 'node-fetch'

declare global {
  namespace SmokeContext {
    type KeyValuePair = {}
  }
  namespace express {
    export interface Request {
      context: Context
    }
  }
}

interface KeyValuePair extends SmokeContext.KeyValuePair {
}

export interface ContextOptions {
  /** Header name to extract the tracing id from*/
  headerName: string;
  extractKeyValuePairs?: () => KeyValuePair;
  generateTraceId?: () => string;
}

export interface Context {
  traceId: string;
  values: KeyValuePair
  headerName: string;
}

export function Context(options: ContextOptions) {
  const generateTraceId = options.generateTraceId ?? uuid.v4
  const extractKeyValuePairs = options.extractKeyValuePairs ?? function () { return {} }
  return async function contextHander(req: Request, res: Response, next: NextFunction) {
    const headerName = options.headerName ?? 'SMK-TRACE-ID'
    req.context = {
      traceId: (req.get(headerName) ?? generateTraceId()),
      values: extractKeyValuePairs,
      headerName: headerName
    }
  }
}

export function fetch(url: RequestInfo, context?: Context, init?: RequestInit) {
  const headers: { [key: string]: string } = {
    ...init?.headers,
  }
  if (context) {
    headers[context.headerName] = context.traceId
  }
  NodeFetch(url, {
    ...init,
    headers: headers
  })
}
