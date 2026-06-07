import { type ReactElement } from "react";
import { render, type RenderOptions } from "@testing-library/react";
import { vi } from "vitest";

function AllProviders({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

function customRender(
  ui: ReactElement,
  options?: Omit<RenderOptions, "wrapper">,
) {
  return render(ui, { wrapper: AllProviders, ...options });
}

export * from "@testing-library/react";
export { customRender as render };
export { vi };

export function createMockFile(
  name = "test.png",
  type = "image/png",
  size = 1024,
): File {
  const blob = new Blob(["a".repeat(size)], { type });
  return new File([blob], name, { type });
}
