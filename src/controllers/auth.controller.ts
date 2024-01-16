import userModel from '../models/user.model'
import jwt from 'jsonwebtoken'
import { expressjwt } from 'express-jwt'
import { Request, Response, NextFunction } from 'express'
import config from '../config/config'

const signin = async (req: Request, res: Response) => {
  try {
    const user = await userModel.findOne({ email: req.body.email })
    if (!user) {
      return res.status(401).json({ error: 'User not found' })
    }

    if (!user.authenticate(req.body.password)) {
      return res.status(401).json({ error: 'Incorrect password' })
    }

    const token = jwt.sign({ _id: user._id }, config.jwtSecret, {
      expiresIn: '1d'
    })

    res.cookie('t', token)
    return res.json({
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email
      }
    })
  } catch (err) {
    console.log(err)

    return res.status(401).json({ error: 'Could not sign in' })
  }
}
const signout = (req: Request, res: Response) => {
  res.clearCookie('t')
  return res.status(200).json({ message: 'Successfully signed out' })
}

const requireSignIn = expressjwt({
  secret: config.jwtSecret,
  algorithms: ['HS256']
})

const hasAuthorization = (req: Request, res: Response, next: NextFunction) => {
  const authorized = req.profile && req.auth && req.profile._id.toString() === req.auth._id
  if (!authorized) {
    return res.status(403).json({ error: 'User is not authorized' })
  }
  next()
}

export default { signin, signout, requireSignIn, hasAuthorization }
