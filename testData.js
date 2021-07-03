// テストデータを作成する用のロジック

const dayjs = require('dayjs');
const store = require('./store');
const userId = process.env.SLACK_MY_USER_ID;
const getRandomInt = (min, max) => {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min) + min);
};

const latest = dayjs().unix();
const oldest = dayjs().subtract(1, 'month').unix();

const getRandomDate = () => {
    randUnix = getRandomInt(latest, oldest);
    return dayjs.unix(randUnix);
}

const works = (() => {
    const works = [];
    for (let i = 0; i < 10; i++) {
        const date = getRandomDate();
        const lengthMinutes = getRandomInt(3, 300);

        works.push({
            user_id: userId,
            goal: `test${getRandomInt(0, 9999)}`,
            start_time: date.toDate(),
            estimated_end_time: date.add(60, 'minutes').toDate(),
            real_end_time: date.add(lengthMinutes, 'minutes').toDate(),
            length_minutes: lengthMinutes,
            is_alerted: false
        });
    }
    return works;
})();

store.insertWorks(works);