import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuthService } from '../auth/auth.service';
import { CreateUserDto, UpdateUserDto } from './dto/user.dto';

@Injectable()
export class UsersService {
  constructor(
    private prisma: PrismaService,
    private authService: AuthService,
  ) {}

  async create(createUserDto: CreateUserDto) {
    // Check if user already exists
    const existingUser = await this.prisma.user.findUnique({
      where: { usuario: createUserDto.usuario },
    });

    if (existingUser) {
      throw new ConflictException('El usuario ya existe');
    }

    // Validate grupo exists
    const grupo = await this.prisma.grupo.findUnique({
      where: { id: createUserDto.grupoId },
    });

    if (!grupo) {
      throw new BadRequestException('El grupo especificado no existe');
    }

    // Hash password
    const clave = this.authService.hashPassword(createUserDto.password);

    // Create user
    const user = await this.prisma.user.create({
      data: {
        usuario: createUserDto.usuario,
        clave,
        grupoId: createUserDto.grupoId,
        personaId: createUserDto.personaId,
        estado: createUserDto.estado ?? true,
      },
      include: {
        grupo: {
          select: {
            id: true,
            nombre: true,
          },
        },
        persona: {
          select: {
            id: true,
            nombres: true,
            ape_pat: true,
            ape_mat: true,
          },
        },
      },
    });

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { clave: _, ...result } = user;
    return result;
  }

  async findAll(page = 1, limit = 10) {
    const skip = (page - 1) * limit;

    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        skip,
        take: limit,
        include: {
          grupo: {
            select: {
              id: true,
              nombre: true,
            },
          },
          persona: {
            select: {
              id: true,
              nombres: true,
              ape_pat: true,
              ape_mat: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      }),
      this.prisma.user.count(),
    ]);

    return {
      data: users.map(({ clave, ...user }) => user),
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: number) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: {
        grupo: true,
        persona: true,
      },
    });

    if (!user) {
      throw new NotFoundException(`Usuario con ID ${id} no encontrado`);
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { clave, ...result } = user;
    return result;
  }

  async update(id: number, updateUserDto: UpdateUserDto) {
    await this.findOne(id); // Validate user exists

    const dataToUpdate: any = { ...updateUserDto };

    // If username is being updated, check if it's available
    if (updateUserDto.usuario) {
      const existingUser = await this.prisma.user.findUnique({
        where: { usuario: updateUserDto.usuario },
      });

      if (existingUser && existingUser.id !== id) {
        throw new ConflictException('El nombre de usuario ya está en uso');
      }
    }

    // If password is being updated, hash it
    if (updateUserDto.password) {
      dataToUpdate.clave = this.authService.hashPassword(updateUserDto.password);
      delete dataToUpdate.password;
    }

    // Validate grupo if provided
    if (updateUserDto.grupoId) {
      const grupo = await this.prisma.grupo.findUnique({
        where: { id: updateUserDto.grupoId },
      });

      if (!grupo) {
        throw new BadRequestException('El grupo especificado no existe');
      }
    }

    const user = await this.prisma.user.update({
      where: { id },
      data: dataToUpdate,
      include: {
        grupo: {
          select: {
            id: true,
            nombre: true,
          },
        },
        persona: {
          select: {
            id: true,
            nombres: true,
            ape_pat: true,
            ape_mat: true,
          },
        },
      },
    });

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { clave, ...result } = user;
    return result;
  }

  async remove(id: number) {
    await this.findOne(id); // Validate user exists

    // Soft delete - set estado to false
    const user = await this.prisma.user.update({
      where: { id },
      data: { estado: false },
    });

    return { message: 'Usuario desactivado exitosamente', id: user.id };
  }

  async getMe(userId: number) {
    return this.findOne(userId);
  }
}
