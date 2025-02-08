import openai from 'openai';

/*
  IMPORTANT:
  - Your API key should be stored in an environment variable (e.g., OPENAI_API_KEY).
  - In production, use your own backend proxy so the API key isn’t exposed in client-side code.
*/

export async function generatePresentationWorkflow(userPrompt) {
  // Detailed schema instructions (only required fields) that our workflow must follow.
  const detailedSchemaInstructions = `
You are a helpful assistant that generates JSON objects representing gesture-controlled presentation workflows. The JSON object must have exactly two top-level keys: "nodes" and "edges".

Nodes:
- "nodes" is an array of node objects. Each node object must include exactly the following fields:
  • "id": a unique string identifier.
  • "type": a string that is one of: "textNode", "imageNode", "videoNode", "apiNode".
  • "data": an object that must include:
       - "label": string, the title of the slide.
       - "content": string (can be empty).
       - "type": string corresponding to the node type ("text" for textNode, "image" for imageNode, "video" for videoNode, "api" for apiNode).
       - "pointerMode": string ("laser" or "canvas"),

       Optionally, for an imageNode you may include:
             • "url": string (image URL). **Always use "https://picsum.photos/400" for this field.**
             • "zoomPoint": an object with numeric "x" and "y" **Always set to 40 and 50 respectively**,
             • "zoomInGesture": string (one of "Thumb_Up", "Thumb_Down", "Open_Palm", "Closed_Fist", "Victory", "Pointing_Up"),
             • "zoomOutGesture": string (one of the valid gestures),
       Optionally, for a videoNode you may include:
             • "videoUrl": string (video URL). **Choose this value randomly from the following list: http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4, http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4, http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4, http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4, http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4, http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4, http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerMeltdowns.mp4, http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4, http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/SubaruOutbackOnStreetAndDirt.mp4, http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4, http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/VolkswagenGTIReview.mp4, http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/WeAreGoingOnBullrun.mp4, http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/WhatCarCanYouGetForAGrand.mp4.**
             • "autoplay": boolean,
             • "loop": boolean,
             • "playPauseGesture": string (one of the valid gestures),
             • "scrubForwardGesture": string (one of the valid gestures),
             • "scrubBackwardGesture": string (one of the valid gestures),
             • "scrubAmount": number.
       Optionally, for any node you may include pointer configuration:
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

Example Output:
{
  "nodes": [
    {
      "id": "1",
      "type": "textNode",
      "data": {
        "label": "Example Title",
        "content": "Example Content",
        "type": "text",
        "pointerMode": "laser",
        "pointerStartGesture": "Pointing_Up",
        "pointerStopGesture": "Closed_Fist"
      },
      "position": { "x": -15, "y": 45 }
    },
    {
      "id": "2",
      "type": "imageNode",
      "data": {
        "label": "Example Image",
        "content": "",
        "type": "image",
        "url": "https://picsum.photos/400",
        "pointerMode": "laser",
        "zoomPoint": { "x": 40, "y": 50 },
        "zoomInGesture": "Open_Palm",
        "zoomOutGesture": "Victory",
        "pointerStartGesture": "Pointing_Up",
        "pointerStopGesture": "Closed_Fist"
      },
      "position": { "x": 330, "y": 30 }
    },
    {
      "id": "3",
      "type": "videoNode",
      "data": {
        "label": "Example Video",
        "content": "",
        "type": "video",
        "videoUrl": "http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
        "autoplay": false,
        "loop": false,
        "playPauseGesture": "Pointing_Up",
        "scrubForwardGesture": "Victory",
        "scrubBackwardGesture": "Closed_Fist",
        "pointerMode": "laser"
      },
      "position": { "x": 720, "y": 90 }
    },
    {
      "id": "4",
      "type": "textNode",
      "data": {
        "label": "Example End",
        "content": "Thank you!",
        "type": "text",
        "pointerMode": "laser"
      },
      "position": { "x": 1140, "y": 150 }
    }
  ],
  "edges": [
    {
      "id": "1",
      "type": "gesture",
      "source": "1",
      "target": "2",
      "data": { "gesture": "Thumb_Up" },
      "markerEnd": { "type": "arrowclosed" },
      "style": { "strokeWidth": 2, "stroke": "#ff0072" },
      "animated": true,
      "label": "Thumb_Up"
    },
    {
      "id": "2",
      "type": "gesture",
      "source": "2",
      "target": "3",
      "data": { "gesture": "Thumb_Down" },
      "markerEnd": { "type": "arrowclosed" },
      "style": { "strokeWidth": 2, "stroke": "#ff0072" },
      "animated": true,
      "label": "Thumb_Down"
    },
    {
      "id": "3",
      "type": "gesture",
      "source": "3",
      "target": "4",
      "data": { "gesture": "Thumb_Up" },
      "markerEnd": { "type": "arrowclosed" },
      "style": { "strokeWidth": 2, "stroke": "#ff0072" },
      "animated": true,
      "label": "Thumb_Up"
    }
  ]
}

Note: Do not use the same gesture for multiple actions on the same node. Do NOT provide any additional text in your response.
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
        role: "system",
        content: detailedSchemaInstructions,
      },
      {
        role: "user",
        content: "Provide the JSON object and include a textNode with 'label' and 'content' related to: " + userPrompt,
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
