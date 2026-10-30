export function main() {
  const r = new Runner();
  r.start();
  format("x");
}

const format = (s: string) => s.trim();

class Runner {
  start() { this.tick(); }
  tick = () => format("t");
}
