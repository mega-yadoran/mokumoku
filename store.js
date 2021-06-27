const dayjs = require('dayjs');
const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json');
admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});
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
    await admin.firestore().collection('works').add({
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
    return admin.firestore().collection('works')
        .where('user_id', '==', userId)
        .where('real_end_time', '==', null)
        .limit(1)
        .get();
};

exports.getUnAlertedWorks = async (minutes) => {
    const snapshot = await admin.firestore().collection('works')
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
    const snapshot = await admin.firestore().collection('works')
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