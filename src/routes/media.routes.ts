import { Router } from 'express'
import authCtrl from '../controllers/auth.controller'
import userCtrl from '../controllers/user.controller'
import mediaCtrl from '../controllers/media.controller'

const router = Router()

router.route('/api/media/new/:userId').post(authCtrl.requireSignIn, mediaCtrl.create)
router.route('/api/medias/video/:mediaId').get(mediaCtrl.video)
router.route('/api/media/popular').get(mediaCtrl.listPopular)
router.param('userId', userCtrl.userById)
router.param('mediaId', mediaCtrl.mediaById)

export default router
