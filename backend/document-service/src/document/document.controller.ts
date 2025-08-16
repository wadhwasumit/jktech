import { Controller, Get, Post, Put, Delete, Param, Body, Request, Res, Patch, UploadedFile, UseInterceptors, NotFoundException  } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiBody, ApiConsumes } from '@nestjs/swagger';
import { DocumentsService } from './document.service';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { CreateDocumentDto } from '../dtos/create-document.dto';
import { UpdateDocumentDto } from '../dtos/update-document.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import { promises as fs } from 'fs';
import { createReadStream } from 'fs';
import { basename } from 'path';
import { Response } from 'express';
// import { diskStorage } from 'multer';
// import { extname } from 'path';

/**
 * @swagger
 * tags:
 *   name: Documents
 *   description: API for managing documents
 */
@ApiTags('Documents')
@Controller('documents')
export class DocumentController {
  constructor(private readonly documentService: DocumentsService) {}

  /**
   * @swagger
   * /documents:
   *   get:
   *     summary: Get all documents
   *     description: Returns a list of all documents (admin sees all; others see theirs)
   */
  @Get()
  @ApiOperation({ summary: 'Get all documents', description: 'Returns a list of all documents' })
  @ApiResponse({ status: 200, description: 'List of documents' })
  async findAll(@Request() req: any) {
    return this.documentService.findAll(req.user as any);
  }

  /**
   * @swagger
   * /documents/{id}:
   *   get:
   *     summary: Get a document by ID
   *     description: Returns a single document by its ID
   */
  @Get(':id')
  @ApiOperation({ summary: 'Get document by ID', description: 'Returns a single document by its ID' })
  @ApiParam({ name: 'id', required: true, description: 'Document ID', example: '65e1234abcd56789efgh' })
  @ApiResponse({ status: 200, description: 'Document found' })
  @ApiResponse({ status: 404, description: 'Document not found' })
  async findById(@Param('id') id: string, @Request() req: any) {
    return this.documentService.findById(id, req.user as any);
  }

