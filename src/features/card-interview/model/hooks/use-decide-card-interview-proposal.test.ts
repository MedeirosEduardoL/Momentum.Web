import { act, renderHook, waitFor } from "@testing-library/react";
import { toast } from "sonner";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { apiError, networkFailure } from "@/test/api-errors";
import { createQueryWrapper } from "@/test/query-wrapper";
import { decideCardInterviewProposal } from "../../api/card-interview-proposal.service";
import type { CardInterviewProposal } from "../types/card-interview.types";
import { useDecideCardInterviewProposal } from "./use-decide-card-interview-proposal";

vi.mock("../../api/card-interview.service");
vi.mock("../../api/card-interview-proposal.service");
vi.mock("sonner", () => ({ toast: { error: vi.fn(), success: vi.fn() } }));

const proposal: CardInterviewProposal = {
  id: "proposal-1",
  interviewId: "interview-1",
  status: "pending",
  summary: "Deixei explícito quem usa o filtro.",
  changes: [
    { field: "description", proposed: "O P.O filtra a lista." },
    { field: "acceptance_criteria", proposed: ["O filtro fica na URL."] },
  ],
  appliedFields: [],
  createdAt: "2026-10-13T12:10:00Z",
  decidedAt: null,
};

function renderDecision() {
  const { queryClient, wrapper } = createQueryWrapper();
  const invalidateQueries = vi.spyOn(queryClient, "invalidateQueries");
  const { result } = renderHook(() => useDecideCardInterviewProposal(proposal), { wrapper });

  return { result, invalidateQueries };
}

async function apply(
  result: ReturnType<typeof renderDecision>["result"],
  fields?: string[],
  closeInterview = false
) {
  await act(async () => {
    if (fields) {
      result.current.form.setValue("fields", fields);
    }

    await result.current.apply(closeInterview);
  });
}

beforeEach(() => {
  vi.mocked(decideCardInterviewProposal).mockReset().mockResolvedValue(proposal);
  vi.mocked(toast.error).mockClear();
  vi.mocked(toast.success).mockClear();
});

describe("useDecideCardInterviewProposal — aplicar", () => {
  it("começa com todas as mudanças da proposta escolhidas", () => {
    const { result } = renderDecision();

    expect(result.current.form.getValues("fields")).toEqual(["description", "acceptance_criteria"]);
  });

  it("aplica só as mudanças escolhidas e recarrega tudo, para a tela mostrar o card novo", async () => {
    const { result, invalidateQueries } = renderDecision();

    await apply(result, ["acceptance_criteria"]);

    expect(vi.mocked(decideCardInterviewProposal).mock.calls[0][0]).toEqual({
      proposalId: "proposal-1",
      status: "applied",
      fields: ["acceptance_criteria"],
      closeInterview: false,
    });
    expect(invalidateQueries).toHaveBeenCalledWith();
    expect(toast.success).toHaveBeenCalledWith("As mudanças escolhidas foram aplicadas ao card.");
    expect(result.current.isOutdated).toBe(false);
  });

  it("aplica e pede para encerrar a entrevista quando a pessoa escolhe encerrar", async () => {
    const { result } = renderDecision();

    await apply(result, undefined, true);

    expect(vi.mocked(decideCardInterviewProposal).mock.calls[0][0]).toMatchObject({
      status: "applied",
      closeInterview: true,
    });
  });

  it("diz qual escolha está em andamento, para só o botão dela mostrar a espera", async () => {
    let finish = () => {};
    vi.mocked(decideCardInterviewProposal).mockReturnValue(
      new Promise(resolve => {
        finish = () => resolve(proposal);
      })
    );
    const { result } = renderDecision();

    act(() => void result.current.apply(true));

    await waitFor(() => expect(result.current.pendingChoice).toBe("close"));
    expect(result.current.isDeciding).toBe(true);

    await act(async () => finish());

    await waitFor(() => expect(result.current.pendingChoice).toBeNull());
  });

  it("não aplica sem nenhuma mudança escolhida", async () => {
    const { result } = renderDecision();

    await apply(result, []);

    expect(decideCardInterviewProposal).not.toHaveBeenCalled();
    expect(result.current.form.getFieldState("fields").error?.message).toBe(
      "Escolha ao menos uma mudança para aplicar."
    );
  });

  it("avisa que o card mudou depois da proposta e passa a oferecer outra", async () => {
    const details = "O card mudou depois que a proposta foi gerada. Peça uma proposta nova.";
    vi.mocked(decideCardInterviewProposal).mockRejectedValue(
      apiError(409, "InterviewProposalOutdated", details)
    );
    const { result, invalidateQueries } = renderDecision();

    await apply(result);

    expect(result.current.isOutdated).toBe(true);
    expect(toast.error).toHaveBeenCalledWith(details);
    expect(toast.success).not.toHaveBeenCalled();
    expect(invalidateQueries).toHaveBeenCalledWith();
  });

  it.each([
    ["InterviewProposalAlreadyDecided", 409, "Esta proposta já foi aplicada ou descartada."],
    ["InterviewClosed", 422, "Esta entrevista já foi encerrada."],
    ["InterviewNotTheStarter", 403, "Só quem iniciou a entrevista responde às perguntas."],
  ])("mostra a recusa %s do Core e recarrega as propostas", async (code, status, details) => {
    vi.mocked(decideCardInterviewProposal).mockRejectedValue(apiError(status, code, details));
    const { result, invalidateQueries } = renderDecision();

    await apply(result);

    expect(toast.error).toHaveBeenCalledWith(details);
    expect(result.current.isOutdated).toBe(false);
    expect(invalidateQueries).toHaveBeenCalledTimes(1);
  });

  it("mostra na lista de mudanças a recusa do Core sobre os campos escolhidos", async () => {
    const details =
      "Escolha ao menos uma mudança da proposta para aplicar, sem repetir e só entre as que ela traz.";
    vi.mocked(decideCardInterviewProposal).mockRejectedValue(
      apiError(400, "InterviewProposalFieldsInvalid", details, { property: "fields" })
    );
    const { result } = renderDecision();

    await apply(result);

    expect(result.current.form.getFieldState("fields").error?.message).toBe(details);
    expect(toast.error).not.toHaveBeenCalled();
  });
});

describe("useDecideCardInterviewProposal — descartar", () => {
  it("descarta a proposta e confirma na tela", async () => {
    const { result, invalidateQueries } = renderDecision();

    await act(() => result.current.discard());

    expect(vi.mocked(decideCardInterviewProposal).mock.calls[0][0]).toEqual({
      proposalId: "proposal-1",
      status: "discarded",
    });
    expect(toast.success).toHaveBeenCalledWith("A proposta foi descartada.");
    expect(invalidateQueries).toHaveBeenCalledWith();
  });

  it("trata a falha de rede sem deixar o erro escapar para a tela", async () => {
    vi.mocked(decideCardInterviewProposal).mockRejectedValue(networkFailure);
    const { result } = renderDecision();

    await expect(act(() => result.current.discard())).resolves.toBeUndefined();

    expect(toast.error).toHaveBeenCalledWith(
      "Não foi possível falar com o servidor. Verifique a conexão e tente de novo."
    );
    expect(toast.success).not.toHaveBeenCalled();
  });
});
