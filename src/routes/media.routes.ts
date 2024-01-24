import { Router } from 'express'
import authCtrl from '../controllers/auth.controller'
import userCtrl from '../controllers/user.controller'
import mediaCtrl from '../controllers/media.controller'

const router = Router()

router.route('/api/media/new/:userId').post(authCtrl.requireSignIn, mediaCtrl.create)

router.param('userId', userCtrl.userById)

export default router
