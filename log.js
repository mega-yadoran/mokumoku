const log4js = require('log4js');
const dayjs = require('dayjs');

// ログ設定
exports.getLogger = (level = 'info', prefix = null) => {
    const fileName = `${prefix || level}-${dayjs().format('YYYY-MM-DD')}`;
    log4js.configure({
        appenders: {
            system: { type: 'file', filename: `./logs/${fileName}.log` }
        },
        categories: {
            default: { appenders: ['system'], level: level },
        }
    });
    return log4js.getLogger('system');
};