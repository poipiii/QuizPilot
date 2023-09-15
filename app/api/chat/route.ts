import OpenAI from 'openai';
import { OpenAIStream, StreamingTextResponse } from 'ai';

const resource = process.env.AZURE_OPENAI_GPT4_RESOURCE_NAME;
const model = process.env.AZURE_OPENAI_GPT4_DEPLOYMENT_NAME;
 
const apiKey = process.env.AZURE_OPENAI_GPT4_API_KEY;
if (!apiKey) {
  throw new Error('AZURE_OPENAI_API_KEY is missing from the environment.');
}
 
// Azure OpenAI requires a custom baseURL, api-version query param, and api-key header.
const openai = new OpenAI({
  apiKey,
  baseURL: `https://${resource}.openai.azure.com/openai/deployments/${model}`,
  defaultQuery: { 'api-version': '2023-06-01-preview' },
  defaultHeaders: { 'api-key': apiKey },
});



export const runtime = 'edge';
 
export async function POST(req: Request) {
    
  // Extract the `messages` from the body of the request
  const { messages } = await req.json();
  // Ask OpenAI for a streaming chat completion given the prompt
  const response = await openai.chat.completions.create({
    model: "gpt-4",
    stream: true,
    messages,
  });
  // Convert the response into a friendly text-stream
  const stream = OpenAIStream(response);
  console.log(stream)
  // Respond with the stream
  return new StreamingTextResponse(stream);
}