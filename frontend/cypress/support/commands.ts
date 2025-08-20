// cypress/support/commands.ts
/// <reference types="cypress" />

declare global {
  namespace Cypress {
    interface Chainable {
      /**
       * Custom command to log in with Google API.
       * Stores Google user details and token in localStorage.
       */
      oauthStubLogin(role?: 'editor' | 'admin'): Chainable<void>;
    }
  }
}
import { domain as Auth0Domain } from './auth_config.json'

function logIntoGoogle(username: string, password: string, name: string) {
  Cypress.on(
    'uncaught:exception',
    (err) =>
      !err.message.includes('ResizeObserver loop') &&
      !err.message.includes('Error in protected function')
  )
  cy.visit('http://localhost:4200')
  cy.get('#btnGoogleLogin').click()

  cy.origin("accounts.google.com", () => {
    cy.scrollTo('bottom')
    cy.get('form[data-provider="google"]').submit()
  })
  // cy.visit('https://accounts.google.com')
  cy.wait(1000) // Wait for the page to load
  cy.origin(
    'https://accounts.google.com',
    {
      args: {
        username,
        password,
      },
    },
    ({ username, password }) => {
      Cypress.on(
        'uncaught:exception',
        (err) =>
          !err.message.includes('ResizeObserver loop') &&
          !err.message.includes('Error in protected function')
      )

      cy.get('input[type="email"]').type(username, {
        log: false,
      })
      // NOTE: The element exists on the original form but is hidden and gets rerendered, which leads to intermittent detached DOM issues
      cy.contains('Next').click().wait(4000)
      cy.get('[type="password"]').type(password, {
        log: false,
      })
      cy.contains('Next').click().wait(4000)
    }
  )

  cy.get('h6.dropdown-header').should('contain', name)
}

Cypress.Commands.add('oauthStubLogin', (role: 'editor' | 'admin' | 'viewwer' = 'editor') => {
  cy.log('Logging in to Google');
  cy.request<{
    access_token: string;
    id_token: string;
  }>({
    method: 'POST',
    url: 'https://www.googleapis.com/oauth2/v4/token',
    body: {
      grant_type: 'refresh_token',
      client_id: Cypress.env('googleClientId'),
      client_secret: Cypress.env('googleClientSecret'),
      refresh_token: Cypress.env('googleRefreshToken'),
    },
  }).then(({ body }) => {
    const { access_token, id_token } = body;

    cy.request<{
      sub: string;
      email: string;
      given_name: string;
      family_name: string;
      picture: string;
    }>({
      method: 'GET',
      url: 'https://www.googleapis.com/oauth2/v3/userinfo',
      headers: { Authorization: `Bearer ${access_token}` },
    }).then(({ body }) => {
      cy.log(JSON.stringify(body));

      // const userItem = {
      //   token: id_token,
      //   user: {
      //     googleId: body.sub,
      //     email: body.email,
      //     givenName: body.given_name,
      //     familyName: body.family_name,
      //     imageUrl: body.picture,
      //   },
      // };

      window.sessionStorage.setItem('jwt',id_token);
      window.sessionStorage.setItem('userId',body.sub);
      window.sessionStorage.setItem('role',role);
      // Optional: assert session storage
      cy.window().then((win) => {
        expect(win.sessionStorage.getItem('jwt')).to.be.a('string').and.not.be.empty;
        expect(win.sessionStorage.getItem('role')).to.be.oneOf(['editor', 'admin', 'viewer']);
      });
      
      cy.visit('http://localhost:4200/');
    });
  });
});

export {}; // 👈 ensures this file is treated as a module
