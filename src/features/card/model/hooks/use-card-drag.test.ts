import { act, renderHook } from "@testing-library/react";
import type { DragEvent } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { CardAssignee, CardMoveHandler, CardSummary } from "../types/card.types";
import { useCardDrag } from "./use-card-drag";

const card: CardSummary = {
  id: "card-1",
  projectId: "project-1",
  identifier: "MOM-12",
  type: "issue",
  title: "Lista de chamados vazia",
  state: { id: "state-1", name: "Novo", category: "to_do", position: 1 },
  priority: "high",
  assignee: null,
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
};
const ana: CardAssignee = { userId: "user-1", name: "Ana Souza" };
const onDrop = vi.fn<CardMoveHandler>();
const doing = { cardStateId: "state-2" };
const fresh = { cardStateId: "state-1" };

function dragEvent(relatedTarget: EventTarget | null = null) {
  const zone = document.createElement("ul");
  const event = {
    currentTarget: zone,
    relatedTarget,
    preventDefault: vi.fn(),
    dataTransfer: { effectAllowed: "none", dropEffect: "none", setData: vi.fn() },
  };

  return { zone, event, asDragEvent: event as unknown as DragEvent<HTMLElement> };
}

function renderDrag() {
  return renderHook(() => useCardDrag(onDrop)).result;
}

function startDragging(result: ReturnType<typeof renderDrag>) {
  const { event, asDragEvent } = dragEvent();

  act(() => result.current.sourceOf(card).onDragStart(asDragEvent));

  return event;
}

beforeEach(() => {
  onDrop.mockClear();
});

describe("useCardDrag", () => {
  it("começa a arrastar o card, levando o identificador dele", () => {
    const result = renderDrag();

    const event = startDragging(result);

    expect(result.current.draggedCardId).toBe("card-1");
    expect(event.dataTransfer.effectAllowed).toBe("move");
    expect(event.dataTransfer.setData).toHaveBeenCalledWith("text/plain", "MOM-12");
  });

  it("aceita o card sobre a coluna de outro estado e a destaca", () => {
    const result = renderDrag();
    startDragging(result);
    const { event, asDragEvent } = dragEvent();

    act(() => result.current.zoneOf("all:state-2", doing).onDragOver(asDragEvent));

    expect(event.preventDefault).toHaveBeenCalledTimes(1);
    expect(event.dataTransfer.dropEffect).toBe("move");
    expect(result.current.targetZoneId).toBe("all:state-2");
  });

  it("não aceita o card sobre a coluna do estado em que ele já está", () => {
    const result = renderDrag();
    startDragging(result);
    const { event, asDragEvent } = dragEvent();

    act(() => result.current.zoneOf("all:state-1", fresh).onDragOver(asDragEvent));

    expect(event.preventDefault).not.toHaveBeenCalled();
    expect(result.current.targetZoneId).toBeNull();
  });

  it("aceita o card sobre a raia de outro responsável, na coluna em que ele já está", () => {
    const result = renderDrag();
    startDragging(result);
    const { event, asDragEvent } = dragEvent();
    const anaLane = { ...fresh, assignee: ana };

    act(() => result.current.zoneOf("user-1:state-1", anaLane).onDrop(asDragEvent));

    expect(event.preventDefault).toHaveBeenCalledTimes(1);
    expect(onDrop).toHaveBeenCalledWith(card, anaLane);
  });

  it("não aceita o card sobre a raia e a coluna em que ele já está", () => {
    const result = renderDrag();
    startDragging(result);
    const { event, asDragEvent } = dragEvent();

    act(() =>
      result.current.zoneOf(":state-1", { ...fresh, assignee: null }).onDragOver(asDragEvent)
    );

    expect(event.preventDefault).not.toHaveBeenCalled();
    expect(result.current.targetZoneId).toBeNull();
  });

  it("não aceita o que é arrastado de fora do board", () => {
    const result = renderDrag();
    const over = dragEvent();
    const drop = dragEvent();

    act(() => result.current.zoneOf("all:state-2", doing).onDragOver(over.asDragEvent));
    act(() => result.current.zoneOf("all:state-2", doing).onDrop(drop.asDragEvent));

    expect(over.event.preventDefault).not.toHaveBeenCalled();
    expect(onDrop).not.toHaveBeenCalled();
  });

  it("solta o card no estado da coluna e para de arrastar", () => {
    const result = renderDrag();
    startDragging(result);
    const { event, asDragEvent } = dragEvent();

    act(() => result.current.zoneOf("all:state-2", doing).onDrop(asDragEvent));

    expect(event.preventDefault).toHaveBeenCalledTimes(1);
    expect(onDrop).toHaveBeenCalledWith(card, doing);
    expect(result.current.draggedCardId).toBeNull();
    expect(result.current.targetZoneId).toBeNull();
  });

  it("tira o destaque quando o card sai da coluna, mas não quando passa por cima de um cartão dela", () => {
    const result = renderDrag();
    startDragging(result);
    const zoneProps = () => result.current.zoneOf("all:state-2", doing);
    act(() => zoneProps().onDragOver(dragEvent().asDragEvent));

    const inside = dragEvent();
    const tile = inside.zone.appendChild(document.createElement("li"));
    inside.event.relatedTarget = tile;
    act(() => zoneProps().onDragLeave(inside.asDragEvent));

    expect(result.current.targetZoneId).toBe("all:state-2");

    act(() => zoneProps().onDragLeave(dragEvent(document.body).asDragEvent));

    expect(result.current.targetZoneId).toBeNull();
  });

  it("para de arrastar quando o card é solto fora de qualquer coluna", () => {
    const result = renderDrag();
    startDragging(result);

    act(() => result.current.sourceOf(card).onDragEnd());

    expect(result.current.draggedCardId).toBeNull();
    expect(onDrop).not.toHaveBeenCalled();
  });
});
