const byId = <T extends HTMLElement>(id: string) => document.getElementById(id) as T;
const SEEN_KEY = "drone-simulator:intro-seen";

export class IntroDialog {
  private dialog = byId<HTMLDialogElement>("intro-dialog");
  private pages = Array.from(document.querySelectorAll<HTMLElement>(".intro-page"));
  private dots = Array.from(document.querySelectorAll<HTMLElement>(".intro-dot"));
  private backButton = byId<HTMLButtonElement>("intro-back");
  private nextButton = byId<HTMLButtonElement>("intro-next");
  private helpButton = byId<HTMLButtonElement>("help-button");
  private page = 0;

  constructor() {
    this.backButton.addEventListener("click", () => this.go(this.page - 1));
    this.nextButton.addEventListener("click", () => {
      if (this.page === this.pages.length - 1) this.dialog.close();
      else this.go(this.page + 1);
    });
    this.helpButton.addEventListener("click", () => {
      this.go(0);
      this.dialog.showModal();
    });

    this.render();
    if (!this.hasBeenSeen()) {
      this.dialog.showModal();
      this.markSeen();
    }
  }

  private hasBeenSeen(): boolean {
    try {
      return localStorage.getItem(SEEN_KEY) === "true";
    } catch {
      return false;
    }
  }

  private markSeen() {
    try {
      localStorage.setItem(SEEN_KEY, "true");
    } catch {
      // ignore (private browsing, storage disabled, etc.) — it'll just show every visit
    }
  }

  private go(page: number) {
    this.page = Math.max(0, Math.min(page, this.pages.length - 1));
    this.render();
  }

  private render() {
    this.pages.forEach((el, i) => el.classList.toggle("is-active", i === this.page));
    this.dots.forEach((el, i) => el.classList.toggle("is-active", i === this.page));
    this.backButton.hidden = this.page === 0;
    this.nextButton.textContent =
      this.page === this.pages.length - 1 ? "Got it" : "Next";
  }
}
