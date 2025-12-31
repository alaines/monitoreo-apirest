import { PartialType } from '@nestjs/swagger';
import { CreatePerifericoDto } from './create-periferico.dto';

export class UpdatePerifericoDto extends PartialType(CreatePerifericoDto) {}
