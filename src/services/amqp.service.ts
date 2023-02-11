import { AmqpDAO } from '../interfaces';
import { Channel, connect, ConsumeMessage } from 'amqplib';
import { randomUUID } from 'crypto'
export class RabbitMQService implements AmqpDAO {

    constructor(queue?: string) {
        this.init(queue)
    }

    async send<T, R>(message: T, routingKey: string): Promise<R> {
        const rndId = randomUUID();
        const JSONMessage = JSON.stringify(message);
        const ch = await this.init();

        ch.publish('bshop-payments', routingKey, Buffer.from(JSONMessage), {
            appId: 'ms-automatic-cashout-job',
            correlationId: rndId,
            replyTo: 'automatic-cashout',
        });

        const timeout = setTimeout(() => {
            throw new Error('Request to ' + routingKey + ' took too long');
        }, 1000);

        const response: R = await this.Consume<R>();

        clearTimeout(timeout);

        return response;
    }

    async Consume<R>(queue?: string): Promise<R> {
        const ch = await this.init();
        return new Promise((resolve, reject) => {
            ch.consume(queue || 'cron', (msg: ConsumeMessage | null) => {
                if (msg == null) {
                    reject(Error('Message is null'));
                } else {
                    if (msg.properties.headers['-x-error']) {
                        reject(
                            new Error(
                                `Service ${msg.properties.headers['-x-service']} throw a excpetion: ` +
                                JSON.stringify({
                                    error: msg.properties.headers['-x-error'],
                                    statusCode: msg.properties.headers['-x-status-code'],
                                }),
                            ),
                        );
                    }
                    const response = JSON.parse(msg.content.toString());
                    ch.ack(msg);
                    resolve(response);
                }
            });
        });

    }

    async init(queue?: string): Promise<Channel> {
        
        const conn = await connect(process.env.AMQP_URL!);
        const ch = await conn.createChannel();
        await ch.assertQueue(queue || 'automatic-cashout');
        await ch.bindQueue(
            queue || 'automatic-cashout',
            'ms',
            queue ? `${queue}.#` : 'automatic-cashout.#',
        );
        return ch
    }
}
