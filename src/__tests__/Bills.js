/**
 * @jest-environment jsdom
 */

import { screen, waitFor } from "@testing-library/dom"
import '@testing-library/jest-dom/extend-expect'
import BillsUI from "../views/BillsUI.js"
import { bills } from "../fixtures/bills.js"
import { ROUTES_PATH} from "../constants/routes.js"
import {localStorageMock} from "../__mocks__/localStorage.js"
import Bills from "../containers/Bills.js"
import mockStore from "../__mocks__/store"
import { formatDate, formatStatus } from "../app/format.js"
import router from "../app/Router.js";

jest.mock("../app/store", () => mockStore)

const NavigateBillsPageAsEmployee = () => {
  document.body.innerHTML = ""
  Object.defineProperty(window, 'localStorage', { value: localStorageMock })
  window.localStorage.setItem('user', JSON.stringify({
  type: 'Employee'
  }))
  const root = document.createElement("div")
  const scripts = document.createElement('script')
  scripts.type = 'text/javascript'
  scripts.src = "https://maxcdn.bootstrapcdn.com/bootstrap/4.0.0/js/bootstrap.min.js"
  root.setAttribute("id", "root")
  document.body.append(root, scripts)
  router()
  window.onNavigate(ROUTES_PATH.Bills)
}


describe("Given I am connected as an employee", () => {
  describe("When I am on Bills Page", () => {
    
    test("Then bill icon in vertical layout should be highlighted", async () => {
      NavigateBillsPageAsEmployee()
      await waitFor(() => screen.getByTestId('icon-window'))
      const windowIcon = screen.getByTestId('icon-window')
      expect(windowIcon.classList.contains('active-icon')).toBe(true)

    })
    test("Then bills should be ordered from earliest to latest", () => {
      document.body.innerHTML = BillsUI({ data: bills })
      const dates = screen.getAllByText(/^(19|20)\d\d[- /.](0[1-9]|1[012])[- /.](0[1-9]|[12][0-9]|3[01])$/i).map(a => a.innerHTML)
      const antiChrono = (a, b) => ((a < b) ? 1 : -1)
      const datesSorted = [...dates].sort(antiChrono)
      expect(dates).toEqual(datesSorted)
    })
    // tests by sebastien GAULT
    test("Then bills should be retrieved from server", async () => {
      const expectedBills = await (await mockStore.bills().list()).map(bill => {
        return {
          ...bill,
          date: formatDate(bill.date),
          status: formatStatus(bill.status)
        }
      })
      const testBills = new Bills({document, onNavigate, store: mockStore, localStorageMock})
      expect(await testBills.getBills()).toEqual(expectedBills)

    })
    describe("When I click on New Bill Btn", () => {
      test("Then it should redirect to new bill page", async () => {
        NavigateBillsPageAsEmployee()
        await waitFor(() => screen.getByTestId('btn-new-bill'))
        const newBillBtn = screen.getByTestId('btn-new-bill')
        newBillBtn.dispatchEvent(new Event('click'))
        expect(window.location.hash).toBe(ROUTES_PATH.NewBill)
        await waitFor(() => screen.getByTestId('form-new-bill'))
        const newBillForm = screen.getByTestId('form-new-bill')
        expect(newBillForm).toBeInTheDocument()
      })

    })
  })
  describe('When I click on the eye icon of one bill', () => {
    test('Then it should display the bill image file in a modal', async() => {
      NavigateBillsPageAsEmployee()
      await waitFor(() => screen.getAllByTestId('icon-eye'))
      const eyeIcons = screen.getAllByTestId('icon-eye')
      const modal = document.querySelector('.modal')
      eyeIcons.forEach(eyeIcon => {
        eyeIcon.dispatchEvent(new Event('click'))
        expect(modal.classList.contains('show')).toBe(true)
        const imageUrl = eyeIcon.getAttribute('data-bill-url')
        console.log(imageUrl)
        const src = modal.querySelector('img').getAttribute('src')
        expect(src).toEqual(imageUrl)
        modal.querySelector('button.close').dispatchEvent(new Event('click'))
        expect(modal.classList.contains('show')).toBe(false)
      })
    })
  })
})
