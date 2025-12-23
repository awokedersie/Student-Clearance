/* eslint-disable camelcase */

exports.shorthands = undefined;

exports.up = pgm => {
    pgm.createTable('audit_logs', {
        id: 'id',
        admin_id: {
            type: 'integer',
            references: '"admin"("id")',
            onDelete: 'SET NULL'
        },
        admin_name: { type: 'varchar(255)', notNull: true },
        admin_role: { type: 'varchar(100)', notNull: true },
        action: { type: 'varchar(100)', notNull: true }, // e.g., 'APPROVE', 'REJECT', 'SETTINGS_UPDATE'
        target_student_id: { type: 'varchar(50)' },
        details: { type: 'text' }, // JSON blob or detailed text
        ip_address: { type: 'varchar(45)' }, // Support IPv6
        created_at: { type: 'timestamp', default: pgm.func('current_timestamp') }
    });

    // Indexes for faster lookups
    pgm.createIndex('audit_logs', 'admin_id');
    pgm.createIndex('audit_logs', 'target_student_id');
    pgm.createIndex('audit_logs', 'action');
};

exports.down = pgm => {
    pgm.dropTable('audit_logs');
};
