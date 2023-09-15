import { kv } from '@vercel/kv'
import { OpenAIStream, StreamingTextResponse } from 'ai'
import OpenAI from 'openai';

import { auth } from '@/auth'
import { nanoid } from '@/lib/utils'

export const runtime = 'edge'

const api_key  = process.env.AZURE_OPENAI_GPT4_API_KEY
const resource  = process.env.AZURE_OPENAI_GPT4_RESOURCE_NAME
const depolyment = process.env.AZURE_OPENAI_GPT4_DEPLOYMENT_NAME


const openai = new OpenAI({
  apiKey:api_key,
  baseURL: `https://${resource}.openai.azure.com/openai/deployments/${depolyment}`,
  defaultQuery: { 'api-version': '2023-06-01-preview' },
  defaultHeaders: { 'api-key': api_key },
});



export async function POST(req: Request) {
  const json = await req.json()
  const { messages, previewToken } = json
  const userId = (await auth())?.user.id

  if (!userId) {
    return new Response('Unauthorized', {
      status: 401
    })
  }



  const res = await openai.chat.completions.create({
    model: 'gpt-4',
    messages,
    temperature: 1,
    stream: true,
  })

  const stream = OpenAIStream(res, {
    async onCompletion(completion) {
      const title = json.messages[0].content.substring(0, 100)
      const id = json.id ?? nanoid()
      const createdAt = Date.now()
      const path = `/chat/${id}`
      const payload = {
        id,
        title,
        userId,
        createdAt,
        path,
        messages: [
          ...messages,
          {
            content: completion,
            role: 'assistant'
          }
        ]
      }
      await kv.hmset(`chat:${id}`, payload)
      await kv.zadd(`user:chat:${userId}`, {
        score: createdAt,
        member: `chat:${id}`
      })
    }
  })

  return new StreamingTextResponse(stream)
}
