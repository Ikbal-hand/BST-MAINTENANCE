import bcrypt from 'bcryptjs'
import jwt, { type SignOptions } from 'jsonwebtoken'
import { config } from '../config.js'
import { canAccessWorkspace, type WorkspaceContext } from '../domain.js'
import { ConflictError, UnauthorizedError } from '../errors.js'
import { UserRepository } from '../repositories/user-repository.js'

export class AuthService {
  constructor(private readonly users: Pick<UserRepository, 'findByEmail' | 'findById' | 'changePassword'>) {}

  async login(email: string, password: string, rememberMe: boolean, workspaceContext: WorkspaceContext) {
    const user = await this.users.findByEmail(email.toLowerCase(), workspaceContext.slug ?? undefined)
    if (!user?.passwordHash || !user.isActive || !user.workspace.isActive) {
      throw new UnauthorizedError('Email atau password salah')
    }

    const validPassword = await bcrypt.compare(password, user.passwordHash)
    if (!validPassword || !canAccessWorkspace(workspaceContext, {
      slug: user.workspace.slug,
      type: user.workspace.type,
      role: user.role,
    })) {
      throw new UnauthorizedError('Email atau password salah')
    }

    const signOptions: SignOptions = {
      subject: user.id,
      expiresIn: (rememberMe ? config.JWT_REMEMBER_EXPIRES_IN : config.JWT_EXPIRES_IN) as SignOptions['expiresIn'],
    }
    const token = jwt.sign(
      {
        workspaceId: user.workspaceId,
        workspaceSlug: user.workspace.slug,
        workspaceType: user.workspace.type,
        role: user.role,
        passwordVersion: user.passwordVersion,
      },
      config.JWT_SECRET,
      signOptions,
    )

    return {
      accessToken: token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        workspace: {
          id: user.workspace.id,
          slug: user.workspace.slug,
          name: user.workspace.name,
          type: user.workspace.type,
        },
      },
    }
  }

  async me(userId: string) {
    const user = await this.users.findById(userId)
    if (!user || !user.isActive) throw new UnauthorizedError()
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      workspace: user.workspace,
    }
  }

  async changePassword(userId: string, currentPassword: string, newPassword: string) {
    const user = await this.users.findById(userId)
    if (!user?.passwordHash || !user.isActive || !user.workspace.isActive) {
      throw new UnauthorizedError('Akun tidak ditemukan atau sudah tidak aktif')
    }

    if (!(await bcrypt.compare(currentPassword, user.passwordHash))) {
      throw new UnauthorizedError('Password saat ini tidak sesuai')
    }
    if (await bcrypt.compare(newPassword, user.passwordHash)) {
      throw new ConflictError('Password baru harus berbeda dari password saat ini')
    }

    const newPasswordHash = await bcrypt.hash(newPassword, 12)
    const result = await this.users.changePassword(user.id, user.passwordHash, newPasswordHash)
    if (result.count === 0) {
      throw new ConflictError('Password akun baru saja berubah. Muat ulang halaman dan coba kembali.')
    }
    return { changed: true }
  }
}
