exports.END_MODAL = {
    "type": "modal",
    "callback_id": 'end',
    "submit": {
        "type": "plain_text",
        "text": "作業終了"
    },
    "close": {
        "type": "plain_text",
        "text": "キャンセル"
    },
    "title": {
        "type": "plain_text",
        "text": "Slackもくもく会"
    },
    "blocks": [
        {
            "type": "section",
            "text": {
                "type": "plain_text",
                "text": "作業を終了しますか？"
            }
        }
    ]
};

exports.START_MODAL = {
    "type": "modal",
    "callback_id": 'start',
    "submit": {
        "type": "plain_text",
        "text": "作業開始"
    },
    "close": {
        "type": "plain_text",
        "text": "キャンセル"
    },
    "title": {
        "type": "plain_text",
        "text": "Slackもくもく会"
    },
    "blocks": [
        {
            "type": "input",
            "block_id": 'block_goal',
            "element": {
                "type": "plain_text_input",
                "action_id": 'goal',
                "placeholder": {
                    "type": "plain_text",
                    "text": "例：技術書第3章まで読む, アップロード機能実装"
                }
            },
            "label": {
                "type": "plain_text",
                "text": "目標"
            }
        },
        {
            "type": "input",
            "block_id": 'block_estimated_end_time',
            "element": {
                "type": "timepicker",
                "action_id": 'estimated_end_time',
                "placeholder": {
                    "type": "plain_text",
                    "text": "hh:mmで入力"
                },
            },
            "label": {
                "type": "plain_text",
                "text": "終了予定時刻"
            }
        }
    ]
};

exports.ALERT_BUTTON_FIELD = {
    text: '作業を終了しますか？',
    fallback: '終了報告または延長に失敗しました。作業が既に終了しているかもしれません',
    callback_id: 'alert_button',
    color: '#3AA3E3',
    attachment_type: 'default',
    actions: [
        {
            name: 'work',
            text: '終了する',
            type: 'button',
            value: 'finish'
        },
        {
            name: 'work',
            text: '1時間延長する',
            type: 'button',
            value: 'extend-one-hour'
        },
        {
            name: 'work',
            text: '2時間延長する',
            type: 'button',
            value: 'extend-two-hour'
        },
        {
            name: 'work',
            text: '3時間延長する',
            type: 'button',
            value: 'extend-three-hour'
        },
    ]
};
