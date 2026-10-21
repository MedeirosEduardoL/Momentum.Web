import { act, renderHook } from "@testing-library/react";
import { toast } from "sonner";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useListFeatures, type FeatureSummary } from "@/features/feature";
import { useListProjectMembers, type ProjectMember } from "@/features/project";
import { apiError, networkFailure } from "@/test/api-errors";
import { createQueryWrapper } from "@/test/query-wrapper";
import { cardKeys } from "../../api/card-api-keys";
import { createCard } from "../../api/card.service";
import type { CardFormValues } from "../schemas/card.schema";
import type { Card, CardState } from "../types/card.types";
import { useCreateCard } from "./use-create-card";

vi.mock("../../api/card.service");
vi.mock("@/features/project", () => ({ useListProjectMembers: vi.fn() }));
vi.mock("@/features/feature", () => ({ useListFeatures: vi.fn() }));
vi.mock("sonner", () => ({ toast: { error: vi.fn() } }));

type TeamResult = ReturnType<typeof useListProjectMembers>;
type FeaturesResult = ReturnType<typeof useListFeatures>;

const PROJECT_ID = "project-1";
const states: CardState[] = [
  { id: "state-1", name: "Novo", category: "to_do", position: 1 },
  { id: "state-2", name: "Em andamento", category: "in_progress", position: 2 },
];
const validValues: CardFormValues = {
  cardType: "spike",
  title: " Avaliar SSE na entrevista ",
  description: "Precisamos decidir o transporte.",
  cardStateId: "state-2",
  priority: "high",
  assigneeId: "user-2",
  featureId: "feature-1",
  userStory: { acceptanceCriteria: [{ text: "Não vai no corpo do spike" }] },
  spike: { question: "Vale usar SSE?", deadline: "2026-10-20", conclusion: "" },
  issue: {
    stepsToReproduce: "",
    expectedBehavior: "",
    observedBehavior: "",
    severity: "",
    location: "",
  },
  techDebt: { impact: "" },
};
const createdCard: Card = {
  id: "card-9",
  projectId: PROJECT_ID,
  identifier: "MOM-9",
  type: "spike",
  title: "Avaliar SSE na entrevista",
  state: states[1],
  priority: "high",
  assignee: { userId: "user-2", name: "Bia Lima" },
  featureId: null,
  progress: 0,
  taskCount: 0,
  doneTaskCount: 0,
  subitemCounts: {
    task: { total: 0, done: 0 },
    bug: { total: 0, done: 0 },
    impediment: { total: 0, done: 0 },
  },
  isArchived: false,
  updatedAt: "2026-10-13T12:00:00Z",
  description: "Precisamos decidir o transporte.",
  fields: { type: "spike", question: "Vale usar SSE?", deadline: "2026-10-20", conclusion: "" },
  createdAt: "2026-10-13T12:00:00Z",
};
const onCreated = vi.fn();
const refetchTeam = vi.fn<TeamResult["refetch"]>();
const refetch: TeamResult["refetch"] = refetchTeam;
const team: ProjectMember[] = [];
const refetchFeatures = vi.fn<FeaturesResult["refetch"]>();
const refetchFeatureList: FeaturesResult["refetch"] = refetchFeatures;
const featureList: FeatureSummary[] = [];

function renderCreateCard() {
  const { queryClient, wrapper } = createQueryWrapper();
  const invalidateQueries = vi.spyOn(queryClient, "invalidateQueries");
  const { result } = renderHook(() => useCreateCard({ projectId: PROJECT_ID, states, onCreated }), {
    wrapper,
  });

  return { result, invalidateQueries };
}

async function submit(
  result: ReturnType<typeof renderCreateCard>["result"],
  values: CardFormValues
) {
  await act(async () => {
    result.current.form.reset(values);
    await result.current.onSubmit();
  });
}

beforeEach(() => {
  vi.mocked(createCard).mockReset().mockResolvedValue(createdCard);
  vi.mocked(toast.error).mockClear();
  onCreated.mockClear();
  refetchTeam.mockReset();
  vi.mocked(useListProjectMembers).mockReturnValue({ data: team, refetch } as TeamResult);
  refetchFeatures.mockReset();
  vi.mocked(useListFeatures).mockReturnValue({
    data: featureList,
    refetch: refetchFeatureList,
  } as FeaturesResult);
});

