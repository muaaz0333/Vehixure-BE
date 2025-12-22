import { ColumnType } from 'typeorm';

export const BaseEntity = {
  created: {
    type: 'timestamp' as ColumnType,
    createDate: true,
    default: () => 'CURRENT_TIMESTAMP',
  },
  modified: {
    type: 'timestamp' as ColumnType,
    updateDate: true,
    default: () => 'CURRENT_TIMESTAMP',
  },
  deletedAt: {
    type: 'timestamp' as ColumnType,
    nullable: true,
  },
}; 