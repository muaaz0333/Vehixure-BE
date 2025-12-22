import { FastifyRequest, FastifyReply } from 'fastify';
import { User } from '../entities/User.js';
import Response from '../Traits/ApiResponser.js';

export const getUsers = async (req: FastifyRequest, reply: FastifyReply) => {
  try {
    const repo = req.server.db.getRepository(User);
    const users = await repo.find();
    return Response.showAll(reply, users);
  } catch (err: any) {
    console.error('❌ getUsers error:', err);
    return Response.errorResponse(reply, err.message || 'Something went wrong');
  }
};

export const getUserById = async (req: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
  try {
    const repo = req.server.db.getRepository(User);
    const user = await repo.findOneBy({ id: req.params.id });
    if (!user) return Response.errorResponse(reply, 'User not found', 404);
    return Response.successResponse(reply, {
      success: true,
      message: 'User retrieved successfully',
      data: { user },
    });
  } catch (err: any) {
    console.error('❌ getUserById error:', err);
    return Response.errorResponse(reply, err.message || 'Something went wrong');
  }
};

export const createUser = async (req: FastifyRequest, reply: FastifyReply) => {
  try {
    const repo = req.server.db.getRepository(User);
    const user = repo.create(req.body as any);
    await repo.save(user);
    return Response.successResponse(reply, user, 201);
  } catch (err: any) {
    console.error('❌ createUser error:', err);
    return Response.errorResponse(reply, err.message || 'Something went wrong');
  }
};

/**
 * Update a user (self or SUPER_ADMIN)
 */
export const updateUser = async (req: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
  try {
    const userId = (req as any).user?.id;
    if (!userId) return Response.errorResponse(reply, 'Unauthorized', 401);

    const id = req.params.id;
    console.log("Updating user with ID:", id);
    if (!id) return Response.errorResponse(reply, 'User ID is required', 400);
    const repo = req.server.db.getRepository(User);
    const targetUser = await repo.findOneBy({ id: id });
    if (!targetUser) return Response.errorResponse(reply, 'User not found', 404);

    const requestingUser = await repo.findOneBy({ id: userId });
    const isAdmin = requestingUser?.role === 'SUPER_ADMIN';
    if (userId !== id && !isAdmin) {
      return Response.errorResponse(reply, 'Forbidden', 403);
    }

    const payload = (req.body as any) || {};

    console.log("Update payload:", req.body);

    delete payload.email;
    delete payload.password;
    delete payload.id;

    if (payload.role && requestingUser?.role !== 'SUPER_ADMIN') {
      return Response.errorResponse(reply, 'Forbidden: cannot change role', 403);
    }

    const updatePayload = { ...payload };

    if (Object.keys(updatePayload).length === 0) {
      return Response.errorResponse(reply, 'No updatable fields provided', 400);
    }

    await repo.update(id, updatePayload);
    const updated = await repo.findOneBy({ id: id });
    console.log("Updated user:", updated);
    return Response.showOne(reply, {
      success: true,
      message: 'User updated successfully',
      data: {
        user: updated,
      },
    });
  } catch (err: any) {
    console.error('❌ updateUser error:', err);
    return Response.errorResponse(reply, err.message || 'Something went wrong');
  }
};
