import Cashout from "./usecase/cashout";
import { MateraService, PrismaService, AxiosService, RabbitMQService } from './services';
import { Agenda } from "@hokify/agenda";

const database_URL = process.env.DATABASE_URL;
if (!database_URL) {
    throw new Error('database url not set');
}
const agenda = new Agenda({ db: { address: database_URL } });

agenda.define('run_at_cashout_time', async (job, done) => {
    const cashout = new Cashout(new MateraService(new AxiosService()), new PrismaService(), new RabbitMQService(process.env.QUEUE_NAME))
    await cashout.execute(job.attrs.data.accountId);
    done();
    await job.remove();
});

agenda.define('schedule_cashout', async (_, done) => {
    const prisma = new PrismaService()
    const accountIds = await prisma.getIds();
    accountIds.forEach(async (accountId) => {
        const account = await prisma.getAccount(accountId.id);
        account.cashoutTime.forEach(async (time) => {
            const [hour, minute] = time.split(':');
            const nextRun = new Date();
            nextRun.setHours(Number(hour), Number(minute), 0, 0);
            if (nextRun > new Date()) {
                const job = agenda.create('run_at_cashout_time', {
                    accountId: account.id,
                });
                job.unique({
                    'data.accountId': account.id,
                    nextRunAt: nextRun,
                });
                job.schedule(nextRun);
                await job.save();
            }
        });
    });
    done();
});

(async () => {
    await agenda.start();
    const job = agenda.create('schedule_cashout');
    job.unique({ name: 'schedule_cashout' });
    job.repeatEvery('24 hours');
    const now = new Date()
    now.setSeconds(new Date().getSeconds() + 15)
    console.log(now)
    job.schedule(now);
    await job.save();
})();
