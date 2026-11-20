/* eslint-disable camelcase */

exports.shorthands = undefined;

exports.up = pgm => {
    // Enable UUID extension if needed, though we seem to use SERIAL

    // Students Table
    pgm.createTable('student', {
        id: 'id',
        student_id: { type: 'varchar(50)', notNull: true, unique: true },
        name: { type: 'varchar(50)', notNull: true },
        last_name: { type: 'varchar(50)', notNull: true },
        phone: { type: 'varchar(20)', notNull: true },
        email: { type: 'varchar(100)', notNull: true, unique: true },
        department: { type: 'varchar(100)', notNull: true },
        username: { type: 'varchar(50)', notNull: true, unique: true },
        password: { type: 'varchar(255)', notNull: true },
        year: { type: 'varchar(20)', default: '1st Year' },
        semester: { type: 'varchar(10)', default: '1' },
        profile_picture: { type: 'varchar(255)' },
        status: { type: 'varchar(20)', default: 'active', check: "status IN ('active', 'inactive')" },
        reset_code: { type: 'varchar(10)' },
        reset_code_expires: { type: 'timestamp' }
    });

    // Admin Table
    pgm.createTable('admin', {
        id: 'id',
        name: { type: 'varchar(50)', notNull: true },
        last_name: { type: 'varchar(50)', notNull: true },
        username: { type: 'varchar(50)', notNull: true, unique: true },
        password: { type: 'varchar(255)', notNull: true },
        email: { type: 'varchar(100)', notNull: true, unique: true },
        phone: { type: 'varchar(20)', notNull: true },
        role: { type: 'varchar(50)', notNull: true },
        department_name: { type: 'varchar(100)' }
    });

    // Clearance Settings
    pgm.createTable('clearance_settings', {
        id: 'id',
        academic_year: { type: 'varchar(20)', notNull: true },
        start_date: { type: 'timestamp', notNull: true },
        end_date: { type: 'timestamp', notNull: true },
        is_active: { type: 'boolean', default: false },
        extension_days: { type: 'integer', default: 0 },
        created_at: { type: 'timestamp', default: pgm.func('current_timestamp') },
        updated_at: { type: 'timestamp', default: pgm.func('current_timestamp') }
    });


    // Unified Clearance Requests Table
    pgm.createTable('clearance_requests', {
        id: 'id',
        student_id: {
            type: 'varchar(50)',
            notNull: true,
            references: '"student"("student_id")',
            onDelete: 'CASCADE'
        },
        name: { type: 'varchar(100)', notNull: true },
        last_name: { type: 'varchar(100)', notNull: true },
        student_department: { type: 'varchar(100)', notNull: true },
        target_department: { type: 'varchar(50)', notNull: true },
        reason: { type: 'text' },
        status: { type: 'varchar(20)', default: 'pending', check: "status IN ('pending', 'approved', 'rejected')" },
        reject_reason: { type: 'text' },
        academic_year: { type: 'varchar(20)', notNull: true },
        requested_at: { type: 'timestamp', default: pgm.func('current_timestamp') },
        approved_at: { type: 'timestamp' },
        rejected_at: { type: 'timestamp' },
        approved_by: { type: 'varchar(100)' },
        is_read: { type: 'boolean', default: false },
        notification_message: { type: 'text' }
    });

    // Special Clearance Students
    pgm.createTable('special_clearance_students', {
        id: 'id',
        student_id: { type: 'varchar(50)', notNull: true, unique: true },
        student_name: { type: 'varchar(100)', notNull: true },
        exception_type: { type: 'varchar(20)', notNull: true, check: "exception_type IN ('withdrawal', 'transfer', 'disciplinary', 'medical', 'other')" },
        reason: { type: 'text', notNull: true },
        granted_by: { type: 'integer', notNull: true },
        granted_at: { type: 'timestamp', default: pgm.func('current_timestamp') },
        expires_at: { type: 'date' },
        is_active: { type: 'boolean', default: true },
        notes: { type: 'text' }
    });
};

exports.down = pgm => {
    pgm.dropTable('special_clearance_students');
    pgm.dropTable('clearance_requests');
    pgm.dropTable('clearance_settings');
    pgm.dropTable('admin');
    pgm.dropTable('student');
};
