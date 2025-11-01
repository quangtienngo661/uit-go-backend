// import { Injectable, OnModuleInit } from '@nestjs/common';
// import * as amqp from 'amqplib';

// const EXCHANGE = 'uitgo.events';

// @Injectable()
// export class RmqService implements OnModuleInit {
//   private channel: amqp.Channel;

//   async onModuleInit() {
//     const connection = await amqp.connect('amqp://guest:guest@localhost:5672');
//     this.channel = await connection.createChannel();

//     // Exchange chính
//     await this.channel.assertExchange('trip.exchange', 'direct', { durable: true });

//     // Exchange DLX
//     await this.channel.assertExchange('trip.dlx', 'direct', { durable: true });

//     // Queue delay (TTL = 10s, chuyển qua DLX)
//     await this.channel.assertQueue('trip.delay', {
//       durable: true,
//       arguments: {
//         'x-dead-letter-exchange': 'trip.exchange',
//         'x-dead-letter-routing-key': 'trip.start',
//         'x-message-ttl': 15000,
//       },
//     });

//     // Queue chính nhận message sau khi delay
//     await this.channel.assertQueue('trip.main.queue', { durable: true });

//     // Queue nhận message bị hỏng
//     await this.channel.assertQueue('trip.failed', { durable: true });

//     await this.channel.bindQueue('trip.delay', 'trip.exchange', 'trip.delay');
//     await this.channel.bindQueue('trip.main.queue', 'trip.exchange', 'trip.start');
//     await this.channel.bindQueue('trip.failed', 'trip.dlx', 'trip.failed');

//     console.log('✅ RabbitMQ Queues & Exchanges ready.');
//   }

//   async startTrip(data: any) {
//     console.log('🚗 Starting trip with data:', data);
//   }

//   async sendDelayedTrip(data: any) {
//     console.log('⏳ Sending delayed trip message (15s)...');
//     await this.channel.publish(
//       'trip.exchange',
//       'trip.delay',
//       Buffer.from(JSON.stringify(data)),
//     );
//   }
// }
