import { fromEvent } from 'rxjs/index';
import { delay, filter } from 'rxjs/operators';
import moment from 'moment';

moment.locale('ru');

export default class UIManager {
  constructor(baseURL) {
    this.container = document.querySelector('.time-events');
    this.fileImageSrc = document.querySelector('.upload-file-image').src;
    this.errorEl = document.querySelector('.error');
    this.baseURL = baseURL;
    this.error = false;
    this.scrollEvents$ = fromEvent(this.container, 'scroll').pipe(
      filter(() => this.container.scrollTop < 5),
      delay(50),
    );
    this.deleteMessageListeners = [];
  }

  static renderText(text) {
    const linkRegexp = /(https?:\/\/\S+)/ig;
    const matches = text.matchAll(linkRegexp);
    if (matches === null) return text;
    let c = 0;
    let result = '';
    let lastIndex = 0;
    for (const match of matches) {
      const link = match[c];
      result += text.slice(lastIndex, match.index);
      result += `<a href="${link}">${link}</a>`;
      c += 1;
      lastIndex = match.index + link.length;
    }
    result += text.slice(lastIndex);
    return result;
  }

  subscribeScrollListener(callback) {
    this.scrollEvents$.subscribe(callback);
  }

  addDeleteMessageListener(callback) {
    this.deleteMessageListeners.push(callback);
  }

  renderMessagesHTML(messages) {
    let HTML = '';
    messages.forEach((message) => {
      HTML += `<div class="time-event" data-id=${message.id}>
      <div class="timestamp"></div>
      <button class="time-event_delete-button hidden">X</button>
      <div class="time-event_content">
        <div class="time-event_date">${moment(message.date).format('DD.MM.YYYY в hh:mm:ss')}</div>`;
      if (message.type === 'text') {
        HTML += `<div class="time-event_text">${UIManager.renderText(message.text)}</div>`;
      } else if (message.type === 'video') {
        HTML += `<video class="time-event_video" controls>
        <source src="${this.baseURL + message.file.URL}" type='video/mp4'>
        </video>`;
      } else if (message.type === 'audio') {
        HTML += `<audio controls class="time-event_audio">
        <source src="${this.baseURL + message.file.URL}" type="audio/mp4">
        </audio>`;
      } else if (message.type === 'file') {
        HTML += `<a href="${this.baseURL + message.file.URL}" download target="_blank">
        <img class="upload-file-image button-image" src="${this.fileImageSrc}">
        ${message.file.name}
        </a>`;
      }
      if (Array.isArray(message.location)) {
        HTML += `<div class="time-event_location">Местоположение: [${message.location[0]}, ${message.location[1]}]</div>
      </div></div>`;
      } else {
        HTML += `<div class="time-event_location">Местоположение: [ неизвестно ]</div>
        </div></div>`;
      }
    });
    HTML += '';
    return HTML;
  }

  onScroll() {
    if (this.container.scrollTop < 5) this.scrollEvents$.forEach((o) => o.call(null));
  }

  redrawMessages(...messages) {
    this.container.innerHTML = this.renderMessagesHTML(messages.reverse());
    this.container.scrollTo(0, this.container.scrollHeight);
    this.registerEventsForMessages();
  }

  drawMessagesAfterBegin(...messages) {
    const height = this.container.scrollHeight;
    this.container.insertAdjacentHTML('afterbegin', this.renderMessagesHTML(messages.reverse()));
    this.container.scrollTo(0, this.container.scrollHeight - height);
    this.registerEventsForMessages();
  }

  drawMessagesBeforEnd(...messages) {
    this.container.insertAdjacentHTML('beforeend', this.renderMessagesHTML(messages.reverse()));
    this.container.scrollTo(0, this.container.scrollHeight);
    this.registerEventsForMessages();
  }

  showError() {
    this.error = true;
    this.errorEl.classList.remove('hidden');
    this.errorEl.innerText = 'Ошибка подключения к интернету. Вы находитесь в офлайн режиме просмотра';
  }

  hideError() {
    this.error = false;
    this.errorEl.innerText = 'Подключение установлено, загружаем обновления...';
    this.errorEl.classList.add('connect');
    setTimeout(() => {
      this.errorEl.classList.remove('connect');
      this.errorEl.classList.add('hidden');
      this.errorEl.innerText = '';
    }, 3000);
  }

  onDeleteMessage(e) {
    const messageEl = e.currentTarget.closest('.time-event');
    const { id } = messageEl.dataset;
    this.deleteMessageListeners.forEach((o) => o.call(null, id));
  }

  registerEventsForMessages() {
    const messages = this.container.querySelectorAll('.time-event');
    messages.forEach((m) => {
      const deleteBtn = m.querySelector('.time-event_delete-button');
      m.addEventListener('mouseover', () => {
        deleteBtn.classList.remove('hidden');
      });
      m.addEventListener('mouseout', () => {
        deleteBtn.classList.add('hidden');
      });
      deleteBtn.addEventListener('click', this.onDeleteMessage.bind(this));
    });
  }
}
