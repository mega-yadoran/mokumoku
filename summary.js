const dayjs = require('dayjs');
const store = require('./store');

const formatMinuteToHour = (minutes) => {
    const hours = Math.floor(minutes / 60);
    const modMinutes = minutes % 60;
    return hours > 0 ? `${hours}時間 ${modMinutes}分` : `${minutes}分`;
};

const judgeRank = (sumAmount, sum30Days) => {
    if (sumAmount == 0)
        return { label: 'マサラタウン', comment: 'マサラは まっしろ はじまりのいろ', image: '01.png' };
    if (sum30Days < 600)
        return { label: 'むしとりしょうねん', comment: 'さぎょう って たのしい！', image: '02.png' };
    if (sum30Days < 1800)
        return { label: 'エリートトレーナー', comment: 'トンネル ぬければ もくもくリーグ！', image: '03.png' };
    if (sumAmount < 18000 || sum30Days < 3600)
        return { label: 'ジムリーダー', comment: 'よくきたな ここは もくもくジム', image: '04.png' };
    if (sumAmount < 60000)
        return { label: 'チャンピオン', comment: 'けっきょく ぼくが いちばん つよくて すごいんだよね', image: '05.png' };
    return { label: 'アルセウス', comment: 'このよを つくりし かみ', image: '06.png' };
}

const generateActivityBlock = (workingDaysIndex) => {
    const emoji = { on: ':large_green_square: ', off: ':white_square: ', x: ':black_small_square: ' }
    const calendar = [];
    // 未来日をXとする
    for (i = 6; i > 0; i--) {
        if (dayjs().day() === i) break;
        calendar.unshift(emoji.x);
    }
    // 作業した日をon, していない日をoffとする
    for (j = 0; j < 43 + i; j++) {
        calendar.unshift(workingDaysIndex.includes(j) ? emoji.on : emoji.off);
    }
    // mrkdwn形式に変換
    const dayOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    let result = '';
    for (day = 0; day < 7; day++) {
        for (week = 0; week < 7; week++) {
            result += calendar[week * 7 + day];
        }
        result += dayOfWeek[day];
        result += '\n';
    }
    return result;
}

exports.getSummaryBlocks = async (userId) => {
    const summary = await store.getSummary(userId);

    const sumAmount = formatMinuteToHour(summary.sumAmount);
    const sum30Days = formatMinuteToHour(summary.sum30Days);
    const dateOfLongest30Days = summary.dateOfLongest30Days;
    const longest30Days = formatMinuteToHour(summary.longest30Days);
    const rank = judgeRank(summary.sumAmount, summary.sum30Days);
    const activity = generateActivityBlock(summary.workingDaysIndex);

    const blocks = [
        {
            "type": "section",
            "text": {
                "type": "mrkdwn",
                "text": `* <@y_tanaka> さんの作業実績*\n\n_${rank.comment}_`
            }
        },
        {
            "type": "divider"
        },
        {
            "type": "section",
            "accessory": {
                "type": "image",
                "image_url": `${process.env.RANK_IMAGE_BASE_PATH}/${rank.image}`,
                "alt_text": rank.label
            },
            "fields": [
                {
                    "type": "mrkdwn",
                    "text": `*総作業時間:*\n${sumAmount}`
                },
                {
                    "type": "mrkdwn",
                    "text": `*ランク:*\n${rank.label}`
                },
                {
                    "type": "mrkdwn",
                    "text": `*直近30日の総作業時間:*\n${sum30Days}`
                },
                {
                    "type": "mrkdwn",
                    "text": `*直近30日で最も作業をした日:*\n${dateOfLongest30Days} (${longest30Days})`
                }
            ]
        },
        {
            "type": "divider"
        },
        {
            "type": "section",
            "text": {
                "type": "mrkdwn",
                "text": ` (直近7週間の作業) :arrow_right: :new: \n\n${activity}`
            }
        },
        {
            "type": "divider"
        }
    ];

    return blocks;
};