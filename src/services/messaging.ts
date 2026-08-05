import type { ExtensionMessage } from '@/types/messages'

/** Typed wrapper around chrome.runtime.sendMessage — call site provides the expected response shape. */
export async function sendMessage<TResponse = unknown>(message: ExtensionMessage): Promise<TResponse> {
  return (await chrome.runtime.sendMessage(message)) as TResponse
}

/** Same, but targeted at a specific tab's content script (used by the popup). */
export async function sendMessageToTab<TResponse = unknown>(tabId: number, message: ExtensionMessage): Promise<TResponse> {
  return (await chrome.tabs.sendMessage(tabId, message)) as TResponse
}
