import { API_BASE_URL } from "./api-base-url";
import { fromResponse, networkFailure } from "./api-error";
import { REQUESTED_WITH_HEADER, session } from "./client";

const UNAUTHORIZED = 401;
const EVENT_SEPARATOR = /\r\n\r\n|\n\n|\r\r/;
const LINE_SEPARATOR = /\r\n|\n|\r/;
const FIELD_SEPARATOR = ":";
const DEFAULT_EVENT = "message";

export type ServerSentEvent = {
  event: string;
  data: string;
};

function readField(line: string) {
  const separatorAt = line.indexOf(FIELD_SEPARATOR);

  if (separatorAt === -1) {
    return { name: line, value: "" };
  }

  return { name: line.slice(0, separatorAt), value: line.slice(separatorAt + 1).replace(/^ /, "") };
}

function eventsIn(block: string): ServerSentEvent[] {
  const fields = block.split(LINE_SEPARATOR).map(readField);
  const valuesOf = (name: string) =>
    fields.filter(field => field.name === name).map(field => field.value);
  const data = valuesOf("data");

  return data.length > 0
    ? [{ event: valuesOf("event").at(-1) || DEFAULT_EVENT, data: data.join("\n") }]
    : [];
}

function close(reader: ReadableStreamDefaultReader<Uint8Array>) {
  return reader.cancel().catch(() => undefined);
}

async function* readServerSentEvents(body: ReadableStream<Uint8Array>) {
  const reader = body.getReader();
  const decoder = new TextDecoder();
  let unfinished = "";

  try {
    let chunk = await reader.read();

    while (!chunk.done) {
      const blocks = (unfinished + decoder.decode(chunk.value, { stream: true })).split(
        EVENT_SEPARATOR
      );

      unfinished = blocks.pop() ?? "";
      yield* blocks.flatMap(eventsIn);
      chunk = await reader.read();
    }
  } finally {
    await close(reader);
  }
}

function send(path: string, payload: object, signal: AbortSignal) {
  return fetch(`${API_BASE_URL}${path}`, {
    method: "POST",
    credentials: "include",
    headers: {
      Accept: "text/event-stream",
      "Content-Type": "application/json",
      ...REQUESTED_WITH_HEADER,
    },
    body: JSON.stringify(payload),
    signal,
  });
}

async function toFailure(response: Response) {
  return fromResponse(response.status, await response.json().catch(() => null));
}

async function open(path: string, payload: object, signal: AbortSignal) {
  const response = await send(path, payload, signal);

  if (response.status !== UNAUTHORIZED) {
    return response;
  }

  await session.renewAfter(await toFailure(response));

  return send(path, payload, signal);
}

export async function* postEventStream(
  path: string,
  payload: object,
  signal: AbortSignal
): AsyncGenerator<ServerSentEvent> {
  try {
    const response = await open(path, payload, signal);

    if (!response.ok || !response.body) {
      throw await toFailure(response);
    }

    yield* readServerSentEvents(response.body);
  } catch (error) {
    throw error instanceof TypeError ? networkFailure() : error;
  }
}
