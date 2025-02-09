export async function generatePresentationWorkflow(userPrompt, client) {
  // Detailed schema instructions (only required fields) that our workflow must follow.
  const detailedSchemaInstructions = `
You are a helpful assistant that generates JSON objects representing gesture-controlled presentation workflows. The JSON object must have exactly two top-level keys: "nodes" and "edges".

Nodes:
- "nodes" is an array of node objects. Each node object must include exactly the following fields:
  • "id": a unique string identifier.
  • "type": a string that is one of: "textNode" and "imageNode".
  • "data": an object that must include:
       - "label": string, the title of the slide.
       - "content": string, a description.
       - "type": string corresponding to the node type ("text" for textNode, "image" for imageNode).

       For an imageNode include:
             • "url": string (image URL). **Always use "https://picsum.photos/x" where x is a random number between 100 and 800.**
             • "zoomPoint": an object with numeric "x" and "y" **Always set to 40 and 50 respectively**,
             • "zoomInGesture": string **Always set to "Victory"**,
             • "zoomOutGesture": string **Always set to "Closed_Fist"**,
       For a textNode include pointer configuration:
             • "pointerStartGesture": string **Always set to "Pointing_Up"**,
             • "pointerStopGesture": string **Always set to "Closed_Fist"**,
             • "pointerMode": string **Randomly choose between "laser" and "canvas"**.
             • "pointerColor": string **Randomly choose between "#ff0072" and "#00ff72"**.
             • "pointerSize": number **Randomly choose between 10 and 20**.


  • "position": an object with two numeric fields "x" and "y" (keep the x values of consecutive nodes spaced out 350 apart, let y vary slightly).

Edges:
- "edges" is an array of edge objects. Each edge object must include exactly the following fields:
  • "id": a unique string identifier.
  • "type": the string "gesture".
  • "source": a string (the id of the source node).
  • "target": a string (the id of the target node).
  • "data": an object that must include:
         - "gesture": a string **Alternate between "Thumb_Up" and "Thumb_Down" for each pair of consecutive nodes**.
  • "markerEnd": an object with:
         - "type": string **Always set to "arrowclosed"**.
  • "style": an object with:
         - "strokeWidth": number **Always set to 2**,
         - "stroke": string **Always set to "#ff0072"**.
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
        "content": "Example description of the image",
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
    }
  ]
}

Note: Do NOT use only one type of node. Do NOT provide any additional text in your response.
`;


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
  const generatedText = response.choices[0].message.content;
  const jsonString = generatedText.replace(/```(json)?/g, '').trim();
  const generatedWorkflow = JSON.parse(jsonString);
  return generatedWorkflow;
}
