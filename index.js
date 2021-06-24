const { App } = require('@slack/bolt');
const dayjs = require('dayjs');
const store = require('./store');
const modal = require('./block');
const log4js = require('log4js')

// ログ設定
log4js.configure({
    appenders: {
        system: { type: 'file', filename: `error-${dayjs().format('YYYY-MM-DD')}.log` }
    },
    categories: {
        default: { appenders: ['system'], level: 'error' },
    }
});
const logger = log4js.getLogger('system');

// Slackアプリ設定
const app = new App({
    token: process.env.SLACK_BOT_TOKEN,
    signingSecret: process.env.SLACK_SIGNING_SECRET
});

// チャンネルにメッセージを投稿する
const postChat = async (client, msg, button = null) => {
    try {
        const message = {
            channel: config.slack.target_channel_id,
            text: msg
        };
        if (button) {
            message.attachments = [button];
        }
        await client.chat.postMessage(message);
    } catch (error) {
        logger.error(error);
    }
};

// スラッシュコマンド - 作業中かどうかに応じてモーダルを開く
app.command('/mokumoku', async ({ ack, body, client }) => {
    await ack();

    const userId = body.user_id;

    try {
        // 作業しているかどうかを判定
        const isWorking = await store.isWorking(userId);

        // モーダルを開く
        try {
            if (isWorking) {
                // 作業終了モーダル
                await client.views.open({
                    trigger_id: body.trigger_id,
                    view: modal.END_MODAL
                });
            } else {
                // 作業開始モーダル
                await client.views.open({
                    trigger_id: body.trigger_id,
                    view: modal.START_MODAL
                });
            }
        } catch (error) {
            logger.error("モーダルのOPENに失敗しました");
            logger.error(error);
        }
    } catch (error) {
        logger.error("ユーザーの作業確認に失敗しました");
        logger.error(error);
    }
});

// 作業開始モーダルの送信イベント
app.view('start', async ({ ack, body, view, client }) => {
    // モーダルでのデータ送信イベントを確認
    await ack();

    const goal = view.state.values.block_goal.goal.value;
    const estimatedEndTime = view.state.values.block_estimated_end_time.estimated_end_time.selected_time;
    const userId = body.user.id;

    try {
        await store.startWork(userId, goal, estimatedEndTime);

        // ユーザーに対してメッセージを送信する
        const msg = `<@${userId}>さんが作業を開始しました。\n今日の目標：${goal} \n終了予定時刻：${estimatedEndTime}`;
        await postChat(client, msg);
    } catch (error) {
        logger.error("作業開始処理に失敗しました");
        logger.error(error);
    }
});


// 作業終了モーダルの送信イベント
app.view('end', async ({ ack, body, client }) => {
    // モーダルでのデータ送信イベントを確認
    await ack();

    const userId = body.user.id;

    try {
        // 終了時間を書き込み
        store.endWork(userId);

        // ユーザーに対してメッセージを送信する
        const msg = `<@${userId}>さんが作業を終了しました。お疲れさまでした！`;
        await postChat(client, msg);
    } catch (error) {
        logger.error("作業終了処理に失敗しました");
        logger.error(error);
    }
});

app.action({ callback_id: 'finish_button' }, async ({ ack, body, client }) => {
    // モーダルでのデータ送信イベントを確認
    const userId = body.user.id;
    const action = body.actions[0].value;

    switch (action) {
        case 'finish':
            try {
                await ack({ text: '終了報告を受け付けました' });

                // 終了時間を書き込み
                store.endWork(userId);

                // ユーザーに対してメッセージを送信する
                const msg = `<@${userId}>さんが作業を終了しました。お疲れさまでした！`;
                await postChat(client, msg);
            } catch (error) {
                logger.error("作業終了処理に失敗しました");
                logger.error(error);
            }
            break;
        case 'extend-one-hour':
            try {
                await ack({ text: '延長を受け付けました' });

                // 終了時間を書き込み
                store.extendWorkTime(userId, 60);

                // ユーザーに対してメッセージを送信する
                const msg = `<@${userId}> 終了予定時間を1時間延長しました`;
                await postChat(client, msg);
            } catch (error) {
                logger.error("終了予定時間延長に失敗しました");
                logger.error(error);
            }
            break;
    }
});

// 
(async () => {
    await app.start(process.env.PORT || 3000);
})();