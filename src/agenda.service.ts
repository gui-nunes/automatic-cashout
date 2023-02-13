import { Agenda } from '@hokify/agenda';
import Cashout from './usecase/cashout';
import { AxiosService, MateraService, PrismaService, RabbitMQService } from './services';


if (!process.env.DATABASE_URL || process.env.DATABASE_URL == undefined) {
    throw new Error('database url not set');
}
const agenda = new Agenda({ db: { address: process.env.DATABASE_URL } });

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

export default agenda