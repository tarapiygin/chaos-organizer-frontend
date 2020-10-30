import getCoordsFromYMap from './geolocation';

export default class LocationFormWidget {
  constructor() {
    this.container = document.querySelector('.location-form-container');
    this.form = this.container.querySelector('.location-form');
    this.resetBtn = this.form.querySelector('.location-form_reset-btn');
    this.submitBtn = this.form.querySelector('.location-form_submit-btn');
    this.submitFormListener = null;
    this.resetFormListener = null;
    this.registerEvents();
  }

  showForm() {
    this.container.classList.remove('hidden');
  }

  hideForm() {
    this.hideErrors();
    this.container.classList.add('hidden');
  }

  showErrors() {
    const errorEl = document.createElement('div');
    errorEl.classList.add('location-form_error');
    errorEl.innerText = 'Произошла непредвиденная ошибка, попробуйте еще раз.';
    this.form.after(errorEl);
  }

  hideErrors() {
    const errorsEl = this.form.querySelectorAll('.location-form_error');
    errorsEl.forEach((element) => element.remove());
  }

  async onSubmitForm(event) {
    event.preventDefault();
    try {
      const coords = await getCoordsFromYMap();
      this.hideForm();
      this.submitFormListener.call(null, coords);
    } catch (error) {
      this.showErrors();
    }
  }

  async onClickResetForm() {
    this.resetFormListener.call(null);
    this.hideForm();
  }

  registerEvents() {
    this.submitBtn.addEventListener('click', this.onSubmitForm.bind(this));
    this.resetBtn.addEventListener('click', this.onClickResetForm.bind(this));
  }
}
