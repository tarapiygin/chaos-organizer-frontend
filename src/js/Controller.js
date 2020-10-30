import moment from 'moment';
import MessageFormWidget from './MessageFormWidget';
import LocationFormWidget from './LocationFormWidget';
import UIManager from './UIManager';
import PopupWidget from './PopupWidget';
import API from './API';

export default class Controller {
  constructor(baseURL) {
    this.API = new API(baseURL);
    this.UIManager = new UIManager(baseURL);
    this.messageForm = new MessageFormWidget();
    this.locationForm = new LocationFormWidget();
    this.popup = new PopupWidget();
    this.messages = [];
    this.location = null;
    this.stopRecordFunc = null;
    this.stateMessageForm = null;
    this.connetionStatus = true;
    this.registerEvents();
  }

  async loadMessages(qantity = 10) {
    let lastMessageId;
    if (this.messages.length > 0) lastMessageId = this.messages[this.messages.length - 1].id;
    const messages = await this.API.getMessages(qantity, lastMessageId);
    if (messages.length === 0) return;
    this.messages.push(...messages);
    this.UIManager.drawMessagesAfterBegin(...messages);
  }

  async recordAudio() {
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: true,
      video: false,
    });
    const recorder = new MediaRecorder(stream);
    const chunks = [];
    let interval = null;
    const timeRecord = Date.now();
    recorder.addEventListener('start', () => {
      interval = setInterval(() => {
        const recordingDuration = moment(Date.now() - timeRecord).format('mm:ss');
        this.messageForm.toggleControlState(recordingDuration);
      }, 1000);
    });
    recorder.addEventListener('dataavailable', (evt) => {
      chunks.push(evt.data);
    });
    recorder.addEventListener('stop', async () => {
      clearInterval(interval);
      if (this.stateMessageForm === 'submit') {
        const file = new File(chunks, `audio-${Date.now()}.mp4`, { type: 'audio/mp4' });
        this.createMessage('audio', { audio: file });
      }
    });
    recorder.start();
    return () => {
      recorder.stop();
      stream.getTracks().forEach((track) => track.stop());
    };
  }

  async recordVideo() {
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: true,
      video: true,
    });
    const mutedStream = stream.clone();
    const audioTracks = mutedStream.getAudioTracks();
    audioTracks.forEach((track) => {
      // eslint-disable-next-line no-param-reassign
      track.enabled = false;
    });
    this.messageForm.showVideoPreview(mutedStream);
    const recorder = new MediaRecorder(stream);
    const chunks = [];
    let interval = null;
    const timeRecord = Date.now();
    recorder.addEventListener('start', () => {
      interval = setInterval(() => {
        const recordingDuration = moment(Date.now() - timeRecord).format('mm:ss');
        this.messageForm.toggleControlState(recordingDuration);
      }, 1000);
    });
    recorder.addEventListener('dataavailable', (evt) => {
      chunks.push(evt.data);
    });
    recorder.addEventListener('stop', async () => {
      clearInterval(interval);
      this.messageForm.hideVideoPreview();
      if (this.stateMessageForm === 'submit') {
        const file = new File(chunks, `video-${Date.now()}.mp4`, { type: 'video/mp4' });
        this.createMessage('video', { video: file });
      }
    });
    recorder.start();
    return () => {
      recorder.stop();
      stream.getTracks().forEach((track) => track.stop());
      mutedStream.getTracks().forEach((track) => track.stop());
    };
  }

  async getLocation() {
    if (this.location === null) {
      this.location = await new Promise((resolve, reject) => {
        if (navigator.geolocation) {
          navigator.geolocation.getCurrentPosition(
            (position) => {
              const { latitude, longitude } = position.coords;
              resolve([latitude, longitude]);
            },
            () => {
              this.locationForm.submitFormListener = (coords) => resolve(coords);
              this.locationForm.resetFormListener = () => reject();
              this.locationForm.showForm();
            },
          );
        } else {
          this.locationForm.submitFormListener = (coords) => resolve(coords);
          this.locationForm.resetFormListener = () => reject();
          this.locationForm.showForm();
        }
      });
    }
  }

  async onCreateVideoMessage() {
    if (!window.MediaRecorder) {
      this.popup.show(
        'Что то пошло не так...',
        'Во время записи аудио произошла непредвиденная ошибка. Попробуйте еще раз или смените браузер.',
      );
      this.messageForm.toggleCreateState();
      return;
    }
    try {
      this.stopRecordFunc = await this.recordVideo();
    } catch (error) {
      this.popup.show(
        'Что то пошло не так...',
        'Во время записи видео произошла непредвиденная ошибка. Проверьте доступ к веб-камере и попробуйте еще раз.',
      );
      this.messageForm.toggleCreateState();
    }
  }

  async onCreateAudioMessage() {
    if (!window.MediaRecorder) {
      this.popup.show(
        'Что то пошло не так...',
        'Запись аудио недоступна, Вам необходимо сменить браузер',
      );
      this.messageForm.toggleCreateState();
      return;
    }
    try {
      this.stopRecordFunc = await this.recordAudio();
    } catch (error) {
      this.popup.show(
        'Что то пошло не так...',
        'Запись аудио недоступна. Проверьте доступ к микрофону и попробуйте еще раз.',
      );
      this.messageForm.toggleCreateState();
    }
  }

  checkConnection() {
    if (!this.connetionStatus) {
      this.popup.show(
        'Нет подключения к сети интернет',
        'Вы не можете отправлять и удалять сообщения без подключения к интернету.',
      );
      return false;
    }
    return true;
  }

  async createMessage(type, data) {
    this.messageForm.toggleCreateState();
    this.stopRecordFunc = null;
    this.stateMessageForm = null;
    if (!this.checkConnection()) return;
    try {
      await this.getLocation();
    } catch (error) {
      this.popup.show(
        'Вы не указали местоположение, ай-яй-яй...',
        'Теперь мы не узнаем о Ваших похождениях, а так хотелось',
      );
    }
    const formData = new FormData();
    for (const key in data) {
      if (Object.prototype.hasOwnProperty.call(data, key)) {
        formData.append(key, data[key]);
      }
    }
    formData.append('location', JSON.stringify(this.location));
    await this.API.createMessage(type, formData);
  }

  async onDeleteMessage(id) {
    if (!this.checkConnection()) return;
    await this.API.deleteMessage(id);
  }

  async onUpdateMessages(messageId) {
    const i = this.messages.findIndex(({ id }) => id === messageId);
    if (i === -1) {
      const messages = await this.API.getMessages(10);
      this.messages = messages;
      this.UIManager.redrawMessages(...messages);
    }
  }

  onResetEventForm() {
    if (this.stopRecordFunc === null) return;
    this.stateMessageForm = 'reset';
    this.stopRecordFunc();
  }

  onSubmitEventForm() {
    if (this.stopRecordFunc === null) return;
    this.stateMessageForm = 'submit';
    this.stopRecordFunc();
  }

  onConnection(data) {
    if (data.status !== 'ok') {
      this.connetionStatus = false;
      this.UIManager.showError();
    } else if (this.UIManager.error) {
      this.UIManager.hideError();
      this.UIManager.redrawMessages(...this.messages);
      this.connetionStatus = true;
    }
  }

  registerEvents() {
    this.messageForm.addCreateVideoListener(this.onCreateVideoMessage.bind(this));
    this.messageForm.addCreateAudioListener(this.onCreateAudioMessage.bind(this));
    this.messageForm.addCreateTextListener((text) => this.createMessage('text', { text }));
    this.messageForm.addCreateFileListener((file) => this.createMessage('file', { file }));

    this.messageForm.addResetListener(this.onResetEventForm.bind(this));
    this.messageForm.addSubmitListener(this.onSubmitEventForm.bind(this));

    this.UIManager.subscribeScrollListener(this.loadMessages.bind(this));
    this.UIManager.addDeleteMessageListener(this.onDeleteMessage.bind(this));

    this.API.addConnectionLisntener(this.onConnection.bind(this));
    this.API.addUpdateMessageListener(this.onUpdateMessages.bind(this));
    navigator.serviceWorker.addEventListener('message', (e) => this.onConnection(e.data));
  }
}
