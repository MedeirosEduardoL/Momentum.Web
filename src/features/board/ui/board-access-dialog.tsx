import { Lock, UserMinus, UserPlus, Users } from "lucide-react";
import { useState, type ReactNode } from "react";
import { Avatar } from "@/shared/ui/avatar";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import { Modal } from "@/shared/ui/modal";
import { QueryContent } from "@/shared/ui/query-content";
import { SelectField } from "@/shared/ui/select-field";
import { useBoardAccess } from "../model/hooks/use-board-access";
import type { Board, BoardVisibility } from "../model/types/board.types";

type BoardAccessDialogProps = {
  board: Board;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

const VISIBILITY_CHOICES: { value: BoardVisibility; label: string; hint: string }[] = [
  {
    value: "team",
    label: "Todo o time do projeto",
    hint: "Cada pessoa do time vê o board e as colunas dele.",
  },
  {
    value: "members",
    label: "Só as pessoas escolhidas",
    hint: "Além delas, os administradores do projeto e da organização sempre veem.",
  },
];

type PersonRowProps = {
  name: string;
  detail?: string;
  action?: ReactNode;
};

function PersonRow({ name, detail, action }: PersonRowProps) {
  return (
    <li className="flex items-center gap-3 px-3 py-2">
      <Avatar name={name} />
      <span className="min-w-0 flex-1 truncate font-medium">{name}</span>
      {detail && <Badge>{detail}</Badge>}
      {action}
    </li>
  );
}

export function BoardAccessDialog({ board, open, onOpenChange }: BoardAccessDialogProps) {
  const access = useBoardAccess(board);
  const [chosenUserId, setChosenUserId] = useState("");
  const isRestricted = board.visibility === "members";

  async function grantChosen() {
    await access.grantAccess(chosenUserId);
    setChosenUserId("");
  }

  return (
    <Modal
      open={open}
      size="lg"
      onOpenChange={onOpenChange}
      title={`Acesso ao board ${board.name}`}
      description="Quem vê este board. Os cards continuam visíveis a todo o time na lista de cards."
    >
      <fieldset className="flex flex-col gap-2" disabled={access.isBusy}>
        <legend className="mb-1 text-sm font-medium">Quem vê o board</legend>
        {VISIBILITY_CHOICES.map(choice => (
          <label
            key={choice.value}
            className="flex cursor-pointer items-start gap-3 rounded-md border border-line p-3 transition-colors duration-150 ease-out has-checked:border-accent-text has-checked:bg-surface-raised"
          >
            <input
              type="radio"
              name="board-visibility"
              value={choice.value}
              checked={board.visibility === choice.value}
              onChange={() => void access.changeVisibility(choice.value)}
              className="mt-1 size-4 accent-accent"
            />
            <span className="flex flex-col">
              <span className="font-medium">{choice.label}</span>
              <span className="text-sm text-ink-muted">{choice.hint}</span>
            </span>
          </label>
        ))}
      </fieldset>
      <QueryContent
        query={access.team}
        loadingLabel="Carregando o time"
        errorTitle="Não foi possível carregar o time"
      >
        {team =>
          isRestricted ? (
            <div className="flex flex-col gap-3">
              <h3 className="flex items-center gap-2 font-semibold">
                <Lock aria-hidden className="size-4" />
                Quem vê este board
              </h3>
              <ul aria-label="Quem vê este board" className="panel divide-y divide-line">
                {access.administrators.map(member => (
                  <PersonRow key={member.userId} name={member.name} detail="Administrador" />
                ))}
                {(access.members.data ?? []).map(member => (
                  <PersonRow
                    key={member.userId}
                    name={member.name || "Alguém que saiu do time"}
                    detail="Escolhido"
                    action={
                      <Button
                        variant="ghost"
                        size="sm"
                        disabled={access.isBusy}
                        aria-label={`Tirar o acesso de ${member.name}`}
                        onClick={() => void access.revokeAccess(member.userId)}
                      >
                        <UserMinus aria-hidden />
                        Tirar
                      </Button>
                    }
                  />
                ))}
              </ul>
              <div className="flex flex-wrap items-end gap-2">
                <SelectField
                  label="Dar acesso a"
                  className="min-w-56 flex-1"
                  options={[
                    {
                      value: "",
                      label: access.candidates.length
                        ? "Escolha alguém do time"
                        : "Todo o time já vê o board",
                    },
                    ...access.candidates.map(member => ({
                      value: member.userId,
                      label: member.name,
                    })),
                  ]}
                  value={chosenUserId}
                  disabled={access.candidates.length === 0 || access.isBusy}
                  onValueChange={setChosenUserId}
                />
                <Button
                  variant="secondary"
                  disabled={!chosenUserId}
                  isLoading={access.isBusy}
                  onClick={() => void grantChosen()}
                >
                  <UserPlus aria-hidden />
                  Dar acesso
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              <h3 className="flex items-center gap-2 font-semibold">
                <Users aria-hidden className="size-4" />
                Todo o time vê este board
              </h3>
              <ul aria-label="Quem vê este board" className="panel divide-y divide-line">
                {team.map(member => (
                  <PersonRow
                    key={member.userId}
                    name={member.name}
                    detail={member.role === "administrator" ? "Administrador" : undefined}
                  />
                ))}
              </ul>
            </div>
          )
        }
      </QueryContent>
    </Modal>
  );
}
