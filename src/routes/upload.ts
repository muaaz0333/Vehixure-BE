import { FastifyInstance } from 'fastify';
import { imageUpload } from '../controllers/upload-controller.js';
import {
    ErrorResponse,
    MessageResponse,
} from '../schemas/responseSchemas.js';


export default async function uploadRoutes(fastify: FastifyInstance) {
    const base = '/';

    fastify.post(base, {
        schema: {
            consumes: ['multipart/form-data'],
            response: {
                200: MessageResponse,
                400: ErrorResponse,
                401: ErrorResponse,
                500: ErrorResponse,
            },
            tags: ['Upload'],
            summary: 'Upload a single file (attachments)',
            description: 'Uploads a single file into memory for processing',
        },
    }, imageUpload);

}
