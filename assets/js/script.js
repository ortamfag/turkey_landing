let headerQuestion = document.querySelector('#headerQuestion')
let headerHint = document.querySelector('#headerHint')

headerQuestion.addEventListener('click', () => headerHint.classList.toggle('active'))