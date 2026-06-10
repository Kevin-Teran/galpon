/**
 * @file User.entity.test.ts
 * @route /__tests__/unit/authentication/User.entity.test.ts
 * @description Tests unitarios de la entidad UserEntity.
 * @author Kevin Mariano
 * @version 1.0.0
 * @since 1.0.0
 * @copyright Galpon
 */

import { UserEntity } from "@/authentication/domain/User.entity";
import { Role } from "@/shared/types/roles";

const baseProps = {
  id: "user-1",
  email: "test@galpon.app",
  passwordHash: "$2b$12$hash",
  name: "Test User",
  organizationId: "org-1",
  pushSubscription: null,
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe("UserEntity", () => {
  it("SUPER_ADMIN puede gestionar cualquier organización", () => {
    const user = new UserEntity({ ...baseProps, role: Role.SUPER_ADMIN, organizationId: null });
    expect(user.canManageOrganization("any-org")).toBe(true);
  });

  it("ADMIN solo gestiona su propia organización", () => {
    const user = new UserEntity({ ...baseProps, role: Role.ADMIN });
    expect(user.canManageOrganization("org-1")).toBe(true);
    expect(user.canManageOrganization("org-2")).toBe(false);
  });

  it("OPERATOR no puede gestionar organizaciones", () => {
    const user = new UserEntity({ ...baseProps, role: Role.OPERATOR });
    expect(user.canManageOrganization("org-1")).toBe(false);
  });

  it("toPublic omite passwordHash", () => {
    const user = new UserEntity({ ...baseProps, role: Role.ADMIN });
    const pub = user.toPublic();
    expect("passwordHash" in pub).toBe(false);
    expect(pub.email).toBe(baseProps.email);
  });
});
