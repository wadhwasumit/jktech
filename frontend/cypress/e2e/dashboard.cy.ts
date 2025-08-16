describe('Post App - E2E Tests', () => {
    beforeEach(() => {
        cy.visit('/dashboard'); // Visit the home page before each test
    });

    it('should open dialog on button click and validate content', () => {
        // Click the button to open the dialog
        cy.get('#add-post').click();

        // Verify that the dialog is open
        cy.get('.mat-mdc-dialog-container').should('be.visible');

        // Check if the dialog contains the expected text
        cy.get('[data-cy="dialog-title"]').should('contain', 'on your Mind');

        // Close the dialog
        cy.get('button').contains('Cancel').click();

        // Ensure dialog is closed
        cy.get('.mat-mdc-dialog-container').should('not.exist');
    });

    it('should open the add post dialog and submit data from fixture', function () {
        // Load test data from fixture
        cy.fixture('addPost').then((post) => {
            // Open the Add Post Dialog
            cy.get('#add-post').click();

            // Verify that the dialog appears
            cy.get('.mat-mdc-dialog-container').should('be.visible');

            // Fill in the form using fixture data
            cy.get('[data-cy="post-title"]').type(post.title);
            cy.get('[data-cy="post-description"]').type(post.description);

            // Submit the form
            cy.get('[data-cy="save"]').click();

            // Ensure dialog closes after submission
            cy.get('.mat-mdc-dialog-container').should('not.exist');

        });
    });
});
