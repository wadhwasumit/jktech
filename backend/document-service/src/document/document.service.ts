import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Document } from '../entities/document.entity';
import { CreateDocumentDto } from '../dtos/create-document.dto';
import { UpdateDocumentDto } from '../dtos/update-document.dto';
import { User } from '../entities/user.entity';
import { UserRole } from '../common/enums/user-role.enum';
import { promises as fs } from 'fs';
import { join, extname } from 'path';
@Injectable()
export class DocumentsService {
  constructor(
    @InjectRepository(Document)
    private readonly documentRepository: Repository<Document>,
  ) {}
  
  async create(createDocumentDto: CreateDocumentDto, file: Express.Multer.File, user: User): Promise<Document> {
    console.log('Creating document with file:', file);
     
    if (file?.buffer) {
      const dir = join(process.cwd(), 'uploads', 'documents');
      await fs.mkdir(dir, { recursive: true });

      const filename = `${Date.now()}-${Math.round(Math.random() * 1e9)}${extname(file.originalname)}`;
      const filePath = join(dir, filename);

      const buffer = file.buffer.toString('base64');
      await fs.writeFile(filePath, buffer);
    
      const document = this.documentRepository.create({
        ...createDocumentDto,
        filename: filename,
        originalName: file.originalname,
        mimeType: file.mimetype,
        size: file.size,
        filePath: filePath,
        uploadedById: user.id,
      });
    
      return await this.documentRepository.save(document);
    }
  }

  async findAll(user: User): Promise<Document[]> {
    if (user.role === UserRole.ADMIN) {
      return await this.documentRepository.find();
    }
    
    return await this.documentRepository.find({
      where: { uploadedById: user.id }
      // relations: ['uploadedBy'],
    });
  }

  async findById(id: string, user: User): Promise<Document> {
    const document = await this.documentRepository.findOne({
      where: { id }
      // relations: ['uploadedBy'],
    });

    if (!document) {
      throw new NotFoundException('Document not found');
    }

    if (user.role !== UserRole.ADMIN && document.uploadedById !== user.id) {
      throw new ForbiddenException('You do not have permission to access this document');
    }

    return document;
  }

  async update(id: string, updateDocumentDto: UpdateDocumentDto, user: User): Promise<Document> {
    const document = await this.findById(id, user);

    if (user.role !== UserRole.ADMIN && document.uploadedById !== user.id) {
      throw new ForbiddenException('You do not have permission to update this document');
    }

    Object.assign(document, updateDocumentDto);
    return await this.documentRepository.save(document);
  }

  async remove(id: string, user: User): Promise<void> {
    const document = await this.findById(id, user);

    if (user.role !== UserRole.ADMIN && document.uploadedById !== user.id) {
      throw new ForbiddenException('You do not have permission to delete this document');
    }

    await this.documentRepository.remove(document);
  }

  async findByIds(ids: string[]): Promise<Document[]> {
    return await this.documentRepository.findByIds(ids);
  }

  async markAsIngested(ids: string[]): Promise<void> {
    await this.documentRepository.update(
      { id: In(ids) },
      { isIngested: true }
    );
  }
}