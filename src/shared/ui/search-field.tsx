import {
  useEffect,
  useRef,
  type ChangeEvent,
  type ComponentProps,
  type KeyboardEvent,
} from "react";
import { TextField } from "@/shared/ui/text-field";

type SearchFieldProps = Omit<
  ComponentProps<typeof TextField>,
  "type" | "onChange" | "onKeyDown"
> & {
  onSearch: (term: string) => void;
};

const PAUSE_BEFORE_SEARCH_MS = 300;

export function SearchField({ onSearch, ...fieldProps }: SearchFieldProps) {
  const pendingSearch = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => () => clearTimeout(pendingSearch.current), []);

  function searchAfterPause(event: ChangeEvent<HTMLInputElement>) {
    const term = event.target.value;

    clearTimeout(pendingSearch.current);
    pendingSearch.current = setTimeout(() => onSearch(term), PAUSE_BEFORE_SEARCH_MS);
  }

  function searchNowOnEnter(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key !== "Enter") {
      return;
    }

    event.preventDefault();
    clearTimeout(pendingSearch.current);
    onSearch(event.currentTarget.value);
  }

  return (
    <TextField
      type="search"
      autoComplete="off"
      onChange={searchAfterPause}
      onKeyDown={searchNowOnEnter}
      {...fieldProps}
    />
  );
}
