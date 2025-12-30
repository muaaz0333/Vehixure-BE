import { Type } from "@sinclair/typebox";
export const SuccessResponse = (schema) => Type.Object(
  {
    data: schema
  },
  {
    additionalProperties: true,
    description: "Generic success response wrapper"
  }
);
export const PaginatedResponse = (schema) => Type.Object(
  {
    success: Type.Boolean(),
    message: Type.String(),
    data: Type.Array(schema),
    pagination: Type.Object({
      page: Type.Number(),
      limit: Type.Number(),
      total: Type.Number(),
      totalPages: Type.Number()
    })
  },
  {
    additionalProperties: true,
    description: "Paginated response with metadata"
  }
);
export const DataResponse = (schema) => Type.Object(
  {
    success: Type.Boolean(),
    message: Type.String(),
    data: Type.Array(schema)
  },
  {
    additionalProperties: true,
    description: "Response with success, message and data array"
  }
);
export const ErrorResponse = Type.Object(
  {
    message: Type.String(),
    code: Type.Optional(Type.Number())
  },
  {
    additionalProperties: true,
    description: "Standardized error response"
  }
);
export const MessageResponse = Type.Object(
  {
    success: Type.Boolean(),
    message: Type.String()
  },
  {
    additionalProperties: true,
    description: "Simple success message response"
  }
);
