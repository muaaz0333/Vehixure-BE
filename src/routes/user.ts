import { getUsers, getUserById, createUser, updateUser} from '../controllers/user-controller.js';
import { FastifyInstance } from 'fastify';
import { Type } from '@sinclair/typebox';
import {
  SuccessResponse,
  ErrorResponse,
  MessageResponse,
} from '../schemas/responseSchemas.js';

const UserResponse = Type.Object({
  id: Type.String(),
  fullName: Type.String(),
  email: Type.String({ format: 'email' }),
  role: Type.Optional(Type.String()),
  dob: Type.Optional(Type.String({ format: 'date' })),
  phone: Type.Optional(Type.String()),
  isVerified: Type.Boolean(),
  isEmailVerified: Type.Boolean(),
  isPhoneVerified: Type.Boolean(),
  deviceId: Type.Optional(Type.String()),
  created: Type.String({ format: 'date-time' }),
  modified: Type.String({ format: 'date-time' }),
});

const UserCreateBody = Type.Object({
  name: Type.String(),
  email: Type.String({ format: 'email' }),
  password: Type.String({ minLength: 6 }),
});

const UserUpdateBody = Type.Object({
  fullName: Type.Optional(Type.String()),
  dob: Type.Optional(Type.String({ format: 'date' })),
  phone: Type.Optional(Type.String()),
  gender: Type.Optional(Type.String()),
  bio: Type.Optional(Type.String()),
  imageUrl: Type.Optional(Type.String({ format: 'uri' })),
});

const SaveDeviceIdBody = Type.Object({
  deviceToken: Type.String({
    description: 'Device token/ID for push notifications',
    minLength: 1
  }),
});

const FollowerResponse = Type.Object({
  id: Type.String(),
  followerId: Type.String(),
  followingId: Type.String(),
  created_at: Type.String({ format: 'date-time' }),
  created: Type.String({ format: 'date-time' }),
  modified: Type.String({ format: 'date-time' }),
  follower: Type.Optional(UserResponse),
  following: Type.Optional(UserResponse),
});

export default async function userRoutes(fastify: FastifyInstance) {
  fastify.get('/', {
    onRequest: [fastify.authenticateSuperAdmin],
    schema: {
      response: {
        200: SuccessResponse(Type.Array(UserResponse)),
        401: ErrorResponse,
        500: ErrorResponse,
      },
      tags: ['User'],
      summary: 'Get all users',
      description: 'Get a list of all registered users',
      security: [{ bearerAuth: [] }],
    },
  }, getUsers);

  fastify.get<{ Params: { id: string } }>('/:id', {
    onRequest: [fastify.authenticate],
    schema: {
      params: Type.Object({ id: Type.String({ format: 'uuid' }) }),
      response: {
        200: MessageResponse,
        401: ErrorResponse,
        404: ErrorResponse,
        500: ErrorResponse,
      },
      tags: ['User'],
      summary: 'Get user by ID',
      description: 'Get detailed information about a specific user',
      security: [{ bearerAuth: [] }],
    },
  }, getUserById);


  fastify.post('/', {
    onRequest: [fastify.authenticateSuperAdmin],
    schema: {
      body: UserCreateBody,
      response: {
        201: SuccessResponse(UserResponse),
        400: ErrorResponse,
        500: ErrorResponse,
      },
      tags: ['User'],
      summary: 'Create a new user',
      description: 'Register a new user in the system',
      security: [{ bearerAuth: [] }],
    },
  }, createUser);

  // Update user (self or super admin)
  fastify.put<{ Params: { id: string } }>('/:id', {
    onRequest: [fastify.authenticate],
    schema: {
      params: Type.Object({ id: Type.String({ format: 'uuid' }) }),
      // Accept arbitrary updatable fields (all except email/password/id are filtered server-side)
      body: Type.Partial(UserUpdateBody),
      response: {
        200: MessageResponse,
        404: ErrorResponse,
      },
      tags: ['User'],
      summary: 'Update user profile (self or SUPER_ADMIN)',
      security: [{ bearerAuth: [] }],
    },
  }, updateUser);

} 