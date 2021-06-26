const log4js = require('log4js');
const dayjs = require('dayjs');

// ログ設定
exports.getLogger = () => {
    log4js.configure({
        appenders: {
            system: { type: 'file', filename: `./logs/error-${dayjs().format('YYYY-MM-DD')}.log` }
        },
        categories: {
            default: { appenders: ['system'], level: 'error' },
        }
    });
    return log4js.getLogger('system');
};