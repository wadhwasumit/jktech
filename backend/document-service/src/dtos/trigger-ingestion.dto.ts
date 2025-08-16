import { IsArray, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class TriggerIngestionDto {
  @ApiProperty({ type: [String] })
  @IsArray()
  @IsUUID(4, { each: true })
  documentIds: string[];
}
