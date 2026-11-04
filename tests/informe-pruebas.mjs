export default async function* (eventos) {
  for await (const evento of eventos) {
    if (evento.type === "test:pass") {
      yield `✔ ${evento.data.name}\n`;
      continue;
    }

    if (evento.type === "test:fail") {
      yield `✘ ${evento.data.name}\n  Motivo: ${evento.data.details.error.message}\n`;
      continue;
    }

    if (evento.type === "test:summary") {
      if (evento.data.file !== undefined) continue;

      const { counts, duration_ms: duracion } = evento.data;
      const fallidas =
        counts.tests -
        counts.passed -
        counts.cancelled -
        counts.skipped -
        counts.todo;

      yield [
        "\nResumen de pruebas:",
        `  Total: ${counts.tests}`,
        `  Aprobadas: ${counts.passed}`,
        `  Fallidas: ${fallidas}`,
        `  Omitidas: ${counts.skipped}`,
        `  Canceladas: ${counts.cancelled}`,
        `  Pendientes: ${counts.todo}`,
        `  Duración: ${duracion.toFixed(2)} ms`,
        "",
      ].join("\n");
    }
  }
}
