"use client";

import { useEffect, useRef } from "react";

/**
 * After a failed submit, move keyboard/screen-reader focus to the first invalid field so its
 * error message is read out. Pass the action state; the effect runs each time it changes.
 */
export function useFocusFirstError(state: unknown) {
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    formRef.current?.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus();
  }, [state]);

  return formRef;
}
