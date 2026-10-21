import { api } from "@/shared/api/client";
import type { components, paths } from "@/shared/api/generated/openapi";

type Schemas = components["schemas"];

const ORGANIZATIONS_PATH = "/api/v1/organizations" satisfies keyof paths;

export async function createOrganization(name: string): Promise<void> {
  const payload: Schemas["CreateOrganizationRequestDto"] = { name };

  await api.post(ORGANIZATIONS_PATH, payload);
}
