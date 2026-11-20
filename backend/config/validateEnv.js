/**
 * Environment Variable Validator
 * Ensures all required secrets are present before the server starts.
 */

const requiredEnv = [
    'DATABASE_URL',
    'SESSION_SECRET'
];

function validateEnv() {
    const missing = requiredEnv.filter(env => !process.env[env]);

    if (missing.length > 0) {
        console.error('\n' + '!'.repeat(50));
        console.error('🚨 CRITICAL ERROR: MISSING ENVIRONMENT VARIABLES');
        console.error('!'.repeat(50));
        console.error('The following variables are required but missing:');
        missing.forEach(m => console.error(` - ${m}`));
        console.error('!'.repeat(50));
        console.error('Please check your .env file or deployment settings.');
        console.error('!'.repeat(50) + '\n');
        process.exit(1);
    }

    if (process.env.NODE_ENV === 'production' && process.env.SESSION_SECRET === 'dbu-secret-key') {
        console.warn('⚠️ WARNING: Using default SESSION_SECRET in production. This is insecure!');
    }
}

module.exports = validateEnv;
