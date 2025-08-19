import { IsNotEmpty, IsString, IsUrl } from 'class-validator';

export class ProcessFileDto {
  @IsUrl()
  url: string;

  @IsString()
  @IsNotEmpty()
  folderId: string;
}