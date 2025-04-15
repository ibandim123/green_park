describe('Main Test', () => {
  it('Verify routes: boletos', () => {
    cy.request('http://localhost:3000/api/boletos') 
  })


})