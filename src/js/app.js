const button = document.querySelector('.banner__button');
const banner = document.querySelector('.banner__text');
button.addEventListener('click', (e) => {
  e.preventDefault();
  banner.classList.toggle('banner__text--display');
});
