import type { Express } from 'express'
import { AuthRepository } from '../modules/auth/auth.repository'
import { AuthService } from '../modules/auth/auth.service'
import { authRouter } from '../modules/auth/auth.routes'
import { UserRepository } from '../modules/user/user.repository'
import { UserService } from '../modules/user/user.service'
import { userRouter } from '../modules/user/user.routes'
import { CategoryRepository } from '../modules/category/category.repository'
import { CategoryService } from '../modules/category/category.service'
import { categoryRouter } from '../modules/category/category.routes'
import { ListingRepository } from '../modules/listing/listing.repository'
import { ListingService } from '../modules/listing/listing.service'
import { listingRouter } from '../modules/listing/listing.routes'
import { ChatRepository } from '../modules/chat/chat.repository'
import { ChatService } from '../modules/chat/chat.service'
import { chatRouter } from '../modules/chat/chat.routes'
import { OrderRepository } from '../modules/order/order.repository'
import { OrderService } from '../modules/order/order.service'
import { orderRouter } from '../modules/order/order.routes'
import { ReviewRepository } from '../modules/review/review.repository'
import { ReviewService } from '../modules/review/review.service'
import { reviewRouter } from '../modules/review/review.routes'
import { favoriteRouter } from '../modules/favorite/favorite.routes'
import { notificationRouter } from '../modules/notification/notification.routes'
import { ReportRepository } from '../modules/report/report.repository'
import { ReportService } from '../modules/report/report.service'
import { reportRouter } from '../modules/report/report.routes'
import { AdminRepository } from '../modules/admin/admin.repository'
import { AdminService } from '../modules/admin/admin.service'
import { adminRouter } from '../modules/admin/admin.routes'
import { uploadRouter } from '../modules/upload/upload.routes'

export function registerRoutes(app: Express) {
  const V1 = '/api/v1'

  // Compose dependencies
  const authRepo = new AuthRepository()
  const authService = new AuthService(authRepo)

  const userRepo = new UserRepository()
  const userService = new UserService(userRepo)

  const categoryRepo = new CategoryRepository()
  const categoryService = new CategoryService(categoryRepo)

  const listingRepo = new ListingRepository()
  const listingService = new ListingService(listingRepo)

  const chatRepo = new ChatRepository()
  const chatService = new ChatService(chatRepo)

  const orderRepo = new OrderRepository()
  const orderService = new OrderService(orderRepo, listingRepo)

  const reviewRepo = new ReviewRepository()
  const reviewService = new ReviewService(reviewRepo)

  const reportRepo = new ReportRepository()
  const adminRepo = new AdminRepository()
  const adminService = new AdminService(adminRepo)
  const reportService = new ReportService(reportRepo, adminRepo)

  // Mount routers
  app.use(`${V1}/auth`, authRouter(authService))
  app.use(`${V1}/users`, userRouter(userService))
  app.use(`${V1}/categories`, categoryRouter(categoryService))
  app.use(`${V1}/listings`, listingRouter(listingService))
  app.use(`${V1}/conversations`, chatRouter(chatService))
  app.use(`${V1}/orders`, orderRouter(orderService))
  app.use(`${V1}/reviews`, reviewRouter(reviewService))
  app.use(`${V1}/favorites`, favoriteRouter())
  app.use(`${V1}/notifications`, notificationRouter())
  app.use(`${V1}/reports`, reportRouter(reportService))
  app.use(`${V1}/admin`, adminRouter(adminService))
  app.use(`${V1}/upload`, uploadRouter())
}
