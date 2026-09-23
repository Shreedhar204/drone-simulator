import type { Command } from "./CommandRunner";
import type { Facing } from "./Drone";

type SimpleCommand = Exclude<Command["type"], "PLACE">;

const SIMPLE_BUTTONS: [id: string, type: SimpleCommand][] = [
  ["cmd-attack", "ATTACK"],
  ["cmd-report", "REPORT"],
  ["cmd-left", "LEFT"],
  ["cmd-move", "MOVE"],
  ["cmd-right", "RIGHT"],
];

const byId = <T extends HTMLElement>(id: string) =>
  document.getElementById(id) as T;

const format = (command: Command) =>
  command.type === "PLACE"
    ? `PLACE(${command.x},${command.y},${command.facing})`
    : command.type;

export class ControlPanel {
  private commands: Command[] = [];
  private running = false;
  private onPlay: (commands: Command[]) => void;

  private openButton = byId<HTMLButtonElement>("open-panel");
  private panelDialog = byId<HTMLDialogElement>("control-dialog");
  private closeButton = byId<HTMLButtonElement>("panel-close");
  private placeButton = byId<HTMLButtonElement>("place");
  private deleteButton = byId<HTMLButtonElement>("delete");
  private clearButton = byId<HTMLButtonElement>("clear");
  private playButton = byId<HTMLButtonElement>("play");
  private program = byId<HTMLTextAreaElement>("program");
  private placeDialog = byId<HTMLDialogElement>("place-dialog");
  private cancelButton = byId<HTMLButtonElement>("place-cancel");
  private placeX = byId<HTMLInputElement>("place-x");
  private placeY = byId<HTMLInputElement>("place-y");
  private placeFacing = byId<HTMLSelectElement>("place-facing");
  private commandButtons: HTMLButtonElement[] = [];

  constructor(onPlay: (commands: Command[]) => void) {
    this.onPlay = onPlay;

    this.openButton.addEventListener("click", () => {
      this.panelDialog.showModal();
      this.program.scrollTop = this.program.scrollHeight;
    });
    this.closeButton.addEventListener("click", () => this.panelDialog.close());

    for (const [id, type] of SIMPLE_BUTTONS) {
      const button = byId<HTMLButtonElement>(id);
      this.commandButtons.push(button);
      button.addEventListener("click", () => this.add({ type }));
    }

    this.placeButton.addEventListener("click", () => {
      this.placeDialog.querySelector("form")?.reset();
      this.placeDialog.returnValue = ""; // stops a stale "confirm" being reused after Esc
      this.placeDialog.showModal();
    });
    this.cancelButton.addEventListener("click", () =>
      this.placeDialog.close("cancel"),
    );
    this.placeDialog.addEventListener("close", () => {
      if (this.placeDialog.returnValue !== "confirm") return;
      this.add({
        type: "PLACE",
        x: this.placeX.valueAsNumber,
        y: this.placeY.valueAsNumber,
        facing: this.placeFacing.value as Facing,
      });
    });

    this.deleteButton.addEventListener("click", () => {
      this.commands.pop();
      this.refresh();
    });
    this.clearButton.addEventListener("click", () => {
      this.commands = [];
      this.refresh();
    });
    this.playButton.addEventListener("click", () => {
      this.panelDialog.close();
      this.onPlay([...this.commands]);
    });

    this.refresh();
  }

  setRunning(running: boolean) {
    this.running = running;
    this.refresh();
  }

  private add(command: Command) {
    this.commands.push(command);
    this.refresh();
  }

  private refresh() {
    const locked = this.running;
    const empty = this.commands.length === 0;

    this.openButton.disabled = locked;
    this.placeButton.disabled = locked;
    for (const button of this.commandButtons) button.disabled = locked || empty;
    this.deleteButton.disabled = locked || empty;
    this.clearButton.disabled = locked || empty;
    this.playButton.disabled = locked || empty;

    this.program.value = this.commands.map(format).join(", ");
    this.program.scrollTop = this.program.scrollHeight;
  }
}
