import { api } from "./client";

export async function putOrDelete(path: string, payload: object | null) {
  if (payload === null) {
    await api.delete(path);
    return;
  }

  await api.put(path, payload);
}
