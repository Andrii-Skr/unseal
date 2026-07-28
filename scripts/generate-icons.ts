import { mkdir, readFile, writeFile } from "node:fs/promises";
import { chromium } from "@playwright/test";

const transparentSource = new URL("../src/app/icon.svg", import.meta.url);
const appSource = new URL(
  "../public/icons/heart-icon-source.svg",
  import.meta.url,
);

async function renderSvg(
  browser: Awaited<ReturnType<typeof chromium.launch>>,
  svg: string,
  size: number,
): Promise<Buffer<ArrayBufferLike>> {
  const page = await browser.newPage({
    deviceScaleFactor: 1,
    viewport: { width: size, height: size },
  });

  await page.setContent(
    `<style>html,body{margin:0;width:100%;height:100%;overflow:hidden;background:transparent}svg{display:block;width:100%;height:100%}</style>${svg}`,
  );
  const image = await page.screenshot({
    animations: "disabled",
    omitBackground: true,
    type: "png",
  });
  await page.close();
  return image;
}

function makeIco(images: Array<{ image: Buffer; size: number }>) {
  const headerSize = 6;
  const directorySize = images.length * 16;
  let dataOffset = headerSize + directorySize;
  const header = Buffer.alloc(headerSize);
  header.writeUInt16LE(0, 0);
  header.writeUInt16LE(1, 2);
  header.writeUInt16LE(images.length, 4);

  const directories = images.map(({ image, size }) => {
    const entry = Buffer.alloc(16);
    entry.writeUInt8(size >= 256 ? 0 : size, 0);
    entry.writeUInt8(size >= 256 ? 0 : size, 1);
    entry.writeUInt8(0, 2);
    entry.writeUInt8(0, 3);
    entry.writeUInt16LE(1, 4);
    entry.writeUInt16LE(32, 6);
    entry.writeUInt32LE(image.length, 8);
    entry.writeUInt32LE(dataOffset, 12);
    dataOffset += image.length;
    return entry;
  });

  return Buffer.concat([
    header,
    ...directories,
    ...images.map(({ image }) => image),
  ]);
}

async function main() {
  await mkdir(new URL("../public/icons/", import.meta.url), {
    recursive: true,
  });

  const [transparentSvg, appSvg] = await Promise.all([
    readFile(transparentSource, "utf8"),
    readFile(appSource, "utf8"),
  ]);
  const browser = await chromium.launch();

  try {
    const [icon192, icon512, appleIcon, ...faviconImages] = await Promise.all([
      renderSvg(browser, appSvg, 192),
      renderSvg(browser, appSvg, 512),
      renderSvg(browser, appSvg, 180),
      ...[16, 32, 48, 256].map(async (size) => ({
        image: await renderSvg(browser, transparentSvg, size),
        size,
      })),
    ]);

    await Promise.all([
      writeFile(
        new URL("../public/icons/icon-192.png", import.meta.url),
        icon192,
      ),
      writeFile(
        new URL("../public/icons/icon-512.png", import.meta.url),
        icon512,
      ),
      writeFile(
        new URL("../public/icons/icon-maskable-512.png", import.meta.url),
        icon512,
      ),
      writeFile(
        new URL("../src/app/apple-icon.png", import.meta.url),
        appleIcon,
      ),
      writeFile(
        new URL("../src/app/favicon.ico", import.meta.url),
        makeIco(faviconImages),
      ),
    ]);
  } finally {
    await browser.close();
  }
}

void main();
