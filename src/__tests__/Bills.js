/**
 * @jest-environment jsdom
 */

import { screen, waitFor } from "@testing-library/dom"
import '@testing-library/jest-dom/extend-expect'
import { ROUTES_PATH} from "../constants/routes.js"
import {localStorageMock} from "../__mocks__/localStorage.js"
import Bills from "../containers/Bills.js"
import { bills } from "../fixtures/bills"
import userEvent from '@testing-library/user-event'
import mockStore from "../__mocks__/store"
import { formatDate, formatStatus } from "../app/format.js"
import router from "../app/Router.js";
require('bootstrap')
const $ = require('jquery')

jest.mock("../app/store", () => mockStore)

const NavigateBillsPageAsEmployee = () => {
  document.body.innerHTML = ""
  Object.defineProperty(window, 'localStorage', { value: localStorageMock })
  window.localStorage.setItem('user', JSON.stringify({
  type: 'Employee'
  }))
  const root = document.createElement("div")
  root.setAttribute("id", "root")
  document.body.append(root)
  router()
  window.onNavigate(ROUTES_PATH.Bills)
}


describe("Given I am connected as an employee", () => {
  describe("When I am on Bills Page", () => {
    NavigateBillsPageAsEmployee()
    test("Then bill icon in vertical layout should be highlighted", async () => {
      await waitFor(() => screen.getByTestId('icon-window'))
      const windowIcon = screen.getByTestId('icon-window')
      expect(windowIcon.classList.contains('active-icon')).toBe(true)

    })
    test('Then title should be "Mes notes de frais', () => {
      const title = screen.getByText('Mes notes de frais')
      expect(title).toBeTruthy()
    })

    test('Then new bill button should be present', () => {
      const btn = screen.getByTestId('btn-new-bill')
      expect(btn).toBeTruthy()
    })

    let billList
    test("Then all employee bills should be retrieved from API", async () => {
      billList = (await mockStore.bills().list()).sort((a, b) => new Date(a.date).valueOf() < new Date(b.date).valueOf() ? -1 : 1)
      const expectedLength = billList.length
      await waitFor(() => screen.getByTestId('tbody'))
      const tableLength = screen.getByTestId('tbody').querySelectorAll('tr').length
      expect(tableLength).toEqual(expectedLength)

    })
    test("Then bills should be ordered from earliest to latest", async () => {
      const expectedSort = billList.map(bill => bill.name)
      const billsSorted = []
      screen.getByTestId('tbody').querySelectorAll('tr').forEach(row => billsSorted.push(row.querySelector('td:nth-child(2)').textContent))
      expect(billsSorted).toEqual(expectedSort)
    })
    test('Then dates should be formated', async () => {
      billList.forEach(bill => {
        const expectedFormat = formatDate(bill.date)
        const date = screen.getByText(bill.name).parentElement.querySelector('td:nth-child(3)').textContent
        expect(date).toEqual(expectedFormat)
      })
    })
    test('Then status should be formated', () => {
      billList.forEach(bill => {
        const expectedFormat = formatStatus(bill.status)
        const status = screen.getByText(bill.name).parentElement.querySelector('td:nth-child(5)').textContent
        expect(status).toEqual(expectedFormat)
      })
    })
    test('Then Type column should be filled', () => {
      billList.forEach(bill => {
        const type = screen.getByText(bill.name).parentElement.querySelector('td').textContent
        expect(type).toEqual(bill.type)
      })
    })
    test('Then Amount column should be filled', () => {
      billList.forEach(bill => {
        const amount = screen.getByText(bill.name).parentElement.querySelector('td:nth-child(4)').textContent
        expect(amount).toEqual(bill.amount + ' €')
      })
    })
    test('Then Actions column should be present with an eye icon', () => {
      billList.forEach(bill => {
        const iconEye = screen.getByText(bill.name).parentElement.querySelector('td:nth-child(6) #eye')
        expect(iconEye).toBeTruthy()
      })
    })
  })
  describe('When I am on Bills page a and an error occurs on getting bills', () => {
    test('Then Error page should be displayed with error message', async () => {

      jest.spyOn(mockStore, "bills")
      mockStore.bills.mockImplementationOnce(() => {
        return {
            list: () => Promise.reject(new Error('test erreur 404 ou 500'))
          }
        
      })
      NavigateBillsPageAsEmployee()
      await waitFor(() => screen.getByTestId('error-message'))
      const error = screen.getByTestId('error-message')
      expect(error.textContent).toContain('test erreur 404 ou 500')

    })
  })

  describe('When I am on Bills Page and corrupted data has been introduced', () => {
    test('dates should not be formated', async () => {
      document.body.innerHTML = ""
      const corruptedList = bills.map(bill => {return {
        ...bill,
        date: 'corrupted'
      }} )
      jest.spyOn(mockStore, "bills")
      mockStore.bills.mockImplementationOnce(() => {
        return {
          list: () => { return Promise.resolve(corruptedList)}
        }
      })
      const billsContainer = new Bills({ document, onNavigate: null, store: mockStore, localStorage: null})
      const testBills = await billsContainer.getBills()
      testBills.forEach(bill => {
        expect(bill.date).toEqual('corrupted')
      })
    })
  }) 

  describe("When I am on Bills page and I click on New Bill Btn", () => {
    test("Then it should redirect to new bill page", async () => {
      NavigateBillsPageAsEmployee()
      await waitFor(() => screen.getByTestId('btn-new-bill'))
      const newBillBtn = screen.getByTestId('btn-new-bill')
      userEvent.click(newBillBtn)
      expect(window.location.hash).toBe(ROUTES_PATH.NewBill)
      await waitFor(() => screen.getByTestId('form-new-bill'))
      const newBillForm = screen.getByTestId('form-new-bill')
      expect(newBillForm).toBeInTheDocument()
    })

  })
  
  describe('When I am on Bills page and I click on the eye icon of one bill', () => {
    test('Then it should display the bill image file in a modal', async() => {
      document.body.innerHTML = ""
      NavigateBillsPageAsEmployee()
      await waitFor(() => screen.getAllByTestId('icon-eye'))
      const eyeIcons = screen.getAllByTestId('icon-eye')
      const modal = document.querySelector('#modaleFile')
      expect(modal).toBeTruthy()
      eyeIcons.forEach(eyeIcon => {
        userEvent.click(eyeIcon)
        const imageUrl = eyeIcon.getAttribute('data-bill-url')
        const src = modal.querySelector('img').getAttribute('src')
        expect(src).toEqual(imageUrl)
      })
    })
  })
})
