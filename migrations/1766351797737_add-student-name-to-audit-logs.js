/* eslint-disable camelcase */

exports.shorthands = undefined;

exports.up = pgm => {
    pgm.addColumn('audit_logs', {
        target_student_name: { type: 'varchar(255)' }
    });
};

exports.down = pgm => {
    pgm.dropColumn('audit_logs', 'target_student_name');
};
