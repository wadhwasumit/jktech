import { Controller, Get, Post, Patch, Body, Param, Inject, UseGuards, Request, Res, Put,Delete,UploadedFile,UseInterceptors, NotFoundException } from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiParam, ApiResponse,ApiConsumes } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { TcpClientService } from './tcp-client.service';
import { AuthGuard } from './guard/auth.guard';
import { RolesGuard } from './guard/roles.guard';
import { FileInterceptor } from '@nestjs/platform-express';
import { firstValueFrom } from 'rxjs';
import { StreamableFile } from '@nestjs/common';
import { Response } from 'express';
import { Roles } from './guard/roles.decorator';
@Controller()
export class AppController {
  constructor(
    private readonly tcpClientService: TcpClientService
  ) {

  }

  // get_auth_token
  @Post('auth/google')
  @Throttle({ default: { limit: 2, ttl: 50 } })
  async googleLogin(@Body('code') code: string) {
    return this.tcpClientService.sendAuthReq({ cmd: 'get_auth_token' }, { code });
  }

  /**
 * @swagger
 * /users:
 *   user:
 *     summary: Create a new user
 *     description: Adds a new user to the database
 */
  

  @Throttle({ "limit": { limit: 5, ttl: 60 } })
  @Get('users') 
  @Roles('admin') // Only allow ADMIN role
  @UseGuards(RolesGuard)
  @UseGuards(AuthGuard) 
  @ApiBearerAuth()
  getAllUsers() {
    return this.tcpClientService.sendAuthReq({ cmd: 'get_all_users' }, {});
  }
  
  @Get('users/:id')
  @Roles('admin') // Only allow ADMIN role
  @UseGuards(RolesGuard)
  @UseGuards(AuthGuard) 
  @ApiBearerAuth()
  @Throttle({ default: { limit: 2, ttl: 50 } })
  getUserById(@Param('id') id: string) {
    console.log('Sending request to GET User Service for ID:', id);
    return this.tcpClientService.sendAuthReq({ cmd: 'get_user_by_id' }, { id });
  }

