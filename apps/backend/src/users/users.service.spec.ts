import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from './users.service';
import { PrismaService } from '../prisma/prisma.service';
import { AuthService } from '../auth/auth.service';
import { NotFoundException, ConflictException } from '@nestjs/common';

describe('UsersService', () => {
  let service: UsersService;
  let prismaService: PrismaService;
  let authService: AuthService;

  const mockUser = {
    id: 1,
    usuario: 'testuser',
    clave: 'hashed',
    grupoId: 1,
    personaId: null,
    estado: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    grupo: {
      id: 1,
      nombre: 'OPERADOR',
    },
    persona: null,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: PrismaService,
          useValue: {
            user: {
              findUnique: jest.fn(),
              findMany: jest.fn(),
              create: jest.fn(),
              update: jest.fn(),
              count: jest.fn(),
            },
            grupo: {
              findUnique: jest.fn(),
            },
          },
        },
        {
          provide: AuthService,
          useValue: {
            hashPassword: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    prismaService = module.get<PrismaService>(PrismaService);
    authService = module.get<AuthService>(AuthService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should throw ConflictException if user already exists', async () => {
      jest.spyOn(prismaService.user, 'findUnique').mockResolvedValue(mockUser as any);

      await expect(
        service.create({
          usuario: 'testuser',
          password: 'password',
          grupoId: 1,
          tipoDocId: 1,
          nroDoc: '12345678',
          nombres: 'Test',
          apellidoP: 'User',
          apellidoM: 'Test',
        }),
      ).rejects.toThrow(ConflictException);
    });

    it('should create a new user successfully', async () => {
      jest.spyOn(prismaService.user, 'findUnique').mockResolvedValue(null);
      jest.spyOn(prismaService.persona, 'findFirst').mockResolvedValue(null);
      jest.spyOn(prismaService.grupo, 'findUnique').mockResolvedValue({ id: 1, nombre: 'OPERADOR' } as any);
      jest.spyOn(prismaService.persona, 'create').mockResolvedValue({ id: 1 } as any);
      jest.spyOn(authService, 'hashPassword').mockReturnValue('hashed-password');
      jest.spyOn(prismaService.user, 'create').mockResolvedValue(mockUser as any);

      const result = await service.create({
        usuario: 'newuser',
        password: 'password123',
        grupoId: 1,
        tipoDocId: 1,
        nroDoc: '12345678',
        nombres: 'Test',
        apellidoP: 'User',
        apellidoM: 'Test',
      });

      expect(result).toBeDefined();
      expect(result).not.toHaveProperty('passwordHash');
      expect(result).not.toHaveProperty('clave');
    });
  });

  describe('findAll', () => {
    it('should return paginated users', async () => {
      jest.spyOn(prismaService.user, 'findMany').mockResolvedValue([mockUser] as any);
      jest.spyOn(prismaService.user, 'count').mockResolvedValue(1);

      const result = await service.findAll(1, 10);

      expect(result).toHaveProperty('data');
      expect(result).toHaveProperty('meta');
      expect(result.meta.total).toBe(1);
    });
  });

  describe('findOne', () => {
    it('should throw NotFoundException if user not found', async () => {
      jest.spyOn(prismaService.user, 'findUnique').mockResolvedValue(null);

      await expect(service.findOne(999)).rejects.toThrow(NotFoundException);
    });

    it('should return user without password hash', async () => {
      jest.spyOn(prismaService.user, 'findUnique').mockResolvedValue(mockUser as any);

      const result = await service.findOne(1);

      expect(result).toBeDefined();
      expect(result).not.toHaveProperty('passwordHash');
      expect(result).not.toHaveProperty('clave');
    });
  });

  describe('update', () => {
    it('should update user successfully', async () => {
      jest.spyOn(prismaService.user, 'findUnique').mockResolvedValue(mockUser as any);
      jest.spyOn(prismaService.user, 'update').mockResolvedValue({ ...mockUser, usuario: 'updated' } as any);

      const result = await service.update(1, { usuario: 'updated' });

      expect(result).toBeDefined();
      expect(result).not.toHaveProperty('passwordHash');
      expect(result).not.toHaveProperty('clave');
    });
  });

  describe('remove', () => {
    it('should soft delete user', async () => {
      jest.spyOn(prismaService.user, 'findUnique').mockResolvedValue(mockUser as any);
      jest.spyOn(prismaService.user, 'update').mockResolvedValue({ ...mockUser, estado: false } as any);

      const result = await service.remove(1);

      expect(result).toHaveProperty('message');
      expect(result.id).toBe(1);
    });
  });
});
