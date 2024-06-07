module.exports = {
    postgres: {
        host: process.env.DB_HOST || '0.0.0.0',
        database: process.env.DB_NAME || 'wallet_dev',
        user: process.env.DB_USER || 'postgres',
        password: process.env.DB_PASSWORD || 'wallet_dev_password',
        port: process.env.DB_PORT || 5432,
        ssl: false,
        debug: false
    },
    bankUrls: {
        bankB: 'http://localhost:9002/api/'
    },
    sentinel: {
        // host: process.env.SNTL_HOST,
        // port: process.env.SNTL_PORT
        host: '127.0.0.1',
        port: '5557'
    }
}