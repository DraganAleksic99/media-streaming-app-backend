import { Request, Response, NextFunction } from 'express'
import User from '../models/user.model'
import extend from 'lodash/extend'
import fs from 'fs'
import formidable from 'formidable'
import errorHandler from '../utils/dbErrorHandler'

const create = async (req: Request, res: Response) => {
  const user = new User(req.body)
  try {
    await user.save()
    return res.status(201).json({
      message: 'Succesfully signed up'
    })
  } catch (err) {
    return res.status(400).json({
      error: errorHandler.getErrorMessage(err)
    })
  }
}

const list = async (req: Request, res: Response) => {
  try {
    const users = await User.find().select('name email created updated')
    res.json(users)
  } catch (err) {
    return res.status(400).json({
      error: errorHandler.getErrorMessage(err)
    })
  }
}

const userById = async (req: Request, res: Response, next: NextFunction, id: string) => {
  try {
    const user = await User.findById(id)
    if (!user) {
      return res.status(400).json({
        error: 'User not found'
      })
    }
    req.profile = user
    next()
  } catch (err) {
    return res.status(400).json({
      error: 'Could not retrieve the user'
    })
  }
}

const read = (req: Request, res: Response) => {
  req.profile.hashed_password = undefined
  req.profile.salt = undefined
  return res.json(req.profile)
}

const update = async (req: Request, res: Response) => {
  const form = formidable({ keepExtensions: true })
  form.parse(req, async (err, fields, files) => {
    if (err) {
      return res.status(400).json({
        error: 'Photo could not be uploaded'
      })
    }
    let user = req.profile
    user = extend(user, {
      name: fields.name?.toString() || '',
      email: fields.email?.toString() || '',
      password: fields.password?.toString() || '',
      about: fields.about?.toString() || ''
    })
    user.updated = Date.now()
    if (files.photo) {
      user = extend(user, {
        photo: {
          data: fs.readFileSync(files.photo[0].filepath),
          contentType: files.photo[0].mimetype
        }
      })
    }
    try {
      await user.save()
      user.hashed_password = undefined
      user.salt = undefined
      res.json(user)
    } catch (err) {
      return res.status(400).json({
        error: errorHandler.getErrorMessage(err)
      })
    }
  })
}

const remove = async (req: Request, res: Response) => {
  try {
    const user = req.profile
    const deletedUser = await user.deleteOne()
    deletedUser.hashed_password = undefined
    deletedUser.salt = undefined
    res.json(deletedUser)
  } catch (err) {
    return res.status(400).json({
      error: errorHandler.getErrorMessage(err)
    })
  }
}

const photo = async (req: Request, res: Response) => {
  if (req.profile.photo.data) {
    res.set('Cross-Origin-Resource-Policy', 'false')
    res.set('Content-Type', req.profile.photo.contentType)
    return res.send(req.profile.photo.data)
  }
}

export default {
  create,
  list,
  update,
  userById,
  read,
  remove,
  photo
}
