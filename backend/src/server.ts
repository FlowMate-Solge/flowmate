import cors from 'cors'
import express from 'express'
import platformsRouter from './routes/platforms.js'
import salesRouter from './routes/sales.js'
import dashboardRouter from './routes/dashboard.js'

const app = express()
const PORT = process.env.PORT ?? 4000

app.use(cors())
app.use(express.json())

app.get('/health', (_req, res) => {
  res.json({ ok: true })
})

app.use('/api/platforms', platformsRouter)
app.use('/api/sales', salesRouter)
app.use('/api/dashboard', dashboardRouter)

app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(err)
  res.status(500).json({ error: err.message })
})

app.listen(PORT, () => {
  console.log(`flowmate backend listening on http://localhost:${PORT}`)
})
