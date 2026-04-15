module.exports = (client) => {
    process.on('unhandledRejection', (reason, p) => {
        console.error('[Anti-Crash] Unhandled Rejection/Catch:', reason, p);
    });

    process.on('uncaughtException', (err, origin) => {
        console.error('[Anti-Crash] Uncaught Exception/Catch:', err, origin);
    });

    process.on('uncaughtExceptionMonitor', (err, origin) => {
        console.error('[Anti-Crash] Uncaught Exception Monitor:', err, origin);
    });
};
