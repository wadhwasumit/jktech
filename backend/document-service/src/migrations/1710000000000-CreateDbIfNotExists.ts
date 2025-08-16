import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * IMPORTANT:
 * - Run this migration using a connection to the admin DB (usually "postgres"),
 *   NOT the target DB you want to create.
 * - Ensure the DB user has permission to CREATE DATABASE.
 * - This migration must NOT run inside a transaction.
 */
export class CreateDbIfNotExists1710000000000 implements MigrationInterface {
  // TypeORM v0.3+ uses DataSourceOptions.migrationsTransactionMode (set to 'none').
  // If you can’t change that globally, uncomment the next line for per-migration control in some setups:
  // public transaction = false as const;

  public async up(queryRunner: QueryRunner): Promise<void> {
    const targetDb =
      process.env.PG_TARGET_DB ||
      process.env.METADATA_DB ||
      process.env.MONGODB_DATABASE || // if you keep names here
      'my_app_db';

    // Optional: set owner if you have a dedicated role for the app
    const dbOwner = process.env.PG_DB_OWNER; // e.g., 'app_user' (must already exist)

    // 1) Check existence
    const rows: Array<{ exists: boolean }> = await queryRunner.query(
      `SELECT EXISTS(SELECT 1 FROM pg_database WHERE datname = $1) AS exists`,
      [targetDb],
    );

    const exists = rows?.[0]?.exists === true;

    if (exists) {
      // nothing to do
      return;
    }

    // 2) Create DB (cannot be inside a transaction)
    // NOTE: Double-quote DB name to preserve case if someone sets a mixed-case name.
    const ownerClause = dbOwner ? ` OWNER "${dbOwner}"` : '';
    await queryRunner.query(
      `CREATE DATABASE "${targetDb}" WITH ENCODING 'UTF8' TEMPLATE template1${ownerClause};`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const targetDb =
      process.env.PG_TARGET_DB ||
      process.env.METADATA_DB ||
      process.env.MONGODB_DATABASE ||
      'my_app_db';

    // Safely drop (optional): terminate active connections first.
    // Skip if you don’t want your down() to drop the DB.
    await queryRunner.query(
      `
      DO $$
      BEGIN
        IF EXISTS (SELECT 1 FROM pg_database WHERE datname = $1) THEN
          PERFORM pg_terminate_backend(pid)
          FROM pg_stat_activity
          WHERE datname = $1 AND pid <> pg_backend_pid();

          EXECUTE 'DROP DATABASE "' || $1 || '"';
        END IF;
      END
      $$;
      `,
      [targetDb],
    );
  }
}
