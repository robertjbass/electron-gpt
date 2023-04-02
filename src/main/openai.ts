import { ChatCompletionRequestMessage, Configuration, OpenAIApi } from 'openai'

export class OpenAiClient {
  private openai: OpenAIApi
  private messages: ChatCompletionRequestMessage[] = []

  constructor(apiKey: string) {
    const config = new Configuration({
      apiKey
    })
    this.openai = new OpenAIApi(config)

    this.messages = [
      {
        role: 'system',
        content:
          'You are a helpful AI assistant. Your only goal is to find the most accurate and helpful information possible when prompted for an answer.'
      }
    ]
  }

  async createChatCompletion(prompt: string) {
    this.messages.push({
      role: 'user',
      content: prompt
    })

    const completion = await this.openai.createChatCompletion({
      model: 'gpt-3.5-turbo',
      messages: this.messages
    })

    return completion.data.choices[0].message
  }
}
