import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  ParseIntPipe,
  UseGuards,
  UseInterceptors,
  UploadedFiles,
  Res,
  NotFoundException,
} from '@nestjs/common';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiConsumes } from '@nestjs/swagger';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { Request, Response } from 'express';
import { CrucesService } from './cruces.service';
import { CreateCruceDto } from './dto/create-cruce.dto';
import { UpdateCruceDto } from './dto/update-cruce.dto';
import { QueryCrucesDto } from './dto/query-cruces.dto';
import { AddPerifericoDto } from './dto/add-periferico.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Public } from '../common/decorators/public.decorator';

@ApiTags('cruces')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('cruces')
export class CrucesController {
  constructor(private readonly crucesService: CrucesService) {}

  @Post()
  @Roles('ADMINISTRADOR', 'SUPERVISOR')
  @ApiOperation({ summary: 'Crear un nuevo cruce' })
  @ApiConsumes('multipart/form-data')
  @ApiResponse({ status: 201, description: 'Cruce creado exitosamente' })
  @ApiResponse({ status: 403, description: 'No autorizado' })
  @UseInterceptors(
    FileFieldsInterceptor(
      [
        { name: 'planoPdf', maxCount: 1 },
        { name: 'planoDwg', maxCount: 1 },
      ],
      {
        storage: diskStorage({
          destination: './uploads/planos',
          filename: (req: Request, file: Express.Multer.File, callback: (error: Error | null, filename: string) => void) => {
            const codigo = ((req.body as any).codigo || 'SIN_CODIGO').replace(/[^a-zA-Z0-9]/g, '_');
            const fecha = new Date().toISOString().split('T')[0].replace(/-/g, '');
            const ext = extname(file.originalname);
            const tipo = file.fieldname === 'planoPdf' ? 'PDF' : 'DWG';
            
            // Contar archivos existentes para el contador
            const filename = `${codigo}-${fecha}-${tipo}${ext}`;
            callback(null, filename);
          },
        }),
        fileFilter: (req: Request, file: Express.Multer.File, callback: (error: Error | null, acceptFile: boolean) => void) => {
          if (file.fieldname === 'planoPdf' && file.mimetype !== 'application/pdf') {
            return callback(new Error('Solo se permiten archivos PDF'), false);
          }
          if (file.fieldname === 'planoDwg' && !file.originalname.toLowerCase().endsWith('.dwg')) {
            return callback(new Error('Solo se permiten archivos DWG'), false);
          }
          callback(null, true);
        },
      },
    ),
  )
  create(
    @Body() bodyData: any, // Recibir como objeto genérico para evitar validación prematura
    @UploadedFiles() files: { planoPdf?: Express.Multer.File[]; planoDwg?: Express.Multer.File[] },
    @CurrentUser() user: any,
  ) {
    console.log('=== DEBUG CREATE CRUCE ===');
    console.log('Body recibido:', JSON.stringify(bodyData, null, 2));
    console.log('Tipos de datos:');
    Object.keys(bodyData).forEach(key => {
      console.log(`  ${key}: ${typeof bodyData[key]} = ${bodyData[key]}`);
    });
    
    // Transformar valores de FormData a tipos correctos
    const transformedDto: any = { ...bodyData };
    
    // Convertir strings a números
    const numericFields = ['tipoGestion', 'administradorId', 'proyectoId', 'via1', 'via2', 
                           'tipoComunicacion', 'tipoCruce', 'tipoEstructura',
                           'anoImplementacion', 'tipoControl', 'latitud', 'longitud'];
    numericFields.forEach(field => {
      if (transformedDto[field] !== undefined && transformedDto[field] !== '' && transformedDto[field] !== null) {
        const numValue = Number(transformedDto[field]);
        if (!isNaN(numValue)) {
          transformedDto[field] = numValue;
        }
      }
    });
    
    // Convertir string a boolean
    if (transformedDto.estado !== undefined) {
      transformedDto.estado = transformedDto.estado === 'true' || transformedDto.estado === true || transformedDto.estado === 1 || transformedDto.estado === '1';
    }
    
    console.log('Datos transformados:', JSON.stringify(transformedDto, null, 2));
    
    const cruceData = {
      ...transformedDto,
      ...(files?.planoPdf?.[0] && { planoPdf: files.planoPdf[0].filename }),
      ...(files?.planoDwg?.[0] && { planoDwg: files.planoDwg[0].filename }),
    };
    return this.crucesService.create(cruceData, user.sub);
  }

  @Get()
  @ApiOperation({ summary: 'Obtener lista de cruces con filtros y paginación' })
  @ApiResponse({ status: 200, description: 'Lista de cruces obtenida exitosamente' })
  findAll(@Query() query: QueryCrucesDto) {
    return this.crucesService.findAll(query);
  }

