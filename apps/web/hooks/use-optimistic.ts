"use client";

import { useState, useCallback } from "react";

type UseOptimisticOptions<T> = {
  onSubmit: (data: T) => Promise<void>;
  onError?: (err: unknown) => void;
};

export function useOptimistic<T>(
  initialValue: T,
  { onSubmit, onError }: UseOptimisticOptions<T>,
) {
  const [value, setValue] = useState(initialValue);
  const [pending, setPending] = useState(false);

  const update = useCallback(
    async (next: T) => {
      const prev = value;
      setValue(next);
      setPending(true);
      try {
        await onSubmit(next);
      } catch (err) {
        setValue(prev);
        onError?.(err);
      } finally {
        setPending(false);
      }
    },
    [value, onSubmit, onError],
  );

  return { value, update, pending };
}