  /**
   * @swagger
   * /users/{id}:
   *   put:
   *     summary: Update a user
   *     description: Updates an existing user by its ID
   */
  @Put('users/role')
  @Roles('admin') // Only allow ADMIN role
  @UseGuards(RolesGuard)
  @UseGuards(AuthGuard) 
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update a user role', description: 'Updates an existing user role' })
  // @ApiParam({ name: 'id', required: true, description: 'User ID', example: '65e1234abcd56789efgh' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        id: {  type: 'string', example: '6cacf990-2aa3-43df-ad85-1ed5c9fac25a'  },
        role: { type: 'string', example: '"admin","editor","viewer"' },
      },
      required: ['id', 'role'],
    },
  })
  @ApiResponse({ status: 200, description: 'User Role updated successfully' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async updateUserRole(@Body() body: { id: string; role: string }) {
    console.log('update payload', body)
    return this.tcpClientService.sendAuthReq({ cmd: 'update_user_role' }, { id: body.id, role: body.role });
  }

  @Delete('users/:id')
  @Roles('admin') // Only allow ADMIN role
  @UseGuards(RolesGuard)
  @UseGuards(AuthGuard) 
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete a user', description: 'Deletes a user by its ID' })
  @ApiParam({ name: 'id', required: true, description: 'User ID', example: '65e1234abcd56789efgh' })
  @ApiResponse({ status: 200, description: 'User deleted successfully' })
  @ApiResponse({ status: 404, description: 'User not found' })
  removeUser(@Param('id') id: string) {
    console.log('Sending request to Delete User Service for ID:', id);
    return this.tcpClientService.sendAuthReq({ cmd: 'remove_user' }, { id });
  }

   /**
   * @swagger
   * /documents:
   *   post:
   *     summary: Upload & create a document
   *     description: Creates a document record with uploaded file and metadata
   */
  @Throttle({ limit: { limit: 5, ttl: 60 } })
  @Post('documents')
  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  @UseInterceptors(FileInterceptor('file')) // memory storage; forwards file buffer + metadata
  @ApiOperation({ summary: 'Create a new document', description: 'Creates a document with file upload' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        title: { type: 'string', example: 'My First document' },
        description: { type: 'string', example: 'This is a test description' },
        file: { type: 'string', format: 'binary' },
      },
      required: ['title', 'file'],
    },
  })
  @ApiResponse({ status: 201, description: 'Document created successfully' })
  createDocument(
    @Request() req: any,
    @Body() body: { title: string; description?: string },
    @UploadedFile() file: Express.Multer.File,
  ) {
    // Aligns with microservice controller expecting { dto, user, file }
    const dto = { title: body.title, description: body.description ?? '' };
    console.log('Sending request to Document Service for body:', JSON.stringify(dto));
    return this.tcpClientService.sendDocumentReq(
      { cmd: 'create_document' },
      { dto, user: req.user, file: file ? { ...file, buffer: file.buffer } : null },
    );
  }

  /**
   * @swagger
   * /documents:
   *   get:
   *     summary: Get all documents
   *     description: Admin gets all, others get their own
   */
  @Throttle({ limit: { limit: 5, ttl: 60 } })
  @Get('documents')
  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all documents', description: 'Returns a list of documents based on role' })
  getAllDocuments(@Request() req: any) {
    console.log('Sending request to GET Document Service for user:', JSON.stringify(req.user));
    return this.tcpClientService.sendDocumentReq({ cmd: 'get_all_document' }, { user: req.user });
  }

  /**
   * @swagger
   * /documents/{id}:
   *   get:
   *     summary: Get a document by ID
   *     description: Returns a single document by its ID
   */
  @Get('documents/:id')
  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  @Throttle({ default: { limit: 2, ttl: 50 } })
  @ApiParam({ name: 'id', required: true, description: 'Document ID', example: '65e1234abcd56789efgh' })
  getDocumentById(@Request() req: any, @Param('id') id: string) {
    console.log('Sending request to GET Document Service for ID:', id);
    // Pass user for service-level authorization checks
    return this.tcpClientService.sendDocumentReq({ cmd: 'get_document_by_id' }, { id, user: req.user });
  }

  /**
   * @swagger
   * /documents/{id}:
   *   put:
   *     summary: Update a document
   *     description: Updates an existing document by its ID
   */
  @Put('documents/:id')
  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update a document', description: 'Updates an existing document' })
  @ApiParam({ name: 'id', required: true, description: 'Document ID', example: '65e1234abcd56789efgh' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        title: { type: 'string', example: 'Updated Title' },
        description: { type: 'string', example: 'Updated Description' },
      },
    },
  })
  @ApiResponse({ status: 200, description: 'Document updated successfully' })
  @ApiResponse({ status: 404, description: 'Document not found' })
  async updateDocument(
    @Request() req: any,
    @Param('id') id: string,
    @Body() body: { title?: string; description?: string },
  ) {
    const dto = { title: body?.title, description: body?.description };
    const data = { id, dto, user: req.user };
    console.log('update payload', data);
    return this.tcpClientService.sendDocumentReq({ cmd: 'update_document' }, data);
  }

  /**
   * @swagger
   * /documents/{id}:
   *   delete:
   *     summary: Delete a document
   *     description: Deletes a document by its ID
   */
  @Delete('documents/:id')
  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete a document', description: 'Deletes a document by its ID' })
  @ApiParam({ name: 'id', required: true, description: 'Document ID', example: '65e1234abcd56789efgh' })
  @ApiResponse({ status: 200, description: 'Document deleted successfully' })
  @ApiResponse({ status: 404, description: 'Document not found' })
  async deleteDocument(@Request() req: any, @Param('id') id: string) {
    return this.tcpClientService.sendDocumentReq({ cmd: 'delete_document' }, { id, user: req.user });
  }

  /**
   * @swagger
   * /documents/bulk/find:
   *   post:
   *     summary: Find documents by IDs
   *     description: Returns documents for the given list of IDs
   */
  @Post('documents/bulk/find')
  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Find documents by IDs', description: 'Bulk fetch documents by their IDs' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: { ids: { type: 'array', items: { type: 'string' } } },
      required: ['ids'],
    },
  })
  findDocumentsByIds(@Body('ids') ids: string[]) {
    return this.tcpClientService.sendDocumentReq({ cmd: 'find_documents_by_ids' }, { ids });
  }

  /**
   * @swagger
   * /documents/{id}/download:
   *   get:
   *     summary: Download a document file
   *     description: Streams the document binary to the client
   */
  @Throttle({ limit: { limit: 5, ttl: 60 } })
  @Get('documents/:id/download')
  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Download a document', description: 'Streams the file from disk' })
  @ApiParam({ name: 'id', required: true, description: 'Document ID', example: '65e1234abcd56789efgh' })
  @ApiResponse({ status: 200, description: 'File stream' })
  @ApiResponse({ status: 404, description: 'Document or file not found' })
  async downloadDocument(
    @Request() req: any,
    @Param('id') id: string,
    @Res({ passthrough: true }) res: Response,
  ): Promise<StreamableFile> {
    const payload = await firstValueFrom(
     await this.tcpClientService.sendDocumentReq({ cmd: 'download_documents_by_id'}, { id, user: req.user }),
    );
    if (!payload?.dataB64) throw new NotFoundException('File not available');

    const buffer = Buffer.from(payload.dataB64, 'base64');
    res.set({
      'Content-Type': payload.mimeType || 'application/octet-stream',
      'Content-Disposition':
        `attachment; filename="${payload.filename || 'file'}"`,
      'Content-Length': String(buffer.length),
    });
    return new StreamableFile(buffer);
  }

  

  /**
   * @swagger
   * /documents/ingested:
   *   patch:
   *     summary: Mark documents as ingested
   *     description: Sets isIngested = true for given IDs
   */
  @Patch('documents/ingested')
  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Mark documents as ingested', description: 'Marks provided documents as ingested' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: { ids: { type: 'array', items: { type: 'string' } } },
      required: ['ids'],
    },
  })
  async markDocumentsIngested(@Body('ids') ids: string[]) {
    return this.tcpClientService.sendDocumentReq({ cmd: 'mark_documents_ingested' }, { ids });
  }
}