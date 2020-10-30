import Controller from './Controller';

const baseURL = 'https://chaos-organizer.herokuapp.com';

if (navigator.serviceWorker) {
  window.addEventListener('load', async () => {
    try {
      await navigator.serviceWorker.register(
        '/service.worker.js',
        { scope: './' },
      );
    } catch (e) {
      // eslint-disable-next-line no-console
      console.log(e);
    }
  });
}

document.addEventListener('DOMContentLoaded', new Controller(baseURL).loadMessages());
