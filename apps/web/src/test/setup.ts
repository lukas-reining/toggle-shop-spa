import "@testing-library/jest-dom";
import { vi } from "vitest";

// Stub the animation library which doesn't run in jsdom.
vi.mock("@formkit/auto-animate/react", () => ({
  useAutoAnimate: () => [null],
}));
