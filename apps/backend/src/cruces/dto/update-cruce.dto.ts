import { PartialType } from '@nestjs/swagger';
import { CreateCruceDto } from './create-cruce.dto';

export class UpdateCruceDto extends PartialType(CreateCruceDto) {}
