export default class API {
  constructor(baseURL) {
    this.apiURL = `${baseURL}/api/`;
    this.eventSource = new EventSource(`${this.apiURL}sse`);
    this.updateMessageLisnteners = [];
    this.connectionListeners = [];
    this.registerWSEvents();
  }

  static async getResponse(response) {
    try {
      if (response.ok) {
        // если HTTP-статус в диапазоне 200-299
        if (response.status === 204) return {};
        const data = await response.json();
        return data;
      }
      throw new Error('Ответ сети был не ok.');
    } catch (error) {
      throw new Error(error.message);
    }
  }

  addConnectionLisntener(callback) {
    this.connectionListeners.push(callback);
  }

  addUpdateMessageListener(callback) {
    this.updateMessageLisnteners.push(callback);
  }

  async getMessages(quantity = undefined, lastMessageId = undefined) {
    const url = new URL('messages', this.apiURL);
    if (quantity !== undefined) url.searchParams.append('quantity', quantity);
    if (lastMessageId !== undefined) url.searchParams.append('lastMessageId', lastMessageId);
    const data = await API.getResponse(await fetch(url.href));
    return data.messages;
  }

  async createMessage(type, body) {
    const method = 'POST';
    const url = new URL('messages', this.apiURL);
    url.searchParams.append('type', type);
    await API.getResponse(await fetch(url.href, { method, body }));
  }

  async getMessage(id) {
    const url = new URL(`messages/${id}`, this.apiURL);
    const data = await API.getResponse(await fetch(url.href));
    return data.message;
  }

  async deleteMessage(id) {
    const method = 'DELETE';
    const url = new URL(`messages/${id}`, this.apiURL);
    await API.getResponse(await fetch(url.href, { method }));
  }

  onUpdateMessages(e) {
    const { lastMessageId } = JSON.parse(e.data);
    this.updateMessageLisnteners.forEach((o) => o.call(null, lastMessageId));
    this.connectionListeners.forEach((o) => o.call(null, { status: 'ok' }));
  }

  onError() {
    this.connectionListeners.forEach((o) => o.call(null, { status: 'error' }));
  }

  registerWSEvents() {
    this.eventSource.addEventListener('update', this.onUpdateMessages.bind(this));
    this.eventSource.addEventListener('error', this.onError.bind(this));
  }
}
