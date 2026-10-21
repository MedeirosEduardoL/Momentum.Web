import { useEffect } from "react";

type ValueReporterProps<TValue> = {
  value: TValue;
  onReport: (value: TValue) => void;
};

export function ValueReporter<TValue>({ value, onReport }: ValueReporterProps<TValue>) {
  useEffect(() => {
    onReport(value);
  }, [value, onReport]);

  return null;
}
