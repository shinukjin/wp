/**
 * Discord 웹훅으로 메시지 전송
 */
export async function sendDiscordWebhook(webhookUrl: string, content: string): Promise<boolean> {
  try {
    const res = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content }),
    })
    return res.ok
  } catch {
    return false
  }
}
