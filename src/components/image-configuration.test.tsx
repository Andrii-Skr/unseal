// @vitest-environment jsdom

import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { HeartZoomTransition } from "@/components/heart-zoom-transition";
import { RomanticLock } from "@/components/romantic-lock";

describe("responsive image configuration", () => {
  it("caps lock image sizes on desktop", () => {
    const { container } = render(
      <RomanticLock
        lock={{
          id: 1,
          rotation: 0,
          widthPercent: 17,
          xPercent: 50,
          yPercent: 50,
        }}
        opening={false}
        visible
      />,
    );

    expect(container.querySelector("img")).toHaveAttribute(
      "sizes",
      "(max-width: 1024px) 18vw, 110px",
    );
  });

  it("uses the current Next.js eager-loading API for the late transition", () => {
    const { container } = render(<HeartZoomTransition />);

    expect(container.querySelector("img")).toHaveAttribute(
      "loading",
      "eager",
    );
  });
});
