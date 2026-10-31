/**
 * NPL Hub Nepal — Cloudflare Workers AI Image Generation Provider
 *
 * Optional atmospheric background generator using Cloudflare's free Workers AI tier:
 * Model: `@cf/black-forest-labs/flux-1-schnell`
 * Free quota: 10,000 Neurons/day (~40 image generations/day).
 *
 * SAFETY & ZERO-COST POLICY:
 * - Purely optional! If credentials are missing, returns null so local Sharp compositor takes over.
 * - If HTTP 429 (rate/quota limit) or 403 occurs, logs warning and returns null without erroring the job.
 * - Strictly abstract / atmospheric stadium backgrounds: NO synthetic player faces or fake portraits.
 */

export async function generateCloudflareBackground(
  promptContext: string
): Promise<{ imageBuffer: Buffer | null; latencyMs: number }> {
  const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
  const apiToken = process.env.CLOUDFLARE_API_TOKEN;

  if (!accountId || !apiToken) {
    // Graceful fallback to local Sharp compositor
    return { imageBuffer: null, latencyMs: 0 };
  }

  const startTime = Date.now();

  // Construct safe atmospheric prompt
  const safePrompt = `Atmospheric cinematic cricket stadium at dusk, dramatic stadium floodlights beam through misty night air, rich deep navy and golden glowing lights, Tribhuvan University international cricket ground mountain landscape in background, clean sports broadcast aesthetic, professional 8k photography, bokeh, no people, no faces, no text. Focus on: ${promptContext.slice(0, 100)}`;

  try {
    const url = `https://api.cloudflare.com/client/v4/accounts/${accountId}/ai/run/@cf/black-forest-labs/flux-1-schnell`;

    const response = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        prompt: safePrompt,
        num_steps: 4, // flux-1-schnell optimal steps
      }),
    });

    const latencyMs = Date.now() - startTime;

    if (response.status === 429) {
      console.warn("[Cloudflare AI] Daily free neuron quota reached (429). Falling back to local Sharp compositor.");
      return { imageBuffer: null, latencyMs };
    }

    if (!response.ok) {
      console.warn(`[Cloudflare AI] Request failed (${response.status}). Falling back to local Sharp compositor.`);
      return { imageBuffer: null, latencyMs };
    }

    // Workers AI returns raw image bytes (JPEG or PNG) or JSON with image base64
    const contentType = response.headers.get("content-type") || "";

    if (contentType.includes("application/json")) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const data: any = await response.json();
      if (data.result?.image) {
        const buf = Buffer.from(data.result.image, "base64");
        return { imageBuffer: buf, latencyMs };
      }
      return { imageBuffer: null, latencyMs };
    }

    const arrayBuffer = await response.arrayBuffer();
    return { imageBuffer: Buffer.from(arrayBuffer), latencyMs };
  } catch (err) {
    console.warn("[Cloudflare AI] Generation failed, using local Sharp SVG fallback:", err);
    return { imageBuffer: null, latencyMs: Date.now() - startTime };
  }
}
