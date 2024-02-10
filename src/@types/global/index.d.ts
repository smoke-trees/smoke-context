import { ContextType } from '../../context'

// export { }

declare global {
  namespace Express {
    export interface Request {
      context: ContextType
    }
  }
}
