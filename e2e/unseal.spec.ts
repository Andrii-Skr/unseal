import { expect, test } from "@playwright/test";
import jsQR from "jsqr";
import { PNG } from "pngjs";

test.beforeEach(async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
});

test("creates and opens the full five-lock story", async ({ page }, testInfo) => {
  const reducedMotionWarnings: string[] = [];
  page.on("console", (message) => {
    if (message.text().includes("You have Reduced Motion enabled")) {
      reducedMotionWarnings.push(message.text());
    }
  });

  await page.goto("/create");
  await expect(
    page.getByRole("heading", { level: 1, name: "Unseal" }),
  ).toBeVisible();
  await expect(page.getByRole("heading", { name: "Для кого эта история" })).toBeVisible();

  await page.getByRole("button", { name: "Создать личную ссылку" }).click();
  await expect(page.getByText("Открытка запечатана")).toBeVisible();

  const cardLink = page.getByRole("link", { name: "Открыть открытку" });
  await expect(cardLink).toHaveAttribute("href", /\/card\/[A-Za-z0-9_-]{43}$/);
  const cardUrl = await cardLink.getAttribute("href");
  const qrPng = PNG.sync.read(
    await page.getByRole("img", { name: "QR-код открытки" }).screenshot(),
  );
  const decodedQr = jsQR(
    new Uint8ClampedArray(qrPng.data),
    qrPng.width,
    qrPng.height,
  );
  expect(decodedQr?.data).toBe(cardUrl);

  await cardLink.click();

  const buttons = [
    "Открыть первый замок",
    "Продолжить",
    "Ещё один замок",
    "Стать немного ближе",
    "Открыть сердце",
  ];

  for (const label of buttons.slice(0, -1)) {
    await page.getByRole("button", { name: label }).click();
  }

  await page.getByRole("button", { name: buttons.at(-1)! }).click();
  const bridgePhrase = page
    .getByRole("main")
    .getByText(
      "Теперь можно заглянуть туда, где всё это время жили мои чувства",
    );
  await expect(bridgePhrase).toBeVisible();
  await page.waitForTimeout(1200);
  await expect(bridgePhrase).toBeVisible();
  await page
    .getByRole("button", { name: "Заглянуть внутрь сердца" })
    .click();

  const insidePhrase = page
    .locator("section")
    .getByText("Теперь ты внутри");
  await expect(insidePhrase).toBeVisible({ timeout: 5_000 });
  await page.waitForTimeout(1400);
  await expect(insidePhrase).toBeVisible();

  await expect(
    page.getByText(
      "Теперь между тобой и моими чувствами не осталось ни одного замка",
    ).first(),
  ).toBeVisible({ timeout: 10_000 });
  await expect(
    page.getByText("Здесь нет подарков и драгоценностей."),
  ).toHaveCount(0);
  const messageFontFamilies = await page
    .locator("[data-message-block]")
    .evaluateAll((blocks) =>
      blocks.map((block) => getComputedStyle(block).fontFamily),
    );
  const proseFontSize = await page
    .locator("[data-message-block='1']")
    .evaluate((block) =>
      Number.parseFloat(getComputedStyle(block).fontSize),
    );
  expect(new Set(messageFontFamilies).size).toBe(1);
  expect(proseFontSize).toBeGreaterThanOrEqual(18.5);

  if (testInfo.project.name.includes("mobile")) {
    const panel = page.getByTestId("final-message-panel");
    const panelBounds = await panel.boundingBox();
    const viewport = page.viewportSize();
    const firstPoem = page
      .locator("[data-poem-block='true']")
      .first();
    const poemFits = await firstPoem.evaluate(
      (element) => element.scrollWidth <= element.clientWidth,
    );
    const poemFontSize = await firstPoem.evaluate((element) =>
      Number.parseFloat(getComputedStyle(element).fontSize),
    );
    const poemLinesStayIntact = await page
      .locator("[data-poem-line]")
      .evaluateAll((lines) =>
        lines.every((line) => {
          const lineHeight = Number.parseFloat(
            getComputedStyle(line).lineHeight,
          );
          return (
            line.scrollWidth <= line.clientWidth &&
            line.getBoundingClientRect().height <= lineHeight * 1.2
          );
        }),
      );

    expect(panelBounds).not.toBeNull();
    expect(viewport).not.toBeNull();
    expect(panelBounds!.y).toBeGreaterThanOrEqual(40);
    expect(panelBounds!.y).toBeLessThanOrEqual(72);
    expect(poemFits).toBe(true);
    expect(poemFontSize).toBeGreaterThanOrEqual(16);
    expect(poemLinesStayIntact).toBe(true);
  }

  const saveButton = page.getByRole("button", {
    name: "Сохранить воспоминание",
  });
  await expect(saveButton).toBeEnabled({ timeout: 12_000 });
  const [download] = await Promise.all([
    page.waitForEvent("download"),
    saveButton.click(),
  ]);
  await expect(
    page.getByRole("status").getByText("Изображение сохранено в загрузки."),
  ).toBeVisible();
  const downloadStream = await download.createReadStream();
  const chunks: Buffer[] = [];
  for await (const chunk of downloadStream) {
    chunks.push(Buffer.from(chunk));
  }
  const keepsake = PNG.sync.read(Buffer.concat(chunks));
  expect({ width: keepsake.width, height: keepsake.height }).toEqual({
    width: 1080,
    height: 1350,
  });
  let opaquePixels = 0;
  for (let index = 3; index < keepsake.data.length; index += 4) {
    if (keepsake.data[index] > 0) opaquePixels += 1;
  }
  expect(opaquePixels).toBeGreaterThan(
    keepsake.width * keepsake.height * 0.95,
  );
  await expect(
    page.getByRole("link", { name: "Ответить отправителю" }),
  ).toHaveCount(0);

  await page
    .getByRole("button", { name: "Пережить этот момент ещё раз" })
    .click();
  await expect(
    page.getByRole("button", { name: "Открыть первый замок" }),
  ).toBeVisible();
  expect(reducedMotionWarnings).toEqual([]);
});

