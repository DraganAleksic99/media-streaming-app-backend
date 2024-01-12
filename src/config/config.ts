import dotenv from 'dotenv'

dotenv.config()

const { env } = process

let dbName: string

if (env.NODE_ENV === 'test') {
  dbName = 'test'
} else {
  dbName = env.MONGODB_NAME
}

const config = {
  env: env.NODE_ENV || 'development',
  port: env.PORT || 3500,
  jwtSecret: env.JWT_SECRET || '',
  mongoUri: `${env.MONGODB_URI}${dbName}?retryWrites=true&w=majority` || ''
}

export default config
