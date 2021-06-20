const dayjs = require('dayjs');
const admin = require('firebase-admin');
admin.initializeApp();

const getCurrentTime = () => {
    return dayjs().format('YYYY-MM-DD HH:mm:ss');
}

const formatEstimatedEndTime = (estimatedEndTime, isTimestamp = false) => {
    const split = estimatedEndTime.split(':')
    const tmp = dayjs().hour(split[0]).minute(split[1]).second(0);
    const result = dayjs().diff(tmp) < 0
        ? tmp
        : tmp.add(1, 'd');
    return isTimestamp ? result.unix() : result.format('YYYY-MM-DD HH:mm:ss');
}

exports.isWorking = async (userId) => {
    const snapshot = await this.getCurrentWorkSnapshot(userId);
    return !snapshot.empty;
};

exports.startWork = async (userId, goal, estimatedEndTime) => {
    await admin.firestore().collection('works').add({
        user_id: userId,
        goal: goal,
        start_time: getCurrentTime(),
        estimated_end_time: formatEstimatedEndTime(estimatedEndTime),
        estimated_end_timestamp: formatEstimatedEndTime(estimatedEndTime, true),
        real_end_time: null
    }).catch((err) => {
        console.error(err);
        throw err;
    })
};

exports.endWork = async (userId) => {
    const snapshot = await this.getCurrentWorkSnapshot(userId);
    const workRef = snapshot.docs[0].ref;
    await workRef.update({ real_end_time: getCurrentTime() });
}

exports.extendWorkTime = async (userId, minutes) => {
    const snapshot = await this.getCurrentWorkSnapshot(userId);
    const workRef = snapshot.docs[0].ref;
    const estimatedEndTime = snapshot.docs[0].data().estimated_end_time;
    const newEstimatedEndTime = dayjs(estimatedEndTime, 'YYYY-MM-DD HH:mm:ss').add(minutes, 'minutes');
    await workRef.update({
        estimated_end_time: newEstimatedEndTime.format('YYYY-MM-DD HH:mm:ss'),
        estimated_end_timestamp: newEstimatedEndTime.unix()
    });
}

exports.getCurrentWorkSnapshot = async (userId) => {
    return admin.firestore().collection('works')
        .where('user_id', '==', userId)
        .where('real_end_time', '==', null)
        .limit(1)
        .get();
};

exports.getUnreportedWorks = async (minutes, finishFlag = false) => {
    const snapshot = await admin.firestore().collection('works')
        .where('real_end_time', '==', null)
        .where('estimated_end_timestamp', '<', dayjs().subtract(minutes, 'minutes').unix())
        .get();
    const result = [];

    snapshot.forEach(async doc => {
        result.push(doc.data());

        // 終了フラグがtrueの場合、終了時刻＝開始時刻として記録
        if (finishFlag) {
            await doc.ref.update({ real_end_time: doc.data().start_time });
        }
    });
    return result;
}