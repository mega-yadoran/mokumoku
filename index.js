const functions = require('firebase-functions');
const config = functions.config();

const { App, ExpressReceiver } = require('@slack/bolt');
const store = require('./store');
const modal = require('./block');

const expressReceiver = new ExpressReceiver({
    signingSecret: config.slack.signing_secret,
    endpoints: '/events',
    processBeforeResponse: true
});
const app = new App({
    receiver: expressReceiver,
    token: config.slack.bot_token,
    processBeforeResponse: true
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
        functions.logger.error(error);
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
            functions.logger.error("モーダルのOPENに失敗しました");
            functions.logger.error(error);
        }
    } catch (error) {
        functions.logger.error("ユーザーの作業確認に失敗しました");
        functions.logger.error(error);
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
        functions.logger.error("作業開始処理に失敗しました");
        functions.logger.error(error);
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
        functions.logger.error("作業終了処理に失敗しました");
        functions.logger.error(error);
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
                functions.logger.error("作業終了処理に失敗しました");
                functions.logger.error(error);
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
                functions.logger.error("終了予定時間延長に失敗しました");
                functions.logger.error(error);
            }
            break;
    }
});

// 終了報告をしていない作業の監視
exports.checkAlert = functions.region('asia-northeast1').pubsub.schedule('every 5 minutes').onRun(async (context) => {
    // 終了未報告の作業を作業時間0で終了してユーザーにメッセージを送る
    const worksForFinish = await store.getUnreportedWorks(60, true);
    worksForFinish.forEach(async work => {
        // ユーザーに対してメッセージを送信する
        const msg = `<@${work.user_id}> 作業終了予定時間から1時間が経過したため、作業時間0として記録しました。\n`
            + '(正しい時間を再記録したい場合は管理者に問い合わせてください)';
        await postChat(app.client, msg);
    });

    // 終了未報告のユーザーにアラートを送る
    const worksForAlert = await store.getUnreportedWorks(30);
    worksForAlert.forEach(async work => {
        // ユーザーに対してメッセージを送信する
        const msg = `<@${work.user_id}> 作業終了予定時間を過ぎています。既に作業を終了している場合は終了報告をしてください。\n`
            + '1時間経過するまでに終了報告がなければ作業時間0として記録されます。';

        await postChat(app.client, msg, modal.FINISH_BUTTON);
    });
});

exports.slack = functions.region('asia-northeast1').https.onRequest(expressReceiver.app);