test("mobile creator opens the live preview sheet", async ({ page }, testInfo) => {
  test.skip(!testInfo.project.name.includes("mobile"));
  await page.setViewportSize({ width: 390, height: 650 });
  await page.goto("/create");
  await page.getByRole("button", { name: "Открыть живой предпросмотр" }).click();
  const preview = page.getByRole("dialog", {
    name: "Предпросмотр открытки",
  });
  await expect(preview).toBeVisible();
  const finalStageButton = page.getByRole("button", { name: "Финал" });
  await expect(finalStageButton).toBeVisible();
  await finalStageButton.click();
  await expect(
    preview.locator("[data-poem-block='true']").first(),
  ).toBeVisible();
  await expect(
    preview.getByAltText(
      "Силуэт человека в худи смотрит на тёплый свет вдали",
    ),
  ).toHaveAttribute("sizes", "(min-width: 1024px) 45vw, 100vw");
  await page.waitForTimeout(250);
  const bounds = await preview.boundingBox();
  const position = await preview.evaluate(
    (element) => getComputedStyle(element).position,
  );

  expect(position).toBe("fixed");
  expect(bounds).not.toBeNull();
  expect(bounds!.y).toBeGreaterThanOrEqual(0);
  expect(bounds!.y + bounds!.height).toBeLessThanOrEqual(650);
});

test("mobile share dialog stays inside the dynamic viewport", async ({
  page,
}, testInfo) => {
  test.skip(!testInfo.project.name.includes("mobile"));
  const pageErrors: string[] = [];
  page.on("pageerror", (error) => pageErrors.push(error.message));
  await page.setViewportSize({ width: 390, height: 650 });
  await page.goto("/create");
  await page.getByRole("button", { name: "Создать личную ссылку" }).click();

  const dialog = page.getByRole("dialog", { name: "Открытка запечатана" });
  await expect(dialog).toBeVisible();
  await page.waitForTimeout(200);
  const bounds = await dialog.boundingBox();

  expect(bounds).not.toBeNull();
  expect(bounds!.y).toBeGreaterThanOrEqual(0);
  expect(bounds!.y + bounds!.height).toBeLessThanOrEqual(650);
  await expect(page.getByRole("button", { name: "Закрыть" })).toBeVisible();
  await page.getByRole("button", { name: "Копировать", exact: true }).click();
  await expect(page.getByRole("button", { name: "Готово" })).toBeVisible();
  expect(pageErrors).toEqual([]);
});

test("mobile remote-browser attributes do not trigger hydration errors", async ({
  page,
}, testInfo) => {
  test.skip(!testInfo.project.name.includes("mobile"));

  const hydrationErrors: string[] = [];
  page.on("console", (message) => {
    if (message.text().includes("A tree hydrated but some attributes")) {
      hydrationErrors.push(message.text());
    }
  });

  await page.addInitScript(() => {
    let uniqueId = 0;

    const markRemoteBrowserElements = (root: ParentNode) => {
      if (root instanceof HTMLHtmlElement) {
        root.setAttribute("__gcrremoteframetoken", "mobile-test-token");
      }

      for (const element of root.querySelectorAll(
        "form, input:not([type='checkbox']), textarea",
      )) {
        if (!element.hasAttribute("__gcruniqueid")) {
          uniqueId += 1;
          element.setAttribute("__gcruniqueid", String(uniqueId));
        }
      }
    };

    markRemoteBrowserElements(document);
    new MutationObserver((records) => {
      for (const record of records) {
        for (const node of record.addedNodes) {
          if (node instanceof Element) {
            markRemoteBrowserElements(node);
          }
        }
      }
    }).observe(document, { childList: true, subtree: true });
  });

  await page.goto("/create");
  await expect(
    page.getByRole("heading", { name: "Для кого эта история" }),
  ).toBeVisible();
  await page.waitForTimeout(500);

  expect(hydrationErrors).toEqual([]);
});

test("desktop keeps a long lock message and its action in view", async ({
  page,
}, testInfo) => {
  test.skip(!testInfo.project.name.includes("desktop"));
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/create");
  await page.getByLabel("После замка 3").fill(
    "Там лишь чувства, которые слишком долго оставались несказанными, и слова, которые всё это время ждали подходящего момента, чтобы прозвучать искренне, спокойно и без лишней спешки, потому что некоторые признания особенно важно открывать бережно и не прятать самое главное между короткими фразами.",
  );
  await page.getByRole("button", { name: "Создать личную ссылку" }).click();
  const cardLink = page.getByRole("link", { name: "Открыть открытку" });
  await cardLink.click();

  for (const label of [
    "Открыть первый замок",
    "Продолжить",
    "Ещё один замок",
  ]) {
    await page.getByRole("button", { name: label }).click();
  }

  const action = page.getByRole("button", {
    name: "Стать немного ближе",
  });
  await expect(action).toBeVisible();
  const actionBounds = await action.boundingBox();

  expect(actionBounds).not.toBeNull();
  expect(actionBounds!.y + actionBounds!.height).toBeLessThanOrEqual(900);
  expect(
    await page.evaluate(() => document.documentElement.scrollHeight),
  ).toBeLessThanOrEqual(900);
});
