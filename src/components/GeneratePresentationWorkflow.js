import openai from 'openai';

/*
  IMPORTANT:
  - Your API key should be stored in an environment variable (e.g., OPENAI_API_KEY).
  - In production, use your own backend proxy so the API key isn’t exposed in client-side code.
*/

export async function generatePresentationWorkflow(userPrompt) {
  // Detailed schema instructions (only required fields) that our workflow must follow.
  const detailedSchemaInstructions = `
Generate a JSON object representing a gesture-controlled presentation workflow for a presentation application. The JSON object must have exactly two top-level keys: "nodes" and "edges".

Nodes:
- "nodes" is an array of node objects. Each node object must include exactly the following fields:
  • "id": a unique string identifier.
  • "type": a string that is one of: "textNode", "imageNode", "videoNode", "apiNode".
  • "data": an object that must include:
       - "label": string, the title of the slide.
       - "content": string (can be empty).
       - "type": string corresponding to the node type ("text" for textNode, "image" for imageNode, "video" for videoNode, "api" for apiNode).
       
       Optionally, for an imageNode you may include:
             • "url": string (image URL),
             • "zoomPoint": an object with numeric "x" and "y",
             • "zoomInGesture": string (one of "Thumb_Up", "Thumb_Down", "Open_Palm", "Closed_Fist", "Victory", "Pointing_Up"),
             • "zoomOutGesture": string (one of the valid gestures),
             • "maxZoom": number,
             • "pointerColor": string (color code),
             • "pointerSize": number.
       Optionally, for a videoNode you may include:
             • "videoUrl": string (video URL),
             • "autoplay": boolean,
             • "loop": boolean,
             • "playPauseGesture": string (one of the valid gestures),
             • "scrubForwardGesture": string (one of the valid gestures),
             • "scrubBackwardGesture": string (one of the valid gestures),
             • "scrubAmount": number.
       Optionally, for any node you may include pointer configuration:
             • "pointerMode": string ("laser" or "canvas"),
             • "pointerStartGesture": string (one of "Thumb_Up", "Thumb_Down", "Open_Palm", "Closed_Fist", "Victory", "Pointing_Up"),
             • "pointerStopGesture": string (one of the valid gestures).

  • "position": an object with two numeric fields "x" and "y".

Edges:
- "edges" is an array of edge objects. Each edge object must include exactly the following fields:
  • "id": a unique string identifier.
  • "type": the string "gesture".
  • "source": a string (the id of the source node).
  • "target": a string (the id of the target node).
  • "data": an object that must include:
         - "gesture": a string; valid values are "Thumb_Up", "Thumb_Down", "Open_Palm", "Closed_Fist", "Victory", "Pointing_Up".
  • "markerEnd": an object with:
         - "type": string (for example, "arrowclosed").
  • "style": an object with:
         - "strokeWidth": number,
         - "stroke": string.
  • "animated": boolean.
  • "label": string.

Return only the JSON object (with keys "nodes" and "edges") without any additional text.
`;

  // Combine the user's custom prompt with our detailed instructions.
  const finalPrompt = `${userPrompt}\n\n${detailedSchemaInstructions}`;

  // Initialize the OpenAI client.
  const client = new openai.OpenAI({
    baseURL: "https://api.ai.it.cornell.edu",
    apiKey: "sk-ZmTOaxcK9_My_f-kiuT5sQ",
    dangerouslyAllowBrowser: true,
    // The API key is expected via process.env.OPENAI_API_KEY.
  });

  const response = await client.chat.completions.create({
    model: "anthropic.claude-3.5-sonnet.v2",
    messages: [
      {
        role: "user",
        content: finalPrompt,
      },
    ],
  });

  // Extract and clean up the generated text.
  console.log(response);
  const generatedText = response.choices[0].message.content;
  const jsonString = generatedText.replace(/```(json)?/g, '').trim();
  const generatedWorkflow = JSON.parse(jsonString);
  return generatedWorkflow;
}
