export const BaseEntity = {
  created: {
    type: "timestamp",
    createDate: true,
    default: () => "CURRENT_TIMESTAMP"
  },
  modified: {
    type: "timestamp",
    updateDate: true,
    default: () => "CURRENT_TIMESTAMP"
  },
  deletedAt: {
    type: "timestamp",
    nullable: true
  }
};
