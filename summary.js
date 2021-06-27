const dayjs = require('dayjs');
const store = require('./store');

const formatMinuteToHour = (minutes) => {
    const hours = Math.floor(minutes / 60);
    const modMinutes = minutes % 60;
    return hours > 0 ? `${hours}時間 ${modMinutes}分` : `${minutes}分`;
};

exports.getSummaryBlocks = async (userId) => {
    const summary = await store.getSummary(userId);
    const sumAmount = formatMinuteToHour(summary.sumAmount);
    const sum30Days = formatMinuteToHour(summary.sum30Days);
    const dateOfLongest30Days = dayjs(summary.dateOfLongest30Days).format('YYYY/MM/DD');
    const longest30Days = formatMinuteToHour(summary.longest30Days);
    const rank = 'マサラタウン';

    const blocks = [
        {
            "type": "section",
            "text": {
                "type": "mrkdwn",
                "text": "* <@y_tanaka> さんの作業実績*\n\n_マサラは まっしろ はじまりのいろ_"
            }
        },
        {
            "type": "divider"
        },
        {
            "type": "section",
            "accessory": {
                "type": "image",
                "image_url": "https://pbs.twimg.com/profile_images/625633822235693056/lNGUneLX_400x400.jpg",
                "alt_text": "cute cat"
            },
            "fields": [
                {
                    "type": "mrkdwn",
                    "text": `*総作業時間:*\n${sumAmount}`
                },
                {
                    "type": "mrkdwn",
                    "text": `*ランク:*\n${rank}級`
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
                "text": " (直近7週間の作業) :arrow_right: :new: \n\n:large_green_square: :white_square: :large_green_square: :white_square: :white_square: :large_green_square: :large_green_square: Sun \n :large_green_square: :large_green_square: :large_green_square: :white_square: :large_green_square: :white_square: :white_square: Mon \n:white_square: :white_square: :large_green_square: :large_green_square: :large_green_square: :white_square: :white_square: Tue \n :large_green_square: :white_square: :large_green_square: :white_square: :white_square: :large_green_square: :large_green_square: Wed \n:large_green_square: :large_green_square: :large_green_square: :white_square: :large_green_square: :white_square: :white_square: Thu \n:white_square: :white_square: :large_green_square: :large_green_square: :large_green_square: :white_square: :white_square: Fri \n :large_green_square: :large_green_square: :large_green_square: :white_square: :large_green_square: :large_green_square: :white_square: Sat \n"
            }
        },
        {
            "type": "divider"
        }
    ];

    return blocks;
};