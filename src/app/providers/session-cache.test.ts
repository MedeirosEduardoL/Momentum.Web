import { QueryClient, QueryObserver } from "@tanstack/react-query";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { currentAccountQuery } from "@/features/account";
import { session } from "@/shared/api/client";
import { bindSessionToCache, sessionExpiryQuery } from "./session-cache";

vi.mock("@/shared/api/client", () => ({ session: { listen: vi.fn() } }));
vi.mock("@/features/account", () => ({
  currentAccountQuery: { queryKey: ["account", "current"] },
}));

const account = { id: "user-1", name: "Ana Souza", email: "ana@exemplo.test" };
const projectsKey = ["project", "list"];

function bind() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });

  bindSessionToCache(queryClient);

  const [listeners] = vi.mocked(session.listen).mock.calls[0];

  return { queryClient, listeners };
}

function observe(queryClient: QueryClient, queryKey: string[], queryFn: () => Promise<unknown>) {
  return new QueryObserver(queryClient, { queryKey, queryFn }).subscribe(() => undefined);
}

function hasExpired(queryClient: QueryClient) {
  return queryClient.getQueryData(sessionExpiryQuery.queryKey);
}

beforeEach(() => {
  vi.mocked(session.listen).mockReset();
});

describe("bindSessionToCache", () => {
  it("ao encerrar a sessão, marca a conta atual como ausente e apaga o resto do cache", () => {
    const { queryClient, listeners } = bind();
    queryClient.setQueryData(currentAccountQuery.queryKey, account);
    queryClient.setQueryData(projectsKey, [{ id: "project-1" }]);

    listeners.onEnded("signed-out");

    expect(queryClient.getQueryData(currentAccountQuery.queryKey)).toBeNull();
    expect(queryClient.getQueryData(projectsKey)).toBeUndefined();
  });

  it("registra que a sessão expirou quando ela é recusada no meio do uso", () => {
    const { queryClient, listeners } = bind();
    queryClient.setQueryData(currentAccountQuery.queryKey, account);
    queryClient.setQueryData(projectsKey, [{ id: "project-1" }]);

    listeners.onEnded("expired");

    expect(hasExpired(queryClient)).toBe(true);
    expect(queryClient.getQueryData(currentAccountQuery.queryKey)).toBeNull();
    expect(queryClient.getQueryData(projectsKey)).toBeUndefined();
  });

  it("não registra expiração quando a pessoa sai por conta própria", () => {
    const { queryClient, listeners } = bind();
    queryClient.setQueryData(currentAccountQuery.queryKey, account);

    listeners.onEnded("signed-out");

    expect(hasExpired(queryClient)).toBe(false);
  });

  it.each([undefined, null])(
    "não registra expiração para o visitante, que não tinha conta no cache (%j)",
    cachedAccount => {
      const { queryClient, listeners } = bind();
      queryClient.setQueryData(currentAccountQuery.queryKey, cachedAccount);

      listeners.onEnded("expired");

      expect(hasExpired(queryClient)).toBe(false);
    }
  );

  it("esquece a expiração quando a pessoa sai depois de entrar de novo", () => {
    const { queryClient, listeners } = bind();
    queryClient.setQueryData(currentAccountQuery.queryKey, account);
    listeners.onEnded("expired");
    queryClient.setQueryData(currentAccountQuery.queryKey, account);

    listeners.onEnded("signed-out");

    expect(hasExpired(queryClient)).toBe(false);
  });

  it("ao abrir a sessão, descarta o que estava parado e refaz o que está em uso", async () => {
    const { queryClient, listeners } = bind();
    const getCurrentAccount = vi.fn().mockResolvedValueOnce(null).mockResolvedValue(account);
    const unsubscribe = observe(queryClient, [...currentAccountQuery.queryKey], getCurrentAccount);
    queryClient.setQueryData(projectsKey, []);
    await vi.waitFor(() =>
      expect(queryClient.getQueryData(currentAccountQuery.queryKey)).toBeNull()
    );

    await listeners.onOpened();

    expect(queryClient.getQueryData(currentAccountQuery.queryKey)).toEqual(account);
    expect(queryClient.getQueryCache().find({ queryKey: projectsKey })).toBeUndefined();
    unsubscribe();
  });

  it("ao abrir a sessão, esquece a expiração que o guard ainda observa", async () => {
    const { queryClient, listeners } = bind();
    queryClient.setQueryData(currentAccountQuery.queryKey, account);
    listeners.onEnded("expired");
    const unsubscribe = new QueryObserver(queryClient, sessionExpiryQuery).subscribe(
      () => undefined
    );

    await listeners.onOpened();

    expect(hasExpired(queryClient)).toBe(false);
    unsubscribe();
  });
});
