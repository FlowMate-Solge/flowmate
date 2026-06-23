import cors from 'cors'
import express from 'express'
import platformsRouter from './routes/platforms.js'
import salesRouter from './routes/sales.js'
import dashboardRouter from './routes/dashboard.js'
import fixedCostsRouter from './routes/fixedCosts.js'
import forecastRouter from './routes/forecast.js'
import roiRouter from './routes/roi.js'
import taxReserveRouter from './routes/taxReserve.js'
import healthScoreRouter from './routes/healthScore.js'

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
app.use('/api/fixed-costs', fixedCostsRouter)
app.use('/api/forecast', forecastRouter)
app.use('/api/roi', roiRouter)
app.use('/api/tax-reserve', taxReserveRouter)
app.use('/api/health-score', healthScoreRouter)

app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(err)
  res.status(500).json({ error: err.message })
})

app.listen(PORT, () => {
  console.log(`flowmate backend listening on http://localhost:${PORT}`)
})
