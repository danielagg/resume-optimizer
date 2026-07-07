# Upcoming — Database + light backend

The user envisions eventually moving persistence from localStorage into a database with a light backend. This would lift the "no backend" ADR constraint, unlock cross-device sessions, and remove the ~5MB localStorage ceiling.

The current storage schema (single dictionary under `resume-optimizer:sessions`) is structurally easy to lift into a backend later — only the I/O functions change, not the data shape.

## Sessions — design notes (resolved, now built)

The open design questions that were captured here before building Sessions have been resolved and are now implemented. Sessions ship as: shared live original Resume in localStorage, per-session Aligned Resume + Notes + Job Posting in a localStorage dictionary, top-right session popover with New/Rename/Delete, returned visitor lands on MRU session's Preview. No migration code (we haven't shipped pre-Sessions, so the schema just changed in place).