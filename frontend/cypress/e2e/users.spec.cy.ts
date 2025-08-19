// Assumptions for selectors in your templates:
// - Each user row: [data-cy="user-row"]
// - "Change role" action: [data-cy="change-role"]
// - Dialog title: [data-cy="dialog-title"]
// - <mat-select> for role: [data-cy="role-select"]
// - Save button: [data-cy="save"]
// - Cancel button: [data-cy="cancel"]

describe('Users - E2E', () => {
  beforeEach(() => {
    cy.session('oauth-admin', () => {
      cy.oauthStubLogin('admin');
    });
    cy.intercept('GET', '**/users', { fixture: 'users.json' }).as('getUsers');
    cy.visit('/users');
    cy.wait('@getUsers');
  });

  it('opens Update Role dialog and cancels', () => {
    cy.get('[data-cy="user-row"]').first().within(() => {
      cy.get('[data-cy="change-role"]').click();
    });

    cy.get('.mat-mdc-dialog-container').should('be.visible');
    cy.get('[data-cy="dialog-title"]').should('contain', 'Update Role');
    cy.get('[data-cy="cancel"]').click();
    cy.get('.mat-mdc-dialog-container').should('not.exist');
  });

  it('updates user role to EDITOR', () => {
    cy.intercept('POST', '**/users/*/role', {
      statusCode: 200,
      body: { ok: true }
    }).as('updateRole');

    cy.get('[data-cy="user-row"]').first().within(() => {
      cy.get('[data-cy="change-role"]').click();
    });

    cy.get('.mat-mdc-dialog-container').should('be.visible');
    cy.get('[data-cy="role-select"]').click();

    // pick mat-option by its visible label
    cy.get('mat-option').contains(/editor/i).click();

    cy.get('[data-cy="save"]').click();

    cy.wait('@updateRole').its('request.body').should((body) => {
      expect(body).to.have.property('role');
      expect(body.role).to.match(/EDITOR/i);
    });

    cy.get('.mat-mdc-dialog-container').should('not.exist');
  });
});
