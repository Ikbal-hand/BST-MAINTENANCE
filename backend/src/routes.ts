import { Router } from 'express'
import { authenticate, requireBranchWorkspace, requireRoles, requireWorkspaceAccess } from './middleware/auth.js'
import { createAuthController } from './controllers/auth-controller.js'
import { createStoreController } from './controllers/store-controller.js'
import { createBapController } from './controllers/bap-controller.js'
import { AuthService } from './services/auth-service.js'
import { StoreService } from './services/store-service.js'
import { BapService } from './services/bap-service.js'
import { UserRepository } from './repositories/user-repository.js'
import { StoreRepository } from './repositories/store-repository.js'
import { BapRepository } from './repositories/bap-repository.js'
import { prisma } from './db.js'
import { createInvoiceController } from './controllers/invoice-controller.js'
import { InvoiceService } from './services/invoice-service.js'
import { InvoiceRepository } from './repositories/invoice-repository.js'
import { RecapRepository } from './repositories/recap-repository.js'
import { RecapService } from './services/recap-service.js'
import { createRecapController } from './controllers/recap-controller.js'
import { SettingsRepository } from './repositories/settings-repository.js'
import { SettingsService } from './services/settings-service.js'
import { createSettingsController } from './controllers/settings-controller.js'
import { DashboardRepository } from './repositories/dashboard-repository.js'
import { DashboardService } from './services/dashboard-service.js'
import { createDashboardController } from './controllers/dashboard-controller.js'
import { createWorkspaceController } from './controllers/workspace-controller.js'
import { WorkspaceRepository } from './repositories/workspace-repository.js'
import rateLimit from 'express-rate-limit'
import { createDeveloperUserController } from './controllers/developer-user-controller.js'
import { DeveloperUserService } from './services/developer-user-service.js'

export function createRoutes() {
  const router = Router()
  const authController = createAuthController(new AuthService(new UserRepository(prisma)))
  const storeController = createStoreController(new StoreService(new StoreRepository(prisma)))
  const bapController = createBapController(new BapService(new BapRepository(prisma)))
  const invoiceController = createInvoiceController(new InvoiceService(new InvoiceRepository(prisma)))
  const recapController = createRecapController(new RecapService(new RecapRepository(prisma)))
  const settingsController = createSettingsController(new SettingsService(new SettingsRepository(prisma)))
  const dashboardController = createDashboardController(new DashboardService(new DashboardRepository(prisma)))
  const workspaceController = createWorkspaceController(new WorkspaceRepository(prisma))
  const developerUserController = createDeveloperUserController(
    new DeveloperUserService(new UserRepository(prisma)),
  )

  router.get('/workspaces/branches', workspaceController.listBranches)
  router.post('/auth/login', authController.login)
  router.post('/auth/logout', authController.logout)
  router.get('/auth/me', authenticate, requireWorkspaceAccess, authController.me)
  router.post(
    '/auth/change-password',
    authenticate,
    requireWorkspaceAccess,
    rateLimit({
      windowMs: 15 * 60 * 1000,
      limit: 5,
      standardHeaders: 'draft-8',
      legacyHeaders: false,
    }),
    authController.changePassword,
  )
  router.get(
    '/developer/users',
    authenticate,
    requireWorkspaceAccess,
    requireRoles('developer'),
    developerUserController.listBranchUsers,
  )
  router.post(
    '/developer/users/:id/reset-password',
    authenticate,
    requireWorkspaceAccess,
    requireRoles('developer'),
    developerUserController.resetBranchUserPassword,
  )
  router.patch(
    '/developer/users/:id/branch',
    authenticate,
    requireWorkspaceAccess,
    requireRoles('developer'),
    developerUserController.moveBranchUser,
  )
  router.patch(
    '/developer/users/:id/status',
    authenticate,
    requireWorkspaceAccess,
    requireRoles('developer'),
    developerUserController.setBranchUserActive,
  )
  router.patch(
    '/developer/branches/:id/status',
    authenticate,
    requireWorkspaceAccess,
    requireRoles('developer'),
    developerUserController.setBranchActive,
  )
  router.delete(
    '/developer/branches/:id',
    authenticate,
    requireWorkspaceAccess,
    requireRoles('developer'),
    developerUserController.deleteBranch,
  )
  router.post(
    '/developer/branches',
    authenticate,
    requireWorkspaceAccess,
    requireRoles('developer'),
    developerUserController.createBranch,
  )
  router.get('/stores', authenticate, requireBranchWorkspace, storeController.list)
  router.post('/stores', authenticate, requireBranchWorkspace, storeController.create)
  router.post('/stores/import', authenticate, requireBranchWorkspace, storeController.import)
  router.patch('/stores/:id', authenticate, requireBranchWorkspace, storeController.update)
  router.delete('/stores/:id', authenticate, requireBranchWorkspace, storeController.remove)
  router.get('/baps', authenticate, requireBranchWorkspace, bapController.list)
  router.get('/baps/available-for-invoice', authenticate, requireBranchWorkspace, invoiceController.availableBaps)
  router.get('/baps/:id', authenticate, requireBranchWorkspace, bapController.get)
  router.post('/baps', authenticate, requireBranchWorkspace, bapController.create)
  router.patch('/baps/:id', authenticate, requireBranchWorkspace, bapController.update)
  router.delete('/baps/:id', authenticate, requireBranchWorkspace, bapController.remove)
  router.get('/invoices', authenticate, requireBranchWorkspace, invoiceController.list)
  router.get('/invoices/:id/sph-print-data', authenticate, requireBranchWorkspace, invoiceController.sphPrintData)
  router.get('/invoices/:id/print-data', authenticate, requireBranchWorkspace, invoiceController.printData)
  router.get('/invoices/:id', authenticate, requireBranchWorkspace, invoiceController.get)
  router.post('/invoices', authenticate, requireBranchWorkspace, invoiceController.create)
  router.patch('/invoices/:id', authenticate, requireBranchWorkspace, invoiceController.update)
  router.delete('/invoices/:id', authenticate, requireBranchWorkspace, invoiceController.remove)
  router.get('/recaps/summary', authenticate, requireBranchWorkspace, recapController.summary)
  router.get('/dashboard/summary', authenticate, requireBranchWorkspace, dashboardController.summary)
  router.get('/settings', authenticate, requireBranchWorkspace, settingsController.get)
  router.patch('/settings', authenticate, requireBranchWorkspace, settingsController.update)
  return router
}
