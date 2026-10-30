export function initLightbox(dialog: HTMLDialogElement): void {
  const image = dialog.querySelector<HTMLImageElement>("[data-lightbox-image]")!;
  const status = dialog.querySelector<HTMLElement>("[data-lightbox-status]")!;
  const content = dialog.querySelector<HTMLElement>("[data-lightbox-content]")!;
  const closeButton = dialog.querySelector<HTMLButtonElement>('[data-action="close"]')!;
  const previousButton = dialog.querySelector<HTMLButtonElement>('[data-action="previous"]')!;
  const nextButton = dialog.querySelector<HTMLButtonElement>('[data-action="next"]')!;
  const triggers = [...document.querySelectorAll<HTMLButtonElement>("button[data-lightbox]")];
  let index = -1;
  let opener: HTMLButtonElement | undefined;
  let previousOverflow = "";

  const showPhoto = (next: number) => {
    const trigger = triggers[next];
    const url = trigger?.dataset.lightboxWebp;
    if (!url) return;
    index = next;
    image.src = url;
    image.alt = trigger.querySelector("img")?.alt ?? "";
    status.textContent = `Photograph ${index + 1} of ${triggers.length}`;
    if (triggers.length > 1) {
      const neighbors = new Set([
        (index + 1) % triggers.length,
        (index - 1 + triggers.length) % triggers.length,
      ]);
      for (const neighbor of neighbors) {
        const source = triggers[neighbor]?.dataset.lightboxWebp;
        if (source) new Image().src = source;
      }
    }
  };

  const reset = () => {
    document.body.style.overflow = previousOverflow;
    image.removeAttribute("src");
    image.alt = "";
    status.textContent = "";
    index = -1;
    opener?.focus({ preventScroll: true });
    opener = undefined;
  };
  const close = () => {
    dialog.close();
    reset();
  };
  const navigate = (direction: number) => {
    if (index >= 0) showPhoto((index + direction + triggers.length) % triggers.length);
  };

  for (const [position, trigger] of triggers.entries()) {
    trigger.addEventListener("click", () => {
      if (!trigger.dataset.lightboxWebp) return;
      opener = trigger;
      previousOverflow = document.body.style.overflow;
      showPhoto(position);
      previousButton.hidden = nextButton.hidden = triggers.length < 2;
      dialog.showModal();
      document.body.style.overflow = "hidden";
    });
  }
  closeButton.addEventListener("click", close);
  previousButton.addEventListener("click", () => navigate(-1));
  nextButton.addEventListener("click", () => navigate(1));
  dialog.addEventListener("cancel", (event) => {
    event.preventDefault();
    close();
  });
  dialog.addEventListener("close", () => {
    // A native close event can arrive after a keyboard user has already reopened it.
    if (!dialog.open) reset();
  });
  dialog.addEventListener("click", (event) => {
    if (event.target === dialog || event.target === content) close();
  });
  dialog.addEventListener("keydown", (event) => {
    if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
      event.preventDefault();
      navigate(event.key === "ArrowLeft" ? -1 : 1);
    }
  });
  image.addEventListener("error", () => {
    if (dialog.open)
      status.textContent = `Photograph ${index + 1} could not be loaded. Try the next photograph.`;
  });

  let touchStart: { x: number; y: number } | undefined;
  content.addEventListener(
    "touchstart",
    (event) => {
      const touch = event.changedTouches[0];
      touchStart = touch ? { x: touch.screenX, y: touch.screenY } : undefined;
    },
    { passive: true },
  );
  content.addEventListener(
    "touchend",
    (event) => {
      const touch = event.changedTouches[0];
      if (touch && touchStart) {
        const dx = touch.screenX - touchStart.x;
        const dy = touch.screenY - touchStart.y;
        if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy)) navigate(dx < 0 ? 1 : -1);
      }
      touchStart = undefined;
    },
    { passive: true },
  );
  content.addEventListener(
    "touchcancel",
    () => {
      touchStart = undefined;
    },
    { passive: true },
  );
}
