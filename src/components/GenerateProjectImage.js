export async function generateProjectImage(prompt, client) {
  try {
    const response = await client.images.generate({
      model: "stability.stable-diffusion-3.5-large",
      prompt: prompt,
      n: 1,
      size: "400x400",
    });
    // Assume the response contains an array of images; adjust if needed.
    const b64Image = response.data[0].b64_json;
    const dataUrl = `data:image/png;base64,${b64Image}`;
    return dataUrl;
  } catch (error) {
    console.error("Error generating project image:", error);
    throw error;
  }
}
