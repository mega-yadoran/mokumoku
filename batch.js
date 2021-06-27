require('dotenv').config();
const { App } = require('@slack/bolt');
const store = require('./store');
const block = require('./block');
const log = require('./log');

// Slackアプリ設定
const app = new App({
    token: process.env.SLACK_BOT_TOKEN,
    signingSecret: process.env.SLACK_SIGNING_SECRET
});

// メッセージを投稿する
const postChat = async (client, message, userId, attachments = null) => {
    const logger = log.getLogger();
    try {
        const body = {
            channel: process.env.TARGET_CHANNEL_ID,
            text: message,
            user: userId
        };
        if (attachments) {
            body.attachments = [attachments];
        }
        await client.chat.postEphemeral(body);
    } catch (error) {
        logger.error(error);
    }
};

(async () => {
    const logger = log.getLogger('batch', 'info');
    logger.info('batch スタート');

    try {
        // 終了未報告の作業を作業時間0で終了してユーザーにメッセージを送る
        const worksForFinish = await store.getAndFinishUnreportedWorks(60);
        worksForFinish.map(async work => {
            // ユーザーに対してメッセージを送信する
            const msg = `<@${work.user_id}> 作業終了予定時間から1時間が経過したため、作業時間0として記録しました。\n`
                + '(正しい時間を再記録したい場合は管理者に問い合わせてください)';
            await postChat(app.client, msg, work.user_id);
        });

    } catch (error) {
        logger.error('バッチの実行に失敗しました(強制作業終了記録)');
        logger.error(error);
    }

    try {
        // 終了未報告のユーザーにアラートを送る
        const worksForAlert = await store.getUnAlertedWorks(30);
        worksForAlert.map(async work => {
            // ユーザーに対してメッセージを送信する
            const msg = `<@${work.user_id}> 作業終了予定時間から30分たちました。既に作業を終了している場合は終了報告をしてください。\n`
                + '1時間経過するまでに終了報告がなければ作業時間0として記録されます。';

            await postChat(app.client, msg, work.user_id, block.ALERT_BUTTON_FIELD);
        });
    } catch (error) {
        logger.error('バッチの実行に失敗しました(アラート発砲)');
        logger.error(error);
    }
})();