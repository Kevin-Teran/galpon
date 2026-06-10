/**
 * @file User.entity.ts
 * @route /src/authentication/domain/User.entity.ts
 * @description Entidad de dominio Usuario. Encapsula las reglas de negocio
 *              relacionadas con identidad y autorización.
 * @author Kevin Mariano
 * @version 1.0.0
 * @since 1.0.0
 * @copyright Galpon
 */

import { Role, hasMinimumRole } from "@/shared/types/roles";

export interface UserProps {
  id: string;
  email: string;
  passwordHash: string;
  name: string;
  role: Role;
  organizationId: string | null;
  pushSubscription: object | null;
  createdAt: Date;
  updatedAt: Date;
}

export class UserEntity {
  readonly id: string;
  readonly email: string;
  readonly passwordHash: string;
  readonly name: string;
  readonly role: Role;
  readonly organizationId: string | null;
  readonly pushSubscription: object | null;
  readonly createdAt: Date;
  readonly updatedAt: Date;

  constructor(props: UserProps) {
    this.id = props.id;
    this.email = props.email;
    this.passwordHash = props.passwordHash;
    this.name = props.name;
    this.role = props.role;
    this.organizationId = props.organizationId;
    this.pushSubscription = props.pushSubscription;
    this.createdAt = props.createdAt;
    this.updatedAt = props.updatedAt;
  }

  isSuperAdmin(): boolean {
    return this.role === Role.SUPER_ADMIN;
  }

  canManageOrganization(organizationId: string): boolean {
    if (this.isSuperAdmin()) return true;
    return (
      hasMinimumRole(this.role, Role.ADMIN) &&
      this.organizationId === organizationId
    );
  }

  belongsTo(organizationId: string): boolean {
    return this.organizationId === organizationId;
  }

  toPublic(): Omit<UserProps, "passwordHash"> {
    const { passwordHash: _, ...rest } = this as UserProps;
    void _;
    return rest;
  }
}
