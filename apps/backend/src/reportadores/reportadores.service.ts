import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateReportadorDto, UpdateReportadorDto } from './reportadores.dto';

@Injectable()
export class ReportadoresService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.reportador.findMany({
      orderBy: { nombre: 'asc' },
    });
  }

  async findOne(id: number) {
    const reportador = await this.prisma.reportador.findUnique({
      where: { id },
    });
    
    if (!reportador) {
      throw new NotFoundException(`Reportador con ID ${id} no encontrado`);
    }
    
    return reportador;
  }

  async create(createReportadorDto: CreateReportadorDto) {
    return this.prisma.reportador.create({
      data: {
        nombre: createReportadorDto.nombre,
        estado: createReportadorDto.estado ?? true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });
  }

  async update(id: number, updateReportadorDto: UpdateReportadorDto) {
    await this.findOne(id);
    
    return this.prisma.reportador.update({
      where: { id },
      data: {
        ...updateReportadorDto,
        updatedAt: new Date(),
      },
    });
  }

  async remove(id: number) {
    await this.findOne(id);
    
    return this.prisma.reportador.update({
      where: { id },
      data: {
        estado: false,
        updatedAt: new Date(),
      },
    });
  }
}
