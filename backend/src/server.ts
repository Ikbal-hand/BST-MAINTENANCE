import cors from 'cors'
import express from 'express'
import helmet from 'helmet'
import rateLimit from 'express-rate-limit'
import { config, corsOrigins } from './config.js'
import { createRoutes } from './routes.js'
import { resolveWorkspace } from './domain.js'
import { errorHandler } from './middleware/error-handler.js'
import { requestContext } from './middleware/request-context.js'
import { accessLog } from './middleware/access-log.js'
import { notFound } from './middleware/not-found.js'
import { logger } from './logger.js'

const app = express()

app.disable('x-powered-by')
app.use(helmet())
app.use(
  cors({
    origin: corsOrigins,
    credentials: true,
  }),
)
app.use(requestContext)
app.use(accessLog)
app.use(express.json({ limit: '1mb' }))
app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 300,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    message: {
      error: {
        code: 'RATE_LIMITED',
        message: 'Terlalu banyak request. Silakan coba lagi nanti.',
      },
    },
  }),
)

app.get('/', (_request, response) => {
  response.json({
    data: {
      service: 'bst-invoice-api',
      status: 'ok',
      health: '/api/health',
    },
  })
})

app.get('/api/health', (_request, response) => {
  response.json({ data: { status: 'ok', service: 'bst-invoice-api', version: config.APP_VERSION } })
})

app.get('/api/ready', async (_request, response) => {
  response.json({ data: { status: 'ready', service: 'bst-invoice-api' } })
})

app.get('/api/context', (request, response) => {
  response.json({ data: request.workspace ?? resolveWorkspace(request.hostname) })
})

app.use('/api', createRoutes())
app.use(notFound)
app.use(errorHandler)

app.listen(config.PORT, () => {
  logger.info({ port: config.PORT, environment: config.NODE_ENV }, 'backend started')
})
