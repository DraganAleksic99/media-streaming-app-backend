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
    const mediaFields = {
      title: fields.title?.toString() || '',
      description: fields.description?.toString() || '',
      genre: fields.genre?.toString() || ''
    }
    const media = new Media(mediaFields)
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

export default {
  create
}
