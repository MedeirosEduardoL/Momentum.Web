import { describe, expect, it } from "vitest";
import type { Organization } from "../types/organization.types";
import {
  isOrganizationAdministrator,
  ORGANIZATION_ROLE_LABELS,
  ORGANIZATION_ROLE_OPTIONS,
} from "./organization-role";

const organization: Organization = {
  id: "org-1",
  name: "Lua Nova",
  role: "administrator",
  isAiEnabled: false,
};

describe("isOrganizationAdministrator", () => {
  it("reconhece o administrador da organização", () => {
    expect(isOrganizationAdministrator(organization)).toBe(true);
  });

  it("não trata o membro como administrador", () => {
    expect(isOrganizationAdministrator({ ...organization, role: "member" })).toBe(false);
  });

  it.each([null, undefined])("não dá administração a quem está sem organização (%j)", missing => {
    expect(isOrganizationAdministrator(missing)).toBe(false);
  });
});

describe("ORGANIZATION_ROLE_OPTIONS", () => {
  it("oferece os dois papéis com o rótulo do glossário, começando pelo de menor poder", () => {
    expect(ORGANIZATION_ROLE_OPTIONS).toEqual([
      { value: "member", label: "Membro" },
      { value: "administrator", label: "Administrador da organização" },
    ]);
  });

  it("usa os mesmos rótulos da lista de membros", () => {
    ORGANIZATION_ROLE_OPTIONS.forEach(option =>
      expect(option.label).toBe(ORGANIZATION_ROLE_LABELS[option.value])
    );
  });
});
