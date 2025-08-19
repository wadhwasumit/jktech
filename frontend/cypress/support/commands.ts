declare global {
  namespace Cypress {
    interface Chainable {
      oauthStubLogin(role?: 'editor' | 'admin'): Chainable<void>;
    }
  }
}

Cypress.Commands.add('oauthStubLogin', (role: 'editor' | 'admin' | 'viewwer' = 'editor') => {
  const api = Cypress.env('API_URL') || 'http://localhost:4200'; // match your env.apiUrl

  cy.intercept('POST', `${api}/auth/google`, (req) => {
    req.reply({ fixture: role === 'admin'
      ? 'auth/google-success-admin.json'
      : 'auth/google-success.json'
    });
  }).as('googleExchange');
  cy.visit('/auth/login');
  cy.get('[data-cy="btnGoogleLogin"]').click(); // no #
// But you'll still need cy.visit('/auth/callback?...') unless you automate the real Google page with cy.origin().

  // Hit your real callback route with a fake "code"
//   cy.visit('/auth/callback?code=fake-code');

  // Wait for the exchange to complete
  cy.wait('@googleExchange');

  // Ensure app considered us logged in (it should redirect to dashboard)
  cy.url().should('include', '/dashboard');

  // Optional: assert session storage
  cy.window().then((win) => {
    expect(win.sessionStorage.getItem('jwt')).to.be.a('string');
    expect(win.sessionStorage.getItem('role')).to.be.oneOf(['editor','admin']);
  });
});
