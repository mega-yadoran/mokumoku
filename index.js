require('dotenv').config();
const { App } = require('@slack/bolt');
const store = require('./store');
const block = require('./block');
const log = require('./log');
const summary = require('./summary');

// Slackアプリ設定
const app = new App({
    token: process.env.SLACK_BOT_TOKEN,
    signingSecret: process.env.SLACK_SIGNING_SECRET
});

// メッセージを投稿する
// userIdを指定した場合はEphemeral(あなただけに表示されています)メッセージで送る
const postChat = async (logger, client, message, userId = null, attachments = null) => {
    try {
        const body = {
            channel: process.env.TARGET_CHANNEL_ID,
            text: message
        };
        if (attachments) {
            body.attachments = [attachments];
        }
        if (userId) {
            body.user = userId;
            await client.chat.postEphemeral(body);
        } else {
            await client.chat.postMessage(body);
        }
    } catch (error) {
        logger.error('メッセージの送信に失敗しました');
        logger.error('body: ' + body);
        logger.error(error);
    }
};

// Block KitのUIを投稿する
// userIdを指定した場合はEphemeral(あなただけに表示されています)メッセージで送る
const postBlock = async (logger, client, blocks, userId = null) => {
    try {
        const body = {
            channel: process.env.TARGET_CHANNEL_ID,
            blocks: blocks
        };
        if (userId) {
            body.user = userId;
            await client.chat.postEphemeral(body);
        } else {
            await client.chat.postMessage(body);
        }
    } catch (error) {
        logger.error('メッセージの送信に失敗しました');
        logger.error('body: ' + body);
        logger.error(error);
    }
};

// スラッシュコマンド/mokumoku - 作業中かどうかに応じて開始/終了モーダルを開く
app.command('/mokumoku', async ({ ack, body, client }) => {
    const logger = log.getLogger();
    logger.info('mokumoku slash command called.');

    await ack();

    const parameter = body.text;
    const userId = body.user_id;

    switch (parameter) {
        case 'help':
            await showHelp(logger, client, userId);
            break;
        default:
            await openStartOrEndModal(logger, client, body.trigger_id, userId, logger);
            break;
    }
});

const showHelp = async (logger, client, userId) => {
    const message = 'command help test';
    await postChat(logger, client, message, userId);
};

const openStartOrEndModal = async (logger, client, triggerId, userId) => {
    try {
        // 作業しているかどうかを判定
        const isWorking = await store.isWorking(userId);

        // モーダルを開く
        try {
            if (isWorking) {
                // 作業中の場合、作業終了モーダルを開く
                await client.views.open({
                    trigger_id: triggerId,
                    view: block.END_MODAL
                });
            } else {
                // 作業中でない場合、作業開始モーダルを開く
                await client.views.open({
                    trigger_id: triggerId,
                    view: block.START_MODAL
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
};

// 作業開始モーダルの送信イベント
app.view('start', async ({ ack, body, view, client }) => {
    const logger = log.getLogger();
    // モーダルでのデータ送信イベントを確認
    await ack();

    const goal = view.state.values.block_goal.goal.value;
    const estimatedEndTime = view.state.values.block_estimated_end_time.estimated_end_time.selected_time;
    const userId = body.user.id;

    try {
        await store.startWork(userId, goal, estimatedEndTime);

        // ユーザーに対してメッセージを送信する
        const message = `<@${userId}>さんが作業を開始しました。\n今日の目標：${goal} \n終了予定時刻：${estimatedEndTime}`;
        await postChat(logger, client, message);
    } catch (error) {
        logger.error("作業開始処理に失敗しました");
        logger.error(error);
    }
});


// 作業終了モーダルの送信イベント
app.view('end', async ({ ack, body, client }) => {
    const logger = log.getLogger();
    // モーダルでのデータ送信イベントを確認
    await ack();

    const userId = body.user.id;
    await finishWork(logger, client, userId);
});

// アラートメッセージから作業終了or延長ボタンが押された場合の処理
app.action({ callback_id: 'alert_button' }, async ({ ack, body, client }) => {
    const logger = log.getLogger();
    const userId = body.user.id;
    const action = body.actions[0].value;

    // 作業終了後に押された場合、ユーザーにメッセージを送信して終了
    const isWorking = await store.isWorking(userId);
    if (!isWorking) {
        await ack({ text: '既に作業が終了しているようです' });
        return;
    }

    // 押されたボタンによって処理分岐
    switch (action) {
        case 'finish':
            await ack({ text: '終了報告を受け付けました' });
            await finishWork(logger, client, userId);
            break;
        case 'extend-one-hour':
            await ack({ text: '延長を受け付けました' });
            await extendWorkTime(logger, client, userId, 1);
            break;
        case 'extend-two-hour':
            await ack({ text: '延長を受け付けました' });
            await extendWorkTime(logger, client, userId, 2);
            break;
        case 'extend-three-hour':
            await ack({ text: '延長を受け付けました' });
            await extendWorkTime(logger, client, userId, 3);
            break;
    }
});

// 作業終了処理
const finishWork = async (logger, client, userId) => {
    try {
        // 終了時間を書き込み
        store.endWork(userId);

        // ユーザーに対してメッセージを送信する
        const message = `<@${userId}>さんが作業を終了しました。お疲れさまでした！`;
        await postChat(logger, client, message);
    } catch (error) {
        logger.error("作業終了処理に失敗しました");
        logger.error(error);
    }
}

// 終了時間を延長するボタンを押された時の実処理
const extendWorkTime = async (logger, client, userId, hour) => {
    try {
        // 終了時間を時間伸ばす
        const estimatedEndTime = await store.extendWorkTime(userId, hour * 60);

        // ユーザーに対してメッセージを送信する
        const message = `<@${userId}> 終了予定時間を${hour}時間延長しました (${estimatedEndTime}まで)`;
        await postChat(logger, client, message, userId);
    } catch (error) {
        logger.error("終了予定時間延長に失敗しました");
        logger.error(error);
    }
};

// スラッシュコマンド/mokumoku - 作業中かどうかに応じて開始/終了モーダルを開く
app.command('/mokumoku-summary', async ({ ack, body, client }) => {
    const logger = log.getLogger();
    logger.info('mokumoku-summary slash command called.');
    await ack();

    try {
        const userId = body.user_id;
        const blocks = await summary.getSummaryBlocks(userId);
        await postBlock(logger, client, blocks, userId);
    } catch (error) {
        logger.error("作業実績の送信に失敗しました");
        logger.error(error);
    }
});

// サーバーを立ち上げる
(async () => {
    const server = await app.start(process.env.PORT || 3000);
    log.getLogger().info(`Bolt app is running! PORT: ${server.address().port}`);
})();