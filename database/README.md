# A3 database

Use a3-fresh-install.sql for a new empty selected database. It includes organisations,
categories, events and registrations, plus one organisation, five categories,
eight activities and twelve fictional registrations. No database creation, removal
or fixed USE statement is included. Preserve existing data by importing into an empty
database, not an existing installation.

For an existing A2 database, back up first and apply m02-registrations.sql followed
by m02-registration-samples.sql once. charityevents_db.sql is the historical A2 seed;
it drops/recreates its named database and is not the full A3 installer.

Registration uses event/email uniqueness, required fields, a positive-ticket check,
a server timestamp and a restrictive activity foreign key. Event DATETIME values
represent Brisbane local time; registration timestamps are returned as UTC ISO.

Generate the installer from the project root: node scripts/build-deployment-sql.cjs.
The final technical verification exercised a real import into an empty database.
This deliverable contains schema and fictional samples, not personal test data.

Source schema/data: Tianyi Li (A2). Registration schema/samples: Hongke Ouyang.
Deployment SQL generator: Tianyi Li. Final assembly/verification: Hongke Ouyang.
