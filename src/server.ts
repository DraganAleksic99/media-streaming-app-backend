import app from './express'
import config from './config/config'
import mongoose from 'mongoose'

export const connectDb = async () => {
  try {
    await mongoose.connect(config.mongoUri)
  } catch (error) {
    console.log(error)
  }
}

connectDb()

mongoose.connection.once('open', () => {
  console.log('Connected to MongoDB')
  app.listen(config.port, () => {
    console.info('Server started and running on port %s.', config.port)
  })
})

mongoose.connection.on('error', err => {
  console.log(err)
})