  @Get('search')
  @ApiOperation({ summary: 'Buscar cruces para autocomplete' })
  @ApiResponse({ status: 200, description: 'Resultados de búsqueda' })
  search(@Query('q') query: string, @Query('limit') limit?: number) {
    return this.crucesService.search(query, limit ? parseInt(limit.toString()) : 20);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener detalle de un cruce' })
  @ApiResponse({ status: 200, description: 'Cruce encontrado' })
  @ApiResponse({ status: 404, description: 'Cruce no encontrado' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.crucesService.findOne(id);
  }

  @Patch(':id')
  @Roles('ADMINISTRADOR', 'SUPERVISOR')
  @ApiOperation({ summary: 'Actualizar un cruce' })
  @ApiConsumes('multipart/form-data')
  @ApiResponse({ status: 200, description: 'Cruce actualizado exitosamente' })
  @ApiResponse({ status: 404, description: 'Cruce no encontrado' })
  @ApiResponse({ status: 403, description: 'No autorizado' })
  @UseInterceptors(
    FileFieldsInterceptor(
      [
        { name: 'planoPdf', maxCount: 1 },
        { name: 'planoDwg', maxCount: 1 },
      ],
      {
        storage: diskStorage({
          destination: './uploads/planos',
          filename: (req: Request, file: Express.Multer.File, callback: (error: Error | null, filename: string) => void) => {
            const codigo = ((req.body as any).codigo || 'SIN_CODIGO').replace(/[^a-zA-Z0-9]/g, '_');
            const fecha = new Date().toISOString().split('T')[0].replace(/-/g, '');
            const ext = extname(file.originalname);
            const tipo = file.fieldname === 'planoPdf' ? 'PDF' : 'DWG';
            
            // Contar archivos existentes para el contador
            const filename = `${codigo}-${fecha}-${tipo}${ext}`;
            callback(null, filename);
          },
        }),
        fileFilter: (req: Request, file: Express.Multer.File, callback: (error: Error | null, acceptFile: boolean) => void) => {
          if (file.fieldname === 'planoPdf' && file.mimetype !== 'application/pdf') {
            return callback(new Error('Solo se permiten archivos PDF'), false);
          }
          if (file.fieldname === 'planoDwg' && !file.originalname.toLowerCase().endsWith('.dwg')) {
            return callback(new Error('Solo se permiten archivos DWG'), false);
          }
          callback(null, true);
        },
      },
    ),
  )
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() bodyData: any, // Recibir como objeto genérico para evitar validación prematura
    @UploadedFiles() files: { planoPdf?: Express.Multer.File[]; planoDwg?: Express.Multer.File[] },
  ) {
    // Transformar valores de FormData a tipos correctos
    const transformedDto: any = { ...bodyData };
    
    // Convertir strings a números
    const numericFields = ['tipoGestion', 'administradorId', 'proyectoId', 'via1', 'via2', 
                           'tipoComunicacion', 'tipoCruce', 'tipoEstructura',
                           'anoImplementacion', 'tipoControl', 'latitud', 'longitud'];
    numericFields.forEach(field => {
      if (transformedDto[field] !== undefined && transformedDto[field] !== '' && transformedDto[field] !== null) {
        const numValue = Number(transformedDto[field]);
        if (!isNaN(numValue)) {
          transformedDto[field] = numValue;
        }
      }
    });
    
    // Convertir string a boolean
    if (transformedDto.estado !== undefined) {
      transformedDto.estado = transformedDto.estado === 'true' || transformedDto.estado === true || transformedDto.estado === 1 || transformedDto.estado === '1';
    }
    
    const cruceData = {
      ...transformedDto,
      ...(files?.planoPdf?.[0] && { planoPdf: files.planoPdf[0].filename }),
      ...(files?.planoDwg?.[0] && { planoDwg: files.planoDwg[0].filename }),
    };
    return this.crucesService.update(id, cruceData);
  }

  @Delete(':id')
  @Roles('ADMINISTRADOR')
  @ApiOperation({ summary: 'Eliminar (desactivar) un cruce' })
  @ApiResponse({ status: 200, description: 'Cruce desactivado exitosamente' })
  @ApiResponse({ status: 404, description: 'Cruce no encontrado' })
  @ApiResponse({ status: 403, description: 'No autorizado' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.crucesService.remove(id);
  }

  // Endpoints de periféricos
  @Get(':id/perifericos')
  @ApiOperation({ summary: 'Obtener periféricos de un cruce' })
  @ApiResponse({ status: 200, description: 'Lista de periféricos del cruce' })
  getPerifericos(@Param('id', ParseIntPipe) id: number) {
    return this.crucesService.getPerifericos(id);
  }

  @Post(':id/perifericos')
  @Roles('ADMINISTRADOR', 'SUPERVISOR')
  @ApiOperation({ summary: 'Agregar un periférico a un cruce' })
  @ApiResponse({ status: 201, description: 'Periférico agregado exitosamente' })
  addPeriferico(
    @Param('id', ParseIntPipe) id: number,
    @Body() addPerifericoDto: AddPerifericoDto,
  ) {
    return this.crucesService.addPeriferico(id, addPerifericoDto.perifericoId);
  }

  @Delete(':id/perifericos/:perifericoId')
  @Roles('ADMINISTRADOR', 'SUPERVISOR')
  @ApiOperation({ summary: 'Remover un periférico de un cruce' })
  @ApiResponse({ status: 200, description: 'Periférico removido exitosamente' })
  removePeriferico(
    @Param('id', ParseIntPipe) id: number,
    @Param('perifericoId', ParseIntPipe) perifericoId: number,
  ) {
    return this.crucesService.removePeriferico(id, perifericoId);
  }
}
