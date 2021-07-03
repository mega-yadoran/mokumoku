const dayjs = require('dayjs');
const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json');
admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});
const db = admin.firestore();
// const log = require('./log');

const formatEstimatedEndTime = (estimatedEndTime) => {
    const split = estimatedEndTime.split(':')
    const tmp = dayjs().hour(split[0]).minute(split[1]).second(0);
    const result = dayjs().diff(tmp) < 0
        ? tmp
        : tmp.add(1, 'd');
    return result.toDate();
}

exports.isWorking = async (userId) => {
    const snapshot = await this.getCurrentWorkSnapshot(userId);
    return !snapshot.empty;
};

exports.startWork = async (userId, goal, estimatedEndTime) => {
    await db.collection('works').add({
        user_id: userId,
        goal: goal,
        start_time: new Date(),
        estimated_end_time: formatEstimatedEndTime(estimatedEndTime),
        real_end_time: null,
        length_minutes: null,
        is_alerted: false
    }).catch((err) => {
        console.error(err);
        throw err;
    })
};

exports.endWork = async (userId) => {
    const snapshot = await this.getCurrentWorkSnapshot(userId);
    const doc = snapshot.docs[0];
    await this.recordEndTime(doc);
}

exports.recordEndTime = async (doc, endDate = new Date()) => {
    await doc.ref.update({ real_end_time: endDate });
    const startTime = dayjs(doc.data().start_time.toDate());
    const endTime = dayjs(endDate);
    const length = endTime.diff(startTime, 'minute');
    await doc.ref.update({ length_minutes: length });
}

exports.extendWorkTime = async (userId, minutes) => {
    const snapshot = await this.getCurrentWorkSnapshot(userId);
    const workRef = snapshot.docs[0].ref;
    const estimatedEndTime = snapshot.docs[0].data().estimated_end_time;
    const newEstimatedEndTime = dayjs(estimatedEndTime).add(minutes, 'minutes');
    await workRef.update({
        estimated_end_time: newEstimatedEndTime.toDate(),
        is_alerted: false
    });

    return newEstimatedEndTime.format('HH:mm');
}

exports.getCurrentWorkSnapshot = async (userId) => {
    return db.collection('works')
        .where('user_id', '==', userId)
        .where('real_end_time', '==', null)
        .limit(1)
        .get();
};

exports.getUnAlertedWorks = async (minutes) => {
    const snapshot = await db.collection('works')
        .where('real_end_time', '==', null)
        .where('is_alerted', '==', false)
        .where('estimated_end_time', '<', dayjs().subtract(minutes, 'minutes').toDate())
        .get();
    const result = [];

    snapshot.docs.map(async doc => {
        result.push(doc.data());

        // アラート発砲済として記録
        await doc.ref.update({ is_alerted: true });
    });
    return result;
}

exports.getAndFinishUnreportedWorks = async (minutes) => {
    const snapshot = await db.collection('works')
        .where('real_end_time', '==', null)
        .where('estimated_end_time', '<', dayjs().subtract(minutes, 'minutes').toDate())
        .get();
    const result = [];

    snapshot.docs.map(async doc => {
        result.push(doc.data());

        // 終了時刻＝開始時刻として記録
        const endTime = doc.data().start_time.toDate();
        await this.recordEndTime(doc, endTime);
    });
    return result;
}

exports.getSummary = async (userId) => {
    const snapshot = await db.collection("works")
        .where('user_id', '==', userId)
        .orderBy('start_time', 'desc')
        .get();
    const sumAmount = snapshot.docs
        .map(doc => doc.data().length_minutes)
        .reduce((prev, current) => prev + current, 0);

    const sum30Days = snapshot.docs
        .filter(doc => dayjs(doc.data().start_time.toDate()).isAfter(dayjs().subtract(30, 'day')))
        .map(doc => doc.data().length_minutes)
        .reduce((prev, current) => prev + current, 0);

    const docOfLongest30Days = snapshot.docs
        .filter(doc => dayjs(doc.data().start_time.toDate()).isAfter(dayjs().subtract(30, 'day')))
        .map(doc => doc.data())
        .reduce((prev, current) => prev.length_minutes > current.length_minutes ? prev : current);

    const today = dayjs().add(1, 'day').hour(0).minute(0).second(0);
    const workingDaysIndex = snapshot.docs
        .filter(doc => dayjs(doc.data().start_time.toDate()).isAfter(dayjs().subtract(50, 'day')))
        .map(doc => today.diff(dayjs(doc.data().start_time.toDate()), 'day'));

    return {
        sumAmount: sumAmount,
        sum30Days: sum30Days,
        dateOfLongest30Days: docOfLongest30Days.start_time.toDate(),
        longest30Days: docOfLongest30Days.length_minutes,
        workingDaysIndex: Array.from(new Set(workingDaysIndex)) // 重複を取り除く
    };
};

// work配列データをまとめて追加 (開発用)
exports.insertWorks = async (works) => {
    const batch = db.batch();
    works.forEach((doc) => {
        var docRef = db.collection("works").doc();
        batch.set(docRef, doc);
    });
    await batch.commit();
};