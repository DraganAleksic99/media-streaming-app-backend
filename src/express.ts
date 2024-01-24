import express, { Express, Request, Response, NextFunction } from 'express'
import bodyParser from 'body-parser'
import cookieParser from 'cookie-parser'
import compress from 'compression'
import cors from 'cors'
import helmet from 'helmet'
import userRoutes from '../src/routes/user.routes'
import authRoutes from '../src/routes/auth.routes'
import mediaRoutes from '../src/routes/media.routes'

const app: Express = express()

app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: true }))
app.use(cookieParser())
app.use(compress())
app.use(helmet())
app.use(
  cors({
    credentials: true,
    origin: 'http://localhost:5173'
  })
)

app.use('/', userRoutes)
app.use('/', authRoutes)
app.use('/', mediaRoutes)

// eslint-disable-next-line
app.use((err, req: Request, res: Response, next: NextFunction) => {
  if (err.name === 'UnauthorizedError') {
    res.status(401).json({ error: err.name + ': ' + err.message })
  } else if (err) {
    res.status(400).json({ error: err.name + ': ' + err.message })
    console.log(err)
  }
})

app.get('/', (req: Request, res: Response) => {
  res.send('Hello from express!')
})

export default app
