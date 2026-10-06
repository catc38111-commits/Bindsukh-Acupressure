export interface ChatHistoryItem {
  role: 'user' | 'model';
  text: string;
}

export interface SendMessageParams {
  message: string;
  language: 'en' | 'hi' | 'hinglish';
  history?: ChatHistoryItem[];
}

export interface ChatResponse {
  reply: string;
  actionType?: 'book' | 'call' | 'map';
}

/**
 * Sends a patient symptom or consultation query to the backend AI assistant
 * passing the full user message and conversation history.
 */
export async function sendChatMessage(params: SendMessageParams): Promise<ChatResponse> {
  const { message, language, history = [] } = params;

  const response = await fetch('/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      message,
      language,
      history,
    }),
  });

  if (!response.ok) {
    throw new Error(`Server chat API returned status ${response.status}`);
  }

  const data = await response.json();
  const replyText = data.reply || '';

  let actionType: 'book' | 'call' | 'map' = 'book';
  const lower = replyText.toLowerCase();
  if (
    lower.includes('मैप') ||
    lower.includes('पता') ||
    lower.includes('location') ||
    lower.includes('address') ||
    lower.includes('rasta')
  ) {
    actionType = 'map';
  } else if (
    lower.includes('कॉल') ||
    lower.includes('फोन') ||
    lower.includes('helpline') ||
    lower.includes('call')
  ) {
    actionType = 'call';
  }

  return {
    reply: replyText,
    actionType,
  };
}
