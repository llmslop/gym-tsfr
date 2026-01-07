import { createAccessControl } from "better-auth/plugins/access";
import { defaultStatements, adminAc } from "better-auth/plugins/admin/access";

export const statement = {
  ...defaultStatements,
  events: ["create", "read", "read:own"],
  rooms: ["create", "read", "update", "delete"],
  equipments: ["create", "read", "update", "delete"],
  feedbacks: ["create", "read"],
  trainers: ["create", "read", "update", "delete"],
  staff: ["create", "read", "update", "delete"],
} as const;

export const ac = createAccessControl(statement);

export const admin = ac.newRole({
  events: ["create", "read", "read:own"],
  rooms: ["create", "read", "update", "delete"],
  equipments: ["create", "read", "update", "delete"],
  feedbacks: ["create", "read"],
  trainers: ["create", "read", "update", "delete"],
  staff: ["create", "read", "update", "delete"],
  ...adminAc.statements,
});

export const staff = ac.newRole({
  events: ["create", "read:own"],
  rooms: ["create", "read", "update", "delete"],
  equipments: ["create", "read", "update", "delete"],
  feedbacks: ["create", "read"],
  trainers: ["create", "read", "update"],
  staff: ["read"],
});

export const coach = ac.newRole({
  events: ["read:own"],
  rooms: ["read"],
  equipments: ["read"],
  trainers: ["create", "read", "update"],
  feedbacks: ["create", "read"],
});

export const user = ac.newRole({
  events: ["read:own"],
  rooms: ["read"],
  equipments: ["read"],
  trainers: ["read"],
  feedbacks: ["create", "read"],
});

export const guest = ac.newRole({
  events: [],
  rooms: ["read"],
  equipments: ["read"],
  trainers: ["read"],
  feedbacks: ["read"],
});
