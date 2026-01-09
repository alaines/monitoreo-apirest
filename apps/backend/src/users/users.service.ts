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

    // Check if document number already exists
    const existingPersona = await this.prisma.persona.findFirst({
      where: { num_doc: createUserDto.nroDoc },
    });

    if (existingPersona) {
      throw new ConflictException('El número de documento ya está registrado');
    }

    // Validate grupo exists
    const grupo = await this.prisma.grupo.findUnique({
      where: { id: createUserDto.grupoId },
    });

    if (!grupo) {
      throw new BadRequestException('El grupo especificado no existe');
    }

    // Validate area if provided
    if (createUserDto.areaId) {
      const area = await this.prisma.area.findUnique({
        where: { id: createUserDto.areaId },
      });

      if (!area) {
        throw new BadRequestException('El área especificada no existe');
      }
    }

    // Hash password
    const clave = this.authService.hashPassword(createUserDto.password);

    // Create persona first
    const persona = await this.prisma.persona.create({
      data: {
        tipoDocId: createUserDto.tipoDocId,
        num_doc: createUserDto.nroDoc,
        nombres: createUserDto.nombres,
        ape_pat: createUserDto.apellidoP,
        ape_mat: createUserDto.apellidoM,
        genero: createUserDto.genero,
        fecnac: createUserDto.fechaNacimiento,
        estadoCivilId: createUserDto.estadoCivilId,
        email: createUserDto.email,
        movil1: createUserDto.telefono,
        nomcomp: `${createUserDto.nombres} ${createUserDto.apellidoP} ${createUserDto.apellidoM}`,
        estado: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });

    // Create user with persona reference
    const user = await this.prisma.user.create({
      data: {
        usuario: createUserDto.usuario,
        clave,
        grupoId: createUserDto.grupoId,
        areaId: createUserDto.areaId,
        personaId: persona.id,
        estado: createUserDto.estado ?? true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      include: {
        grupo: {
          select: {
            id: true,
            nombre: true,
          },
        },
        area: {
          select: {
            id: true,
            nombre: true,
          },
        },
        persona: true,
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
          area: {
            select: {
              id: true,
              nombre: true,
            },
          },
          persona: true,
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
        area: true,
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
    const existingUser = await this.findOne(id); // Validate user exists

    // If username is being updated, check if it's available
    if (updateUserDto.usuario) {
      const userWithSameUsername = await this.prisma.user.findUnique({
        where: { usuario: updateUserDto.usuario },
      });

      if (userWithSameUsername && userWithSameUsername.id !== id) {
        throw new ConflictException('El nombre de usuario ya está en uso');
      }
    }

    // If document number is being updated, check if it's available
    if (updateUserDto.nroDoc && existingUser.personaId) {
      const personaWithSameDoc = await this.prisma.persona.findFirst({
        where: {
          num_doc: updateUserDto.nroDoc,
          id: { not: existingUser.personaId },
        },
      });

      if (personaWithSameDoc) {
        throw new ConflictException('El número de documento ya está registrado');
      }
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

    // Validate area if provided
    if (updateUserDto.areaId) {
      const area = await this.prisma.area.findUnique({
        where: { id: updateUserDto.areaId },
      });

      if (!area) {
        throw new BadRequestException('El área especificada no existe');
      }
    }

    // Update persona if exists and persona fields are provided
    if (existingUser.personaId) {
      const personaData: any = {};
      if (updateUserDto.tipoDocId !== undefined) personaData.tipoDocId = updateUserDto.tipoDocId;
      if (updateUserDto.nroDoc !== undefined) personaData.num_doc = updateUserDto.nroDoc;
      if (updateUserDto.nombres !== undefined) personaData.nombres = updateUserDto.nombres;
      if (updateUserDto.apellidoP !== undefined) personaData.ape_pat = updateUserDto.apellidoP;
      if (updateUserDto.apellidoM !== undefined) personaData.ape_mat = updateUserDto.apellidoM;
      if (updateUserDto.genero !== undefined) personaData.genero = updateUserDto.genero;
      if (updateUserDto.fechaNacimiento !== undefined) personaData.fecnac = updateUserDto.fechaNacimiento;
      if (updateUserDto.estadoCivilId !== undefined) personaData.estadoCivilId = updateUserDto.estadoCivilId;
      if (updateUserDto.email !== undefined) personaData.email = updateUserDto.email;
      if (updateUserDto.telefono !== undefined) personaData.movil1 = updateUserDto.telefono;

      if (Object.keys(personaData).length > 0) {
        // Update nomcomp if any name field changed
        const currentPersona = await this.prisma.persona.findUnique({
          where: { id: existingUser.personaId },
        });

        const apePat = personaData.ape_pat ?? currentPersona?.ape_pat ?? '';
        const apeMat = personaData.ape_mat ?? currentPersona?.ape_mat ?? '';
        const nombres = personaData.nombres ?? currentPersona?.nombres ?? '';
        personaData.nomcomp = `${nombres} ${apePat} ${apeMat}`.trim();
        personaData.updatedAt = new Date();

        await this.prisma.persona.update({
          where: { id: existingUser.personaId },
          data: personaData,
        });
      }
    }

    // Update user
    const userDataToUpdate: any = {};
    if (updateUserDto.usuario !== undefined) userDataToUpdate.usuario = updateUserDto.usuario;
    if (updateUserDto.grupoId !== undefined) userDataToUpdate.grupoId = updateUserDto.grupoId;
    if (updateUserDto.areaId !== undefined) userDataToUpdate.areaId = updateUserDto.areaId;
    if (updateUserDto.estado !== undefined) userDataToUpdate.estado = updateUserDto.estado;

    // Hash password if provided
    if (updateUserDto.password) {
      userDataToUpdate.clave = this.authService.hashPassword(updateUserDto.password);
    }

    if (Object.keys(userDataToUpdate).length > 0) {
      userDataToUpdate.updatedAt = new Date();
    }

    const user = await this.prisma.user.update({
      where: { id },
      data: userDataToUpdate,
      include: {
        grupo: {
          select: {
            id: true,
            nombre: true,
          },
        },
        area: {
          select: {
            id: true,
            nombre: true,
          },
        },
        persona: true,
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
