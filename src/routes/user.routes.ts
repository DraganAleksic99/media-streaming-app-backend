import { Router } from 'express'
import userCtrl from '../controllers/user.controller'
import authController from '../controllers/auth.controller'

const router = Router()

router.route('/api/users').get(userCtrl.list).post(userCtrl.create)
router
  .route('/api/users/:userId')
  .get(authController.requireSignIn, userCtrl.read)
  .put(authController.requireSignIn, authController.hasAuthorization, userCtrl.update)
  .delete(authController.requireSignIn, authController.hasAuthorization, userCtrl.remove)

router.route('/api/users/photo/:userId').get(userCtrl.photo)

router.param('userId', userCtrl.userById)

export default router
