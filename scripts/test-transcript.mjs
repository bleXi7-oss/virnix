// Quick smoke test — run with: node scripts/test-transcript.mjs
import { YoutubeTranscript } from "youtube-transcript";

const TEST_CASES = [
  { label: "standard watch URL", id: "dQw4w9WgXcW" },         // Rick Astley
  { label: "short video", id: "jNQXAC9IVRw" },                // "Me at the zoo" — first YouTube video
];

for (const { label, id } of TEST_CASES) {
  process.stdout.write(`Testing ${label} (${id})... `);
  try {
    const segments = await YoutubeTranscript.fetchTranscript(id);
    const text = segments
      .map((s) => s.text)
      .join(" ")
      .replace(/\[.*?\]/g, "")
      .replace(/\s+/g, " ")
      .trim();
    console.log(`✓  ${segments.length} segments, ${text.length} chars`);
    console.log(`   Preview: "${text.slice(0, 120)}..."\n`);
  } catch (err) {
    console.log(`✗  ${err.message}\n`);
  }
}
