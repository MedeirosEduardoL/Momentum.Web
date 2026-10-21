import type { paths } from "./generated/openapi";

type PathParameter<TPath extends string> = TPath extends `${string}{${infer TName}}${infer TRest}`
  ? TName | PathParameter<TRest>
  : never;

const PLACEHOLDER_PATTERN = /\{(\w+)\}/g;

export function fillPath<TPath extends keyof paths>(
  template: TPath,
  parameters: Record<PathParameter<TPath>, string>
) {
  return template.replace(PLACEHOLDER_PATTERN, (_placeholder, name: PathParameter<TPath>) =>
    encodeURIComponent(parameters[name])
  );
}
