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

    // Contact Messages
    pgm.createTable('contact_messages', {
        id: 'id',
        name: { type: 'varchar(100)', notNull: true },
        email: { type: 'varchar(100)', notNull: true },
        message: { type: 'text', notNull: true },
        submitted_at: { type: 'timestamp', default: pgm.func('current_timestamp') },
        is_read: { type: 'boolean', default: false }
    });

    // Library Clearance
    pgm.createTable('library_clearance', {
        id: 'id',
        student_id: {
            type: 'varchar(50)',
            notNull: true,
            references: '"student"("student_id")',
            onDelete: 'CASCADE'
        },
        name: { type: 'varchar(100)', notNull: true },
        last_name: { type: 'varchar(100)', notNull: true },
        department: { type: 'varchar(100)', notNull: true },
        reason: { type: 'text', notNull: true },
        status: { type: 'varchar(20)', default: 'pending', check: "status IN ('pending', 'approved', 'rejected')" },
        reject_reason: { type: 'text' },
        requested_at: { type: 'timestamp', default: pgm.func('current_timestamp') },
        academic_year: { type: 'varchar(20)' },
        approved_at: { type: 'timestamp' },
        rejected_at: { type: 'timestamp' }
    });

    // Cafeteria Clearance
    pgm.createTable('cafeteria_clearance', {
        id: 'id',
        student_id: {
            type: 'varchar(50)',
            notNull: true,
            references: '"student"("student_id")',
            onDelete: 'CASCADE'
        },
        name: { type: 'varchar(100)', notNull: true },
        last_name: { type: 'varchar(100)', notNull: true },
        department: { type: 'varchar(100)', notNull: true },
        reason: { type: 'text' },
        status: { type: 'varchar(20)', default: 'pending', check: "status IN ('pending', 'approved', 'rejected')" },
        reject_reason: { type: 'text' },
        requested_at: { type: 'timestamp', default: pgm.func('current_timestamp') },
        academic_year: { type: 'varchar(20)' }
    });

    // Dormitory Clearance
    pgm.createTable('dormitory_clearance', {
        id: 'id',
        student_id: {
            type: 'varchar(50)',
            notNull: true,
            references: '"student"("student_id")',
            onDelete: 'CASCADE'
        },
        name: { type: 'varchar(100)', notNull: true },
        last_name: { type: 'varchar(100)', notNull: true },
        department: { type: 'varchar(100)', notNull: true },
        reason: { type: 'text', notNull: true },
        status: { type: 'varchar(20)', default: 'pending', check: "status IN ('pending', 'approved', 'rejected')" },
        requested_at: { type: 'timestamp', default: pgm.func('current_timestamp') },
        reject_reason: { type: 'text' },
        academic_year: { type: 'varchar(20)' }
    });

    // Department Clearance
    pgm.createTable('department_clearance', {
        id: 'id',
        student_id: {
            type: 'varchar(50)',
            notNull: true,
            references: '"student"("student_id")',
            onDelete: 'CASCADE'
        },
        name: { type: 'varchar(100)', notNull: true },
        last_name: { type: 'varchar(100)', notNull: true },
        department: { type: 'varchar(100)', notNull: true },
        reason: { type: 'text' },
        status: { type: 'varchar(20)', default: 'pending', check: "status IN ('pending', 'approved', 'rejected')" },
        requested_at: { type: 'timestamp', default: pgm.func('current_timestamp') },
        reject_reason: { type: 'text' },
        academic_year: { type: 'varchar(20)' }
    });

    // Registrar Clearance
    pgm.createTable('academicstaff_clearance', {
        id: 'id',
        student_id: {
            type: 'varchar(50)',
            notNull: true,
            references: '"student"("student_id")',
            onDelete: 'CASCADE'
        },
        name: { type: 'varchar(100)', notNull: true },
        last_name: { type: 'varchar(100)', notNull: true },
        department: { type: 'varchar(100)', notNull: true },
        reason: { type: 'text' },
        status: { type: 'varchar(20)', default: 'pending', check: "status IN ('pending', 'approved', 'rejected')" },
        requested_at: { type: 'timestamp', default: pgm.func('current_timestamp') },
        reject_reason: { type: 'text' },
        academic_year: { type: 'varchar(20)' }
    });

    // Final Clearance
    pgm.createTable('final_clearance', {
        id: 'id',
        student_id: {
            type: 'varchar(20)',
            notNull: true,
            references: '"student"("student_id")',
            onDelete: 'CASCADE'
        },
        name: { type: 'varchar(50)', notNull: true },
        last_name: { type: 'varchar(50)', notNull: true },
        message: { type: 'text', notNull: true },
        year: { type: 'varchar(10)', notNull: true },
        status: { type: 'varchar(20)', default: 'pending', check: "status IN ('pending', 'approved', 'rejected', 'finalized')" },
        reject_reason: { type: 'varchar(255)' },
        date_sent: { type: 'timestamp', default: pgm.func('current_timestamp') },
        department: { type: 'varchar(100)' },
        academic_year: { type: 'varchar(20)' },
        is_read: { type: 'boolean', default: false },
        email_sent: { type: 'boolean', default: false },
        email_sent_at: { type: 'timestamp' }
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
    pgm.dropTable('final_clearance');
    pgm.dropTable('academicstaff_clearance');
    pgm.dropTable('department_clearance');
    pgm.dropTable('dormitory_clearance');
    pgm.dropTable('cafeteria_clearance');
    pgm.dropTable('library_clearance');
    pgm.dropTable('contact_messages');
    pgm.dropTable('clearance_settings');
    pgm.dropTable('admin');
    pgm.dropTable('student');
};