  /**
   * @swagger
   * /documents:
   *   post:
   *     summary: Upload & create a document
   *     description: Creates a document record with uploaded file and metadata
   */
  @Post()
  @UseInterceptors(FileInterceptor('file'))
  @ApiOperation({ summary: 'Create a document', description: 'Creates a new document with file upload' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        title: { type: 'string', example: 'Project Plan' },
        description: { type: 'string', example: 'Initial planning doc' },
        file: { type: 'string', format: 'binary' },
      },
      required: ['title', 'file'],
    },
  })
  @ApiResponse({ status: 201, description: 'Document created successfully' })
  async create(
    @Body() createDto: CreateDocumentDto,
    @UploadedFile() file: Express.Multer.File,
    @Request() req: any,
  ) {
    return this.documentService.create(createDto, file, req.user as any);
  }

  /**
   * @swagger
   * /documents/{id}:
   *   put:
   *     summary: Update a document
   *     description: Updates document metadata by ID
   */
  @Put(':id')
  @ApiOperation({ summary: 'Update a document', description: 'Updates a document by its ID' })
  @ApiParam({ name: 'id', required: true, description: 'Document ID', example: '65e1234abcd56789efgh' })
  @ApiBody({ type: UpdateDocumentDto })
  @ApiResponse({ status: 200, description: 'Document updated successfully' })
  @ApiResponse({ status: 404, description: 'Document not found' })
  async update(@Param('id') id: string, @Body() dto: UpdateDocumentDto, @Request() req: any) {
    return this.documentService.update(id, dto, req.user as any);
  }

  /**
   * @swagger
   * /documents/{id}:
   *   delete:
   *     summary: Delete a document
   *     description: Deletes a document by its ID
   */
  @Delete(':id')
  @ApiOperation({ summary: 'Delete a document', description: 'Deletes a document by its ID' })
  @ApiParam({ name: 'id', required: true, description: 'Document ID', example: '65e1234abcd56789efgh' })
  @ApiResponse({ status: 200, description: 'Document deleted successfully' })
  @ApiResponse({ status: 404, description: 'Document not found' })
  async delete(@Param('id') id: string, @Request() req: any) {
    await this.documentService.remove(id, req.user as any);
    return { message: 'Document deleted successfully' };
  }

  /**
   * @swagger
   * /documents/{id}/download:
   *   get:
   *     summary: Download a document file
   *     description: Streams the document binary to the client
   */
  
  @Get(':id/download')
  @ApiOperation({ summary: 'Download a document', description: 'Streams the file from disk' })
  @ApiParam({ name: 'id', required: true, description: 'Document ID', example: '65e1234abcd56789efgh' })
  @ApiResponse({ status: 200, description: 'File stream' })
  @ApiResponse({ status: 404, description: 'Document or file not found' })  
  async download(@Param('id') id: string,@Request() req: any, @Res() res: Response) {
    const doc = await this.documentService.findById(id, req.user);
    if (!doc?.filePath) throw new NotFoundException();

    try { await fs.access(doc.filePath); } catch { throw new NotFoundException(); }

    res.setHeader('Content-Type', doc.mimeType || 'application/octet-stream');
    res.setHeader('Content-Disposition', `attachment; filename="${doc.originalName || 'file'}"`);
    createReadStream(doc.filePath).pipe(res);
  }


  /**
   * @swagger
   * /documents/bulk/find:
   *   post:
   *     summary: Find documents by IDs
   *     description: Returns documents for the given list of IDs
   */
  @Post('bulk/find')
  @ApiOperation({ summary: 'Find documents by IDs', description: 'Bulk fetch by IDs' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: { ids: { type: 'array', items: { type: 'string' } } },
      required: ['ids'],
    },
  })
  async findByIds(@Body('ids') ids: string[]) {
    return this.documentService.findByIds(ids);
  }

  /**
   * @swagger
   * /documents/ingested:
   *   patch:
   *     summary: Mark documents as ingested
   *     description: Sets isIngested = true for given IDs
   */
  @Patch('ingested')
  @ApiOperation({ summary: 'Mark as ingested', description: 'Marks provided documents as ingested' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: { ids: { type: 'array', items: { type: 'string' } } },
      required: ['ids'],
    },
  })
  async markAsIngested(@Body('ids') ids: string[]) {
    await this.documentService.markAsIngested(ids);
    return { message: 'Marked as ingested' };
  }

  // -------- TCP (Microservice) endpoints to mirror service signatures --------

  @MessagePattern({ cmd: 'get_document_by_id' })
  async findByIdTCP(@Payload() data: { id: string; user?: any }) {
    return this.documentService.findById(data.id, data.user as any);
  }

  @MessagePattern({ cmd: 'create_document' })
  async createTCP(@Payload() data: { dto: CreateDocumentDto; user: any; file?: any }) {
    // For TCP, pass a stub file (if your transport sends file metadata) or adapt service to accept nullable file
   
    return this.documentService.create(data.dto, data.file as any, data.user);
  }

  @MessagePattern({ cmd: 'get_all_document' })
  async findAllTCP(@Payload() data:{user:any}) {
    return this.documentService.findAll(data.user);
  }

  @MessagePattern({ cmd: 'update_document' })
  async updateTCP(@Payload() data: { id: string; dto: UpdateDocumentDto; user: any }) {
    return this.documentService.update(data.id, data.dto, data.user);
  }

  @MessagePattern({ cmd: 'delete_document' })
  async deleteTCP(@Payload() data: { id: string; user: any }) {
    await this.documentService.remove(data.id, data.user);
    return { message: 'Document deleted successfully' };
  }

  @MessagePattern({ cmd: 'download_documents_by_id' })
  async downloadDocumentByIdTCP(@Payload() data: { id: string; user?: any }) {
    const doc = await this.documentService.findById(data.id, data.user);
    console.log(doc);
    if (!doc?.filePath) throw new NotFoundException('File path missing');

    try {
      const buf = await fs.readFile(doc.filePath);
      return {
        filename: doc.originalName || basename(doc.filePath),
        mimeType: doc.mimeType || 'application/octet-stream',
        size: buf.length,
        dataB64: buf.toString('base64'),
      };
    } catch {
      throw new NotFoundException('File not found on disk');
    }
  }

  @MessagePattern({ cmd: 'find_documents_by_ids' })
  async findByIdsTCP(@Payload() data: { ids: string[] }) {
    return this.documentService.findByIds(data.ids);
  }

  @MessagePattern({ cmd: 'mark_documents_ingested' })
  async markAsIngestedTCP(@Payload() data: { ids: string[] }) {
    await this.documentService.markAsIngested(data.ids);
    return { message: 'Marked as ingested' };
  }
}
