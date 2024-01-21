import { Schema, Document, model } from 'mongoose'
import { IUser } from './user.model'

interface IMedia {
  title: string
  description: string
  genre: string
  views: number
  postedBy: IUser
  created: Date
  updated: Date
}

interface IMediaDocument extends IMedia, Document {}

const MediaSchema = new Schema<IMediaDocument>({
  title: {
    type: String,
    required: [true, 'Title is required']
  },
  description: String,
  genre: String,
  views: {
    type: Number,
    default: 0
  },
  postedBy: {
    type: Schema.ObjectId,
    ref: 'User'
  },
  updated: Date,
  created: {
    type: Date,
    default: Date.now
  }
})

export default model<IMediaDocument>('Media', MediaSchema)
