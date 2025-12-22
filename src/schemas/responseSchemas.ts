import { Type, TSchema } from '@sinclair/typebox';

export const SuccessResponse = <T extends TSchema>(schema: T) =>
  Type.Object(
    {
      data: schema,
    },
    {
      additionalProperties: true, 
      description: 'Generic success response wrapper',
    }
  );

export const ErrorResponse = Type.Object(
  {
    message: Type.String(),
    code: Type.Optional(Type.Number()),
  },
  {
    additionalProperties: true, 
    description: 'Standardized error response',
  }
);

export const MessageResponse = Type.Object(
  {
    success: Type.Boolean(),
    message: Type.String(),
  },
  {
    additionalProperties: true,
    description: 'Simple success message response',
  }
);
