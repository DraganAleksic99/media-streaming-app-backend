import { Document, Schema, model } from 'mongoose'
import bcrypt from 'bcrypt'

export interface IUser {
  name: string
  email: string
  about: string
  photo: {
    data: Buffer
    contentType: string
  }
  created: Date
  updated: number
  hashed_password: string
  salt: string
  _password: string
  authenticate: (password: string) => boolean
}

export interface IUserDocument extends IUser, Document {}

const UserSchema = new Schema<IUserDocument>({
  name: {
    type: String,
    trim: true,
    required: [true, 'Name is required']
  },
  email: {
    type: String,
    trim: true,
    unique: true,
    match: [/.+@.+\..+/, 'Please fill a valid email address'],
    required: [true, 'Email is required']
  },
  about: {
    type: String,
    trim: true
  },
  photo: {
    data: Buffer,
    contentType: String
  },
  created: {
    type: Date,
    default: Date.now()
  },
  updated: Date,
  hashed_password: {
    type: String,
    required: [true, 'Password is required']
  },
  salt: String
})

UserSchema.virtual('password')
  .set(function (password) {
    this._password = password
    this.salt = bcrypt.genSaltSync(10)
    this.hashed_password = bcrypt.hashSync(password, this.salt)
  })
  .get(function () {
    return this._password
  })

UserSchema.methods = {
  authenticate: function (password: string) {
    return bcrypt.hashSync(password, this.salt) === this.hashed_password
  }
}

UserSchema.path('hashed_password').validate(function () {
  if (this._password && this._password.length < 6) {
    this.invalidate('password', 'Password must be at least 6 characters.')
  }
  if (this.isNew && !this._password) {
    this.invalidate('password', 'Password is required')
  }
}, undefined)

export default model<IUserDocument>('User', UserSchema)
