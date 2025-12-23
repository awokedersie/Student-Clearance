/* eslint-disable camelcase */

exports.shorthands = undefined;

exports.up = pgm => {
    // Add approved_by to all
    pgm.addColumns('library_clearance', {
        approved_by: { type: 'varchar(100)' }
    });
    pgm.addColumns('cafeteria_clearance', {
        approved_by: { type: 'varchar(100)' },
        approved_at: { type: 'timestamp' }
    });
    pgm.addColumns('dormitory_clearance', {
        approved_by: { type: 'varchar(100)' },
        approved_at: { type: 'timestamp' }
    });
    pgm.addColumns('department_clearance', {
        approved_by: { type: 'varchar(100)' },
        approved_at: { type: 'timestamp' }
    });
    pgm.addColumns('academicstaff_clearance', {
        approved_by: { type: 'varchar(100)' },
        approved_at: { type: 'timestamp' }
    });
};

exports.down = pgm => {
    pgm.dropColumns('library_clearance', ['approved_by']);
    pgm.dropColumns('cafeteria_clearance', ['approved_by', 'approved_at']);
    pgm.dropColumns('dormitory_clearance', ['approved_by', 'approved_at']);
    pgm.dropColumns('department_clearance', ['approved_by', 'approved_at']);
    pgm.dropColumns('academicstaff_clearance', ['approved_by', 'approved_at']);
};
