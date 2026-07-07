# Error Log

Every error is useful evidence. Record the cause and the rule you learned.

## Template

```text
Date:
Lesson:
Error Message:
What I was trying to do:
Why it happened:
How I fixed it:
Rule I learned:
```

## Entries

### Date: 2026-05-13

Lesson: Sales Revenue Calculator

Error Message: NameError: name 'units_price' is not defined. Did you mean: 'unit_price'?

What I was trying to do: print the unit price in the sales revenue calculator.

Why it happened: The variable was created as `unit_price`, but later typed as `units_price`.

How I fixed it: Change `units_price` to `unit_price`.

Rule I learned: variable names must be exactly the same every time.

### Date: 2026-06-05

Lesson: Pandas Notebook Setup + Read CSV

Error Message: FileNotFoundError: No such file or directory:
`python_supply_chain_learning/03_data/superstore.csv`

What I was trying to do: Read `superstore.csv` from a VS Code notebook using
`pd.read_csv()`.

Why it happened: The notebook was running from a different working directory
than expected, so the relative path did not point to the CSV file.

How I fixed it: Used `Path` with the full CSV location first, then checked the
file with `data_file.exists()` before reading it.

Rule I learned: Before reading a CSV, confirm the file path. If
`data_file.exists()` returns `False`, pandas will not be able to read it.

### Date: 2026-06-20

Lesson: Supabase Olist PostgreSQL Connection

Error Message: Connection error: connection failed: connection to server at
`44.252.246.120`, port `5432` failed: FATAL: `(ENOTFOUND) tenant/user
postgres.ylmuvsdegmpoiygbtipi not found`

What I was trying to do: Connect VS Code PostgreSQL extension to the Supabase
Olist practice database.

Why it happened: The Supabase pooler did not accept the connection profile as
entered manually in the VS Code connection form. The connection requires the
exact session pooler host, project-scoped username, database name, and SSL mode.

How I fixed it: Added a VS Code `pgsql.connections` profile named
`Supabase Olist Practice` with the correct host, port, database, username, and
SSL mode. The password was not saved in project files or VS Code settings.

Rule I learned: For Supabase session pooler connections, use the exact pooler
URL values and keep the database password out of saved files.

### Date: 2026-06-28

Lesson: Supabase Olist PostgreSQL Connection

Error Message: `pgsql: Failed to connect: Connection error: connection failed:
connection to server at "44.225.139.66", port 5432 failed: fe_sendauth: no
password supplied`

What I was trying to do: Run the first SQL query from VS Code using the
Microsoft PostgreSQL extension.

Why it happened: The Supabase database requires a password, but the VS Code
connection attempt did not send one. The same Supabase connection works from
`psql` when a password is entered at the prompt.

How I fixed it: Verified with `psql` that the Supabase pooler connection works
and that the selected query returns `database_name = postgres`. The VS Code
connection profile still needs the password entered through the extension UI.

Rule I learned: If PostgreSQL says `no password supplied`, the server was
reachable, but the client did not send a password.
