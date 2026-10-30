import assert from "node:assert/strict";
import { test } from "node:test";
import { initLightbox } from "../src/scripts/lightbox.ts";

test("a delayed native close event cannot erase a reopened lightbox", async () => {
  const originalDocument = globalThis.document;
  const originalImage = globalThis.Image;
  let focused: object | undefined;
  class Element extends EventTarget {
    src = "";
    alt = "";
    textContent = "";
    hidden = false;
    dataset: Record<string, string> = {};
    children: Record<string, Element> = {};
    querySelector(selector: string) {
      return this.children[selector];
    }
    removeAttribute(name: string) {
      if (name === "src") this.src = "";
    }
    focus() {
      focused = this;
    }
    click() {
      this.dispatchEvent(new Event("click"));
    }
  }
  class Dialog extends Element {
    open = false;
    showModal() {
      this.open = true;
    }
    close() {
      this.open = false;
      queueMicrotask(() => this.dispatchEvent(new Event("close")));
    }
  }
  const dialog = new Dialog();
  const image = new Element();
  const status = new Element();
  const close = new Element();
  const triggers = [0, 1].map((index) => {
    const trigger = new Element();
    trigger.dataset.lightboxWebp = `https://example.com/${index}.webp`;
    trigger.children.img = Object.assign(new Element(), { alt: `Photo ${index + 1}` });
    return trigger;
  });
  dialog.children = {
    "[data-lightbox-image]": image,
    "[data-lightbox-status]": status,
    "[data-lightbox-content]": new Element(),
    '[data-action="close"]': close,
    '[data-action="previous"]': new Element(),
    '[data-action="next"]': new Element(),
  };
  const body = { style: { overflow: "auto" } };
  Object.assign(globalThis, {
    document: { body, querySelectorAll: () => triggers },
    Image: Element,
  });
  try {
    initLightbox(dialog as unknown as HTMLDialogElement);
    triggers[0]!.click();
    close.click();
    assert.equal(focused, triggers[0]);
    triggers[1]!.click();
    await Promise.resolve();
    assert.equal(dialog.open, true);
    assert.equal(image.src, "https://example.com/1.webp");
    assert.equal(image.alt, "Photo 2");
    assert.equal(status.textContent, "Photograph 2 of 2");
    assert.equal(body.style.overflow, "hidden");
    close.click();
    await Promise.resolve();
    assert.equal(body.style.overflow, "auto");
    assert.equal(focused, triggers[1]);
  } finally {
    Object.assign(globalThis, { document: originalDocument, Image: originalImage });
  }
});
