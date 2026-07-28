// @vitest-environment jsdom

import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { HeartZoomTransition } from "@/components/heart-zoom-transition";
import { InsideHeartScene } from "@/components/inside-heart-scene";
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

  it("sizes fixed inside-scene layers with the dynamic viewport", () => {
    const { container, getByTestId, unmount } = render(
      <InsideHeartScene />,
    );
    const backdrop = getByTestId("inside-heart-backdrop");
    const section = container.querySelector("section");

    expect(backdrop).toHaveClass("fixed", "inset-0");
    expect(section).not.toContainElement(backdrop);
    expect(getByTestId("inside-heart-vignette")).toHaveClass(
      "absolute",
      "inset-0",
    );
    expect(document.documentElement).toHaveClass("inside-heart-active");
    expect(document.body).toHaveClass("inside-heart-active");

    unmount();

    expect(document.documentElement).not.toHaveClass(
      "inside-heart-active",
    );
    expect(document.body).not.toHaveClass("inside-heart-active");
  });
});
