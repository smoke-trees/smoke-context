import Express from 'express'
import { ContextProvider, fetch } from '../context'

const app = Express()

app.use(ContextProvider.getMiddleware({ headerName: 'TEST' }))

const model = async (value: number) => {
  const context1 = ContextProvider.getContext()
  console.log('1', context1)
  const va = value * 100
  await moreWork()
  return va
}

const moreWork = async () => {
  const context1 = ContextProvider.getContext()
  fetch('https://meribachat.in', undefined, {})
}

app.get('/', async (req, res) => {
  const value = +(req.query?.value ?? '10')
  const val = await model(value)
  res.send(val.toString())
})

app.listen(8080, () => {
  console.log('server start')
})
