import { ROUTES_PATH } from '../constants/routes.js'
import Logout from "./Logout.js"

export default class NewBill {
  constructor({ document, onNavigate, store, localStorage }) {
    this.document = document
    this.onNavigate = onNavigate
    this.store = store
    const formNewBill = this.document.querySelector(`form[data-testid="form-new-bill"]`)
    formNewBill.addEventListener("submit", this.handleSubmit)
    this.file = this.document.querySelector(`input[data-testid="file"]`)
    this.file.addEventListener("change", this.handleChangeFile.bind(this))
    this.fileUrl = null
    this.fileName = null
    this.billId = null
    new Logout({ document, localStorage, onNavigate })
  }
  handleChangeFile(e) {
    e.preventDefault()
    this.SelectedFile = this.file.files[0]
    this.fileName = this.SelectedFile.name
    if(this.SelectedFile) {
      const fileType = this.SelectedFile.type
      if(fileType !== 'image/png' && fileType !== 'image/jpeg') {
        console.log('bad file type')
        this.addError(this.file, 'Mauvais format de fichier, Merci de fournir un fichier jpg, jpeg ou png')
        this.file.classList.add('error')
        this.file.value = ''
        return false
      }
    }
    this.removeError(this.file)
    this.file.classList.remove('error')
    this.formData = new FormData()
    this.formData.append('file', this.SelectedFile)
    this.formData.append('fileName', this.fileName)
  }
  handleSubmit = e => {
    e.preventDefault()
    console.log('e.target.querySelector(`input[data-testid="datepicker"]`).value', e.target.querySelector(`input[data-testid="datepicker"]`).value)
    const email = JSON.parse(localStorage.getItem("user")).email
    const bill = {
      email: email,
      type: e.target.querySelector(`select[data-testid="expense-type"]`).value,
      name:  e.target.querySelector(`input[data-testid="expense-name"]`).value,
      amount: parseInt(e.target.querySelector(`input[data-testid="amount"]`).value),
      date:  e.target.querySelector(`input[data-testid="datepicker"]`).value,
      vat: e.target.querySelector(`input[data-testid="vat"]`).value,
      pct: parseInt(e.target.querySelector(`input[data-testid="pct"]`).value) || 20,
      commentary: e.target.querySelector(`textarea[data-testid="commentary"]`).value,
      fileUrl: undefined,
      fileName: this.fileName,
      status: 'pending'
    }
    this.formData.set('email', bill.email)
    this.formData.set('type', bill.type)
    this.formData.set('name', bill.name)
    this.formData.set('amount', bill.amount)
    this.formData.set('date', bill.date)
    this.formData.set('vat', bill.vat)
    this.formData.set('pct', bill.pct)
    this.formData.set('commentary', bill.commentary)
    this.formData.set('fileUrl', undefined)
    this.formData.set('status', bill.status)

    this.createBill(this.formData)
    this.onNavigate(ROUTES_PATH['Bills'])
  }

  // not need to cover this function by tests
  createBill = (bill) => {
    if (this.store) {
      this.store
      .bills()
      .create({data: bill,
                headers: {
          noContentType: true
        }})
      .then(() => {
        this.onNavigate(ROUTES_PATH['Bills'])
      })
      .catch(error => console.error(error))
    }
  }
  addError(el, msg) {
    const errorSpan = document.createElement('span')
    errorSpan.textContent = msg
    errorSpan.className = 'error-msg'
    el.parentElement.appendChild(errorSpan)
  }
  removeError(el) {
    const error = el.parentElement.querySelector('.error-msg')
    if(error){
      error.remove()
    }
    
  }
}
