import agenda from "./agenda.service";

(async () => {
    await agenda.start();
    const job = agenda.create('schedule_cashout');
    job.unique({ name: 'schedule_cashout' });
    job.repeatEvery('24 hours');
    job.schedule('0 0 * * *');
    await job.save();
})();