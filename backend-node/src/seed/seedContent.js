// Seed initial content (prompts, tools) if needed.
// This runs once on every server boot after DB init.

export async function seedContent() {
  // No-op: content is managed via admin panel.
  console.log("seedContent: skipped (managed via admin)");
}
