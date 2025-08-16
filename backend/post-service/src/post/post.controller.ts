import { Controller, Get, Post, Put, Delete, Param, Body } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiBody } from '@nestjs/swagger';
import { PostService } from './post.service';
import { MessagePattern, Payload } from '@nestjs/microservices';

/**
 * @swagger
 * tags:
 *   name: Posts
 *   description: API for managing posts
 */
@ApiTags('Posts')
@Controller('posts')
export class PostController {
    constructor(private readonly postService: PostService) { }


    /**
     * @swagger
     * /posts:
     *   get:
     *     summary: Get all posts
     *     description: Returns a list of all posts
     */
    @Get()
    @ApiOperation({ summary: 'Get all posts', description: 'Returns a list of all posts' })
    @ApiResponse({ status: 200, description: 'List of posts' })
    async findAll() {
        return this.postService.findAll();
    }

    /**
     * @swagger
     * /posts/{id}:
     *   get:
     *     summary: Get a post by ID
     *     description: Returns a single post by its ID
     */
    @Get(':id')
    @ApiOperation({ summary: 'Get post by ID', description: 'Returns a single post by its ID' })
    @ApiParam({ name: 'id', required: true, description: 'Post ID', example: '65e1234abcd56789efgh' })
    @ApiResponse({ status: 200, description: 'Post found' })
    @ApiResponse({ status: 404, description: 'Post not found' })
    async findById(@Param('id') id: string) {
        console.log('Received HTTP request for post ID:', id);
        return this.postService.findById(id);
    }

    @MessagePattern({ cmd: 'get_post_by_id' })
    async findByIdTCP(@Payload('id') data: any) {
        console.log('Received TCP request for GET ID:', JSON.stringify(data));
        return this.postService.findById(data);
    }

    @MessagePattern( { cmd: 'create_post' })
    async createPostTCP(@Payload() data: any) {
        console.log('Received TCP request for post ID:', JSON.stringify(data));
        return this.postService.create(data.title, data.description, data.id);
    }

    @MessagePattern( { cmd: 'get_all_post' })
    async findAllTCP() {
        return this.postService.findAll();
    }

    @MessagePattern( { cmd: 'update_post' })
    async updatePostTCP(@Payload() data: any) {
        console.log('Received TCP request for update post:', JSON.stringify(data));
        let val = data.data;
        return this.postService.update(val.id,val.title, val.description);
    }
 

    /**
     * @swagger
     * /posts/{id}:
     *   delete:
     *     summary: Delete a post
     *     description: Deletes a post by its ID
     */
    @Delete(':id')
    @ApiOperation({ summary: 'Delete a post', description: 'Deletes a post by its ID' })
    @ApiParam({ name: 'id', required: true, description: 'Post ID', example: '65e1234abcd56789efgh' })
    @ApiResponse({ status: 200, description: 'Post deleted successfully' })
    @ApiResponse({ status: 404, description: 'Post not found' })
    async delete(@Param('id') id: string) {
        return this.postService.delete(id);
    }
}
