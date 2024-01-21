import mongoose from 'mongoose'
import { Request, Response, NextFunction } from 'express'
import formidable from 'formidable'
import fs from 'fs'
import Media from '../models/media.model'
import dbErrorHandler from '../utils/dbErrorHandler'

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
    const media = new Media(fields)
    media.postedBy = req.profile

    if (files.video) {
      const writeStream = gridfs.openUploadStream(media._id, {
        contentType: files.video[0].mimetype || 'binary/octet-stream'
      })
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
        error: 'Video not found'
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
  const range = req.headers['range']
  if (range && typeof range === 'string') {
    const parts = range.replace(/bytes=/, '').split('-')
    const partialStart = parts[0]
    const partialEnd = parts[1]

    const start = parseInt(partialStart, 10)
    const end = partialEnd ? parseInt(partialEnd, 10) : req.file.length - 1
    const chunkSize = end - start + 1

    res.writeHead(206, {
      'accept-ranges': 'bytes',
      'content-length': chunkSize,
      'content-range': 'bytes' + start + '-' + end + '/' + req.file.length,
      'Content-Type': req.file.contentType
    })

    const downloadStream = gridfs.openDownloadStream(req.file._id, {
      start,
      end: end + 1
    })

    downloadStream.pipe(res)
    downloadStream.on('error', () => {
      res.sendStatus(404)
    })
    downloadStream.on('end', () => {
      res.end()
    })
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

export default { create, mediaById, video }
