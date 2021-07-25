exports.END_MODAL = {
    "type": "modal",
    "callback_id": "end",
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
            "type": "header",
            "text": {
                "type": "plain_text",
                "text": "作業を終了しますか？"
            }
        },
        {
            "type": "divider"
        },
        {
            "type": "section",
            "text": {
                "type": "plain_text",
                "text": "または一時中断もできます"
            },
            "accessory": {
                "type": "button",
                "text": {
                    "type": "plain_text",
                    "text": "中断モーダルに切替"
                },
                "value": "switch_halt",
                "action_id": "switch_halt"
            }
        }
    ]
};
exports.HALT_MODAL = {
    "type": "modal",
    "callback_id": "halt",
    "submit": {
        "type": "plain_text",
        "text": "作業中断"
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
            "type": "header",
            "text": {
                "type": "plain_text",
                "text": "作業を中断しますか？"
            }
        },
        {
            "type": "section",
            "text": {
                "type": "mrkdwn",
                "text": "1. 中断している間は作業時間にカウントされません \n 2. 終了予定時間を過ぎた場合は中断したタイミングで作業を終了したことになります"
            }
        },
        {
            "type": "divider"
        },
        {
            "type": "section",
            "text": {
                "type": "plain_text",
                "text": "または今すぐ終了もできます"
            },
            "accessory": {
                "type": "button",
                "text": {
                    "type": "plain_text",
                    "text": "終了モーダルに切替",
                },
                "style": "danger",
                "value": "switch_end",
                "action_id": "switch_end"
            }
        }
    ]
};

exports.START_MODAL = {
    "type": "modal",
    "callback_id": "start",
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
            "block_id": "block_goal",
            "element": {
                "type": "plain_text_input",
                "action_id": "goal",
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
            "block_id": "block_estimated_end_time",
            "element": {
                "type": "timepicker",
                "action_id": "estimated_end_time",
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

exports.RESTART_MODAL = (goal, estimatedEndTime) => ({
    "type": "modal",
    "callback_id": "restart",
    "submit": {
        "type": "plain_text",
        "text": "作業再開"
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
            "type": "header",
            "text": {
                "type": "plain_text",
                "text": "作業を再開しますか？"
            }
        },
        {
            "type": "section",
            "text": {
                "type": "mrkdwn",
                "text": `目標: ${goal}\n作業終了予定: ${estimatedEndTime}`
            }
        },
        {
            "type": "divider"
        },
        {
            "type": "section",
            "text": {
                "type": "plain_text",
                "text": "または別の作業を開始することもできます"
            },
            "accessory": {
                "type": "button",
                "text": {
                    "type": "plain_text",
                    "text": "新しい作業を開始",
                },
                "value": "switch_start",
                "action_id": "switch_start"
            }
        }
    ]
});
exports.ALERT_BUTTON_FIELD = {
    "text": "作業を終了しますか？",
    "fallback": "終了報告または延長に失敗しました。作業が既に終了しているかもしれません",
    "callback_id": "alert_button",
    "color": "#3AA3E3",
    "attachment_type": "default",
    "actions": [
        {
            "name": "work",
            "text": "終了する",
            "type": "button",
            "value": "finish"
        },
        {
            "name": "work",
            "text": "1時間延長する",
            "type": "button",
            "value": "extend-one-hour"
        },
        {
            "name": "work",
            "text": "2時間延長する",
            "type": "button",
            "value": "extend-two-hour"
        },
        {
            "name": "work",
            "text": "3時間延長する",
            "type": "button",
            "value": "extend-three-hour"
        },
    ]
};
