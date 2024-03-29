import mongoose from 'mongoose'
import { Request, Response, NextFunction } from 'express'
import formidable from 'formidable'
import fs from 'fs'
import Media from '../models/media.model'
import dbErrorHandler from '../utils/dbErrorHandler'
import { extend } from 'lodash'

let gridfs = null

mongoose.connection.on('connected', () => {
  gridfs = new mongoose.mongo.GridFSBucket(mongoose.connection.db)
})

const create = (req: Request, res: Response) => {
  const form = formidable({ keepExtensions: true })
  form.parse(req, async (err, fields, files) => {
    if (err) {
      return res.status(400).json({
        error: 'Video could not be uploaded'
      })
    }
    const mediaFields = {
      title: fields.title?.toString() || '',
      description: fields.description?.toString() || '',
      genre: fields.genre?.toString() || ''
    }
    const media = new Media(mediaFields)
    media.postedBy = req.profile

    if (files.video) {
      const writeStream = gridfs.openUploadStream(media._id)
      fs.createReadStream(files.video[0].filepath).pipe(writeStream)
    }

    try {
      const response = await media.save()
      res.status(200).json(response)
    } catch (err) {
      return res.status(400).json({
        error: dbErrorHandler.getErrorMessage(err)
      })
    }
  })
}

const mediaById = async (req: Request, res: Response, next: NextFunction, id: string) => {
  try {
    const media = await Media.findById(id).populate('postedBy', '_id name').exec()
    if (!media) {
      return res.status(400).json({
        error: 'Media not found'
      })
    }
    req.media = media

    const files = await gridfs.find({ filename: media._id }).toArray()

    if (!files[0]) {
      return res.status(404).json({
        error: 'Video not found',
        files: files
      })
    }
    req.file = files[0]
    next()
  } catch (err) {
    return res.status(400).json({
      error: 'Could not retrieve media file'
    })
  }
}

const video = (req: Request, res: Response) => {
  res.set('Cross-Origin-Resource-Policy', 'false')
  const range = req.headers['range']
  if (range && typeof range === 'string') {
    const parts = range.replace(/bytes=/, '').split('-')
    const partialstart = parts[0]
    const partialend = parts[1]

    const start = parseInt(partialstart, 10)
    const end = partialend ? parseInt(partialend, 10) : req.file.length - 1
    const chunkSize = end - start + 1

    res.writeHead(206, {
      'Accept-Ranges': 'bytes',
      'Content-Length': chunkSize,
      'Content-Range': 'bytes ' + start + '-' + end + '/' + req.file.length,
      'Content-Type': 'video/mp4'
    })

    const downloadStream = gridfs.openDownloadStream(req.file._id, {
      start,
      end: end + 1
    })

    downloadStream.on('error', () => {
      res.end()
    })
    downloadStream.on('end', () => {
      res.end()
    })

    downloadStream.pipe(res)
  } else {
    res.header('Content-Length', req.file.length)
    res.header('Content-Type', req.file.contentType)

    const downloadStream = gridfs.openDownloadStream(req.file._id)
    downloadStream.pipe(res)
    downloadStream.on('error', () => {
      res.sendStatus(404)
    })
    downloadStream.on('end', () => {
      res.end()
    })
  }
}

const listPopular = async (req: Request, res: Response) => {
  try {
    const media = await Media.find({})
      .populate('postedBy', '_id name')
      .sort('-views')
      .limit(9)
      .exec()
    res.json(media)
  } catch (err) {
    return res.status(400).json({
      error: dbErrorHandler.getErrorMessage(err)
    })
  }
}

const listByUser = async (req: Request, res: Response) => {
  try {
    const media = await Media.find({ postedBy: req.profile._id })
      .populate('postedBy', '_id name')
      .sort('-created')
      .exec()
    res.json(media)
  } catch (err) {
    return res.status(400).json({
      error: dbErrorHandler.getErrorMessage(err)
    })
  }
}

const incrementViews = async (req: Request, res: Response, next: NextFunction) => {
  try {
    await Media.findByIdAndUpdate(req.media._id, { $inc: { views: 1 } }, { new: true }).exec()
    next()
  } catch (err) {
    return res.status(400).json({
      error: dbErrorHandler.getErrorMessage(err)
    })
  }
}

const read = (req: Request, res: Response) => {
  return res.json(req.media)
}

const isPoster = (req: Request, res: Response, next: NextFunction) => {
  const isPoster = req.media && req.auth && req.media.postedBy._id == req.auth._id
  if (!isPoster) {
    return res.status(403).json({
      error: 'User is not authorized'
    })
  }
  next()
}

const update = async (req: Request, res: Response) => {
  try {
    let media = req.media
    media = extend(media, req.body)
    media.updated = Date.now()
    await media.save()
    res.json(media)
  } catch (err) {
    return res.status(400).json({
      error: dbErrorHandler.getErrorMessage(err)
    })
  }
}

const remove = async (req: Request, res: Response) => {
  try {
    const media = req.media
    const deletedMedia = await media.remove()
    gridfs.delete(req.file._id)
    res.json(deletedMedia)
  } catch (err) {
    return res.status(400).json({
      error: dbErrorHandler.getErrorMessage(err)
    })
  }
}

export default {
  create,
  mediaById,
  video,
  listPopular,
  listByUser,
  incrementViews,
  read,
  isPoster,
  update,
  remove
}
