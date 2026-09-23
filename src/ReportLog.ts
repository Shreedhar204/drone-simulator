export class ReportLog {
  private log = document.getElementById("report-log") as HTMLElement;

  add(text: string) {
    this.log.append(this.log.hasChildNodes() ? `\n${text}` : text);
    this.log.scrollTop = this.log.scrollHeight;
  }

  clear() {
    this.log.replaceChildren();
  }
}
