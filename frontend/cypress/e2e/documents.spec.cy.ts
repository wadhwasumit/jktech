// Assumptions for selectors in your templates:
// - Button to open upload dialog: [data-cy="open-upload"]
// - Dialog title: [data-cy="dialog-title"]
// - Title input: [data-cy="doc-title"]
// - Description textarea: [data-cy="doc-description"]
// - File <input type="file">: [data-cy="doc-file"]
// - Save button: [data-cy="save"]
// - Cancel button: [data-cy="cancel"]
// - Each row has [data-cy="doc-row"] and a delete button [data-cy="delete-doc"]

describe('Documents - E2E', () => {
  beforeEach(() => {
    cy.session('oauth-editor', () => {
      cy.oauthStubLogin('editor');
    });
    // List documents
    cy.intercept('GET', '**/documents', { fixture: 'documents.json' }).as('getDocs');
    cy.visit('/documents');
    cy.wait('@getDocs');
  });

  it('opens the upload dialog and cancels', () => {
    cy.get('[data-cy="open-upload"]').click();
    cy.get('.mat-mdc-dialog-container').should('be.visible');
    cy.get('[data-cy="dialog-title"]').should('contain', 'Upload Document');
    cy.get('[data-cy="cancel"]').click();
    cy.get('.mat-mdc-dialog-container').should('not.exist');
  });

  it('uploads a document using fixture data', () => {
    // Stub the upload endpoint
    cy.intercept('POST', '**/documents', {
      statusCode: 201,
      body: { id: 'new-1' },
    }).as('uploadDoc');

    cy.fixture('uploadDoc').then((f) => {
      cy.get('[data-cy="open-upload"]').click();
      cy.get('.mat-mdc-dialog-container').should('be.visible');

      cy.get('[data-cy="doc-title"]').type(f.title);
      cy.get('[data-cy="doc-description"]').type(f.description);

      // selectFile supports built-in file upload without plugins
      cy.get('[data-cy="doc-file"]').selectFile('cypress/fixtures/test.txt', { force: true });

      cy.get('[data-cy="save"]').click();

      cy.wait('@uploadDoc').its('request.body').should((body: FormData) => {
        expect(body).to.be.instanceOf(FormData);
      });

      cy.get('.mat-mdc-dialog-container').should('not.exist');
    });
  });

  it('deletes a document after confirm', () => {
    // Confirm the native confirm dialog
    cy.on('window:confirm', () => true);

    cy.intercept('DELETE', '**/documents/*', { statusCode: 204 }).as('deleteDoc');

    // Click delete on the first row
    cy.get('[data-cy="doc-row"]').first().within(() => {
      cy.get('[data-cy="delete-doc"]').click();
    });

    cy.wait('@deleteDoc').its('response.statusCode').should('eq', 204);
  });
});