describe("useCreateCard", () => {
  it("começa como user story no primeiro estado do fluxo, sem responsável nem feature", () => {
    const { result } = renderCreateCard();

    expect(result.current.form.getValues()).toMatchObject({
      cardType: "user_story",
      cardStateId: "state-1",
      priority: "medium",
      assigneeId: "",
      featureId: "",
    });
  });

  it("cria o card com o título sem espaços e só o grupo do tipo escolhido, e entrega o card criado", async () => {
    const { result, invalidateQueries } = renderCreateCard();

    await submit(result, validValues);

    expect(vi.mocked(createCard).mock.calls[0][0]).toEqual({
      projectId: PROJECT_ID,
      title: "Avaliar SSE na entrevista",
      description: "Precisamos decidir o transporte.",
      cardStateId: "state-2",
      priority: "high",
      assigneeId: "user-2",
      featureId: "feature-1",
      fields: { type: "spike", question: "Vale usar SSE?", deadline: "2026-10-20", conclusion: "" },
    });
    expect(invalidateQueries).toHaveBeenCalledWith({ queryKey: cardKeys.all });
    expect(onCreated).toHaveBeenCalledWith(createdCard);
  });

  it("não chama a API quando o schema recusa o título", async () => {
    const { result } = renderCreateCard();

    await submit(result, { ...validValues, title: " " });

    expect(createCard).not.toHaveBeenCalled();
    expect(result.current.form.getFieldState("title").error?.message).toBe(
      "Informe o título do card."
    );
  });

  it.each([
    ["CardTitleTooLong", "O título do card pode ter no máximo 200 caracteres.", "title"],
    ["CardStateInvalid", "Este estado não existe no projeto do card.", "cardStateId"],
    ["CardTypeFieldTooLong", "Este campo passou do tamanho máximo.", "spike.question"],
    [
      "CardAcceptanceCriteriaInvalid",
      "Os critérios de aceite são no máximo 50, cada um com até 500 caracteres.",
      "userStory.acceptanceCriteria",
    ],
  ] as const)("põe no campo o erro %s vindo do Core", async (code, details, field) => {
    vi.mocked(createCard).mockRejectedValue(apiError(400, code, details, { property: field }));
    const { result } = renderCreateCard();

    await submit(result, validValues);

    expect(result.current.form.getFieldState(field).error?.message).toBe(details);
    expect(toast.error).not.toHaveBeenCalled();
    expect(onCreated).not.toHaveBeenCalled();
  });

  it("mostra no campo, desfaz a escolha e recarrega o time quando o responsável saiu dele", async () => {
    vi.mocked(createCard).mockRejectedValue(
      apiError(
        422,
        "CardAssigneeOutsideProject",
        "O responsável precisa fazer parte do time do projeto.",
        { property: "assigneeId" }
      )
    );
    const { result } = renderCreateCard();

    await submit(result, validValues);

    expect(result.current.form.getFieldState("assigneeId").error?.message).toBe(
      "O responsável precisa fazer parte do time do projeto."
    );
    expect(result.current.form.getValues("assigneeId")).toBe("");
    expect(refetchTeam).toHaveBeenCalledTimes(1);
    expect(onCreated).not.toHaveBeenCalled();
  });

  it("cria o card sem feature quando nenhuma foi escolhida", async () => {
    const { result } = renderCreateCard();

    await submit(result, { ...validValues, featureId: "" });

    expect(vi.mocked(createCard).mock.calls[0][0]).toMatchObject({ featureId: null });
  });

  it("mostra no campo, desfaz a escolha e recarrega as features quando a feature foi excluída", async () => {
    vi.mocked(createCard).mockRejectedValue(
      apiError(422, "CardFeatureInvalid", "Esta feature não existe no projeto do card.", {
        property: "featureId",
      })
    );
    const { result } = renderCreateCard();

    await submit(result, validValues);

    expect(result.current.form.getFieldState("featureId").error?.message).toBe(
      "Esta feature não existe no projeto do card."
    );
    expect(result.current.form.getValues("featureId")).toBe("");
    expect(refetchFeatures).toHaveBeenCalledTimes(1);
    expect(refetchTeam).not.toHaveBeenCalled();
    expect(toast.error).not.toHaveBeenCalled();
    expect(onCreated).not.toHaveBeenCalled();
  });

  it("avisa quem perdeu o acesso ao projeto, sem recarregar o time", async () => {
    vi.mocked(createCard).mockRejectedValue(
      apiError(404, "ProjectNotFound", "Projeto não encontrado.")
    );
    const { result } = renderCreateCard();

    await submit(result, validValues);

    expect(toast.error).toHaveBeenCalledWith("Projeto não encontrado.");
    expect(refetchTeam).not.toHaveBeenCalled();
    expect(refetchFeatures).not.toHaveBeenCalled();
    expect(result.current.form.getValues("assigneeId")).toBe("user-2");
  });

  it("mostra a falha de rede e mantém o que foi preenchido", async () => {
    vi.mocked(createCard).mockRejectedValue(networkFailure);
    const { result } = renderCreateCard();

    await submit(result, validValues);

    expect(toast.error).toHaveBeenCalledWith(
      "Não foi possível falar com o servidor. Verifique a conexão e tente de novo."
    );
    expect(result.current.form.getValues("spike.question")).toBe("Vale usar SSE?");
    expect(onCreated).not.toHaveBeenCalled();
  });
});
