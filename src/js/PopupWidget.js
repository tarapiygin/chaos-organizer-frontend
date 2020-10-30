export default class PopupWidget {
  constructor() {
    this.container = document.querySelector('.popup-container');
    this.element = this.container.querySelector('.popup');
    this.header = this.element.querySelector('.popup_header');
    this.description = this.element.querySelector('.popup_description');
    this.button = this.element.querySelector('.popup_button');

    this.registerEvents();
  }

  show(header, description) {
    this.header.innerText = header;
    this.description.innerText = description;
    this.container.classList.remove('hidden');
  }

  hide() {
    this.header.innerText = '';
    this.description.innerText = '';
    this.container.classList.add('hidden');
  }

  registerEvents() {
    this.button.addEventListener('click', this.hide.bind(this));
  }
}
