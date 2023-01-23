/**
 * @jest-environment jsdom
 */

import { screen, waitFor } from "@testing-library/dom"
import '@testing-library/jest-dom/extend-expect'
import NewBillUI from "../views/NewBillUI.js"
import NewBill from "../containers/NewBill"
import userEvent from '@testing-library/user-event'
import {localStorageMock} from "../__mocks__/localStorage.js"
import router from "../app/Router.js"
import { ROUTES_PATH} from "../constants/routes.js"

describe("Given I am connected as an employee", () => {
  Object.defineProperty(window, 'localStorage', { value: localStorageMock })
    localStorage.setItem('user', JSON.stringify({
      type: 'Employee',
      email: 'test@test.com'
    }))
  const root = document.createElement("div")
  root.setAttribute("id", "root")
  document.body.append(root)
  router()

  describe("When I am on NewBill Page", () => {
    test('Then only the new bill icon in vertical layout should be highlighted', async () => {
      await waitFor(() => {window.onNavigate(ROUTES_PATH.NewBill)})
      const iconMail = screen.getByTestId('icon-mail')
      const iconWindow = screen.getByTestId('icon-window')
      expect(iconMail.className).toEqual('active-icon')
      expect(iconWindow.className).toEqual('')
    })
    test("Then it should display the title 'Envoyer une note de frais'", () => {
      expect(document.querySelector('.content-title').textContent).toEqual(' Envoyer une note de frais ')
    })
    test('Then it should display the form', () => {
      const form = screen.getByTestId('form-new-bill')
      expect(form).toBeTruthy()
    })
  })

  describe('When I am on NewBill Page and I select a file', () => {
    test('Then it should handle file change', () => {
      const handleChangeFileMock = jest
        .spyOn(NewBill.prototype, 'handleChangeFile')
        .mockImplementationOnce(() => {console.log('mocked file change')})
      
      const html = NewBillUI()
      document.body.innerHTML = html
      new NewBill({ document, onNavigate: null, store: null, localStorage: null })

      const fileInput = screen.getByTestId('file')
      userEvent.upload(fileInput, {})

      expect(handleChangeFileMock).toHaveBeenCalledTimes(1)
    })
  })

  describe('When I am on NewBill page and I select a bad file type', () => {
    const html = NewBillUI()
    document.body.innerHTML = html
    const newBill = new NewBill({ document, onNavigate: null, store: null, localStorage: null })
    
    const testFile = new File(['test'], 'test.test', {
      type: 'text/plain'
    })
    test('Then it should reset the file input value and add an error class to the input', () => {
      jest.spyOn(newBill, 'addError').mockImplementationOnce(() => {error = 1})

      newBill.file = {
        files: [testFile],
        value: 'test.test',
        classList: {
          add: (name) => { error = 1 }
        }
      }
      const fakeEvent = {
        preventDefault: () => { return false }
      }
      let error = 0

      expect(newBill.file.value).toEqual('test.test')

      newBill.handleChangeFile(fakeEvent)

      expect(newBill.SelectedFile.type).toEqual('text/plain')
      expect(newBill.file.value).toEqual('')
      expect(error).toEqual(1)
    })

    test('Then it should display an error message on the file input', () => {
      newBill.file = screen.getByTestId('file')
      userEvent.upload(newBill.file, testFile)
      const errorMsg = newBill.file.parentElement.querySelector('.error-msg')
      expect(errorMsg).toBeVisible()
      expect(errorMsg.textContent.length).toBeGreaterThan(0)
    })
  })

  describe('When I am on NewBill page and I select jpg or jpeg file type', () => {
    const html = NewBillUI()
    document.body.innerHTML = html
    const newBill = new NewBill({ document, onNavigate: null, store: null, localStorage: null })
    const fileInput = screen.getByTestId('file')
      const testFile = new File(['test'], 'test.jpg', {
        type: 'image/jpeg'
      })
    test('Then it should not display an error msg', () => {
      userEvent.upload(fileInput, testFile)
      const errorMsg = fileInput.parentElement.querySelector('.error-msg')
      expect(errorMsg).toBeFalsy()
    })
    test('Then it should save file data to the NewBill instance for a further submit', () => {
      expect(newBill.formData).toBeDefined()
      expect(newBill.formData.get('file')).toEqual(testFile)
      expect(newBill.formData.get('fileName')).toEqual('test.jpg')
    })
  })

  describe('When I am on NewBill page and I select png file type', () => {
    const html = NewBillUI()
    document.body.innerHTML = html
    const newBill = new NewBill({ document, onNavigate: null, store: null, localStorage: null })
    const fileInput = screen.getByTestId('file')
      const testFile = new File(['test'], 'test.png', {
        type: 'image/png'
      })
    test('Then it should not display an error msg', () => {
      userEvent.upload(fileInput, testFile)
      const errorMsg = fileInput.parentElement.querySelector('.error-msg')
      expect(errorMsg).toBeFalsy()
    })
    test('Then it should save file data to the NewBill instance for a further submit', () => {
      expect(newBill.formData).toBeDefined()
      expect(newBill.formData.get('file')).toEqual(testFile)
      expect(newBill.formData.get('fileName')).toEqual('test.png')
    })
  })

  describe('When I am on NewBill page and I already had an error whith file type and I now select a jpg file type', () => {
    const html = NewBillUI()
    document.body.innerHTML = html
    const newBill = new NewBill({ document, onNavigate: null, store: null, localStorage: null })
    const fileInput = screen.getByTestId('file')
      const testFile = new File(['test'], 'test.jpeg', {
        type: 'image/jpeg'
      })
    newBill.addError(fileInput, 'test error')
    fileInput.parentElement.querySelector('.error-msg')
    
    test('Then it should remove the error msg to user', async () => {
      expect(fileInput.parentElement.querySelector('.error-msg')).toBeTruthy()
      expect(newBill.formData).not.toBeDefined()

      userEvent.upload(fileInput, testFile)

      expect(fileInput.parentElement.querySelector('.error-msg')).toBeFalsy()
      
    })
    test('Then it should save file data to the NewBill instance for a further submit', () => {
      expect(newBill.formData).toBeDefined()
      expect(newBill.formData.get('file')).toEqual(testFile)
      expect(newBill.formData.get('fileName')).toEqual('test.jpeg')
    })
  })

  describe('When I am on NewBill page and I have filled the form and I click on submit button', () => {
    let saved
    const storeMock = {
      bills: () => {
        return {
          create: (bill = null) => {
              if(bill){
                saved = bill
                return Promise.resolve(bill)
              } else {
                return Promise.reject('test erreur')
              }
          }
        }
      }

    }
    let redirectedPath;
    const html = NewBillUI()
    document.body.innerHTML = html
    const newBill = new NewBill({ document, onNavigate: (path) => {
      redirectedPath = path
    }, store: storeMock, localStorage })

    // define test formData
    const testFile = new File(['test'], 'test.png', {
      type: 'image/png'
    })
    const testForm ={
      name: 'test1',
      date: '2023-01-01',
      type: 'Services en ligne',
      amount: '500',
      vat: '20',
      pct: '5',
      commentary: 'commentary test',
      status: 'pending',
      fileUrl: 'undefined',
      file: {...testFile},
      fileName: 'test.png',
      email: 'test@test.com'
    }
    const form = screen.getByTestId('form-new-bill')

    const fileInput = screen.getByTestId('file')
      const expenseInput = screen.getByTestId('expense-type')
      const nameInput = screen.getByTestId('expense-name')
      const dateInput = screen.getByTestId('datepicker')
      const amoutInput = screen.getByTestId('amount')
      const vatInput = screen.getByTestId('vat')
      const pctInput = screen.getByTestId('pct')
      const commentaryInput = screen.getByTestId('commentary')
      
      userEvent.upload(fileInput, testFile)

      nameInput.value = testForm.name
      dateInput.value = testForm.date
      expenseInput.value = testForm.type
      amoutInput.value = testForm.amount
      vatInput.value = testForm.vat
      pctInput.value = testForm.pct
      commentaryInput.value = testForm.commentary

      form.submit()

    test('Then all the form data should be retrieved before to create a new bill on de server', () => {
      const formData = {}
      for( const data of newBill.formData.entries()) {
        data[0] === 'file' ? formData.file = {...data[1]} : formData[data[0]] = data[1]
      }
      expect(formData).toEqual(testForm)
    })

    test('Then the form data should be sent to server to create the bill', () => {
      const savedData = {}
      for( const data of saved.data.entries()) {
        data[0] === 'file' ? savedData.file = {...data[1]} : savedData[data[0]] = data[1]
      }
     expect(savedData).toEqual(testForm)
    })
    test('Then it should redirect to Bills page', () => {
      expect(redirectedPath).toEqual('#employee/bills')
    })
  })
})
