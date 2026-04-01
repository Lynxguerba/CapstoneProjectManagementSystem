Added the two scripts and made them executable:

  - backup.sh
  - restore.sh

  Usage:

  1. Create backup

  ./backup.sh
  # or
  ./backup.sh my-label

  2. Restore from backup

  ./restore.sh 2026-04-01_15-48-33
  # it will ask confirmation ("restore")

  3. Non-interactive restore

  ./restore.sh 2026-04-01_15-48-33 --yes

  What restore.sh does automatically:

  - verifies checksums
  - creates a pre-restore safety snapshot (backups/pre_restore_<timestamp>)
  - restores DB and storage/app
  - runs quick row-count checks after restore
