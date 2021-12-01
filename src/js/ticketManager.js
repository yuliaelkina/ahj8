/* eslint-disable  consistent-return */
/* eslint-disable no-underscore-dangle */
/* eslint-disable no-unused-vars */
/* eslint-disable  no-param-reassign */
/* eslint-disable  no-plusplus */
/* eslint-disable  no-lonely-if */
/* eslint  guard-for-in: "off" */

export default class ticketManager {
  constructor(element) {
    if (typeof element === 'string') {
      element = document.querySelector(element);
    }
    this._element = element;
    this.taskList = this._element.querySelector('.task__list');
    this.url = 'https://ajs7server.herokuapp.com';
    this.newTicketButton = this._element.querySelector('.helpdesk__new');
    this.newTicketModal = this._element.querySelector('.modal--newtask');
  }

  init() {
    this.newTicketButton.addEventListener('click', () => {
      this.newTicketModal.classList.add('modal--display');
      this.newTicketModal.querySelector('.modal--newtask__button--cancel').addEventListener('click', (e) => {
        e.preventDefault();
        this.newTicketModal.classList.remove('modal--display');
      });
      this.newTicketModal.querySelector('.modal__form--add').addEventListener('submit', (e) => {
        e.preventDefault();
        const name = this.newTicketModal.querySelector('.modal--newtask__input--short').value;
        const description = this.newTicketModal.querySelector('.modal--newtask__input--long').value;
        this.createTicket(name, description);
        this.newTicketModal.classList.remove('modal--display');
      });
    });
    this.redrawDesk();
  }

  createXHR(method, info) {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      const params = new URLSearchParams();
      for (const key in info) {
        params.append(key, info[key]);
      }
      if (method === 'GET') {
        xhr.open(method, `${this.url}?${params}`);
        xhr.send();
      } else if (method === 'POST') {
        xhr.open(method, this.url);
        xhr.send(params);
      }
      xhr.addEventListener('load', () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            const data = xhr.responseText;
            resolve(data);
          } catch (e) {
            reject(new Error(`${xhr.status}: ${xhr.statusText}`));
          }
        }
      });
    });
  }

  redrawDesk() {
    this.createXHR('GET', { method: 'allTickets' }).then((data) => {
      const arr = JSON.parse(data);
      if (Array.isArray(arr)) {
        this.taskList.innerHTML = '';
        arr.forEach((element) => {
          const taskElement = document.createElement('li');
          const date = new Date(element.created);
          const dateString = `${date.getDate()}.${date.getMonth()}.${date.getFullYear()} ${date.getHours()}:${date.getMinutes()}`;
          taskElement.classList.add('task__item');
          taskElement.dataset.id = `${element.id}`;
          taskElement.innerHTML = `
            <div class="task__main">
              <div class="task__left">
                <div class="task__checker"></div>
                <div class="task__title">${element.name}</div>
                <div class="task__time">${dateString}</div>
              </div>
              <div class="task__buttons">
                <button type="button" class="task__change">&#9998</button>
                <button type="button" class="task__delete">X</button>
              </div>
            </div>`;
          this.taskList.append(taskElement);
          if (element.status === 'true') {
            taskElement.querySelector('.task__checker').classList.add('task__checker__checked');
          }
          taskElement.addEventListener('click', (evt) => {
            this.ticketOnClick(evt.target);
          });
        });
      } else {
        alert('ошибка сервера');
      }
    });
  }

  createTicket(name, description) {
    this.createXHR('POST', { method: 'createTicket', name: `${name}`, description: `${description}` }).then((data) => {
      console.log(data);
      this.redrawDesk();
    });
  }

  ticketOnClick(target) {
    const { id } = target.closest('.task__item').dataset;
    if (target.classList.contains('task__checker')) {
      this.changeStatus(id);
    } else if (target.classList.contains('task__change')) {
      this.changeTicket(id);
    } else if (target.classList.contains('task__delete')) {
      this.deleteTicketModal(id);
    } else {
      this.viewFull(id, target.closest('.task__item'));
    }
  }

  changeStatus(id) {
    this.createXHR('POST', { method: 'changeStatus', id: `${id}` }).then((data) => {
      this.redrawDesk();
    });
  }

  changeTicket(id) {
    const changingModal = this._element.querySelector('.modal--change');
    changingModal.classList.add('modal--display');
    changingModal.querySelector('.modal--change__button--cancel').addEventListener('click', (e) => {
      changingModal.classList.remove('modal--display');
    });
    const changingForm = changingModal.querySelector('.modal__form--change');
    changingForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const name = changingModal.querySelector('.modal--change__input--short').value;
      const description = changingModal.querySelector('.modal--change__input--long').value;
      this.refreshTicket(id, name, description, changingModal);
    });
  }

  refreshTicket(id, name, description, modal) {
    this.createXHR('POST', {
      method: 'updateTicket', id: `${id}`, name: `${name}`, description: `${description}`,
    }).then((data) => {
      modal.classList.remove('modal--display');
      modal.querySelector('.modal--change__input--short').value = '';
      modal.querySelector('.modal--change__input--long').value = '';
      this.redrawDesk();
    });
  }

  deleteTicketModal(id) {
    const deletingModal = this._element.querySelector('.modal--delete');
    deletingModal.classList.add('modal--display');
    deletingModal.querySelector('.modal--delete__button--cancel').addEventListener('click', (e) => {
      e.preventDefault();
      deletingModal.classList.remove('modal--display');
    });
    deletingModal.querySelector('.modal--delete__button--enter').addEventListener('click', (e) => {
      e.preventDefault();
      this.deleteTicket(id, deletingModal);
    });
  }

  deleteTicket(id, modal) {
    this.createXHR('POST', { method: 'deleteTicket', id: `${id}` }).then((data) => {
      modal.classList.remove('modal--display');
      this.redrawDesk();
    });
  }

  viewFull(id, item) {
    if (item.querySelector('.task__description')) {
      item.removeChild(item.querySelector('.task__description'));
    } else {
      this.getFull(id, item);
    }
  }

  getFull(id, item) {
    this.createXHR('GET', { method: 'ticketById', id: `${id}` }).then((data) => {
      const desc = document.createElement('div');
      desc.classList.add('task__description');
      desc.innerText = JSON.parse(data).description;
      item.append(desc);
    });
  }
}
